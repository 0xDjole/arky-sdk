import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { initialize } from "../dist/storefront.js";
import { storefrontSessionStorage } from "./helpers/storefront-session-storage.mjs";

const STORE_ID = "2f7b4d91-8c36-4a05-b1e9-6d3a0c8f5e27";
const OTHER_STORE_ID = "a6c1e8f4-3b92-4d57-9e0a-5f2d7b1c8e46";
const requestId = (index) => `4d7e1b39-${String(index).padStart(4, "0")}-4c62-8a15-9e3f6b0d2c74`;

test("initialized Customer returns retain the request and use only storefront discovery and reads", async () => {
  const original = globalThis.fetch;
  const calls = [];
  const publishableKey = `arky_pk_${"c".repeat(43)}`;
  const token = `customer_visitor_${"d".repeat(64)}`;
  const client = initialize(publishableKey, { apiUrl: "https://api.example.test", sessionStorage: storefrontSessionStorage(JSON.stringify({
    version: 2, customer: { id: "customer", status: { type: "active" }, identities: [], categories: [], created_at: 1, updated_at: 1 },
    session: { id: "session", customer_id: "customer", type: "visitor", token, status: { type: "active" }, expires_at: 1900000000000 },
  })) });
  const request = { return_id: "return", request_id: requestId(100), source: { type: "order", order_id: "order" }, lines: [{ id: "line", source: { type: "order_product", order_product_line_item_id: "product-line", unit_spans: [{ first_unit: 1, quantity: 1 }] }, reason: "damaged", items: [{ inventory_item_id: "item", quantity: 1 }] }] };
  const before = structuredClone(request);
  const retained = { id: "return", status: { type: "requested", requested_at: 1700000000000 } };
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, headers: new Headers(init.headers), body: init.body ? JSON.parse(init.body) : null });
    return Response.json(init.method === "GET" && new URL(url).search ? { items: [], cursor: "next" } : retained);
  };
  try {
    assert.deepEqual(await client.eshop.return.create(request), retained);
    assert.deepEqual(await client.eshop.return.create(request), retained);
    assert.deepEqual(await client.eshop.return.find({ order_id: "order", limit: 10, cursor: "prior" }), { items: [], cursor: "next" });
    assert.deepEqual(await client.eshop.return.get({ return_id: "return/one" }), retained);
    assert.deepEqual(request, before);
    assert.deepEqual(calls.map(call => [call.method, call.url.pathname]), [["POST", "/v1/storefront/returns"], ["POST", "/v1/storefront/returns"], ["GET", "/v1/storefront/returns"], ["GET", "/v1/storefront/returns/return%2Fone"]]);
    assert.deepEqual(calls[0].body, request);
    assert.deepEqual(calls[1].body, request);
    assert.deepEqual(Object.fromEntries(calls[2].url.searchParams), { order_id: "order", limit: "10", cursor: "prior" });
    await assert.rejects(client.eshop.return.create({ ...request, request_id: "request" }), TypeError);
    assert.equal(calls.length, 4);
    assert.ok(calls.every(call => call.headers.get("authorization") === `Bearer ${token}` && call.headers.get("x-arky-publishable-key") === publishableKey));
  } finally { globalThis.fetch = original; }
});

test("Return discovery carries all filters and preserves empty continuation without refill", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(new URL(url));
    return new Response(JSON.stringify({ items: [], cursor: "next" }), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.return;
    const query = { store_id: STORE_ID, order_id: "order", destination_store_location_id: "warehouse", status: "open", limit: 20, sort_field: "updated_at", sort_direction: "desc" };
    assert.deepEqual(await api.find(query), { items: [], cursor: "next" });
    assert.equal(calls.length, 1);
    await api.find({ ...query, cursor: "next" });
    assert.equal(calls[0].pathname, `/v1/stores/${STORE_ID}/returns`);
    assert.deepEqual(Object.fromEntries(calls[0].searchParams), { order_id: "order", destination_store_location_id: "warehouse", status: "open", limit: "20", sort_field: "updated_at", sort_direction: "desc" });
    assert.equal(calls[1].searchParams.get("cursor"), "next");
    assert.deepEqual(Object.keys(api).sort(), ["create", "destinationOptions", "execute", "find", "get", "inspectionUnit"]);
  } finally { globalThis.fetch = original; }
});

