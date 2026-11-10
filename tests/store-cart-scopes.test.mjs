import assert from "node:assert/strict";
import test from "node:test";

import { initialize } from "../dist/storefront.js";
import {
  apiUrl,
  cartRecord,
  checkoutRequest,
  emailSession,
  errorResponse,
  factoryId,
  ids,
  idFactories,
  idSequence,
  installGlobal,
  storefrontIdentity,
  quoteRecord,
  recordFetch,
  sessionResult,
  signedInStorage,
  visitorSession,
  visitorStorage,
} from "./helpers/arky-fixtures.mjs";
import { ExclusiveLockManager, MemoryStorage } from "./helpers/durable-request-fixtures.mjs";

const customer = { type: "customer" };
const profileA = "1b3d5f7a-9c2e-4a6b-8d0f-2e4a6c8e0b1d";
const profileB = "7c9e1a3b-5d7f-4b2a-9e4c-6a8c0e2a4b6d";
const otherVariant = "4e6a8c0d-2b4f-4c6e-8a0c-2e4a6c8e0a2c";
const otherProduct = "8a0c2e4a-6c8e-4a2c-9e6a-0c2e4a6c8e0a";
const addressA = { name: "Ana", company: null, street1: "Main 1", street2: null, city: "Zagreb", state: null, postal_code: "10000", country: "HR", phone: null, email: "ana@example.test" };
const addressB = { ...addressA, street1: "Side 2" };

function productLine(id, variantId, quantity = 1) {
  return { type: "product", id, variant_id: variantId, quantity, form_submission_id: null, price: { package_id: ids.package, package_item_id: ids.packageItem, price_id: ids.price } };
}

function quoteLine(lineId, productId, variantId) {
  return { type: "product", line_item_id: lineId, product_id: productId, variant_id: variantId, quantity: 1, snapshot: { fulfillment: { type: "physical" } } };
}

function variant(id, productId, profile) {
  return {
    id,
    product_id: productId,
    sku: null,
    blocks: [],
    fulfillment: { type: "physical", shipping_profile_id: profile, inventory_requirements: [], backorder: { type: "disallow" } },
    tax_category_id: ids.paymentOption,
    status: { type: "active" },
    package_item_id: ids.packageItem,
    price: null,
  };
}

function store(createId = idFactories.createId) {
  return initialize(storefrontIdentity, { ...idFactories, createId, apiUrl, locale: "en", market: "hrv", sessionStorage: visitorStorage() });
}

test("eshop.cart gives one cart store per buyer and package, each with its own state", async (context) => {
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/carts") {
      return { type: "created", cart: cartRecord({ id: call.body.id, package_id: call.body.package_id, buyer: call.body.buyer }), recovery_token: `token-${call.body.id}` };
    }
    throw new Error(`Unexpected request ${call.path}`);
  });
  const arky = store(idSequence(factoryId(1), factoryId(2)));
  const retail = arky.eshop.cart({ buyer: customer, package_id: ids.package });
  const company = arky.eshop.cart({ buyer: { type: "company", company_id: ids.company, purchase_order_number: null }, package_id: ids.package });
  assert.equal(arky.eshop.cart({ package_id: ids.package }), retail);
  assert.notEqual(company, retail);
  assert.notEqual(arky.eshop.cart({ buyer: customer, package_id: ids.otherPackage }), retail);
  assert.deepEqual(retail.scope, { buyer: customer, package_id: ids.package });

  assert.equal((await retail.ensure()).id, factoryId(1));
  assert.equal((await company.ensure()).id, factoryId(2));
  assert.equal(retail.cart.get().id, factoryId(1));
  assert.equal(company.cart.get().buyer.type, "company");
  assert.equal((await retail.ensure()).id, factoryId(1));
  assert.deepEqual(calls.map((call) => [call.body.id, call.body.buyer.type]), [
    [factoryId(1), "customer"],
    [factoryId(2), "company"],
  ]);
});

