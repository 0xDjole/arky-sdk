import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const STORE_ID = "6c1e9a47-2b58-4d93-8f0a-3e7b5d2c9f14";
const OTHER_STORE_ID = "d4a8f2c6-9e13-4b75-a06d-1c5e8b3f7a29";
const requestId = (index) => `0b5e3a7c-${String(index).padStart(4, "0")}-4d1f-9a2e-6c8b4f0d3e57`;

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
  return createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop;
}

test("Rental discovery forwards combined filters, preserves empty continuation and reads resolved terms", async () => {
  const detail = {
    rental: { id: "rental", status: { type: "active" } },
    terms: { product_id: "product", variant_id: "variant", quantity: 1, inventory_item_id: "machine", snapshot: {} },
  };
  const { calls, restore } = capture((count) => (count <= 2 ? { items: [], cursor: count === 1 ? "next:/+=" : null } : detail));
  try {
    const api = eshop().rental;
    const query = { store_id: STORE_ID, subscription_id: "subscription", status: "ending", limit: 20, sort_field: "updated_at", sort_direction: "desc" };
    assert.deepEqual(await api.find(query), { items: [], cursor: "next:/+=" });
    assert.equal(calls.length, 1);
    assert.deepEqual(await api.find({ ...query, cursor: "next:/+=" }), { items: [], cursor: null });
    assert.deepEqual(await api.get({ store_id: OTHER_STORE_ID, id: "rental/id" }), detail);
    assert.deepEqual(calls.map((call) => [call.method, call.url.pathname]), [
      ["GET", `/v1/stores/${STORE_ID}/rentals`],
      ["GET", `/v1/stores/${STORE_ID}/rentals`],
      ["GET", `/v1/stores/${OTHER_STORE_ID}/rentals/rental%2Fid`],
    ]);
    assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), {
      subscription_id: "subscription", status: "ending", limit: "20",
      sort_field: "updated_at", sort_direction: "desc",
    });
    assert.equal(calls[1].url.searchParams.get("cursor"), "next:/+=");
    assert.equal(calls[2].url.search, "");
    assert.deepEqual(Object.keys(api).sort(), ["execute", "find", "get"]);
    await assert.rejects(async () => api.get({ id: "rental/id" }), TypeError);
    assert.equal(calls.length, 3);
  } finally { restore(); }
});

test("Rental commands keep the caller's request identity, loaded revision and typed instruction on replay", async () => {
  const { calls, restore } = capture({ id: "rental", status: { type: "active" } });
  try {
    const api = eshop().rental;
    const commands = [
      {
        type: "request_replacement", fulfillment_job_id: "work", fulfillment_job_line_id: "line",
        replacement: {
          predecessor_inventory_unit_id: "unit", predecessor_fulfillment_job_line_id: "delivered-line",
          predecessor_fulfillment_unit_index: 0, overlap_authorized: false,
        },
        store_location_id: "location",
        method: { type: "delivery", destination: { country: "DE", street1: "Hauptstrasse 1", city: "Berlin", postal_code: "10115" } },
      },
      { type: "end", reason: "Customer ended the agreement", return_due_at: null },
      { type: "end", reason: "Agreed collection date", return_due_at: 1700000100000 },
      { type: "close" },
      { type: "cancel_issue", fulfillment_job_id: "work", fulfillment_job_line_id: "line" },
    ];
    for (const [index, type] of commands.entries()) {
      const request = { store_id: STORE_ID, id: "rental", request_id: requestId(index), expected_updated_at: 1700000000000, type };
      const before = structuredClone(request);
      await api.execute(request);
      await api.execute(request);
      assert.deepEqual(request, before);
      assert.deepEqual(calls.at(-1), calls.at(-2));
      assert.deepEqual(calls.at(-1).body, { request_id: requestId(index), expected_updated_at: 1700000000000, type });
    }
    assert.equal(calls.length, commands.length * 2);
    assert.ok(calls.every((call) => call.method === "POST" && call.url.pathname === `/v1/stores/${STORE_ID}/rentals/rental/commands`));
    for (const request_id of [undefined, "command-0", requestId(0).toUpperCase()]) {
      await assert.rejects(async () => api.execute({ store_id: STORE_ID, id: "rental", request_id, expected_updated_at: 1700000000000, type: { type: "close" } }), TypeError);
    }
    assert.equal(calls.length, commands.length * 2);
    assert.ok(calls.every((call) => !call.url.search && !("store_id" in call.body) && !("id" in call.body)));
  } finally { restore(); }
});

test("Rental physical work uses Fulfillment and job routes with exact unit selections", async () => {
  const creation = requestId(9);
  const { calls, restore } = capture({ id: "fulfillment", request_id: creation, status: { type: "preparing" } });
  try {
    const api = eshop();
    const lines = [{ fulfillment_job_line_id: "rental-line", unit_spans: [{ first_unit: 0, quantity: 1 }],
      selected_units: [{ fulfillment_unit_index: 0, inventory_unit_id: "unit" }], lot_reference: null }];
    const slots = lines.map(({ fulfillment_job_line_id, unit_spans }) => ({ fulfillment_job_line_id, unit_spans }));
    await api.fulfillment.create({ store_id: STORE_ID, request_id: creation, fulfillment_id: "fulfillment", fulfillment_job_id: "work", lines });
    await api.fulfillment.find({ store_id: STORE_ID, fulfillment_job_id: "work", limit: 5 });
    await api.fulfillment.find({ store_id: STORE_ID, rental_id: "rental" });
    await api.fulfillmentJob.find({ store_id: STORE_ID, rental_id: "rental" });
    await api.fulfillmentJob.unitSlots({ store_id: STORE_ID, fulfillment_job_id: "work", expected_updated_at: 1700000000000, lines: slots });
    assert.deepEqual(calls.map((call) => [call.method, call.url.pathname + call.url.search]), [
      ["POST", `/v1/stores/${STORE_ID}/fulfillments`],
      ["GET", `/v1/stores/${STORE_ID}/fulfillments?fulfillment_job_id=work&limit=5`],
      ["GET", `/v1/stores/${STORE_ID}/fulfillments?rental_id=rental`],
      ["GET", `/v1/stores/${STORE_ID}/fulfillment-jobs?rental_id=rental`],
      ["POST", `/v1/stores/${STORE_ID}/fulfillment-jobs/work/unit-slots`],
    ]);
    assert.ok(calls.every((call) => !call.url.pathname.includes("/orders/")));
    assert.deepEqual(calls[0].body, { request_id: creation, fulfillment_id: "fulfillment", fulfillment_job_id: "work", lines });
    assert.deepEqual(calls[4].body, { expected_updated_at: 1700000000000, lines: slots });
    await assert.rejects(api.fulfillment.create({ store_id: STORE_ID, request_id: requestId(8), fulfillment_id: "fulfillment", fulfillment_job_id: "work", lines }), /did not match/);
    assert.equal(calls.length, 6);
  } finally { restore(); }
});
