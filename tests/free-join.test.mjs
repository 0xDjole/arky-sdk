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
    catalog_item_id: ids.catalogItem,
    ...overrides,
  };
}

function groupChoice(overrides = {}, amount = 0) {
  return {
    catalog_item_price_id: ids.price,
    sellable: { type: "customer_group", customer_group_id: groupId },
    content: { sku: null, blocks: [], basis: { type: "permanent_agreement" } },
    price: { catalog_item_price_id: ids.price, tax_mode: "inclusive", unit_price: { amount, currency: "eur" }, compare_at: null, priced_at: 1 },
    ...overrides,
  };
}

const choicesPath = `/v1/storefront/catalog-items/${ids.catalogItem}/prices`;

function client(sessionStorage, createId = idSequence(factoryId(1), factoryId(2), ids.order)) {
  return createStorefront(publishableKey, { ...idFactories, createId, createOrderToken: () => orderToken, apiUrl, locale: "en", sessionStorage });
}

function joinServer(context, { loseAccept = false, groupRecord = group(), choicePages = [{ items: [groupChoice()], cursor: null }] } = {}) {
  let cart = null;
  let lose = loseAccept;
  return recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer-groups/newsletter") return groupRecord;
    if (call.path === choicesPath) return choicePages[call.query.cursor ? Number(call.query.cursor) : 0];
    if (call.path === "/v1/storefront/carts") {
      cart ??= cartRecord({ id: call.body.id, catalog_id: call.body.catalog_id });
      return cart.line_items.length ? { type: "existing", cart } : { type: "created", cart, recovery_token: "token" };
    }
    if (call.path.endsWith("/customer-group-items")) {
      cart = { ...cart, updated_at: cart.updated_at + 1, line_items: [{ type: "customer_group", ...call.body.customer_group, deliveries: [] }] };
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
  await assert.rejects(client(visitorStorage()).eshop.customerGroup.joinFree({ key: "newsletter", catalog_id: ids.catalog, language: "en" }), (error) => {
    assert.ok(error instanceof CustomerGroupJoinError);
    assert.equal(error.code, "sign_in_required");
    return true;
  });
  assert.equal(calls.length, 0);
  const result = await client(signedInStorage()).eshop.customerGroup.joinFree({ key: "newsletter", catalog_id: ids.catalog, language: "en" });
  assert.deepEqual(result, { type: "joined", order_id: ids.order });
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["GET", "/v1/storefront/customer-groups/newsletter"],
    ["GET", choicesPath],
    ["POST", "/v1/storefront/carts"],
    ["POST", `/v1/storefront/carts/${factoryId(1)}/customer-group-items`],
    ["POST", `/v1/storefront/carts/${factoryId(1)}/quote`],
    ["POST", "/v1/storefront/carts/accept"],
  ]);
  assert.deepEqual(calls[0].query, { catalog_id: ids.catalog });
  assert.deepEqual(calls[1].query, { catalog_id: ids.catalog, include_price: "true" });
  assert.equal(calls[3].body.customer_group.id, factoryId(2));
  assert.deepEqual(calls[3].body.customer_group.start, { type: "on_acceptance" });
  assert.equal(calls[3].body.customer_group.catalog_item_price_id, ids.price);
  const accept = calls[5].body;
  assert.equal(accept.order_id, ids.order);
  assert.equal(accept.order_token, orderToken);
  assert.deepEqual(accept.contact_email, { email: verifiedEmail, language: "en" });
  assert.deepEqual(accept.payment, { type: "free" });
  assert.equal([...storage.values.keys()].some((key) => key.startsWith("arky:pending-create:v1:")), false);
});

test("a lost sign-up answer is finished from the converted cart's order on the retry", async (context) => {
  browser(context);
  const calls = joinServer(context, { loseAccept: true });
  const api = client(signedInStorage());
  await assert.rejects(api.eshop.customerGroup.joinFree({ key: "newsletter", catalog_id: ids.catalog, language: "en" }), /Lost response/);
  const result = await api.eshop.customerGroup.joinFree({ key: "newsletter", catalog_id: ids.catalog, language: "en" });
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
  for (const refused of [group({ term: { type: "recurring" } }), group({ entitlements: [{}] })]) {
    groupRecord = refused;
    await assert.rejects(client(signedInStorage()).eshop.customerGroup.joinFree({ key: "newsletter", catalog_id: ids.catalog, language: "en" }), (error) => error instanceof CustomerGroupJoinError && error.code === "not_free");
  }
  assert.deepEqual(calls.map((call) => call.path), Array(2).fill("/v1/storefront/customer-groups/newsletter"));
});

