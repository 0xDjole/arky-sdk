import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/index.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch } from "./helpers/arky-fixtures.mjs";

const offeringId = "8d1c2f4e-5b6a-4c7d-8e9f-0a1b2c3d4e5f";
const groupId = "6b7f3f38-2a8b-4a1e-9f02-7a1d9a2f0f21";
const otherGroupId = "3c9e5a71-8d24-4f06-b2a8-5e1c7d3f9b40";
const entitlementId = "0b9a4b7e-51a1-4d5f-9d9f-7a0e3f9ce0a1";
const STORE_ID = "d7b1f4e9-2a63-4c58-8e0d-5b9c3a6f1e24";
const OTHER_STORE_ID = "0a6e3c9f-5d21-4b87-9f4a-8c2e1b7d5a03";

function admin() {
  return createAdmin({ secretKey: "test-token", apiUrl: apiUrl });
}

test("storefront group and offering reads name their catalog, answer their listing and never ask for a price", async (context) => {
  const calls = recordFetch(context, (call) => call.path.includes("/customer-group-offerings/")
    ? { id: offeringId, key: "members-club", blocks: [], catalog_item_id: ids.catalogItem, customer_group_ids: [groupId] }
    : { id: groupId, catalog_item_id: ids.catalogItem });
  const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, market: "us", locale: "en" });
  const group = await client.eshop.customerGroup.getByKey({ key: "monthly/plan", catalog_id: ids.catalog, company_id: ids.company });
  assert.equal(group.catalog_item_id, ids.catalogItem);
  await client.eshop.customerGroup.get({ id: groupId, catalog_id: ids.catalog, company_location_id: ids.companyLocation });
  const offering = await client.eshop.customerGroupOffering.getByKey({ key: "members-club", catalog_id: ids.catalog });
  assert.deepEqual(offering.customer_group_ids, [groupId]);
  await client.eshop.customerGroupOffering.get({ id: offeringId, catalog_id: ids.catalog, company_id: ids.company });
  await client.eshop.customerGroup.getProductChoices({ key: "monthly", entitlement_id: entitlementId, quantity: 2, catalog_id: ids.catalog, company_location_id: ids.companyLocation });
  assert.deepEqual(calls.map((call) => [call.path, call.query]), [
    ["/v1/storefront/customer-groups/monthly%2Fplan", { catalog_id: ids.catalog, company_id: ids.company }],
    [`/v1/storefront/customer-groups/${groupId}`, { catalog_id: ids.catalog, company_location_id: ids.companyLocation }],
    ["/v1/storefront/customer-group-offerings/members-club", { catalog_id: ids.catalog }],
    [`/v1/storefront/customer-group-offerings/${offeringId}`, { catalog_id: ids.catalog, company_id: ids.company }],
    [`/v1/storefront/customer-groups/monthly/product-choices/${entitlementId}`, { catalog_id: ids.catalog, company_location_id: ids.companyLocation, quantity: "2" }],
  ]);
  for (const call of calls) {
    assert.equal(call.method, "GET");
    assert.equal(call.headers.get("x-arky-market"), "us");
    assert.equal(call.headers.get("x-arky-locale"), "en");
    assert.equal(call.headers.get("authorization"), null);
    assert.equal(call.headers.has("x-arky-sales-channel"), false);
  }
  assert.equal("find" in client.eshop.customerGroup, false);
  for (const removed of ["subscription_plans", "subscription_offerings"]) assert.equal(removed in client, false, removed);
});

test("a customer group owns its term and its entitlements, and is created under the app-picked id", async (context) => {
  const entitlements = [{ id: entitlementId, type: { type: "rental", variant_id: ids.variant, quantity: 1, tax_category_id: "tax" }, allocation_weight: 0 }];
  const term = {
    type: "recurring",
    cadence: { interval: "month", interval_count: 1 },
    retry_offsets_seconds: [86_400], recovery_window_seconds: 604_800, on_exhaustion: { type: "pause" }, unpaid_order: { type: "retain_debt" },
    renewal_reminder_days: null,
    commitment: { occurrences: 12, end_action: { type: "renew_once" } },
  };
  const create = {
    store_id: STORE_ID,
    id: groupId,
    key: "monthly",
    blocks: [],
    term,
    entitlements,
    purchase_requirement: null,
    tax_policies: [],
    status: { type: "active" },
    starts_at: null,
    ends_at: null,
  };
  const { store_id: _store, ...body } = create;
  const calls = recordFetch(context, () => ({ ...body, store_id: STORE_ID, created_at: 1, updated_at: 1 }));
  const before = structuredClone(create);
  const saved = await admin().eshop.customerGroup.create(create);
  assert.deepEqual(saved.entitlements, entitlements);
  assert.deepEqual(saved.term, term);
  assert.deepEqual(create, before);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [["POST", `/v1/stores/${STORE_ID}/customer-groups`, body]]);
  for (const removed of ["subscriptionPlanEntitlement", "subscriptionPlan", "subscriptionOffering"]) assert.equal(removed in admin().eshop, false, removed);
  for (const id of [undefined, "monthly", groupId.toUpperCase()]) {
    await assert.rejects(async () => admin().eshop.customerGroup.create({ ...create, id }), {
      name: "TypeError",
      message: "The customer group id must be a canonical UUID v4 picked by the app",
    });
  }
  assert.equal(calls.length, 1);
});

