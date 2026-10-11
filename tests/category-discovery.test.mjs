import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin, createStorefront } from "../dist/index.js";
import { SessionStorage } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "4b6e2a91-0c5d-4f37-8a2e-1d9c7b3f5e08";
const CATEGORY_ID = "1f3b5d7e-9a2c-4e6b-8d0f-2a4c6e8b0d1f";
const publishableKey = `arky_pk_${"s".repeat(43)}`;

test("Category discovery keeps native filters and paged children across both clients", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: "category:+/=" }), { headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ baseUrl: "https://category.test", apiToken: "arky_api_category" });
  const storefront = createStorefront(publishableKey, {
    apiUrl: "https://category.test", market: "market-contract", sessionStorage: new SessionStorage(),
  });
  const filters = { parent_id: "parent", ids: ["first", "second"], key: "topics", status: "active", query: "topics", limit: 1, sort_field: "key", sort_direction: "asc", created_at_from: 0, created_at_to: 2 };
  const page = await admin.category.find({ store_id: STORE_ID, ...filters });
  assert.deepEqual(page, { items: [], cursor: "category:+/=" });
  await admin.category.find({ store_id: STORE_ID, ...filters, cursor: page.cursor });
  assert.equal(calls[0].url.pathname, `/v1/stores/${STORE_ID}/categories`);
  assert.equal(calls[0].url.searchParams.has("store_id"), false);
  assert.deepEqual(JSON.parse(calls[0].url.searchParams.get("ids")), filters.ids);
  for (const [key, value] of Object.entries(filters).filter(([key]) => key !== "ids")) {
    assert.equal(calls[0].url.searchParams.get(key), String(value));
  }
  assert.equal(calls[1].url.searchParams.get("cursor"), page.cursor);
  for (const [client, target] of [[admin, { store_id: STORE_ID }], [storefront, {}]]) {
    const children = await client.category.getChildren({ ...target, id: "parent", limit: 1 });
    assert.deepEqual(children, { items: [], cursor: "category:+/=" });
    await client.category.getChildren({ ...target, id: "parent", limit: 1, cursor: children.cursor });
    assert.equal(calls.at(-1).url.searchParams.get("cursor"), children.cursor);
    assert.equal(calls.at(-1).url.searchParams.get("limit"), "1");
    assert.equal(calls.at(-1).url.searchParams.has("id"), false);
    assert.equal(calls.at(-1).url.searchParams.has("store_id"), false);
  }
  assert.equal(calls[2].url.pathname, `/v1/stores/${STORE_ID}/categories/parent/children`);
  assert.equal(calls[4].url.pathname, "/v1/storefront/categories/parent/children");
  assert.ok(calls.every((call) => call.method === "GET" && call.body === undefined));
});

