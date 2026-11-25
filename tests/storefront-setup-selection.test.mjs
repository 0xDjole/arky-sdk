import assert from "node:assert/strict";
import test from "node:test";
import { createStorefront, initialize } from "../dist/storefront.js";
import { apiUrl, fixedIdFactories, ids, storefrontIdentity, recordFetch, visitorStorage } from "./helpers/arky-fixtures.mjs";

const market = (key, currency = "eur") => ({ id: `id-${key}`, key, currency, tax_mode: "exclusive", payment_option_ids: [`provider-${key}`] });
const setup = () => ({
  name: "Store",
  timezone: "UTC",
  languages: ["en"],
  payment_options: [{ id: "provider-retail", key: "manual", type: "manual", blocks: [] }],
  customer_sign_in: { type: "store" },
  seller: { type: "none" },
});

test("the setup carries no market, and the selected market is one exact read by key", async (context) => {
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront") return setup();
    if (call.path === "/v1/storefront/markets/by-key/trade") return market("trade", "usd");
    throw new Error(`Unexpected request: ${call.path}`);
  }, { answerMarkets: false });
  const store = initialize(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, market: "trade" });
  const loaded = await store.store.load();
  assert.deepEqual(loaded, setup());
  assert.equal("markets" in loaded, false);
  assert.equal("default_market" in loaded, false);
  assert.equal(store.getMarket(), "trade");
  assert.deepEqual(store.market.get(), market("trade", "usd"));
  assert.equal(store.currency.get(), "usd");
  assert.deepEqual(store.market.get().payment_option_ids, ["provider-trade"]);
  assert.equal("allowed_payment_option_ids" in store, false);
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["GET", "/v1/storefront"],
    ["GET", "/v1/storefront/markets/by-key/trade"],
  ]);
  await store.store.load();
  assert.deepEqual(await store.client.store.market.getCurrent(), market("trade", "usd"));
  assert.deepEqual(calls.map((call) => call.path).slice(2), [], "the client keeps one read of the selected market");
});

test("without an explicit market the setup loads without inventing one, and a malformed market key is refused up front", async (context) => {
  const calls = recordFetch(context, () => setup());
  const store = initialize(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl });
  assert.deepEqual(await store.store.load(), setup());
  assert.equal(store.market.get(), null);
  assert.equal(store.currency.get(), null);
  assert.equal(store.getMarket(), "");
  assert.deepEqual(calls.map((call) => call.path), ["/v1/storefront"]);
  for (const selected of ["Retail", "retail market", "retail\tmarket"]) {
    assert.throws(() => initialize(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, market: selected }), /market must be a valid exact key/);
    assert.throws(() => createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, market: selected }), /market must be a valid exact key/);
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
  }, { answerMarkets: false });
  const store = initialize(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, market: "old" });
  const rejected = assert.rejects(store.store.load(), /market changed while the store setup was loading/);
  await requested;
  store.setContext({ market: "new" });
  assert.equal(store.market.get(), null);
  await store.store.load();
  release();
  await rejected;
  assert.equal(store.market.get().key, "new");
  assert.equal(store.currency.get(), "usd");
  assert.deepEqual(store.market.get().payment_option_ids, ["provider-new"]);
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
  }, { answerMarkets: false });
  const store = initialize(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, market: "trade" });
  await assert.rejects(store.store.load(), (error) => error.statusCode === 503);
  assert.equal(store.market.get(), null);
  failure = false;
  await assert.rejects(store.store.load(), /didn't confirm the selected key/);
  assert.equal(store.market.get(), null);
  assert.equal(store.currency.get(), null);
  assert.ok(calls.every((call) => call.path === "/v1/storefront" || call.path === "/v1/storefront/markets/by-key/trade"));
});

test("a market read by key encodes the key and creates no session", async (context) => {
  const calls = recordFetch(context, () => market("retail"), { answerMarkets: false });
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl });
  await client.store.market.getByKey({ key: "a/b" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, "/v1/storefront/markets/by-key/a%2Fb");
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].headers.get("authorization"), null);
  assert.equal(client.hasSession, false);
});

