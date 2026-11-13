import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import {
  accessToken,
  apiUrl as baseUrl,
  customerRecord,
  emailSession,
  idFactories,
  ids,
  storefrontIdentity,
  recordFetch,
  SessionStorage,
  sessionResult,
  signedInStorage,
  visitorSession,
  visitorToken,
} from "./helpers/arky-fixtures.mjs";

const storeId = ids.store;
const customerId = ids.customer;

const identity = { customer_id: customerId, session_id: ids.session };
const profile = [{ id: ids.line, key: "name", type: "text", value: "Ana" }];

function client(storage = new SessionStorage()) {
  return createStorefront(storefrontIdentity, { ...idFactories, apiUrl: baseUrl, locale: "bs", visitorIdentity: identity, sessionStorage: storage });
}

test("same caller-picked visitor identities share a request without sending contact fields", async (context) => {
  const calls = recordFetch(context, () => sessionResult());
  const storefront = client();
  await Promise.all([storefront.customer.identify(identity), storefront.customer.identify(identity)]);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].body, identity);
  assert.equal(storefront.session.login, null);
  assert.equal("captureEmail" in storefront.customer, false);
});

test("Admin Customer commands send profile blocks, address changes and explicit staff merge versions", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "GET" && call.path.endsWith("/customers") ? { items: [], cursor: null } : customerRecord());
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  await admin.customers.create({ store_id: storeId, id: customerId, profile, blocks: [] });
  await admin.customers.find({ store_id: storeId, verified: true, has_cart: true });
  await admin.customers.update({ store_id: storeId, id: customerId, expected_updated_at: 2, profile, blocks: [], addresses: [{ id: ids.line, country: "BA", city: "Sarajevo" }], default_shipping_address_id: ids.line });
  await admin.customers.erase({ store_id: storeId, id: customerId, expected_updated_at: 3 });
  await admin.customers.merge({ store_id: storeId, id: customerId, target_customer_id: ids.otherCustomer, expected_updated_at: 4 });
  const rows = [{ customer_id: customerId, profile, blocks: [] }];
  await admin.customers.previewImport({ store_id: storeId, rows });
  await admin.customers.import({ store_id: storeId, rows });
  await admin.customers.findSessions({ store_id: storeId, customer_id: customerId });
  await admin.customers.revokeSession({ store_id: storeId, customer_id: customerId, session_id: ids.session });
  await admin.customers.revokeAllSessions({ store_id: storeId, customer_id: customerId });
  assert.deepEqual(calls[0].body, { id: customerId, profile, blocks: [] });
  assert.equal(calls[1].url.search, "?verified=true&has_cart=true");
  assert.deepEqual(calls[4].body, { target_customer_id: ids.otherCustomer, expected_updated_at: 4 });
  assert.deepEqual(calls[5].body, { rows });
  assert.equal(calls[6].path, `/v1/stores/${storeId}/customers/import`);
  for (const retired of ["archive", "resolveOrReserveEmail", "sendSignInCode"]) assert.equal(retired in admin.customers, false);
  await assert.rejects(async () => admin.customers.create({ store_id: storeId, id: "customer", profile, blocks: [] }), TypeError);
});

test("Admin login commands list, add, change with PUT, invite and delete a customer's logins", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "GET" ? [] : { success: true });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const base = `/v1/stores/${storeId}/customers/${customerId}/logins`;
  const contact = { type: "phone", number: "+38761222333", language: "bs" };
  await admin.customers.findLogins({ store_id: storeId, customer_id: customerId });
  await admin.customers.createLogin({ store_id: storeId, customer_id: customerId, id: ids.line, contact, sms: "on" });
  await admin.customers.updateLogin({ store_id: storeId, customer_id: customerId, id: ids.line, expected_updated_at: 5, language: "en" });
  await admin.customers.inviteLogin({ store_id: storeId, customer_id: customerId, login_id: ids.line, id: ids.form });
  await admin.customers.deleteLogin({ store_id: storeId, customer_id: customerId, id: ids.line, expected_updated_at: 6 });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["GET", base, null],
    ["POST", base, { id: ids.line, contact, sms: "on" }],
    ["PUT", `${base}/${ids.line}`, { expected_updated_at: 5, language: "en" }],
    ["POST", `${base}/${ids.line}/invite`, { id: ids.form }],
    ["DELETE", `${base}/${ids.line}`, null],
  ]);
  assert.equal(calls[4].url.search, "?expected_updated_at=6");
  await assert.rejects(
    async () => admin.customers.inviteLogin({ store_id: storeId, customer_id: customerId, login_id: ids.line, id: "invite" }),
    TypeError,
  );
});

