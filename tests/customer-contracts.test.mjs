import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import { apiUrl as baseUrl, customerRecord, ids, publishableKey, recordFetch, SessionStorage, sessionResult, visitorSession, visitorToken } from "./helpers/arky-fixtures.mjs";

const storeId = ids.store;
const customerId = ids.customer;

test("a visitor may name a contact email when identifying, and bare identify calls share one visitor session", async (context) => {
  const calls = recordFetch(context, (call) => {
    assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
    assert.equal(call.path, "/v1/storefront/customer/identify");
    return sessionResult(customerId, visitorSession(customerId));
  });
  const storage = new SessionStorage();
  const client = createStorefront(publishableKey, { apiUrl: baseUrl, sessionStorage: storage });
  await Promise.all([client.customer.identify(), client.customer.identify()]);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].body, {});
  assert.equal(calls[0].headers.get("authorization"), null);
  await client.customer.identify({ email: "reader@example.test" });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1].body, { email: "reader@example.test" });
  assert.equal(calls[1].headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.equal(client.isAuthenticated, false);
  assert.equal(client.session.type, "visitor");
  for (const removed of ["captureEmail", "identities", "emailIdentities"]) assert.equal(removed in client.customer, false, removed);
  const store = initialize(publishableKey, { apiUrl: baseUrl, sessionStorage: storage });
  assert.equal("captureEmail" in store.customer, false);
});