test("Return commands retain exact caller identities and distinguish custody from disposition", async () => {
  const original = globalThis.fetch;
  const calls = [];
  const retained = { id: "return", tracking: null, status: { type: "requested", requested_at: 1700000000000 } };
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(retained), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.return;
    const request = {
      store_id: STORE_ID, return_id: "return", source: { type: "order", order_id: "order" }, destination_store_location_id: "warehouse", request_id: requestId(200),
      lines: [{ id: "line", source: { type: "order_product", order_product_line_item_id: "product-line", unit_spans: [{ first_unit: 1, quantity: 1 }] }, reason: "damaged", items: [{ inventory_item_id: "item", quantity: 1 }] }],
    };
    assert.deepEqual(await api.create(request), retained);
    await api.create(request);
    await api.get({ store_id: OTHER_STORE_ID, return_id: "return/id" });
    const base = { store_id: STORE_ID, return_id: "return", source: request.source, expected_updated_at: 1700000000000 };
    const commands = [
      { type: "approve", destination_store_location_id: "warehouse" },
      { type: "decide", store_location_id: "warehouse" },
      { type: "decline", reason: "Return window expired" },
      { type: "receive", items: [{ line_id: "line", inventory_item_id: "item", quantity: 1, inventory_unit_ids: ["unit"] }] },
      { type: "dispose", items: [{ line_id: "line", inventory_item_id: "item", quantity: 1, inventory_unit_ids: ["unit"], disposition: { type: "not_restocked", reason: "Damaged beyond repair" } }] },
      { type: "dispose", items: [{ line_id: "line", inventory_item_id: "item", quantity: 1, inventory_unit_ids: [], disposition: { type: "restock" } }] },
      { type: "dispose", items: [{ line_id: "line", inventory_item_id: "item", quantity: 1, inventory_unit_ids: [], disposition: { type: "not_restocked", reason: "Contaminated" } }] },
      { type: "missing", items: [{ line_id: "line", inventory_item_id: "item", quantity: 1 }] },
      { type: "tracking", tracking: { carrier: "Courier", number: "RET-42", url: null } },
      { type: "cancel" },
    ];
    for (const [index, command] of commands.entries()) {
      const request = { ...base, request_id: requestId(index), command };
      const before = structuredClone(request);
      await api.execute(request);
      await api.execute(request);
      assert.deepEqual(request, before);
      assert.deepEqual(calls.at(-1), calls.at(-2));
    }
    assert.equal(calls.length, 3 + commands.length * 2);
    const { store_id: _createStore, ...created } = request;
    assert.deepEqual(calls[0].body, created);
    assert.deepEqual(calls[1].body, created);
    assert.equal(calls[0].url.pathname, `/v1/stores/${STORE_ID}/returns`);
    assert.equal(calls[2].url.pathname, `/v1/stores/${OTHER_STORE_ID}/returns/return%2Fid`);
    assert.equal(calls[2].method, "GET");
    for (const [index, command] of commands.entries()) {
      const call = calls[index * 2 + 3];
      assert.equal(call.url.pathname, `/v1/stores/${STORE_ID}/returns/return/execute`);
      assert.equal(call.method, "POST");
      assert.deepEqual(call.body, { source: base.source, expected_updated_at: base.expected_updated_at, request_id: requestId(index), command });
    }
    await assert.rejects(async () => api.execute({ ...base, request_id: "command-0", command: { type: "cancel" } }), TypeError);
    await assert.rejects(async () => api.create({ ...request, request_id: "request" }), TypeError);
    assert.equal(calls.length, 3 + commands.length * 2);
  } finally { globalThis.fetch = original; }
});

