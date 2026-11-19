import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import {
  accessToken,
  apiUrl as baseUrl,
  confirmedEmail,
  customerRecord,
  idFactories,
  ids,
  storefrontIdentity,
  recordFetch,
  SessionStorage,
  sessionResult,
  signedInCustomer,
  signedInEmail,
  signedInStorage,
  storedSession,
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
  assert.equal(storefront.session.signed_in_with, null);
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

test("Admin contact commands add, change with PUT and remove a contact by its address, drop a link by its position and invite a contact", async (context) => {
  const address = { type: "phone", number: "+38761222333" };
  const invite = {
    id: ids.form,
    customer_id: customerId,
    sent_to: address,
    language: "bs",
    code: { failed_attempts: 0, outgoing_message_id: ids.submission, issued_at: 1, expires_at: 2 },
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
  };
  const calls = recordFetch(context, (call) => {
    if (call.method === "GET") return [invite];
    if (call.path.endsWith("/invites")) return invite;
    return customerRecord(customerId, { contacts: [{ type: "unconfirmed_phone", number: address.number, language: "bs", sms: { type: "off" } }] });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const base = `/v1/stores/${storeId}/customers/${customerId}`;
  const contact = { type: "phone", number: "+38761222333", language: "bs" };
  const added = await admin.customers.addContact({ store_id: storeId, customer_id: customerId, expected_updated_at: 4, contact, sms: "on" });
  assert.equal(added.contacts[0].type, "unconfirmed_phone");
  await admin.customers.addContact({ store_id: storeId, customer_id: customerId, expected_updated_at: 5, contact: { type: "email", email: "ana@example.test", language: "bs" } });
  await admin.customers.updateContact({ store_id: storeId, customer_id: customerId, expected_updated_at: 6, address, language: "en" });
  await admin.customers.removeContact({ store_id: storeId, customer_id: customerId, expected_updated_at: 7, address });
  await admin.customers.removeLink({ store_id: storeId, customer_id: customerId, position: 0, expected_updated_at: 8 });
  assert.deepEqual(await admin.customers.findInvites({ store_id: storeId, customer_id: customerId }), [invite]);
  assert.deepEqual(await admin.customers.inviteContact({ store_id: storeId, customer_id: customerId, id: ids.form, address }), invite);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", `${base}/contacts`, { expected_updated_at: 4, contact, sms: "on" }],
    ["POST", `${base}/contacts`, { expected_updated_at: 5, contact: { type: "email", email: "ana@example.test", language: "bs" }, sms: null }],
    ["PUT", `${base}/contacts`, { expected_updated_at: 6, address, language: "en" }],
    ["POST", `${base}/contacts/remove`, { expected_updated_at: 7, address }],
    ["DELETE", `${base}/links/0`, null],
    ["GET", `${base}/invites`, null],
    ["POST", `${base}/invites`, { id: ids.form, address }],
  ]);
  assert.equal(calls[4].url.search, "?expected_updated_at=8");
  for (const position of [-1, 1.5]) {
    assert.throws(() => admin.customers.removeLink({ store_id: storeId, customer_id: customerId, position, expected_updated_at: 8 }), {
      name: "TypeError",
      message: "A link's position is its index in the customer's links list",
    });
  }
  await assert.rejects(async () => admin.customers.inviteContact({ store_id: storeId, customer_id: customerId, id: "invite", address }), {
    name: "TypeError",
    message: "The customer invite id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 7);
  for (const removed of ["findLogins", "createLogin", "updateLogin", "deleteLogin", "inviteLogin"]) assert.equal(removed in admin.customers, false, removed);
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
  assert.equal(storefront.session.signed_in_with, null);
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
  assert.equal(storefront.session.signed_in_with, null);
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

test("an unconfigured contact notice surfaces the server refusal and retains the signed-in session", async (context) => {
  const calls = recordFetch(context, () => new Response(JSON.stringify({ status_code: 409, message: "This store can't send sign-in change notices yet", error: "CUSTOMER_SIGN_IN.UNAVAILABLE" }), { status: 409, headers: { "content-type": "application/json" } }));
  const storefront = client(signedInStorage());
  const before = structuredClone(storefront.session);
  const address = { type: "email", email: "added@example.test" };
  await assert.rejects(storefront.customer.verifyContact({ address, code: "123456" }), /sign-in change notices/);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", "/v1/storefront/customer/me/contacts/verify", { address, code: "123456" }],
  ]);
  assert.deepEqual(storefront.session, before);
});

test("a confirmed new email keeps current credentials and persists the returned customer", async (context) => {
  const address = { type: "email", email: "added@example.test" };
  const customer = signedInCustomer(customerId, signedInEmail, {
    name: { first_name: "Ana", last_name: "Kovač" },
    contacts: [confirmedEmail(), confirmedEmail("added@example.test")],
    updated_at: 1_700_000_000_002,
  });
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  assert.deepEqual(before.signed_in_with, { type: "email", email: signedInEmail });
  const retainedCredentials = JSON.parse(storage.initial).session;
  const calls = recordFetch(context, () => ({
    customer,
    session: { id: before.id, customer_id: before.customer.id, store_id: storeId },
  }));
  const result = await storefront.customer.verifyContact({ address, code: "123456" });
  assert.deepEqual(result.customer, customer);
  assert.equal("logins" in result, false);
  assert.deepEqual(calls[0].body, { address, code: "123456" });
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${accessToken}`);
  assert.equal(storefront.session.id, before.id);
  assert.deepEqual(storefront.session.customer, customer);
  assert.deepEqual(storefront.session.signed_in_with, before.signed_in_with, "the session keeps the address it signed in with");
  const after = JSON.parse([...storage.values.values()][0]);
  assert.deepEqual(after.session, retainedCredentials);
  assert.equal("login" in after, false);
  const reloaded = client(storage);
  assert.deepEqual(reloaded.session.customer, customer);
  assert.equal(reloaded.session.id, before.id);
});

test("a contact answer for another session cannot replace the current customer session", async (context) => {
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  const retained = storage.initial;
  recordFetch(context, () => ({
    customer: customerRecord(customerId, { name: { first_name: "Ana", last_name: "Kovač" } }),
    session: { id: ids.otherSession, customer_id: customerId, store_id: storeId },
  }));
  await assert.rejects(
    storefront.customer.verifyContact({ address: { type: "email", email: "added@example.test" }, code: "123456" }),
    /does not match the active customer session/,
  );
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
    const customer = signedInCustomer(customerId, signedInEmail, { profile });
    const response = { customer, session: { id: before.id, customer_id: customerId, store_id: storeId } };
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
    }));
    const result = await (method === "getMe" ? storefront.customer.getMe() : storefront.customer.updateMe({ profile, expected_updated_at: 2 }));
    assert.deepEqual(result.customer.profile, profile);
    assert.equal(result.session.id, ids.otherSession);
    assert.deepEqual(storefront.session, before);
    assert.equal(storage.values.size, 0);
  });
}

test("a signed-in customer changes the language of a contact by its address with the version they read", async (context) => {
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  const address = { type: "email", email: signedInEmail };
  const changed = { ...before.customer, contacts: [confirmedEmail(signedInEmail, "bs")], updated_at: 1_700_000_000_003 };
  const response = { customer: changed, session: { id: before.id, customer_id: customerId, store_id: storeId } };
  const calls = recordFetch(context, () => response);
  assert.deepEqual(await storefront.customer.updateContact({ expected_updated_at: 2, address, language: "bs" }), response);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["PATCH", "/v1/storefront/customer/me/contacts", { expected_updated_at: 2, address, language: "bs" }],
  ]);
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${accessToken}`);
  assert.deepEqual(storefront.session.customer.contacts, [confirmedEmail(signedInEmail, "bs")]);
  await storefront.customer.updateMe({ expected_updated_at: 3, profile });
  assert.equal("language" in calls[1].body, false, "a language lives on its contact, not on the profile");
});

test("a signed-in customer adds and removes contacts of their own, and removing the store link ends this browser's session", async (context) => {
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  const contact = { type: "phone", number: "+38761222333", language: "bs" };
  const address = { type: "phone", number: "+38761222333" };
  const answer = { customer: before.customer, session: { id: before.id, customer_id: customerId, store_id: storeId } };
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? { removed: true } : answer);
  await storefront.customer.addContact({ expected_updated_at: 3, contact, sms: "on" });
  await storefront.customer.addContact({ expected_updated_at: 4, contact: { type: "email", email: "second@example.test", language: "bs" } });
  await storefront.customer.removeContact({ expected_updated_at: 5, address });
  assert.equal(storefront.session.id, before.id);
  assert.deepEqual(await storefront.customer.removeLink(), { removed: true });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", "/v1/storefront/customer/me/contacts", { expected_updated_at: 3, contact, sms: "on" }],
    ["POST", "/v1/storefront/customer/me/contacts", { expected_updated_at: 4, contact: { type: "email", email: "second@example.test", language: "bs" }, sms: null }],
    ["POST", "/v1/storefront/customer/me/contacts/remove", { expected_updated_at: 5, address }],
    ["DELETE", "/v1/storefront/customer/me/link", null],
  ]);
  for (const call of calls) assert.equal(call.headers.get("authorization"), `Bearer ${accessToken}`);
  assert.equal(storefront.session, null, "removing the store link ends the session that removed it");
  assert.equal(storage.values.size, 0);
  for (const removed of ["addLogin", "updateLogin", "deleteLogin", "verifyNewLogin"]) assert.equal(removed in storefront.customer, false, removed);
});

test("a visitor has no store link to remove, so removeLink refuses before any request", async (context) => {
  const calls = recordFetch(context, () => ({ removed: true }));
  const storefront = client(new SessionStorage(storedSession()));
  await assert.rejects(storefront.customer.removeLink(), (error) => error.code === "no_session");
  assert.equal(calls.length, 0);
  assert.equal(storefront.session.type, "visitor");
});

test("a signed-in customer unsubscribes and resubscribes a contact by its address and keeps the session", async (context) => {
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  const address = { type: "email", email: signedInEmail };
  const answer = { customer: before.customer, session: { id: before.id, customer_id: customerId, store_id: storeId } };
  const calls = recordFetch(context, () => answer);
  assert.deepEqual(await storefront.customer.unsubscribe({ address }), answer);
  assert.deepEqual(await storefront.customer.resubscribe({ address }), answer);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", "/v1/storefront/customer/me/contacts/unsubscribe", { address }],
    ["POST", "/v1/storefront/customer/me/contacts/resubscribe", { address }],
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