test("a free sign-up follows the listing's price pages to the group's own price and refuses a priced or missing one", async (context) => {
  browser(context);
  const otherGroup = groupChoice({ catalog_item_price_id: ids.otherPrice, sellable: { type: "customer_group", customer_group_id: ids.form } });
  const calls = joinServer(context, {
    choicePages: [
      { items: [otherGroup], cursor: "1" },
      { items: [], cursor: "2" },
      { items: [groupChoice()], cursor: null },
    ],
  });
  assert.deepEqual(await client(signedInStorage()).eshop.customerGroup.joinFree({ key: "newsletter", catalog_id: ids.catalog, language: "en" }), { type: "joined", order_id: ids.order });
  const reads = calls.filter((call) => call.path === choicesPath);
  assert.deepEqual(reads.map((call) => call.query.cursor ?? null), [null, "1", "2"]);
  const line = calls.find((call) => call.path.endsWith("/customer-group-items"));
  assert.equal(line.body.customer_group.catalog_item_price_id, ids.price);
  for (const pages of [
    [{ items: [groupChoice({}, 500)], cursor: null }],
    [{ items: [groupChoice({ price: null })], cursor: null }],
    [{ items: [otherGroup], cursor: null }],
  ]) {
    context.mock.restoreAll();
    const refusedCalls = joinServer(context, { choicePages: pages });
    await assert.rejects(client(signedInStorage()).eshop.customerGroup.joinFree({ key: "newsletter", catalog_id: ids.catalog, language: "en" }), (error) => error instanceof CustomerGroupJoinError && error.code === "not_free");
    assert.equal(refusedCalls.some((call) => call.path === "/v1/storefront/carts"), false);
  }
  context.mock.restoreAll();
  joinServer(context, { choicePages: [{ items: [], cursor: "0" }] });
  await assert.rejects(client(signedInStorage()).eshop.customerGroup.joinFree({ key: "newsletter", catalog_id: ids.catalog, language: "en" }), (error) => error.code === "answer_mismatch");
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
  assert.deepEqual(await api.newsletter.requestCode({ contact: { email: " Customer@Example.test ", language: "en" } }), { type: "verified" });
  assert.equal(calls.length, 0);
  assert.deepEqual(await api.newsletter.requestCode({ contact: { email: "reader@example.test", language: "en" } }), { type: "code_sent" });
  assert.deepEqual(calls.map((call) => call.path), [
    "/v1/storefront/customer/logout",
    "/v1/storefront/customer/identify",
    "/v1/storefront/customer/request-code",
  ]);
  assert.deepEqual(calls[2].body, { id: factoryId(4), contact: { email: "reader@example.test", language: "en" } });
});

test("newsletter.join verifies the code, checks the address and joins in the caller's language, not the verified contact's", async (context) => {
  browser(context);
  const signedIn = sessionResult(ids.customer, emailSession(ids.customer, ids.otherSession));
  let joined = false;
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/verify") return signedIn;
    if (call.path === "/v1/storefront/customer-groups/newsletter") return group();
    if (call.path === choicesPath) return { items: [groupChoice()], cursor: null };
    if (call.path === "/v1/storefront/carts") return { type: "created", cart: cartRecord({ id: call.body.id }), recovery_token: "token" };
    if (call.path.endsWith("/customer-group-items")) return cartRecord({ id: factoryId(1), updated_at: 2, line_items: [{ type: "customer_group", ...call.body.customer_group, deliveries: [] }] });
    if (call.path.endsWith("/quote")) return quoteRecord({ cart_id: factoryId(1), totals: { subtotal: 0, delivery: 0, discount: 0, tax: 0, total: 0 }, lines: [{ type: "customer_group" }] });
    if (call.path === "/v1/storefront/carts/accept") {
      joined = true;
      return placedAcceptance({ order_id: call.body.order_id });
    }
    throw new Error(`Unexpected request ${call.path}`);
  });
  const api = client(new SessionStorage(storedSession(ids.customer, visitorSession(ids.customer, ids.session))));
  await assert.rejects(api.newsletter.join({ email: verifiedEmail, key: "newsletter", catalog_id: ids.catalog, language: "en" }), (error) => error instanceof CustomerGroupJoinError && error.code === "sign_in_required");
  await assert.rejects(api.newsletter.join({ email: "other@example.test", code: "123456", key: "newsletter", catalog_id: ids.catalog, language: "en" }), (error) => error instanceof CustomerGroupJoinError && error.code === "email_mismatch");
  assert.equal(joined, false);
  assert.deepEqual(api.session.customer.type.contact, { email: verifiedEmail, language: "en" });
  assert.deepEqual(await api.newsletter.join({ email: verifiedEmail, key: "newsletter", catalog_id: ids.catalog, language: "bs" }), { type: "joined", order_id: ids.order });
  const accept = calls.find((call) => call.path === "/v1/storefront/carts/accept");
  assert.deepEqual(accept.body.contact_email, { email: verifiedEmail, language: "bs" });
});

function signedInWithLanguage(language) {
  const signedIn = sessionResult(ids.customer, emailSession());
  signedIn.customer.type.contact = { email: verifiedEmail, language };
  return new SessionStorage(JSON.stringify({ version: 4, ...signedIn }));
}

test("a free sign-up names the Order contact in the caller's language, not the language the verified contact saved", async (context) => {
  browser(context);
  const calls = joinServer(context);
  const result = await client(signedInWithLanguage("fr")).eshop.customerGroup.joinFree({ key: "newsletter", catalog_id: ids.catalog, language: "bs" });
  assert.deepEqual(result, { type: "joined", order_id: ids.order });
  const accept = calls.find((call) => call.path === "/v1/storefront/carts/accept");
  assert.deepEqual(accept.body.contact_email, { email: verifiedEmail, language: "bs" });
});
