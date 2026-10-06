import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createAdmin, CartPresentationChangedError } from "../dist/index.js";
import { createStorefront } from "../dist/storefront.js";
import { ExclusiveLockManager, MemoryStorage } from "./helpers/durable-request-fixtures.mjs";
import { checkoutSources } from "./helpers/checkout-sources.mjs";
import { storefrontSessionStorage } from "./helpers/storefront-session-storage.mjs";

const apiUrl = "https://api.example.test";
const publishableKey = `arky_pk_${"c".repeat(43)}`;
const cartId = "9f1b6e23-e2ea-4ab9-a1b7-eaaf550ddf41";
const orderId = "2b815d21-78be-431a-b49c-0d5d62c87823";
const otherId = "6ef796c1-e503-4679-b0d7-79966c193ca2";
const providerId = "4a2c7c0d-4389-4aae-b3d7-02ff834a024d";
const STORE_ID = "d3f8b2a6-5c19-4e47-9a0d-7b6e1c4f2a85";
const accountId = "ca60db1c-68d1-42d5-8b55-8a1e04f2cb2f";
const storageKey = `arky:commerce-cart-checkout:v1:${encodeURIComponent(`storefront:${apiUrl}:${publishableKey}`)}`;
const requestId = "8c1d4f5a-3f0b-4a7d-8f52-5c0f2b7a91d4";
const request = { id: cartId, request_id: requestId, locale: "en", presentation_digest: "a".repeat(64), sources: checkoutSources(cartId), payment_option_id: providerId, return_url: "https://merchant.example.test/checkout-return" };
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
    customer: { id: "customer", status: { type: "active" }, identities: [], categories: [], created_at: 1, updated_at: 1 },
    session: { id: "session", customer_id: "customer", type: "visitor", token: `customer_visitor_${"d".repeat(64)}`, status: { type: "active" }, expires_at: 1900000000000 },
  });
  return createStorefront(publishableKey, { apiUrl, locale: "en", market: "bih", sessionStorage: storefrontSessionStorage(session) });
}

function acceptedOrder(source = {}, overrides = {}) {
  return {
    id: orderId,
    source: {
      type: "cart_acceptance", request_id: requestId, submission_fingerprint: "f".repeat(64), initial_payment_id: null,
      cart: request.sources.cart, converted_lines: request.sources.converted_lines, ...source,
    },
    ...overrides,
  };
}

function paidOrder(source = {}) {
  return acceptedOrder({ initial_payment_id: otherId, ...source });
}

function result() {
  return { order_id: orderId, number: "1001", payment: null, payment_action: { type: "none" } };
}

function stripeResult() {
  return {
    ...result(),
    payment: {
      id: otherId, order_id: orderId,
      route: { type: "stripe_checkout", payment_option_id: providerId, checkout_expires_at: 1900000000000, checkout_session_id: "cs_test_exact", payment_intent_id: null },
      status: { type: "requires_action" }, amounts: { currency: "eur", total: 1000, authorized: 0, captured: 0, capture_pending: 0, refunded: 0, refund_pending: 0 },
      reconciliation: { type: "clear" }, checkout_expiration: null,
    },
    payment_action: { type: "stripe_embedded_checkout", publishable_key: "pk_test_exact", account_id: "acct_exact", client_secret: "cs_test_exact_secret_value", expires_at: 1900000000000 },
  };
}

function monriResult() {
  const payment = stripeResult().payment;
  return {
    ...result(),
    payment: {
      ...payment,
      route: { type: 'monri_checkout', payment_option_id: providerId, environment: 'test', transaction_type: 'purchase', transaction_id: null, authorization_void: null },
      amounts: { ...payment.amounts, capture_pending: payment.amounts.total },
    },
    payment_action: { type: 'monri_components', payment_id: otherId, environment: 'test', authenticity_token: 'test-token', client_secret: 'test-session-secret', save_card: false },
  };
}

function capture(respond) {
  const calls = [];
  install("fetch", async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path === "/v1/storefront/markets/by-key/bih") {
      return Response.json({ id: "market", key: "bih", currency: "bam", tax_mode: "exclusive", payment_option_ids: [] });
    }
    if (path === "/v1/accounts/me") {
      return Response.json({ id: accountId, status: { type: "active" } });
    }
    const call = { path, method: init.method, body: init.body ? JSON.parse(init.body) : null };
    calls.push(call);
    return respond(call, calls.length);
  });
  return calls;
}

