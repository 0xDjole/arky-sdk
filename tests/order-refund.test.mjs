import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";

test("order refund sends the stable client operation id", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: init.body,
    });
    return new Response(
      JSON.stringify({
        refund_id: "018f477d-1cae-7c12-bf12-123456789abc",
        amount: 1250,
        status: "requested",
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  };

  try {
    const arky = createAdmin({
      baseUrl: "https://api.example.test",
      storeId: "store-refund-contract",
      apiToken: "contract-token",
    });
    await arky.eshop.order.processRefund({
      id: "order-refund-contract",
      amount: 1250,
      operation_id: "018f477d-1cae-7c12-bf12-123456789abc",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "POST");
  assert.equal(
    calls[0].url,
    "https://api.example.test/v1/stores/store-refund-contract/orders/order-refund-contract/refund",
  );
  assert.deepEqual(JSON.parse(calls[0].body), {
    amount: 1250,
    operation_id: "018f477d-1cae-7c12-bf12-123456789abc",
  });
});
