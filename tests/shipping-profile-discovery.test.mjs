import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const storeId = "3b21b61d-7162-414c-a73a-888ccbc57c3e";
const otherStore = "7f3a7a66-3403-4112-b5e5-d004a62d00b0";
const profile = {
  id: "d65211c1-743f-45fb-ab24-07221b1e3a7c", store_id: otherStore, key: "trade-shipping",
  status: { type: "active" }, created_at: 1788862721000, updated_at: 1788862721000,
};
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("shipping profile discovery forwards exact-key filters, ordering and empty-page continuation", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return response({ items: [], cursor: "continue-after-stale" });
  };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", storeId, apiToken: "arky_api_test" }).store.shippingProfile;
    const query = { key: "a".repeat(255), status: "archived", sort_field: "updated_at", sort_direction: "asc", limit: 20, cursor: "previous" };
    const signal = new AbortController().signal;
    assert.deepEqual(await api.find({ store_id: otherStore, ...query }, { signal }), { items: [], cursor: "continue-after-stale" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.pathname, `/v1/stores/${otherStore}/shipping-profiles`);
    for (const [key, value] of Object.entries(query)) assert.equal(calls[0].url.searchParams.get(key), String(value));
    assert.equal(calls[0].url.searchParams.has("store_id"), false);
    assert.equal(calls[0].init.signal, signal);
  } finally { globalThis.fetch = original; }
});

test("shipping profile exact-key lookup does not list or create and preserves server failures", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url: new URL(url), init }); return response(profile); };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", storeId, apiToken: "arky_api_test" }).store.shippingProfile;
    assert.deepEqual(await api.getByKey({ store_id: otherStore, key: "one/segment?only" }), profile);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.pathname, `/v1/stores/${otherStore}/shipping-profiles/by-key/one%2Fsegment%3Fonly`);
    assert.equal(calls[0].url.search, "");
    assert.equal(calls[0].init.method ?? "GET", "GET");
    for (const status of [400, 403, 404, 409, 503]) {
      let count = 0;
      globalThis.fetch = async () => { count += 1; return response({ message: "Profile unavailable" }, status); };
      await assert.rejects(api.getByKey({ key: "missing" }), (error) => error.statusCode === status);
      assert.equal(count, 1);
    }
  } finally { globalThis.fetch = original; }
});