test("code requests retain caller ID, language and bot proof without claiming an address", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("/identify") ? sessionResult() : { customer: customerRecord(), session: { id: ids.session, customer_id: customerId }, code: { issued_at: 1, expires_at: 2 } });
  const storefront = client();
  await storefront.customer.requestCode({ id: ids.form, contact: { type: "email", email: "reader@example.test", language: "en" } });
  await storefront.customer.requestCode({ id: ids.line, contact: { type: "phone", number: "+38761222333", language: "bs" } });
  assert.deepEqual(calls[0].body, identity);
  assert.deepEqual(calls[1].body, { id: ids.form, contact: { type: "email", email: "reader@example.test", language: "en" } });
  assert.deepEqual(calls[2].body, { id: ids.line, contact: { type: "phone", number: "+38761222333", language: "bs" } });
  assert.equal(calls[1].headers.get("x-arky-locale"), "bs");
  assert.equal(storefront.session.login, null);
  await assert.rejects(storefront.customer.requestCode({ id: "bad", contact: { type: "email", email: "reader@example.test", language: "en" } }), TypeError);
});

test("retrying a lost code response keeps the same exact request and active Visitor identity", async (context) => {
  let sends = 0;
  const result = { customer: customerRecord(), session: { id: ids.session, customer_id: customerId }, code: { issued_at: 1, expires_at: 2 } };
  const calls = recordFetch(context, (call) => {
    if (call.path.endsWith("/identify")) return sessionResult();
    if (++sends === 1) throw new TypeError("Code response was lost");
    return result;
  });
  const storage = new SessionStorage();
  const storefront = client(storage);
  await storefront.customer.identify(identity);
  const retained = [...storage.values];
  const request = { id: ids.form, contact: { type: "email", email: "reader@example.test", language: "en" } };

  await assert.rejects(storefront.customer.requestCode(request), /Code response was lost/);
  assert.deepEqual([...storage.values], retained);
  assert.deepEqual(await storefront.customer.requestCode(request), result);
  const codeCalls = calls.filter((call) => call.path === "/v1/storefront/customer/request-code");
  assert.deepEqual(codeCalls.map((call) => [call.method, call.body, call.headers.get("authorization"), call.headers.get("x-arky-locale")]), [
    ["POST", { id: ids.form, contact: { type: "email", email: "reader@example.test", language: "en" } }, `Bearer ${visitorToken}`, "bs"],
    ["POST", { id: ids.form, contact: { type: "email", email: "reader@example.test", language: "en" } }, `Bearer ${visitorToken}`, "bs"],
  ]);
  assert.equal(storefront.session.id, ids.session);
  assert.equal(storefront.session.login, null);
});

test("a code answer for another session is refused without changing stored identity", async (context) => {
  recordFetch(context, (call) => call.path.endsWith("/identify") ? sessionResult() : { customer: customerRecord(), session: { id: ids.otherSession, customer_id: customerId }, code: { issued_at: 1, expires_at: 2 } });
  const storage = new SessionStorage();
  const storefront = client(storage);
  await storefront.customer.identify(identity);
  const retained = [...storage.values];
  await assert.rejects(storefront.customer.requestCode({ id: ids.form, contact: { type: "email", email: "reader@example.test", language: "en" } }), /does not match/);
  assert.deepEqual([...storage.values], retained);
});

