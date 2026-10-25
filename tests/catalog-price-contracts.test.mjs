import assert from "node:assert/strict";
import test from "node:test";
import { createStorefront } from "../dist/storefront.js";
import { formatPrice, getPriceAmount, formatMinor } from "../dist/utils.js";

const publishableKey = `arky_pk_${"a".repeat(42)}A`;
const companyId = "8f9a5793-561f-4655-8f6b-42f5d6ded326";
const locationId = "5d7f1c39-8a24-4e60-b9d3-2e6c0a8f4b17";
const catalogId = "e4c8a2f6-1b73-4d95-a0e7-5f2c9b6d3a18";
const listingId = "5a8d2f61-3b7e-4c09-9f14-6d2b8e0a4c73";
const selectedPrice = {
  catalog_item_price_id: "2c9e4a7b-5d31-4f86-a0b2-7e3c9d1f5a64",
  tax_mode: "inclusive",
  unit_price: { currency: "bam", amount: 2500 },
  compare_at: 3000,
  priced_at: 1788862721000,
};

function storefront() {
  return createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`,
    apiUrl: "https://api.example.test",
    locale: "bs",
    market: "bih",
  });
}

function recordCalls(context, answer) {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), headers: new Headers(init.headers), method: init.method });
    return new Response(JSON.stringify(answer), { status: 200, headers: { "content-type": "application/json" } });
  });
  return calls;
}

function assertStorefrontHeaders(calls) {
  for (const call of calls) {
    assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
    assert.equal(call.headers.get("x-arky-market"), "bih");
    assert.equal(call.headers.has("x-arky-sales-channel"), false);
    assert.equal(call.headers.get("x-arky-locale"), "bs");
    assert.equal(call.headers.get("authorization"), null);
    assert.equal(call.url.searchParams.has("store_id"), false);
  }
}

for (const [owner, route] of [["product", "products"], ["bookingService", "booking-services"]]) {
  test(`${owner} detail forwards the catalog and buyer context, answers its listing and never asks for a price`, async (context) => {
    const record = { id: "sellable", catalog_item_id: listingId };
    const calls = recordCalls(context, record);
    const api = storefront().eshop[owner];
    const identifier = "catalog/item?literal";
    assert.deepEqual(await api.get({ id: identifier, catalog_id: catalogId, company_id: companyId, include_price: true }), record);
    await api.get({ slug: "the-slug", catalog_id: catalogId, company_location_id: locationId });
    assert.deepEqual(calls.map((call) => [call.url.pathname, Object.fromEntries(call.url.searchParams)]), [
      [`/v1/storefront/${route}/catalog%2Fitem%3Fliteral`, { catalog_id: catalogId, company_id: companyId }],
      [`/v1/storefront/${route}/the-slug`, { catalog_id: catalogId, company_location_id: locationId }],
    ]);
    assert.equal("find" in api, false);
    assertStorefrontHeaders(calls);
  });

  test(`${owner} reads a key only through the by-key route, with the same catalog context`, async (context) => {
    const record = { id: "sellable", catalog_item_id: listingId };
    const calls = recordCalls(context, record);
    const api = storefront().eshop[owner];
    assert.deepEqual(await api.getByKey({ key: "classic-x1", catalog_id: catalogId, company_location_id: locationId }), record);
    await api.getByKey({ key: "with/slash", catalog_id: catalogId });
    await api.get({ slug: "classic-x1", catalog_id: catalogId });
    assert.deepEqual(calls.map((call) => [call.url.pathname, Object.fromEntries(call.url.searchParams)]), [
      [`/v1/storefront/${route}/by-key/classic-x1`, { catalog_id: catalogId, company_location_id: locationId }],
      [`/v1/storefront/${route}/by-key/with%2Fslash`, { catalog_id: catalogId }],
      [`/v1/storefront/${route}/classic-x1`, { catalog_id: catalogId }],
    ]);
    assertStorefrontHeaders(calls);
  });
}

test("a variant and a booking offering keep their server-selected price when the caller asks for it", async (context) => {
  const record = { id: "sellable", catalog_item_id: listingId, price: selectedPrice };
  const calls = recordCalls(context, record);
  const client = storefront();
  assert.deepEqual(
    await client.eshop.productVariant.get({ product_id: "product/1", id: "variant/1", catalog_id: catalogId, company_location_id: locationId, include_price: true }),
    record,
  );
  assert.deepEqual(await client.eshop.bookingOffering.get({ id: "offering/1", catalog_id: catalogId, include_price: false }), record);
  await client.eshop.bookingOffering.get({ id: "offering/2", catalog_id: catalogId, company_id: companyId });
  assert.deepEqual(calls.map((call) => [call.url.pathname, Object.fromEntries(call.url.searchParams)]), [
    ["/v1/storefront/products/product%2F1/variants/variant%2F1", { catalog_id: catalogId, company_location_id: locationId, include_price: "true" }],
    ["/v1/storefront/booking-offerings/offering%2F1", { catalog_id: catalogId, include_price: "false" }],
    ["/v1/storefront/booking-offerings/offering%2F2", { catalog_id: catalogId, company_id: companyId }],
  ]);
  assertStorefrontHeaders(calls);
});

test("the storefront store exposes the by-key reads next to get", async () => {
  const { initialize } = await import("../dist/storefront.js");
  const store = initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl: "https://api.example.test", locale: "bs" });
  assert.equal(typeof store.eshop.product.getByKey, "function");
  assert.equal(typeof store.eshop.bookingService.getByKey, "function");
  assert.equal(typeof store.category.getByKey, "function");
  assert.equal(typeof store.eshop.catalogItem.findPrices, "function");
});

test("the storefront has no separate digital product catalog", () => {
  const client = storefront();
  assert.equal("digital" in client.eshop, false);
  assert.equal("digitalProduct" in client.eshop, false);
});

test("price formatting consumes one resolved amount in the explicit locale without selecting another tier, list or buyer", () => {
  assert.equal(getPriceAmount(selectedPrice), 2500);
  assert.equal(formatPrice(selectedPrice, "bs"), formatMinor(2500, "bam", "bs"));
  assert.equal(formatPrice(selectedPrice, "en-US"), formatMinor(2500, "bam", "en-US"));
  const zero = { ...selectedPrice, unit_price: { currency: "jpy", amount: 0 } };
  assert.equal(getPriceAmount(zero), 0);
  assert.equal(formatPrice(zero, "ja"), formatMinor(0, "jpy", "ja"));
  for (const missing of [null, undefined]) {
    assert.equal(getPriceAmount(missing), null);
    assert.equal(formatPrice(missing, "en"), "");
  }
  for (const amount of [-1, 1.2, Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
    const invalid = { ...selectedPrice, unit_price: { currency: "bam", amount } };
    assert.equal(getPriceAmount(invalid), null);
    assert.equal(formatPrice(invalid, "en"), "");
  }
});
