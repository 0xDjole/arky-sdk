import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { CartPresentationChangedError } from "../dist/index.js";
import { createStorefront } from "../dist/storefront.js";
import { ExclusiveLockManager, MemoryStorage } from "./helpers/durable-request-fixtures.mjs";
import {
  apiUrl,
  checkoutRequest,
  ids,
  placedAcceptance,
  placedOrder,
  publishableKey,
  quoteRecord,
  visitorStorage,
} from "./helpers/arky-fixtures.mjs";

const storageKey = `arky:cart-checkout:v4:${encodeURIComponent(`storefront:${apiUrl}:${publishableKey}`)}`;
const request = checkoutRequest();
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
  return createStorefront(publishableKey, { apiUrl, locale: "en", market: "bih", sessionStorage: visitorStorage() });
}

function capture(respond) {
  const calls = [];
  install("fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    const call = { path: parsed.pathname, method: init.method, body: init.body ? JSON.parse(init.body) : null, headers: new Headers(init.headers) };
    calls.push(call);
    return respond(call, calls.length);
  });
  return calls;
}

function retained(storage) {
  const value = storage.getItem(storageKey);
  return value === null ? null : JSON.parse(JSON.parse(value).requestJson);
}

async function retainAndRecover(input = request, options) {
  const client = storefront();
  await client.eshop.cart.retainCheckout(input);
  return client.eshop.cart.recoverCheckout(options);
}

function success(call) {
  if (call.method === "POST" && call.path === "/v1/storefront/carts/accept") return Response.json(placedAcceptance());
  if (call.method === "GET" && call.path === `/v1/storefront/orders/${ids.order}`) return Response.json(placedOrder());
  throw new Error(`Recovery must not depend on a live Cart: ${call.method} ${call.path}`);
}

async function loseResponse(input = request) {
  const calls = capture(() => { throw new TypeError("response lost"); });
  await assert.rejects(retainAndRecover(input), /response lost/);
  assert.equal(calls.length, 1);
  return calls;
}

afterEach(() => {
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});

test("Cart checkout retention persists before POST and explicitly recovers the exact request after reload", async () => {
  const { storage } = browser();
  const first = capture(() => {
    assert.deepEqual(retained(storage), request);
    throw new TypeError("response lost");
  });
  assert.deepEqual(await storefront().eshop.cart.retainCheckout(request), request);
  assert.equal(first.length, 0);
  await assert.rejects(storefront().eshop.cart.recoverCheckout(), /response lost/);
  const kept = storage.getItem(storageKey);
  const fresh = storefront();
  assert.deepEqual(await fresh.eshop.cart.pendingCheckout(), request);
  const calls = capture(success);
  assert.deepEqual(await fresh.eshop.cart.recoverCheckout(), placedAcceptance());
  assert.deepEqual(calls[0].body, first[0].body);
  assert.deepEqual(calls[0].body, request);
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["POST", "/v1/storefront/carts/accept"],
    ["GET", `/v1/storefront/orders/${ids.order}`],
  ]);
  assert.equal(calls[0].headers.get("x-arky-locale"), "en");
  assert.equal(kept.includes("client_secret"), false);
  assert.equal(storage.getItem(storageKey), null);
  assert.equal(await fresh.eshop.cart.recoverCheckout(), null);
  assert.equal(calls.length, 2);
});

