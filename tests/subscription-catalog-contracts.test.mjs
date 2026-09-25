import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/index.js";
import { createStorefront } from "../dist/storefront.js";

const apiUrl = "https://api.example.test";
const groupId = "350082ac-9c53-497a-a7b2-4ecb36e1b53c";
const offeringId = "8d1c2f4e-5b6a-4c7d-8e9f-0a1b2c3d4e5f";
const planId = "6b7f3f38-2a8b-4a1e-9f02-7a1d9a2f0f21";

function capture(response) {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: new URL(url),
      method: init.method,
      body: init.body ? JSON.parse(init.body) : undefined,
    });
    return new Response(JSON.stringify(response), {
      headers: { "content-type": "application/json" },
    });
  };
  return { calls, restore: () => { globalThis.fetch = originalFetch; } };
}

function admin() {
  return createAdmin({
    apiToken: "test-token",
    baseUrl: apiUrl,
    storeId: "configured-store",
    market: "us",
    locale: "en",
  });
}

test("plan discovery forwards catalog pricing, offering, ordering and protected continuation", async () => {
  const { calls, restore } = capture({ items: [], cursor: null });
  try {
    const client = createStorefront(`arky_pk_${"b".repeat(42)}A`, {
      apiUrl,
      market: "us", locale: "en",
    });
    await client.subscription_plans.find({
      subscription_offering_id: offeringId, company_id: "company", company_location_id: "branch",
      include_price: true, query: "monthly", price_filter: { min_amount: 0, max_amount: 900, quantity: 1 },
      sort_field: "price", sort_direction: "asc", limit: 10, cursor: "protected-position",
      created_at_from: 1000, created_at_to: 2000,
    });
    const query = calls[0].url.searchParams;
    assert.equal(query.get("subscription_offering_id"), offeringId);
    assert.equal(query.get("company_id"), "company");
    assert.equal(query.get("company_location_id"), "branch");
    assert.equal(query.get("include_price"), "true");
    assert.equal(query.get("query"), "monthly");
    assert.deepEqual(JSON.parse(query.get("price_filter")), { min_amount: 0, max_amount: 900, quantity: 1 });
    assert.equal(query.get("sort_field"), "price");
    assert.equal(query.get("sort_direction"), "asc");
    assert.equal(query.get("cursor"), "protected-position");
    assert.equal(query.get("created_at_from"), "1000");
    assert.equal(query.get("created_at_to"), "2000");
    await client.subscription_plans.get({ identifier: "monthly", subscription_offering_id: offeringId, include_price: true });
    assert.equal(calls[1].url.searchParams.get("subscription_offering_id"), offeringId);
    assert.equal(calls[1].url.searchParams.get("include_price"), "true");
  } finally { restore(); }
});

