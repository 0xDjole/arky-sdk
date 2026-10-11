import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";

const storeId = "3b21b61d-7162-414c-a73a-888ccbc57c3e";
const otherStoreId = "7f3a7a66-3403-4112-b5e5-d004a62d00b0";
const id = "d65211c1-743f-45fb-ab24-07221b1e3a7c";
const catalogId = "8a6d4f2b-9c1e-4e57-b3a8-1f6c9e2d4b70";
const marketId = "5e8b0c7d-1f24-4a9e-b6d3-2c7a9f4e0b18";
const channelId = "9a4e2c71-5b38-4d06-8f1e-3c7b9d2a6e54";
const now = 1788862721000;
const sellable = { type: "product_variant", product_id: id, variant_id: otherStoreId };
const definitions = [
  {
    owner: "price",
    route: "prices",
    create: {
      catalog_id: catalogId,
      sellable,
      amount: 2500,
      compare_at: 3000,
      min_quantity: 1,
      max_quantity: 9,
      schedule: { type: "scheduled", starts_at: now, ends_at: now + 86_400_000 },
      status: { type: "active" },
    },
    update: {
      amount: 2000,
      compare_at: null,
      min_quantity: 10,
      max_quantity: null,
      schedule: { type: "always" },
      status: { type: "archived" },
    },
    query: { catalog_id: catalogId, sellable, status: "active", sort_field: "updated_at", sort_direction: "asc" },
    deletion: "empty",
  },
  {
    owner: "catalog",
    route: "catalogs",
    create: { key: "retail", market_id: marketId, schedule: { type: "always" }, status: { type: "active" } },
    update: { schedule: { type: "scheduled", starts_at: now, ends_at: null }, status: { type: "archived" } },
    query: { key: "retail", market_id: marketId, status: "draft", sort_field: "key", sort_direction: "desc" },
    deletion: "deleting",
  },
  {
    owner: "catalogItem",
    route: "catalog-items",
    create: { catalog_id: catalogId, item: { type: "product", product_id: id } },
    update: { position: -2147483648 },
    query: { catalog_id: catalogId, item: { type: "booking_service", booking_service_id: id } },
    deletion: "empty",
  },
  {
    owner: "catalogAccess",
    route: "catalog-accesses",
    create: {
      catalog_id: catalogId,
      audience: { type: "company_location", company_location_id: id },
      channels: { type: "only", sales_channel_ids: [channelId] },
      level: { type: "see_prices" },
    },
    query: { catalog_id: catalogId, sort_field: "created_at", sort_direction: "desc" },
    deletion: "empty",
  },
];

