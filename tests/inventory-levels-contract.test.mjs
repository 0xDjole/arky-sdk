import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

test("inventory levels retain combined parent filters, ordering and empty-page continuations", async () => {
  const admin = createAdmin({
    baseUrl: "https://api.example.test",
    storeId: "configured-store",
    apiToken: "arky_api_inventory_contract",
  });
  const calls = [];
  const responses = [
    { items: [], cursor: "next-projected-page" },
    { items: [{ id: "level", on_hand: 10, reserved: 3 }], cursor: null },
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
      store_id: "selected-store",
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
    assert.deepEqual(second, { items: [{ id: "level", on_hand: 10, reserved: 3 }], cursor: null });
    for (const call of calls) {
      assert.equal(call.method, "GET");
      assert.equal(call.url.pathname, "/v1/stores/selected-store/inventory-levels");
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
    storeId: "inventory-store",
    apiToken: "arky_api_inventory_contract",
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ message: "Search unavailable" }), {
    status: 503,
    headers: { "content-type": "application/json" },
  });
  try {
    await assert.rejects(admin.eshop.inventoryLevel.find({ inventory_item_id: "component" }));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("inventory history preserves combined filters, native continuations and exact unit progress", async () => {
  const admin = createAdmin({ baseUrl: "https://api.example.test", storeId: "inventory-store", apiToken: "arky_api_inventory_contract" });
  const progress = { consumed_units: [{ first_unit: 0, quantity: 2 }], released_units: [] };
  const record = { id: "reservation", unit_progress: progress };
  const responses = [{ items: [], cursor: "movement-next" }, { items: [record], cursor: "reservation-next" }];
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    calls.push(new URL(url));
    return new Response(JSON.stringify(responses.shift()), { headers: { "content-type": "application/json" } });
  };
  try {
    const common = { inventory_item_id: "item", store_location_id: "location", command_id: "command", limit: 10, sort_direction: "desc" };
    assert.deepEqual(await admin.eshop.inventoryMovement.find({ ...common, sort_field: "created_at" }), { items: [], cursor: "movement-next" });
    const page = await admin.eshop.inventoryReservation.find({ ...common, order_id: "order", active_only: true, sort_field: "updated_at", cursor: "reservation-before" });
    assert.deepEqual(page, { items: [record], cursor: "reservation-next" });
    assert.deepEqual(page.items[0].unit_progress, progress);
    for (const url of calls) {
      assert.equal(url.searchParams.get("inventory_item_id"), "item");
      assert.equal(url.searchParams.get("store_location_id"), "location");
      assert.equal(url.searchParams.get("command_id"), "command");
      assert.equal(url.searchParams.get("sort_direction"), "desc");
    }
    assert.equal(calls[0].pathname, "/v1/stores/inventory-store/inventory-movements");
    assert.equal(calls[1].pathname, "/v1/stores/inventory-store/inventory-reservations");
    assert.equal(calls[1].searchParams.get("active_only"), "true");
    assert.equal(calls[1].searchParams.get("order_id"), "order");
    assert.equal(calls[1].searchParams.get("cursor"), "reservation-before");
  } finally { globalThis.fetch = originalFetch; }
});

test("inventory item search sends identifier text and filters without trimming a returned page", async () => {
  const admin = createAdmin({ baseUrl: "https://api.example.test", storeId: "inventory-store", apiToken: "arky_api_inventory_contract" });
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
    const first = await admin.eshop.inventoryItem.find(query);
    assert.deepEqual(first, { items: [], cursor: "next" });
    assert.equal(calls.length, 1);
    assert.deepEqual(await admin.eshop.inventoryItem.find({ ...query, cursor: first.cursor }), { items: [record], cursor: null });
    for (const url of calls) {
      assert.equal(url.pathname, "/v1/stores/inventory-store/inventory-items");
      for (const [key, value] of Object.entries(query)) assert.equal(url.searchParams.get(key), String(value));
    }
    assert.equal(calls[1].searchParams.get("cursor"), "next");
  } finally { globalThis.fetch = originalFetch; }
});

test("inventory key lookup reads one authoritative record without searching pages", async () => {
  const admin = createAdmin({ baseUrl: "https://api.example.test", storeId: "configured", apiToken: "arky_api_inventory_contract" });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    calls.push(new URL(url));
    return new Response(JSON.stringify({ id: "item", key: "steel-string" }), { headers: { "content-type": "application/json" } });
  };
  try {
    assert.deepEqual(await admin.eshop.inventoryItem.getByKey({ store_id: "selected", key: "steel-string" }), { id: "item", key: "steel-string" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].pathname, "/v1/stores/selected/inventory-items/by-key/steel-string");
    assert.equal(calls[0].search, "");
  } finally { globalThis.fetch = originalFetch; }
});