test("an unconfigured email-change notice surfaces the server refusal and retains the signed-in session", async (context) => {
  const calls = recordFetch(context, () => new Response(JSON.stringify({ status_code: 409, message: "This store can't send sign-in change notices yet", error: "CUSTOMER_SIGN_IN.UNAVAILABLE" }), { status: 409, headers: { "content-type": "application/json" } }));
  const storefront = client(signedInStorage());
  const before = storefront.session.id;
  await assert.rejects(storefront.customer.verifyNewLogin({ code: "123456" }), /sign-in change notices/);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", "/v1/storefront/customer/me/logins/verify", { code: "123456" }],
  ]);
  assert.equal(storefront.session.id, before);
});


test("a proven new email keeps current credentials and persists the returned customer", async (context) => {
  const customer = customerRecord(customerId, { name: { first_name: "Ana", last_name: "Kovač" } });
  const added = {
    id: ids.line,
    type: { type: "verified_email", email: "added@example.test", language: "en", unsubscribed: false },
    created_at: 2,
    updated_at: 2,
  };
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  const retainedCredentials = JSON.parse(storage.initial).session;
  const calls = recordFetch(context, () => ({
    customer,
    session: { id: before.id, customer_id: before.customer.id, store_id: storeId },
    logins: [before.login, added],
  }));
  const result = await storefront.customer.verifyNewLogin({ code: "123456" });
  assert.deepEqual(result.customer, customer);
  assert.deepEqual(result.logins.map((login) => login.id), [before.login.id, added.id]);
  assert.deepEqual(calls[0].body, { code: "123456" });
  assert.equal(storefront.session.id, before.id);
  assert.deepEqual(storefront.session.customer, customer);
  assert.deepEqual(storefront.session.login, before.login, "the session keeps the login it signed in with");
  const after = JSON.parse([...storage.values.values()][0]);
  assert.deepEqual(after.session, retainedCredentials);
  const reloaded = client(storage);
  assert.deepEqual(reloaded.session.customer, customer);
  assert.equal(reloaded.session.id, before.id);
});

test("a new-login answer cannot replace a different current customer session", async (context) => {
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  const retained = storage.initial;
  recordFetch(context, () => ({
    customer: customerRecord(customerId, { name: { first_name: "Ana", last_name: "Kovač" } }),
    session: { id: ids.otherSession, customer_id: customerId, store_id: storeId },
    logins: [],
  }));
  await assert.rejects(storefront.customer.verifyNewLogin({ code: "123456" }), /does not match the active customer session/);
  assert.deepEqual(storefront.session, before);
  assert.equal(storage.initial, retained);
  assert.equal(storage.values.size, 0);
});

for (const method of ["getMe", "updateMe"]) {
  test(`${method} retains credentials and reloads the current returned profile`, async (context) => {
    const storage = signedInStorage();
    const storefront = client(storage);
    const before = structuredClone(storefront.session);
    const credentials = JSON.parse(storage.initial).session;
    const customer = customerRecord(customerId, { profile });
    const response = { customer, session: { id: before.id, customer_id: customerId, store_id: storeId }, logins: [before.login] };
    const calls = recordFetch(context, () => response);
    const result = method === "getMe"
      ? await storefront.customer.getMe()
      : await storefront.customer.updateMe({ profile, expected_updated_at: 2 });
    assert.deepEqual(result, response);
    assert.equal(calls[0].method, method === "getMe" ? "GET" : "PATCH");
    assert.deepEqual(storefront.session.customer.profile, profile);
    assert.deepEqual(JSON.parse([...storage.values.values()][0]).session, credentials);
    const reloaded = client(storage);
    assert.equal(reloaded.session.id, before.id);
    assert.deepEqual(reloaded.session.customer.profile, profile);
  });

  test(`${method} returns a late response without replacing current cached identity`, async (context) => {
    const storage = signedInStorage();
    const storefront = client(storage);
    const before = structuredClone(storefront.session);
    recordFetch(context, () => ({
      customer: customerRecord(customerId, { profile }),
      session: { id: ids.otherSession, customer_id: customerId, store_id: storeId },
      logins: [],
    }));
    const result = await (method === "getMe" ? storefront.customer.getMe() : storefront.customer.updateMe({ profile, expected_updated_at: 2 }));
    assert.deepEqual(result.customer.profile, profile);
    assert.equal(result.session.id, ids.otherSession);
    assert.deepEqual(storefront.session, before);
    assert.equal(storage.values.size, 0);
  });
}