test("Rental Returns name the exact unit and keep the Rental source on every command", async () => {
  const original = globalThis.fetch;
  const calls = [];
  const retained = { id: "rental-return", tracking: null, status: { type: "open" } };
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(retained), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.return;
    const source = { type: "rental", rental_id: "rental" };
    const request = {
      store_id: STORE_ID, return_id: "rental-return", source, destination_store_location_id: "warehouse", request_id: requestId(300),
      lines: [{ id: "line", source: { type: "rental_unit", inventory_unit_id: "unit" }, reason: "customer_request",
        items: [{ inventory_item_id: "machine", quantity: 1 }] }],
    };
    const before = structuredClone(request);
    assert.deepEqual(await api.create(request), retained);
    await api.create(request);
    assert.deepEqual(request, before);
    const receipt = { store_id: STORE_ID, return_id: "rental-return", source, request_id: requestId(301), expected_updated_at: 1700000000000,
      command: { type: "receive", items: [{ line_id: "line", inventory_item_id: "machine", quantity: 1, inventory_unit_ids: ["unit"] }] } };
    await api.execute(receipt);
    await api.execute(receipt);
    const { store_id, ...created } = request;
    assert.deepEqual(calls.map((call) => [call.method, call.url.pathname]), [
      ["POST", `/v1/stores/${STORE_ID}/returns`],
      ["POST", `/v1/stores/${STORE_ID}/returns`],
      ["POST", `/v1/stores/${STORE_ID}/returns/rental-return/execute`],
      ["POST", `/v1/stores/${STORE_ID}/returns/rental-return/execute`],
    ]);
    assert.equal(store_id, STORE_ID);
    assert.deepEqual(calls[0].body, created);
    assert.deepEqual(calls[1].body, created);
    assert.deepEqual(calls[2].body, { source, request_id: requestId(301), expected_updated_at: 1700000000000, command: receipt.command });
    assert.deepEqual(calls[3].body, calls[2].body);
  } finally { globalThis.fetch = original; }
});

test("Return discovery scopes an exact Rental without an Order filter", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(new URL(url));
    return new Response(JSON.stringify({ items: [], cursor: null }), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.return;
    assert.deepEqual(await api.find({ store_id: STORE_ID, rental_id: "rental", status: "open" }), { items: [], cursor: null });
    assert.equal(calls[0].pathname, `/v1/stores/${STORE_ID}/returns`);
    assert.deepEqual(Object.fromEntries(calls[0].searchParams), { rental_id: "rental", status: "open" });
  } finally { globalThis.fetch = original; }
});

test("Return inspection reads one exact returned unit under its Return", async () => {
  const original = globalThis.fetch;
  const calls = [];
  const unit = { store_id: STORE_ID, return_id: "return/id", line_id: "line", inventory_item_id: "item",
    inventory_unit_id: "unit/one", order_units: [{ first_unit: 2, quantity: 1 }] };
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET", body: init.body });
    return new Response(JSON.stringify(unit), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.return;
    assert.deepEqual(await api.inspectionUnit({ store_id: STORE_ID, return_id: "return/id", inventory_unit_id: "unit/one" }), unit);
    assert.deepEqual(calls.map((call) => [call.method, call.url.pathname, call.url.search, call.body]), [
      ["GET", `/v1/stores/${STORE_ID}/returns/return%2Fid/inspection-units/unit%2Fone`, "", undefined],
    ]);
    await assert.rejects(async () => api.inspectionUnit({ return_id: "return/id", inventory_unit_id: "unit/one" }), TypeError);
    assert.equal(calls.length, 1);
  } finally { globalThis.fetch = original; }
});

test("Return destination options read the suggestion for one exact Return", async () => {
  const original = globalThis.fetch;
  const calls = [];
  const options = { return_id: "return/id", suggested_store_location_id: "warehouse", store_location_ids: ["warehouse", "shop"] };
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method });
    return new Response(JSON.stringify(options), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.return;
    assert.deepEqual(await api.destinationOptions({ store_id: STORE_ID, return_id: "return/id" }), options);
    assert.deepEqual(calls.map((call) => [call.method, call.url.pathname]), [
      ["GET", `/v1/stores/${STORE_ID}/returns/return%2Fid/destination-options`],
    ]);
  } finally { globalThis.fetch = original; }
});