async function retainAndRecover(input = request, options) {
  const client = storefront();
  await client.eshop.cart.retainCheckout(input);
  return client.eshop.cart.recoverCheckout(options);
}

function success(call) {
  if (call.method === "POST" && call.path.endsWith("/carts/accept")) return Response.json(result());
  if (call.method === "GET" && call.path.endsWith(`/orders/${orderId}`)) return Response.json(acceptedOrder({}, call.path.startsWith("/v1/stores/")
    ? { store_id: STORE_ID, origin: { type: "admin", actor: { account_id: accountId } } }
    : {}));
  throw new Error(`Recovery must not depend on a live Cart: ${call.path}`);
}

async function loseResponse(input = request) {
  const calls = capture(() => { throw new TypeError("response lost"); });
  await assert.rejects(retainAndRecover(input), /response lost/);
  assert.equal(calls.length, 1);
  return calls;
}

test("an unresolved Checkout pins selected Cart reads and blocks explicit replacement", async () => {
  browser();
  await loseResponse();
  const calls = capture((call) => {
    assert.equal(call.method, "GET");
    assert.equal(call.path, `/v1/storefront/carts/${cartId}`);
    return Response.json({ id: cartId, customer_id: "customer", company: null, market_id: "market", catalog_id: "catalog", status: { type: "converted", order_id: orderId, request_id: requestId } });
  });
  const client = storefront();
  assert.equal((await client.eshop.cart.current()).id, cartId);
  await assert.rejects(client.eshop.cart.create(), /unresolved|Recover/i);
  await assert.rejects(client.eshop.cart.current({ company: { company_id: "other-company", company_location_id: null } }), /Company/);
  assert.equal(calls.length, 2);
  assert.deepEqual(await client.eshop.cart.pendingCheckout(), request);
});

test("an unavailable pending Checkout Cart never creates a new Cart or clears its retained request", async () => {
  browser();
  await loseResponse();
  const calls = capture(() => Response.json({ message: "Cart not found" }, { status: 404 }));
  const client = storefront();
  await assert.rejects(client.eshop.cart.current());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "GET");
  assert.deepEqual(await client.eshop.cart.pendingCheckout(), request);
});

afterEach(() => {
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});

test("Cart checkout retention persists before POST and explicitly recovers the exact request after reload", async () => {
  const { storage } = browser();
  const first = capture(() => {
    assert.deepEqual(JSON.parse(JSON.parse(storage.getItem(storageKey)).requestJson), request);
    throw new TypeError("response lost");
  });
  assert.deepEqual(await storefront().eshop.cart.retainCheckout(request), request);
  assert.equal(first.length, 0);
  await assert.rejects(storefront().eshop.cart.recoverCheckout(), /response lost/);
  const retained = storage.getItem(storageKey);
  const fresh = storefront();
  assert.deepEqual(await fresh.eshop.cart.pendingCheckout(), request);
  const calls = capture(success);
  assert.deepEqual(await fresh.eshop.cart.recoverCheckout(), result());
  assert.deepEqual(calls[0], first[0]);
  assert.deepEqual(calls[1], { method: "GET", path: `/v1/storefront/orders/${orderId}`, body: null });
  assert.equal(calls.length, 2);
  assert.equal(retained.includes("client_secret"), false);
  assert.equal(storage.getItem(storageKey), null);
  assert.equal(await fresh.eshop.cart.recoverCheckout(), null);
  assert.equal(calls.length, 2);
});

test("direct Cart checkout submits the caller's exact request without creating browser recovery state", async () => {
  const { storage } = browser();
  const calls = capture(success);
  assert.deepEqual(await storefront().eshop.cart.checkout(request), result());
  const { id: _id, locale: _locale, ...body } = request;
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [["POST", "/v1/storefront/carts/accept"], ["GET", `/v1/storefront/orders/${orderId}`]]);
  assert.deepEqual(calls[0].body, body);
  assert.equal(storage.getItem(storageKey), null);
  assert.equal(await storefront().eshop.cart.pendingCheckout(), null);
  for (const request_id of [undefined, "", "checkout-request", requestId.toUpperCase()]) {
    await assert.rejects(storefront().eshop.cart.checkout({ ...request, request_id }), TypeError);
    await assert.rejects(storefront().eshop.cart.retainCheckout({ ...request, request_id }), TypeError);
  }
  assert.equal(calls.length, 2);
  assert.equal(storage.getItem(storageKey), null);
});