test("ensure keeps its cart id across a lost answer and loads an existing cart first", async (context) => {
  let lose = true;
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/carts") {
      if (lose) {
        lose = false;
        throw new TypeError("Lost response");
      }
      return { type: "created", cart: cartRecord({ id: call.body.id }), recovery_token: "token" };
    }
    if (call.path === `/v1/storefront/carts/${factoryId(1)}`) return cartRecord({ id: factoryId(1) });
    throw new Error(`Unexpected request ${call.path}`);
  });
  const arky = store(idSequence(factoryId(1)));
  const cart = arky.eshop.cart({ buyer: customer, package_id: ids.package });
  await assert.rejects(cart.ensure(), /Lost response/);
  assert.equal((await cart.ensure()).id, factoryId(1));
  cart.reset();
  assert.equal(cart.cart.get(), null);
  assert.equal((await cart.ensure()).id, factoryId(1));
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["POST", "/v1/storefront/carts"],
    ["POST", "/v1/storefront/carts"],
    ["GET", `/v1/storefront/carts/${factoryId(1)}`],
  ]);
  assert.equal(calls[0].body.id, calls[1].body.id);
});

test("addProduct takes its line id from the factory when none is given", async (context) => {
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/carts") return { type: "created", cart: cartRecord(), recovery_token: "token" };
    return cartRecord({ updated_at: 1_700_000_000_002, line_items: [productLine(call.body.product.id, ids.variant)] });
  });
  const arky = store(idSequence(factoryId(5)));
  const cart = arky.eshop.cart({ buyer: customer, package_id: ids.package });
  await cart.create({ id: ids.cart });
  await cart.addProduct({ variant_id: ids.variant, quantity: 1, price: { package_id: ids.package, package_item_id: ids.packageItem, price_id: ids.price } });
  assert.equal(calls[1].body.product.id, factoryId(5));
  assert.equal(cart.item_count.get(), 1);
});

test("a cart write whose answer is lost drops the cart view, so ensure reads the cart again and the next write sends its current version", async (context) => {
  let server = cartRecord();
  let lose = true;
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/carts") return { type: "created", cart: server, recovery_token: "token" };
    if (call.method === "POST" && call.path === `/v1/storefront/carts/${ids.cart}/product-items`) {
      server = { ...server, updated_at: server.updated_at + 1, line_items: [productLine(call.body.product.id, ids.variant)] };
      if (lose) {
        lose = false;
        throw new TypeError("Lost response");
      }
      return server;
    }
    if (call.method === "GET" && call.path === `/v1/storefront/carts/${ids.cart}`) return server;
    if (call.method === "PUT" && call.path === `/v1/storefront/carts/${ids.cart}`) {
      if (call.body.expected_updated_at !== server.updated_at) return errorResponse(409, "GENERAL.CONFLICT", "The cart changed");
      server = { ...server, updated_at: server.updated_at + 1, line_items: [productLine(factoryId(1), ids.variant, 2)] };
      return server;
    }
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  const arky = store(idSequence(factoryId(1)));
  const scoped = arky.eshop.cart({ buyer: customer, package_id: ids.package });
  await scoped.create({ id: ids.cart });

  await assert.rejects(scoped.addProduct({ variant_id: ids.variant, quantity: 1, price: { package_id: ids.package, package_item_id: ids.packageItem, price_id: ids.price } }), /Lost response/);
  assert.equal(scoped.cart.get(), null);
  assert.equal(scoped.quote_result.get(), null);
  assert.equal(scoped.status.get().error.code, "network");

  const fresh = await scoped.ensure();
  assert.equal(fresh.updated_at, 1_700_000_000_002);
  assert.deepEqual(fresh.line_items.map((line) => line.id), [factoryId(1)]);
  await scoped.setProductQuantity({ line_item_id: factoryId(1), quantity: 2 });
  assert.equal(scoped.cart.get().updated_at, 1_700_000_000_003);
  assert.equal(scoped.item_count.get(), 2);

  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["POST", "/v1/storefront/carts"],
    ["POST", `/v1/storefront/carts/${ids.cart}/product-items`],
    ["GET", `/v1/storefront/carts/${ids.cart}`],
    ["PUT", `/v1/storefront/carts/${ids.cart}`],
  ]);
  assert.equal(calls[1].body.expected_updated_at, 1_700_000_000_001);
  assert.equal(calls[3].body.expected_updated_at, 1_700_000_000_002);
});

