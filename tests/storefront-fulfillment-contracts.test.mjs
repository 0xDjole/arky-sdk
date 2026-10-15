import assert from "node:assert/strict";
import test from "node:test";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const returnId = "6d3b9e14-7a28-4c50-b1f6-2e8a4d9c7b03";

test("a buyer reads their order's fulfillment timeline from one exact route", async (context) => {
  const timeline = [{
    fulfillment_job_id: "job",
    order_delivery_group_id: "group",
    method: { type: "delivery" },
    status: { type: "in_progress" },
    timing: { type: "asap" },
    shipments: [{ fulfillment_id: "shipment", status: { type: "dispatched", dispatched_at: 5 }, preparation_started_at: 4, updated_at: 5 }],
  }];
  const calls = recordFetch(context, () => timeline);
  const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", apiUrl, sessionStorage: visitorStorage() });
  assert.deepEqual(await client.eshop.order.fulfillments({ order_id: "order/one" }), timeline);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.url.search]), [["GET", "/v1/storefront/orders/order%2Fone/fulfillments", ""]]);
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${visitorToken}`);
});

test("a buyer's return names the drop-off location only when one is chosen, and null otherwise", async (context) => {
  const calls = recordFetch(context, () => ({ id: returnId, status: { type: "requested", destination: { type: "undecided" } } }));
  const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", apiUrl, sessionStorage: visitorStorage() });
  const request = {
    id: returnId,
    type: { type: "order", order_id: ids.order, lines: [{ id: "line", order_product_line_item_id: ids.line, unit_spans: [{ first_unit: 0, quantity: 1 }], reason: "damaged", items: [{ inventory_item_id: "stock-item", quantity: 1 }] }] },
    destination_store_location_id: null,
  };
  await client.eshop.return.create(request);
  await client.eshop.return.create({ ...request, destination_store_location_id: "warehouse" });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body.destination_store_location_id]), [
    ["POST", "/v1/storefront/returns", null],
    ["POST", "/v1/storefront/returns", "warehouse"],
  ]);
  assert.deepEqual(calls[0].body, request);
});