test("missing, malformed or foreign quote sources fail before persisting or posting acceptance", async () => {
  const originalSources = request.sources;
  const mutations = [
    undefined, null, { ...originalSources, converted_lines: [] },
    { ...originalSources, cart: { cart_id: cartId, version: "" } },
    checkoutSources(otherId),
    { ...originalSources, converted_lines: [originalSources.converted_lines[0], originalSources.converted_lines[0]] },
    { ...originalSources, converted_lines: [{ ...originalSources.converted_lines[0], order_units: { first_unit: 0, quantity: 2 } }] },
    { ...originalSources, converted_lines: [{ ...originalSources.converted_lines[0], order_line_item: { type: "booking", line_item_id: otherId } }] },
    { ...originalSources, converted_lines: [{ ...originalSources.converted_lines[0], order_line_item: { type: "product", line_item_id: otherId } }] },
    { ...originalSources, converted_lines: [{ ...originalSources.converted_lines[0], cart_units: { first_unit: 1, quantity: 1 } }] },
    { ...originalSources, amount: 0 },
    { ...originalSources, cart: { ...originalSources.cart, version: "x".repeat(513) } },
    { ...originalSources, delivery_groups: [] },
  ];
  for (const sources of mutations) {
    const { storage } = browser();
    const calls = capture(success);
    await assert.rejects(storefront().eshop.cart.checkout({ ...request, sources }));
    await assert.rejects(storefront().eshop.cart.retainCheckout({ ...request, sources }));
    assert.equal(calls.length, 0);
    assert.equal(storage.getItem(storageKey), null);
  }
});

test("reviewed converted lines survive ambiguity and cannot change during recovery", async () => {
  browser();
  const lineId = request.sources.converted_lines[0].cart_line_item.line_item_id;
  const sources = checkoutSources(cartId, "product", lineId, 2);
  const input = { ...request, sources };
  const first = await loseResponse(input);
  const calls = capture(call => call.method === "GET" ? Response.json(acceptedOrder({ converted_lines: sources.converted_lines })) : success(call));
  const changed = checkoutSources(cartId, "product", lineId, 3);
  await assert.rejects(storefront().eshop.cart.retainCheckout({ ...input, sources: changed }), /different unresolved payload/);
  assert.equal(calls.length, 0);
  assert.deepEqual(await storefront().eshop.cart.recoverCheckout(), result());
  assert.deepEqual(calls[0].body, first[0].body);
  assert.deepEqual(calls[0].body.sources, sources);
});

test("every changed checkout field stays blocked after ambiguity without another POST", async () => {
  browser();
  await loseResponse();
  const calls = capture(success);
  for (const change of [
    { id: otherId, sources: checkoutSources(otherId) }, { locale: "bs" }, { presentation_digest: "b".repeat(64) },
    { sources: { ...request.sources, cart: { cart_id: cartId, version: "another-version" } } },
    { sources: checkoutSources(cartId, "product", otherId) },
    { payment_option_id: otherId }, { payment_option_id: undefined },
    { return_url: "https://merchant.example.test/another" }, { return_url: undefined },
  ]) {
    await assert.rejects(storefront().eshop.cart.retainCheckout({ ...request, ...change }), /different unresolved payload/);
  }
  assert.equal(calls.length, 0);
  assert.deepEqual(await storefront().eshop.cart.pendingCheckout(), request);
});

