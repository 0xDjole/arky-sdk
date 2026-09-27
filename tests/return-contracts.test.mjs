import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

test("Return discovery carries all filters and preserves empty continuation without refill", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(new URL(url));
    return new Response(JSON.stringify({ items: [], cursor: "next" }), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ storeId: "default", baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.return;
    const query = { store_id: "selected", order_id: "order", destination_store_location_id: "warehouse", status: "open", limit: 20, sort_field: "updated_at", sort_direction: "desc" };
    assert.deepEqual(await api.find(query), { items: [], cursor: "next" });
    assert.equal(calls.length, 1);
    await api.find({ ...query, cursor: "next" });
    assert.equal(calls[0].pathname, "/v1/stores/selected/returns");
    assert.deepEqual(Object.fromEntries(calls[0].searchParams), { order_id: "order", destination_store_location_id: "warehouse", status: "open", limit: "20", sort_field: "updated_at", sort_direction: "desc" });
    assert.equal(calls[1].searchParams.get("cursor"), "next");
    assert.deepEqual(Object.keys(api).sort(), ["create", "execute", "find", "get"]);
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
    const api = createAdmin({ storeId: "default", baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.return;
    const request = {
      return_id: "return", source: { type: "order", order_id: "order" }, destination_store_location_id: "warehouse", command_id: "request",
      lines: [{ id: "line", source: { type: "order_product", order_product_line_item_id: "product-line", unit_spans: [{ first_unit: 1, quantity: 1 }] }, reason: "damaged", items: [{ inventory_item_id: "item", quantity: 1 }] }],
    };
    assert.deepEqual(await api.create(request), retained);
    await api.create(request);
    await api.get({ store_id: "selected", return_id: "return/id" });
    const base = { return_id: "return", source: request.source, expected_updated_at: 1700000000000 };
    const commands = [
      { type: "approve", destination_store_location_id: "warehouse" },
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
      const request = { ...base, command_id: `command-${index}`, command };
      const before = structuredClone(request);
      await api.execute(request);
      await api.execute(request);
      assert.deepEqual(request, before);
      assert.deepEqual(calls.at(-1), calls.at(-2));
    }
    assert.equal(calls.length, 3 + commands.length * 2);
    assert.deepEqual(calls[0].body, request);
    assert.deepEqual(calls[1].body, request);
    assert.equal(calls[2].url.pathname, "/v1/stores/selected/returns/return%2Fid");
    assert.equal(calls[2].method, "GET");
    for (const [index, command] of commands.entries()) {
      const call = calls[index * 2 + 3];
      assert.equal(call.url.pathname, "/v1/stores/default/returns/return/execute");
      assert.equal(call.method, "POST");
      assert.deepEqual(call.body, { source: base.source, expected_updated_at: base.expected_updated_at, command_id: `command-${index}`, command });
    }
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
    const api = createAdmin({ storeId: "default", baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.return;
    const source = { type: "rental", rental_id: "rental" };
    const request = {
      store_id: "selected", return_id: "rental-return", source, destination_store_location_id: "warehouse", command_id: "request",
      lines: [{ id: "line", source: { type: "rental_unit", inventory_unit_id: "unit" }, reason: "customer_request",
        items: [{ inventory_item_id: "machine", quantity: 1 }] }],
    };
    const before = structuredClone(request);
    assert.deepEqual(await api.create(request), retained);
    await api.create(request);
    assert.deepEqual(request, before);
    const receipt = { store_id: "selected", return_id: "rental-return", source, command_id: "receive", expected_updated_at: 1700000000000,
      command: { type: "receive", items: [{ line_id: "line", inventory_item_id: "machine", quantity: 1, inventory_unit_ids: ["unit"] }] } };
    await api.execute(receipt);
    await api.execute(receipt);
    const { store_id, ...created } = request;
    assert.deepEqual(calls.map((call) => [call.method, call.url.pathname]), [
      ["POST", "/v1/stores/selected/returns"],
      ["POST", "/v1/stores/selected/returns"],
      ["POST", "/v1/stores/selected/returns/rental-return/execute"],
      ["POST", "/v1/stores/selected/returns/rental-return/execute"],
    ]);
    assert.equal(store_id, "selected");
    assert.deepEqual(calls[0].body, created);
    assert.deepEqual(calls[1].body, created);
    assert.deepEqual(calls[2].body, { source, command_id: "receive", expected_updated_at: 1700000000000, command: receipt.command });
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
    const api = createAdmin({ storeId: "default", baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.return;
    assert.deepEqual(await api.find({ rental_id: "rental", status: "open" }), { items: [], cursor: null });
    assert.equal(calls[0].pathname, "/v1/stores/default/returns");
    assert.deepEqual(Object.fromEntries(calls[0].searchParams), { rental_id: "rental", status: "open" });
  } finally { globalThis.fetch = original; }
});