test("Category writes carry the app-picked id, tagged statuses and the version, keeping path identities out of the body", async (context) => {
  const calls = [];
  const root = { id: CATEGORY_ID, store_id: STORE_ID, key: "topics", parent_id: null, slugs: { en: "topics" }, blocks: [], schema: [], status: { type: "active" }, created_at: 1, updated_at: 1 };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ url: new URL(url), method: init.method, body });
    if (init.method === "DELETE") return new Response(JSON.stringify({ ...root, status: { type: "deleting" } }), { headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify({ ...root, ...body }), { headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://category.test", apiToken: "arky_api_category" }).category;
  const create = { id: CATEGORY_ID, key: "topics", parent_id: null, slugs: { en: "topics" }, blocks: [], schema: [] };
  assert.deepEqual(await api.create({ store_id: STORE_ID, ...create }), root);
  assert.equal(calls[0].url.pathname, `/v1/stores/${STORE_ID}/categories`);
  assert.deepEqual(calls[0].body, create);
  const updated = await api.update({ id: CATEGORY_ID, store_id: STORE_ID, expected_updated_at: 1, status: { type: "archived" } });
  assert.deepEqual(updated.status, { type: "archived" });
  assert.deepEqual(calls[1].body, { expected_updated_at: 1, status: { type: "archived" } });
  assert.equal(calls[1].url.pathname, `/v1/stores/${STORE_ID}/categories/${CATEGORY_ID}`);
  const deleting = await api.delete({ store_id: STORE_ID, id: CATEGORY_ID, expected_updated_at: 2 });
  assert.deepEqual(deleting.status, { type: "deleting" });
  assert.equal(calls[2].url.search, "?expected_updated_at=2");
  assert.equal(calls[2].body, undefined);
  for (const id of [undefined, "topics", CATEGORY_ID.toUpperCase()]) {
    await assert.rejects(async () => api.create({ store_id: STORE_ID, ...create, id }), TypeError);
  }
  assert.equal(calls.length, 3);
});

test("storefront category reads go by id or slug on the plain route and by key only through by-key", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), headers: new Headers(init.headers) });
    return new Response(JSON.stringify({ id: CATEGORY_ID }), { headers: { "content-type": "application/json" } });
  });
  const storefront = createStorefront(publishableKey, { apiUrl: "https://category.test", locale: "bs" });
  await storefront.category.get({ id: CATEGORY_ID });
  await storefront.category.get({ slug: "teme/sve" });
  await storefront.category.getByKey({ key: "topics" });
  await storefront.category.getByKey({ key: "a/b c" });
  assert.deepEqual(calls.map((call) => call.url.pathname), [
    `/v1/storefront/categories/${CATEGORY_ID}`,
    "/v1/storefront/categories/teme%2Fsve",
    "/v1/storefront/categories/by-key/topics",
    "/v1/storefront/categories/by-key/a%2Fb%20c",
  ]);
  for (const call of calls) {
    assert.equal(call.url.search, "");
    assert.equal(call.headers.get("x-arky-locale"), "bs");
  }
  assert.throws(() => storefront.category.get({ key: "topics" }), /id or its slug; a key is read with getByKey/);
  assert.equal(calls.length, 4);
});

test("a missing category on the plain route is a 404 and the SDK does not retry it as a key", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url) => {
    calls.push(new URL(url).pathname);
    return new Response(JSON.stringify({ message: "Category not found", error: "CATEGORY.NOT_FOUND", status_code: 404 }), { status: 404, headers: { "content-type": "application/json" } });
  });
  const storefront = createStorefront(publishableKey, { apiUrl: "https://category.test", locale: "bs" });
  await assert.rejects(storefront.category.get({ slug: "topics" }), (error) => error.statusCode === 404 && error.code === "CATEGORY.NOT_FOUND");
  assert.deepEqual(calls, ["/v1/storefront/categories/topics"]);
});

test("category answers on a record name each schema field by its id, never by its key", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    return new Response(JSON.stringify({ id: CATEGORY_ID }), { headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ baseUrl: "https://category.test", apiToken: "arky_api_category" });
  const productId = "6a8c0e2f-4b5d-4f7a-9c1e-3d5f7b9a1c2e";
  const categories = [{
    category_id: CATEGORY_ID,
    fields: [
      { type: "select_one", field_id: "f-size", option_key: "large" },
      { type: "select_many", field_id: "f-tags", option_keys: ["organic", "local"] },
      { type: "number", field_id: "f-weight", value: 1.5 },
      { type: "boolean", field_id: "f-fragile", value: false },
      { type: "geo_location", field_id: "f-origin", value: { lat: 43.8563, lon: 18.4131 } },
    ],
  }];
  await admin.eshop.product.update({ store_id: STORE_ID, id: productId, expected_updated_at: 1, categories });
  await admin.customers.update({ store_id: STORE_ID, id: productId, expected_updated_at: 2, categories });
  assert.deepEqual(calls.map(({ method, url, body }) => [method, url.pathname, body]), [
    ["PUT", `/v1/stores/${STORE_ID}/products/${productId}`, { expected_updated_at: 1, categories }],
    ["PATCH", `/v1/stores/${STORE_ID}/customers/${productId}`, { expected_updated_at: 2, categories }],
  ]);
  for (const call of calls) {
    for (const field of call.body.categories[0].fields) {
      assert.equal(typeof field.field_id, "string");
      assert.equal("key" in field, false);
    }
  }
});
