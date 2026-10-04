import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createAdmin } from "../dist/index.js";
import { createStorefront } from "../dist/storefront.js";
import { ExclusiveLockManager, MemoryStorage } from "./helpers/durable-request-fixtures.mjs";
import { checkoutSources } from "./helpers/checkout-sources.mjs";

const apiUrl = "https://api.example.test";
const storeId = "f9381184-884b-44aa-b34f-6816234722ea";
const accountId = "ecbe245b-c8d8-4f8c-b739-6c9c66aa3121";
const otherAccountId = "2c92d9d4-608f-4b02-a198-9874f8c7e905";
const cartId = "c7d4b584-c4c3-4bfd-9c16-9d2c359e10d9";
const requestId = "1cd992a0-810f-4ca2-8ac9-ff1899b57dde";
const orderId = "35882154-af7c-43a4-bcce-e8ac7bc63e4d";
const providerId = "b1077a2e-e166-489d-9391-553db441c73c";
const companyId = "f581728f-8a86-4598-b27b-ef5ea7636277";
const branchId = "8c68fc2e-57b6-44fc-8f9c-6cbd1c76dbcf";
const termsId = "ac2cc7a2-c57c-43da-999b-4b7c21bda9ee";
const target = { store_id: storeId };
const request = { id: cartId, request_id: requestId, locale: "en", presentation_digest: "a".repeat(64), sources: checkoutSources(cartId), payment_option_id: providerId, reason: "Merchant approved Net30 for this one-time branch purchase" };
const ordinary = { id: cartId, request_id: requestId, locale: "en", presentation_digest: "a".repeat(64), sources: checkoutSources(cartId) };
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

function admin(token = "arky_api_current", baseUrl = apiUrl) {
  return createAdmin({ baseUrl, apiToken: token });
}

function key(account = accountId, store = storeId, baseUrl = apiUrl) {
  return `arky:commerce-cart-checkout:v1:${encodeURIComponent(`admin:${baseUrl}:${account}:${store}`)}`;
}

function result() {
  return { order_id: orderId, number: "ORDER-1001", payment: null, payment_action: { type: "none" } };
}

function acceptedOrder(input = request) {
  const actor = { account_id: accountId, snapshot: { email: "staff@example.test", credential_type: "api_token" } };
  return {
    id: orderId, number: "ORDER-1001", store_id: storeId, accepted_at: 1800000000000,
    source: {
      type: "cart_acceptance", request_id: input.request_id, submission_fingerprint: "f".repeat(64),
      initial_payment_id: null, first_order_terms: null, cart: input.sources.cart, converted_lines: input.sources.converted_lines,
    },
    origin: { type: "admin", actor },
    collection_policy: { type: "on_account", authorized_by: actor, reason: input.reason },
    payment_authorization: { actor: { type: "admin", actor }, accepted_at: 1800000000000, allowed_payment_option_ids: input.payment_option_id ? [input.payment_option_id] : [] },
    company: {
      company_id: companyId, company_location_id: branchId,
      company_snapshot: { source_company_id: companyId },
      company_location_snapshot: { source_company_location_id: branchId, commerce: { payment_terms_id: termsId, allowed_payment_option_ids: [providerId], purchase_order_number_required: false } },
    },
    payment_terms: { key: "net30", type: { type: "net_days", days: 30 }, due_at: 1802592000000 },
    line_items: [{ type: "product", id: input.sources.converted_lines[0].order_line_item.line_item_id }],
  };
}

function capture(respond, account = (authorization) => authorization === "Bearer arky_api_other" ? otherAccountId : accountId) {
  const calls = [];
  install("fetch", async (url, init = {}) => {
    const call = { origin: new URL(url).origin, path: new URL(url).pathname, method: init.method, headers: new Headers(init.headers), body: init.body ? JSON.parse(init.body) : null };
    calls.push(call);
    if (call.path === "/v1/accounts/me") return Response.json({ id: account(call.headers.get("Authorization")), status: { type: "active" } });
    return respond(call);
  });
  return calls;
}

