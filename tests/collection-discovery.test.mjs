import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { SessionStorage } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "7a3f9e21-5c84-4d06-b2e9-0f1d6c8a4b73";
const COLLECTION_ID = "2c4e6a8b-0d1f-4a3c-9e5b-7d9f1b3d5e6a";
const ENTRY_ID = "3d5f7b9c-1e2a-4b4d-8f6c-8e0a2c4e6f7b";
const publishableKey = `arky_pk_${"s".repeat(43)}`;

function admin() {
  return createAdmin({ baseUrl: "https://content-contract.test", apiToken: "arky_api_content" });
}

test("Collection discovery retains native filters and empty-page continuation", async (context) => {
  const calls = [];
  const collection = { id: COLLECTION_ID, store_id: STORE_ID, key: "guides", schema: [], blocks: [], status: { type: "archived" }, created_at: 1, updated_at: 2 };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify(calls.length === 1 ? { items: [], cursor: "next:+/=" } : { items: [collection], cursor: null }), { headers: { "content-type": "application/json" } });
  });
  const api = admin().content.collection;
  const filters = { ids: [COLLECTION_ID, "second"], key: "guides", query: "guide", status: "archived", sort_field: "key", sort_direction: "asc", limit: 0, created_at_from: 0, created_at_to: 2 };
  const first = await api.find({ store_id: STORE_ID, ...filters });
  assert.deepEqual(first, { items: [], cursor: "next:+/=" });
  assert.deepEqual(await api.find({ store_id: STORE_ID, ...filters, cursor: first.cursor }), { items: [collection], cursor: null });
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.method, "GET");
    assert.equal(call.body, undefined);
    assert.equal(call.url.pathname, `/v1/stores/${STORE_ID}/collections`);
    assert.equal(call.url.searchParams.has("store_id"), false);
    assert.deepEqual(JSON.parse(call.url.searchParams.get("ids")), filters.ids);
    for (const [key, value] of Object.entries(filters).filter(([key]) => key !== "ids")) {
      assert.equal(call.url.searchParams.get(key), String(value));
    }
  }
  assert.equal(calls[0].url.searchParams.has("cursor"), false);
  assert.equal(calls[1].url.searchParams.get("cursor"), "next:+/=");
});

test("Collection writes carry the app-picked id, typed schema and tagged editorial status with the version", async (context) => {
  const calls = [];
  const schema = [{ id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", key: "heading", type: { type: "localized_text", required: true } }];
  const collection = { id: COLLECTION_ID, store_id: STORE_ID, key: "guides", schema, blocks: [], status: { type: "active" }, created_at: 1, updated_at: 1 };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ url: new URL(url), method: init.method, body });
    return new Response(JSON.stringify({ ...collection, ...body }), { headers: { "content-type": "application/json" } });
  });
  const api = admin().content.collection;
  assert.deepEqual(await api.create({ store_id: STORE_ID, id: COLLECTION_ID, key: "guides", schema, blocks: [] }), collection);
  const updated = await api.update({ store_id: STORE_ID, id: COLLECTION_ID, expected_updated_at: 1, status: { type: "archived" } });
  assert.deepEqual(updated.status, { type: "archived" });
  await api.get({ store_id: STORE_ID, key: "guides/all" });
  await api.get({ store_id: STORE_ID, id: COLLECTION_ID });
  assert.deepEqual(calls.map(({ method, url, body }) => [method, url.pathname, body]), [
    ["POST", `/v1/stores/${STORE_ID}/collections`, { id: COLLECTION_ID, key: "guides", schema, blocks: [] }],
    ["PUT", `/v1/stores/${STORE_ID}/collections/${COLLECTION_ID}`, { expected_updated_at: 1, status: { type: "archived" } }],
    ["GET", `/v1/stores/${STORE_ID}/collections/by-key/guides%2Fall`, undefined],
    ["GET", `/v1/stores/${STORE_ID}/collections/${COLLECTION_ID}`, undefined],
  ]);
  await assert.rejects(async () => api.create({ store_id: STORE_ID, id: "guides", key: "guides", schema, blocks: [] }), TypeError);
  await assert.rejects(async () => api.get({ key: "guides" }), TypeError);
  assert.equal(calls.length, 4);
});

