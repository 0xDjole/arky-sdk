import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

test("Promotion discovery preserves scoped combined filters, opaque continuation and exact reads", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const store = "75669224-5b13-4994-a4a7-98b0d3d90d89";
  const id = "52718a47-c06b-49aa-b3a7-1ac29f9756a3";
  const codeId = "d31aa72d-5d0e-4b7f-b757-aab89c610d27";
  const cursor = "opaque:/+=page";
  const policy = { id, store_id: store, key: "winter-sale", status: { type: "active" } };
  const code = { id: codeId, store_id: store, promotion_id: id, code: "WINTER_10", status: { type: "active" } };
  const replies = [
    { items: [], cursor }, { items: [policy], cursor: null }, policy,
    { items: [], cursor }, { items: [code], cursor: null }, code,
    { ...policy, status: { type: "deleting" } }, undefined,
    { ...code, status: { type: "deleting" } }, undefined,
  ];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET", headers: new Headers(init.headers) });
    const reply = replies.shift();
    return reply === undefined
      ? new Response(null, { status: 204 })
      : new Response(JSON.stringify(reply), { status: calls.length === 7 || calls.length === 9 ? 202 : 200, headers: { "content-type": "application/json" } });
  };
  try {
    const admin = createAdmin({ storeId: "different-default", market: "configured-market", baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
    const policyQuery = { store_id: store, key: policy.key, status: "active", limit: 20 };
    const first = await admin.eshop.promotion.find(policyQuery);
    assert.deepEqual(first, { items: [], cursor });
    assert.equal(calls.length, 1);
    assert.deepEqual(await admin.eshop.promotion.find({ ...policyQuery, cursor: first.cursor }), { items: [policy], cursor: null });
    assert.deepEqual(await admin.eshop.promotion.getByKey({ store_id: store, key: policy.key }), policy);
    const codeQuery = { store_id: store, promotion_id: id, code: code.code, status: "active", limit: 20 };
    const codePage = await admin.eshop.promotionCode.find(codeQuery);
    assert.deepEqual(codePage, { items: [], cursor });
    assert.deepEqual(await admin.eshop.promotionCode.find({ ...codeQuery, cursor: codePage.cursor }), { items: [code], cursor: null });
    assert.deepEqual(await admin.eshop.promotionCode.getByCode({ store_id: store, code: code.code }), code);
    assert.equal((await admin.eshop.promotion.delete({ store_id: store, id, expected_updated_at: 123 })).status.type, "deleting");
    assert.equal(await admin.eshop.promotion.delete({ store_id: store, id, expected_updated_at: 123 }), undefined);
    assert.equal((await admin.eshop.promotionCode.delete({ store_id: store, id: codeId, expected_updated_at: 456 })).status.type, "deleting");
    assert.equal(await admin.eshop.promotionCode.delete({ store_id: store, id: codeId, expected_updated_at: 456 }), undefined);
    assert.equal(calls.length, 10);
    assert.ok(calls.every((call) => call.url.pathname.startsWith(`/v1/stores/${store}/`) && call.headers.get("authorization") === "Bearer arky_api_test"));
    assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { key: policy.key, status: "active", limit: "20", cursor });
    assert.deepEqual(Object.fromEntries(calls[4].url.searchParams), { promotion_id: id, code: code.code, status: "active", limit: "20", cursor });
    assert.equal(calls[2].url.pathname, `/v1/stores/${store}/promotions/by-key/${policy.key}`);
    assert.equal(calls[5].url.pathname, `/v1/stores/${store}/promotion-codes/by-code/${code.code}`);
    assert.equal(calls[2].url.search, "");
    assert.equal(calls[5].url.search, "");
    assert.ok(calls.slice(6).every((call) => call.method === "DELETE"));
    assert.deepEqual(Object.fromEntries(calls[6].url.searchParams), { expected_updated_at: "123" });
    assert.deepEqual(Object.fromEntries(calls[8].url.searchParams), { expected_updated_at: "456" });
    assert.deepEqual(policyQuery, { store_id: store, key: policy.key, status: "active", limit: 20 });
    assert.deepEqual(codeQuery, { store_id: store, promotion_id: id, code: code.code, status: "active", limit: 20 });
  } finally { globalThis.fetch = originalFetch; }
});