test("terms_changed_rereads_the_setup", async (context) => {
  let wording = "Save this card for renewals.";
  const setupWith = () => ({
    name: "Store",
    timezone: "UTC",
    languages: ["en"],
    payment_options: [{ id: ids.paymentOption, key: "card", blocks: [], type: "stripe", saved_card_terms: { en: wording } }],
    customer_sign_in: { type: "network", network_id: ids.network },
    seller: { type: "none" },
  });
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront") return setupWith();
    if (call.path === "/v1/storefront/markets/by-key/trade") return market("trade");
    if (call.path === "/v1/storefront/payment-methods/setup") {
      if (call.body.terms !== wording) {
        return Response.json({ message: "The saved-card wording changed; reload it and ask again", error: "PAYMENT_METHOD.TERMS_CHANGED", status_code: 409, validation_errors: [] }, { status: 409 });
      }
      return { id: call.body.id };
    }
    throw new Error(`Unexpected request: ${call.path}`);
  }, { answerMarkets: false });
  const store = initialize(storefrontIdentity, { ...fixedIdFactories, apiUrl, market: "trade", sessionStorage: visitorStorage() });
  const shown = (await store.store.load()).payment_options[0].saved_card_terms.en;
  wording = "Save this card for renewals and owed charges.";
  const request = {
    id: ids.payment,
    owner: { type: "customer", customer_id: ids.customer },
    payment_option_id: ids.paymentOption,
    language: "en",
    terms: shown,
    accept_storage_and_off_session_use: true,
  };
  await assert.rejects(store.eshop.paymentMethod.requestSetup(request), (error) => error.code === "PAYMENT_METHOD.TERMS_CHANGED");
  const reloaded = await store.store.load();
  assert.equal(reloaded.payment_options[0].saved_card_terms.en, wording);
  assert.equal(store.setup.get().payment_options[0].saved_card_terms.en, wording);
  assert.deepEqual(await store.eshop.paymentMethod.requestSetup({ ...request, terms: reloaded.payment_options[0].saved_card_terms.en }), { id: ids.payment });
  assert.deepEqual(await store.getSetup(), reloaded);
  assert.deepEqual(calls.map((call) => call.path), [
    "/v1/storefront",
    "/v1/storefront/markets/by-key/trade",
    "/v1/storefront/payment-methods/setup",
    "/v1/storefront",
    "/v1/storefront/payment-methods/setup",
  ]);
  assert.deepEqual(store.market.get(), market("trade"), "the client's one market cache still answers the unchanged market");
});

test("the setup names the store's seller by its legal name and postal address, or none, as Arky answers it", async (context) => {
  const address = {
    name: null,
    company: "Klinika Sinapsa d.o.o.",
    street1: "Zmaja od Bosne 7",
    street2: null,
    city: "Sarajevo",
    state: null,
    postal_code: "71000",
    country: "BA",
    phone: "+38733000001",
    email: "racuni@example.test",
  };
  const sellers = [{ type: "seller", name: "Klinika Sinapsa d.o.o.", address }, { type: "none" }];
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront") return { ...setup(), seller: sellers.shift() };
    throw new Error(`Unexpected request: ${call.path}`);
  }, { answerMarkets: false });
  const named = createStorefront(storefrontIdentity, { ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() });
  assert.deepEqual((await named.getSetup()).seller, { type: "seller", name: "Klinika Sinapsa d.o.o.", address });
  assert.deepEqual((await named.getSetup()).seller, { type: "seller", name: "Klinika Sinapsa d.o.o.", address });
  const unnamed = createStorefront(storefrontIdentity, { ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() });
  assert.deepEqual((await unnamed.getSetup()).seller, { type: "none" });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["GET", "/v1/storefront", null],
    ["GET", "/v1/storefront", null],
  ]);
});
