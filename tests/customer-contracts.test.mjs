import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";

const baseUrl = "https://api.example.test";
const storeId = "store-customer-contract";
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
  status: "active",
  identities: [
    {
      id: "identity-contract",
      type: "email",
      email: "person@example.com",
      verified_at: 2,
      created_at: 1,
    },
  ],
  classifications: [],
  created_at: 1,
  updated_at: 2,
};

test("Admin Customer namespace uses only canonical routes and flattened identities", async () => {
  const admin = createAdmin({ baseUrl, storeId, market: "bih" });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const parsedUrl = new URL(String(url));
    const path = parsedUrl.pathname;
    const body = init.body ? JSON.parse(String(init.body)) : null;
    calls.push({ path, search: parsedUrl.search, method: init.method || "GET", body });
    if (path.endsWith("/sessions")) {
      return jsonResponse({
        items: [
          {
            id: "session-visitor",
            store_id: storeId,
            customer_id: customerId,
            status: "active",
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
              sent_at: 2,
              expires_at: 62,
            },
          },
          {
            id: "session-authenticated",
            store_id: storeId,
            customer_id: customerId,
            status: "superseded",
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
      email: "person@example.com",
      classifications: [],
    });
    assert.equal(created.identities[0].type, "email");
    assert.equal("email" in created, false);
    await admin.customers.find({ status: "active", has_verified_email: true });
    await admin.customers.get({ id: customerId });
    await admin.customers.update({ id: customerId, email: "new@example.com" });
    await admin.customers.archive({ id: customerId });
    const importRows = [
      { email: "person@example.com", classifications: [] },
    ];
    await admin.customers.previewImport({ rows: importRows });
    await admin.customers.import({ rows: importRows });
    const sessions = await admin.customers.findSessions({
      customer_id: customerId,
    });
    assert.deepEqual(
      sessions.items.map((session) => [session.type, session.status]),
      [
        ["visitor", "active"],
        ["email_authenticated", "superseded"],
      ],
    );
    await admin.customers.revokeSession({
      customer_id: customerId,
      session_id: "session-visitor",
    });
    await admin.customers.revokeAllSessions({ customer_id: customerId });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal("contact" in admin.crm, false);
  assert.equal("merge" in admin.customers, false);
  assert.equal("findChannels" in admin.customers, false);
  assert.deepEqual(
    calls.map(({ method, path }) => [method, path]),
    [
      ["POST", `/v1/stores/${storeId}/customers`],
      ["GET", `/v1/stores/${storeId}/customers`],
      ["GET", `/v1/stores/${storeId}/customers/${customerId}`],
      ["PATCH", `/v1/stores/${storeId}/customers/${customerId}`],
      ["POST", `/v1/stores/${storeId}/customers/${customerId}/archive`],
      ["POST", `/v1/stores/${storeId}/customers/import/preview`],
      ["POST", `/v1/stores/${storeId}/customers/import`],
      ["GET", `/v1/stores/${storeId}/customers/${customerId}/sessions`],
      ["POST", `/v1/stores/${storeId}/customers/${customerId}/sessions/session-visitor/revoke`],
      ["POST", `/v1/stores/${storeId}/customers/${customerId}/sessions/revoke`],
    ],
  );
  assert.deepEqual(
    calls.find(({ path }) => path.endsWith("/import/preview"))?.body,
    { rows: [{ email: "person@example.com", classifications: [] }] },
  );
  assert.deepEqual(
    calls.find(({ path }) => path.endsWith("/import"))?.body,
    { rows: [{ email: "person@example.com", classifications: [] }] },
  );
  assert.equal(
    calls.find(
      ({ method, path }) => method === "GET" && path.endsWith("/customers"),
    )?.search,
    "?status=active&has_verified_email=true",
  );
});