test("Entry discovery preserves Block predicates, native ordering and opaque continuations for both clients", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: "entry:+/=" }), { headers: { "content-type": "application/json" } });
  });
  const filters = {
    collection_id: COLLECTION_ID, query: "heading", key: "guide",
    filters: [{ type: "localized_text", key: "heading", locale: "en", values: ["Exact title"] }],
    sort_field: "key", sort_direction: "desc", limit: 0,
  };
  for (const [client, target] of [
    [admin(), { store_id: STORE_ID, status: "active" }],
    [createStorefront(publishableKey, { apiUrl: "https://entry.test", locale: "en", market: "market-contract", sessionStorage: new SessionStorage() }), {}],
  ]) {
    const page = await client.content.entry.find({ ...target, ...filters });
    assert.deepEqual(page, { items: [], cursor: "entry:+/=" });
    await client.content.entry.find({ ...target, ...filters, cursor: page.cursor });
    const [first, next] = calls.slice(-2);
    assert.equal(next.url.searchParams.get("cursor"), "entry:+/=");
    assert.equal(first.url.searchParams.has("cursor"), false);
    for (const call of [first, next]) {
      assert.equal(call.method, "GET");
      assert.equal(call.body, undefined);
      assert.equal(call.url.searchParams.has("store_id"), false);
      assert.equal(call.url.searchParams.has("language"), false);
      assert.deepEqual(JSON.parse(call.url.searchParams.get("filters")), filters.filters);
      for (const [key, value] of Object.entries(filters).filter(([key]) => key !== "filters")) {
        assert.equal(call.url.searchParams.get(key), String(value));
      }
    }
  }
  assert.equal(calls[0].url.pathname, `/v1/stores/${STORE_ID}/entries`);
  assert.equal(calls[0].url.searchParams.get("status"), "active");
  assert.equal(calls[2].url.pathname, "/v1/storefront/entries");
});

test("entry slug lookups name their collection; Admin names the language and the storefront sends it only as X-Arky-Locale", async (context) => {
  const calls = [];
  const entry = { id: ENTRY_ID, store_id: STORE_ID, collection_id: COLLECTION_ID, key: "guide", slugs: { bs: "vodic", en: "guide" }, blocks: [], status: { type: "active" }, created_at: 1, updated_at: 1 };
  let items = [entry];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), headers: new Headers(init.headers) });
    return new Response(JSON.stringify({ items, cursor: null }), { headers: { "content-type": "application/json" } });
  });
  assert.deepEqual(await admin().content.entry.findBySlug({ store_id: STORE_ID, collection_id: COLLECTION_ID, slug: "vodic", language: "bs" }), entry);
  const storefront = createStorefront(publishableKey, { apiUrl: "https://entry.test", locale: "bs", sessionStorage: new SessionStorage() });
  assert.deepEqual(await storefront.content.entry.findBySlug({ collection_id: COLLECTION_ID, slug: "vodic", language: "en" }), entry);
  items = [];
  assert.equal(await storefront.content.entry.findBySlug({ collection_id: COLLECTION_ID, slug: "missing" }), null);
  assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), { collection_id: COLLECTION_ID, slug: "vodic", language: "bs" });
  assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { collection_id: COLLECTION_ID, slug: "vodic" });
  assert.equal(calls[1].url.pathname, "/v1/storefront/entries");
  assert.equal(calls[1].headers.get("x-arky-locale"), "bs");
  assert.equal(calls[0].headers.has("x-arky-locale"), false);
});

test("Entry writes use the app-picked id, slugs per language, tagged status and exact id batches without list cursors", async (context) => {
  const calls = [];
  const entry = { id: ENTRY_ID, collection_id: COLLECTION_ID, store_id: STORE_ID, key: "guide", slugs: { en: "guide" }, blocks: [], status: { type: "draft" }, created_at: 1, updated_at: 1 };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    if (init.method === "DELETE") return new Response(JSON.stringify({ deleted: true }), { headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify(init.method === "GET" ? { items: [entry], cursor: null } : entry), { headers: { "content-type": "application/json" } });
  });
  const api = admin().content.entry;
  await api.create({ store_id: STORE_ID, id: ENTRY_ID, collection_id: COLLECTION_ID, key: "guide", slugs: { en: "guide" }, blocks: [] });
  assert.deepEqual(calls[0].body, { id: ENTRY_ID, collection_id: COLLECTION_ID, key: "guide", slugs: { en: "guide" }, blocks: [] });
  assert.deepEqual((await api.update({ store_id: STORE_ID, id: ENTRY_ID, expected_updated_at: 1, status: { type: "draft" } })).status, { type: "draft" });
  assert.equal(calls[1].url.pathname, `/v1/stores/${STORE_ID}/entries/${ENTRY_ID}`);
  assert.deepEqual(calls[1].body, { expected_updated_at: 1, status: { type: "draft" } });
  assert.deepEqual(await api.findByIds({ store_id: STORE_ID, ids: [ENTRY_ID] }), { items: [entry], cursor: null });
  assert.equal(calls[2].url.pathname, `/v1/stores/${STORE_ID}/entries`);
  assert.deepEqual(JSON.parse(calls[2].url.searchParams.get("ids")), [ENTRY_ID]);
  assert.equal(calls[2].url.searchParams.has("cursor"), false);
  assert.equal(calls[2].url.searchParams.has("collection_id"), false);
  assert.deepEqual(await api.delete({ store_id: STORE_ID, id: ENTRY_ID, expected_updated_at: 2 }), { deleted: true });
  assert.equal(calls[3].url.search, "?expected_updated_at=2");
  await assert.rejects(async () => api.create({ store_id: STORE_ID, id: "guide", collection_id: COLLECTION_ID, key: "guide", slugs: {}, blocks: [] }), TypeError);
  assert.equal(calls.length, 4);
});
