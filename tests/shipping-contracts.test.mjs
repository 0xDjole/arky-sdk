import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";

const baseUrl = "https://api.example.test";
const storeId = "6ba7b819-9dad-41d1-80b4-00c04fd430c8";
const orderId = "6ba7b81a-9dad-41d1-80b4-00c04fd430c8";
const shipmentId = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";

function admin() {
  return createAdmin({ baseUrl, storeId, apiToken: "contract-token" });
}

async function capture(response, request) {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: init.body === undefined ? undefined : JSON.parse(String(init.body)),
    });
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  try {
    return { calls, result: await request(admin()) };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("shipping label effects use Shipment-owned provider-neutral state", async (t) => {
  const shipment = {
    id: shipmentId,
    store_id: storeId,
    order_id: orderId,
    fulfillment_order_id: "6ba7b813-9dad-41d1-80b4-00c04fd430c8",
    origin_store_location_id: "6ba7b818-9dad-41d1-80b4-00c04fd430c8",
    lines: [],
    status: "pending",
    parcel: {
      length: 150,
      width: 100,
      height: 50,
      weight: 750,
      distance_unit: "mm",
      mass_unit: "g",
    },
    customs_declaration: null,
    carrier: null,
    service: null,
    tracking_number: null,
    tracking_url: null,
    tracking_status_at: null,
    label: {
      id: "6ba7b811-9dad-41d1-80b4-00c04fd430c8",
      status: "requested",
      label_url: null,
      postage: { amount: 895, currency: "usd" },
      platform_label_fee: { amount: 10, currency: "usd" },
      total: { amount: 905, currency: "usd" },
      requested_at: 1,
      completed_at: null,
      merchant_debit: {
        id: "6ba7b815-9dad-41d1-80b4-00c04fd430c8",
        status: "requested",
        safe_error: null,
        requested_at: 1,
        completed_at: null,
      },
      refund: null,
      merchant_debit_reversal: null,
      safe_error: null,
    },
    created_at: 1,
    updated_at: 1,
  };
  const labelRefund = {
    id: "6ba7b812-9dad-41d1-80b4-00c04fd430c8",
    status: "requested",
    safe_error: null,
    requested_at: 2,
    completed_at: null,
  };
  const shipmentPath = `${baseUrl}/v1/stores/${storeId}/orders/${orderId}/shipments/${shipmentId}`;

  const cases = [
    {
      name: "retry label",
      response: shipment,
      request: (arky) =>
        arky.eshop.shipment.label.retry({
          order_id: orderId,
          shipment_id: shipmentId,
        }),
      expected: {
        url: `${shipmentPath}/label/retry`,
        method: "POST",
        body: {},
      },
    },
    {
      name: "request carrier-label refund",
      response: labelRefund,
      request: (arky) =>
        arky.eshop.shipment.label.refund.request({
          order_id: orderId,
          shipment_id: shipmentId,
        }),
      expected: {
        url: `${shipmentPath}/label/refund`,
        method: "POST",
        body: {},
      },
    },
    {
      name: "retry carrier-label refund",
      response: labelRefund,
      request: (arky) =>
        arky.eshop.shipment.label.refund.retry({
          order_id: orderId,
          shipment_id: shipmentId,
        }),
      expected: {
        url: `${shipmentPath}/label/refund/retry`,
        method: "POST",
        body: {},
      },
    },
  ];

  for (const contract of cases) {
    await t.test(contract.name, async () => {
      const { calls, result } = await capture(
        contract.response,
        contract.request,
      );
      assert.deepEqual(calls, [contract.expected]);
      assert.deepEqual(result, contract.response);
    });
  }

  assert.equal("provider" in shipment.label.merchant_debit, false);
  assert.equal("attempt_count" in shipment.label.merchant_debit, false);
  assert.equal("version" in shipment, false);
  assert.equal("shippo_label" in shipment, false);
});
