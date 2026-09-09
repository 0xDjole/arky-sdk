import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createAdmin, CartPresentationChangedError } from "../dist/index.js";
import { createStorefront } from "../dist/storefront.js";
import { ExclusiveLockManager, MemoryStorage } from "./helpers/durable-request-fixtures.mjs";

const apiUrl = "https://api.example.test";
const publishableKey = `arky_pk_${"c".repeat(43)}`;
const cartId = "9f1b6e23-e2ea-4ab9-a1b7-eaaf550ddf41";
const orderId = "2b815d21-78be-431a-b49c-0d5d62c87823";
const otherId = "6ef796c1-e503-4679-b0d7-79966c193ca2";
const providerId = "4a2c7c0d-4389-4aae-b3d7-02ff834a024d";
const storageKey = `arky:commerce-cart-checkout:v1:${encodeURIComponent(`storefront:${apiUrl}:${publishableKey}`)}`;
const request = { id: cartId, locale: "en", presentation_digest: "a".repeat(64), payment_provider_id: providerId, return_url: "https://merchant.example.test/checkout-return" };
const originals = new Map(["fetch", "localStorage", "navigator", "window"].map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));

function install(name, value) {
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
}

function browser(storage = new MemoryStorage()) {
  const locks = new ExclusiveLockManager();
  install("window", globalThis);
  install("localStorage", storage);
  install("navigator", { locks });
  return { storage, locks };
}

function storefront() {
  const session = JSON.stringify({
    version: 2,
    customer: { id: "customer", status: "active", identities: [], classifications: [], created_at: 1, updated_at: 1 },
    session: { id: "session", customer_id: "customer", type: "visitor", token: `customer_visitor_${"d".repeat(64)}`, status: "active", expires_at: 1900000000000 },
  });
  return createStorefront(publishableKey, { apiUrl, locale: "en", sessionStorage: { getItem: () => session, setItem() {}, removeItem() {} } });
}

function proof(overrides = {}) {
  return { id: cartId, status: { type: "converted" }, converted_order_id: orderId, ...overrides };
}

function result() {
  return { order_id: orderId, number: "1001", payment: null, payment_action: { type: "none" } };
}

function stripeResult() {
  return {
    ...result(),
    payment: {
      id: otherId, source: { type: "order", order_id: orderId },
      provider: { type: "stripe_checkout", payment_provider_id: providerId, checkout_expires_at: 1900000000000, checkout_session_id: "cs_test_exact", payment_intent_id: null },
      status: { type: "requires_action" }, amounts: { currency: "eur", total: 1000, paid: 0, refunded: 0, refund_pending: 0 },
    },
    payment_action: { type: "stripe_embedded_checkout", publishable_key: "pk_test_exact", connected_account_id: "acct_exact", client_secret: "cs_test_exact_secret_value", expires_at: 1900000000000 },
  };
}

function capture(respond) {
  const calls = [];
  install("fetch", async (url, init = {}) => {
    const call = { path: new URL(url).pathname, method: init.method, body: init.body ? JSON.parse(init.body) : null };
    calls.push(call);
    return respond(call, calls.length);
  });
  return calls;
}

function success(call) {
  return Response.json(call.method === "GET" ? proof() : result());
}

async function loseResponse() {
  const calls = capture(() => { throw new TypeError("response lost"); });
  await assert.rejects(storefront().eshop.cart.checkout(request), /response lost/);
  assert.equal(calls.length, 1);
}

afterEach(() => {
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});

test("Cart checkout persists before POST and explicitly recovers the exact request after reload", async () => {
  const { storage } = browser();
  const first = capture(() => {
    assert.deepEqual(JSON.parse(JSON.parse(storage.getItem(storageKey)).requestJson), request);
    throw new TypeError("response lost");
  });
  await assert.rejects(storefront().eshop.cart.checkout(request));
  const retained = storage.getItem(storageKey);
  const fresh = storefront();
  assert.deepEqual(await fresh.eshop.cart.pendingCheckout(), request);
  const calls = capture(success);
  assert.deepEqual(await fresh.eshop.cart.recoverCheckout(), result());
  assert.deepEqual(calls[0], first[0]);
  assert.deepEqual(calls[1], { method: "GET", path: `/v1/storefront/carts/${cartId}`, body: null });
  assert.equal(calls.length, 2);
  assert.equal(retained.includes("client_secret"), false);
  assert.equal(storage.getItem(storageKey), null);
  assert.equal(await fresh.eshop.cart.recoverCheckout(), null);
  assert.equal(calls.length, 2);
});

test("every changed checkout field stays blocked after ambiguity without another POST", async () => {
  browser();
  await loseResponse();
  const calls = capture(success);
  for (const change of [
    { id: otherId }, { locale: "bs" }, { presentation_digest: "b".repeat(64) },
    { payment_provider_id: otherId }, { payment_provider_id: undefined },
    { return_url: "https://merchant.example.test/another" }, { return_url: undefined },
  ]) {
    await assert.rejects(storefront().eshop.cart.checkout({ ...request, ...change }), /different unresolved payload/);
  }
  assert.equal(calls.length, 0);
});

