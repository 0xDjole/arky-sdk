import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import {
  accessToken,
  apiUrl as baseUrl,
  customerRecord,
  emailSession,
  ids,
  publishableKey,
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
  return createStorefront(publishableKey, { apiUrl: baseUrl, locale: "bs", visitorIdentity: identity, createSessionId: () => ids.otherSession, sessionStorage: storage });
}

test("same caller-picked visitor identities share a request without sending contact fields", async (context) => {
  const calls = recordFetch(context, () => sessionResult());
  const storefront = client();
  await Promise.all([storefront.customer.identify(identity), storefront.customer.identify(identity)]);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].body, identity);
  assert.equal(storefront.session.customer.type.type, "anonymous");
  assert.equal("captureEmail" in storefront.customer, false);
});

test("Admin Customer commands send profile blocks, address changes and explicit staff merge versions", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "GET" && call.path.endsWith("/customers") ? { items: [], cursor: null } : customerRecord());
  const admin = createAdmin({ baseUrl, secretKey: "arky_secret" });
  await admin.customers.create({ store_id: storeId, id: customerId, profile, blocks: [] });
  await admin.customers.find({ store_id: storeId, type: "verified", has_cart: true });
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
  assert.equal(calls[1].url.search, "?type=verified&has_cart=true");
  assert.deepEqual(calls[4].body, { target_customer_id: ids.otherCustomer, expected_updated_at: 4 });
  assert.deepEqual(calls[5].body, { rows });
  assert.equal(calls[6].path, `/v1/stores/${storeId}/customers/import`);
  for (const retired of ["archive", "resolveOrReserveEmail"]) assert.equal(retired in admin.customers, false);
  await assert.rejects(async () => admin.customers.create({ store_id: storeId, id: "customer", profile, blocks: [] }), TypeError);
});

test("code requests retain caller ID, language and bot proof without claiming an address", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("/identify") ? sessionResult() : { customer: customerRecord(), session: { id: ids.session, customer_id: customerId }, email_verification: { issued_at: 1, expires_at: 2 } });
  const storefront = client();
  await storefront.customer.requestCode({ id: ids.form, email: "reader@example.test", language: "en", bot_check_token: "fixture-proof" });
  assert.deepEqual(calls[0].body, identity);
  assert.deepEqual(calls[1].body, { id: ids.form, email: "reader@example.test", language: "en", bot_check_token: "fixture-proof" });
  assert.equal(calls[1].headers.get("x-arky-locale"), "bs");
  assert.equal(storefront.session.customer.type.type, "anonymous");
  await assert.rejects(storefront.customer.requestCode({ id: "bad", email: "reader@example.test", language: "en" }), TypeError);
});

test("retrying a lost code response keeps the same exact request and active Visitor identity", async (context) => {
  let sends = 0;
  const result = { customer: customerRecord(), session: { id: ids.session, customer_id: customerId }, email_verification: { issued_at: 1, expires_at: 2 } };
  const calls = recordFetch(context, (call) => {
    if (call.path.endsWith("/identify")) return sessionResult();
    if (++sends === 1) throw new TypeError("Code response was lost");
    return result;
  });
  const storage = new SessionStorage();
  const storefront = client(storage);
  await storefront.customer.identify(identity);
  const retained = [...storage.values];
  const request = { id: ids.form, email: "reader@example.test", language: "en" };

  await assert.rejects(storefront.customer.requestCode(request), /Code response was lost/);
  assert.deepEqual([...storage.values], retained);
  assert.deepEqual(await storefront.customer.requestCode(request), result);
  const codeCalls = calls.filter((call) => call.path === "/v1/storefront/customer/request-code");
  assert.deepEqual(codeCalls.map((call) => [call.method, call.body, call.headers.get("authorization"), call.headers.get("x-arky-locale")]), [
    ["POST", { id: ids.form, email: "reader@example.test", language: "en" }, `Bearer ${visitorToken}`, "bs"],
    ["POST", { id: ids.form, email: "reader@example.test", language: "en" }, `Bearer ${visitorToken}`, "bs"],
  ]);
  assert.equal(storefront.session.id, ids.session);
  assert.equal(storefront.session.customer.type.type, "anonymous");
});

test("a code answer for another session is refused without changing stored identity", async (context) => {
  recordFetch(context, (call) => call.path.endsWith("/identify") ? sessionResult() : { customer: customerRecord(), session: { id: ids.otherSession, customer_id: customerId }, email_verification: { issued_at: 1, expires_at: 2 } });
  const storage = new SessionStorage();
  const storefront = client(storage);
  await storefront.customer.identify(identity);
  const retained = [...storage.values];
  await assert.rejects(storefront.customer.requestCode({ id: ids.form, email: "reader@example.test", language: "en" }), /does not match/);
  assert.deepEqual([...storage.values], retained);
});

test("unconfigured email-change notices surface the server refusal and retain the signed-in session", async (context) => {
  const calls = recordFetch(context, () => new Response(JSON.stringify({ status_code: 503, message: "Email-change notice is not configured", error: "GENERAL.SERVICE_UNAVAILABLE" }), { status: 503, headers: { "content-type": "application/json" } }));
  const storefront = client(signedInStorage());
  const before = storefront.session.id;
  await assert.rejects(storefront.customer.changeEmail({ code: "123456" }), /Email-change notice is not configured/);
  assert.deepEqual(calls[0].body, { code: "123456" });
  assert.equal(storefront.session.id, before);
});


test("successful email change keeps current credentials and persists the returned identity", async (context) => {
  const customer = customerRecord(customerId, {
    type: { type: "verified", email: "changed@example.test", addresses: [], default_shipping_address_id: null, default_billing_address_id: null },
  });
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  const retainedCredentials = JSON.parse(storage.initial).session;
  const calls = recordFetch(context, () => ({ customer, session: { id: before.id, customer_id: before.customer.id } }));
  const result = await storefront.customer.changeEmail({ code: "123456" });
  assert.deepEqual(result.customer, customer);
  assert.deepEqual(calls[0].body, { code: "123456" });
  assert.equal(storefront.session.id, before.id);
  assert.equal(storefront.session.customer.id, before.customer.id);
  assert.equal(storefront.session.customer.type.email, customer.type.email);
  const after = JSON.parse([...storage.values.values()][0]);
  assert.deepEqual(after.session, retainedCredentials);
  const reloaded = client(storage);
  assert.equal(reloaded.session.customer.type.email, customer.type.email);
  assert.equal(reloaded.session.id, before.id);
});

test("email-change response cannot replace a different current customer session", async (context) => {
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  const retained = storage.initial;
  recordFetch(context, () => ({
    customer: customerRecord(customerId, { type: { type: "verified", email: "changed@example.test", addresses: [], default_shipping_address_id: null, default_billing_address_id: null } }),
    session: { id: ids.otherSession, customer_id: customerId },
  }));
  await assert.rejects(storefront.customer.changeEmail({ code: "123456" }), /does not match the active customer session/);
  assert.deepEqual(storefront.session, before);
  assert.equal(storage.initial, retained);
  assert.equal(storage.values.size, 0);
});
