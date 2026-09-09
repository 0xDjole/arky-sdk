import assert from "node:assert/strict";
import test from "node:test";
import { createStorefront } from "../dist/storefront.js";
import { formatPrice, getPriceAmount, formatMinor } from "../dist/utils.js";

const publishableKey = `arky_pk_${"a".repeat(42)}A`;
const companyId = "8f9a5793-561f-4655-8f6b-42f5d6ded326";
const selectedPrice = {
  unit_price: { currency: "bam", amount: 2500 },
  compare_at: 3000,
  billing: { type: "one_time" },
  min_quantity: 1,
  max_quantity: 9,
  priced_at: 1788862721000,
};

for (const owner of ["product", "digital", "bookingOffering"]) {
  test(`${owner} forwards explicit catalog context and retains only the server-selected price`, async () => {
    const calls = [];
    const originalFetch = globalThis.fetch;
    const record =
      owner === "product"
        ? {
            id: "product",
            variants: [
              { id: "variant", price: selectedPrice, purchase_allowed: true },
            ],
          }
        : { id: "sellable", price: selectedPrice, purchase_allowed: true };
    globalThis.fetch = async (url, init = {}) => {
      const parsed = new URL(url);
      calls.push({
        url: parsed,
        headers: new Headers(init.headers),
        method: init.method,
      });
      assert.match(
        parsed.pathname,
        /^\/v1\/storefront\/(products|digital-products|booking-offerings)/,
      );
      const isList = parsed.pathname.split("/").length === 4;
      const body =
        owner === "bookingOffering"
          ? [record]
          : isList
            ? { items: [record], cursor: "next" }
            : record;
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };
    try {
      const client = createStorefront(publishableKey, {
        apiUrl: "https://api.example.test",
        locale: "bs",
        market: "bih",
      });
      const api = client.eshop[owner];
      const selector =
        owner === "bookingOffering" ? { booking_service_id: "service" } : {};
      const page = await api.find({
        ...selector,
        company_id: companyId,
        include_price: true,
      });
      assert.deepEqual(
        page,
        owner === "bookingOffering"
          ? [record]
          : { items: [record], cursor: "next" },
      );
      assert.equal(calls[0].url.searchParams.get("company_id"), companyId);
      assert.equal(calls[0].url.searchParams.get("include_price"), "true");
      await api.find({ ...selector, include_price: false });
      assert.equal(calls[1].url.searchParams.has("company_id"), false);
      assert.equal(calls[1].url.searchParams.get("include_price"), "false");
      if (owner !== "bookingOffering") {
        const identifier = "catalog/item?literal";
        const input = owner === "product" ? { id: identifier } : { identifier };
        assert.deepEqual(
          await api.get({
            ...input,
            company_id: companyId,
            include_price: true,
          }),
          record,
        );
        assert.ok(calls[2].url.pathname.endsWith("/catalog%2Fitem%3Fliteral"));
        assert.equal(calls[2].url.searchParams.get("company_id"), companyId);
        assert.equal(calls[2].url.searchParams.get("include_price"), "true");
        await api.get(input);
        assert.equal(calls[3].url.search, "");
      }
      for (const call of calls) {
        assert.equal(
          call.headers.get("x-arky-publishable-key"),
          publishableKey,
        );
        assert.equal(call.headers.get("x-arky-market"), "bih");
        assert.equal(call.headers.get("authorization"), null);
        assert.equal(call.url.searchParams.has("store_id"), false);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}

test("price formatting consumes one resolved amount without selecting another tier, list or buyer", () => {
  assert.equal(getPriceAmount(selectedPrice), 2500);
  assert.equal(formatPrice(selectedPrice), formatMinor(2500, "bam"));
  const zero = { ...selectedPrice, unit_price: { currency: "jpy", amount: 0 } };
  assert.equal(getPriceAmount(zero), 0);
  assert.equal(formatPrice(zero), formatMinor(0, "jpy"));
  for (const missing of [null, undefined]) {
    assert.equal(getPriceAmount(missing), null);
    assert.equal(formatPrice(missing), "");
  }
  for (const amount of [-1, 1.2, Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
    const invalid = {
      ...selectedPrice,
      unit_price: { currency: "bam", amount },
    };
    assert.equal(getPriceAmount(invalid), null);
    assert.equal(formatPrice(invalid), "");
  }
});
