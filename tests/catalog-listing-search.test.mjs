import assert from "node:assert/strict";
import test from "node:test";
import { createStorefront, initialize } from "../dist/storefront.js";
import { apiUrl, ids, idFactories, jsonResponse, publishableKey, recordFetch } from "./helpers/arky-fixtures.mjs";

const listing = {
  catalog_item_id: ids.catalogItem,
  catalog_id: ids.catalog,
  item: { type: "product", product_id: ids.product },
  position: -2147483648,
  content: { key: "classic", slugs: { en: "classic" }, blocks: [], categories: [] },
  access: { type: "see_prices" },
  currency: "eur",
  price_summary: { type: "comparable", basis: { type: "product_unit" }, min_amount: 900, max_amount: 1500, choice_count: 3 },
  matching_price: { catalog_item_price_id: ids.price, amount: 900, basis: { type: "product_unit" } },
  catalog_item_price_id: null,
};

const choice = {
  catalog_item_price_id: ids.price,
  sellable: { type: "product_variant", variant_id: ids.variant },
  content: { sku: "CL-1", blocks: [], basis: { type: "product_unit" } },
  price: { catalog_item_price_id: ids.price, tax_mode: "inclusive", unit_price: { amount: 900, currency: "eur" }, compare_at: null, priced_at: 1 },
};

function storefront() {
  return createStorefront(publishableKey, { ...idFactories, apiUrl, locale: "en", market: "eu" });
}

test("catalog search sends the catalog, buyer context, price flag and JSON selection, and answers the listing page as sent", async (context) => {
  const calls = recordFetch(context, () => ({ items: [listing], cursor: "next-cards" }));
  const selection = {
    types: ["product", "booking_service"],
    text: "kafa",
    categories: [{ category_id: ids.form, query: [] }],
    blocks: [{ type: "text", key: "origin", values: ["BA"] }],
    choice: { blocks: [{ type: "number", key: "grams", operation: "greater_than_or_equal", value: 250 }], price: { max_amount: 2000 } },
    price_basis: { type: "product_unit" },
    sort: "starting_price",
    direction: "desc",
  };
  const page = await storefront().eshop.catalogItem.find({
    catalog_id: ids.catalog,
    company_location_id: ids.companyLocation,
    include_price: true,
    selection,
    limit: 24,
    cursor: "previous-cards",
  });
  assert.deepEqual(page, { items: [listing], cursor: "next-cards" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].path, "/v1/storefront/catalog-items");
  assert.deepEqual(Object.keys(calls[0].query).sort(), ["catalog_id", "company_location_id", "cursor", "include_price", "limit", "selection"]);
  assert.equal(calls[0].query.catalog_id, ids.catalog);
  assert.equal(calls[0].query.company_location_id, ids.companyLocation);
  assert.equal(calls[0].query.include_price, "true");
  assert.equal(calls[0].query.limit, "24");
  assert.equal(calls[0].query.cursor, "previous-cards");
  assert.deepEqual(JSON.parse(calls[0].query.selection), selection);
  assert.equal(calls[0].headers.get("x-arky-publishable-key"), publishableKey);
  assert.equal(calls[0].headers.get("x-arky-market"), "eu");
  assert.equal(calls[0].headers.get("x-arky-locale"), "en");
});

test("an empty catalog search names only its catalog", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  assert.deepEqual(await storefront().eshop.catalogItem.find({ catalog_id: ids.catalog }), { items: [], cursor: null });
  assert.deepEqual(calls[0].query, { catalog_id: ids.catalog });
});

test("a listing is read by what it lists, with the catalog context and no price flag", async (context) => {
  const details = {
    catalog_item_id: ids.catalogItem,
    catalog_id: ids.catalog,
    item: { type: "customer_group", customer_group_id: ids.form },
    position: 3,
    content: listing.content,
    access: { type: "browse" },
  };
  const calls = recordFetch(context, () => details);
  const item = { type: "customer_group", customer_group_id: ids.form };
  assert.deepEqual(await storefront().eshop.catalogItem.getByParent({ catalog_id: ids.catalog, company_id: ids.company, item, include_price: true }), details);
  assert.equal(calls[0].path, "/v1/storefront/catalog-items/by-parent");
  assert.deepEqual(Object.keys(calls[0].query).sort(), ["catalog_id", "company_id", "item"]);
  assert.deepEqual(JSON.parse(calls[0].query.item), item);
});

test("a listing's choices page its prices under the encoded listing id", async (context) => {
  const calls = recordFetch(context, () => ({ items: [choice], cursor: "next-choices" }));
  const page = await storefront().eshop.catalogItem.findPrices({
    catalog_item_id: "listing/1",
    catalog_id: ids.catalog,
    include_price: true,
    limit: 50,
    cursor: "previous-choices",
  });
  assert.deepEqual(page, { items: [choice], cursor: "next-choices" });
  assert.equal(calls[0].path, "/v1/storefront/catalog-items/listing%2F1/prices");
  assert.deepEqual(calls[0].query, { catalog_id: ids.catalog, include_price: "true", limit: "50", cursor: "previous-choices" });
});

test("the store exposes the same catalog item reads and every refused read surfaces its status", async (context) => {
  const store = initialize(publishableKey, { ...idFactories, apiUrl, locale: "en" });
  assert.equal(store.eshop.catalogItem, store.client.eshop.catalogItem);
  assert.deepEqual(Object.keys(store.eshop.catalogItem), ["find", "getByParent", "findPrices"]);
  for (const [status, code] of [[403, "GENERAL.FORBIDDEN"], [409, "CATALOG.ACCESS_CHANGED"], [409, "SEARCH.RESULT_LIMIT"], [409, "CATALOG.CLOSED"]]) {
    context.mock.restoreAll();
    let count = 0;
    context.mock.method(globalThis, "fetch", async () => {
      count += 1;
      return jsonResponse({ message: "Refused", error: code, status_code: status, validation_errors: [] }, status);
    });
    await assert.rejects(store.eshop.catalogItem.find({ catalog_id: ids.catalog }), (error) => error.statusCode === status && error.code === code);
    assert.equal(count, 1);
  }
});