test("an unresolved checkout blocks every cart change and a new cart until it is recovered", async () => {
  browser();
  await loseResponse();
  const calls = capture(success);
  const cart = storefront().eshop.cart;
  const product = { id: ids.otherLine, product_id: ids.product, variant_id: ids.variant, quantity: 1, purchase: { type: "catalog" } };
  for (const mutate of [
    () => cart.create({ id: ids.otherCart, buyer: { type: "customer" }, catalog_id: null }),
    () => cart.reorder({ id: ids.otherCart, order_id: ids.otherOrder, buyer: { type: "customer" } }),
    () => cart.update({ id: ids.cart, expected_updated_at: 1, promotion_codes: ["NEW"] }),
    () => cart.addProduct({ id: ids.cart, expected_updated_at: 1, product }),
    () => cart.addBooking({ id: ids.cart, expected_updated_at: 1, booking: { id: ids.otherLine, booking_offering_id: ids.product, requested_interval: { from: 1, to: 2 }, capacity_units: 1 } }),
    () => cart.addCustomerGroup({ id: ids.cart, expected_updated_at: 1, customer_group: { id: ids.otherLine, customer_group_id: ids.product, start: { type: "on_acceptance" } } }),
    () => cart.removeItem({ id: ids.cart, expected_updated_at: 1, line_item_id: ids.line }),
    () => cart.clear({ id: ids.cart, expected_updated_at: 1 }),
    () => cart.selectShippingMethod({ id: ids.cart, expected_updated_at: 1, shipping_method_id: ids.product }),
    () => cart.setFutureDeliveries({ id: ids.cart, expected_updated_at: 1, customer_groups: [] }),
  ]) await assert.rejects(mutate(), /Recover the unfinished cart checkout/);
  assert.equal(calls.length, 0);
  assert.deepEqual(await cart.pendingCheckout(), request);
  assert.deepEqual(await cart.recoverCheckout(), placedAcceptance());
  assert.equal(await cart.pendingCheckout(), null);
});

test("direct checkout submits the caller's exact request, never a body language, and creates no recovery state", async () => {
  const { storage } = browser();
  const calls = capture(success);
  assert.deepEqual(await storefront().eshop.cart.checkout({ ...request, language: "bs", locale: "bs", store_id: ids.otherStore }), placedAcceptance());
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [["POST", "/v1/storefront/carts/accept"], ["GET", `/v1/storefront/orders/${ids.order}`]]);
  assert.deepEqual(calls[0].body, request);
  assert.equal("language" in calls[0].body, false);
  assert.equal(calls[0].headers.get("x-arky-locale"), "en");
  assert.equal(storage.getItem(storageKey), null);
  assert.equal(await storefront().eshop.cart.pendingCheckout(), null);
});

test("checkout input the app did not decide explicitly fails before persisting or posting", async () => {
  const invalid = [
    { order_id: undefined }, { order_id: "" }, { order_id: "order-1" }, { order_id: ids.order.toUpperCase() },
    { cart_id: undefined }, { cart_id: "cart-1" },
    { expected_updated_at: undefined }, { expected_updated_at: 1.5 }, { expected_updated_at: "1" },
    { presentation_digest: "" }, { presentation_digest: " digest" }, { presentation_digest: "d".repeat(257) },
    { contact_email: undefined }, { contact_email: "" }, { contact_email: " buyer@example.test" },
    { payment: undefined }, { payment: { type: "card" } }, { payment: { type: "free", amount: 0 } },
    { payment: { type: "on_account", payment_option_id: "terms" } },
    { payment: { ...request.payment, payment_option_id: "card" } },
    { payment: { ...request.payment, return_url: "" } },
    { payment: { ...request.payment, save_payment_method: undefined } },
  ];
  for (const change of invalid) {
    const { storage } = browser();
    const calls = capture(success);
    await assert.rejects(storefront().eshop.cart.checkout({ ...request, ...change }));
    await assert.rejects(storefront().eshop.cart.retainCheckout({ ...request, ...change }));
    assert.equal(calls.length, 0, JSON.stringify(change));
    assert.equal(storage.getItem(storageKey), null);
  }
});

test("free and on-account payment choices are kept exactly as chosen", async () => {
  for (const payment of [{ type: "free" }, { type: "on_account", payment_option_id: ids.otherPaymentOption }]) {
    const { storage } = browser();
    const calls = capture(success);
    const input = { ...request, contact_email: null, payment };
    await storefront().eshop.cart.retainCheckout(input);
    assert.deepEqual(retained(storage), input);
    assert.deepEqual(await storefront().eshop.cart.recoverCheckout(), placedAcceptance());
    assert.deepEqual(calls[0].body, input);
  }
});

