import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

function capture(reply) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(typeof reply === "function" ? reply(calls.length) : reply), {
      headers: { "content-type": "application/json" },
    });
  };
  return { calls, restore: () => { globalThis.fetch = original; } };
}

function eshop() {
  return createAdmin({ storeId: "default", baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop;
}

test("Rental discovery forwards combined filters, preserves empty continuation and reads resolved terms", async () => {
  const detail = {
    rental: { id: "rental", status: { type: "active" } },
    terms: { product_id: "product", variant_id: "variant", quantity: 1, inventory_item_id: "machine", snapshot: {} },
  };
  const { calls, restore } = capture((count) => (count <= 2 ? { items: [], cursor: count === 1 ? "next:/+=" : null } : detail));
  try {
    const api = eshop().rental;
    const query = { store_id: "selected", customer_group_subscription_id: "subscription", status: "ending", limit: 20, sort_field: "updated_at", sort_direction: "desc" };
    assert.deepEqual(await api.find(query), { items: [], cursor: "next:/+=" });
    assert.equal(calls.length, 1);
    assert.deepEqual(await api.find({ ...query, cursor: "next:/+=" }), { items: [], cursor: null });
    assert.deepEqual(await api.get({ id: "rental/id" }), detail);
    assert.deepEqual(calls.map((call) => [call.method, call.url.pathname]), [
      ["GET", "/v1/stores/selected/rentals"],
      ["GET", "/v1/stores/selected/rentals"],
      ["GET", "/v1/stores/default/rentals/rental%2Fid"],
    ]);
    assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), {
      customer_group_subscription_id: "subscription", status: "ending", limit: "20",
      sort_field: "updated_at", sort_direction: "desc",
    });
    assert.equal(calls[1].url.searchParams.get("cursor"), "next:/+=");
    assert.equal(calls[2].url.search, "");
    assert.deepEqual(Object.keys(api).sort(), ["execute", "find", "get"]);
  } finally { restore(); }
});

test("Rental commands keep the caller's command identity, loaded revision and typed instruction on replay", async () => {
  const { calls, restore } = capture({ id: "rental", status: { type: "active" } });
  try {
    const api = eshop().rental;
    const commands = [
      {
        type: "request_replacement", fulfillment_order_id: "work", fulfillment_order_line_id: "line",
        predecessor_placement_id: "placement", store_location_id: "location",
        method: { type: "delivery", destination: { country: "DE", street1: "Hauptstrasse 1", city: "Berlin", postal_code: "10115" } },
        overlap_authorized: false,
      },
      { type: "end", reason: "Customer ended the agreement", return_due_at: null },
      { type: "end", reason: "Agreed collection date", return_due_at: 1700000100000 },
      { type: "close" },
      { type: "cancel_issue", fulfillment_order_id: "work", fulfillment_order_line_id: "line" },
    ];
    for (const [index, type] of commands.entries()) {
      const request = { store_id: "selected", id: "rental", command_id: `command-${index}`, expected_updated_at: 1700000000000, type };
      const before = structuredClone(request);
      await api.execute(request);
      await api.execute(request);
      assert.deepEqual(request, before);
      assert.deepEqual(calls.at(-1), calls.at(-2));
      assert.deepEqual(calls.at(-1).body, { command_id: `command-${index}`, expected_updated_at: 1700000000000, type });
    }
    assert.equal(calls.length, commands.length * 2);
    assert.ok(calls.every((call) => call.method === "POST" && call.url.pathname === "/v1/stores/selected/rentals/rental/commands"));
    assert.ok(calls.every((call) => !call.url.search && !("store_id" in call.body) && !("id" in call.body)));
  } finally { restore(); }
});