test("unavailable or corrupt durable storage and unavailable locks fail before checkout POST", async () => {
  for (const storage of [undefined, new MemoryStorage({ readError: new Error("denied") }), new MemoryStorage({ writeError: new Error("full") }), new MemoryStorage({ discardWrites: true })]) {
    browser(storage);
    install("localStorage", storage);
    const calls = capture(success);
    await assert.rejects(storefront().eshop.cart.checkout(request));
    assert.equal(calls.length, 0);
  }
  for (const value of ["invalid", JSON.stringify({ requestJson: "invalid" }), JSON.stringify({ requestJson: JSON.stringify({ id: cartId }) })]) {
    const { storage } = browser();
    storage.seed(storageKey, value);
    const calls = capture(success);
    await assert.rejects(storefront().eshop.cart.recoverCheckout());
    assert.equal(calls.length, 0);
  }
  browser();
  install("navigator", {});
  const calls = capture(success);
  await assert.rejects(storefront().eshop.cart.checkout(request), /cross-tab lock/);
  assert.equal(calls.length, 0);
});

test("a concurrent tab cannot queue a duplicate checkout or read pending state through an active lock", async () => {
  const { locks } = browser();
  locks.held.add(`arky:durable-request:${storageKey}`);
  const calls = capture(success);
  await assert.rejects(storefront().eshop.cart.checkout(request), /already active in another tab/);
  await assert.rejects(storefront().eshop.cart.pendingCheckout(), /already active in another tab/);
  assert.equal(calls.length, 0);
});

test("only a definite checkout POST 400 clears the saved request", async () => {
  for (const status of [400, 401, 403, 409, 422, 429, 500, 503]) {
    const { storage } = browser();
    const calls = capture(() => Response.json({ message: "Rejected", error: "COMMERCE.REJECTED", statusCode: status }, { status }));
    await assert.rejects(storefront().eshop.cart.checkout(request));
    assert.equal(calls.filter((call) => call.path.endsWith('/checkout')).length, 1);
    assert.equal(storage.getItem(storageKey) === null, status === 400);
  }
});

test("malformed or aborted checkout responses retain the same request", async () => {
  for (const response of [
    () => new Response("not json", { headers: { "content-type": "application/json" } }),
    () => { throw new DOMException("aborted", "AbortError"); },
  ]) {
    const { storage } = browser();
    const calls = capture(response);
    await assert.rejects(storefront().eshop.cart.checkout(request));
    assert.notEqual(storage.getItem(storageKey), null);
    assert.equal(calls.length, 1);
  }
});

test("success followed by failed or mismatched Cart proof stays pending without notifying success", async () => {
  for (const getResponse of [
    () => Response.json({ message: "Bad read" }, { status: 400 }),
    () => { throw new TypeError("read lost"); },
    () => Response.json(proof({ id: otherId })),
    () => Response.json(proof({ converted_order_id: otherId })),
    () => Response.json(proof({ status: { type: "active" } })),
    () => Response.json(proof({ status: null })),
  ]) {
    const { storage } = browser();
    let notified = 0;
    const calls = capture((call) => call.method === "GET" ? getResponse() : Response.json(result()));
    await assert.rejects(storefront().eshop.cart.checkout(request, { onSuccess: () => { notified += 1; } }));
    await Promise.resolve();
    assert.equal(notified, 0);
    assert.notEqual(storage.getItem(storageKey), null);
    assert.equal(calls.length, 2);
  }
});

test("malformed purchase or Stripe capability evidence never clears checkout", async () => {
  const invalid = [
    null, {}, { ...result(), order_id: "not-a-uuid" }, { ...result(), number: "" },
    { ...result(), payment: undefined }, { ...result(), payment_action: { type: "unknown" } },
    { ...result(), payment_action: stripeResult().payment_action },
    { ...stripeResult(), payment: { ...stripeResult().payment, source: { type: "order", order_id: otherId } } },
    { ...stripeResult(), payment: { ...stripeResult().payment, provider: { ...stripeResult().payment.provider, payment_provider_id: otherId } } },
    { ...stripeResult(), payment_action: { ...stripeResult().payment_action, client_secret: "" } },
    { ...stripeResult(), payment_action: { ...stripeResult().payment_action, expires_at: 1 } },
    { ...stripeResult(), payment_action: { ...stripeResult().payment_action, expires_at: 1900000000001 } },
  ];
  for (const body of invalid) {
    const { storage } = browser();
    const calls = capture(() => Response.json(body));
    await assert.rejects(storefront().eshop.cart.checkout(request), /invalid purchase evidence/);
    assert.notEqual(storage.getItem(storageKey), null);
    assert.equal(calls.length, 1);
  }
});