function success(call, input = request) {
  if (call.method === "POST" && call.path.endsWith("/carts/accept-on-account")) return Response.json(result());
  if (call.method === "GET" && call.path.endsWith(`/orders/${orderId}`)) return Response.json(acceptedOrder(input));
  throw new Error(`Unexpected OnAccount wire request ${call.method} ${call.path}`);
}

function stored(storage) {
  const value = storage.getItem(key());
  return value === null ? null : JSON.parse(JSON.parse(value).requestJson);
}

afterEach(() => {
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});

test("OnAccount lost response retains its exact command and blocks ordinary acceptance and all Cart mutations", async () => {
  const { storage } = browser();
  capture(() => { throw new TypeError("response lost"); });
  assert.deepEqual(await admin().eshop.cart.retainOnAccountCheckout({ ...target, ...request }), request);
  await assert.rejects(admin().eshop.cart.recoverOnAccountCheckout(target), /response lost/);
  assert.deepEqual(stored(storage), { type: "on_account", request });
  const calls = capture(success);
  assert.deepEqual(await admin().eshop.cart.pendingOnAccountCheckout(target), request);
  assert.equal(await admin().eshop.cart.pendingCheckout(target), null);
  await assert.rejects(admin().eshop.cart.retainCheckout({ ...target, ...ordinary }), /different unresolved payload/);
  await assert.rejects(admin().eshop.cart.recoverCheckout(target), /retained command/);
  const mutations = [
    () => admin().eshop.cart.checkout({ ...target, ...ordinary }),
    () => admin().eshop.cart.checkoutOnAccount({ ...target, ...request }),
    () => admin().eshop.cart.create({ ...target, customer_id: accountId, market_id: companyId, sales_channel_id: branchId }),
    () => admin().eshop.cart.update({ ...target, id: cartId, purchase_order_number: "changed" }),
    () => admin().eshop.cart.addProduct({ ...target, id: cartId, product: {} }),
    () => admin().eshop.cart.addBooking({ ...target, id: cartId, booking: {} }),
    () => admin().eshop.cart.addDigital({ ...target, id: cartId, digital: {} }),
    () => admin().eshop.cart.addSubscriptionPlan({ ...target, id: cartId, subscription_plan: {} }),
    () => admin().eshop.cart.removeItem({ ...target, id: cartId, line_item_id: companyId }),
    () => admin().eshop.cart.clear({ ...target, id: cartId }),
    () => admin().eshop.cart.acceptFutureDeliveries({ ...target, id: cartId, plans: [] }),
    () => admin().eshop.cart.reviewFirstOrderTerms({ ...target, id: cartId, request_id: branchId }),
    () => admin().eshop.cart.sealFirstOrderTerms({ ...target, id: cartId, request_id: branchId }),
  ];
  for (const mutation of mutations) await assert.rejects(mutation(), /Recover the unresolved Cart Checkout/);
  assert.equal(calls.filter((call) => call.method !== "GET").length, 0);
  assert.deepEqual(stored(storage), { type: "on_account", request });
  assert.deepEqual(await admin().eshop.cart.recoverOnAccountCheckout(target), result());
  assert.equal(stored(storage), null);
  const wire = calls.filter((call) => call.path !== "/v1/accounts/me");
  assert.deepEqual(wire.map((call) => [call.method, call.path]), [["POST", `/v1/stores/${storeId}/carts/accept-on-account`], ["GET", `/v1/stores/${storeId}/orders/${orderId}`]]);
  const { id, ...body } = request;
  assert.deepEqual(wire[0].body, body);
  assert.equal(wire[0].headers.get("Authorization"), "Bearer arky_api_current");
  assert.equal("store_id" in wire[0].body, false);
  assert.equal("authorized_by" in wire[0].body, false);
  assert.equal("return_url" in wire[0].body, false);
});

