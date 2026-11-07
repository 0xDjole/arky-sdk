import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import { fixedIdFactories, idFactories } from "./helpers/arky-fixtures.mjs";

const storeId = "3b21b61d-7162-414c-a73a-888ccbc57c3e";
const otherStoreId = "7f3a7a66-3403-4112-b5e5-d004a62d00b0";
const id = "d65211c1-743f-45fb-ab24-07221b1e3a7c";
const packageId = "8a6d4f2b-9c1e-4e57-b3a8-1f6c9e2d4b70";
const marketId = "5e8b0c7d-1f24-4a9e-b6d3-2c7a9f4e0b18";
const channelId = "9a4e2c71-5b38-4d06-8f1e-3c7b9d2a6e54";
const now = 1788862721000;
const sellable = { type: "product_variant", variant_id: otherStoreId };
const definitions = [
  {
    owner: "packageItemPrice",
    route: "package-item-prices",
    create: {
      package_item_id: id,
      sellable,
      amount: 2500,
      compare_at: { type: "amount", amount: 3000 },
      changes: [{ starts_at: now + 86_400_000, amount: 3000, compare_at: { type: "none" } }],
      schedule: { type: "scheduled", starts_at: now, ends_at: now + 86_400_000 },
      status: { type: "active" },
    },
    update: {
      amount: 2000,
      compare_at: { type: "none" },
      changes: [],
      schedule: { type: "always" },
      status: { type: "archived" },
    },
    query: { package_item_id: id, sellable, status: "active" },
    deletion: "empty",
  },
  {
    owner: "package",
    route: "packages",
    create: {
      key: "retail",
      blocks: [],
      renewal: { type: "never" },
      stay: { type: "any_time" },
      minimum: { type: "none" },
      schedule: { type: "always" },
      status: { type: "active" },
      items: [],
    },
    update: {
      blocks: [],
      renewal: { type: "never" },
      stay: { type: "any_time" },
      minimum: { type: "none" },
      schedule: { type: "scheduled", starts_at: now, ends_at: null },
      status: { type: "archived" },
      items: [],
    },
    query: { key: "retail", market_id: marketId, query: "milk", status: { type: "draft" }, package_offering_id: id, sort_field: "status", sort_direction: "desc" },
    deletion: "deleting",
  },
  {
    owner: "packageItem",
    route: "package-items",
    create: { package_id: packageId, market_id: marketId, item: { type: "product", product_id: id } },
    update: { position: -2147483648 },
    query: { package_id: packageId, market_id: marketId, item: { type: "booking_service", booking_service_id: id } },
    deletion: "empty",
  },
  {
    owner: "packageAccess",
    route: "package-accesses",
    create: {
      package_id: packageId,
      audience: { type: "company_location", company_location_id: id },
      channels: { type: "only", sales_channel_ids: [channelId] },
      level: { type: "see_prices" },
    },
    query: { package_id: packageId, sort_direction: "desc" },
    deletion: "empty",
    versioned: false,
  },
];

