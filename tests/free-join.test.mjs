import assert from "node:assert/strict";
import test from "node:test";

import { createStorefront, CustomerGroupJoinError } from "../dist/storefront.js";
import { ExclusiveLockManager, MemoryStorage } from "./helpers/durable-request-fixtures.mjs";
import {
  apiUrl,
  cartRecord,
  customerRecord,
  emailSession,
  factoryId,
  ids,
  idFactories,
  idSequence,
  installGlobal,
  placedAcceptance,
  placedOrder,
  publishableKey,
  quoteRecord,
  recordFetch,
  sessionResult,
  SessionStorage,
  signedInStorage,
  storedSession,
  visitorSession,
  visitorStorage,
} from "./helpers/arky-fixtures.mjs";

const groupId = "6d8f0b2c-4e6a-4c8e-9a0c-2e4a6c8e0a6d";
const orderToken = `arky_ot_${"J".repeat(42)}A`;
const verifiedEmail = "customer@example.test";

function browser(context) {
  const storage = new MemoryStorage();
  installGlobal(context, "window", globalThis);
  installGlobal(context, "localStorage", storage);
  installGlobal(context, "navigator", { locks: new ExclusiveLockManager() });
  return storage;
}

function group(overrides = {}) {
  return {
    id: groupId,
    key: "newsletter",
    blocks: [],
    term: { type: "permanent" },
    purchase_requirement: null,
    entitlements: [],
    price: { tax_mode: "inclusive", unit_price: { amount: 0, currency: "eur" }, compare_at: null, min_quantity: 1, max_quantity: null, priced_at: 1 },
    ...overrides,
  };
}

function client(sessionStorage, createId = idSequence(factoryId(1), factoryId(2), ids.order)) {
  return createStorefront(publishableKey, { ...idFactories, createId, createOrderToken: () => orderToken, apiUrl, locale: "en", sessionStorage });
}

function joinServer(context, { loseAccept = false, groupRecord = group() } = {}) {
  let cart = null;
  let lose = loseAccept;
  return recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer-groups/newsletter") return groupRecord;
    if (call.path === "/v1/storefront/carts") {
      cart ??= cartRecord({ id: call.body.id, catalog_id: call.body.catalog_id });
      return cart.line_items.length ? { type: "existing", cart } : { type: "created", cart, recovery_token: "token" };
    }
    if (call.path.endsWith("/customer-group-items")) {
      cart = { ...cart, updated_at: cart.updated_at + 1, line_items: [{ type: "customer_group", ...call.body.customer_group, deliveries: [], price_override: null }] };
      return cart;
    }
    if (call.path.endsWith("/quote")) return quoteRecord({ cart_id: cart.id, totals: { subtotal: 0, delivery: 0, discount: 0, tax: 0, total: 0 }, lines: [{ type: "customer_group" }] });
    if (call.path === "/v1/storefront/carts/accept") {
      if (lose) {
        lose = false;
        cart = { ...cart, status: { type: "converted" } };
        throw new TypeError("Lost response");
      }
      return placedAcceptance({ order_id: call.body.order_id });
    }
    if (call.path === `/v1/storefront/orders/${ids.order}`) return placedOrder({ source: { type: "cart", cart_id: cart.id, placed_by: { type: "customer", customer_id: ids.customer, customer_session_id: ids.session } } });
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
}

test("joinFree places one zero-price order with factory ids and refuses a visitor", async (context) => {
  const storage = browser(context);
  const calls = joinServer(context);
  await assert.rejects(client(visitorStorage()).eshop.customerGroup.joinFree({ key: "newsletter", catalog_id: ids.catalog }), (error) => {
    assert.ok(error instanceof CustomerGroupJoinError);
    assert.equal(error.code, "sign_in_required");
    return true;
  });
  assert.equal(calls.length, 0);
  const result = await client(signedInStorage()).eshop.customerGroup.joinFree({ key: "newsletter", catalog_id: ids.catalog });
  assert.deepEqual(result, { type: "joined", order_id: ids.order });
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["GET", "/v1/storefront/customer-groups/newsletter"],
    ["POST", "/v1/storefront/carts"],
    ["POST", `/v1/storefront/carts/${factoryId(1)}/customer-group-items`],
    ["POST", `/v1/storefront/carts/${factoryId(1)}/quote`],
    ["POST", "/v1/storefront/carts/accept"],
  ]);
  assert.equal(calls[0].query.include_price, "true");
  assert.equal(calls[2].body.customer_group.id, factoryId(2));
  assert.deepEqual(calls[2].body.customer_group.start, { type: "on_acceptance" });
  const accept = calls[4].body;
  assert.equal(accept.order_id, ids.order);
  assert.equal(accept.order_token, orderToken);
  assert.equal(accept.contact_email, verifiedEmail);
  assert.deepEqual(accept.payment, { type: "free" });
  assert.equal([...storage.values.keys()].some((key) => key.startsWith("arky:pending-create:v1:")), false);
});

