import assert from "node:assert/strict";
import test from "node:test";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch } from "./helpers/arky-fixtures.mjs";

function storefront() {
  return createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl });
}

test("a product's choices page through its listing and an exact variant read keeps the buyer context and encoded ids", async (context) => {
  const choice = {
    catalog_item_price_id: ids.price,
    sellable: { type: "product_variant", variant_id: "variant/one" },
    content: { sku: "S-1", blocks: [], basis: { type: "product_unit" } },
    price: null,
  };
  const responses = [
    { items: [], cursor: "next-page" },
    { items: [choice], cursor: null },
    { id: "variant/one", catalog_item_id: ids.catalogItem, price: { catalog_item_price_id: ids.price, unit_price: { amount: 0, currency: "usd" } } },
  ];
  const calls = recordFetch(context, () => responses.shift());
  const client = storefront();
  const selection = { catalog_item_id: ids.catalogItem, catalog_id: ids.catalog, company_location_id: ids.companyLocation, include_price: true, limit: 1 };
  const first = await client.eshop.catalogItem.findPrices(selection);
  assert.deepEqual(first, { items: [], cursor: "next-page" });
  const next = await client.eshop.catalogItem.findPrices({ ...selection, cursor: first.cursor });
  assert.equal(next.items[0].sellable.variant_id, "variant/one");
  const exact = await client.eshop.productVariant.get({ product_id: "product/one", id: "variant/one", catalog_id: ids.catalog, company_location_id: ids.companyLocation, include_price: true });
  assert.equal(exact.price.unit_price.amount, 0);
  assert.equal(exact.catalog_item_id, ids.catalogItem);
  assert.equal(calls[0].path, `/v1/storefront/catalog-items/${ids.catalogItem}/prices`);
  assert.equal(calls[1].query.cursor, "next-page");
  assert.equal(calls[2].path, "/v1/storefront/products/product%2Fone/variants/variant%2Fone");
  for (const call of calls) {
    assert.equal(call.query.catalog_id, ids.catalog);
    assert.equal("company_id" in call.query, false);
    assert.equal(call.query.company_location_id, ids.companyLocation);
    assert.equal(call.query.include_price, "true");
    assert.equal("store_id" in call.query, false);
    assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
  }
  assert.equal("find" in client.eshop.productVariant, false);
});

test("every storefront browse read sends the one named catalog, and only priced reads name include_price", async (context) => {
  let sink = [];
  const calls = sink;
  recordFetch(context, (call) => {
    sink.push(call.url);
    const page = call.path.endsWith("/catalog-items") || call.path.endsWith("/prices") || call.path.endsWith("/availability");
    return page ? { items: [], cursor: null } : { id: "exact", catalog_item_id: ids.catalogItem, price: null };
  });
  const client = storefront();
  const scope = { catalog_id: ids.catalog, company_id: "company" };
  await client.eshop.catalogItem.find({ ...scope, selection: { sort: "catalog_order" }, limit: 10 });
  await client.eshop.product.get({ id: "product", ...scope, include_price: true });
  await client.eshop.catalogItem.findPrices({ catalog_item_id: "listing", ...scope, include_price: true, limit: 10 });
  await client.eshop.productVariant.get({ product_id: "product", id: "variant", ...scope });
  await client.eshop.bookingService.get({ id: "service", ...scope, include_price: true });
  await client.eshop.bookingService.getAvailability({ booking_service_id: "service", from: 1, to: 2, limit: 5, ...scope });
  await client.eshop.bookingOffering.get({ id: "offering", ...scope, include_price: true });
  await client.eshop.bookingResource.get({ id: "resource", offering_id: "offering", ...scope });
  await client.eshop.customerGroup.get({ id: "monthly", ...scope });
  await client.eshop.customerGroupOffering.get({ id: "family", ...scope });
  await client.eshop.catalogItem.getByParent({ item: { type: "booking_service", booking_service_id: "service" }, ...scope });
  assert.deepEqual(calls.map((call) => call.pathname), [
    "/v1/storefront/catalog-items",
    "/v1/storefront/products/product",
    "/v1/storefront/catalog-items/listing/prices",
    "/v1/storefront/products/product/variants/variant",
    "/v1/storefront/booking-services/service",
    "/v1/storefront/booking-services/availability",
    "/v1/storefront/booking-offerings/offering",
    "/v1/storefront/booking-resources/resource",
    "/v1/storefront/customer-groups/monthly",
    "/v1/storefront/customer-group-offerings/family",
    "/v1/storefront/catalog-items/by-parent",
  ]);
  for (const call of calls) {
    assert.equal(call.searchParams.get("catalog_id"), ids.catalog, call.pathname);
    assert.equal(call.searchParams.get("company_id"), "company", call.pathname);
    assert.equal(call.searchParams.has("company_location_id"), false, call.pathname);
  }
  assert.deepEqual(calls.map((call) => call.searchParams.get("include_price")), [null, null, "true", null, null, null, "true", null, null, null, null]);
  assert.deepEqual(JSON.parse(calls[0].searchParams.get("selection")), { sort: "catalog_order" });
  const unscoped = [];
  sink = unscoped;
  await client.eshop.product.get({ id: "product", catalog_id: ids.catalog, include_price: true });
  await client.eshop.bookingService.get({ slug: "service", catalog_id: ids.catalog });
  assert.equal(unscoped.length, 2);
  assert.ok(unscoped.every((call) => call.searchParams.get("catalog_id") === ids.catalog));
  assert.throws(() => client.eshop.product.get({}), /needs its id or its slug/);
  assert.throws(() => client.eshop.bookingService.get({ key: "service" }), /needs its id or its slug/);
});
