import assert from "node:assert/strict";
import test from "node:test";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch } from "./helpers/arky-fixtures.mjs";

test("variant pages and exact reads keep the buyer context, the continuation and the encoded ids", async (context) => {
  const responses = [{ items: [], cursor: "next-page" }, { items: [{ id: "chosen", price: null }], cursor: null }, { id: "chosen", price: { unit_price: { amount: 0, currency: "usd" } } }];
  const calls = recordFetch(context, () => responses.shift());
  const client = createStorefront(publishableKey, { apiUrl });
  const selection = { product_id: "product/one", catalog_id: ids.catalog, company_location_id: ids.companyLocation, include_price: true, limit: 1 };
  const first = await client.eshop.productVariant.find(selection);
  assert.deepEqual(first, { items: [], cursor: "next-page" });
  const next = await client.eshop.productVariant.find({ ...selection, cursor: first.cursor });
  assert.equal(next.items[0].price, null);
  const exact = await client.eshop.productVariant.get({ product_id: selection.product_id, id: "variant/one", catalog_id: ids.catalog, company_location_id: ids.companyLocation, include_price: true });
  assert.equal(exact.price.unit_price.amount, 0);
  assert.equal(calls[0].path, "/v1/storefront/products/product%2Fone/variants");
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
});

test("every storefront browse read sends the one named catalog, and lists can sort in catalog order", async (context) => {
  let sink = [];
  const calls = sink;
  recordFetch(context, (call) => {
    sink.push(call.url);
    const page = call.path.endsWith("s") || call.path.endsWith("/variants") || call.path.endsWith("/availability");
    return page ? { items: [], cursor: null } : { id: "exact", price: null };
  });
  const client = createStorefront(publishableKey, { apiUrl });
  const scope = { catalog_id: ids.catalog, company_id: "company" };
  await client.eshop.product.get({ id: "product", ...scope, include_price: true });
  await client.eshop.product.find({ ...scope, sort_field: "catalog_order", limit: 10 });
  await client.eshop.productVariant.get({ product_id: "product", id: "variant", ...scope });
  await client.eshop.productVariant.find({ product_id: "product", ...scope, limit: 10 });
  await client.eshop.bookingService.get({ id: "service", ...scope, include_price: true });
  await client.eshop.bookingService.find({ ...scope, sort_field: "catalog_order", limit: 10 });
  await client.eshop.bookingService.getAvailability({ booking_service_id: "service", from: 1, to: 2, limit: 5, ...scope });
  await client.eshop.bookingOffering.find({ booking_service_id: "service", ...scope, limit: 10 });
  await client.eshop.customerGroup.get({ identifier: "monthly", ...scope });
  await client.eshop.customerGroup.find({ ...scope, sort_field: "catalog_order", limit: 10 });
  assert.deepEqual(calls.map((call) => call.pathname), [
    "/v1/storefront/products/product",
    "/v1/storefront/products",
    "/v1/storefront/products/product/variants/variant",
    "/v1/storefront/products/product/variants",
    "/v1/storefront/booking-services/service",
    "/v1/storefront/booking-services",
    "/v1/storefront/booking-services/availability",
    "/v1/storefront/booking-offerings",
    "/v1/storefront/customer-groups/monthly",
    "/v1/storefront/customer-groups",
  ]);
  for (const call of calls) {
    assert.equal(call.searchParams.get("catalog_id"), ids.catalog, call.pathname);
    assert.equal(call.searchParams.get("company_id"), "company", call.pathname);
    assert.equal(call.searchParams.has("company_location_id"), false, call.pathname);
  }
  for (const index of [1, 5, 9]) assert.equal(calls[index].searchParams.get("sort_field"), "catalog_order");
  const unscoped = [];
  sink = unscoped;
  await client.eshop.product.get({ id: "product", include_price: true });
  await client.eshop.bookingService.get({ slug: "service" });
  assert.equal(unscoped.length, 2);
  assert.ok(unscoped.every((call) => !call.searchParams.has("catalog_id")));
  assert.throws(() => client.eshop.product.get({}), /needs its id or its slug/);
  assert.throws(() => client.eshop.bookingService.get({ key: "service" }), /needs its id or its slug/);
});
