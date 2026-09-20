import assert from "node:assert/strict";
import test from "node:test";
import { createStorefront } from "../dist/storefront.js";

test("variant pages and exact reads preserve buyer context, continuation and encoded identity", async () => {
  const client = createStorefront(`arky_pk_${"a".repeat(42)}A`, { apiUrl: "https://api.example.test" });
  const calls = [];
  const responses = [{ items: [], cursor: "next-page" }, { items: [{ id: "chosen", price: null, purchase_allowed: false }], cursor: null }, { id: "chosen", price: { unit_price: { amount: 0, currency: "usd" } }, purchase_allowed: true }];
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
    assert.equal(next.items[0].purchase_allowed, false);
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
