import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";

const baseUrl = "https://api.example.test";
const storeId = "6ba7b819-9dad-41d1-80b4-00c04fd430c8";
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

test("warehouse slot resolution sends bounded work selections without client-supplied holds", async () => {
  const work = "6ba7b813-9dad-41d1-80b4-00c04fd430c8";
  const lines = [{ fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 2, quantity: 1 }] }];
  const slots = {
    fulfillment_order_id: work, store_location_id: "location", updated_at: 1700000000000,
    slots: [{ fulfillment_order_line_id: "line", fulfillment_unit_index: 2,
      inventory_item_id: "item", inventory_item_key: "camera", inventory_reservation_id: "hold",
      reservation_unit_index: 4, inventory_unit: null }],
  };
  const result = await capture(slots, (api) => api.eshop.fulfillmentOrder.unitSlots({
    fulfillment_order_id: work, expected_updated_at: 1700000000000, lines,
  }));
  assert.deepEqual(result.result, slots);
  assert.deepEqual(result.calls, [{
    url: `${baseUrl}/v1/stores/${storeId}/fulfillment-orders/${work}/unit-slots`,
    method: "POST", body: { expected_updated_at: 1700000000000, lines },
  }]);
});

test("parcel handover sends one explicit command without buying a label or changing its retry identity", async () => {
  const command = { command_id: "6ba7b811-9dad-41d1-80b4-00c04fd430c8",
    expected_updated_at: 1700000000000, late_reason: null };
  const shipment = { id: shipmentId, dispatch: { command_id: command.command_id } };
  const { calls, result } = await capture(shipment, async (api) => {
    const request = { shipment_id: shipmentId, ...command };
    const first = await api.eshop.shipment.dispatch(request);
    const recovered = await api.eshop.shipment.dispatch(request);
    assert.deepEqual(recovered, first);
    return recovered;
  });
  assert.deepEqual(result, shipment);
  assert.deepEqual(calls, [0, 1].map(() => ({
    url: `${baseUrl}/v1/stores/${storeId}/shipments/${shipmentId}/dispatch`,
    method: "POST", body: command,
  })));
});

test("shipping label effects are independent roots, not Shipment-owned projections", async (t) => {
  const labelId = "6ba7b811-9dad-41d1-80b4-00c04fd430c8";
  const labelRefundId = "6ba7b812-9dad-41d1-80b4-00c04fd430c8";
  const debitReversalId = "6ba7b814-9dad-41d1-80b4-00c04fd430c8";
  const shipment = {
    id: shipmentId,
    store_id: storeId,
    fulfillment_order_id: "6ba7b813-9dad-41d1-80b4-00c04fd430c8",
    origin_store_location_id: "6ba7b818-9dad-41d1-80b4-00c04fd430c8",
    lines: [],
    status: { type: "pending" },
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
    selected_label_id: labelId,
    created_at: 1,
    updated_at: 1,
    dispatch: null,
    origin_address: {},
    destination_address: {},
  };
  const purchase = {
    label: { id: labelId, store_id: storeId },
    merchant_debit: { id: "6ba7b815-9dad-41d1-80b4-00c04fd430c8", store_id: storeId },
  };
  const labelRefund = { id: labelRefundId, store_id: storeId, shipping_label_id: labelId };
  const debitReversal = { id: debitReversalId, store_id: storeId };
  const labelPath = `${baseUrl}/v1/stores/${storeId}/shipping-labels`;
  const refundPath = `${baseUrl}/v1/stores/${storeId}/shipping-label-refunds`;
  const reversalPath = `${baseUrl}/v1/stores/${storeId}/merchant-debit-reversals`;

  const cases = [
    {
      name: "resolve the original signed label request without another purchase",
      response: { store_id: storeId, shipping_label_id: labelId,
        owner: { type: "outbound_shipment", shipment_id: shipmentId },
        quote_digest: "a".repeat(64), result: { type: "not_accepted" } },
      request: (arky) => arky.eshop.shippingLabel.resolveRequest({ shipping_label_id: labelId, quote: "original.signed-quote" }),
      expected: { url: `${labelPath}/${labelId}/resolve-request`, method: "POST", body: { quote: "original.signed-quote" } },
    },
    {
      name: "reconcile label",
      response: purchase,
      request: (arky) => arky.eshop.shippingLabel.reconcile({ shipping_label_id: labelId }),
      expected: { url: `${labelPath}/${labelId}/reconcile`, method: "POST", body: {} },
    },
    {
      name: "request carrier-label refund",
      response: labelRefund,
      request: (arky) =>
        arky.eshop.shippingLabelRefund.request({ shipping_label_id: labelId }),
      expected: {
        url: refundPath,
        method: "POST",
        body: { shipping_label_id: labelId },
      },
    },
    {
      name: "retry carrier-label refund",
      response: labelRefund,
      request: (arky) =>
        arky.eshop.shippingLabelRefund.retry({ shipping_label_refund_id: labelRefundId }),
      expected: {
        url: `${refundPath}/${labelRefundId}/retry`,
        method: "POST",
        body: {},
      },
    },
    {
      name: "reconcile merchant debit reversal",
      response: debitReversal,
      request: (arky) =>
        arky.eshop.merchantDebitReversal.reconcile({
          merchant_debit_reversal_id: debitReversalId,
        }),
      expected: {
        url: `${reversalPath}/${debitReversalId}/reconcile`,
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

  assert.equal("label" in shipment, false);
  assert.equal("version" in shipment, false);
  assert.equal("shippo_label" in shipment, false);
  assert.equal(shipment.selected_label_id, purchase.label.id);
});