test("Admin Customer namespace sends app-picked ids, typed emails and versions on canonical routes", async (context) => {
  const customer = customerRecord(customerId, { email: { type: "contact", email: "person@example.com" }, first_name: "Ana", last_name: "Kovač", language: "bs" });
  const calls = recordFetch(context, (call) => {
    if (call.path.endsWith("/sessions")) {
      return {
        items: [
          { id: ids.session, store_id: storeId, customer_id: customerId, type: { type: "visitor", expires_at: 100, email_verification: null }, status: { type: "active" }, last_seen_at: 2, created_at: 1, updated_at: 2 },
          { id: ids.otherSession, store_id: storeId, customer_id: customerId, type: { type: "email_authenticated", access_expires_at: 100, refresh_expires_at: 200, authenticated_at: 3 }, status: { type: "superseded" }, last_seen_at: 3, created_at: 2, updated_at: 4 },
        ],
        cursor: null,
      };
    }
    if (call.path.endsWith("/import/preview")) return { rows_total: 1, rows_valid: 1, rows_invalid: 0, rows: [{ row: 1, email: "person@example.com", customer_id: customerId, valid: true, errors: [] }] };
    if (call.path.endsWith("/import")) return { rows_total: 0, customers_created: 0, customers_updated: 0, rows_failed: 0, rows: [] };
    if (call.path.endsWith("/revoke")) return { success: true };
    if (call.method === "GET" && call.path.endsWith("/customers")) return { items: [{ customer, has_cart: false, has_customer_action: true }], cursor: null };
    return customer;
  });
  const admin = createAdmin({ baseUrl, apiToken: "arky_api_customers" });
  const create = {
    id: customerId,
    email: { type: "contact", email: "person@example.com" },
    first_name: "Ana",
    last_name: "Kovač",
    phone: "+38761000000",
    language: "bs",
    categories: [],
  };
  const created = await admin.customers.create({ store_id: storeId, ...create });
  assert.deepEqual(created.email, { type: "contact", email: "person@example.com" });
  assert.equal("identities" in created, false);
  assert.equal("primary_email_identity_id" in created, false);
  const page = await admin.customers.find({ store_id: storeId, status: "active", email_type: "verified" });
  assert.equal(page.items[0].customer.id, customerId);
  await admin.customers.get({ store_id: storeId, id: customerId });
  await admin.customers.update({ store_id: storeId, id: customerId, expected_updated_at: 2, email: { type: "reserved", email: "new@example.com" }, phone: null });
  await admin.customers.update({ store_id: storeId, id: customerId, expected_updated_at: 3, status: { type: "archived" } });
  await admin.customers.archive({ store_id: storeId, id: customerId, expected_updated_at: 4 });
  await admin.customers.erase({ store_id: storeId, id: customerId, expected_updated_at: 5 });
  await admin.customers.merge({ store_id: storeId, id: customerId, target_customer_id: ids.otherCustomer, expected_updated_at: 6 });
  await admin.customers.resolveOrReserveEmail({ store_id: storeId, email: "buyer@example.com", customer_id: ids.otherCustomer });
  const importRows = [{ email: "person@example.com", customer_id: customerId, first_name: "Ana", last_name: null, phone: null, language: "bs", categories: [] }];
  await admin.customers.previewImport({ store_id: storeId, rows: importRows });
  await admin.customers.import({ store_id: storeId, rows: importRows });
  const sessions = await admin.customers.findSessions({ store_id: storeId, customer_id: customerId });
  assert.deepEqual(sessions.items.map((session) => [session.type.type, session.status]), [
    ["visitor", { type: "active" }],
    ["email_authenticated", { type: "superseded" }],
  ]);
  await admin.customers.revokeSession({ store_id: storeId, customer_id: customerId, session_id: ids.session });
  await admin.customers.revokeAllSessions({ store_id: storeId, customer_id: customerId });

  assert.equal("crm" in admin, false);
  for (const removed of ["identities", "getIdentity", "revokeIdentity", "findChannels"]) assert.equal(removed in admin.customers, false, removed);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${storeId}/customers`, create],
    ["GET", `/v1/stores/${storeId}/customers`, null],
    ["GET", `/v1/stores/${storeId}/customers/${customerId}`, null],
    ["PATCH", `/v1/stores/${storeId}/customers/${customerId}`, { expected_updated_at: 2, email: { type: "reserved", email: "new@example.com" }, phone: null }],
    ["PATCH", `/v1/stores/${storeId}/customers/${customerId}`, { expected_updated_at: 3, status: { type: "archived" } }],
    ["POST", `/v1/stores/${storeId}/customers/${customerId}/archive`, { expected_updated_at: 4 }],
    ["POST", `/v1/stores/${storeId}/customers/${customerId}/erase`, { expected_updated_at: 5 }],
    ["POST", `/v1/stores/${storeId}/customers/${customerId}/merge`, { target_customer_id: ids.otherCustomer, expected_updated_at: 6 }],
    ["POST", `/v1/stores/${storeId}/customers/resolve-or-reserve`, { email: "buyer@example.com", customer_id: ids.otherCustomer }],
    ["POST", `/v1/stores/${storeId}/customers/import/preview`, { rows: importRows }],
    ["POST", `/v1/stores/${storeId}/customers/import`, { rows: importRows }],
    ["GET", `/v1/stores/${storeId}/customers/${customerId}/sessions`, null],
    ["POST", `/v1/stores/${storeId}/customers/${customerId}/sessions/${ids.session}/revoke`, null],
    ["POST", `/v1/stores/${storeId}/customers/${customerId}/sessions/revoke`, null],
  ]);
  assert.equal(calls[1].url.search, "?status=active&email_type=verified");
  const before = calls.length;
  await assert.rejects(async () => admin.customers.create({ store_id: storeId, ...create, id: "customer-1" }), TypeError);
  await assert.rejects(async () => admin.customers.merge({ store_id: storeId, id: customerId, target_customer_id: "target", expected_updated_at: 6 }), TypeError);
  await assert.rejects(async () => admin.customers.resolveOrReserveEmail({ store_id: storeId, email: "buyer@example.com" }), TypeError);
  assert.equal(calls.length, before);
});

test("a sign-in code request names the app's id, the email and the language, and keeps the visitor session", async (context) => {
  const issuedAt = Date.now();
  const visitor = visitorSession(customerId);
  const session = { id: visitor.id, store_id: storeId, customer_id: customerId, type: { type: "visitor", expires_at: visitor.expires_at, email_verification: { email: "reader@example.test", failed_attempts: 0, notification_id: ids.payment, issued_at: issuedAt, expires_at: issuedAt + 600_000 } }, status: { type: "active" }, last_seen_at: issuedAt, created_at: issuedAt, updated_at: issuedAt };
  const calls = recordFetch(context, (call) => {
    if (call.path.endsWith("/identify")) return { customer: customerRecord(), session: visitor };
    assert.equal(call.path, "/v1/storefront/customer/request-code");
    return { customer: customerRecord(customerId, { email: { type: "contact", email: "reader@example.test" } }), session, email_verification: { issued_at: issuedAt, expires_at: issuedAt + 600_000 } };
  });
  const client = createStorefront(publishableKey, { apiUrl: baseUrl, locale: "en", sessionStorage: new SessionStorage() });
  const result = await client.customer.requestCode({ id: ids.form, email: "reader@example.test", language: "bs" });
  assert.deepEqual(result.email_verification, { issued_at: issuedAt, expires_at: issuedAt + 600_000 });
  assert.equal(client.isAuthenticated, false);
  assert.equal(client.session.type, "visitor");
  assert.deepEqual(client.session.customer.email, { type: "contact", email: "reader@example.test" });
  assert.deepEqual(calls.map((call) => [call.path, call.body, call.headers.get("authorization")]), [
    ["/v1/storefront/customer/identify", {}, null],
    ["/v1/storefront/customer/request-code", { id: ids.form, email: "reader@example.test", language: "bs" }, `Bearer ${visitorToken}`],
  ]);
  assert.equal(calls[1].headers.get("x-arky-locale"), "en");
  for (const id of [undefined, "", "code-request"]) {
    await assert.rejects(client.customer.requestCode({ id, email: "reader@example.test", language: "bs" }), TypeError);
  }
  assert.equal(calls.length, 2);
});

test("a code answer for another visitor session is refused and the stored session is unchanged", async (context) => {
  const visitor = visitorSession(customerId);
  recordFetch(context, (call) => {
    if (call.path.endsWith("/identify")) return { customer: customerRecord(), session: visitor };
    return { customer: customerRecord(), session: { id: ids.otherSession, customer_id: customerId }, email_verification: { issued_at: 1, expires_at: 2 } };
  });
  const storage = new SessionStorage();
  const client = createStorefront(publishableKey, { apiUrl: baseUrl, sessionStorage: storage });
  await client.customer.identify();
  const stored = [...storage.values];
  await assert.rejects(client.customer.requestCode({ id: ids.form, email: "reader@example.test", language: "bs" }), /does not match the active visitor session/);
  assert.deepEqual([...storage.values], stored);
  assert.equal(client.session.id, visitor.id);
});