test("unavailable or corrupt durable storage and unavailable locks fail before checkout POST", async () => {
  for (const storage of [undefined, new MemoryStorage({ readError: new Error("denied") }), new MemoryStorage({ writeError: new Error("full") }), new MemoryStorage({ discardWrites: true })]) {
    browser(storage);
    install("localStorage", storage);
    const calls = capture(success);
    await assert.rejects(retainAndRecover());
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
  await assert.rejects(storefront().eshop.cart.retainCheckout(request), /cross-tab lock/);
  await assert.rejects(storefront().eshop.cart.recoverCheckout(), /cross-tab lock/);
  assert.equal(calls.length, 0);
});

test("a concurrent tab cannot queue a duplicate checkout or read pending state through an active lock", async () => {
  const { locks } = browser();
  locks.held.add(`arky:durable-request:${storageKey}`);
  const calls = capture(success);
  await assert.rejects(storefront().eshop.cart.retainCheckout(request), /already active in another tab/);
  await assert.rejects(storefront().eshop.cart.recoverCheckout(), /already active in another tab/);
  await assert.rejects(storefront().eshop.cart.pendingCheckout(), /already active in another tab/);
  assert.equal(calls.length, 0);
});

test("only a definite checkout POST 400 clears the saved request", async () => {
  for (const status of [400, 401, 403, 409, 422, 429, 500, 503]) {
    const { storage } = browser();
    const calls = capture(() => Response.json({ message: "Rejected", error: "COMMERCE.REJECTED", statusCode: status }, { status }));
    await assert.rejects(retainAndRecover(), (error) => error.statusCode === status);
    assert.equal(calls.filter((call) => call.path.endsWith('/carts/accept')).length, 1);
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
    await assert.rejects(retainAndRecover());
    assert.notEqual(storage.getItem(storageKey), null);
    assert.equal(calls.length, 1);
  }
});

test("success followed by failed or mismatched accepted Order evidence stays pending without notifying success", async () => {
  for (const getResponse of [
    () => Response.json({ message: "Bad read" }, { status: 400 }),
    () => { throw new TypeError("read lost"); },
    () => Response.json(acceptedOrder({}, { id: otherId })),
    () => Response.json(acceptedOrder({ request_id: otherId })),
    () => Response.json(acceptedOrder({ command_id: requestId, request_id: undefined })),
    () => Response.json(acceptedOrder({ submission_fingerprint: "not-a-fingerprint" })),
    () => Response.json(acceptedOrder({ submission_fingerprint: undefined })),
    () => Response.json(acceptedOrder({ initial_payment_id: otherId })),
    () => Response.json(acceptedOrder({ cart: { cart_id: otherId, version: "reviewed-version" } })),
    () => Response.json(acceptedOrder({ cart: null })),
    () => Response.json(acceptedOrder({ cart: { cart_id: cartId, version: "" } })),
    () => Response.json(acceptedOrder({ cart: { cart_id: cartId, version: "another-version" } })),
    () => Response.json(acceptedOrder({}, { source: { type: "direct", request_id: requestId } })),
    () => Response.json(acceptedOrder({}, { source: null })),
    () => Response.json(acceptedOrder({ converted_lines: [] })),
    () => Response.json(acceptedOrder({ converted_lines: checkoutSources(cartId, "product", otherId).converted_lines })),
    () => Response.json(acceptedOrder({ converted_lines: checkoutSources(cartId, "product", request.sources.converted_lines[0].cart_line_item.line_item_id, 2).converted_lines })),
  ]) {
    const { storage } = browser();
    let notified = 0;
    const calls = capture((call) => call.method === "GET" ? getResponse() : Response.json(result()));
    await assert.rejects(retainAndRecover(request, { onSuccess: () => { notified += 1; } }));
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
    { ...stripeResult(), payment: { ...stripeResult().payment, order_id: otherId } },
    { ...stripeResult(), payment: { ...stripeResult().payment, order_id: undefined, source: { type: "order", order_id: orderId } } },
    ...["paid", "partially_refunded", "refunded"].map((type) => ({ ...stripeResult(), payment: { ...stripeResult().payment, status: { type } } })),
    ...["total", "authorized", "captured", "capture_pending", "refunded", "refund_pending"].flatMap((field) =>
      [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, null].map((amount) => ({ ...stripeResult(), payment: { ...stripeResult().payment, amounts: { ...stripeResult().payment.amounts, [field]: amount } } }))),
    { ...stripeResult(), payment: { ...stripeResult().payment, amounts: { ...stripeResult().payment.amounts, total: 0 } } },
    { ...stripeResult(), payment: { ...stripeResult().payment, amounts: { currency: "eur", total: 1000, paid: 0, refunded: 0, refund_pending: 0 } } },
    { ...stripeResult(), payment: { ...stripeResult().payment, reconciliation: { type: "hold", opened_at: 1 } } },
    { ...stripeResult(), payment: { ...stripeResult().payment, reconciliation: { type: "unknown" } } },
    { ...stripeResult(), payment: { ...stripeResult().payment, reconciliation: undefined } },
    { ...stripeResult(), payment: { ...stripeResult().payment, checkout_expiration: { status: { type: "requested" } } } },
    ...["captured", "capture_pending"].map((field) => ({ ...stripeResult(), payment: { ...stripeResult().payment, amounts: { ...stripeResult().payment.amounts, [field]: 1 } } })),
    { ...stripeResult(), payment: { ...stripeResult().payment, route: { ...stripeResult().payment.route, payment_option_id: otherId } } },
    { ...stripeResult(), payment_action: { ...stripeResult().payment_action, client_secret: "" } },
    { ...stripeResult(), payment_action: { ...stripeResult().payment_action, expires_at: 1 } },
    { ...stripeResult(), payment_action: { ...stripeResult().payment_action, expires_at: 1900000000001 } },
    { ...stripeResult(), payment_action: { ...stripeResult().payment_action, account_id: undefined, connected_account_id: "acct_exact" } },
    { ...stripeResult(), payment_action: { ...stripeResult().payment_action, account_id: "platform-account" } },
  ];
  for (const body of invalid) {
    const { storage } = browser();
    const calls = capture(() => Response.json(body));
    await assert.rejects(retainAndRecover(), /invalid purchase evidence/);
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
    return Response.json(call.method === "GET" ? paidOrder() : stripeResult());
  });
  const accepted = await retainAndRecover(request, { onSuccess: () => { storageAtSuccess = storage.getItem(storageKey); notified += 1; } });
  await Promise.resolve();
  assert.deepEqual(accepted, stripeResult());
  assert.equal(notified, 1);
  assert.equal(storageAtSuccess, null);
  assert.equal(calls.length, 2);
  assert.equal(storage.getItem(storageKey), null);
});

