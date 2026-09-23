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
  tax: { version: "synthetic-fixture", noncommercial_customer_group_grants: false },
  invoicing: { series_key: "sales", issue_trigger: { type: "acceptance" } },
};
const operation = {
  id: "operation/a?b",
  store_id: "store/a?b",
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
  return createAdmin({ baseUrl: "https://api.example.test", storeId: operation.store_id, apiToken: "contract-token" });
}

test("Store settings preserve explicit null language without sending unchanged commerce defaults", async () => {
  const calls = [];
  await withFetch(async (url, init) => {
    calls.push({ url: String(url), method: init.method, body: JSON.parse(init.body) });
    return Response.json({ success: true });
  }, async () => {
    await client().store.update({ id: operation.store_id, contact_email: null, default_language: null });
    assert.deepEqual(calls, [{
      url: "https://api.example.test/v1/stores/store%2Fa%3Fb",
      method: "PUT",
      body: { id: operation.store_id, contact_email: null, default_language: null },
    }]);
  });
});

test("Store branding uses the exact Store path and keeps clearing explicit without extra reads", async () => {
  const calls = [];
  const signal = new AbortController().signal;
  const branding = { logo_media_id: null, icon_media_id: null, accent_color: "#345678" };
  const presentation = { id: "store/selected", name: "Selected Store", logo: null, icon: null, accent_color: "#345678" };
  await withFetch(async (url, init) => {
    calls.push({ url: String(url), method: init.method, body: init.body === undefined ? undefined : JSON.parse(init.body), signal: init.signal });
    return Response.json(init.method === "GET" ? presentation : { id: presentation.id, branding });
  }, async () => {
    const api = client().store.branding;
    assert.deepEqual(await api.get({ id: presentation.id }, { signal }), presentation);
    await api.update({ id: presentation.id, branding }, { signal });
    assert.deepEqual(calls, [
      { url: "https://api.example.test/v1/stores/store%2Fselected/branding", method: "GET", body: undefined, signal },
      { url: "https://api.example.test/v1/stores/store%2Fselected/branding", method: "PUT", body: { branding }, signal },
    ]);
  });
});

test("Store branding defaults to the configured Store and never replays a failed save", async () => {
  const calls = [];
  await withFetch(async (url, init) => {
    calls.push({ url: String(url), method: init.method });
    return Response.json({ message: "Response lost" }, { status: 503 });
  }, async () => {
    await assert.rejects(client().store.branding.update({ branding: {
      logo_media_id: null, icon_media_id: null, accent_color: null,
    } }), error => error.statusCode === 503);
    assert.deepEqual(calls, [{ url: "https://api.example.test/v1/stores/store%2Fa%3Fb/branding", method: "PUT" }]);
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
    const params = { operation_id: operation.id, request };
    await assert.rejects(api.initialize(params, { signal }), error => error.statusCode === 503);
    assert.equal(calls.length, 1);
    assert.deepEqual(await api.initialize(params, { signal }), operation);
    assert.deepEqual(calls[1], calls[0]);
    assert.deepEqual(calls[0], {
      url: "https://api.example.test/v1/stores/store%2Fa%3Fb/commerce/initializations",
      method: "POST", body: params, signal,
    });
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
    const params = { store_id: "store/override", operation_id: operation.id };
    assert.deepEqual(await api.getInitialization(params), operation);
    assert.deepEqual(await api.abortInitialization(params), aborted);
    const path = "https://api.example.test/v1/stores/store%2Foverride/commerce/initializations/operation%2Fa%3Fb";
    assert.deepEqual(calls, [
      { url: path, method: "GET", body: undefined },
      { url: `${path}/abort`, method: "POST", body: {} },
    ]);
  });
});
