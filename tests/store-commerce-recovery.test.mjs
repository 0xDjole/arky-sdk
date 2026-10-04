import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/index.js";
import { MemoryStorage, ExclusiveLockManager } from "./helpers/durable-request-fixtures.mjs";

const storeId = "8f1d5b37-2c94-4e60-a7b8-0d3e6c9f2a15";
const otherId = "3b7e0a92-6d15-4f48-8c2a-9e1f4d7b5c30";
const operationId = "36b10e69-2a3d-440d-8b41-4e9b615e1fb9";
const key = `arky:commerce-initialization:v1:${storeId}`;
const request = {
  market: { key: "ba", currency: "bam", tax_mode: "exclusive" },
  sales_channel: { key: "web", name: "Website" },
  seller: { legal_name: "Synthetic seller", address: { country: "BA" }, registration_number: null, tax_registrations: [] },
  tax: { version: "synthetic-policy-not-jurisdiction-certification", noncommercial_subscription_grants: false },
};

function store(commerce = { type: "uninitialized" }) {
  return { id: storeId, name: "Contract Store", commerce };
}

function receipt(payload, status = { type: "pending", last_error: null }) {
  return {
    id: payload.operation_id, store_id: storeId, account_id: otherId, request: payload.request,
    request_fingerprint: "sha256-v1:contract", market_id: otherId, sales_channel_id: otherId,
    market_sales_channel_id: otherId, assortment_id: otherId, catalog_id: otherId, status,
    created_at: 1789970000000, updated_at: 1789970000000,
  };
}

function client() {
  return createAdmin({ baseUrl: "https://api.example.test", apiToken: "contract-token" });
}

