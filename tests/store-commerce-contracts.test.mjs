import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/index.js";

const request = {
  market: { key: "us", currency: "usd", tax_mode: "exclusive" },
  sales_channel: { key: "web", name: "Website" },
  seller: {
    legal_name: "Synthetic seller",
    address: { country: "US" },
    registration_number: null,
    tax_registrations: [],
  },
  tax: { version: "synthetic-fixture", noncommercial_subscription_grants: false },
};
const STORE_ID = "8f1d5b37-2c94-4e60-a7b8-0d3e6c9f2a15";
const OTHER_STORE_ID = "3b7e0a92-6d15-4f48-8c2a-9e1f4d7b5c30";
const operation = {
  id: "operation/a?b",
  store_id: STORE_ID,
  account_id: "owner",
  request,
  request_fingerprint: "sha256-v1:fixture",
  market_id: "reserved-market",
  sales_channel_id: "reserved-channel",
  market_sales_channel_id: "reserved-pair",
  assortment_id: "reserved-assortment",
  catalog_id: "reserved-catalog",
  status: { type: "pending", last_error: null },
  created_at: 1789970000000,
  updated_at: 1789970000000,
};

async function withFetch(handler, run) {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  try { await run(); } finally { globalThis.fetch = original; }
}

function client() {
  return createAdmin({ baseUrl: "https://api.example.test", apiToken: "contract-token" });
}

test("Store settings preserve explicit null language without sending unchanged commerce defaults", async () => {
  const calls = [];
  await withFetch(async (url, init) => {
    calls.push({ url: String(url), method: init.method, body: JSON.parse(init.body) });
    return Response.json({ success: true });
  }, async () => {
    await client().store.update({ id: operation.store_id, contact_email: null, default_language: null });
    assert.deepEqual(calls, [{
      url: `https://api.example.test/v1/stores/${STORE_ID}`,
      method: "PUT",
      body: { contact_email: null, default_language: null },
    }]);
    await assert.rejects(async () => client().store.update({ id: "store/a?b", contact_email: null }), TypeError);
    assert.equal(calls.length, 1);
  });
});

test("customer workspace reads retain explicit Store identity and client binding without retired presentation fields", async () => {
  const calls = [];
  const signal = new AbortController().signal;
  const presentation = {
    store_id: OTHER_STORE_ID, store_name: "Selected Store", storefront_client_id: "client", publishable_key: "pk_contract",
    default_language: null, supported_languages: [],
  };
  await withFetch(async (url, init) => {
    calls.push({ url: String(url), method: init.method, signal: init.signal });
    return Response.json(presentation);
  }, async () => {
    const admin = client();
    assert.equal("branding" in admin.store, false);
    assert.equal("adminDomain" in admin.store, false);
    assert.deepEqual(await admin.store.customerWorkspace.get({ id: OTHER_STORE_ID }, { signal }), presentation);
    assert.deepEqual(calls, [{
      url: `https://api.example.test/v1/stores/${OTHER_STORE_ID}/customer-workspace`, method: "GET", signal,
    }]);
    await assert.rejects(() => admin.store.customerWorkspace.get({ id: "store/a?b" }), TypeError);
    assert.equal(calls.length, 1);
    assert.equal("branding" in presentation, false);
  });
});

test("commerce initialization keeps the caller's request and operation on explicit retry", async () => {
  const calls = [];
  const signal = new AbortController().signal;
  await withFetch(async (url, init) => {
    calls.push({ url: String(url), method: init.method, body: JSON.parse(init.body), signal: init.signal });
    return calls.length === 1 ? Response.json({ message: "response lost" }, { status: 503 }) : Response.json(operation, { status: 202 });
  }, async () => {
    const api = client().store.commerce;
    const params = { store_id: STORE_ID, operation_id: operation.id, request };
    await assert.rejects(api.initialize(params, { signal }), error => error.statusCode === 503);
    assert.equal(calls.length, 1);
    assert.deepEqual(await api.initialize(params, { signal }), operation);
    assert.deepEqual(calls[1], calls[0]);
    assert.deepEqual(calls[0], {
      url: `https://api.example.test/v1/stores/${STORE_ID}/commerce/initializations`,
      method: "POST", body: { operation_id: operation.id, request }, signal,
    });
    await assert.rejects(async () => api.initialize({ operation_id: operation.id, request }), TypeError);
    assert.equal(calls.length, 2);
  });
});

test("commerce initialization inspection is exact and read-only; abort is a separate command", async () => {
  const calls = [];
  const aborted = { ...operation, status: { type: "aborted", aborted_at: operation.updated_at, account_id: operation.account_id } };
  await withFetch(async (url, init) => {
    calls.push({ url: String(url), method: init.method, body: init.body === undefined ? undefined : JSON.parse(init.body) });
    return Response.json(init.method === "POST" ? aborted : operation);
  }, async () => {
    const api = client().store.commerce;
    const params = { store_id: OTHER_STORE_ID, operation_id: operation.id };
    assert.deepEqual(await api.getInitialization(params), operation);
    assert.deepEqual(await api.abortInitialization(params), aborted);
    const path = `https://api.example.test/v1/stores/${OTHER_STORE_ID}/commerce/initializations/operation%2Fa%3Fb`;
    assert.deepEqual(calls, [
      { url: path, method: "GET", body: undefined },
      { url: `${path}/abort`, method: "POST", body: undefined },
    ]);
  });
});

test("customer workspace reads and replacements target the explicit Store with the observed revision", async () => {
  const calls = [];
  const workspace = { revision: "workspace-revision-2", client: { storefront_client_id: "client", publishable_key: `arky_pk_${"w".repeat(42)}A` } };
  await withFetch(async (url, init) => {
    calls.push({ url: String(url), method: init.method, body: init.body === undefined ? undefined : JSON.parse(init.body) });
    return Response.json(init.method === "PUT" ? { id: STORE_ID } : { ...workspace.client, branding: null, default_language: null, supported_languages: [] });
  }, async () => {
    const api = client().store.customerWorkspace;
    await api.get({ id: STORE_ID });
    await api.update({ id: STORE_ID, expected_revision: "workspace-revision-1", customer_workspace: workspace });
    await assert.rejects(async () => api.update({ expected_revision: null, customer_workspace: workspace }), TypeError);
    await assert.rejects(async () => api.get({ id: "store/a?b" }), TypeError);
    assert.deepEqual(calls, [
      { url: `https://api.example.test/v1/stores/${STORE_ID}/customer-workspace`, method: "GET", body: undefined },
      { url: `https://api.example.test/v1/stores/${STORE_ID}/customer-workspace`, method: "PUT",
        body: { expected_revision: "workspace-revision-1", customer_workspace: workspace } },
    ]);
  });
});
