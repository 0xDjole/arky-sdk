import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const STORE_ID = "b3f7a9c2-5e14-4d68-8a0b-2c6e9d1f4a57";
const OTHER_STORE_ID = "46e0c2d8-9b73-4f15-a2c6-8d1b5e9f3a07";

test("individual stock discovery preserves exact tag case, combined filters and empty continuation", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(new URL(url));
    return new Response(JSON.stringify({ items: [], cursor: "next" }), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.inventoryUnit;
    const query = {
      store_id: STORE_ID, inventory_item_id: "item", store_location_id: "location", asset_tag: "Camera/A42",
      status: "available", limit: 20, sort_field: "updated_at", sort_direction: "desc",
    };
    assert.deepEqual(await api.find(query), { items: [], cursor: "next" });
    assert.equal(calls.length, 1);
    await api.find({ ...query, cursor: "next" });
    assert.equal(calls[0].pathname, `/v1/stores/${STORE_ID}/inventory-units`);
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
    const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.inventoryUnit;
    const receipt = {
      store_id: STORE_ID, id: "unit", inventory_item_id: "item", store_location_id: "location", asset_tag: "Camera/A42",
      manufacturer_serial: null, expected_level_id: "level", expected_level_updated_at: 1700000000000,
    };
    await api.receive(receipt);
    await api.receive(receipt);
    await api.get({ store_id: STORE_ID, id: "unit" });
    await api.allocate({ store_id: STORE_ID, id: "unit", fulfillment_job_id: "work", fulfillment_job_line_id: "line", fulfillment_unit_index: 3, expected_updated_at: 1700000000001 });
    await api.unassign({ store_id: STORE_ID, id: "unit", expected_updated_at: 1700000000002 });
    assert.equal(calls.length, 5);
    const { store_id: _store, ...receiptBody } = receipt;
    assert.deepEqual(calls[0].body, receiptBody);
    assert.deepEqual(calls[1].body, receiptBody);
    assert.deepEqual(calls.map(({ url, method }) => [url.pathname, method]), [
      [`/v1/stores/${STORE_ID}/inventory-units`, "POST"],
      [`/v1/stores/${STORE_ID}/inventory-units`, "POST"],
      [`/v1/stores/${STORE_ID}/inventory-units/unit`, "GET"],
      [`/v1/stores/${STORE_ID}/inventory-units/unit/allocate`, "POST"],
      [`/v1/stores/${STORE_ID}/inventory-units/unit/unassign`, "POST"],
    ]);
    assert.deepEqual(calls[3].body, { fulfillment_job_id: "work", fulfillment_job_line_id: "line", fulfillment_unit_index: 3, expected_updated_at: 1700000000001 });
    assert.deepEqual(calls[4].body, { expected_updated_at: 1700000000002 });
  } finally { globalThis.fetch = original; }
});

test("Unit movement and write-off preserve explicit request identities and loaded revisions", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: JSON.parse(init.body) });
    return Response.json({ id: "unit/id" });
  };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.inventoryUnit;
    const scope = { store_id: OTHER_STORE_ID, id: "unit/id", expected_updated_at: 1700000000000 };
    for (const [method, path, body] of [
      ["move", "move", { request_id: "7c4e1a93-2d58-4b06-9f3e-5a8c0d2b6e19", to_store_location_id: "destination" }],
      ["writeOff", "write-off", { request_id: "e8b2d6f4-1a37-4c95-b0e8-3f6a9c2d5b71", reason: "Damaged beyond repair" }],
    ]) {
      const request = { ...scope, ...body };
      const before = structuredClone(request);
      await api[method](request);
      await api[method](request);
      assert.deepEqual(request, before);
      assert.deepEqual(calls.at(-1), calls.at(-2));
      assert.equal(calls.at(-1).url.pathname, `/v1/stores/${OTHER_STORE_ID}/inventory-units/unit%2Fid/${path}`);
      assert.equal(calls.at(-1).method, "POST");
      assert.deepEqual(calls.at(-1).body, { expected_updated_at: scope.expected_updated_at, ...body });
      for (const request_id of [undefined, `${method}-unit`, body.request_id.toUpperCase()]) {
        await assert.rejects(async () => api[method]({ ...request, request_id }), TypeError);
      }
    }
    assert.equal(calls.length, 4);
  } finally { globalThis.fetch = original; }
});

test("Unit execution inspection returns exact Fulfillment evidence and preserves its absence", async () => {
  const original = globalThis.fetch;
  const calls = [];
  const execution = { fulfillment_job_id: "work", fulfillment_job_line_id: "line", fulfillment_unit_index: 3,
    fulfillment_id: "fulfillment", executed_at: 1700000000000 };
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method });
    return Response.json(calls.length === 1 ? execution : null);
  };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.inventoryUnit;
    const query = { store_id: OTHER_STORE_ID, id: "unit/id" };
    assert.deepEqual(await api.execution(query), execution);
    assert.equal(await api.execution(query), null);
    assert.equal(calls.length, 2);
    assert.ok(calls.every(({ url, method }) => method === "GET" && !url.search && url.pathname === `/v1/stores/${OTHER_STORE_ID}/inventory-units/unit%2Fid/execution`));
    await assert.rejects(async () => api.execution({ store_id: "selected/store", id: "unit/id" }), TypeError);
    assert.equal(calls.length, 2);
  } finally { globalThis.fetch = original; }
});