test("ordinary Admin recovery retains its command and prevents an interleaved credit purchase", async () => {
  const { storage } = browser();
  capture(() => { throw new TypeError("lost"); });
  await admin().eshop.cart.retainCheckout({ ...target, ...ordinary });
  await assert.rejects(admin().eshop.cart.recoverCheckout(target), /lost/);
  assert.deepEqual(stored(storage), { type: "checkout", request: ordinary });
  const calls = capture((call) => {
    if (call.method === "POST" && call.path.endsWith("/carts/accept")) return Response.json(result());
    const order = acceptedOrder(ordinary);
    order.collection_policy = { type: "prepaid", due_at: order.accepted_at };
    return Response.json(order);
  });
  assert.equal(await admin().eshop.cart.pendingOnAccountCheckout(target), null);
  await assert.rejects(admin().eshop.cart.retainOnAccountCheckout({ ...target, ...request }), /different unresolved payload/);
  await assert.rejects(admin().eshop.cart.recoverOnAccountCheckout(target), /retained command/);
  await assert.rejects(admin().eshop.cart.checkoutOnAccount({ ...target, ...request }), /Recover the unresolved Cart Checkout/);
  assert.equal(calls.filter((call) => call.method === "POST").length, 0);
  assert.deepEqual(await admin().eshop.cart.recoverCheckout(target), result());
  assert.equal(stored(storage), null);
});

test("OnAccount journal partitions actual Accounts, Stores and API origins without persisting credentials", async () => {
  const { storage } = browser();
  capture(success);
  await admin().eshop.cart.retainOnAccountCheckout({ ...target, ...request });
  assert.equal(await admin("arky_api_other").eshop.cart.pendingOnAccountCheckout(target), null);
  assert.equal(await admin().eshop.cart.pendingOnAccountCheckout({ store_id: branchId }), null);
  assert.equal(await admin("arky_api_current", "https://other.example.test").eshop.cart.pendingOnAccountCheckout(target), null);
  assert.deepEqual(await admin().eshop.cart.pendingOnAccountCheckout(target), request);
  assert.equal(storage.getItem(key()).includes("arky_api_current"), false);
  assert.deepEqual(stored(storage), { type: "on_account", request });
});

test("mismatching accepted Order evidence never clears the retained OnAccount request", async () => {
  const changes = [
    (order) => { order.store_id = branchId; },
    (order) => { order.id = branchId; },
    (order) => { order.source.request_id = branchId; },
    (order) => { order.source.cart = { ...order.source.cart, version: "tito:v1:0000000000000002" }; },
    (order) => { order.source.converted_lines = []; },
    (order) => { order.source.initial_payment_id = branchId; },
    (order) => { order.source.first_order_terms = {}; },
    (order) => { order.collection_policy.reason = "Another approval"; },
    (order) => { order.collection_policy = { type: "prepaid", due_at: order.accepted_at }; },
    (order) => { order.collection_policy.authorized_by.account_id = otherAccountId; },
    (order) => { order.origin = { type: "storefront", customer_id: accountId }; },
    (order) => { order.payment_authorization.allowed_payment_option_ids.push(branchId); },
    (order) => { order.payment_authorization.actor = { type: "subscription", authorization_digest: "a".repeat(64) }; },
    (order) => { order.payment_authorization.accepted_at += 1; },
    (order) => { order.company = null; },
    (order) => { order.company.company_location_snapshot.commerce.payment_terms_id = null; },
    (order) => { order.payment_terms = null; },
    (order) => { order.payment_terms.type = { type: "net_days", days: 0 }; },
    (order) => { order.line_items[0].type = "subscription_plan"; },
  ];
  for (const change of changes) {
    const { storage } = browser();
    capture((call) => {
      if (call.method === "POST") return Response.json(result());
      const order = acceptedOrder();
      change(order);
      return Response.json(order);
    });
    await admin().eshop.cart.retainOnAccountCheckout({ ...target, ...request });
    await assert.rejects(admin().eshop.cart.recoverOnAccountCheckout(target), /exact accepted merchant credit Order/);
    assert.deepEqual(stored(storage), { type: "on_account", request });
  }
});

