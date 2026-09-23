import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin, createStorefront } from "../dist/index.js";

test("Classification discovery keeps native filters and paged children across both clients", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: "classification:+/=" }), { headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ baseUrl: "https://classification.test", storeId: "store" });
  const storefront = createStorefront(`arky_pk_${"s".repeat(43)}`, {
    apiUrl: "https://classification.test", market: "market-contract",
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} }
  });
  const filters = { parent_id: "parent", ids: ["first", "second"], key: "topics", status: "active", query: "topics", limit: 1, sort_field: "key", sort_direction: "asc", created_at_from: 0, created_at_to: 2 };
  const page = await admin.classification.find(filters);
  assert.deepEqual(page, { items: [], cursor: "classification:+/=" });
  await admin.classification.find({ ...filters, cursor: page.cursor });
  assert.deepEqual(JSON.parse(calls[0].url.searchParams.get("ids")), filters.ids);
  for (const [key, value] of Object.entries(filters).filter(([key]) => key !== "ids"))
    assert.equal(calls[0].url.searchParams.get(key), String(value));
  assert.equal(calls[1].url.searchParams.get("cursor"), page.cursor);
  for (const client of [admin, storefront]) {
    const children = await client.classification.getChildren({ id: "parent", limit: 1 });
    assert.deepEqual(children, { items: [], cursor: "classification:+/=" });
    await client.classification.getChildren({ id: "parent", limit: 1, cursor: children.cursor });
    assert.equal(calls.at(-1).url.searchParams.get("cursor"), children.cursor);
    assert.equal(calls.at(-1).url.searchParams.get("limit"), "1");
    assert.equal(calls.at(-1).url.searchParams.has("id"), false);
  }
  assert.equal(calls[2].url.pathname, "/v1/stores/store/classifications/parent/children");
  assert.equal(calls[4].url.pathname, "/v1/storefront/classifications/parent/children");
  assert.ok(calls.every(call => call.method === "GET" && call.body === undefined));
});

test("Classification writes use existing tagged statuses and keep path identities out of the body", async (context) => {
  const calls = [];
  const root = { id: "classification", store_id: "store", key: "topics", parent_id: null, schema: [],
    status: { type: "active" }, created_at: 1, updated_at: 1 };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ url: new URL(url), method: init.method, body });
    return new Response(JSON.stringify({ ...root, ...body }), { headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://classification.test", storeId: "store" }).classification;
  assert.deepEqual(await api.create({ key: "topics", parent_id: null, schema: [] }), root);
  const updated = await api.update({ id: root.id, store_id: "store", status: { type: "archived" } });
  assert.deepEqual(updated.status, { type: "archived" });
  assert.deepEqual(calls[1].body, { status: { type: "archived" } });
  assert.equal(calls[1].url.pathname, "/v1/stores/store/classifications/classification");
});