test("every changed checkout field stays blocked after ambiguity without another POST", async () => {
  browser();
  await loseResponse();
  const calls = capture(success);
  for (const change of [
    { order_id: ids.otherOrder }, { cart_id: ids.otherCart }, { expected_updated_at: 2 },
    { presentation_digest: "e".repeat(64) }, { contact_email: null }, { contact_email: "other@example.test" },
    { payment: { type: "free" } }, { payment: { ...request.payment, payment_option_id: ids.otherPaymentOption } },
    { payment: { ...request.payment, return_url: null } },
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
  for (const value of ["invalid", JSON.stringify({ requestJson: "invalid" }), JSON.stringify({ requestJson: JSON.stringify({ id: ids.cart }) })]) {
    const { storage } = browser();
    storage.seed(storageKey, value);
    const calls = capture(success);
    await assert.rejects(storefront().eshop.cart.recoverCheckout());
    assert.equal(calls.length, 0);
    assert.equal(storage.getItem(storageKey), value);
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

test("any definite refusal clears the kept request, while a timeout, throttle or server failure keeps it", async () => {
  for (const status of [400, 403, 404, 409, 422, 408, 429, 500, 503]) {
    const { storage } = browser();
    const calls = capture(() => Response.json({ message: "Rejected", error: "CART.CHANGED", status_code: status, validation_errors: [] }, { status }));
    await assert.rejects(retainAndRecover(), (error) => error.statusCode === status);
    assert.equal(calls.filter((call) => call.path.endsWith("/carts/accept")).length, 1);
    const definite = status < 500 && status !== 408 && status !== 429;
    assert.equal(storage.getItem(storageKey) === null, definite, String(status));
  }
});

test("a changed quote on recovery throws the new quote and clears the kept request, so the cart is not stuck", async () => {
  const { storage } = browser();
  const quote = quoteRecord({ presentation_digest: "b".repeat(64) });
  const calls = capture(() => Response.json({ message: "Review the changed quote", error: "COMMERCE.PRESENTATION_CHANGED", status_code: 409, validation_errors: [], quote }, { status: 409 }));
  await assert.rejects(retainAndRecover(), (error) => {
    assert.ok(error instanceof CartPresentationChangedError);
    assert.equal(error.statusCode, 409);
    assert.equal(error.code, "COMMERCE.PRESENTATION_CHANGED");
    assert.deepEqual(error.quote, quote);
    return true;
  });
  assert.equal(calls.length, 1);
  assert.equal(storage.getItem(storageKey), null);
  const after = capture(() => Response.json({ id: ids.cart }));
  await storefront().eshop.cart.update({ id: ids.cart, expected_updated_at: 1, promotion_codes: [] });
  assert.deepEqual(after.map((call) => [call.method, call.path, call.body]), [
    ["PUT", `/v1/storefront/carts/${ids.cart}`, { expected_updated_at: 1, promotion_codes: [] }],
  ]);
});

test("a 503 on recovery keeps the request for the same retry", async () => {
  const { storage } = browser();
  const calls = capture(() => Response.json({ message: "Unavailable", status_code: 503 }, { status: 503 }));
  await assert.rejects(retainAndRecover(), (error) => error.statusCode === 503);
  assert.deepEqual(retained(storage), request);
  assert.equal(calls.length, 1);
  const retry = capture(success);
  assert.deepEqual(await storefront().eshop.cart.recoverCheckout(), placedAcceptance());
  assert.deepEqual(retry[0].body, calls[0].body);
  assert.equal(storage.getItem(storageKey), null);
});

test("flat or incomplete presentation conflicts are not treated as reviewed quotes", async () => {
  for (const quote of [{ presentation_digest: "b".repeat(64) }, { ...quoteRecord(), lines: null }, { ...quoteRecord(), presentation_digest: "" }, null]) {
    browser();
    capture(() => Response.json({ message: "Review", error: "COMMERCE.PRESENTATION_CHANGED", status_code: 409, quote }, { status: 409 }));
    await assert.rejects(retainAndRecover(), (error) => !(error instanceof CartPresentationChangedError) && error.statusCode === 409 && error.code === "COMMERCE.PRESENTATION_CHANGED");
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
    assert.deepEqual(retained(storage), request);
    assert.equal(calls.length, 1);
  }
});

test("a placed answer whose order read fails or does not confirm this cart stays pending without notifying success", async () => {
  for (const getResponse of [
    () => Response.json({ message: "Bad read", status_code: 400 }, { status: 400 }),
    () => { throw new TypeError("read lost"); },
    () => Response.json(placedOrder({ id: ids.otherOrder })),
    () => Response.json(placedOrder({ source: { type: "cart", cart_id: ids.otherCart, placed_by: { type: "customer", customer_id: ids.customer, customer_session_id: ids.session } } })),
    () => Response.json(placedOrder({ source: { type: "renewal", order_customer_group_line_item_id: ids.line, recovery: null } })),
    () => Response.json(placedOrder({ source: null })),
  ]) {
    const { storage } = browser();
    let notified = 0;
    const calls = capture((call) => call.method === "GET" ? getResponse() : Response.json(placedAcceptance()));
    await assert.rejects(retainAndRecover(request, { onSuccess: () => { notified += 1; } }));
    await Promise.resolve();
    assert.equal(notified, 0);
    assert.deepEqual(retained(storage), request);
    assert.equal(calls.length, 2);
  }
});

test("malformed checkout answers never clear the kept request", async () => {
  const invalid = [
    null, {}, { ...placedAcceptance(), type: "accepted" },
    { ...placedAcceptance(), type: undefined },
    { ...placedAcceptance(), order_id: ids.otherOrder },
    { ...placedAcceptance(), order_id: undefined },
    { ...placedAcceptance(), number: 1001 },
    { ...placedAcceptance(), payment_action: null },
    { ...placedAcceptance(), payment_action: "none" },
    { ...placedAcceptance(), payment_id: "payment-1" },
    { type: "already_member" },
    { type: "already_member", customer_group_member_id: "member-1" },
    { type: "already_member", customer_group_member_id: ids.customerGroupMember.toUpperCase() },
  ];
  for (const body of invalid) {
    const { storage } = browser();
    const calls = capture(() => Response.json(body));
    await assert.rejects(retainAndRecover(), /did not return the order|did not name the customer group member/);
    assert.deepEqual(retained(storage), request);
    assert.equal(calls.length, 1);
  }
});

test("an already_member answer finishes the kept checkout without reading an order", async () => {
  const { storage } = browser();
  const answer = { type: "already_member", customer_group_member_id: ids.customerGroupMember };
  let notified = 0;
  const calls = capture(() => Response.json(answer));
  assert.deepEqual(await retainAndRecover(request, { onSuccess: () => { notified += 1; } }), answer);
  await Promise.resolve();
  assert.equal(notified, 1);
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [["POST", "/v1/storefront/carts/accept"]]);
  assert.equal(storage.getItem(storageKey), null);
  const direct = capture(() => Response.json(answer));
  assert.deepEqual(await storefront().eshop.cart.checkout(request), answer);
  assert.equal(direct.length, 1);
});

test("a placed card checkout exposes its payment action only after the order confirms and storage clears", async () => {
  const { storage } = browser();
  const answer = placedAcceptance({
    payment_id: ids.payment,
    payment_action: { type: "stripe_embedded_checkout", publishable_key: "pk_test_exact", client_secret: "cs_test_exact_secret_value", expires_at: 1_900_000_000_000 },
  });
  let notified = 0;
  let storageAtSuccess = "not notified";
  const calls = capture((call) => {
    assert.equal(storage.getItem(storageKey).includes("client_secret"), false);
    return call.method === "GET" ? Response.json(placedOrder()) : Response.json(answer);
  });
  const accepted = await retainAndRecover(request, { onSuccess: () => { storageAtSuccess = storage.getItem(storageKey); notified += 1; } });
  await Promise.resolve();
  assert.deepEqual(accepted, answer);
  assert.equal(notified, 1);
  assert.equal(storageAtSuccess, null);
  assert.equal(calls.length, 2);
  assert.equal(storage.getItem(storageKey), null);
});

test("a placed Monri checkout keeps one order and exposes its card form action without browser persistence", async () => {
  const { storage } = browser();
  const answer = placedAcceptance({
    payment_id: ids.payment,
    payment_action: { type: "monri_components", environment: "test", authenticity_token: "test-token", client_secret: "test-session-secret", save_card: false },
  });
  const calls = capture((call) => {
    const kept = storage.getItem(storageKey);
    assert.equal(kept.includes("client_secret"), false);
    assert.equal(kept.includes("authenticity_token"), false);
    return call.method === "GET" ? Response.json(placedOrder()) : Response.json(answer);
  });
  assert.deepEqual(await retainAndRecover(), answer);
  assert.equal(storage.getItem(storageKey), null);
  assert.equal(calls.length, 2);
  assert.equal(calls.filter((call) => call.method === "POST").length, 1);
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

test("saved-method consent survives lost responses and exact recovery", async () => {
  const { storage } = browser();
  const consentRequest = { ...request, payment: { ...request.payment, save_payment_method: true, payment_method_terms_version: "checkout-2026-09" } };
  await loseResponse(consentRequest);
  assert.deepEqual(await storefront().eshop.cart.pendingCheckout(), consentRequest);
  const calls = capture(success);
  await assert.rejects(storefront().eshop.cart.retainCheckout({ ...consentRequest, payment: { ...consentRequest.payment, payment_method_terms_version: "new-terms" } }), /different unresolved payload/);
  assert.equal(calls.length, 0);
  assert.deepEqual(await storefront().eshop.cart.recoverCheckout(), placedAcceptance());
  assert.equal(calls[0].body.payment.save_payment_method, true);
  assert.equal(calls[0].body.payment.payment_method_terms_version, "checkout-2026-09");
  assert.equal(storage.getItem(storageKey), null);
});

test("saving a payment method requires explicit well-formed consent before transport", async () => {
  for (const payment of [
    { ...request.payment, save_payment_method: "true" },
    { ...request.payment, save_payment_method: true },
    { ...request.payment, save_payment_method: true, payment_method_terms_version: null },
    ...["", " terms", "terms\n", "a".repeat(257)].map((terms) => ({ ...request.payment, save_payment_method: true, payment_method_terms_version: terms })),
  ]) {
    const { storage } = browser();
    const calls = capture(success);
    await assert.rejects(storefront().eshop.cart.checkout({ ...request, payment }));
    await assert.rejects(storefront().eshop.cart.retainCheckout({ ...request, payment }));
    assert.equal(calls.length, 0);
    assert.equal(storage.getItem(storageKey), null);
  }
});

test("server-side checkout uses the caller's exact request without browser storage or an implicit retry", async () => {
  install("window", undefined);
  install("localStorage", undefined);
  const calls = capture(success);
  assert.deepEqual(await storefront().eshop.cart.checkout(request), placedAcceptance());
  assert.deepEqual(calls[0].body, request);
  assert.equal(calls.length, 2);
  assert.equal(await storefront().eshop.cart.pendingCheckout(), null);
  assert.equal(await storefront().eshop.cart.recoverCheckout(), null);
});