test("Placement discovery and custody commands stay on the placement root without inventing handover", async () => {
  const placement = { id: "placement", rental_id: "rental", status: { type: "in_transit" } };
  const { calls, restore } = capture((count) => (count === 1 ? { items: [], cursor: "next" } : placement));
  try {
    const api = eshop().rentalPlacement;
    const query = { rental_id: "rental", inventory_unit_id: "unit", status: "in_transit", limit: 10 };
    assert.deepEqual(await api.find(query), { items: [], cursor: "next" });
    assert.deepEqual(await api.get({ store_id: "selected", id: "placement" }), placement);
    const commands = [
      { type: "confirm_handover", handed_over_at: 1700000000500 },
      { type: "mark_lost", reason: "Courier confirmed the parcel was destroyed" },
    ];
    for (const [index, type] of commands.entries()) {
      const request = { store_id: "selected", id: "placement", command_id: `custody-${index}`, expected_updated_at: 1700000000000, type };
      await api.execute(request);
      await api.execute(request);
      assert.deepEqual(calls.at(-1), calls.at(-2));
      assert.deepEqual(calls.at(-1).body, { command_id: `custody-${index}`, expected_updated_at: 1700000000000, type });
    }
    assert.deepEqual(calls.map((call) => [call.method, call.url.pathname]), [
      ["GET", "/v1/stores/default/rental-placements"],
      ["GET", "/v1/stores/selected/rental-placements/placement"],
      ["POST", "/v1/stores/selected/rental-placements/placement/commands"],
      ["POST", "/v1/stores/selected/rental-placements/placement/commands"],
      ["POST", "/v1/stores/selected/rental-placements/placement/commands"],
      ["POST", "/v1/stores/selected/rental-placements/placement/commands"],
    ]);
    assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), {
      rental_id: "rental", inventory_unit_id: "unit", status: "in_transit", limit: "10",
    });
    assert.deepEqual(Object.keys(api).sort(), ["execute", "find", "get"]);
  } finally { restore(); }
});

test("source-neutral physical work never routes through an Order path", async () => {
  const { calls, restore } = capture((count) => (count === 1
    ? { shipment_id: "parcel", shipment: { id: "parcel" } }
    : { id: "parcel", status: { type: "pending" } }));
  try {
    const api = eshop();
    const lines = [{ fulfillment_order_line_id: "rental-line", unit_spans: [{ first_unit: 0, quantity: 1 }],
      unit_bindings: [{ fulfillment_unit_index: 0, inventory_unit_id: "unit" }] }];
    await api.shipment.create({
      shipment_id: "parcel", origin_store_location_id: "location", fulfillment_order_id: "work", lines,
      parcel: { length: 1, width: 1, height: 1, weight: 1, distance_unit: "cm", mass_unit: "kg" }, customs_declaration: null,
    });
    await api.shipment.find({ fulfillment_order_id: "work", limit: 5 });
    await api.shipment.find({ rental_id: "rental" });
    await api.pickup.find({ fulfillment_order_id: "work" });
    await api.fulfillmentOrder.find({ rental_id: "rental" });
    await api.fulfillmentOrder.unitSlots({ fulfillment_order_id: "work", expected_updated_at: 1700000000000, lines: [lines[0]] });
    assert.deepEqual(calls.map((call) => [call.method, call.url.pathname + call.url.search]), [
      ["POST", "/v1/stores/default/shipments"],
      ["GET", "/v1/stores/default/shipments?fulfillment_order_id=work&limit=5"],
      ["GET", "/v1/stores/default/shipments?rental_id=rental"],
      ["GET", "/v1/stores/default/pickups?fulfillment_order_id=work"],
      ["GET", "/v1/stores/default/fulfillment-orders?rental_id=rental"],
      ["POST", "/v1/stores/default/fulfillment-orders/work/unit-slots"],
    ]);
    assert.ok(calls.every((call) => !call.url.pathname.includes("/orders/")));
    assert.equal("order_id" in calls[0].body, false);
    assert.deepEqual(calls[5].body, { expected_updated_at: 1700000000000, lines: [lines[0]] });
  } finally { restore(); }
});