test("validated Stripe checkout exposes capabilities only after exact proof and storage clear", async () => {
  const { storage } = browser();
  let notified = 0;
  let storageAtSuccess = "not notified";
  const calls = capture((call) => {
    assert.equal(storage.getItem(storageKey).includes("client_secret"), false);
    return Response.json(call.method === "GET" ? proof() : stripeResult());
  });
  const accepted = await storefront().eshop.cart.checkout(request, { onSuccess: () => { storageAtSuccess = storage.getItem(storageKey); notified += 1; } });
  await Promise.resolve();
  assert.deepEqual(accepted, stripeResult());
  assert.equal(notified, 1);
  assert.equal(storageAtSuccess, null);
  assert.equal(calls.length, 2);
  assert.equal(storage.getItem(storageKey), null);
});

test("failed terminal storage clear does not notify success and retains recovery", async () => {
  const { storage } = browser(new MemoryStorage({ removeError: new Error("denied") }));
  let notified = 0;
  capture(success);
  await assert.rejects(storefront().eshop.cart.checkout(request, { onSuccess: () => { notified += 1; } }), /could not be cleared/);
  await Promise.resolve();
  assert.equal(notified, 0);
  assert.notEqual(storage.getItem(storageKey), null);
});

test("pending current Cart reads the original identity and blocks ordinary Cart mutations", async () => {
  browser();
  await loseResponse();
  const calls = capture(() => Response.json(proof({ status: { type: "active" }, converted_order_id: null, company_id: "company", company_location_id: "location" })));
  const client = storefront().eshop.cart;
  assert.equal((await client.current()).id, cartId);
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [["GET", `/v1/storefront/carts/${cartId}`]]);
  await assert.rejects(client.current({ company_id: "another" }));
  const reads = calls.length;
  for (const mutate of [
    () => client.update({ id: cartId, promo_code: "new" }),
    () => client.addProduct({ id: cartId, product: { product_id: otherId, variant_id: otherId, quantity: 1 } }),
    () => client.addBooking({ id: cartId, booking: { booking_offering_id: otherId } }),
    () => client.addDigital({ id: cartId, digital: { digital_product_id: otherId, name_block_id: otherId } }),
    () => client.addAudience({ id: cartId, audience: { audience_id: otherId, membership_id: otherId } }),
    () => client.removeItem({ id: cartId, item_id: otherId }),
    () => client.clear({ id: cartId }),
  ]) await assert.rejects(mutate(), /Recover the unresolved Cart Checkout/);
  assert.equal(calls.length, reads);
});

test("presentation conflicts expose the quote without silently replacing the locked request", async () => {
  const { storage } = browser();
  const quote = { locale: "en", presentation_digest: "b".repeat(64), context: {}, money: {}, product_lines: [], booking_lines: [], digital_lines: [], audience_lines: [], shipping_lines: [], shipping_methods: [], payment_provider_ids: [] };
  const calls = capture(() => Response.json({ message: "Review the changed quote", error: "COMMERCE.PRESENTATION_CHANGED", quote }, { status: 409 }));
  await assert.rejects(storefront().eshop.cart.checkout(request), (error) => error instanceof CartPresentationChangedError && error.code === "COMMERCE.PRESENTATION_CHANGED" && error.quote.presentation_digest === quote.presentation_digest);
  assert.deepEqual(JSON.parse(JSON.parse(storage.getItem(storageKey)).requestJson), request);
  assert.equal(calls.length, 1);
});

test("Admin checkout uses the same exact-request recovery and blocks a competing Cart", async () => {
  browser();
  const admin = () => createAdmin({ baseUrl: apiUrl, storeId: "store", apiToken: "arky_api_cart" });
  capture(() => { throw new TypeError("lost"); });
  await assert.rejects(admin().eshop.cart.checkout(request));
  assert.deepEqual(await admin().eshop.cart.pendingCheckout(), request);
  const calls = capture(success);
  await assert.rejects(admin().eshop.cart.create({}), /Recover the unresolved Cart Checkout/);
  assert.equal(calls.length, 0);
  assert.deepEqual(await admin().eshop.cart.recoverCheckout(), result());
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [["POST", `/v1/stores/store/carts/${cartId}/checkout`], ["GET", `/v1/stores/store/carts/${cartId}`]]);
});

test("server-side checkout uses the caller's exact request without browser storage or an implicit retry", async () => {
  install("window", undefined);
  install("localStorage", undefined);
  const calls = capture(success);
  assert.deepEqual(await storefront().eshop.cart.checkout(request), result());
  const { id, ...body } = request;
  assert.deepEqual(calls[0].body, body);
  assert.equal(calls.length, 2);
  assert.equal(await storefront().eshop.cart.pendingCheckout(), null);
  assert.equal(await storefront().eshop.cart.recoverCheckout(), null);
});
