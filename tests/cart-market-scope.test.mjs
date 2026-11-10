import assert from "node:assert/strict";
import test from "node:test";
import { CartError, createStorefront, initialize } from "../dist/storefront.js";
import {
  apiUrl,
  cartRecord,
  errorResponse,
  ids,
  idFactories,
  marketRecord,
  storefrontIdentity,
  recordFetch,
  SessionStorage,
  sessionResult,
  visitorSession,
  visitorStorage,
} from "./helpers/arky-fixtures.mjs";

const customer = { type: "customer" };
const germany = "1f0a4c7e-8b32-4d59-a6e1-3c9d7b5f2e80";
const austria = "7d2e9b41-6c05-4a38-9f7e-5b1c8d3a6f92";
const marketIds = { de: germany, at: austria };

function storefront(storage, options = {}) {
  return createStorefront(storefrontIdentity, { ...idFactories, apiUrl, locale: "en", market: "de", sessionStorage: storage, ...options });
}

function marketServer(context, respond = () => { throw new Error("Unexpected request"); }) {
  return recordFetch(context, (call) => {
    const key = call.path.match(/^\/v1\/storefront\/markets\/by-key\/(.+)$/)?.[1];
    if (key) return marketRecord(key, { id: marketIds[key] });
    if (call.path === "/v1/storefront/carts") {
      return {
        type: "created",
        cart: cartRecord({ id: call.body.id, package_id: call.body.package_id, market_id: call.body.market_id }),
        recovery_token: `token-${call.body.id}`,
      };
    }
    return respond(call);
  }, { answerMarkets: false });
}

test("a storefront cart names the context market's id, read once per market key, under that market's header", async (context) => {
  const storage = visitorStorage();
  const calls = marketServer(context);
  const api = storefront(storage);
  await api.eshop.cart.create({ id: ids.cart, buyer: customer, package_id: ids.package });
  await api.eshop.cart.create({ id: ids.otherCart, buyer: customer, package_id: ids.otherPackage });
  api.setContext({ market: "at" });
  await api.eshop.cart.create({ id: ids.thirdCart, buyer: customer, package_id: ids.package });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body?.market_id ?? null, call.headers.get("x-arky-market")]), [
    ["GET", "/v1/storefront/markets/by-key/de", null, "de"],
    ["POST", "/v1/storefront/carts", germany, "de"],
    ["POST", "/v1/storefront/carts", germany, "de"],
    ["GET", "/v1/storefront/markets/by-key/at", null, "at"],
    ["POST", "/v1/storefront/carts", austria, "at"],
  ]);
  const selected = storage.keys("arky:selected-cart:v3:");
  assert.equal(selected.length, 3);
  assert.equal(selected.filter((key) => key.includes(`:de:customer:${ids.package}`)).length, 1);
  assert.equal(selected.filter((key) => key.includes(`:at:customer:${ids.package}`)).length, 1);
});

test("two concurrent carts share one market read, and a failed read is tried again", async (context) => {
  let refuse = true;
  let reads = 0;
  const calls = recordFetch(context, (call) => {
    if (call.path.startsWith("/v1/storefront/markets/by-key/")) {
      reads += 1;
      if (refuse) return errorResponse(503, "GENERAL.UNAVAILABLE", "Unavailable");
      return marketRecord("de", { id: germany });
    }
    return { type: "created", cart: cartRecord({ id: call.body.id, package_id: call.body.package_id, market_id: call.body.market_id }), recovery_token: "token" };
  }, { answerMarkets: false });
  const api = storefront(visitorStorage());
  await assert.rejects(api.eshop.cart.create({ id: ids.cart, buyer: customer, package_id: ids.package }), (error) => error.statusCode === 503);
  assert.equal(calls.filter((call) => call.path === "/v1/storefront/carts").length, 0);
  refuse = false;
  reads = 0;
  await Promise.all([
    api.eshop.cart.create({ id: ids.cart, buyer: customer, package_id: ids.package }),
    api.eshop.cart.create({ id: ids.otherCart, buyer: customer, package_id: ids.otherPackage }),
  ]);
  assert.equal(reads, 1);
});

test("a market read that answers another key, or a cart created in another market, is never selected", async (context) => {
  const storage = visitorStorage();
  recordFetch(context, () => marketRecord("other"), { answerMarkets: false });
  await assert.rejects(storefront(storage).eshop.cart.create({ id: ids.cart, buyer: customer, package_id: ids.package }), (error) => error instanceof CartError && error.code === "answer_mismatch");
  context.mock.restoreAll();
  recordFetch(context, (call) => {
    if (call.path.startsWith("/v1/storefront/markets/by-key/")) return marketRecord("de", { id: germany });
    return { type: "created", cart: cartRecord({ id: call.body.id, market_id: austria }), recovery_token: "token" };
  }, { answerMarkets: false });
  await assert.rejects(storefront(storage).eshop.cart.create({ id: ids.cart, buyer: customer, package_id: ids.package }), /different market/);
  assert.deepEqual(storage.keys("arky:selected-cart:v3:"), []);
  assert.deepEqual(storage.keys("arky:cart-token:v1:"), []);
});

test("a cart can't be made with no market in the context, and the request is never sent", async (context) => {
  const calls = marketServer(context);
  const api = storefront(visitorStorage(), { market: undefined });
  await assert.rejects(api.eshop.cart.create({ id: ids.cart, buyer: customer, package_id: ids.package }), (error) => error instanceof CartError && error.code === "not_ready");
  await assert.rejects(api.eshop.cart.reorder({ id: ids.cart, order_id: ids.order, buyer: customer, package_id: ids.package }), (error) => error instanceof CartError && error.code === "not_ready");
  assert.equal(calls.length, 0);
});

