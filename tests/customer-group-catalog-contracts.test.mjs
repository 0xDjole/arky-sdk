import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/index.js";

const apiUrl = "https://api.example.test";
const groupId = "350082ac-9c53-497a-a7b2-4ecb36e1b53c";
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
    for (const commercial of ["price", "currency", "amount", "type", "term", "benefits"]) {
      assert.equal(commercial in calls[0].body, false, commercial);
    }
    assert.equal("store_id" in calls[0].body, false);
  } finally {
    restore();
  }
});

test("a CustomerGroupPlan owns the commercial term and its benefit allocation", async () => {
  const plan = {
    id: planId,
    store_id: "selected-store",
    customer_group_id: groupId,
    key: "monthly",
    name_block_id: "name-block",
    blocks: [],
    term: { type: "permanent" },
    membership_allocation_weight: 1,
    membership_tax_category_id: null,
    benefits: [],
    status: { type: "active" },
    starts_at: null,
    ends_at: null,
    created_at: 1788862721000,
    updated_at: 1788862721000,
  };
  const { calls, restore } = capture(plan);
  try {
    const saved = await admin().eshop.customerGroupPlan.create({
      store_id: "selected-store",
      customer_group_id: groupId,
      key: "monthly",
      name_block_id: "name-block",
      blocks: [],
      term: { type: "permanent" },
      membership_allocation_weight: 1,
      membership_tax_category_id: null,
      benefits: [],
      status: { type: "active" },
      starts_at: null,
      ends_at: null,
    });
    assert.equal(saved.customer_group_id, groupId);
    assert.deepEqual(saved.term, { type: "permanent" });
    assert.equal(calls.length, 1);
    assert.equal(
      calls[0].url.pathname,
      "/v1/stores/selected-store/customer-group-plans",
    );
    assert.equal(calls[0].method, "POST");
    assert.equal(calls[0].body.customer_group_id, groupId);
    assert.equal("store_id" in calls[0].body, false);
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
