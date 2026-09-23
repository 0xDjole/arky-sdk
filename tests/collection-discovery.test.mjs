import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";

test("Collection discovery retains native filters and empty-page continuation", async (context) => {
  const calls = [];
  const collection = { id: "collection", store_id: "store", key: "guides", schema: [], blocks: [],
    status: { type: "archived" }, created_at: 1, updated_at: 2 };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify(calls.length === 1 ? { items: [], cursor: "next:+/=" }
      : { items: [collection], cursor: null }), { headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://content-contract.test", storeId: "store" }).content.collection;
  const filters = { ids: ["collection", "second"], key: "guides", query: "guide", status: "archived",
    sort_field: "key", sort_direction: "asc", limit: 0, created_at_from: 0, created_at_to: 2 };
  const first = await api.find(filters);
  assert.deepEqual(first, { items: [], cursor: "next:+/=" });
  assert.deepEqual(await api.find({ ...filters, cursor: first.cursor }), { items: [collection], cursor: null });
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.method, "GET");
    assert.equal(call.body, undefined);
    assert.equal(call.url.pathname, "/v1/stores/store/collections");
    assert.deepEqual(JSON.parse(call.url.searchParams.get("ids")), filters.ids);
    for (const [key, value] of Object.entries(filters).filter(([key]) => key !== "ids")) {
      assert.equal(call.url.searchParams.get(key), String(value));
    }
  }
  assert.equal(calls[0].url.searchParams.has("cursor"), false);
  assert.equal(calls[1].url.searchParams.get("cursor"), "next:+/=");
});

test("Collection writes preserve explicit content and tagged editorial status", async (context) => {
  const calls = [];
  const collection = { id: "collection", store_id: "store", key: "guides", schema: [], blocks: [],
    status: { type: "active" }, created_at: 1, updated_at: 1 };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ url: new URL(url), method: init.method, body });
    return new Response(JSON.stringify({ ...collection, ...body }), { headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://content-contract.test", storeId: "store" }).content.collection;
  assert.deepEqual(await api.create({ key: "guides", schema: [], blocks: [] }), collection);
  const updated = await api.update({ id: collection.id, status: { type: "archived" } });
  assert.deepEqual(updated.status, { type: "archived" });
  assert.deepEqual(calls.map(({ method, body }) => ({ method, body })), [
    { method: "POST", body: { key: "guides", schema: [], blocks: [] } },
    { method: "PUT", body: { id: "collection", status: { type: "archived" } } },
  ]);
  assert.equal(calls[1].url.pathname, "/v1/stores/store/collections/collection");
});

test("Entry discovery preserves Block predicates, native ordering and opaque continuations for both clients", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: "entry:+/=" }), { headers: { "content-type": "application/json" } });
  });
  const filters = { collection_id: "collection", query: "heading", key: "guide", status: "active",
    filters: [{ type: "text", key: "heading", values: ["Exact title"] }],
    sort_field: "key", sort_direction: "desc", limit: 0 };
  for (const client of [createAdmin({ baseUrl: "https://entry.test", storeId: "store" }),
    createStorefront(`arky_pk_${"s".repeat(43)}`, { apiUrl: "https://entry.test", market: "market-contract",
      sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} } })]) {
    const page = await client.content.entry.find(filters);
    assert.deepEqual(page, { items: [], cursor: "entry:+/=" });
    await client.content.entry.find({ ...filters, cursor: page.cursor });
    const [first, next] = calls.slice(-2);
    assert.equal(next.url.searchParams.get("cursor"), "entry:+/=");
    assert.equal(first.url.searchParams.has("cursor"), false);
    for (const call of [first, next]) {
      assert.equal(call.method, "GET"); assert.equal(call.body, undefined);
      assert.deepEqual(JSON.parse(call.url.searchParams.get("filters")), filters.filters);
      for (const [key, value] of Object.entries(filters).filter(([key]) => key !== "filters")) {
        assert.equal(call.url.searchParams.get(key), String(value));
      }
    }
  }
  assert.equal(calls[0].url.pathname, "/v1/stores/store/entries");
  assert.equal(calls[2].url.pathname, "/v1/storefront/entries");
});

test("Entry writes use tagged status and exact ID batches do not depend on list cursors", async (context) => {
  const calls = [];
  const entry = { id: "entry", collection_id: "collection", store_id: "store", key: "guide", slug: {},
    blocks: [], status: { type: "draft" }, created_at: 1, updated_at: 1 };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    return new Response(JSON.stringify(init.method === "GET" ? { items: [entry], cursor: null } : entry),
      { headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://entry.test", storeId: "store" }).content.entry;
  assert.deepEqual((await api.update({ id: "entry", status: { type: "draft" } })).status, { type: "draft" });
  assert.deepEqual(calls[0].body, { id: "entry", status: { type: "draft" } });
  assert.deepEqual(await api.findByIds({ ids: ["entry"] }), { items: [entry], cursor: null });
  assert.deepEqual(JSON.parse(calls[1].url.searchParams.get("ids")), ["entry"]);
  assert.equal(calls[1].url.searchParams.has("cursor"), false);
  assert.equal(calls[1].url.searchParams.has("collection_id"), false);
});