for (const definition of definitions) {
  test(`${definition.owner} uses exact Store routes, app-picked ids, bodies and ${definition.versioned === false ? "deletion by id alone" : "versioned deletion"}`, async (context) => {
    const calls = [];
    const record = definition.versioned === false
      ? { id, store_id: otherStoreId, ...definition.create, created_at: now }
      : { id, store_id: otherStoreId, ...definition.create, created_at: now, updated_at: now };
    const deleting = { ...record, status: { type: "deleting" } };
    context.mock.method(globalThis, "fetch", async (url, init = {}) => {
      const parsed = new URL(url);
      const call = { url: parsed, method: init.method ?? "GET", headers: new Headers(init.headers), body: init.body ? JSON.parse(init.body) : null };
      calls.push(call);
      if (call.method === "DELETE" && definition.deletion === "empty") return new Response(null, { status: 204 });
      const body = call.method === "DELETE"
        ? deleting
        : call.method === "GET" && parsed.pathname.endsWith(`/${definition.route}`)
          ? { items: [record], cursor: "next-page", ...definition.page }
          : record;
      return new Response(JSON.stringify(body), {
        status: call.method === "DELETE" ? 202 : call.method === "POST" ? 201 : 200,
        headers: { "content-type": "application/json" },
      });
    });
    const client = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
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
      { items: [record], cursor: "next-page", ...definition.page },
    );
    const deleted = await api.delete(definition.versioned === false ? { store_id: otherStoreId, id } : { store_id: otherStoreId, id, expected_updated_at: now });
    assert.deepEqual(deleted, definition.deletion === "empty" ? undefined : deleting);
    const expectedCalls = definition.update ? 5 : 4;
    const findCall = calls[expectedCalls - 2];
    const deleteCall = calls[expectedCalls - 1];
    assert.equal(calls.length, expectedCalls);
    for (const call of calls) {
      assert.ok(call.url.pathname.startsWith(`/v1/stores/${otherStoreId}/${definition.route}`));
      assert.equal(call.headers.get("authorization"), "Bearer arky_at_ttttttttttttttttttttttttttttttttttttttttttA");
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
    if (definition.versioned === false) {
      assert.equal(deleteCall.url.search, "");
    } else {
      assert.equal(deleteCall.url.searchParams.get("expected_updated_at"), String(now));
    }
    assert.equal(deleteCall.url.pathname, `/v1/stores/${otherStoreId}/${definition.route}/${id}`);
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

test("price lists, assortments and separate price roots are gone from the Admin client", () => {
  const client = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  for (const removed of ["priceList", "assortment", "assortmentItem", "price"]) {
    assert.equal(removed in client.eshop, false);
  }
});

test("one item's price for one choice is read by its exact choice route", async (context) => {
  const calls = [];
  const price = { id, store_id: storeId, package_id: packageId, package_item_id: packageId, package_item_updated_at: now, sellable, amount: 990, compare_at: { type: "none" }, changes: [], schedule: { type: "always" }, status: { type: "archived" }, created_at: now, updated_at: now };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET", headers: new Headers(init.headers), body: init.body ?? null });
    return new Response(JSON.stringify(price), { status: 200, headers: { "content-type": "application/json" } });
  });
  const client = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  assert.deepEqual(await client.eshop.packageItemPrice.getByChoice({ store_id: storeId, package_item_id: packageId, sellable }), price);
  assert.deepEqual(
    calls.map(({ url, method, body }) => [method, url.pathname, Object.fromEntries(url.searchParams), body]),
    [["GET", `/v1/stores/${storeId}/package-item-prices/by-choice`, { package_item_id: packageId, sellable: JSON.stringify(sellable) }, null]],
  );
  assert.equal(calls[0].headers.get("authorization"), "Bearer arky_at_ttttttttttttttttttttttttttttttttttttttttttA");
  for (const invented of [undefined, "retail", packageId.toUpperCase()]) {
    await assert.rejects(async () => client.eshop.packageItemPrice.getByChoice({ store_id: storeId, package_item_id: invented, sellable }), TypeError);
  }
  assert.equal(calls.length, 1);
});

test("package management is not attached to the storefront acquisition API", () => {
  const storefront = createStorefront(`arky_pk_${"a".repeat(42)}A`, idFactories);
  for (const { owner } of definitions) {
    assert.equal(owner in storefront, false);
    if (owner !== "package" && owner !== "packageItem") assert.equal(owner in storefront.eshop, false);
  }
  assert.deepEqual(Object.keys(storefront.eshop.package), ["find", "get", "getByKey", "getProductChoices", "joinFree"]);
  assert.deepEqual(Object.keys(storefront.eshop.packageItem), ["find", "getByParent", "findPrices"]);
});

test("buyer package reads use their exact routes and return the server answer", async (context) => {
  const customerId = "0c7f5b2e-8d41-4f6a-9b3c-5e2d1a7f8c90";
  const companyId = "1e8d4f2a-6c37-4b95-a0d1-7f3e5c9b2a68";
  const locationId = "6b2f9d4c-1a85-4e73-9c06-2d8f4a7e1b35";
  const shopPackage = { id, store_id: storeId, key: "partner-ba", blocks: [], renewal: { type: "never" }, stay: { type: "any_time" }, minimum: { type: "none" }, schedule: { type: "always" }, status: { type: "active" }, created_at: now, updated_at: now };
  const storefrontPackages = [
    { id, key: "partner-ba", level: { type: "buy" } },
    { id: otherStoreId, key: "public", level: { type: "see_prices" } },
  ];
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method ?? "GET", headers: new Headers(init.headers), body: init.body ?? null });
    const body = parsed.pathname.startsWith("/v1/storefront/") ? storefrontPackages : [shopPackage];
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const customer = { store_id: storeId, market_id: marketId, sales_channel_id: channelId, customer_id: customerId };
  assert.deepEqual(await admin.eshop.package.findPurchasable(customer), { items: [shopPackage], cursor: null });
  assert.deepEqual(await admin.eshop.package.findPurchasable({ ...customer, company_location_id: locationId }), { items: [shopPackage], cursor: null });
  assert.deepEqual(await admin.eshop.package.findPurchasable({ ...customer, company_id: companyId }), { items: [shopPackage], cursor: null });
  const publishableKey = `arky_pk_${"b".repeat(42)}A`;
  const storefront = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl: "https://api.example.test", market: "us" });
  assert.deepEqual(await storefront.eshop.package.find(), { items: storefrontPackages, cursor: null });
  assert.deepEqual(await storefront.eshop.package.find({ company_location_id: locationId }), { items: storefrontPackages, cursor: null });
  assert.deepEqual(await storefront.eshop.package.find({ company_id: companyId }), { items: storefrontPackages, cursor: null });
  const facade = initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl: "https://api.example.test", market: "us" });
  assert.deepEqual(await facade.eshop.package.find(), { items: storefrontPackages, cursor: null });
  assert.deepEqual(
    calls.map(({ url, method, body }) => [method, url.pathname, Object.fromEntries(url.searchParams), body]),
    [
      ["GET", `/v1/stores/${storeId}/packages/purchasable`, { market_id: marketId, sales_channel_id: channelId, customer_id: customerId }, null],
      ["GET", `/v1/stores/${storeId}/packages/purchasable`, { market_id: marketId, sales_channel_id: channelId, customer_id: customerId, company_location_id: locationId }, null],
      ["GET", `/v1/stores/${storeId}/packages/purchasable`, { market_id: marketId, sales_channel_id: channelId, customer_id: customerId, company_id: companyId }, null],
      ["GET", "/v1/storefront/packages", {}, null],
      ["GET", "/v1/storefront/packages", { company_location_id: locationId }, null],
      ["GET", "/v1/storefront/packages", { company_id: companyId }, null],
      ["GET", "/v1/storefront/packages", {}, null],
    ],
  );
  for (const call of calls.slice(3)) {
    assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
    assert.equal(call.headers.get("x-arky-market"), "us");
    assert.equal(call.headers.has("x-arky-sales-channel"), false);
  }
});