for (const definition of definitions) {
  test(`${definition.owner} uses exact Store routes, app-picked ids, bodies and versioned deletion`, async (context) => {
    const calls = [];
    const record = { id, store_id: otherStoreId, ...definition.create, created_at: now, updated_at: now };
    const deleting = { ...record, status: { type: "deleting" } };
    context.mock.method(globalThis, "fetch", async (url, init = {}) => {
      const parsed = new URL(url);
      const call = { url: parsed, method: init.method ?? "GET", headers: new Headers(init.headers), body: init.body ? JSON.parse(init.body) : null };
      calls.push(call);
      if (call.method === "DELETE" && definition.deletion === "empty") return new Response(null, { status: 204 });
      const body = call.method === "DELETE"
        ? deleting
        : call.method === "GET" && parsed.pathname.endsWith(`/${definition.route}`)
          ? { items: [record], cursor: "next-page" }
          : record;
      return new Response(JSON.stringify(body), {
        status: call.method === "DELETE" ? 202 : call.method === "POST" ? 201 : 200,
        headers: { "content-type": "application/json" },
      });
    });
    const client = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
    const api = client.eshop[definition.owner];
    assert.deepEqual(await api.create({ store_id: otherStoreId, id, ...definition.create }), record);
    if (definition.update) {
      assert.deepEqual(await api.update({ store_id: otherStoreId, id, expected_updated_at: now, ...definition.update }), record);
    } else {
      assert.equal("update" in api, false);
    }
    assert.deepEqual(await api.get({ store_id: otherStoreId, id }), record);
    assert.deepEqual(
      await api.find({ store_id: otherStoreId, ...definition.query, limit: 20, cursor: "previous-page" }),
      { items: [record], cursor: "next-page" },
    );
    const deleted = await api.delete({ store_id: otherStoreId, id, expected_updated_at: now });
    assert.deepEqual(deleted, definition.deletion === "empty" ? undefined : deleting);
    const expectedCalls = definition.update ? 5 : 4;
    const findCall = calls[expectedCalls - 2];
    const deleteCall = calls[expectedCalls - 1];
    assert.equal(calls.length, expectedCalls);
    for (const call of calls) {
      assert.ok(call.url.pathname.startsWith(`/v1/stores/${otherStoreId}/${definition.route}`));
      assert.equal(call.headers.get("authorization"), "Bearer arky_api_test");
      assert.equal(call.url.searchParams.has("store_id"), false);
      assert.equal(call.body?.store_id, undefined);
    }
    assert.deepEqual(calls[0].body, { id, ...definition.create });
    if (definition.update) {
      assert.deepEqual(calls[1].body, { expected_updated_at: now, ...definition.update });
      assert.equal(calls[1].method, "PUT");
      assert.equal(calls[1].url.pathname, `/v1/stores/${otherStoreId}/${definition.route}/${id}`);
    }
    assert.equal(findCall.url.searchParams.get("cursor"), "previous-page");
    assert.equal(findCall.url.searchParams.get("limit"), "20");
    for (const [key, value] of Object.entries(definition.query)) {
      assert.equal(findCall.url.searchParams.get(key), typeof value === "object" ? JSON.stringify(value) : value);
    }
    assert.equal(deleteCall.url.searchParams.get("expected_updated_at"), String(now));
    assert.equal(deleteCall.method, "DELETE");
    assert.equal(deleteCall.body, null);
    for (const invented of [undefined, "retail", id.toUpperCase()]) {
      await assert.rejects(async () => api.create({ store_id: otherStoreId, ...definition.create, id: invented }), TypeError);
    }
    await assert.rejects(async () => api.get({ id: "invalid/segment?still-one-component" }), TypeError);
    await api.get({ store_id: storeId, id: "invalid/segment?still-one-component" });
    assert.equal(calls.at(-1).url.pathname, `/v1/stores/${storeId}/${definition.route}/invalid%2Fsegment%3Fstill-one-component`);
    assert.equal(calls.at(-1).url.search, "");
    assert.equal("usage" in api, false);
  });
}

test("price lists, assortments and catalog entitlements are gone from the Admin client", () => {
  const client = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
  for (const removed of ["priceList", "assortment", "assortmentItem", "catalogEntitlement"]) {
    assert.equal(removed in client.eshop, false);
  }
});

test("catalog management is not attached to the storefront acquisition API", () => {
  const storefront = createStorefront(`arky_pk_${"a".repeat(42)}A`);
  for (const { owner } of definitions) {
    assert.equal(owner in storefront, false);
    if (owner !== "catalog") assert.equal(owner in storefront.eshop, false);
  }
  assert.deepEqual(Object.keys(storefront.eshop.catalog), ["find"]);
});