test("a write refused for a changed cart drops the view too, while a refused input keeps it", async (context) => {
  let answer = "invalid";
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/carts") return { type: "created", cart: cartRecord(), recovery_token: "token" };
    if (call.method === "PUT" && call.path === `/v1/storefront/carts/${ids.cart}`) {
      return answer === "invalid"
        ? errorResponse(400, "GENERAL.BAD_REQUEST", "Unknown promotion code")
        : errorResponse(409, "GENERAL.CONFLICT", "The cart changed");
    }
    if (call.method === "GET" && call.path === `/v1/storefront/carts/${ids.cart}`) return cartRecord({ updated_at: 1_700_000_000_005 });
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  const arky = store(idSequence());
  const scoped = arky.eshop.cart({ buyer: customer, package_id: ids.package });
  await scoped.create({ id: ids.cart });

  await assert.rejects(scoped.setPromotionCodes({ promotion_codes: ["NOPE"] }), /Unknown promotion code/);
  assert.deepEqual(scoped.status.get().error, { code: "GENERAL.BAD_REQUEST", message: "Unknown promotion code" });
  assert.equal(scoped.cart.get().updated_at, 1_700_000_000_001);
  assert.equal((await scoped.ensure()).updated_at, 1_700_000_000_001);

  answer = "conflict";
  await assert.rejects(scoped.setPromotionCodes({ promotion_codes: ["SAVE10"] }), /The cart changed/);
  assert.equal(scoped.cart.get(), null);
  assert.equal((await scoped.ensure()).updated_at, 1_700_000_000_005);
  assert.deepEqual(calls.map((call) => call.method), ["POST", "PUT", "PUT", "GET"]);
});

test("shipTo groups shipped lines by shipping profile and keeps a group's choice only for the same address", async (context) => {
  const lineA = ids.line;
  const lineB = ids.otherLine;
  let current = cartRecord({
    line_items: [productLine(lineA, ids.variant, 2), productLine(lineB, otherVariant)],
    delivery_groups: [
      {
        id: ids.thirdCart,
        items: [{ line_item: { type: "product", line_item_id: lineA }, quantity: 2 }],
        destination: { type: "delivery", address: addressA },
        shipping: { shipping_method_id: ids.paymentOption, rate_id: ids.otherPaymentOption },
        timing: { type: "asap" },
      },
    ],
  });
  const variantReads = [];
  const updates = [];
  recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/carts") return { type: "created", cart: current, recovery_token: "token" };
    if (call.path === `/v1/storefront/carts/${ids.cart}/quote`) {
      return quoteRecord({ ready: false, lines: [quoteLine(lineA, ids.product, ids.variant), quoteLine(lineB, otherProduct, otherVariant)] });
    }
    if (call.path.includes("/variants/")) {
      variantReads.push(call.path);
      assert.equal(call.query.package_id, ids.package);
      return call.path.endsWith(ids.variant) ? variant(ids.variant, ids.product, profileA) : variant(otherVariant, otherProduct, profileB);
    }
    if (call.method === "PUT" && call.path === `/v1/storefront/carts/${ids.cart}`) {
      updates.push(call.body);
      current = { ...current, updated_at: current.updated_at + 1, delivery_groups: call.body.delivery_groups };
      return current;
    }
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  const arky = store(idSequence(factoryId(1), factoryId(2)));
  const cart = arky.eshop.cart({ buyer: customer, package_id: ids.package });
  await cart.create({ id: ids.cart });

  await cart.shipTo({ destination: { type: "delivery", address: addressA } });
  assert.deepEqual(variantReads, [
    `/v1/storefront/products/${ids.product}/variants/${ids.variant}`,
    `/v1/storefront/products/${otherProduct}/variants/${otherVariant}`,
  ]);
  assert.deepEqual(updates[0].delivery_groups, [
    {
      id: ids.thirdCart,
      items: [{ line_item: { type: "product", line_item_id: lineA }, quantity: 2 }],
      destination: { type: "delivery", address: addressA },
      shipping: { shipping_method_id: ids.paymentOption, rate_id: ids.otherPaymentOption },
      timing: { type: "asap" },
    },
    {
      id: factoryId(1),
      items: [{ line_item: { type: "product", line_item_id: lineB }, quantity: 1 }],
      destination: { type: "delivery", address: addressA },
      shipping: null,
      timing: { type: "asap" },
    },
  ]);

  await cart.shipTo({ destination: { type: "delivery", address: addressB } });
  assert.deepEqual(updates[1].delivery_groups.map((group) => [group.id, group.shipping, group.destination.address.street1]), [
    [ids.thirdCart, null, "Side 2"],
    [factoryId(1), null, "Side 2"],
  ]);
  assert.equal(updates.length, 2);
});

