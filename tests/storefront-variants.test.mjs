import assert from "node:assert/strict";
import test from "node:test";
import { createStorefront } from "../dist/storefront.js";

test("variant pages and exact reads preserve buyer context, continuation and encoded identity", async () => {
  const client = createStorefront(`arky_pk_${"a".repeat(42)}A`, { apiUrl: "https://api.example.test" });
  const calls = [];
  const responses = [{ items: [], cursor: "next-page" }, { items: [{ id: "chosen", price: null }], cursor: null }, { id: "chosen", price: { unit_price: { amount: 0, currency: "usd" } } }];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), headers: new Headers(init.headers) });
    return new Response(JSON.stringify(responses.shift()), { headers: { "content-type": "application/json" } });
  };
  try {
    const selection = { product_id: "product/one", company_id: "company-one", company_location_id: "branch-one", include_price: true, limit: 1 };
    const first = await client.eshop.productVariant.find(selection);
    assert.deepEqual(first, { items: [], cursor: "next-page" });
    const next = await client.eshop.productVariant.find({ ...selection, cursor: first.cursor });
    assert.equal(next.items[0].price, null);
    assert.equal("purchase_allowed" in next.items[0], false);
    const exact = await client.eshop.productVariant.get({ product_id: selection.product_id, id: "variant/one", company_id: selection.company_id, company_location_id: selection.company_location_id, include_price: true });
    assert.equal(exact.price.unit_price.amount, 0);
    assert.equal(calls[0].url.pathname, "/v1/storefront/products/product%2Fone/variants");
    assert.equal(calls[1].url.searchParams.get("cursor"), "next-page");
    assert.equal(calls[2].url.pathname, "/v1/storefront/products/product%2Fone/variants/variant%2Fone");
    for (const call of calls) {
      assert.equal(call.url.searchParams.get("company_id"), "company-one");
      assert.equal(call.url.searchParams.get("company_location_id"), "branch-one");
      assert.equal(call.url.searchParams.get("include_price"), "true");
      assert.equal(call.url.searchParams.has("store_id"), false);
      assert.ok(call.headers.get("x-arky-publishable-key"));
    }
  } finally { globalThis.fetch = original; }
});

test("every storefront browse read sends the one named Catalog and catalog-order sorting", async (context) => {
  const catalogId = "4e8a1c37-9b25-4d60-8f13-2a7c5e0b9d46";
  const calls = [];
  let sink = calls;
  context.mock.method(globalThis, "fetch", async (url) => {
    const parsed = new URL(url);
    sink.push(parsed);
    const page = parsed.pathname.endsWith("s") || parsed.pathname.endsWith("/variants") || parsed.pathname.endsWith("/availability");
    return new Response(JSON.stringify(page ? { items: [], cursor: null } : { id: "exact", price: null }), { headers: { "content-type": "application/json" } });
  });
  const client = createStorefront(`arky_pk_${"b".repeat(42)}A`, { apiUrl: "https://api.example.test" });
  const scope = { catalog_id: catalogId, company_id: "company", company_location_id: "branch" };
  await client.eshop.product.get({ id: "product", ...scope, include_price: true });
  await client.eshop.product.find({ ...scope, sort_field: "catalog_order", limit: 10 });
  await client.eshop.productVariant.get({ product_id: "product", id: "variant", ...scope });
  await client.eshop.productVariant.find({ product_id: "product", ...scope, limit: 10 });
  await client.eshop.digital.get({ identifier: "guide", ...scope, include_price: true });
  await client.eshop.digital.find({ ...scope, sort_field: "catalog_order", limit: 10 });
  await client.eshop.bookingService.get({ id: "service", ...scope, include_price: true });
  await client.eshop.bookingService.find({ ...scope, sort_field: "catalog_order", limit: 10 });
  await client.eshop.bookingService.getAvailability({ booking_service_id: "service", from: 1, to: 2, limit: 5, ...scope });
  await client.eshop.bookingOffering.find({ booking_service_id: "service", ...scope, limit: 10 });
  await client.subscription_plans.get({ identifier: "monthly", ...scope });
  await client.subscription_plans.find({ ...scope, sort_field: "catalog_order", limit: 10 });
  assert.deepEqual(calls.map((call) => call.pathname), [
    "/v1/storefront/products/product",
    "/v1/storefront/products",
    "/v1/storefront/products/product/variants/variant",
    "/v1/storefront/products/product/variants",
    "/v1/storefront/digital-products/guide",
    "/v1/storefront/digital-products",
    "/v1/storefront/booking-services/service",
    "/v1/storefront/booking-services",
    "/v1/storefront/booking-services/availability",
    "/v1/storefront/booking-offerings",
    "/v1/storefront/subscription-plans/monthly",
    "/v1/storefront/subscription-plans",
  ]);
  for (const call of calls) {
    assert.equal(call.searchParams.get("catalog_id"), catalogId, call.pathname);
    assert.equal(call.searchParams.get("company_id"), "company", call.pathname);
  }
  for (const index of [1, 5, 7, 11]) assert.equal(calls[index].searchParams.get("sort_field"), "catalog_order");
  const unscoped = [];
  sink = unscoped;
  await client.eshop.product.get({ id: "product", include_price: true });
  await client.eshop.digital.get({ identifier: "guide" });
  await client.eshop.bookingService.get({ id: "service" });
  assert.equal(unscoped.length, 3);
  assert.ok(unscoped.every((call) => !call.searchParams.has("catalog_id")));
});
