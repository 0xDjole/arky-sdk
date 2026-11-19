import assert from "node:assert/strict";
import test from "node:test";

import { createStorefront } from "../dist/storefront.js";
import { apiUrl, confirmedEmail, idFactories, ids, recordFetch, signedInEmail, signedInStorage, storefrontIdentity, visitorStorage } from "./helpers/arky-fixtures.mjs";

const signedInAddress = { type: "email", email: signedInEmail };

function client(storage) {
  return createStorefront(storefrontIdentity, { ...idFactories, apiUrl, locale: "bs", sessionStorage: storage });
}

function meAnswer(storefront, contacts, updated_at) {
  const session = storefront.session;
  return {
    customer: { ...session.customer, contacts, updated_at },
    session: { id: session.id, customer_id: session.customer.id, store_id: ids.store },
  };
}

test("a language change on the signed-in contact reaches the kept session's customer at once, without another request", async (context) => {
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  assert.deepEqual(before.customer.contacts, [confirmedEmail(signedInEmail, "en")]);
  assert.deepEqual(before.signed_in_with, signedInAddress);
  const changed = [confirmedEmail(signedInEmail, "bs")];
  const calls = recordFetch(context, () => meAnswer(storefront, changed, 1_700_000_000_003));
  const heard = [];
  storefront.onAuthStateChanged((session) => heard.push(session?.customer.contacts[0].language));

  await storefront.customer.updateContact({ expected_updated_at: 2, address: signedInAddress, language: "bs" });
  await Promise.resolve();

  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["PATCH", "/v1/storefront/customer/me/contacts", { expected_updated_at: 2, address: signedInAddress, language: "bs" }],
  ]);
  assert.deepEqual(storefront.session.customer.contacts, changed);
  assert.deepEqual(storefront.session.signed_in_with, signedInAddress);
  assert.equal(storefront.session.id, before.id);
  assert.deepEqual(client(storage).session.customer.contacts, changed);
  assert.equal(heard.at(-1), "bs");
});

test("a me read, a contact confirmation and an unsubscribe refresh the session's customer from their answers", async (context) => {
  const storefront = client(signedInStorage());
  const read = [confirmedEmail(signedInEmail, "hr")];
  const confirmed = [confirmedEmail(signedInEmail, "hr"), confirmedEmail("second@example.test")];
  const answers = [
    meAnswer(storefront, read, 1_700_000_000_004),
    meAnswer(storefront, confirmed, 1_700_000_000_005),
    meAnswer(storefront, confirmed, 1_700_000_000_006),
  ];
  const calls = recordFetch(context, (_call, count) => answers[count - 1]);

  await storefront.customer.getMe();
  assert.deepEqual(storefront.session.customer, answers[0].customer);
  await storefront.customer.verifyContact({ address: { type: "email", email: "second@example.test" }, code: "123456" });
  assert.deepEqual(storefront.session.customer, answers[1].customer);
  await storefront.customer.unsubscribe({ address: signedInAddress });
  assert.deepEqual(storefront.session.customer, answers[2].customer);
  assert.deepEqual(storefront.session.signed_in_with, signedInAddress);

  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["GET", "/v1/storefront/customer/me", null],
    ["POST", "/v1/storefront/customer/me/contacts/verify", { address: { type: "email", email: "second@example.test" }, code: "123456" }],
    ["POST", "/v1/storefront/customer/me/contacts/unsubscribe", { address: signedInAddress }],
  ]);
});

test("the session's sign-in address comes from the session, so changing another contact or dropping the signed-in one keeps it", async (context) => {
  const storefront = client(signedInStorage());
  const other = { type: "email", email: "second@example.test" };
  const answers = [
    meAnswer(storefront, [confirmedEmail(), confirmedEmail("second@example.test", "bs")], 1_700_000_000_003),
    meAnswer(storefront, [], 1_700_000_000_004),
  ];
  recordFetch(context, (_call, count) => answers[count - 1]);

  await storefront.customer.updateContact({ expected_updated_at: 2, address: other, language: "bs" });
  assert.deepEqual(storefront.session.signed_in_with, signedInAddress);
  await storefront.customer.getMe();
  assert.deepEqual(storefront.session.customer.contacts, []);
  assert.deepEqual(storefront.session.signed_in_with, signedInAddress);
});

test("a visitor's me read keeps the visitor session with no sign-in address", async (context) => {
  const visitor = client(visitorStorage());
  recordFetch(context, () => meAnswer(visitor, [{ type: "unconfirmed_email", email: "reader@example.test", language: "en" }], 1_700_000_000_002));
  await visitor.customer.getMe();
  assert.equal(visitor.session.type, "visitor");
  assert.equal(visitor.session.signed_in_with, null);
  assert.deepEqual(visitor.session.customer.contacts, [{ type: "unconfirmed_email", email: "reader@example.test", language: "en" }]);
});