test("the market changes while a scoped cart has items, each market keeps its own cart store, and a sign-out clears every scope", async (context) => {
  const carts = new Map();
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/carts") {
      assert.equal(call.body.market_id, ids.market);
      const created = cartRecord({ id: call.body.id, package_id: call.body.package_id, market_id: call.body.market_id, line_items: [productLine(ids.line, ids.variant)] });
      carts.set(created.id, created);
      return { type: "created", cart: created, recovery_token: `token-${created.id}` };
    }
    if (call.method === "GET" && carts.has(call.path.split("/").at(-1))) return carts.get(call.path.split("/").at(-1));
    if (call.path === "/v1/storefront/customer/logout") return new Response(null, { status: 204 });
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  const arky = store(idSequence(factoryId(1), factoryId(2)));
  const scope = { buyer: customer, package_id: ids.package };
  const croatia = arky.eshop.cart(scope);
  assert.equal((await croatia.ensure()).id, factoryId(1));
  assert.equal(croatia.item_count.get(), 1);
  arky.setContext({ market: "bih" });
  assert.equal(arky.getMarket(), "bih");
  assert.equal(croatia.cart.get(), null);
  const bosnia = arky.eshop.cart(scope);
  assert.notEqual(bosnia, croatia);
  assert.equal(arky.eshop.checkoutFlow(scope).cart, bosnia);
  assert.equal(arky.eshop.bookingCalendar(scope).scope, bosnia.scope);
  await assert.rejects(croatia.ensure(), (error) => error.code === "context_changed");
  await assert.rejects(croatia.pendingCheckout(), (error) => error.code === "context_changed");
  assert.equal((await bosnia.ensure()).id, factoryId(2));
  arky.setContext({ market: "hrv" });
  assert.equal(arky.eshop.cart(scope), croatia);
  assert.equal((await croatia.ensure()).id, factoryId(1));
  assert.equal(croatia.item_count.get(), 1);
  await arky.customer.logout();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(croatia.cart.get(), null);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.headers.get("x-arky-market")]), [
    ["POST", "/v1/storefront/carts", "hrv"],
    ["POST", "/v1/storefront/carts", "bih"],
    ["GET", `/v1/storefront/carts/${factoryId(1)}`, "hrv"],
    ["POST", "/v1/storefront/customer/logout", "hrv"],
  ]);
});

test("the cart store of a scope is the one its checkout flow and booking calendar use, so every view sees the same cart", async (context) => {
  recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/carts") return { type: "created", cart: cartRecord({ id: call.body.id }), recovery_token: "token" };
    if (call.path === `/v1/storefront/carts/${factoryId(1)}/product-items`) {
      return cartRecord({ id: factoryId(1), updated_at: 1_700_000_000_002, line_items: [productLine(call.body.product.id, ids.variant)] });
    }
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  const arky = store(idSequence(factoryId(1), factoryId(2)));
  const scope = { buyer: customer, package_id: ids.package };
  const cart = arky.eshop.cart(scope);
  const checkout = arky.eshop.checkoutFlow(scope);
  const calendar = arky.eshop.bookingCalendar(scope);
  assert.equal(checkout.cart, cart);
  assert.equal(calendar.scope, cart.scope);
  assert.equal(arky.eshop.cart({ buyer: customer, package_id: ids.package }), cart);
  await cart.ensure();
  await cart.addProduct({ variant_id: ids.variant, quantity: 1, price: { package_id: ids.package, package_item_id: ids.packageItem, price_id: ids.price } });
  assert.equal(checkout.state.get().cart.line_items.length, 1);
  assert.equal(checkout.cart.item_count.get(), 1);
  assert.equal("carts" in arky.eshop, false);
});