test("a payment or provider action in an OnAccount response is rejected before accepted Order read", async () => {
  for (const change of [
    { payment: { id: branchId } },
    { payment_action: { type: "stripe_embedded_checkout", client_secret: "private" } },
    { payment_action: { type: "none", client_secret: "private" } },
  ]) {
    const { storage } = browser();
    const calls = capture(() => Response.json({ ...result(), ...change }));
    await admin().eshop.cart.retainOnAccountCheckout({ ...target, ...request });
    await assert.rejects(admin().eshop.cart.recoverOnAccountCheckout(target), /invalid credit purchase evidence/);
    assert.equal(calls.some((call) => call.path.includes("/orders/")), false);
    assert.deepEqual(stored(storage), { type: "on_account", request });
  }
});

test("DueOnReceipt credit with no selected option confirms empty permission and no Payment", async () => {
  const { storage } = browser();
  const { payment_option_id, ...input } = request;
  capture((call) => {
    if (call.method === "POST") return Response.json(result());
    const order = acceptedOrder(input);
    order.payment_terms = { key: "receipt", type: { type: "due_on_receipt" }, due_at: order.accepted_at };
    order.company.company_location_snapshot.commerce.allowed_payment_option_ids = [];
    return Response.json(order);
  });
  await admin().eshop.cart.retainOnAccountCheckout({ ...target, ...input });
  assert.deepEqual(await admin().eshop.cart.recoverOnAccountCheckout(target), result());
  assert.equal(stored(storage), null);
});

test("success callback sees the shared journal cleared only after exact Order confirmation", async () => {
  const { storage } = browser();
  capture(success);
  await admin().eshop.cart.retainOnAccountCheckout({ ...target, ...request });
  let calls = 0;
  await admin().eshop.cart.recoverOnAccountCheckout(target, { onSuccess() { calls += 1; assert.equal(stored(storage), null); } });
  await Promise.resolve();
  assert.equal(calls, 1);
});

test("lost Order read repeats the same accepted command without replacing retained material", async () => {
  const { storage } = browser();
  const first = capture((call) => {
    if (call.method === "POST") return Response.json(result());
    throw new TypeError("Order reply lost");
  });
  await admin().eshop.cart.retainOnAccountCheckout({ ...target, ...request });
  await assert.rejects(admin().eshop.cart.recoverOnAccountCheckout(target), /Order reply lost/);
  const acceptedBody = first.find((call) => call.method === "POST").body;
  const second = capture(success);
  assert.deepEqual(await admin().eshop.cart.recoverOnAccountCheckout(target), result());
  assert.deepEqual(second.find((call) => call.method === "POST").body, acceptedBody);
  assert.equal(stored(storage), null);
});

test("only explicit definite rejection clears a retained credit request", async () => {
  for (const status of [400, 401, 409, 503]) {
    const { storage } = browser();
    capture(() => Response.json({ message: "Rejected", error: "REJECTED" }, { status }));
    await admin().eshop.cart.retainOnAccountCheckout({ ...target, ...request });
    await assert.rejects(admin().eshop.cart.recoverOnAccountCheckout(target), (error) => error.statusCode === status);
    assert.deepEqual(stored(storage), status === 400 ? null : { type: "on_account", request });
  }
});