test("a lost sign-up answer is finished from the converted cart's order on the retry", async (context) => {
  browser(context);
  const calls = joinServer(context, { loseAccept: true });
  const api = client(signedInStorage());
  await assert.rejects(api.eshop.customerGroup.joinFree({ key: "newsletter", catalog_id: ids.catalog }), /Lost response/);
  const result = await api.eshop.customerGroup.joinFree({ key: "newsletter", catalog_id: ids.catalog });
  assert.deepEqual(result, { type: "joined", order_id: ids.order });
  const creates = calls.filter((call) => call.path === "/v1/storefront/carts");
  assert.deepEqual(creates.map((call) => call.body.id), [factoryId(1), factoryId(1)]);
  assert.equal(calls.at(-1).path, `/v1/storefront/orders/${ids.order}`);
  assert.equal(calls.at(-1).headers.get("x-arky-order-token"), orderToken);
});

test("a group that isn't a free permanent sign-up is refused before any cart", async (context) => {
  browser(context);
  let groupRecord = group();
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer-groups/newsletter") return groupRecord;
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  for (const refused of [group({ term: { type: "recurring" } }), group({ entitlements: [{}] }), group({ price: null })]) {
    groupRecord = refused;
    await assert.rejects(client(signedInStorage()).eshop.customerGroup.joinFree({ key: "newsletter", catalog_id: ids.catalog }), (error) => error instanceof CustomerGroupJoinError && error.code === "not_free");
  }
  assert.deepEqual(calls.map((call) => call.path), Array(3).fill("/v1/storefront/customer-groups/newsletter"));
});

test("newsletter.requestCode skips a code for the signed-in address and signs out another one first", async (context) => {
  browser(context);
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/logout") return new Response(null, { status: 204 });
    if (call.path === "/v1/storefront/customer/identify") return sessionResult(ids.otherCustomer, visitorSession(ids.otherCustomer, ids.otherSession));
    if (call.path === "/v1/storefront/customer/request-code") {
      return { customer: customerRecord(ids.otherCustomer), session: { id: ids.otherSession, store_id: ids.store, customer_id: ids.otherCustomer }, email_verification: { issued_at: 1, expires_at: 2 } };
    }
    throw new Error(`Unexpected request ${call.path}`);
  });
  const api = createStorefront(publishableKey, {
    ...idFactories,
    createVisitorIdentity: () => ({ customer_id: ids.otherCustomer, session_id: ids.otherSession }),
    createId: idSequence(factoryId(4)),
    apiUrl,
    locale: "en",
    sessionStorage: signedInStorage(),
  });
  assert.deepEqual(await api.newsletter.requestCode({ email: " Customer@Example.test ", language: "en" }), { type: "verified" });
  assert.equal(calls.length, 0);
  assert.deepEqual(await api.newsletter.requestCode({ email: "reader@example.test", language: "en" }), { type: "code_sent" });
  assert.deepEqual(calls.map((call) => call.path), [
    "/v1/storefront/customer/logout",
    "/v1/storefront/customer/identify",
    "/v1/storefront/customer/request-code",
  ]);
  assert.deepEqual(calls[2].body, { id: factoryId(4), email: "reader@example.test", language: "en" });
});

test("newsletter.join verifies the code, checks the address and joins", async (context) => {
  browser(context);
  const signedIn = sessionResult(ids.customer, emailSession(ids.customer, ids.otherSession));
  let joined = false;
  recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/verify") return signedIn;
    if (call.path === "/v1/storefront/customer-groups/newsletter") return group();
    if (call.path === "/v1/storefront/carts") return { type: "created", cart: cartRecord({ id: call.body.id }), recovery_token: "token" };
    if (call.path.endsWith("/customer-group-items")) return cartRecord({ id: factoryId(1), updated_at: 2, line_items: [{ type: "customer_group", ...call.body.customer_group, deliveries: [], price_override: null }] });
    if (call.path.endsWith("/quote")) return quoteRecord({ cart_id: factoryId(1), totals: { subtotal: 0, delivery: 0, discount: 0, tax: 0, total: 0 }, lines: [{ type: "customer_group" }] });
    if (call.path === "/v1/storefront/carts/accept") {
      joined = true;
      return placedAcceptance({ order_id: call.body.order_id });
    }
    throw new Error(`Unexpected request ${call.path}`);
  });
  const api = client(new SessionStorage(storedSession(ids.customer, visitorSession(ids.customer, ids.session))));
  await assert.rejects(api.newsletter.join({ email: verifiedEmail, key: "newsletter", catalog_id: ids.catalog }), (error) => error instanceof CustomerGroupJoinError && error.code === "sign_in_required");
  await assert.rejects(api.newsletter.join({ email: "other@example.test", code: "123456", key: "newsletter", catalog_id: ids.catalog }), (error) => error instanceof CustomerGroupJoinError && error.code === "email_mismatch");
  assert.equal(joined, false);
  assert.deepEqual(await api.newsletter.join({ email: verifiedEmail, key: "newsletter", catalog_id: ids.catalog }), { type: "joined", order_id: ids.order });
});
