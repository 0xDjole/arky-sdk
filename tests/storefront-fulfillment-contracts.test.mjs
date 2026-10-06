import assert from "node:assert/strict";
import test from "node:test";
import { createStorefront } from "../dist/storefront.js";

const apiUrl = "https://api.storefront-fulfillment.test";
const publishableKey = `arky_pk_${"f".repeat(42)}A`;
const visitorToken = `customer_visitor_${"f".repeat(64)}`;
const requestId = "6d3b9e14-7a28-4c50-b1f6-2e8a4d9c7b03";

function visitorStorage() {
  const stored = JSON.stringify({
    version: 2,
    customer: { id: "customer-fulfillment", status: { type: "active" }, first_name: null, last_name: null, phone: null, locale: null, categories: [], created_at: 1, updated_at: 1 },
    session: { id: "session-fulfillment", customer_id: "customer-fulfillment", status: { type: "active" }, type: "visitor", token: visitorToken, expires_at: 10_000 },
  });
  return { getItem: () => stored, setItem() {}, removeItem() {} };
}

test("customers read their order's fulfillment timeline from one exact route", async (context) => {
  const timeline = [{
    fulfillment_job_id: "job", order_delivery_group_id: "group", method: { type: "delivery" }, status: { type: "in_progress" },
    scheduled_window: null,
    shipments: [{ fulfillment_id: "shipment", status: { type: "dispatched", dispatched_at: 5 }, preparation_started_at: 4, updated_at: 5 }],
    created_at: 1, updated_at: 5,
  }];
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET", authorization: new Headers(init.headers).get("authorization") });
    return Response.json(timeline);
  });
  const client = createStorefront(publishableKey, { apiUrl, sessionStorage: visitorStorage() });
  assert.deepEqual(await client.eshop.order.fulfillments({ order_id: "order/one" }), timeline);
  assert.deepEqual(calls.map(({ url, method }) => [method, url.pathname, url.search]), [
    ["GET", "/v1/storefront/orders/order%2Fone/fulfillments", ""],
  ]);
  assert.equal(calls[0].authorization, `Bearer ${visitorToken}`);
});

test("storefront return requests carry the customer's drop-off only when one is chosen", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body ? JSON.parse(String(init.body)) : null });
    return Response.json({ id: "return", destination: { type: "undecided" } });
  });
  const client = createStorefront(publishableKey, { apiUrl, sessionStorage: visitorStorage() });
  const request = {
    return_id: "return", source: { type: "order", order_id: "order" }, request_id: requestId,
    lines: [{ id: "line", source: { type: "order_product", order_product_line_item_id: "item", unit_spans: [{ first_unit: 0, quantity: 1 }] }, reason: "damaged", items: [{ inventory_item_id: "milk", quantity: 1 }] }],
  };
  await client.eshop.return.create(request);
  await client.eshop.return.create({ ...request, destination_store_location_id: "warehouse" });
  assert.equal(calls[0].url.pathname, "/v1/storefront/returns");
  assert.deepEqual(calls[0].body, request);
  assert.equal("destination_store_location_id" in calls[0].body, false);
  assert.equal(calls[1].url.pathname, "/v1/storefront/returns");
  assert.deepEqual(calls[1].body, { ...request, destination_store_location_id: "warehouse" });
});
