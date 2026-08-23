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

test("shipping label and merchant-money effects use provider-neutral singular routes", async (t) => {
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
    label: null,
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
  const charge = {
    id: "6ba7b815-9dad-41d1-80b4-00c04fd430c8",
    order_shipment_id: shipmentId,
    amount: { amount: 905, currency: "usd" },
    status: "succeeded",
    safe_error: null,
    requested_at: 1,
    completed_at: 2,
    created_at: 1,
    updated_at: 2,
  };
  const chargeRefund = {
    id: "6ba7b816-9dad-41d1-80b4-00c04fd430c8",
    order_shipment_id: shipmentId,
    shipping_label_charge_id: charge.id,
    reason: {
      type: "unused_label_refund",
      shipping_label_refund_id: labelRefund.id,
    },
    amount: charge.amount,
    status: "requested",
    safe_error: null,
    requested_at: 3,
    completed_at: null,
    created_at: 3,
    updated_at: 3,
  };
  const shipmentPath =
    `${baseUrl}/v1/stores/${storeId}/orders/${orderId}/shipments/${shipmentId}`;

  const cases = [
    {
      name: "retry label",
      response: shipment,
      request: (arky) =>
        arky.eshop.shipment.label.retry({ order_id: orderId, shipment_id: shipmentId }),
      expected: { url: `${shipmentPath}/label/retry`, method: "POST", body: {} },
    },
    {
      name: "request carrier-label refund",
      response: labelRefund,
      request: (arky) =>
        arky.eshop.shipment.label.refund.request({
          order_id: orderId,
          shipment_id: shipmentId,
        }),
      expected: { url: `${shipmentPath}/label/refund`, method: "POST", body: {} },
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
    {
      name: "get merchant label charge",
      response: charge,
      request: (arky) =>
        arky.eshop.shipment.shippingLabelCharge.get({
          order_id: orderId,
          shipment_id: shipmentId,
        }),
      expected: {
        url: `${shipmentPath}/shipping-label-charge`,
        method: "GET",
        body: undefined,
      },
    },
    {
      name: "retry merchant label charge",
      response: charge,
      request: (arky) =>
        arky.eshop.shipment.shippingLabelCharge.retry({
          order_id: orderId,
          shipment_id: shipmentId,
        }),
      expected: {
        url: `${shipmentPath}/shipping-label-charge/retry`,
        method: "POST",
        body: {},
      },
    },
    {
      name: "get merchant label charge refund",
      response: chargeRefund,
      request: (arky) =>
        arky.eshop.shipment.shippingLabelChargeRefund.get({
          order_id: orderId,
          shipment_id: shipmentId,
        }),
      expected: {
        url: `${shipmentPath}/shipping-label-charge-refund`,
        method: "GET",
        body: undefined,
      },
    },
    {
      name: "retry merchant label charge refund",
      response: chargeRefund,
      request: (arky) =>
        arky.eshop.shipment.shippingLabelChargeRefund.retry({
          order_id: orderId,
          shipment_id: shipmentId,
        }),
      expected: {
        url: `${shipmentPath}/shipping-label-charge-refund/retry`,
        method: "POST",
        body: {},
      },
    },
  ];

  for (const contract of cases) {
    await t.test(contract.name, async () => {
      const { calls, result } = await capture(contract.response, contract.request);
      assert.deepEqual(calls, [contract.expected]);
      assert.deepEqual(result, contract.response);
    });
  }

  assert.equal("provider" in charge, false);
  assert.equal("provider" in chargeRefund, false);
  assert.equal("attempt_count" in charge, false);
  assert.equal("version" in shipment, false);
  assert.equal("shippo_label" in shipment, false);
});