test("a cart call refuses a per-call market before it reads anything", async (context) => {
  const calls = marketServer(context);
  const api = storefront(visitorStorage());
  await assert.rejects(api.eshop.cart.create({ id: ids.cart, buyer: customer, package_id: ids.package }, { market: "at" }), /uses the storefront's market/);
  await assert.rejects(api.eshop.cart.reorder({ id: ids.cart, order_id: ids.order, buyer: customer, package_id: ids.package }, { market: "at" }), /uses the storefront's market/);
  assert.equal(calls.length, 0);
});

test("a reorder builds its cart in the package it names and the context's market", async (context) => {
  const calls = marketServer(context, (call) => {
    assert.equal(call.path, "/v1/storefront/carts/reorder");
    return { cart: { type: "created", cart: cartRecord({ id: call.body.id, package_id: call.body.package_id, market_id: call.body.market_id }), recovery_token: "token" }, left_out: [] };
  });
  await storefront(visitorStorage()).eshop.cart.reorder({ id: ids.otherCart, order_id: ids.order, buyer: customer, package_id: ids.otherPackage });
  assert.deepEqual(calls.at(-1).body, { id: ids.otherCart, order_id: ids.order, buyer: customer, package_id: ids.otherPackage, market_id: germany });
});

test("the current cart of one market is another market's empty slot, and a merged cart in another market is dropped", async (context) => {
  const storage = visitorStorage();
  const records = new Map();
  const calls = marketServer(context, (call) => records.get(call.path.split("/").at(-1)));
  const api = storefront(storage);
  await api.eshop.cart.create({ id: ids.cart, buyer: customer, package_id: ids.package });
  records.set(ids.cart, cartRecord({ id: ids.cart, market_id: germany }));
  assert.equal((await api.eshop.cart.getCurrent({ buyer: customer, package_id: ids.package })).id, ids.cart);
  api.setContext({ market: "at" });
  assert.equal(await api.eshop.cart.getCurrent({ buyer: customer, package_id: ids.package }), null);
  api.setContext({ market: "de" });
  records.set(ids.cart, cartRecord({ id: ids.cart, market_id: germany, status: { type: "merged", target_cart_id: ids.otherCart } }));
  records.set(ids.otherCart, cartRecord({ id: ids.otherCart, market_id: austria }));
  assert.equal(await api.eshop.cart.getCurrent({ buyer: customer, package_id: ids.package }), null);
  assert.deepEqual(storage.keys("arky:selected-cart:v3:"), []);
  assert.equal(calls.filter((call) => call.path === `/v1/storefront/carts/${ids.otherCart}`).length, 1);
});

test("a cart update names the market it moves to and carries the reference of each line", async (context) => {
  const price = { package_id: ids.otherPackage, package_item_id: ids.packageItem, price_id: ids.price };
  const calls = recordFetch(context, () => cartRecord());
  await storefront(visitorStorage()).eshop.cart.update({
    id: ids.cart,
    expected_updated_at: 2,
    package_id: ids.otherPackage,
    market_id: austria,
    line_items: [{ type: "product", id: ids.line, variant_id: ids.variant, quantity: 1, price }],
  });
  assert.deepEqual(calls[0].body, {
    expected_updated_at: 2,
    package_id: ids.otherPackage,
    market_id: austria,
    line_items: [{ type: "product", id: ids.line, variant_id: ids.variant, quantity: 1, price }],
  });
});

test("the store makes its cart in the current market through the same read", async (context) => {
  const calls = marketServer(context);
  const arky = initialize(storefrontIdentity, { ...idFactories, apiUrl, locale: "en", market: "de", sessionStorage: visitorStorage() });
  const scope = { buyer: customer, package_id: ids.package };
  const german = arky.eshop.cart(scope);
  const created = await german.create({ id: ids.cart });
  assert.equal(created.market_id, germany);
  arky.setContext({ market: "at" });
  const austrian = arky.eshop.cart(scope);
  assert.notEqual(austrian, german);
  assert.deepEqual(austrian.scope, german.scope);
  assert.equal((await austrian.create({ id: ids.otherCart })).market_id, austria);
  assert.deepEqual(calls.filter((call) => call.method === "POST").map((call) => [call.body.id, call.body.market_id]), [
    [ids.cart, germany],
    [ids.otherCart, austria],
  ]);
});

test("a_market_change_during_identify_reuses_it", async (context) => {
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  let markStarted;
  const started = new Promise((resolve) => {
    markStarted = resolve;
  });
  const calls = recordFetch(context, async (call) => {
    if (call.path !== "/v1/storefront/customer/identify") throw new Error(`Unexpected request ${call.path}`);
    markStarted();
    await held;
    return sessionResult(ids.customer, visitorSession(ids.customer, ids.session));
  });
  const api = storefront(new SessionStorage());
  const first = api.customer.identify();
  await started;
  api.setContext({ market: "at" });
  const second = api.customer.identify();
  release();
  const [answered, reused] = await Promise.all([first, second]);
  assert.equal(reused.session.id, answered.session.id);
  assert.equal(api.getMarket(), "at");
  assert.deepEqual(calls.map((call) => [call.path, call.headers.get("authorization")]), [["/v1/storefront/customer/identify", null]]);
});
