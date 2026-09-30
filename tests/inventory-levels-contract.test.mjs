import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const STORE_ID = "c9e3a5f1-7b26-4d80-9a4e-1f6b8d2c0e75";
const OTHER_STORE_ID = "5a1f8d3c-e642-4b97-8c05-9e2b7a4d1f63";
const requestId = (index) => `3f8a2c61-${String(index).padStart(4, "0")}-4e7b-9d05-2c6e8a1f4b39`;

test("inventory levels retain combined parent filters, ordering and empty-page continuations", async () => {
  const admin = createAdmin({
    baseUrl: "https://api.example.test",
    apiToken: "arky_api_inventory_contract",
  });
  const calls = [];
  const responses = [
    { items: [], cursor: "next-projected-page" },
    { items: [{ id: "level", on_hand: 10, reserved: 12, unavailable: 2, available: -4 }], cursor: null },
  ];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method });
    return new Response(JSON.stringify(responses.shift()), {
      headers: { "content-type": "application/json" },
    });
  };
  try {
    const query = {
      store_id: STORE_ID,
      inventory_item_id: "component",
      store_location_id: "warehouse",
      sort_field: "updated_at",
      sort_direction: "desc",
      limit: 25,
    };
    const first = await admin.eshop.inventoryLevel.find(query);
    assert.deepEqual(first, { items: [], cursor: "next-projected-page" });
    assert.equal(calls.length, 1, "the caller chooses whether to load another page");
    const second = await admin.eshop.inventoryLevel.find({ ...query, cursor: first.cursor });
    assert.deepEqual(second, { items: [{ id: "level", on_hand: 10, reserved: 12, unavailable: 2, available: -4 }], cursor: null });
    for (const call of calls) {
      assert.equal(call.method, "GET");
      assert.equal(call.url.pathname, `/v1/stores/${STORE_ID}/inventory-levels`);
      assert.equal(call.url.searchParams.get("inventory_item_id"), "component");
      assert.equal(call.url.searchParams.get("store_location_id"), "warehouse");
      assert.equal(call.url.searchParams.get("sort_field"), "updated_at");
      assert.equal(call.url.searchParams.get("sort_direction"), "desc");
      assert.equal(call.url.searchParams.get("limit"), "25");
      assert.equal(call.url.searchParams.has("store_id"), false);
    }
    assert.equal(calls[1].url.searchParams.get("cursor"), first.cursor);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("inventory index failure remains an error rather than zero stock", async () => {
  const admin = createAdmin({
    baseUrl: "https://api.example.test",
    apiToken: "arky_api_inventory_contract",
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ message: "Search unavailable" }), {
    status: 503,
    headers: { "content-type": "application/json" },
  });
  try {
    await assert.rejects(admin.eshop.inventoryLevel.find({ store_id: STORE_ID, inventory_item_id: "component" }), (error) => error.statusCode === 503);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Inventory history preserves combined filters, empty continuations and exact quantity changes", async () => {
  const admin = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_inventory_contract" });
  const record = { id: "movement", inventory_unit_id: "unit", quantity: { type: "on_hand" }, delta: -1, after: 7,
    reason: { type: "dispatched", fulfillment_order_id: "work", fulfillment_id: "fulfillment" } };
  const responses = [{ items: [], cursor: "movement-next" }, { items: [record], cursor: null }];
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    calls.push(new URL(url));
    return new Response(JSON.stringify(responses.shift()), { headers: { "content-type": "application/json" } });
  };
  try {
    const query = { inventory_item_id: "item", store_location_id: "location", inventory_unit_id: "unit",
      request_id: requestId(1), limit: 10, sort_field: "created_at", sort_direction: "desc" };
    assert.deepEqual(await admin.eshop.inventoryMovement.find({ store_id: STORE_ID, ...query }), { items: [], cursor: "movement-next" });
    assert.equal(calls.length, 1);
    assert.deepEqual(await admin.eshop.inventoryMovement.find({ store_id: STORE_ID, ...query, cursor: "movement-next" }), { items: [record], cursor: null });
    for (const url of calls) {
      assert.equal(url.pathname, `/v1/stores/${STORE_ID}/inventory-movements`);
      assert.equal(url.searchParams.has("store_id"), false);
      for (const [key, value] of Object.entries(query)) assert.equal(url.searchParams.get(key), String(value));
    }
    assert.equal(calls[1].searchParams.get("cursor"), "movement-next");
    assert.equal("inventoryReservation" in admin.eshop, false);
  } finally { globalThis.fetch = originalFetch; }
});

test("Stock reads retain unavailable and negative available quantities with resolved item identity", async () => {
  const admin = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_inventory_contract" });
  const record = { id: "level", inventory_item_id: "item", store_location_id: "location", on_hand: 2, reserved: 5,
    unavailable: 1, available: -4, item: { key: "milk", sku: null, tracking: { type: "tracked" } } };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    calls.push(new URL(url));
    return new Response(JSON.stringify({ items: [record], cursor: null }), { headers: { "content-type": "application/json" } });
  };
  try {
    const query = { store_id: OTHER_STORE_ID, inventory_item_id: "item", store_location_id: "location", limit: 5, cursor: "" };
    assert.deepEqual(await admin.eshop.inventoryLevel.stock(query), { items: [record], cursor: null });
    assert.equal(calls[0].pathname, `/v1/stores/${OTHER_STORE_ID}/inventory-levels/stock`);
    assert.deepEqual(Object.fromEntries(calls[0].searchParams), { inventory_item_id: "item", store_location_id: "location", limit: "5", cursor: "" });
  } finally { globalThis.fetch = originalFetch; }
});

