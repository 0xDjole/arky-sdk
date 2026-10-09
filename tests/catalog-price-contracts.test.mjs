import assert from "node:assert/strict";
import test from "node:test";
import { createStorefront } from "../dist/storefront.js";
import { formatPrice, getPriceAmount, formatMinor } from "../dist/utils.js";

const publishableKey = `arky_pk_${"a".repeat(42)}A`;
const companyId = "8f9a5793-561f-4655-8f6b-42f5d6ded326";
const branchId = "5d7f1c39-8a24-4e60-b9d3-2e6c0a8f4b17";
const catalogId = "e4c8a2f6-1b73-4d95-a0e7-5f2c9b6d3a18";
const selectedPrice = {
  tax_mode: "inclusive",
  unit_price: { currency: "bam", amount: 2500 },
  compare_at: 3000,
  min_quantity: 1,
  max_quantity: 9,
  priced_at: 1788862721000,
};

for (const owner of ["product", "bookingService", "bookingOffering"]) {
  test(`${owner} forwards the explicit catalog and buyer context and keeps only the server-selected price`, async (context) => {
    const calls = [];
    const record = { id: "sellable", price: selectedPrice };
    context.mock.method(globalThis, "fetch", async (url, init = {}) => {
      const parsed = new URL(url);
      calls.push({ url: parsed, headers: new Headers(init.headers), method: init.method });
      assert.match(parsed.pathname, /^\/v1\/storefront\/(products|booking-services|booking-offerings)/);
      const isList = parsed.pathname.split("/").length === 4;
      const body = isList ? { items: [record], cursor: "next" } : record;
      return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
    });
    const client = createStorefront(publishableKey, {
      apiUrl: "https://api.example.test",
      locale: "bs",
      market: "bih",
      salesChannel: "web",
    });
    const api = client.eshop[owner];
    const selector = owner === "bookingOffering" ? { booking_service_id: "service" } : {};
    const page = await api.find({ ...selector, catalog_id: catalogId, company_id: companyId, company_location_id: branchId, include_price: true });
    assert.deepEqual(page, { items: [record], cursor: "next" });
    assert.equal(calls[0].url.searchParams.get("catalog_id"), catalogId);
    assert.equal(calls[0].url.searchParams.get("company_id"), companyId);
    assert.equal(calls[0].url.searchParams.get("company_location_id"), branchId);
    assert.equal(calls[0].url.searchParams.get("include_price"), "true");
    await api.find({ ...selector, include_price: false });
    assert.equal(calls[1].url.searchParams.has("company_id"), false);
    assert.equal(calls[1].url.searchParams.has("catalog_id"), false);
    assert.equal(calls[1].url.searchParams.get("include_price"), "false");
    if (owner !== "bookingOffering") {
      const identifier = "catalog/item?literal";
      assert.deepEqual(await api.get({ id: identifier, catalog_id: catalogId, company_id: companyId, include_price: true }), record);
      assert.ok(calls[2].url.pathname.endsWith("/catalog%2Fitem%3Fliteral"));
      assert.equal(calls[2].url.searchParams.get("catalog_id"), catalogId);
      assert.equal(calls[2].url.searchParams.get("company_id"), companyId);
      assert.equal(calls[2].url.searchParams.get("include_price"), "true");
      await api.get({ slug: "the-slug" });
      assert.ok(calls[3].url.pathname.endsWith("/the-slug"));
      assert.equal(calls[3].url.search, "");
    }
    for (const call of calls) {
      assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
      assert.equal(call.headers.get("x-arky-market"), "bih");
      assert.equal(call.headers.get("x-arky-sales-channel"), "web");
      assert.equal(call.headers.get("x-arky-locale"), "bs");
      assert.equal(call.headers.get("authorization"), null);
      assert.equal(call.url.searchParams.has("store_id"), false);
    }
  });
}

for (const [owner, route] of [["product", "products"], ["bookingService", "booking-services"]]) {
  test(`${owner} reads a key only through the by-key route, with the same catalog context`, async (context) => {
    const calls = [];
    const record = { id: "sellable", price: selectedPrice };
    context.mock.method(globalThis, "fetch", async (url, init = {}) => {
      calls.push({ url: new URL(url), headers: new Headers(init.headers) });
      return new Response(JSON.stringify(record), { status: 200, headers: { "content-type": "application/json" } });
    });
    const client = createStorefront(publishableKey, { apiUrl: "https://api.example.test", locale: "bs", market: "bih", salesChannel: "web" });
    assert.deepEqual(await client.eshop[owner].getByKey({ key: "espresso-x1", catalog_id: catalogId, company_id: companyId, company_location_id: branchId, include_price: true }), record);
    await client.eshop[owner].getByKey({ key: "with/slash" });
    await client.eshop[owner].get({ slug: "espresso-x1" });
    assert.deepEqual(calls.map((call) => [call.url.pathname, Object.fromEntries(call.url.searchParams)]), [
      [`/v1/storefront/${route}/by-key/espresso-x1`, { catalog_id: catalogId, company_id: companyId, company_location_id: branchId, include_price: "true" }],
      [`/v1/storefront/${route}/by-key/with%2Fslash`, {}],
      [`/v1/storefront/${route}/espresso-x1`, {}],
    ]);
    for (const call of calls) {
      assert.equal(call.headers.get("x-arky-locale"), "bs");
      assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
    }
  });
}

test("the storefront store exposes the by-key reads next to get", async () => {
  const { initialize } = await import("../dist/storefront.js");
  const store = initialize(publishableKey, { apiUrl: "https://api.example.test", locale: "bs" });
  assert.equal(typeof store.eshop.product.getByKey, "function");
  assert.equal(typeof store.eshop.bookingService.getByKey, "function");
  assert.equal(typeof store.category.getByKey, "function");
});

test("the storefront has no separate digital product catalog", () => {
  const client = createStorefront(publishableKey, { apiUrl: "https://api.example.test" });
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
