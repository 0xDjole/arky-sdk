import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const memberId = "0d4b8c62-3a75-4f0e-9a52-3e2bb2a3d5f1";
const groupId = "7e3a9c51-2b84-4d6f-a0c7-5e1d3b9f2a68";
const version = 1_700_000_000_000;
const choices = [{ entitlement_id: "dc78a8a7-27c3-47c2-8063-2f62c7f7a661", variant_id: ids.variant }];
const term = {
  type: "recurring", cadence: { interval: "month", interval_count: 1 }, commitment: null,
  on_exhaustion: { type: "pause" }, unpaid_order: { type: "retain_debt" },
  retry_offsets_seconds: [86_400], recovery_window_seconds: 604_800, renewal_reminder_days: 3,
};

test("staff own-terms review and acceptance retain quantity, choices, delivery and accepted group price", async (context) => {
  const result = { customer_group_member: { id: memberId }, created: null, withdrawn: null };
  const calls = recordFetch(context, () => result);
  const api = createAdmin({ baseUrl: apiUrl, secretKey: "contract" }).eshop.customerGroupMember;
  const terms = {
    group: { customer_group_id: groupId, term, purchase_requirement: null, unit_price: 1200, price: { type: "offer" }, entitlements: [] },
    quantity: 3, choices, deliveries: [], billing_address: null,
  };
  const input = { store_id: ids.store, id: memberId, expected_updated_at: version, terms, reason: "Three packages from next month" };
  const before = structuredClone(input);
  for (const [method, route] of [["reviewTerms", "review-terms"], ["changeTerms", "change-terms"]]) {
    assert.deepEqual(await api[method](input), result);
    assert.equal(calls.at(-1).path, `/v1/stores/${ids.store}/customer-group-members/${memberId}/${route}`);
    assert.deepEqual(calls.at(-1).body, { expected_updated_at: version, terms, reason: input.reason });
    assert.equal(calls.at(-1).method, "POST");
  }
  assert.deepEqual(input, before);
  assert.equal(calls.length, 2);
});

test("buyer own-terms sends only editable accepted fields and preserves the exact choices", async (context) => {
  const result = { customer_group_member: { id: memberId }, created: null, withdrawn: null };
  const calls = recordFetch(context, () => result);
  const api = createStorefront(publishableKey, {
    apiUrl, sessionStorage: visitorStorage(),
    visitorIdentity: { customer_id: ids.customer, session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" },
    createVisitorIdentity: () => ({ customer_id: ids.customer, session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }),
    createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14",
  }).eshop.customerGroupMember;
  const input = { id: memberId, expected_updated_at: version, quantity: 3, choices, deliveries: [], billing_address: null, reason: "Change the chosen product" };
  const before = structuredClone(input);
  const { id: _id, ...body } = input;
  for (const [method, route] of [["reviewTerms", "review-terms"], ["changeTerms", "change-terms"]]) {
    assert.deepEqual(await api[method](input), result);
    assert.equal(calls.at(-1).path, `/v1/storefront/customer-group-members/${memberId}/${route}`);
    assert.deepEqual(calls.at(-1).body, body);
    assert.equal(calls.at(-1).headers.get("authorization"), `Bearer ${visitorToken}`);
    assert.equal("group" in calls.at(-1).body, false);
    assert.equal("terms" in calls.at(-1).body, false);
    assert.equal("store_id" in calls.at(-1).body, false);
  }
  assert.deepEqual(input, before);
  assert.equal(calls.length, 2);
});