async function browser(handler, run, storage = new MemoryStorage(), locks = new ExclusiveLockManager()) {
  const descriptors = Object.fromEntries(["fetch", "localStorage", "navigator"].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  for (const [name, value] of Object.entries({ fetch: handler, localStorage: storage, navigator: { locks } }))
    Object.defineProperty(globalThis, name, { configurable: true, value });
  try { await run(storage); } finally {
    for (const [name, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
}

test("browser commerce recovery keeps one accepted request through lost response, reload and confirmed completion", async () => {
  const posts = [];
  let currentStore = store();
  let operation;
  let first = true;
  const signal = new AbortController().signal;
  await browser(async (url, init) => {
    assert.equal(init.signal, signal);
    const path = new URL(url).pathname;
    if (init.method === "GET" && path === `/v1/stores/${storeId}`) return Response.json(currentStore);
    if (init.method === "GET") return operation ? Response.json(operation) : Response.json({ message: "missing" }, { status: 404 });
    const payload = JSON.parse(init.body);
    posts.push(payload);
    operation = receipt(payload);
    currentStore = store({ type: "initializing", operation_id: operation.id });
    if (first) {
      first = false;
      return Response.json({ message: "accepted response lost" }, { status: 503 });
    }
    return Response.json(operation, { status: 202 });
  }, async storage => {
    await assert.rejects(client().store.commerce.submitSetup({ store_id: storeId, request }, { signal }), error => error.statusCode === 503);
    assert.equal(posts.length, 1);
    const retained = storage.getItem(key);
    const saved = JSON.parse(JSON.parse(retained).requestJson);
    assert.equal(saved.store_id, storeId);
    assert.match(saved.operation_id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.equal(saved.request.seller.address.street1, null);
    assert.equal(saved.request.seller.address.country, "BA");
    const recovered = await client().store.commerce.inspectSetup({ store_id: storeId }, { signal });
    assert.deepEqual(recovered.request, saved);
    assert.equal(recovered.operation.status.type, "pending");
    assert.equal(posts.length, 1);
    await assert.rejects(client().store.commerce.submitSetup({ store_id: storeId, request }, { signal }), /existing setup must be resolved/);
    await client().store.commerce.submitSetup({ store_id: storeId }, { signal });
    assert.deepEqual(posts[1], posts[0]);
    assert.equal(storage.getItem(key), retained);
    operation = { ...operation, status: { type: "completed", completed_at: operation.updated_at } };
    currentStore = store({ type: "ready", default_sales_channel_id: otherId, seller: operation.request.seller, tax: operation.request.tax });
    const completed = await client().store.commerce.inspectSetup({ store_id: storeId }, { signal });
    assert.equal(completed.store.commerce.type, "ready");
    assert.equal(completed.request, null);
    assert.equal(completed.operation.status.type, "completed");
    assert.equal(storage.getItem(key), null);
    assert.equal(posts.length, 2);
  });
});

test("a retained legacy commerce request replays its original serialized property order and optional address shape", async () => {
  const saved = { operation_id: operationId, request, store_id: storeId };
  const storage = new MemoryStorage();
  const retained = JSON.stringify({ requestJson: JSON.stringify(saved) });
  storage.seed(key, retained);
  let operation;
  let currentStore = store();
  let posts = 0;
  await browser(async (url, init) => {
    if (init.method === "GET" && new URL(url).pathname === `/v1/stores/${storeId}`) return Response.json(currentStore);
    if (init.method === "GET") return operation ? Response.json(operation) : Response.json({ message: "missing" }, { status: 404 });
    posts += 1;
    assert.deepEqual(JSON.parse(init.body), { operation_id: operationId, request });
    operation = receipt(saved);
    currentStore = store({ type: "initializing", operation_id: operationId });
    return Response.json(operation, { status: 202 });
  }, async () => {
    const result = await client().store.commerce.submitSetup({ store_id: storeId });
    assert.equal(result.operation.id, operationId);
    assert.deepEqual(result.request, saved);
    assert.equal(posts, 1);
    assert.equal(storage.getItem(key), retained);
  }, storage);
});

test("corrupt, foreign-scope and malformed retained commerce requests fail before any HTTP or replacement", async () => {
  const valid = { store_id: storeId, operation_id: operationId, request };
  for (const payload of [
    { ...valid, store_id: otherId },
    { ...valid, operation_id: "not-an-operation" },
    { ...valid, request: { ...request, market: { ...request.market, currency: "BAM" } } },
    { ...valid, request: { ...request, seller: { ...request.seller, client_secret: "must-never-be-retained" } } },
    { ...valid, request: { ...request, seller: { ...request.seller, tax_registrations: [{ registration: { country: "BA", region: null, identifier: "fixture", status: { type: "verified", verified_at: 1.5 } }, starts_at: 0, ends_at: null }] } } },
  ]) {
    const storage = new MemoryStorage();
    const retained = JSON.stringify({ requestJson: JSON.stringify(payload) });
    storage.seed(key, retained);
    await browser(async () => { throw new Error("Invalid local request must not reach HTTP"); }, async () => {
      await assert.rejects(client().store.commerce.inspectSetup({ store_id: storeId }), /saved commerce request is invalid/);
      assert.equal(storage.getItem(key), retained);
    }, storage);
  }
  const storage = new MemoryStorage();
  storage.seed(key, "{corrupt");
  await browser(async () => { throw new Error("Corrupt storage must not reach HTTP"); }, async () => {
    await assert.rejects(client().store.commerce.submitSetup({ store_id: storeId, request }), /state is corrupt/);
    assert.equal(storage.getItem(key), "{corrupt");
  }, storage);
});

test("foreign and malformed terminal receipts cannot clear or replace the retained request", async () => {
  const saved = { store_id: storeId, operation_id: operationId, request };
  const terminal = receipt(saved, { type: "completed", completed_at: 1789970000000 });
  for (const operation of [
    { ...terminal, id: otherId },
    { ...terminal, store_id: otherId },
    { ...terminal, request: { ...request, tax: { ...request.tax, version: "different" } } },
    { ...terminal, status: { type: "unknown" } },
    { ...terminal, status: { type: "completed" } },
  ]) {
    const storage = new MemoryStorage();
    const retained = JSON.stringify({ requestJson: JSON.stringify(saved) });
    storage.seed(key, retained);
    await browser(async (url, init) => {
      assert.equal(init.method, "GET");
      return Response.json(new URL(url).pathname === `/v1/stores/${storeId}` ? store() : operation);
    }, async () => {
      await assert.rejects(client().store.commerce.inspectSetup({ store_id: storeId }), /receipt does not match/);
      assert.equal(storage.getItem(key), retained);
    }, storage);
  }
});

test("a different native initialization keeps local recovery evidence without reading or aborting its operation", async () => {
  const saved = { store_id: storeId, operation_id: operationId, request };
  const storage = new MemoryStorage();
  const retained = JSON.stringify({ requestJson: JSON.stringify(saved) });
  storage.seed(key, retained);
  let reads = 0;
  await browser(async (url, init) => {
    assert.equal(init.method, "GET");
    assert.equal(new URL(url).pathname, `/v1/stores/${storeId}`);
    reads += 1;
    return Response.json(store({ type: "initializing", operation_id: otherId }));
  }, async () => {
    await assert.rejects(client().store.commerce.abortSetup({ store_id: storeId, operation_id: operationId }), /Another initialization owns/);
    assert.equal(reads, 1);
    assert.equal(storage.getItem(key), retained);
  }, storage);
});

test("an accepted abort with a lost response clears only after its exact native terminal receipt is read", async () => {
  const saved = { store_id: storeId, operation_id: operationId, request };
  const storage = new MemoryStorage();
  const retained = JSON.stringify({ requestJson: JSON.stringify(saved) });
  storage.seed(key, retained);
  let operation = receipt(saved);
  let currentStore = store({ type: "initializing", operation_id: operationId });
  let posts = 0;
  await browser(async (url, init) => {
    const path = new URL(url).pathname;
    if (init.method === "GET") return Response.json(path === `/v1/stores/${storeId}` ? currentStore : operation);
    assert.equal(path, `/v1/stores/${storeId}/commerce/initializations/${operationId}/abort`);
    assert.equal(init.body, undefined);
    posts += 1;
    operation = { ...operation, status: { type: "aborted", aborted_at: operation.updated_at, account_id: otherId } };
    currentStore = store();
    return Response.json({ message: "abort response lost" }, { status: 503 });
  }, async () => {
    await assert.rejects(client().store.commerce.abortSetup({ store_id: storeId, operation_id: operationId }), error => error.statusCode === 503);
    assert.equal(storage.getItem(key), retained);
    const recovered = await client().store.commerce.inspectSetup({ store_id: storeId });
    assert.equal(recovered.operation.status.type, "aborted");
    assert.equal(recovered.request, null);
    assert.equal(storage.getItem(key), null);
    await assert.rejects(client().store.commerce.abortSetup({ store_id: storeId, operation_id: operationId }), /no longer pending/);
    assert.equal(posts, 1);
  }, storage);
});

test("unavailable persistence and cross-tab locks prevent new commerce effects", async () => {
  for (const storage of [new MemoryStorage({ writeError: new Error("blocked") }), new MemoryStorage({ discardWrites: true })]) {
    await browser(async (_url, init) => {
      assert.equal(init.method, "GET");
      return Response.json(store());
    }, async () => {
      await assert.rejects(client().store.commerce.submitSetup({ store_id: storeId, request }), /state cannot be saved|state was not saved exactly/);
      assert.equal(storage.getItem(key), null);
    }, storage);
  }
  await browser(async () => { throw new Error("Unavailable locks must not reach HTTP"); }, async () => {
    await assert.rejects(client().store.commerce.submitSetup({ store_id: storeId, request }), /cross-tab lock is unavailable/);
  }, new MemoryStorage(), null);
  let enter;
  let release;
  const entered = new Promise(resolve => { enter = resolve; });
  const released = new Promise(resolve => { release = resolve; });
  let blocked = true;
  let operation;
  let currentStore = store();
  let posts = 0;
  await browser(async (url, init) => {
    if (init.method === "GET" && new URL(url).pathname === `/v1/stores/${storeId}`) {
      if (blocked) { blocked = false; enter(); await released; }
      return Response.json(currentStore);
    }
    if (init.method === "GET") return Response.json(operation);
    posts += 1;
    operation = receipt(JSON.parse(init.body));
    currentStore = store({ type: "initializing", operation_id: operation.id });
    return Response.json(operation, { status: 202 });
  }, async () => {
    const first = client().store.commerce.submitSetup({ store_id: storeId, request });
    await entered;
    await assert.rejects(client().store.commerce.submitSetup({ store_id: storeId, request }), /already active in another tab/);
    release();
    await first;
    assert.equal(posts, 1);
  });
});
