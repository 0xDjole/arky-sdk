import assert from "node:assert/strict";
import test from "node:test";

import { createStorefront } from "../dist/storefront.js";
import { apiUrl, emailLogin, idFactories, ids, recordFetch, signedInStorage, storefrontIdentity, visitorStorage } from "./helpers/arky-fixtures.mjs";

function client(storage) {
  return createStorefront(storefrontIdentity, { ...idFactories, apiUrl, locale: "bs", sessionStorage: storage });
}

function meAnswer(storefront, logins) {
  const session = storefront.session;
  return { customer: session.customer, session: { id: session.id, customer_id: session.customer.id, store_id: ids.store }, logins };
}

function withLanguage(login, language, updated_at) {
  return { ...login, type: { ...login.type, language }, updated_at };
}

test("a language change on the session's own login reaches the kept session at once, without another request", async (context) => {
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  assert.equal(before.login.type.language, "en");
  const changed = withLanguage(before.login, "bs", 3);
  const calls = recordFetch(context, () => meAnswer(storefront, [changed]));
  const heard = [];
  storefront.onAuthStateChanged((session) => heard.push(session?.login?.type.language));

  await storefront.customer.updateLogin({ login_id: before.login.id, expected_updated_at: 2, language: "bs" });
  await Promise.resolve();

  assert.deepEqual(calls.map((call) => [call.method, call.path]), [["PATCH", `/v1/storefront/customer/me/logins/${before.login.id}`]]);
  assert.deepEqual(storefront.session.login, changed);
  assert.equal(storefront.session.id, before.id);
  assert.deepEqual(client(storage).session.login, changed);
  assert.equal(heard.at(-1), "bs");
});

test("a me read, a new-login verification and an unsubscribe refresh the session's login from their answers", async (context) => {
  const storefront = client(signedInStorage());
  const before = structuredClone(storefront.session);
  const read = withLanguage(before.login, "hr", 4);
  const verified = withLanguage(before.login, "en", 5);
  const unsubscribed = { ...verified, type: { ...verified.type, unsubscribed: true }, updated_at: 6 };
  const added = emailLogin(ids.picked, "second@example.test");
  const answers = [meAnswer(storefront, [read]), meAnswer(storefront, [verified, added]), meAnswer(storefront, [unsubscribed, added])];
  const calls = recordFetch(context, (_call, count) => answers[count - 1]);

  await storefront.customer.getMe();
  assert.deepEqual(storefront.session.login, read);
  await storefront.customer.verifyNewLogin({ code: "123456" });
  assert.deepEqual(storefront.session.login, verified);
  await storefront.customer.unsubscribe({ login_id: before.login.id });
  assert.deepEqual(storefront.session.login, unsubscribed);

  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["GET", "/v1/storefront/customer/me"],
    ["POST", "/v1/storefront/customer/me/logins/verify"],
    ["POST", `/v1/storefront/customer/me/logins/${before.login.id}/unsubscribe`],
  ]);
});

test("a change to another login and an answer without the session's login keep the session's login", async (context) => {
  const storefront = client(signedInStorage());
  const before = structuredClone(storefront.session);
  const other = emailLogin(ids.picked, "second@example.test");
  const answers = [meAnswer(storefront, [before.login, withLanguage(other, "bs", 3)]), meAnswer(storefront, [])];
  recordFetch(context, (_call, count) => answers[count - 1]);

  await storefront.customer.updateLogin({ login_id: other.id, expected_updated_at: 2, language: "bs" });
  assert.deepEqual(storefront.session.login, before.login);
  await storefront.customer.getMe();
  assert.deepEqual(storefront.session.login, before.login);
});

test("a visitor's me read keeps the visitor session without a login", async (context) => {
  const visitor = client(visitorStorage());
  recordFetch(context, () => meAnswer(visitor, [emailLogin()]));
  await visitor.customer.getMe();
  assert.equal(visitor.session.type, "visitor");
  assert.equal(visitor.session.login, null);
});