test('Monri checkout keeps one accepted Order and exposes its capability without browser persistence', async () => {
  const { storage } = browser();
  const calls = capture((call) => {
    const retained = storage.getItem(storageKey);
    assert.equal(retained.includes('client_secret'), false);
    assert.equal(retained.includes('authenticity_token'), false);
    return Response.json(call.method === 'GET' ? paidOrder() : monriResult());
  });
  assert.deepEqual(await retainAndRecover(), monriResult());
  assert.equal(storage.getItem(storageKey), null);
  assert.equal(calls.length, 2);
  assert.equal(calls.filter((call) => call.method === 'POST').length, 1);
});

test('invalid Monri capability bindings and reservations retain the original Checkout request', async () => {
  const original = monriResult();
  const mutations = [
    { ...original, payment: null },
    ...[
      { payment_id: orderId }, { environment: 'live' }, { authenticity_token: '' },
      { client_secret: '' }, { expires_at: 1900000000000 }, { merchant_key: 'not-public' },
      { save_card: 'false' }, { save_card: undefined },
    ].map((fields) => ({ ...original, payment_action: { ...original.payment_action, ...fields } })),
    ...[
      { capture_pending: 0 }, { capture_pending: 999 }, { authorized: 1 }, { captured: 1 },
      { refunded: 1 }, { refund_pending: 1 },
    ].map((amounts) => ({ ...original, payment: { ...original.payment, amounts: { ...original.payment.amounts, ...amounts } } })),
    ...[
      { transaction_type: 'authorize' }, { transaction_id: '123' }, { environment: 'live' },
      { authorization_void: { status: { type: 'requested' } } },
    ].map((route) => ({ ...original, payment: { ...original.payment, route: { ...original.payment.route, ...route } } })),
    { ...original, payment: { ...original.payment, status: { type: 'unknown' } } },
    { ...original, payment: { ...original.payment, reconciliation: { type: 'hold', opened_at: 1 } } },
  ];
  for (const body of mutations) {
    const { storage } = browser();
    const calls = capture(() => Response.json(body));
    await assert.rejects(retainAndRecover(), /invalid purchase evidence/);
    assert.notEqual(storage.getItem(storageKey), null);
    assert.equal(calls.length, 1);
  }
});

