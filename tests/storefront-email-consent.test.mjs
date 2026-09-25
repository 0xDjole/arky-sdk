import assert from "node:assert/strict";
import test from "node:test";
import { createStorefront, initialize } from "../dist/storefront.js";
import { MemoryStorage } from "./helpers/durable-request-fixtures.mjs";

test("storefront consent reuses its Visitor, exact binding and generation without joining or authenticating", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const publishableKey = `arky_pk_${"g".repeat(43)}`;
  const token = `customer_visitor_${"b".repeat(64)}`;
  const storage = new MemoryStorage();
  const customerId = "70b5f662-f3d8-48c9-8c16-c60dd4ff1703";
  const groupId = "cf8a15f4-1489-40a1-a850-a98b7e311699";
  const identityId = "1c0d95be-a8c9-41a2-9e82-f8fc785ed98a";
  const request = { customer_group_id: groupId, email_identity_id: identityId, expected_updated_at: null };
  const consent = {
    id: "e245588f-0542-4bb3-97c8-23de326627d1", customer_group_id: groupId,
    customer_id: customerId, email_identity_id: identityId, normalized_email: "reader@example.test",
    status: { type: "pending" }, created_at: 2, updated_at: 3,
    confirmation: { confirmation_id: "6b9d9e19-3d13-4f30-a1a0-442a3c92f212", email_status: { type: "requested", requested_at: 3 }, issued_at: 3, expires_at: 86_400_003 },
  };
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const parsed = new URL(url);
    const headers = new Headers(init.headers);
    const call = { path: parsed.pathname, method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null, query: parsed.search };
    calls.push(call);
    assert.equal(headers.get("X-Arky-Publishable-Key"), publishableKey);
    assert.equal(headers.has("X-Arky-Market"), false);
    let result;
    if (call.path === "/v1/storefront/customer/identify") {
      assert.equal(headers.has("Authorization"), false);
      result = {
        customer: { id: customerId, status: { type: "active" }, primary_email_identity_id: null, default_shipping_address_id: null, default_billing_address_id: null, classifications: [], created_at: 1, updated_at: 1 },
        session: { id: "consent-session", customer_id: customerId, type: "visitor", status: { type: "active" }, token, expires_at: Date.now() + 60_000 },
      };
    } else {
      assert.equal(headers.get("Authorization"), `Bearer ${token}`);
      assert.equal(call.query, "");
      if (call.path.endsWith("/subscribe")) {
        assert.equal(call.method, "POST");
        assert.deepEqual(call.body, request);
      } else {
        assert.equal(call.path, `/v1/storefront/customer-group-email-consents/${consent.id}`);
        assert.equal(call.method, "GET");
      }
      result = consent;
    }
    return new Response(JSON.stringify(result), { status: 200, headers: { "content-type": "application/json" } });
  };
  const options = { apiUrl: "https://api.example.test", sessionStorage: storage };
  const client = createStorefront(publishableKey, options);
  assert.deepEqual(await client.customer_group_email_consents.subscribe({ ...request, store_id: "forged", customer_id: "forged" }), consent);
  assert.deepEqual(await client.customer_group_email_consents.subscribe(request), consent);
  const storefront = initialize(publishableKey, options);
  assert.deepEqual(await storefront.customer_group_email_consents.get({ id: consent.id, store_id: "forged" }), consent);
  assert.equal(calls.filter(call => call.path.endsWith("/identify")).length, 1);
  assert.equal(calls.length, 4);
  assert.equal(client.isAuthenticated, false);
  assert.equal(client.session.customer.primary_email_identity_id, null);
  const savedSession = [...storage.values.entries()];
  const resend = { id: consent.id, confirmation_id: consent.confirmation.confirmation_id, expected_updated_at: consent.updated_at };
  let attempts = 0;
  globalThis.fetch = async (url, init = {}) => {
    assert.equal(new URL(url).pathname, "/v1/storefront/customer-group-email-consents/resend-confirmation");
    assert.deepEqual(JSON.parse(init.body), resend);
    attempts += 1;
    return new Response(JSON.stringify({ message: "A current or uncertain confirmation cannot be replaced", statusCode: 409 }), { status: 409, headers: { "content-type": "application/json" } });
  };
  await assert.rejects(storefront.customer_group_email_consents.resendConfirmation({ ...resend, store_id: "forged" }), error => error.statusCode === 409);
  assert.equal(attempts, 1);
  assert.deepEqual([...storage.values.entries()], savedSession);
});