test("buyer catalog reads use their exact routes and return the server answer", async (context) => {
  const customerId = "0c7f5b2e-8d41-4f6a-9b3c-5e2d1a7f8c90";
  const companyId = "1e8d4f2a-6c37-4b95-a0d1-7f3e5c9b2a68";
  const locationId = "6b2f9d4c-1a85-4e73-9c06-2d8f4a7e1b35";
  const catalog = { id, store_id: storeId, key: "partner-ba", market_id: marketId, schedule: { type: "always" }, status: { type: "active" }, created_at: now, updated_at: now };
  const storefrontCatalogs = [
    { id, key: "partner-ba", level: { type: "buy" } },
    { id: otherStoreId, key: "public-us", level: { type: "see_prices" } },
  ];
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method ?? "GET", headers: new Headers(init.headers), body: init.body ?? null });
    const body = parsed.pathname.startsWith("/v1/storefront/") ? storefrontCatalogs : [catalog];
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
  const customer = { store_id: storeId, market_id: marketId, sales_channel_id: channelId, customer_id: customerId };
  assert.deepEqual(await admin.eshop.catalog.findPurchasable(customer), [catalog]);
  assert.deepEqual(await admin.eshop.catalog.findPurchasable({ ...customer, company_location_id: locationId }), [catalog]);
  assert.deepEqual(await admin.eshop.catalog.findPurchasable({ ...customer, company_id: companyId }), [catalog]);
  const publishableKey = `arky_pk_${"b".repeat(42)}A`;
  const storefront = createStorefront(publishableKey, { apiUrl: "https://api.example.test", market: "us" });
  assert.deepEqual(await storefront.eshop.catalog.find(), storefrontCatalogs);
  assert.deepEqual(await storefront.eshop.catalog.find({ company_location_id: locationId }), storefrontCatalogs);
  assert.deepEqual(await storefront.eshop.catalog.find({ company_id: companyId }), storefrontCatalogs);
  const facade = initialize(publishableKey, { apiUrl: "https://api.example.test", market: "us" });
  assert.deepEqual(await facade.eshop.catalog.find(), storefrontCatalogs);
  assert.deepEqual(
    calls.map(({ url, method, body }) => [method, url.pathname, Object.fromEntries(url.searchParams), body]),
    [
      ["GET", `/v1/stores/${storeId}/catalogs/purchasable`, { market_id: marketId, sales_channel_id: channelId, customer_id: customerId }, null],
      ["GET", `/v1/stores/${storeId}/catalogs/purchasable`, { market_id: marketId, sales_channel_id: channelId, customer_id: customerId, company_location_id: locationId }, null],
      ["GET", `/v1/stores/${storeId}/catalogs/purchasable`, { market_id: marketId, sales_channel_id: channelId, customer_id: customerId, company_id: companyId }, null],
      ["GET", "/v1/storefront/catalogs", {}, null],
      ["GET", "/v1/storefront/catalogs", { company_location_id: locationId }, null],
      ["GET", "/v1/storefront/catalogs", { company_id: companyId }, null],
      ["GET", "/v1/storefront/catalogs", {}, null],
    ],
  );
  for (const call of calls.slice(3)) {
    assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
    assert.equal(call.headers.get("x-arky-market"), "us");
    assert.equal(call.headers.has("x-arky-sales-channel"), false);
  }
});

test("catalog copy and batch writes post their exact bodies with app-picked create ids", async (context) => {
  const calls = [];
  const copyResult = { items_created: 3, items_kept: 1, prices_created: 5, prices_kept: 0 };
  const price = { id, store_id: storeId, catalog_id: catalogId, sellable, amount: 990, schedule: { type: "always" }, created_at: now, updated_at: now };
  const item = { id, store_id: storeId, catalog_id: catalogId, item: { type: "product", product_id: id }, position: 1, created_at: now, updated_at: now };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null });
    const body = parsed.pathname.endsWith("/copy") ? copyResult : parsed.pathname.endsWith("/prices/batch") ? [price] : [item];
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const client = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
  assert.deepEqual(await client.eshop.catalog.copy({ store_id: storeId, id: catalogId, source_catalog_id: id }), copyResult);
  const priceOperations = [
    { type: "create", id, catalog_id: catalogId, sellable, amount: 990, compare_at: null, min_quantity: 1, max_quantity: null, schedule: { type: "scheduled", starts_at: now, ends_at: now + 1 }, status: { type: "active" } },
    { type: "update", id: otherStoreId, expected_updated_at: now, amount: 1000, compare_at: null, min_quantity: 1, max_quantity: null, schedule: { type: "always" }, status: { type: "active" } },
    { type: "delete", id: catalogId, expected_updated_at: now },
  ];
  assert.deepEqual(await client.eshop.price.batch({ store_id: storeId, operations: priceOperations }), [price]);
  const itemOperations = [
    { type: "create", id, catalog_id: catalogId, item: { type: "product", product_id: id } },
    { type: "update", id: otherStoreId, expected_updated_at: now, position: 2 },
    { type: "delete", id: catalogId, expected_updated_at: now },
  ];
  assert.deepEqual(await client.eshop.catalogItem.batch({ store_id: storeId, operations: itemOperations }), [item]);
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, body]), [
    ["POST", `/v1/stores/${storeId}/catalogs/${catalogId}/copy`, { source_catalog_id: id }],
    ["POST", `/v1/stores/${storeId}/prices/batch`, { operations: priceOperations }],
    ["POST", `/v1/stores/${storeId}/catalog-items/batch`, { operations: itemOperations }],
  ]);
  await assert.rejects(async () => client.eshop.price.batch({ store_id: storeId, operations: [{ ...priceOperations[0], id: "price-1" }] }), TypeError);
  await assert.rejects(async () => client.eshop.catalogItem.batch({ store_id: storeId, operations: [{ ...itemOperations[0], id: undefined }] }), TypeError);
  assert.equal(calls.length, 3);
});