test("a signed-in shopper's token refresh during a cart write keeps the cart view and finishes the write", async (context) => {
  const refreshedAccess = `customer_access_${"n".repeat(64)}`;
  let server = cartRecord();
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/refresh") {
      return sessionResult(ids.customer, emailSession(ids.customer, ids.otherSession, { access_token: refreshedAccess }));
    }
    if (call.path === "/v1/storefront/carts") return { type: "created", cart: server, recovery_token: "token" };
    if (call.path === `/v1/storefront/carts/${ids.cart}/product-items`) {
      if (call.headers.get("authorization") !== `Bearer ${refreshedAccess}`) return errorResponse(401, "GENERAL.UNAUTHENTICATED", "The access token expired");
      server = { ...server, updated_at: server.updated_at + 1, line_items: [productLine(call.body.product.id, ids.variant)] };
      return server;
    }
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  const arky = initialize(storefrontIdentity, { ...idFactories, createId: idSequence(factoryId(1)), apiUrl, locale: "en", market: "hrv", sessionStorage: signedInStorage() });
  const scoped = arky.eshop.cart({ buyer: customer, package_id: ids.package });
  await scoped.create({ id: ids.cart });
  const written = await scoped.addProduct({ variant_id: ids.variant, quantity: 1, price: { package_id: ids.package, package_item_id: ids.packageItem, price_id: ids.price } });
  assert.deepEqual(written.line_items.map((line) => line.id), [factoryId(1)]);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(arky.client.session.id, ids.otherSession);
  assert.equal(scoped.cart.get().id, ids.cart);
  assert.equal(scoped.item_count.get(), 1);
  assert.equal(scoped.status.get().error, null);
  assert.deepEqual(calls.map((call) => call.path), [
    "/v1/storefront/carts",
    `/v1/storefront/carts/${ids.cart}/product-items`,
    "/v1/storefront/customer/refresh",
    `/v1/storefront/carts/${ids.cart}/product-items`,
  ]);
});

test("after_logout_another_customer_gets_a_new_cart", async (context) => {
  const durable = new MemoryStorage();
  installGlobal(context, "window", globalThis);
  installGlobal(context, "localStorage", durable);
  installGlobal(context, "navigator", { locks: new ExclusiveLockManager() });
  const nextShopper = { customer_id: ids.otherCustomer, session_id: ids.otherSession };
  const nextToken = `customer_visitor_${"b".repeat(64)}`;
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/logout") return new Response(null, { status: 204 });
    if (call.path === "/v1/storefront/customer/identify") {
      return sessionResult(call.body.customer_id, visitorSession(call.body.customer_id, call.body.session_id, nextToken));
    }
    if (call.path === "/v1/storefront/carts/accept") throw new TypeError("Lost response");
    if (call.method === "POST" && call.path === "/v1/storefront/carts") {
      const owner = call.headers.get("authorization") === `Bearer ${nextToken}` ? ids.otherCustomer : ids.customer;
      return { type: "created", cart: cartRecord({ id: call.body.id, customer_id: owner }), recovery_token: `token-${call.body.id}` };
    }
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  const arky = initialize(storefrontIdentity, {
    ...idFactories,
    createVisitorIdentity: () => nextShopper,
    createId: idSequence(ids.cart, ids.otherCart),
    apiUrl,
    locale: "en",
    market: "hrv",
    sessionStorage: visitorStorage(),
  });
  const cart = arky.eshop.cart({ buyer: customer, package_id: ids.package });
  assert.equal((await cart.create()).id, ids.cart);
  const request = checkoutRequest({ cart_id: ids.cart });
  await arky.client.eshop.cart.retainCheckout({ ...request, scope: cart.scope });
  await assert.rejects(arky.client.eshop.cart.recoverCheckout({ scope: cart.scope }), /Lost response/);
  const keptKeys = [...durable.values.keys()].filter((key) => key.startsWith("arky:cart-checkout:v5:"));
  assert.equal(keptKeys.length, 1);
  assert.ok(keptKeys[0].includes(encodeURIComponent(ids.customer)));
  const kept = durable.getItem(keptKeys[0]);
  assert.deepEqual(await cart.pendingCheckout(), request);

  assert.deepEqual(await arky.customer.logout(), { type: "revoked", session_id: ids.session });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(cart.cart.get(), null);
  const fresh = await cart.ensure();
  assert.equal(fresh.id, ids.otherCart);
  assert.equal(fresh.customer_id, ids.otherCustomer);
  assert.equal(await cart.pendingCheckout(), null);
  assert.equal(await arky.client.eshop.cart.pendingCheckout({ scope: cart.scope }), null);
  assert.equal(durable.getItem(keptKeys[0]), kept);
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["POST", "/v1/storefront/carts"],
    ["POST", "/v1/storefront/carts/accept"],
    ["POST", "/v1/storefront/customer/logout"],
    ["POST", "/v1/storefront/customer/identify"],
    ["POST", "/v1/storefront/carts"],
  ]);
});
