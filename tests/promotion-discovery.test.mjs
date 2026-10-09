import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const store = "75669224-5b13-4994-a4a7-98b0d3d90d89";
const id = "52718a47-c06b-49aa-b3a7-1ac29f9756a3";
const codeId = "d31aa72d-5d0e-4b7f-b757-aab89c610d27";

function eshop() {
  return createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop;
}

test("promotion discovery keeps scoped filters, the opaque continuation and exact reads by key or code", async (context) => {
  const cursor = "opaque:/+=page";
  const policy = { id, store_id: store, key: "winter-sale", status: { type: "active" } };
  const code = { id: codeId, store_id: store, promotion_id: id, code: "WINTER_10", status: { type: "active" } };
  const replies = [
    { items: [], cursor }, { items: [policy], cursor: null }, policy,
    { items: [], cursor }, { items: [code], cursor: null }, code,
    new Response(JSON.stringify({ ...policy, status: { type: "deleting" } }), { status: 202, headers: { "content-type": "application/json" } }),
    new Response(null, { status: 204 }),
    new Response(JSON.stringify({ ...code, status: { type: "deleting" } }), { status: 202, headers: { "content-type": "application/json" } }),
    new Response(null, { status: 204 }),
  ];
  const calls = recordFetch(context, () => replies.shift());
  const api = eshop();
  const policyQuery = { store_id: store, key: policy.key, status: "active", limit: 20 };
  const first = await api.promotion.find(policyQuery);
  assert.deepEqual(first, { items: [], cursor });
  assert.equal(calls.length, 1);
  assert.deepEqual(await api.promotion.find({ ...policyQuery, cursor: first.cursor }), { items: [policy], cursor: null });
  assert.deepEqual(await api.promotion.getByKey({ store_id: store, key: policy.key }), policy);
  const codeQuery = { store_id: store, promotion_id: id, code: code.code, status: "active", limit: 20 };
  const codePage = await api.promotionCode.find(codeQuery);
  assert.deepEqual(codePage, { items: [], cursor });
  assert.deepEqual(await api.promotionCode.find({ ...codeQuery, cursor: codePage.cursor }), { items: [code], cursor: null });
  assert.deepEqual(await api.promotionCode.getByCode({ store_id: store, code: "WINTER/10" }), code);
  assert.equal((await api.promotion.delete({ store_id: store, id, expected_updated_at: 123 })).status.type, "deleting");
  assert.equal(await api.promotion.delete({ store_id: store, id, expected_updated_at: 123 }), undefined);
  assert.equal((await api.promotionCode.delete({ store_id: store, id: codeId, expected_updated_at: 456 })).status.type, "deleting");
  assert.equal(await api.promotionCode.delete({ store_id: store, id: codeId, expected_updated_at: 456 }), undefined);
  assert.equal(calls.length, 10);
  assert.ok(calls.every((call) => call.path.startsWith(`/v1/stores/${store}/`) && call.headers.get("authorization") === "Bearer arky_api_test"));
  assert.deepEqual(calls[1].query, { key: policy.key, status: "active", limit: "20", cursor });
  assert.deepEqual(calls[4].query, { promotion_id: id, code: code.code, status: "active", limit: "20", cursor });
  assert.equal(calls[2].path, `/v1/stores/${store}/promotions/by-key/${policy.key}`);
  assert.equal(calls[5].path, `/v1/stores/${store}/promotion-codes/by-code/WINTER%2F10`);
  assert.equal(calls[2].url.search, "");
  assert.ok(calls.slice(6).every((call) => call.method === "DELETE"));
  assert.deepEqual(calls[6].query, { expected_updated_at: "123" });
  assert.deepEqual(calls[8].query, { expected_updated_at: "456" });
  assert.deepEqual(policyQuery, { store_id: store, key: policy.key, status: "active", limit: 20 });
});

test("a promotion is created under the app-picked id and may target whole categories on a schedule", async (context) => {
  const calls = recordFetch(context, () => ({ id }));
  const effect = { type: "item_percentage", id: "effect", target: { type: "categories", category_ids: ["coffee", "tea"] }, basis_points: 1000 };
  const create = {
    id,
    key: "warm-drinks",
    activation: { type: "automatic" },
    conditions: [{ type: "minimum_order_amount", money: { amount: 2000, currency: "eur" } }],
    effects: [effect],
    stacking: { type: "combinable" },
    priority: 0,
    max_uses: null,
    max_uses_per_customer: null,
    schedule: { type: "scheduled", starts_at: 1_800_000_000_000, ends_at: null },
    status: { type: "active" },
  };
  await eshop().promotion.create({ store_id: store, ...create });
  await eshop().promotion.update({ store_id: store, ...create, expected_updated_at: 2, schedule: { type: "always" } });
  const { id: _id, ...updateBody } = { ...create, expected_updated_at: 2, schedule: { type: "always" } };
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${store}/promotions`, create],
    ["PUT", `/v1/stores/${store}/promotions/${id}`, updateBody],
  ]);
  await assert.rejects(async () => eshop().promotion.create({ store_id: store, ...create, id: "warm-drinks" }), {
    name: "TypeError",
    message: "The promotion id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 2);
});

test("a promotion code is created under the app-picked id and edited by version", async (context) => {
  const calls = recordFetch(context, () => ({ id: codeId }));
  await eshop().promotionCode.create({ store_id: store, id: codeId, promotion_id: id, code: "WINTER_10", max_uses: 100, status: { type: "active" } });
  await eshop().promotionCode.update({ store_id: store, id: codeId, expected_updated_at: 3, code: "WINTER_10", max_uses: null, status: { type: "archived" } });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${store}/promotion-codes`, { id: codeId, promotion_id: id, code: "WINTER_10", max_uses: 100, status: { type: "active" } }],
    ["PUT", `/v1/stores/${store}/promotion-codes/${codeId}`, { expected_updated_at: 3, code: "WINTER_10", max_uses: null, status: { type: "archived" } }],
  ]);
  await assert.rejects(async () => eshop().promotionCode.create({ store_id: store, id: "WINTER_10", promotion_id: id, code: "WINTER_10", max_uses: null, status: { type: "active" } }), TypeError);
  assert.equal(calls.length, 2);
});