test("a CustomerGroup definition carries admission and communication, never commercial terms", async () => {
  const group = {
    id: groupId,
    store_id: "selected-store",
    key: "membership",
    name: "Membership",
    status: { type: "draft" },
    join_policy: { type: "private" },
    communication: { type: "disabled" },
    created_at: 1788862721000,
    updated_at: 1788862721000,
  };
  const { calls, restore } = capture(group);
  try {
    const saved = await admin().eshop.customerGroup.create({
      store_id: "selected-store",
      key: "membership",
      name: "Membership",
      status: { type: "draft" },
      join_policy: { type: "private" },
      communication: { type: "disabled" },
    });
    assert.deepEqual(saved.join_policy, { type: "private" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.pathname, "/v1/stores/selected-store/customer-groups");
    assert.equal(calls[0].method, "POST");
    for (const commercial of ["price", "currency", "amount", "type", "term", "entitlements"]) {
      assert.equal(commercial in calls[0].body, false, commercial);
    }
    assert.equal("store_id" in calls[0].body, false);
  } finally {
    restore();
  }
});

test("a SubscriptionPlan owns the commercial term while entitlements stay separate roots", async () => {
  const plan = {
    id: planId,
    store_id: "selected-store",
    subscription_offering_id: offeringId,
    key: "monthly",
    blocks: [],
    term: { type: "permanent" },
    status: { type: "active" },
    starts_at: null,
    ends_at: null,
    created_at: 1788862721000,
    updated_at: 1788862721000,
  };
  const { calls, restore } = capture(plan);
  try {
    const saved = await admin().eshop.subscriptionPlan.create({
      store_id: "selected-store",
      subscription_offering_id: offeringId,
      key: "monthly",
      blocks: [],
      term: { type: "permanent" },
      status: { type: "active" },
      starts_at: null,
      ends_at: null,
    });
    assert.equal(saved.subscription_offering_id, offeringId);
    assert.equal("entitlements" in calls[0].body, false);
    assert.deepEqual(saved.term, { type: "permanent" });
    assert.equal(calls.length, 1);
    assert.equal(
      calls[0].url.pathname,
      "/v1/stores/selected-store/subscription-plans",
    );
    assert.equal(calls[0].method, "POST");
    assert.equal(calls[0].body.subscription_offering_id, offeringId);
    assert.equal("store_id" in calls[0].body, false);
  } finally {
    restore();
  }
});

test("plan entitlements are separate replay-safe roots under their exact plan", async () => {
  const entitlementId = "0b9a4b7e-51a1-4d5f-9d9f-7a0e3f9ce0a1";
  const entitlement = {
    id: entitlementId,
    store_id: "selected-store",
    subscription_plan_id: planId,
    type: { type: "rental", product_id: "product", variant_id: "variant", quantity: 1 },
    allocation_weight: 0,
    created_at: 1788862721000,
    updated_at: 1788862721001,
  };
  const { calls, restore } = capture(entitlement);
  try {
    const api = admin().eshop.subscriptionPlanEntitlement;
    const create = {
      store_id: "selected-store",
      subscription_plan_id: planId,
      entitlement_id: entitlementId,
      type: entitlement.type,
      allocation_weight: 0,
    };
    const before = structuredClone(create);
    assert.deepEqual(await api.create(create), entitlement);
    await api.create(create);
    assert.deepEqual(create, before);
    await api.find({ store_id: "selected-store", subscription_plan_id: planId });
    await api.update({
      subscription_plan_id: planId, id: entitlementId, expected_updated_at: 1788862721001,
      type: { type: "digital_product", digital_product_id: "digital", content: { type: "current_bundle" } },
      allocation_weight: 3,
    });
    await api.delete({ subscription_plan_id: planId, id: entitlementId, expected_updated_at: 1788862721002 });
    const base = `/v1/stores/selected-store/subscription-plans/${planId}/entitlements`;
    const fallback = `/v1/stores/configured-store/subscription-plans/${planId}/entitlements`;
    assert.deepEqual(calls.map((call) => [call.method, call.url.pathname]), [
      ["POST", base],
      ["POST", base],
      ["GET", base],
      ["PUT", `${fallback}/${entitlementId}`],
      ["DELETE", `${fallback}/${entitlementId}`],
    ]);
    assert.deepEqual(calls[0].body, { entitlement_id: entitlementId, type: entitlement.type, allocation_weight: 0 });
    assert.deepEqual(calls[1].body, calls[0].body);
    assert.equal(calls[2].body, undefined);
    assert.equal(calls[2].url.search, "");
    assert.deepEqual(calls[3].body, {
      expected_updated_at: 1788862721001,
      type: { type: "digital_product", digital_product_id: "digital", content: { type: "current_bundle" } },
      allocation_weight: 3,
    });
    assert.equal(calls[4].body, undefined);
    assert.deepEqual(Object.fromEntries(calls[4].url.searchParams), { expected_updated_at: "1788862721002" });
  } finally {
    restore();
  }
});

test("CustomerGroup reads stay explicit and never retain a previous selection", async () => {
  const { calls, restore } = capture({ items: [], cursor: null });
  try {
    const client = admin();
    await client.eshop.customerGroup.find({ store_id: "first-store", key: "wholesale" });
    await client.eshop.customerGroup.find({ store_id: "second-store" });
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url.pathname, "/v1/stores/first-store/customer-groups");
    assert.equal(calls[0].url.searchParams.get("key"), "wholesale");
    assert.equal(calls[1].url.pathname, "/v1/stores/second-store/customer-groups");
    assert.equal(calls[1].url.searchParams.has("key"), false);
    for (const call of calls) {
      assert.equal(call.method ?? "GET", "GET");
      assert.equal(call.body, undefined);
    }
  } finally {
    restore();
  }
});
