import assert from "node:assert/strict";
import test from "node:test";

import { initialize } from "../dist/storefront.js";
import {
  apiUrl,
  cartRecord,
  errorResponse,
  factoryId,
  ids,
  idFactories,
  idSequence,
  publishableKey,
  quoteRecord,
  recordFetch,
  visitorStorage,
} from "./helpers/arky-fixtures.mjs";

const customer = { type: "customer" };
const profileA = "1b3d5f7a-9c2e-4a6b-8d0f-2e4a6c8e0b1d";
const profileB = "7c9e1a3b-5d7f-4b2a-9e4c-6a8c0e2a4b6d";
const otherVariant = "4e6a8c0d-2b4f-4c6e-8a0c-2e4a6c8e0a2c";
const otherProduct = "8a0c2e4a-6c8e-4a2c-9e6a-0c2e4a6c8e0a";
const addressA = { name: "Ana", company: null, street1: "Main 1", street2: null, city: "Zagreb", state: null, postal_code: "10000", country: "HR", phone: null, email: "ana@example.test" };
const addressB = { ...addressA, street1: "Side 2" };

function productLine(id, variantId, quantity = 1) {
  return { type: "product", id, variant_id: variantId, quantity, form_submission_id: null, price_override: null, purchase: { type: "catalog" } };
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
    options: [],
    fulfillment: { type: "physical", shipping_profile_id: profile, inventory_requirements: [], backorder: { type: "disallow" } },
    tax_category_id: ids.paymentOption,
    status: { type: "active" },
    price: null,
  };
}

function store(createId = idFactories.createId) {
  return initialize(publishableKey, { ...idFactories, createId, apiUrl, locale: "en", market: "hrv", sessionStorage: visitorStorage() });
}

test("carts.for gives one cart store per buyer and catalog, each with its own state", async (context) => {
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/carts") {
      return { type: "created", cart: cartRecord({ id: call.body.id, catalog_id: call.body.catalog_id, buyer: call.body.buyer }), recovery_token: `token-${call.body.id}` };
    }
    throw new Error(`Unexpected request ${call.path}`);
  });
  const arky = store(idSequence(factoryId(1), factoryId(2)));
  const retail = arky.eshop.carts.for({ buyer: customer, catalog_id: ids.catalog });
  const company = arky.eshop.carts.for({ buyer: { type: "company", company_id: ids.company, purchase_order_number: null }, catalog_id: ids.catalog });
  assert.equal(arky.eshop.carts.for({ catalog_id: ids.catalog }), retail);
  assert.notEqual(company, retail);
  assert.notEqual(arky.eshop.carts.for({ buyer: customer, catalog_id: ids.otherCatalog }), retail);
  assert.deepEqual(retail.scope, { buyer: customer, catalog_id: ids.catalog });

  assert.equal((await retail.ensure()).id, factoryId(1));
  assert.equal((await company.ensure()).id, factoryId(2));
  assert.equal(retail.cart.get().id, factoryId(1));
  assert.equal(company.cart.get().buyer.type, "company");
  assert.equal((await retail.ensure()).id, factoryId(1));
  await assert.rejects(retail.load({ buyer: customer, catalog_id: ids.otherCatalog }), /another buyer or catalog/);
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
  await assert.rejects(arky.eshop.cart.ensure({ buyer: customer, catalog_id: ids.catalog }), /Lost response/);
  assert.equal((await arky.eshop.cart.ensure()).id, factoryId(1));
  arky.eshop.cart.clearLocal();
  assert.equal((await arky.eshop.cart.ensure()).id, factoryId(1));
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
  await arky.eshop.cart.create({ id: ids.cart, buyer: customer, catalog_id: ids.catalog });
  await arky.eshop.cart.addProduct({ variant_id: ids.variant, quantity: 1, purchase: { type: "catalog" } });
  assert.equal(calls[1].body.product.id, factoryId(5));
  assert.equal(arky.eshop.cart.item_count.get(), 1);
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
  const scoped = arky.eshop.carts.for({ buyer: customer, catalog_id: ids.catalog });
  await scoped.create({ id: ids.cart });

  await assert.rejects(scoped.addProduct({ variant_id: ids.variant, quantity: 1, purchase: { type: "catalog" } }), /Lost response/);
  assert.equal(scoped.cart.get(), null);
  assert.equal(scoped.quote_result.get(), null);
  assert.ok(scoped.status.get().error);

  const fresh = await scoped.ensure();
  assert.equal(fresh.updated_at, 1_700_000_000_002);
  assert.deepEqual(fresh.line_items.map((line) => line.id), [factoryId(1)]);
  await scoped.setProductQuantity(factoryId(1), 2);
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
  const scoped = arky.eshop.carts.for({ buyer: customer, catalog_id: ids.catalog });
  await scoped.create({ id: ids.cart });

  await assert.rejects(scoped.setPromotionCodes(["NOPE"]), /Unknown promotion code/);
  assert.equal(scoped.cart.get().updated_at, 1_700_000_000_001);
  assert.equal((await scoped.ensure()).updated_at, 1_700_000_000_001);

  answer = "conflict";
  await assert.rejects(scoped.setPromotionCodes(["SAVE10"]), /The cart changed/);
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
      assert.equal(call.query.catalog_id, ids.catalog);
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
  await arky.eshop.cart.create({ id: ids.cart, buyer: customer, catalog_id: ids.catalog });

  await arky.eshop.cart.shipTo({ type: "delivery", address: addressA });
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

  await arky.eshop.cart.shipTo({ type: "delivery", address: addressB });
  assert.deepEqual(updates[1].delivery_groups.map((group) => [group.id, group.shipping, group.destination.address.street1]), [
    [ids.thirdCart, null, "Side 2"],
    [factoryId(1), null, "Side 2"],
  ]);
  assert.equal(updates.length, 2);
});

test("a scoped cart with items locks the market, and a sign-out clears every scope", async (context) => {
  recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/carts") return { type: "created", cart: cartRecord({ id: call.body.id, line_items: [productLine(ids.line, ids.variant)] }), recovery_token: "token" };
    if (call.path === "/v1/storefront/customer/logout") return new Response(null, { status: 204 });
    throw new Error(`Unexpected request ${call.path}`);
  });
  const arky = store(idSequence(factoryId(1)));
  const scoped = arky.eshop.carts.for({ buyer: customer, catalog_id: ids.catalog });
  await scoped.ensure();
  assert.throws(() => arky.setMarket("bih"), /can't change while the cart has items/);
  await arky.customer.logout();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(scoped.cart.get(), null);
  assert.doesNotThrow(() => arky.setMarket("bih"));
});
