import assert from "node:assert/strict";
import test from "node:test";
import { initialize } from "../dist/storefront.js";
import { storefrontSessionStorage } from "./helpers/storefront-session-storage.mjs";

test("Customer product cancellation preserves exact units and command identity across a lost response", async () => {
  const original = globalThis.fetch;
  const calls = [];
  const publishableKey = `arky_pk_${"c".repeat(43)}`;
  const token = `customer_visitor_${"d".repeat(64)}`;
  const client = initialize(publishableKey, {
    apiUrl: "https://api.example.test",
    sessionStorage: storefrontSessionStorage(
      JSON.stringify({
        version: 2,
        customer: {
          id: "customer",
          status: { type: "active" },
          identities: [],
          categories: [],
          created_at: 1,
          updated_at: 1,
        },
        session: {
          id: "session",
          customer_id: "customer",
          type: "visitor",
          token,
          status: { type: "active" },
          expires_at: 1900000000000,
        },
      }),
    ),
  });
  const request = {
    order_id: "order/one",
    order_product_item_id: "line/one",
    command_id: "customer-cancellation",
    expected_updated_at: 1700000000000,
    units: [{ first_unit: 2, quantity: 4 }],
  };
  const before = structuredClone(request);
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      headers: new Headers(init.headers),
      body: JSON.parse(init.body),
    });
    if (calls.length === 1)
      return Response.json(
        { code: "GENERAL.UNAVAILABLE", message: "Lost response" },
        { status: 503 },
      );
    return Response.json({ id: request.order_id });
  };
  try {
    await assert.rejects(
      client.eshop.order.cancelProductItem(request),
      (error) => error.statusCode === 503,
    );
    assert.deepEqual(await client.eshop.order.cancelProductItem(request), {
      id: request.order_id,
    });
    assert.deepEqual(request, before);
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.equal(call.method, "POST");
      assert.equal(
        call.url,
        "https://api.example.test/v1/storefront/orders/order%2Fone/product-items/line%2Fone/cancel",
      );
      assert.equal(call.headers.get("authorization"), `Bearer ${token}`);
      assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
      assert.deepEqual(call.body, {
        command_id: request.command_id,
        expected_updated_at: request.expected_updated_at,
        units: request.units,
      });
    }
  } finally {
    globalThis.fetch = original;
  }
});