test("collection status, partial refunds and held evidence remain readable without a new payment action", async () => {
  for (const [status, captured, refunded, reconciliation] of [
    ["authorized", 0, 0, { type: "clear" }],
    ["completed", 1000, 200, { type: "clear" }],
    ["completed", 1000, 1000, { type: "clear" }],
    ["completed", 1100, 0, { type: "hold", opened_at: 1 }],
    ["unknown", 0, 0, { type: "hold", opened_at: 1 }],
  ]) {
    const { storage } = browser();
    const response = {
      ...stripeResult(), payment_action: { type: "none" },
      payment: { ...stripeResult().payment, status: { type: status }, reconciliation,
        amounts: { ...stripeResult().payment.amounts, authorized: 1000, captured, refunded } },
    };
    const calls = capture((call) => Response.json(call.method === "GET" ? paidOrder() : response));
    assert.deepEqual(await retainAndRecover(), response);
    assert.equal(calls.length, 2);
    assert.equal(storage.getItem(storageKey), null);
  }
});

test("failed terminal storage clear does not notify success and retains recovery", async () => {
  const { storage } = browser(new MemoryStorage({ removeError: new Error("denied") }));
  let notified = 0;
  capture(success);
  await assert.rejects(retainAndRecover(request, { onSuccess: () => { notified += 1; } }), /could not be cleared/);
  await Promise.resolve();
  assert.equal(notified, 0);
  assert.notEqual(storage.getItem(storageKey), null);
});

test("pending current Cart reads the original identity and blocks ordinary Cart mutations", async () => {
  browser();
  await loseResponse();
  const calls = capture(() => Response.json({ id: cartId, customer_id: "customer", market_id: "market", catalog_id: "catalog", status: { type: "active" }, company: { company_id: "company", company_location_id: "location" } }));
  const client = storefront().eshop.cart;
  assert.equal((await client.current({ company: { company_id: "company", company_location_id: "location" } })).id, cartId);
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [["GET", `/v1/storefront/carts/${cartId}`]]);
  await assert.rejects(client.current({ company: { company_id: "another", company_location_id: null } }), /different Company context/);
  await assert.rejects(client.current(), /different Company context/);
  await assert.rejects(client.current({ company: { company_id: "company", company_location_id: "another-location" } }), /different Company context/);
  const reads = calls.length;
  for (const mutate of [
    () => client.update({ id: cartId, promotion_codes: ["new"] }),
    () => client.addProduct({ id: cartId, product: { product_id: otherId, variant_id: otherId, quantity: 1 } }),
    () => client.addBooking({ id: cartId, booking: { booking_offering_id: otherId } }),
    () => client.addDigital({ id: cartId, digital: { digital_product_id: otherId } }),
    () =>
      client.addSubscriptionPlan({
        id: cartId,
        subscription_plan: {
          subscription_plan_id: otherId,
          subject: { type: "customer", customer_id: otherId },
          start: { type: "on_acceptance" },
          deliveries: [],
        },
      }),
    () => client.removeItem({ id: cartId, line_item: { type: "product", line_item_id: otherId } }),
    () => client.clear({ id: cartId }),
  ]) await assert.rejects(mutate(), /Recover the unresolved Cart Checkout/);
  assert.equal(calls.length, reads);
});

test("presentation conflicts expose the quote without silently replacing the locked request", async () => {
  const { storage } = browser();
  const quote = {
    sources: { cart: { cart_id: cartId, version: "reviewed-version" }, converted_lines: [] },
    order: { locale: "en", presentation_digest: "c".repeat(64), context: {}, money: {}, product_lines: [], booking_lines: [], digital_lines: [], subscription_lines: [], delivery_groups: [], payment_option_ids: [] },
    presentation_digest: "b".repeat(64),
  };
  const calls = capture(() => Response.json({ message: "Review the changed quote", error: "COMMERCE.PRESENTATION_CHANGED", quote }, { status: 409 }));
  await assert.rejects(retainAndRecover(), (error) => {
    assert.ok(error instanceof CartPresentationChangedError);
    assert.equal(error.code, "COMMERCE.PRESENTATION_CHANGED");
    assert.deepEqual(error.quote, quote);
    assert.notEqual(error.quote.presentation_digest, error.quote.order.presentation_digest);
    return true;
  });
  assert.deepEqual(JSON.parse(JSON.parse(storage.getItem(storageKey)).requestJson), request);
  assert.equal(calls.length, 1);
});

