import assert from "node:assert/strict";
import test from "node:test";
import { createStorefront, initialize } from "../dist/storefront.js";
import { apiUrl, ids, idFactories, jsonResponse, storefrontIdentity, recordFetch } from "./helpers/arky-fixtures.mjs";

const packageItem = {
  package_item_id: ids.packageItem,
  package_id: ids.package,
  market_id: ids.market,
  item: { type: "product", product_id: ids.product },
  position: -2147483648,
  content: { key: "classic", slugs: { en: "classic" }, blocks: [], categories: [] },
  access: { type: "see_prices" },
  currency: "eur",
  price_summary: { basis: { type: "product_unit" }, min_amount: 900, max_amount: 1500, price_count: 3 },
  price_id: null,
};

const choice = {
  price_id: ids.price,
  sellable: { type: "product_variant", variant_id: ids.variant },
  content: { sku: "CL-1", blocks: [], basis: { type: "product_unit" } },
  price: { package_id: ids.package, package_item_id: ids.packageItem, price_id: ids.price, tax_mode: "inclusive", unit_price: { amount: 900, currency: "eur" }, compare_at: null, priced_at: 1 },
};

function storefront() {
  return createStorefront(storefrontIdentity, { ...idFactories, apiUrl, locale: "en", market: "eu" });
}

test("package search sends the package, buyer context, price flag and JSON selection, and answers the page as sent", async (context) => {
  const calls = recordFetch(context, () => ({ items: [packageItem], cursor: "next-items" }));
  const selection = {
    types: ["product", "booking_service"],
    text: "kafa",
    categories: [{ category_id: ids.form, query: [] }],
    blocks: [{ type: "text", key: "origin", values: ["BA"] }],
    price: { max_amount: 2000 },
    price_basis: { type: "product_unit" },
    sort: "starting_price",
    direction: "desc",
  };
  const page = await storefront().eshop.packageItem.find({
    package_id: ids.package,
    company_location_id: ids.companyLocation,
    include_price: true,
    selection,
    limit: 24,
    cursor: "previous-items",
  });
  assert.deepEqual(page, { items: [packageItem], cursor: "next-items" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].path, "/v1/storefront/package-items");
  assert.deepEqual(Object.keys(calls[0].query).sort(), ["company_location_id", "cursor", "include_price", "limit", "package_id", "selection"]);
  assert.equal(calls[0].query.package_id, ids.package);
  assert.equal(calls[0].query.company_location_id, ids.companyLocation);
  assert.equal(calls[0].query.include_price, "true");
  assert.equal(calls[0].query.limit, "24");
  assert.equal(calls[0].query.cursor, "previous-items");
  assert.deepEqual(JSON.parse(calls[0].query.selection), selection);
  assert.equal(calls[0].headers.get("x-arky-store-id"), storefrontIdentity.storeId);
    assert.equal(calls[0].headers.get("x-arky-sales-channel-id"), storefrontIdentity.salesChannelId);
  assert.equal(calls[0].headers.get("x-arky-market"), "eu");
  assert.equal(calls[0].headers.get("x-arky-locale"), "en");
});

test("a free plan is found by its one price on its basis, and its answer names that price", async (context) => {
  const plan = {
    ...packageItem,
    item: { type: "package", package_id: ids.form },
    price_summary: { basis: { type: "package_never" }, min_amount: 0, max_amount: 0, price_count: 1 },
    price_id: ids.price,
  };
  const calls = recordFetch(context, () => ({ items: [plan], cursor: null }));
  const selection = { types: ["package"], price: { max_amount: 0 }, price_basis: { type: "package_never" } };
  const page = await storefront().eshop.packageItem.find({ package_id: ids.package, include_price: true, selection });
  assert.deepEqual(page, { items: [plan], cursor: null });
  assert.deepEqual(JSON.parse(calls[0].query.selection), selection);
  assert.deepEqual(Object.keys(page.items[0].price_summary).sort(), ["basis", "max_amount", "min_amount", "price_count"]);
  assert.equal(page.items[0].price_id, ids.price);
});

test("an empty package search names only its package", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  assert.deepEqual(await storefront().eshop.packageItem.find({ package_id: ids.package }), { items: [], cursor: null });
  assert.deepEqual(calls[0].query, { package_id: ids.package });
});

test("an item is read by what it lists, with the package context and no price flag", async (context) => {
  const details = {
    package_item_id: ids.packageItem,
    package_id: ids.package,
    market_id: ids.market,
    item: { type: "package", package_id: ids.form },
    position: 3,
    content: packageItem.content,
    access: { type: "browse" },
  };
  const calls = recordFetch(context, () => details);
  const item = { type: "package", package_id: ids.form };
  assert.deepEqual(await storefront().eshop.packageItem.getByParent({ package_id: ids.package, company_id: ids.company, item, include_price: true }), details);
  assert.equal(calls[0].path, "/v1/storefront/package-items/by-parent");
  assert.deepEqual(Object.keys(calls[0].query).sort(), ["company_id", "item", "package_id"]);
  assert.deepEqual(JSON.parse(calls[0].query.item), item);
});

test("an item's prices page under its encoded id, each carrying the reference a cart line names", async (context) => {
  const calls = recordFetch(context, () => ({ items: [choice], cursor: "next-choices" }));
  const page = await storefront().eshop.packageItem.findPrices({
    package_item_id: "item/1",
    package_id: ids.package,
    include_price: true,
    limit: 50,
    cursor: "previous-choices",
  });
  assert.deepEqual(page, { items: [choice], cursor: "next-choices" });
  assert.equal(calls[0].path, "/v1/storefront/package-items/item%2F1/prices");
  assert.deepEqual(calls[0].query, { package_id: ids.package, include_price: "true", limit: "50", cursor: "previous-choices" });
});

test("the store exposes the same package item reads and every refused read surfaces its status", async (context) => {
  const store = initialize(storefrontIdentity, { ...idFactories, apiUrl, locale: "en" });
  assert.equal(store.eshop.packageItem, store.client.eshop.packageItem);
  assert.deepEqual(Object.keys(store.eshop.packageItem), ["find", "getByParent", "findPrices"]);
  for (const [status, code] of [[403, "GENERAL.FORBIDDEN"], [409, "PACKAGE.ACCESS_CHANGED"], [409, "SEARCH.RESULT_LIMIT"], [409, "PACKAGE.CLOSED"]]) {
    context.mock.restoreAll();
    let count = 0;
    context.mock.method(globalThis, "fetch", async () => {
      count += 1;
      return jsonResponse({ message: "Refused", error: code, status_code: status, validation_errors: [] }, status);
    });
    await assert.rejects(store.eshop.packageItem.find({ package_id: ids.package }), (error) => error.statusCode === status && error.code === code);
    assert.equal(count, 1);
  }
});