test("package copy and batch writes post their exact bodies with app-picked create ids", async (context) => {
  const calls = [];
  const copyResult = { items_created: 3, items_kept: 1, items_skipped: 1, prices_created: 5, prices_kept: 0, prices_skipped: 2, cursor: "copy-next" };
  const finished = { ...copyResult, cursor: null };
  const price = { id, store_id: storeId, package_id: packageId, package_item_id: id, package_item_updated_at: now, sellable, amount: 990, compare_at: { type: "none" }, changes: [], schedule: { type: "always" }, status: { type: "active" }, created_at: now, updated_at: now };
  const item = { id, store_id: storeId, package_id: packageId, type: { type: "product", market_id: marketId, product_id: id, prices: [{ variant_id: otherStoreId, price: { id, amount: 990, compare_at: { type: "none" }, changes: [], schedule: { type: "always" }, status: { type: "active" }, created_at: now, updated_at: now } }] }, position: 1, created_at: now, updated_at: now };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null });
    const copied = calls.filter((call) => call.url.pathname.endsWith("/copy")).length;
    const body = parsed.pathname.endsWith("/copy")
      ? (copied === 1 ? copyResult : finished)
      : parsed.pathname.endsWith("/package-item-prices/batch") ? [price] : [item];
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const client = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const markets = { source_market_id: marketId, target_market_id: otherStoreId };
  assert.deepEqual(await client.eshop.package.copy({ store_id: storeId, id: packageId, source_package_id: id, ...markets }), copyResult);
  assert.deepEqual(await client.eshop.package.copy({ store_id: storeId, id: packageId, source_package_id: id, ...markets, cursor: copyResult.cursor }), finished);
  const priceOperations = [
    { type: "create", id, package_item_id: id, sellable, amount: 990, compare_at: { type: "none" }, changes: [], schedule: { type: "scheduled", starts_at: now, ends_at: now + 1 }, status: { type: "active" } },
    { type: "update", id: otherStoreId, expected_updated_at: now, amount: 1000, compare_at: { type: "none" }, changes: [{ starts_at: now + 3_600_000, amount: 900, compare_at: { type: "amount", amount: 1000 } }], schedule: { type: "always" }, status: { type: "active" } },
    { type: "delete", id: packageId, expected_updated_at: now },
  ];
  assert.deepEqual(await client.eshop.packageItemPrice.batch({ store_id: storeId, operations: priceOperations }), [price]);
  const itemOperations = [
    { type: "create", id, package_id: packageId, market_id: marketId, item: { type: "product", product_id: id } },
    { type: "update", id: otherStoreId, expected_updated_at: now, position: 2 },
    { type: "delete", id: packageId, expected_updated_at: now },
  ];
  assert.deepEqual(await client.eshop.packageItem.batch({ store_id: storeId, operations: itemOperations }), [item]);
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, body]), [
    ["POST", `/v1/stores/${storeId}/packages/${packageId}/copy`, { source_package_id: id, ...markets, cursor: null }],
    ["POST", `/v1/stores/${storeId}/packages/${packageId}/copy`, { source_package_id: id, ...markets, cursor: "copy-next" }],
    ["POST", `/v1/stores/${storeId}/package-item-prices/batch`, { operations: priceOperations }],
    ["POST", `/v1/stores/${storeId}/package-items/batch`, { operations: itemOperations }],
  ]);
  await assert.rejects(async () => client.eshop.packageItemPrice.batch({ store_id: storeId, operations: [{ ...priceOperations[0], id: "price-1" }] }), TypeError);
  await assert.rejects(async () => client.eshop.packageItem.batch({ store_id: storeId, operations: [{ ...itemOperations[0], id: undefined }] }), TypeError);
  assert.equal(calls.length, 4);
});

