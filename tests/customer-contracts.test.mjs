import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import { MemoryStorage } from "./helpers/durable-request-fixtures.mjs";

const baseUrl = "https://api.example.test";
const storeId = "8f3d6b21-9a47-4c05-b1e8-2d7f0c5a9e63";
const customerId = "customer-contract";

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

const customer = {
  id: customerId,
  store_id: storeId,
  status: { type: "active" },
  primary_email_identity_id: "identity-contract",
  default_shipping_address_id: null,
  default_billing_address_id: null,
  categories: [],
  created_at: 1,
  updated_at: 2,
};

test("storefront email capture reuses its Visitor without changing primary selection or sending email", async (t) => {
  const storage = new MemoryStorage();
  const publishableKey = `arky_pk_${"k".repeat(43)}`;
  const calls = [];
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const captured = {
    id: "identity-captured", customer_id: customerId,
    type: { type: "email", email: "reader@example.test" },
    status: { type: "active" }, verified_at: null, created_at: 1, updated_at: 1,
  };
  globalThis.fetch = async (url, init = {}) => {
    const path = new URL(url).pathname;
    const headers = new Headers(init.headers);
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ path, method: init.method, body, authorization: headers.get("Authorization") });
    assert.equal(headers.get("X-Arky-Publishable-Key"), publishableKey);
    assert.equal(headers.has("X-Arky-Market"), false);
    if (path === "/v1/storefront/customer/identify") return jsonResponse({
      customer: { ...customer, primary_email_identity_id: null },
      session: {
        id: "session-capture", customer_id: customerId, type: "visitor",
        status: { type: "active" }, token: `customer_visitor_${"a".repeat(64)}`,
        expires_at: Date.now() + 60_000,
      },
    });
    assert.equal(path, "/v1/storefront/customer/email-identities");
    return jsonResponse(captured);
  };
  const client = createStorefront(publishableKey, { apiUrl: baseUrl, sessionStorage: storage });
  const first = await client.customer.captureEmail({ email: "reader@example.test" });
  const retainedStorage = [...storage.values.entries()];
  const second = await client.customer.captureEmail({ email: "reader@example.test" });
  assert.deepEqual(first, captured);
  assert.deepEqual(second, first);
  assert.deepEqual([...storage.values.entries()], retainedStorage);
  assert.equal(client.session.customer.primary_email_identity_id, null);
  assert.equal(client.isAuthenticated, false);
  assert.equal(calls.length, 3);
  assert.equal(calls[0].authorization, null);
  for (const call of calls.slice(1)) {
    assert.equal(call.method, "POST");
    assert.deepEqual(call.body, { email: "reader@example.test" });
    assert.equal(call.authorization, `Bearer customer_visitor_${"a".repeat(64)}`);
  }
  const initialized = initialize(publishableKey, { apiUrl: baseUrl, sessionStorage: storage });
  assert.deepEqual(await initialized.customer.captureEmail({ email: "reader@example.test" }), captured);
  assert.equal(calls.filter(call => call.path.endsWith("/identify")).length, 1);
  let conflicts = 0;
  const beforeConflict = [...storage.values.entries()];
  globalThis.fetch = async (url, init = {}) => {
    assert.equal(new URL(url).pathname, "/v1/storefront/customer/email-identities");
    assert.equal(new Headers(init.headers).get("Authorization"), `Bearer customer_visitor_${"a".repeat(64)}`);
    conflicts += 1;
    return new Response(JSON.stringify({ message: "Ambiguous email identity", statusCode: 409 }), {
      status: 409, headers: { "content-type": "application/json" },
    });
  };
  await assert.rejects(
    initialized.customer.captureEmail({ email: "reader@example.test" }),
    error => error.statusCode === 409,
  );
  assert.equal(conflicts, 1);
  assert.deepEqual([...storage.values.entries()], beforeConflict);
});

