import assert from "node:assert/strict";
import test from "node:test";
import { createStorefront, initialize } from "../dist/storefront.js";
import { apiUrl, publishableKey, recordFetch } from "./helpers/arky-fixtures.mjs";

const market = (key, currency = "eur") => ({ id: `id-${key}`, key, currency, tax_mode: "exclusive", payment_option_ids: [`provider-${key}`] });
const setup = () => ({
  name: "Store",
  timezone: "UTC",
  languages: ["en"],
  payment_options: [{ id: "provider-retail", key: "manual", type: "manual", blocks: [] }],
});

test("the setup carries no market, and the selected market is one exact read by key", async (context) => {
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront") return setup();
    if (call.path === "/v1/storefront/markets/by-key/trade") return market("trade", "usd");
    throw new Error(`Unexpected request: ${call.path}`);
  });
  const store = initialize(publishableKey, { apiUrl, market: "trade" });
  const loaded = await store.store.load();
  assert.deepEqual(loaded, setup());
  assert.equal("markets" in loaded, false);
  assert.equal("default_market" in loaded, false);
  assert.equal(store.getMarket(), "trade");
  assert.deepEqual(store.market.get(), market("trade", "usd"));
  assert.equal(store.currency.get(), "usd");
  assert.deepEqual(store.allowed_payment_option_ids.get(), ["provider-trade"]);
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["GET", "/v1/storefront"],
    ["GET", "/v1/storefront/markets/by-key/trade"],
  ]);
  await store.store.load();
  assert.deepEqual(calls.map((call) => call.path).slice(2), ["/v1/storefront/markets/by-key/trade"]);
});

test("without an explicit market the setup loads without inventing one, and a malformed market key is refused up front", async (context) => {
  const calls = recordFetch(context, () => setup());
  const store = initialize(publishableKey, { apiUrl });
  assert.deepEqual(await store.store.load(), setup());
  assert.equal(store.market.get(), null);
  assert.equal(store.currency.get(), null);
  assert.deepEqual(store.allowed_payment_option_ids.get(), []);
  assert.equal(store.getMarket(), "");
  assert.deepEqual(calls.map((call) => call.path), ["/v1/storefront"]);
  for (const selected of ["Retail", "retail market", "retail\tmarket"]) {
    assert.throws(() => initialize(publishableKey, { apiUrl, market: selected }), /market must be a valid exact key/);
    assert.throws(() => createStorefront(publishableKey, { apiUrl, market: selected }), /market must be a valid exact key/);
    assert.throws(() => createStorefront(publishableKey, { apiUrl, salesChannel: selected }), /sales channel must be a valid exact key/);
  }
});

test("a late market read can't replace a newer market selection or its currency and payment options", async (context) => {
  let release;
  let started;
  const waiting = new Promise((resolve) => {
    release = resolve;
  });
  const requested = new Promise((resolve) => {
    started = resolve;
  });
  recordFetch(context, async (call) => {
    if (call.path === "/v1/storefront") return setup();
    if (call.path.endsWith("/old")) {
      started();
      await waiting;
      return market("old", "jpy");
    }
    if (call.path.endsWith("/new")) return market("new", "usd");
    throw new Error(`Unexpected request: ${call.path}`);
  });
  const store = initialize(publishableKey, { apiUrl, market: "old" });
  const rejected = assert.rejects(store.store.load(), /market changed while the store setup was loading/);
  await requested;
  store.setMarket("new");
  assert.equal(store.market.get(), null);
  assert.deepEqual(store.allowed_payment_option_ids.get(), []);
  await store.store.load();
  release();
  await rejected;
  assert.equal(store.market.get().key, "new");
  assert.equal(store.currency.get(), "usd");
  assert.deepEqual(store.allowed_payment_option_ids.get(), ["provider-new"]);
});

test("a failed or mismatched market read never falls back to another market", async (context) => {
  let failure = true;
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront") return setup();
    if (call.path.endsWith("/trade")) {
      return failure
        ? Response.json({ message: "unavailable", error: "GENERAL.UNAVAILABLE", status_code: 503, validation_errors: [] }, { status: 503 })
        : market("wrong");
    }
    throw new Error(`Unexpected request: ${call.path}`);
  });
  const store = initialize(publishableKey, { apiUrl, market: "trade" });
  await assert.rejects(store.store.load(), (error) => error.statusCode === 503);
  assert.equal(store.market.get(), null);
  failure = false;
  await assert.rejects(store.store.load(), /didn't confirm the selected key/);
  assert.equal(store.market.get(), null);
  assert.equal(store.currency.get(), null);
  assert.ok(calls.every((call) => call.path === "/v1/storefront" || call.path === "/v1/storefront/markets/by-key/trade"));
});

test("a market read by key encodes the key and creates no session", async (context) => {
  const calls = recordFetch(context, () => market("retail"));
  const client = createStorefront(publishableKey, { apiUrl });
  await client.store.market.getByKey("a/b");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, "/v1/storefront/markets/by-key/a%2Fb");
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].headers.get("authorization"), null);
  assert.equal(client.hasSession, false);
});