test("a signed-in customer changes the language of a login with the version they read", async (context) => {
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  const changed = { ...before.login, type: { ...before.login.type, language: "bs" }, updated_at: 3 };
  const response = { customer: before.customer, session: { id: before.id, customer_id: customerId, store_id: storeId }, logins: [changed] };
  const calls = recordFetch(context, () => response);
  assert.deepEqual(
    await storefront.customer.updateLogin({ login_id: before.login.id, expected_updated_at: 2, language: "bs" }),
    response,
  );
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["PATCH", `/v1/storefront/customer/me/logins/${before.login.id}`, { expected_updated_at: 2, language: "bs" }],
  ]);
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${accessToken}`);
  await storefront.customer.updateMe({ expected_updated_at: 3, profile });
  assert.equal("language" in calls[1].body, false, "a language lives on its login, not on the profile");
});

test("a signed-in customer adds and deletes logins of their own and a deleted sign-in login ends the session", async (context) => {
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  const contact = { type: "phone", number: "+38761222333", language: "bs" };
  const calls = recordFetch(context, (call) => {
    if (call.method === "POST") return { customer: before.customer, session: { id: before.id, customer_id: customerId, store_id: storeId }, logins: [before.login] };
    if (call.path.endsWith(ids.line)) return { customer: before.customer, session: { id: before.id, customer_id: customerId, store_id: storeId }, logins: [before.login] };
    return new Response(null, { status: 204 });
  });
  await storefront.customer.addLogin({ id: ids.line, contact, sms: "on" });
  await storefront.customer.deleteLogin({ login_id: ids.line, expected_updated_at: 4 });
  assert.equal(storefront.session.id, before.id);
  assert.equal(await storefront.customer.deleteLogin({ login_id: before.login.id, expected_updated_at: 5 }), null);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", "/v1/storefront/customer/me/logins", { id: ids.line, contact, sms: "on" }],
    ["DELETE", `/v1/storefront/customer/me/logins/${ids.line}`, null],
    ["DELETE", `/v1/storefront/customer/me/logins/${before.login.id}`, null],
  ]);
  assert.equal(calls[1].url.search, "?expected_updated_at=4");
  assert.equal(storefront.session, null, "deleting the login a session signed in with ends that session");
});

test("a signed-in customer unsubscribes and resubscribes on the storefront with no body and keeps the session", async (context) => {
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  const answers = [true, false].map((unsubscribed) => ({
    customer: before.customer,
    session: { id: before.id, customer_id: customerId, store_id: storeId },
    logins: [{ ...before.login, type: { ...before.login.type, unsubscribed } }],
  }));
  const calls = recordFetch(context, (_call, count) => answers[count - 1]);
  assert.deepEqual(await storefront.customer.unsubscribe({ login_id: before.login.id }), answers[0]);
  assert.deepEqual(await storefront.customer.resubscribe({ login_id: before.login.id }), answers[1]);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", `/v1/storefront/customer/me/logins/${before.login.id}/unsubscribe`, null],
    ["POST", `/v1/storefront/customer/me/logins/${before.login.id}/resubscribe`, null],
  ]);
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), `Bearer ${accessToken}`);
    assert.equal(call.headers.get("x-arky-store-id"), storefrontIdentity.storeId);
    assert.equal(call.headers.get("x-arky-sales-channel-id"), storefrontIdentity.salesChannelId);
  }
  assert.deepEqual(storefront.session, before);
  const store = initialize(storefrontIdentity, { ...idFactories, apiUrl: baseUrl, locale: "bs", visitorIdentity: identity, sessionStorage: signedInStorage() });
  assert.equal(typeof store.customer.unsubscribe, "function");
});