test("Admin Customer namespace uses canonical routes, tagged status and independent identity selection", async () => {
  const admin = createAdmin({ baseUrl, market: "bih" });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const parsedUrl = new URL(String(url));
    const path = parsedUrl.pathname;
    const body = init.body ? JSON.parse(String(init.body)) : null;
    calls.push({
      path,
      search: parsedUrl.search,
      method: init.method || "GET",
      body,
    });
    if (path.endsWith("/sessions")) {
      return jsonResponse({
        items: [
          {
            id: "session-visitor",
            store_id: storeId,
            customer_id: customerId,
            status: { type: "active" },
            type: "visitor",
            last_seen_at: 2,
            created_at: 1,
            updated_at: 2,
            superseded_at: null,
            revoked_at: null,
            expires_at: 100,
            email_verification: {
              identity_id: "identity-contract",
              failed_attempts: 0,
              issued_at: 2,
              expires_at: 62,
            },
          },
          {
            id: "session-authenticated",
            store_id: storeId,
            customer_id: customerId,
            status: { type: "superseded" },
            type: "email_authenticated",
            last_seen_at: 3,
            created_at: 2,
            updated_at: 4,
            superseded_at: 4,
            revoked_at: null,
            identity_id: "identity-contract",
            access_expires_at: 100,
            refresh_expires_at: 200,
            authenticated_at: 3,
          },
        ],
        cursor: null,
      });
    }
    if (path.endsWith("/import/preview")) {
      return jsonResponse({
        rows_total: 1,
        rows_valid: 1,
        rows_invalid: 0,
        rows: [
          {
            row: 1,
            email: "person@example.com",
            customer_id: null,
            valid: true,
            errors: [],
          },
        ],
      });
    }
    if (path.endsWith("/import")) {
      return jsonResponse({
        rows_total: 0,
        customers_created: 0,
        customers_updated: 0,
        rows_failed: 0,
        rows: [],
      });
    }
    if (path.endsWith("/revoke")) return jsonResponse({ success: true });
    if (path.endsWith("/customers")) {
      return init.method === "GET"
        ? jsonResponse({ items: [customer], cursor: null })
        : jsonResponse(customer);
    }
    return jsonResponse(customer);
  };

  try {
    const created = await admin.customers.create({
      store_id: storeId,
      email: "person@example.com",
      categories: [],
    });
    assert.equal(created.primary_email_identity_id, "identity-contract");
    assert.equal("identities" in created, false);
    assert.equal("email" in created, false);
    await admin.customers.find({ store_id: storeId, status: "active", has_verified_email: true });
    await admin.customers.get({ store_id: storeId, id: customerId });
    await admin.customers.update({ store_id: storeId, id: customerId, email: "new@example.com" });
    await admin.customers.update({ store_id: storeId, id: customerId, status: { type: "archived" } });
    await admin.customers.update({ store_id: storeId, id: customerId, status: { type: "active" } });
    await admin.customers.archive({ store_id: storeId, id: customerId });
    const importRows = [{ email: "person@example.com", categories: [] }];
    await admin.customers.previewImport({ store_id: storeId, rows: importRows });
    await admin.customers.import({ store_id: storeId, rows: importRows });
    const sessions = await admin.customers.findSessions({
      store_id: storeId,
      customer_id: customerId,
    });
    assert.deepEqual(
      sessions.items.map((session) => [session.type, session.status]),
      [
        ["visitor", { type: "active" }],
        ["email_authenticated", { type: "superseded" }],
      ],
    );
    await admin.customers.revokeSession({
      store_id: storeId,
      customer_id: customerId,
      session_id: "session-visitor",
    });
    await admin.customers.revokeAllSessions({ store_id: storeId, customer_id: customerId });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal("crm" in admin, false);
  assert.equal("merge" in admin.customers, false);
  assert.equal("findChannels" in admin.customers, false);
  assert.deepEqual(
    calls.map(({ method, path }) => [method, path]),
    [
      ["POST", `/v1/stores/${storeId}/customers`],
      ["GET", `/v1/stores/${storeId}/customers`],
      ["GET", `/v1/stores/${storeId}/customers/${customerId}`],
      ["PATCH", `/v1/stores/${storeId}/customers/${customerId}`],
      ["PATCH", `/v1/stores/${storeId}/customers/${customerId}`],
      ["PATCH", `/v1/stores/${storeId}/customers/${customerId}`],
      ["POST", `/v1/stores/${storeId}/customers/${customerId}/archive`],
      ["POST", `/v1/stores/${storeId}/customers/import/preview`],
      ["POST", `/v1/stores/${storeId}/customers/import`],
      ["GET", `/v1/stores/${storeId}/customers/${customerId}/sessions`],
      [
        "POST",
        `/v1/stores/${storeId}/customers/${customerId}/sessions/session-visitor/revoke`,
      ],
      ["POST", `/v1/stores/${storeId}/customers/${customerId}/sessions/revoke`],
    ],
  );
  assert.deepEqual(calls[0].body, { email: "person@example.com", categories: [] });
  assert.ok(calls.every(({ body }) => body === null || !("store_id" in body)));
  assert.deepEqual(
    calls.find(({ path }) => path.endsWith("/import/preview"))?.body,
    { rows: [{ email: "person@example.com", categories: [] }] },
  );
  assert.deepEqual(calls.find(({ path }) => path.endsWith("/import"))?.body, {
    rows: [{ email: "person@example.com", categories: [] }],
  });
  assert.deepEqual(
    calls
      .filter(
        ({ method, path }) =>
          method === "PATCH" && path.endsWith(`/customers/${customerId}`),
      )
      .map(({ body }) => body),
    [
      { email: "new@example.com" },
      { status: { type: "archived" } },
      { status: { type: "active" } },
    ],
  );
  assert.equal(
    calls.find(
      ({ method, path }) => method === "GET" && path.endsWith("/customers"),
    )?.search,
    "?status=active&has_verified_email=true",
  );
});

