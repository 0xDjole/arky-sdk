import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

test("individual stock discovery preserves exact tag case, combined filters and empty continuation", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(new URL(url));
    return new Response(JSON.stringify({ items: [], cursor: "next" }), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ storeId: "default", baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.inventoryUnit;
    const query = {
      store_id: "selected", inventory_item_id: "item", store_location_id: "location", asset_tag: "Camera/A42",
      status: "available", limit: 20, sort_field: "updated_at", sort_direction: "desc",
    };
    assert.deepEqual(await api.find(query), { items: [], cursor: "next" });
    assert.equal(calls.length, 1);
    await api.find({ ...query, cursor: "next" });
    assert.equal(calls[0].pathname, "/v1/stores/selected/inventory-units");
    assert.deepEqual(Object.fromEntries(calls[0].searchParams), {
      inventory_item_id: "item", store_location_id: "location", asset_tag: "Camera/A42", status: "available",
      limit: "20", sort_field: "updated_at", sort_direction: "desc",
    });
    assert.equal(calls[1].searchParams.get("cursor"), "next");
    assert.equal("delete" in api, false);
    assert.equal("update" in api, false);
  } finally { globalThis.fetch = original; }
});

test("Unit commands preserve the caller's receipt identity and exact revisions without hidden discovery", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify({ id: "unit", status: { type: "available", store_location_id: "location" } }), {
      headers: { "content-type": "application/json" },
    });
  };
  try {
    const api = createAdmin({ storeId: "default", baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.inventoryUnit;
    const receipt = {
      id: "unit", inventory_item_id: "item", store_location_id: "location", asset_tag: "Camera/A42",
      manufacturer_serial: null, expected_level_id: "level", expected_level_updated_at: 1700000000000,
    };
    await api.receive(receipt);
    await api.receive(receipt);
    await api.get({ id: "unit" });
    await api.allocate({ id: "unit", fulfillment_order_id: "work", fulfillment_order_line_id: "line", fulfillment_unit_index: 3, expected_updated_at: 1700000000001 });
    await api.unassign({ id: "unit", expected_updated_at: 1700000000002 });
    assert.equal(calls.length, 5);
    assert.deepEqual(calls[0].body, receipt);
    assert.deepEqual(calls[1].body, receipt);
    assert.deepEqual(calls.map(({ url, method }) => [url.pathname, method]), [
      ["/v1/stores/default/inventory-units", "POST"],
      ["/v1/stores/default/inventory-units", "POST"],
      ["/v1/stores/default/inventory-units/unit", "GET"],
      ["/v1/stores/default/inventory-units/unit/allocate", "POST"],
      ["/v1/stores/default/inventory-units/unit/unassign", "POST"],
    ]);
    assert.deepEqual(calls[3].body, { fulfillment_order_id: "work", fulfillment_order_line_id: "line", fulfillment_unit_index: 3, expected_updated_at: 1700000000001 });
    assert.deepEqual(calls[4].body, { expected_updated_at: 1700000000002 });
  } finally { globalThis.fetch = original; }
});

test("Unit movement and write-off preserve explicit command identities and loaded revisions", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: JSON.parse(init.body) });
    return Response.json({ id: "unit/id" });
  };
  try {
    const api = createAdmin({ storeId: "default", baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.inventoryUnit;
    const scope = { store_id: "selected/store", id: "unit/id", expected_updated_at: 1700000000000 };
    for (const [method, path, body] of [
      ["move", "move", { command_id: "move-unit", to_store_location_id: "destination" }],
      ["writeOff", "write-off", { command_id: "write-off-unit", reason: "Damaged beyond repair" }],
    ]) {
      const request = { ...scope, ...body };
      const before = structuredClone(request);
      await api[method](request);
      await api[method](request);
      assert.deepEqual(request, before);
      assert.deepEqual(calls.at(-1), calls.at(-2));
      assert.equal(calls.at(-1).url.pathname, `/v1/stores/selected%2Fstore/inventory-units/unit%2Fid/${path}`);
      assert.equal(calls.at(-1).method, "POST");
      assert.deepEqual(calls.at(-1).body, { expected_updated_at: scope.expected_updated_at, ...body });
    }
  } finally { globalThis.fetch = original; }
});

test("Unit execution inspection returns exact Fulfillment evidence and preserves its absence", async () => {
  const original = globalThis.fetch;
  const calls = [];
  const execution = { fulfillment_order_id: "work", fulfillment_order_line_id: "line", fulfillment_unit_index: 3,
    fulfillment_id: "fulfillment", executed_at: 1700000000000 };
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method });
    return Response.json(calls.length === 1 ? execution : null);
  };
  try {
    const api = createAdmin({ storeId: "default", baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.inventoryUnit;
    const query = { store_id: "selected/store", id: "unit/id" };
    assert.deepEqual(await api.execution(query), execution);
    assert.equal(await api.execution(query), null);
    assert.equal(calls.length, 2);
    assert.ok(calls.every(({ url, method }) => method === "GET" && !url.search && url.pathname === "/v1/stores/selected%2Fstore/inventory-units/unit%2Fid/execution"));
  } finally { globalThis.fetch = original; }
});
