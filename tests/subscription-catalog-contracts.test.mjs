import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/index.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch } from "./helpers/arky-fixtures.mjs";

const offeringId = "8d1c2f4e-5b6a-4c7d-8e9f-0a1b2c3d4e5f";
const planId = "6b7f3f38-2a8b-4a1e-9f02-7a1d9a2f0f21";
const entitlementId = "0b9a4b7e-51a1-4d5f-9d9f-7a0e3f9ce0a1";
const STORE_ID = "d7b1f4e9-2a63-4c58-8e0d-5b9c3a6f1e24";
const OTHER_STORE_ID = "0a6e3c9f-5d21-4b87-9f4a-8c2e1b7d5a03";

function admin() {
  return createAdmin({ apiToken: "test-token", baseUrl: apiUrl });
}

test("storefront plan discovery forwards the catalog, offering, price filter, ordering and continuation", async (context) => {
  const calls = recordFetch(context, (call) => call.path === "/v1/storefront/subscription-plans" ? { items: [], cursor: null } : { id: planId });
  const client = createStorefront(publishableKey, { apiUrl, market: "us", locale: "en" });
  await client.subscription_plans.find({
    subscription_offering_id: offeringId,
    catalog_id: ids.catalog,
    company_id: ids.company,
    company_location_id: ids.companyLocation,
    include_price: true,
    query: "monthly",
    price_filter: { min_amount: 0, max_amount: 900, quantity: 1 },
    sort_field: "price",
    sort_direction: "asc",
    limit: 10,
    cursor: "protected-position",
    created_at_from: 1000,
    created_at_to: 2000,
  });
  await client.subscription_plans.get({ identifier: "monthly/plan", subscription_offering_id: offeringId, catalog_id: ids.catalog, include_price: true });
  await client.subscription_offerings.get({ identifier: "coffee-club" });
  assert.deepEqual(calls[0].query, {
    subscription_offering_id: offeringId,
    catalog_id: ids.catalog,
    company_id: ids.company,
    company_location_id: ids.companyLocation,
    include_price: "true",
    query: "monthly",
    price_filter: JSON.stringify({ min_amount: 0, max_amount: 900, quantity: 1 }),
    sort_field: "price",
    sort_direction: "asc",
    limit: "10",
    cursor: "protected-position",
    created_at_from: "1000",
    created_at_to: "2000",
  });
  assert.equal(calls[1].path, "/v1/storefront/subscription-plans/monthly%2Fplan");
  assert.deepEqual(calls[1].query, { subscription_offering_id: offeringId, catalog_id: ids.catalog, include_price: "true" });
  assert.equal(calls[2].path, "/v1/storefront/subscription-offerings/coffee-club");
  for (const call of calls) {
    assert.equal(call.method, "GET");
    assert.equal(call.headers.get("x-arky-market"), "us");
    assert.equal(call.headers.get("x-arky-locale"), "en");
    assert.equal(call.headers.get("authorization"), null);
  }
});

test("a subscription plan owns its term and its entitlements, and is created under the app-picked id", async (context) => {
  const entitlements = [{ id: entitlementId, type: { type: "rental", variant_id: ids.variant, quantity: 1, tax_category_id: "tax" }, allocation_weight: 0 }];
  const create = {
    store_id: STORE_ID,
    id: planId,
    subscription_offering_id: offeringId,
    key: "monthly",
    blocks: [],
    term: { type: "permanent" },
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
  const saved = await admin().eshop.subscriptionPlan.create(create);
  assert.deepEqual(saved.entitlements, entitlements);
  assert.deepEqual(create, before);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [["POST", `/v1/stores/${STORE_ID}/subscription-plans`, body]]);
  assert.equal("subscriptionPlanEntitlement" in admin().eshop, false);
  for (const id of [undefined, "monthly", planId.toUpperCase()]) {
    await assert.rejects(async () => admin().eshop.subscriptionPlan.create({ ...create, id }), {
      name: "TypeError",
      message: "The subscription plan id must be a canonical UUID v4 picked by the app",
    });
  }
  assert.equal(calls.length, 1);
});

test("plan and offering edits carry the version, and deletes send it as a query", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? { deleted: true } : call.method === "GET" ? { items: [], cursor: null } : { id: "record" });
  const client = admin().eshop;
  const update = { store_id: OTHER_STORE_ID, id: planId, expected_updated_at: 5, blocks: [], term: { type: "permanent" }, entitlements: [], purchase_requirement: null, tax_policies: [], status: { type: "closed" }, starts_at: null, ends_at: null };
  await client.subscriptionPlan.update(update);
  await client.subscriptionPlan.delete({ store_id: OTHER_STORE_ID, id: planId, expected_updated_at: 6 });
  await client.subscriptionPlan.find({ store_id: STORE_ID, subscription_offering_id: offeringId, status: "active", sort_field: "status", limit: 5 });
  await client.subscriptionOffering.create({ store_id: STORE_ID, id: offeringId, key: "coffee-club", blocks: [], status: { type: "draft" } });
  await client.subscriptionOffering.update({ store_id: STORE_ID, id: offeringId, expected_updated_at: 7, blocks: [], transitions: [{ from_subscription_plan_id: planId, to_subscription_plan_id: planId }], status: { type: "active" } });
  await client.subscriptionOffering.delete({ store_id: STORE_ID, id: offeringId, expected_updated_at: 8 });
  const { store_id: _store, id: _id, ...updateBody } = update;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["PUT", `/v1/stores/${OTHER_STORE_ID}/subscription-plans/${planId}`, {}, updateBody],
    ["DELETE", `/v1/stores/${OTHER_STORE_ID}/subscription-plans/${planId}`, { expected_updated_at: "6" }, null],
    ["GET", `/v1/stores/${STORE_ID}/subscription-plans`, { subscription_offering_id: offeringId, status: "active", sort_field: "status", limit: "5" }, null],
    ["POST", `/v1/stores/${STORE_ID}/subscription-offerings`, {}, { id: offeringId, key: "coffee-club", blocks: [], status: { type: "draft" } }],
    ["PUT", `/v1/stores/${STORE_ID}/subscription-offerings/${offeringId}`, {}, { expected_updated_at: 7, blocks: [], transitions: [{ from_subscription_plan_id: planId, to_subscription_plan_id: planId }], status: { type: "active" } }],
    ["DELETE", `/v1/stores/${STORE_ID}/subscription-offerings/${offeringId}`, { expected_updated_at: "8" }, null],
  ]);
});

test("subscription offerings are read by id or by key on the named store, and never from a remembered one", async (context) => {
  const calls = recordFetch(context, () => ({ id: offeringId }));
  const client = admin().eshop.subscriptionOffering;
  await client.get({ store_id: STORE_ID, id: offeringId });
  await client.getByKey({ store_id: OTHER_STORE_ID, key: "coffee/club" });
  await assert.rejects(async () => client.getByKey({ key: "coffee-club" }), TypeError);
  assert.deepEqual(calls.map(({ path }) => path), [
    `/v1/stores/${STORE_ID}/subscription-offerings/${offeringId}`,
    `/v1/stores/${OTHER_STORE_ID}/subscription-offerings/by-key/coffee%2Fclub`,
  ]);
});
