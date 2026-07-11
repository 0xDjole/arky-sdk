import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";

test("shipping sends the stable client operation id with the signed rate quote", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ shipment_id: "shipment-contract" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    const arky = createAdmin({
      baseUrl: "https://api.example.test",
      storeId: "store-shipping-contract",
      apiToken: "contract-token",
    });
    await arky.eshop.order.ship({
      order_id: "order-shipping-contract",
      operation_id: "018f477d-1cae-7c12-bf12-123456789abc",
      rate_id: "signed-rate-quote",
      carrier: "USPS",
      service: "usps_priority",
      location_id: "location-contract",
      fulfillment_order_id: null,
      lines: [
        {
          order_item_id: "item-contract",
          fulfillment_order_line_id: null,
          quantity: 2,
        },
      ],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "POST");
  assert.equal(
    calls[0].url,
    "https://api.example.test/v1/stores/store-shipping-contract/orders/order-shipping-contract/ship",
  );
  assert.deepEqual(JSON.parse(calls[0].body), {
    operation_id: "018f477d-1cae-7c12-bf12-123456789abc",
    rate_id: "signed-rate-quote",
    carrier: "USPS",
    service: "usps_priority",
    location_id: "location-contract",
    fulfillment_order_id: null,
    lines: [
      {
        order_item_id: "item-contract",
        fulfillment_order_line_id: null,
        quantity: 2,
      },
    ],
  });
});