test("group and offering edits carry the version, offerings list their groups, and deletes send the version as a query", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? new Response(null, { status: 204 }) : call.method === "GET" ? { items: [], cursor: null } : { id: "record" });
  const client = admin().eshop;
  const update = { store_id: OTHER_STORE_ID, id: groupId, expected_updated_at: 5, blocks: [], term: { type: "permanent" }, entitlements: [], purchase_requirement: null, tax_policies: [], status: { type: "closed" }, starts_at: null, ends_at: null };
  await client.customerGroup.update(update);
  assert.equal(await client.customerGroup.delete({ store_id: OTHER_STORE_ID, id: groupId, expected_updated_at: 6 }), undefined);
  await client.customerGroup.find({ store_id: STORE_ID, customer_group_offering_id: offeringId, status: { type: "active" }, sort_field: "status", limit: 5 });
  await client.customerGroupOffering.create({ store_id: STORE_ID, id: offeringId, key: "members-club", blocks: [], customer_group_ids: [groupId], status: { type: "draft" } });
  await client.customerGroupOffering.update({ store_id: STORE_ID, id: offeringId, expected_updated_at: 7, blocks: [], customer_group_ids: [groupId, otherGroupId], status: { type: "active" } });
  await client.customerGroupOffering.find({ store_id: STORE_ID, key: "members-club", status: "active", limit: 5 });
  assert.equal(await client.customerGroupOffering.delete({ store_id: STORE_ID, id: offeringId, expected_updated_at: 8 }), undefined);
  const { store_id: _store, id: _id, ...updateBody } = update;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["PUT", `/v1/stores/${OTHER_STORE_ID}/customer-groups/${groupId}`, {}, updateBody],
    ["DELETE", `/v1/stores/${OTHER_STORE_ID}/customer-groups/${groupId}`, { expected_updated_at: "6" }, null],
    ["GET", `/v1/stores/${STORE_ID}/customer-groups`, { customer_group_offering_id: offeringId, status: JSON.stringify({ type: "active" }), sort_field: "status", limit: "5" }, null],
    ["POST", `/v1/stores/${STORE_ID}/customer-group-offerings`, {}, { id: offeringId, key: "members-club", blocks: [], customer_group_ids: [groupId], status: { type: "draft" } }],
    ["PUT", `/v1/stores/${STORE_ID}/customer-group-offerings/${offeringId}`, {}, { expected_updated_at: 7, blocks: [], customer_group_ids: [groupId, otherGroupId], status: { type: "active" } }],
    ["GET", `/v1/stores/${STORE_ID}/customer-group-offerings`, { key: "members-club", status: "active", limit: "5" }, null],
    ["DELETE", `/v1/stores/${STORE_ID}/customer-group-offerings/${offeringId}`, { expected_updated_at: "8" }, null],
  ]);
  await assert.rejects(async () => client.customerGroupOffering.create({ store_id: STORE_ID, id: "members-club", key: "members-club", blocks: [], customer_group_ids: [], status: { type: "draft" } }), {
    name: "TypeError",
    message: "The customer group offering id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 7);
});

test("customer group offerings are read by id or by key on the named store, and never from a remembered one", async (context) => {
  const calls = recordFetch(context, () => ({ id: offeringId }));
  const client = admin().eshop.customerGroupOffering;
  await client.get({ store_id: STORE_ID, id: offeringId });
  await client.getByKey({ store_id: OTHER_STORE_ID, key: "members/club" });
  await admin().eshop.customerGroup.get({ store_id: STORE_ID, id: groupId });
  await assert.rejects(async () => client.getByKey({ key: "members-club" }), TypeError);
  assert.deepEqual(calls.map(({ path }) => path), [
    `/v1/stores/${STORE_ID}/customer-group-offerings/${offeringId}`,
    `/v1/stores/${OTHER_STORE_ID}/customer-group-offerings/by-key/members%2Fclub`,
    `/v1/stores/${STORE_ID}/customer-groups/${groupId}`,
  ]);
});