test("shared cross-tab lock denies another recovery before a second acceptance send", async () => {
  const { storage } = browser();
  let release;
  let observed;
  const entered = new Promise((resolve) => { observed = resolve; });
  const held = new Promise((resolve) => { release = resolve; });
  const calls = capture(async (call) => {
    if (call.method === "POST") { observed(); await held; return Response.json(result()); }
    return Response.json(acceptedOrder());
  });
  await admin().eshop.cart.retainOnAccountCheckout({ ...target, ...request });
  const pending = admin().eshop.cart.recoverOnAccountCheckout(target);
  await entered;
  await assert.rejects(admin().eshop.cart.recoverOnAccountCheckout(target), /already active in another tab/);
  await assert.rejects(admin().eshop.cart.recoverCheckout(target), /already active in another tab/);
  assert.equal(calls.filter((call) => call.method === "POST").length, 1);
  release();
  assert.deepEqual(await pending, result());
  assert.equal(stored(storage), null);
});

test("invalid reason or privileged/provider material is rejected before wire or journal writes", async () => {
  for (const change of [
    { reason: "" }, { reason: " space " }, { reason: "line\nbreak" }, { reason: "ž".repeat(1025) },
    { return_url: "https://site.example/return" }, { save_payment_method: true },
    { authorized_by: { account_id: accountId } }, { collection_policy: { type: "on_account" } },
  ]) {
    const { storage } = browser();
    const calls = capture(success);
    await assert.rejects(admin().eshop.cart.retainOnAccountCheckout({ ...target, ...request, ...change }));
    assert.equal(calls.length, 0);
    assert.equal(stored(storage), null);
  }
});

test("unverified or malformed current Account cannot claim another journal scope", async () => {
  for (const id of ["missing", accountId.toUpperCase(), null]) {
    const { storage } = browser();
    const calls = capture(success, () => id);
    await assert.rejects(admin().eshop.cart.retainOnAccountCheckout({ ...target, ...request }), /unchanged current Account/);
    assert.equal(calls.length, 1);
    assert.equal(stored(storage), null);
  }
});

test("existing branch commerce command preserves exact CAS and full nullable policy fields", async () => {
  const calls = capture((call) => Response.json({ id: branchId, store_id: storeId, ...call.body }));
  const input = { ...target, id: branchId, expected_updated_at: 1800000000000, commerce: { payment_terms_id: termsId, allowed_payment_option_ids: [providerId], purchase_order_number_required: true } };
  const signal = new AbortController().signal;
  await admin().companies.location.setCommercePolicy(input, { signal, headers: { "X-Review": "native-cas" } });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "PUT");
  assert.equal(calls[0].path, `/v1/stores/${storeId}/company-locations/${branchId}/commerce`);
  assert.deepEqual(calls[0].body, { expected_updated_at: input.expected_updated_at, commerce: input.commerce });
  assert.equal(calls[0].headers.get("X-Review"), "native-cas");
  assert.equal(calls[0].headers.get("Authorization"), "Bearer arky_api_current");
  await admin().companies.location.setCommercePolicy({ ...input, commerce: { payment_terms_id: null, allowed_payment_option_ids: null, purchase_order_number_required: false } });
  assert.deepEqual(calls[1].body.commerce, { payment_terms_id: null, allowed_payment_option_ids: null, purchase_order_number_required: false });
});

test("credit acceptance stays on the Admin surface and SSR sends no implicit retry", async () => {
  delete globalThis.window;
  delete globalThis.localStorage;
  delete globalThis.navigator;
  const calls = capture(success);
  assert.deepEqual(await admin().eshop.cart.checkoutOnAccount({ ...target, ...request }), result());
  assert.deepEqual(calls.map((call) => call.method), ["GET", "POST", "GET"]);
  assert.equal(await admin().eshop.cart.pendingOnAccountCheckout(target), null);
  assert.equal(await admin().eshop.cart.recoverOnAccountCheckout(target), null);
  const storefront = createStorefront(`arky_pk_${"a".repeat(42)}A`, { apiUrl, locale: "en", market: "bih" });
  assert.equal("checkoutOnAccount" in storefront.eshop.cart, false);
  assert.equal("retainOnAccountCheckout" in storefront.eshop.cart, false);
});