test("Customer code issuance exposes issued_at and keeps Visitor proof independent", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const publishableKey = "arky_pk_" + "c".repeat(43);
  const token = "customer_visitor_" + "d".repeat(64);
  const issuedAt = Date.now();
  const visitor = { id: "code-visitor", customer_id: customerId, type: "visitor", status: { type: "active" }, token, expires_at: issuedAt + 600_000 };
  const proof = { identity_id: "code-email-identity", failed_attempts: 0, issued_at: issuedAt, expires_at: issuedAt + 600_000 };
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const path = new URL(url).pathname;
    const headers = new Headers(init.headers);
    calls.push({ path, body: JSON.parse(init.body), authorization: headers.get("Authorization") });
    if (path.endsWith("/identify")) return jsonResponse({ customer, session: visitor });
    assert.equal(path, "/v1/storefront/customer/request-code");
    return jsonResponse({ customer, session: { ...visitor, token: undefined, email_verification: proof, superseded_at: null, revoked_at: null, last_seen_at: null, created_at: issuedAt, updated_at: issuedAt }, email_verification: { issued_at: issuedAt, expires_at: proof.expires_at } });
  };
  const client = createStorefront(publishableKey, { apiUrl: baseUrl, sessionStorage: new MemoryStorage() });
  await client.customer.identify();
  const result = await client.customer.requestCode({ email: "reader@example.test" });
  assert.deepEqual(result.email_verification, { issued_at: issuedAt, expires_at: proof.expires_at });
  assert.deepEqual(result.session.email_verification, proof);
  assert.equal("sent_at" in result.email_verification, false);
  assert.equal("sent_at" in result.session.email_verification, false);
  assert.equal(client.isAuthenticated, false);
  assert.equal(client.session.type, "visitor");
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1], { path: "/v1/storefront/customer/request-code", body: { email: "reader@example.test" }, authorization: "Bearer " + token });
});