test("saved-method consent survives lost responses and exact recovery", async () => {
  const { storage } = browser();
  const consentRequest = { ...request, save_payment_method: true, payment_method_terms_version: "checkout-2026-09" };
  await loseResponse(consentRequest);
  assert.deepEqual(await storefront().eshop.cart.pendingCheckout(), consentRequest);
  const calls = capture(success);
  await assert.rejects(storefront().eshop.cart.retainCheckout({ ...consentRequest, payment_method_terms_version: "new-terms" }), /different unresolved payload/);
  assert.equal(calls.length, 0);
  assert.deepEqual(await storefront().eshop.cart.recoverCheckout(), result());
  assert.equal(calls[0].body.save_payment_method, true);
  assert.equal(calls[0].body.payment_method_terms_version, "checkout-2026-09");
  assert.equal(storage.getItem(storageKey), null);
});

test("saving a payment method requires explicit well-formed consent before transport", async () => {
  for (const input of [
    { ...request, save_payment_method: "true" },
    { ...request, save_payment_method: true },
    { ...request, save_payment_method: true, payment_method_terms_version: "terms", payment_option_id: undefined },
    ...["", " terms", "terms\n", "a".repeat(257)].map((terms) => ({ ...request, save_payment_method: true, payment_method_terms_version: terms })),
  ]) {
    const { storage } = browser();
    const calls = capture(success);
    await assert.rejects(storefront().eshop.cart.checkout(input));
    await assert.rejects(storefront().eshop.cart.retainCheckout(input));
    assert.equal(calls.length, 0);
    assert.equal(storage.getItem(storageKey), null);
  }
});

test("flat or incomplete presentation conflicts are not treated as reviewed Checkout quotes", async () => {
  const order = { locale: "en", presentation_digest: "c".repeat(64), context: {}, money: null, product_lines: [], booking_lines: [], digital_lines: [], subscription_lines: [], delivery_groups: [], payment_option_ids: [] };
  for (const quote of [order, { order, presentation_digest: "b".repeat(64) }, { sources: null, order, presentation_digest: "invalid" }]) {
    const { storage } = browser();
    capture(() => Response.json({ message: "Review", error: "COMMERCE.PRESENTATION_CHANGED", quote }, { status: 409 }));
    await assert.rejects(retainAndRecover(), (error) => !(error instanceof CartPresentationChangedError) && error.statusCode === 409);
    assert.deepEqual(JSON.parse(JSON.parse(storage.getItem(storageKey)).requestJson), request);
  }
});

test("Admin checkout uses the same exact-request recovery and blocks a competing Cart", async () => {
  browser();
  const admin = () => createAdmin({ baseUrl: apiUrl, apiToken: "arky_api_cart" });
  const target = { store_id: STORE_ID };
  capture(() => { throw new TypeError("lost"); });
  assert.deepEqual(await admin().eshop.cart.retainCheckout({ ...target, ...request }), request);
  await assert.rejects(admin().eshop.cart.recoverCheckout(target), /lost/);
  assert.deepEqual(await admin().eshop.cart.pendingCheckout(target), request);
  const calls = capture(success);
  await assert.rejects(admin().eshop.cart.create({ ...target, customer_id: "customer", market_id: "market", sales_channel_id: "channel" }), /Recover the unresolved Cart Checkout/);
  await assert.rejects(admin().eshop.cart.retainCheckout({ ...target, ...request, locale: "bs" }), /different unresolved payload/);
  assert.equal(calls.length, 0);
  assert.deepEqual(await admin().eshop.cart.recoverCheckout(target), result());
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [["POST", `/v1/stores/${STORE_ID}/carts/accept`], ["GET", `/v1/stores/${STORE_ID}/orders/${orderId}`]]);
  const { id: _id, request_id: _request, ...reviewed } = request;
  assert.deepEqual(calls[0].body, { ...reviewed, request_id: requestId });
  assert.equal(await admin().eshop.cart.pendingCheckout(target), null);
  await assert.rejects(async () => admin().eshop.cart.pendingCheckout({}), TypeError);
});

test("server-side checkout uses the caller's exact request without browser storage or an implicit retry", async () => {
  install("window", undefined);
  install("localStorage", undefined);
  const calls = capture(success);
  assert.deepEqual(await storefront().eshop.cart.checkout(request), result());
  const { id, locale: _locale, ...body } = request;
  assert.deepEqual(calls[0].body, body);
  assert.equal(calls.length, 2);
  assert.equal(await storefront().eshop.cart.pendingCheckout(), null);
  assert.equal(await storefront().eshop.cart.recoverCheckout(), null);
});