test("one package save carries its automatic item operations, and an item's create id is the app's", async (context) => {
  const calls = [];
  const automatic = { type: "get_product", variant_ids: [id], quantity: 2, delivery: { type: "none" }, allocation_weight: 1 };
  const detail = { id, store_id: storeId, key: "club", blocks: [], renewal: { type: "never" }, stay: { type: "any_time" }, minimum: { type: "none" }, schedule: { type: "always" }, status: { type: "active" }, created_at: now, updated_at: now, items: [] };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(detail), { status: 200, headers: { "content-type": "application/json" } });
  });
  const client = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const fields = { blocks: [], renewal: { type: "never" }, stay: { type: "any_time" }, minimum: { type: "none" }, schedule: { type: "scheduled", starts_at: null, ends_at: now }, status: { type: "active" } };
  const operations = [
    { action: "create", id: packageId, type: automatic },
    { action: "update", id: otherStoreId, expected_updated_at: now, type: automatic },
    { action: "delete", id: storeId, expected_updated_at: now },
  ];
  assert.deepEqual(await client.eshop.package.create({ store_id: storeId, id, key: "club", ...fields, items: operations }), detail);
  assert.deepEqual(await client.eshop.package.update({ store_id: storeId, id, expected_updated_at: now, ...fields, items: operations }), detail);
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, body]), [
    ["POST", `/v1/stores/${storeId}/packages`, { id, key: "club", ...fields, items: operations }],
    ["PUT", `/v1/stores/${storeId}/packages/${id}`, { expected_updated_at: now, ...fields, items: operations }],
  ]);
  await assert.rejects(async () => client.eshop.package.create({ store_id: storeId, id, key: "club", ...fields, items: [{ action: "create", id: "item-1", type: automatic }] }), TypeError);
  await assert.rejects(async () => client.eshop.package.update({ store_id: storeId, id, expected_updated_at: now, ...fields, items: [{ action: "create", id: undefined, type: automatic }] }), TypeError);
  assert.equal(calls.length, 2);
});

