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
    const query = { store_id: "selected", order_id: "order", destination_store_location_id: "warehouse", status: "partially_received", limit: 20, sort_field: "updated_at", sort_direction: "desc" };
    assert.deepEqual(await api.find(query), { items: [], cursor: "next" });
    assert.equal(calls.length, 1);
    await api.find({ ...query, cursor: "next" });
    assert.equal(calls[0].pathname, "/v1/stores/selected/returns");
    assert.deepEqual(Object.fromEntries(calls[0].searchParams), { order_id: "order", destination_store_location_id: "warehouse", status: "partially_received", limit: "20", sort_field: "updated_at", sort_direction: "desc" });
    assert.equal(calls[1].searchParams.get("cursor"), "next");
    assert.deepEqual(Object.keys(api).sort(), ["create", "execute", "find", "get"]);
  } finally { globalThis.fetch = original; }
});

test("Return commands retain exact caller identities and distinguish custody from disposition", async () => {
  const original = globalThis.fetch;
  const calls = [];
  const retained = { id: "return", selected_label_id: null, status: { type: "requested" } };
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(retained), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ storeId: "default", baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.return;
    const request = {
      return_id: "return", source: { type: "order", order_id: "order" }, destination_store_location_id: "warehouse", command_id: "request",
      lines: [{ id: "line", source: { type: "order_product", order_product_line_item_id: "product-line", unit_spans: [{ first_unit: 1, quantity: 1 }] }, reason: "damaged", components: [{ id: "component", unit_index: 1, source_inventory_item_id: "item", authorized_quantity: 1 }] }],
    };
    assert.deepEqual(await api.create(request), retained);
    await api.create(request);
    await api.get({ store_id: "selected", return_id: "return/id" });
    const base = { return_id: "return", source: request.source, expected_updated_at: 1700000000000 };
    const commands = [
      { type: "authorize" },
      { type: "receive", components: [{ component_id: "component", quantity: 1, inventory_unit_ids: ["unit"] }] },
      { type: "dispose", components: [{ component_id: "component", quantity: 1, inventory_unit_ids: ["unit"], disposition: { type: "write_off", reason: "Damaged beyond repair" } }] },
      { type: "dispose", components: [{ component_id: "component", quantity: 1, inventory_unit_ids: [], disposition: { type: "restock" } }] },
      { type: "dispose", components: [{ component_id: "component", quantity: 1, inventory_unit_ids: [], disposition: { type: "discard", reason: "Contaminated" } }] },
      { type: "close" },
      { type: "cancel" },
    ];
    for (const [index, command] of commands.entries()) {
      await api.execute({ ...base, command_id: `command-${index}`, command });
    }
    assert.equal(calls.length, 3 + commands.length);
    assert.deepEqual(calls[0].body, request);
    assert.deepEqual(calls[1].body, request);
    assert.equal(calls[2].url.pathname, "/v1/stores/selected/returns/return%2Fid");
    assert.equal(calls[2].method, "GET");
    for (const [index, command] of commands.entries()) {
      const call = calls[index + 3];
      assert.equal(call.url.pathname, "/v1/stores/default/returns/return/execute");
      assert.equal(call.method, "POST");
      assert.deepEqual(call.body, { source: base.source, expected_updated_at: base.expected_updated_at, command_id: `command-${index}`, command });
    }
  } finally { globalThis.fetch = original; }
});