test("Inventory commands preserve replay identity, revision and exact incoming stock type", async () => {
  const admin = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_inventory_contract" });
  const record = { id: "level/id", on_hand: 10, reserved: 2, unavailable: 3, available: 5 };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), method: init.method, body: JSON.parse(init.body) });
    return new Response(JSON.stringify(record), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = admin.eshop.inventoryLevel;
    const cases = [
      ["setAside", "set-aside", { quantity: 3, reason: "Awaiting inspection" }],
      ["makeAvailable", "make-available", { quantity: 2, reason: "Inspection passed" }],
      ["move", "move", { to_store_location_id: "destination", quantity: 4 }],
      ["receiveMove", "incoming", { type: { type: "counted", from_store_location_id: "origin", quantity: 4 } }],
      ["receiveMove", "incoming", { type: { type: "unit", asset_tag: "MACHINE-42" } }],
    ];
    for (const [index, [method, path, payload]] of cases.entries()) {
      const body = { request_id: requestId(index), expected_updated_at: 1700000000000, ...payload };
      const request = { store_id: OTHER_STORE_ID, id: "level/id", ...body };
      const before = structuredClone(request);
      assert.deepEqual(await api[method](request), record);
      assert.deepEqual(await api[method](request), record);
      assert.deepEqual(request, before);
      assert.deepEqual(calls.at(-1), calls.at(-2));
      assert.deepEqual(calls.at(-1), {
        url: `https://api.example.test/v1/stores/${OTHER_STORE_ID}/inventory-levels/level%2Fid/${path}`, method: "POST", body,
      });
      await assert.rejects(async () => api[method]({ ...request, request_id: `command-${index}` }), TypeError);
    }
    assert.equal(calls.length, cases.length * 2);
  } finally { globalThis.fetch = originalFetch; }
});

test("Manual stock corrections retain their original level and source line on replay", async () => {
  const admin = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_inventory_contract" });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), method: init.method, body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ id: "movement" }), { headers: { "content-type": "application/json" } });
  };
  try {
    const body = { inventory_item_id: "milk", store_location_id: "warehouse", request_id: requestId(7), source_line_id: "line",
      expected_level_id: "level", expected_level_updated_at: 1700000000000, delta: -2, from_set_aside: true,
      reason: { type: "damage", reference: "inspection-42" } };
    const request = { store_id: OTHER_STORE_ID, ...body };
    const before = structuredClone(request);
    await admin.eshop.inventoryMovement.record(request);
    await admin.eshop.inventoryMovement.record(request);
    assert.deepEqual(request, before);
    assert.deepEqual(calls, [0, 1].map(() => ({
      url: `https://api.example.test/v1/stores/${OTHER_STORE_ID}/inventory-movements`, method: "POST", body,
    })));
    await assert.rejects(async () => admin.eshop.inventoryMovement.record({ ...request, request_id: "damage-report" }), TypeError);
    assert.equal(calls.length, 2);
  } finally { globalThis.fetch = originalFetch; }
});

test("inventory item search sends identifier text and filters without trimming a returned page", async () => {
  const admin = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_inventory_contract" });
  const calls = [];
  const record = { id: "item", key: "component", sku: "COBALT", barcode: "998877665544" };
  const responses = [{ items: [], cursor: "next" }, { items: [record], cursor: null }];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    calls.push(new URL(url));
    return new Response(JSON.stringify(responses.shift()), { headers: { "content-type": "application/json" } });
  };
  try {
    const query = { query: "cobalt", status: "archived", tracking: "untracked", sort_field: "updated_at", sort_direction: "asc", limit: 20 };
    const first = await admin.eshop.inventoryItem.find({ store_id: STORE_ID, ...query });
    assert.deepEqual(first, { items: [], cursor: "next" });
    assert.equal(calls.length, 1);
    assert.deepEqual(await admin.eshop.inventoryItem.find({ store_id: STORE_ID, ...query, cursor: first.cursor }), { items: [record], cursor: null });
    for (const url of calls) {
      assert.equal(url.pathname, `/v1/stores/${STORE_ID}/inventory-items`);
      for (const [key, value] of Object.entries(query)) assert.equal(url.searchParams.get(key), String(value));
    }
    assert.equal(calls[1].searchParams.get("cursor"), "next");
  } finally { globalThis.fetch = originalFetch; }
});

test("inventory key lookup reads one authoritative record without searching pages", async () => {
  const admin = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_inventory_contract" });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    calls.push(new URL(url));
    return new Response(JSON.stringify({ id: "item", key: "steel-string" }), { headers: { "content-type": "application/json" } });
  };
  try {
    assert.deepEqual(await admin.eshop.inventoryItem.getByKey({ store_id: STORE_ID, key: "steel-string" }), { id: "item", key: "steel-string" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].pathname, `/v1/stores/${STORE_ID}/inventory-items/by-key/steel-string`);
    assert.equal(calls[0].search, "");
  } finally { globalThis.fetch = originalFetch; }
});