test("archiving or scheduling all of an item's prices posts its one command with the item's version", async (context) => {
  const calls = [];
  const item = { id, store_id: storeId, package_id: packageId, type: { type: "product", market_id: marketId, product_id: id, prices: [] }, position: 1, created_at: now, updated_at: now };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(item), { status: 200, headers: { "content-type": "application/json" } });
  });
  const client = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const command = { expected_updated_at: now, status: { type: "archived" }, schedule: { type: "always" } };
  assert.deepEqual(await client.eshop.packageItem.setAllPrices({ store_id: storeId, id, ...command }), item);
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, body]), [
    ["POST", `/v1/stores/${storeId}/package-items/${id}/prices/all`, command],
  ]);
});

test("a price page names an item or a sellable and answers items and a cursor, with no sort or repair count", async (context) => {
  const calls = [];
  const page = { items: [], cursor: null };
  context.mock.method(globalThis, "fetch", async (url) => {
    calls.push(new URL(url));
    return new Response(JSON.stringify(page), { status: 200, headers: { "content-type": "application/json" } });
  });
  const client = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  assert.deepEqual(await client.eshop.packageItemPrice.find({ store_id: storeId, sellable, status: "archived", limit: 10 }), page);
  assert.deepEqual(Object.fromEntries(calls[0].searchParams), { sellable: JSON.stringify(sellable), status: "archived", limit: "10" });
});

test("a plan is listed together with its one price, and the price id is the app's", async (context) => {
  const calls = [];
  const priceId = "2c9e4b7a-1d63-4f85-9a0e-6b3d8c1f5e27";
  const planId = "4f1c2b8e-7a35-4d96-b0e2-9c6d3a1f5e87";
  const price = { id: priceId, amount: 0, compare_at: { type: "none" }, changes: [], schedule: { type: "always" }, status: { type: "active" } };
  const plan = { id, store_id: storeId, package_id: packageId, type: { type: "package", market_id: marketId, package_id: planId, price: { ...price, created_at: now, updated_at: now } }, position: 1, created_at: now, updated_at: now };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(parsed.pathname.endsWith("/batch") ? [plan] : plan), { status: 201, headers: { "content-type": "application/json" } });
  });
  const client = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const item = { type: "package", package_id: planId, price };
  assert.deepEqual(await client.eshop.packageItem.create({ store_id: storeId, id, package_id: packageId, market_id: marketId, item }), plan);
  assert.deepEqual(await client.eshop.packageItem.batch({ store_id: storeId, operations: [{ type: "create", id, package_id: packageId, market_id: marketId, item }] }), [plan]);
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, body]), [
    ["POST", `/v1/stores/${storeId}/package-items`, { id, package_id: packageId, market_id: marketId, item }],
    ["POST", `/v1/stores/${storeId}/package-items/batch`, { operations: [{ type: "create", id, package_id: packageId, market_id: marketId, item }] }],
  ]);
  for (const invented of [undefined, "price-1", priceId.toUpperCase()]) {
    const unpicked = { ...item, price: { ...price, id: invented } };
    await assert.rejects(async () => client.eshop.packageItem.create({ store_id: storeId, id, package_id: packageId, market_id: marketId, item: unpicked }), TypeError);
    await assert.rejects(async () => client.eshop.packageItem.batch({ store_id: storeId, operations: [{ type: "create", id, package_id: packageId, market_id: marketId, item: unpicked }] }), TypeError);
  }
  assert.equal(calls.length, 2);
  assert.equal("prices" in plan.type, false);
});
