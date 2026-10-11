import assert from "node:assert/strict";
import test from "node:test";
import { cartCustomerGroupItems, createAdmin, createCartController, CartPresentationChangedError } from "../dist/index.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import {
  apiUrl,
  cartRecord,
  checkoutRequest,
  ids,
  placedAcceptance,
  placedOrder,
  publishableKey,
  quoteRecord,
  recordFetch,
  visitorStorage,
  visitorToken,
} from "./helpers/arky-fixtures.mjs";

const STORE_ID = ids.store;
const OTHER_STORE_ID = ids.otherStore;
const groupLineId = ids.otherLine;
const groupSelection = { id: groupLineId, customer_group_id: ids.product, start: { type: "on_acceptance" }, deliveries: [] };
const companyBuyer = { type: "company_location", company_location_id: ids.companyLocation, purchase_order_number: "PO-7" };

function admin() {
  return createAdmin({ baseUrl: apiUrl, apiToken: "arky_api_cart" });
}

function storefront(options = {}) {
  return createStorefront(publishableKey, { apiUrl, locale: "bs", market: "bih", sessionStorage: visitorStorage(), ...options });
}

test("Admin Cart commands send exactly the caller's ids, buyer, channel and catalog without inventing defaults", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "POST" && call.path.endsWith("/carts")
    ? { type: "created", cart: cartRecord({ buyer: companyBuyer }), recovery_token: "cart-recovery-token" }
    : call.method === "GET" ? { items: [], cursor: null } : cartRecord());
  const create = {
    id: ids.cart,
    customer_id: ids.customer,
    buyer: companyBuyer,
    sales_channel_id: ids.channel,
    catalog: { type: "catalog", catalog_id: ids.catalog },
  };
  const created = await admin().eshop.cart.create({ store_id: STORE_ID, ...create });
  assert.equal(created.type, "created");
  assert.deepEqual(calls[0].body, create);
  assert.equal(calls[0].path, `/v1/stores/${STORE_ID}/carts`);
  await admin().eshop.cart.create({ store_id: STORE_ID, ...create, catalog: { type: "market_public", market_id: ids.market } });
  assert.deepEqual(calls[1].body.catalog, { type: "market_public", market_id: ids.market });
  const patch = { expected_updated_at: 5, billing_address: null, buyer: { type: "customer" } };
  await admin().eshop.cart.update({ store_id: STORE_ID, id: "cart/one", ...patch });
  assert.deepEqual(calls[2].body, patch);
  assert.equal(calls[2].method, "PUT");
  assert.equal(calls[2].path, `/v1/stores/${STORE_ID}/carts/cart%2Fone`);
  await admin().eshop.cart.addCustomerGroup({ store_id: STORE_ID, id: ids.cart, expected_updated_at: 6, customer_group: groupSelection });
  assert.deepEqual(calls[3].body, { expected_updated_at: 6, customer_group: groupSelection });
  assert.equal(calls[3].path, `/v1/stores/${STORE_ID}/carts/${ids.cart}/customer-group-items`);
  assert.equal("addSubscriptionPlan" in admin().eshop.cart, false);
  await admin().eshop.cart.find({ store_id: OTHER_STORE_ID, statuses: ["active"], origins: ["account"] });
  assert.equal(calls[4].path, `/v1/stores/${OTHER_STORE_ID}/carts`);
  assert.deepEqual(JSON.parse(calls[4].query.statuses), ["active"]);
  assert.deepEqual(JSON.parse(calls[4].query.origins), ["account"]);
  assert.equal("setStoreId" in admin(), false);
  for (const operation of [
    () => admin().eshop.cart.create({ store_id: STORE_ID, ...create, id: undefined }),
    () => admin().eshop.cart.create({ store_id: STORE_ID, ...create, id: "cart-one" }),
    () => admin().eshop.cart.create({ store_id: "store-one", ...create }),
    () => admin().eshop.cart.addCustomerGroup({ store_id: STORE_ID, id: ids.cart, expected_updated_at: 6, customer_group: { ...groupSelection, id: "group-line" } }),
    () => admin().eshop.cart.addProduct({ store_id: STORE_ID, id: ids.cart, expected_updated_at: 6, product: { product_id: ids.product, variant_id: ids.variant, quantity: 1, purchase: { type: "catalog" } } }),
    () => admin().eshop.cart.addBooking({ store_id: STORE_ID, id: ids.cart, expected_updated_at: 6, booking: { id: "booking-line", booking_offering_id: ids.product, requested_interval: { from: 1, to: 2 }, capacity_units: 1 } }),
  ]) await assert.rejects(async () => operation(), TypeError);
  assert.equal(calls.length, 5);
});

test("Admin carts are created for a customer, a company, a company location or a location choice exactly as given", async (context) => {
  const buyers = [
    { type: "customer" },
    { type: "company", company_id: ids.company, purchase_order_number: null },
    { type: "company_location", company_location_id: ids.companyLocation, purchase_order_number: "PO-7" },
    { type: "company_location_selection", company_id: ids.company, purchase_order_number: null },
  ];
  const calls = recordFetch(context, (call) => ({ type: "created", cart: cartRecord({ buyer: call.body.buyer }), recovery_token: "cart-recovery-token" }));
  for (const buyer of buyers) {
    const created = await admin().eshop.cart.create({ store_id: STORE_ID, id: ids.cart, customer_id: ids.customer, buyer, sales_channel_id: ids.channel, catalog: { type: "catalog", catalog_id: ids.catalog } });
    assert.deepEqual(created.cart.buyer, buyer);
  }
  assert.deepEqual(calls.map((call) => call.body.buyer), buyers);
  assert.ok(calls.every((call) => call.body.sales_channel_id === ids.channel && call.path === `/v1/stores/${STORE_ID}/carts`));
});

test("a storefront location-choice cart is created for the company and then picks one of its locations with the cart version", async (context) => {
  const choice = { type: "company_location_selection", company_id: ids.company, purchase_order_number: null };
  const picked = { type: "company_location", company_location_id: ids.companyLocation, purchase_order_number: "PO-9" };
  const calls = recordFetch(context, (call) => call.method === "POST"
    ? { type: "created", cart: cartRecord({ buyer: choice }), recovery_token: "cart-recovery-token" }
    : cartRecord({ buyer: picked, updated_at: 1_700_000_000_002 }));
  const client = storefront();
  await client.eshop.cart.create({ id: ids.cart, buyer: choice, catalog_id: null });
  assert.deepEqual((await client.eshop.cart.update({ id: ids.cart, expected_updated_at: 1_700_000_000_001, buyer: picked })).buyer, picked);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", "/v1/storefront/carts", { id: ids.cart, buyer: choice, catalog_id: null }],
    ["PUT", `/v1/storefront/carts/${ids.cart}`, { expected_updated_at: 1_700_000_000_001, buyer: picked }],
  ]);
  assert.equal(calls[1].headers.get("x-arky-cart-token"), "cart-recovery-token");
  for (const call of calls) assert.equal(call.headers.has("x-arky-sales-channel"), false);
});

test("Admin quotes carry only the language the caller names; the client has no configured language", async (context) => {
  const calls = recordFetch(context, () => quoteRecord());
  const client = createAdmin({ baseUrl: apiUrl, apiToken: "arky_api_cart", locale: "bs" });
  assert.deepEqual(await client.eshop.cart.quote({ store_id: STORE_ID, id: ids.cart, language: "en" }), quoteRecord());
  assert.deepEqual(calls[0].body, { language: "en" });
  assert.equal(calls[0].path, `/v1/stores/${STORE_ID}/carts/${ids.cart}/quote`);
  await client.eshop.cart.quote({ store_id: STORE_ID, id: ids.cart });
  assert.deepEqual(calls[1].body, {});
  const purchase = {
    language: "bs",
    customer_id: ids.customer,
    buyer: { type: "customer" },
    sales_channel_id: ids.channel,
    catalog: { type: "catalog", catalog_id: ids.catalog },
    line_items: [{ type: "customer_group", ...groupSelection }],
    delivery_groups: [],
    billing_address: null,
    promotion_codes: [],
  };
  await client.eshop.cart.quotePurchase({ store_id: STORE_ID, ...purchase });
  assert.deepEqual(calls[2].body, purchase);
  assert.equal(calls[2].path, `/v1/stores/${STORE_ID}/orders/quote`);
  await client.eshop.cart.quoteFutureDeliveries({ store_id: STORE_ID, id: ids.cart, language: "en", customer_groups: [] });
  assert.deepEqual(calls[3].body, { language: "en", customer_groups: [] });
  await client.eshop.cart.previewAccessProduct({ store_id: STORE_ID, id: ids.cart, language: "en", line_item_id: ids.line, variant_id: ids.variant, quantity: 1, purchase: { type: "catalog" } });
  assert.deepEqual(calls[4].body, { language: "en", line_item_id: ids.line, variant_id: ids.variant, quantity: 1, purchase: { type: "catalog" } });
  for (const call of calls) assert.equal(call.headers.has("x-arky-locale"), false);
});

test("Storefront cart updates may switch the catalog and never forward browser authority", async (context) => {
  const calls = recordFetch(context, () => cartRecord());
  await storefront().eshop.cart.update({
    id: ids.cart,
    expected_updated_at: 9,
    catalog: { type: "catalog", catalog_id: ids.otherCatalog },
    customer_id: ids.otherCustomer,
    store_id: OTHER_STORE_ID,
    sales_channel_id: ids.channel,
    origin: { type: "account" },
  });
  assert.equal(calls[0].path, `/v1/storefront/carts/${ids.cart}`);
  assert.equal(calls[0].method, "PUT");
  assert.deepEqual(calls[0].body, { expected_updated_at: 9, catalog: { type: "catalog", catalog_id: ids.otherCatalog } });
});

test("Cart discovery preserves combined predicates, ordering and empty-page continuation", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: "next-cart-page" }));
  const filters = {
    store_id: STORE_ID, customer_id: ids.customer, statuses: ["active", "abandoned"], origins: ["account", "storefront"],
    has_items: false, has_offer: true, sort_field: "updated_at", sort_direction: "asc", limit: 20,
  };
  const first = await admin().eshop.cart.find(filters);
  assert.deepEqual(first, { items: [], cursor: "next-cart-page" });
  await admin().eshop.cart.find({ ...filters, cursor: first.cursor });
  for (const call of calls) {
    assert.equal(call.path, `/v1/stores/${STORE_ID}/carts`);
    assert.equal("store_id" in call.query, false);
    assert.equal(call.method, "GET");
    assert.equal(call.query.customer_id, ids.customer);
    assert.equal(call.query.has_items, "false");
    assert.equal(call.query.has_offer, "true");
    assert.equal(call.query.sort_field, "updated_at");
    assert.equal(call.query.sort_direction, "asc");
    assert.equal(call.query.limit, "20");
    assert.deepEqual(JSON.parse(call.query.statuses), filters.statuses);
    assert.deepEqual(JSON.parse(call.query.origins), filters.origins);
  }
  assert.equal(calls[1].query.cursor, first.cursor);
  context.mock.method(globalThis, "fetch", async () => Response.json({ message: "Search unavailable", status_code: 503 }, { status: 503 }));
  await assert.rejects(admin().eshop.cart.find(filters), (error) => error.statusCode === 503);
});

test("storefront quote, delivery quote and access preview send no body language; the locale travels in X-Arky-Locale", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("/quote") ? quoteRecord({ language: "bs" }) : []);
  const client = storefront();
  await client.eshop.cart.quote({ id: ids.cart, language: "en" });
  await client.eshop.cart.quote({ id: ids.cart, token: "explicit-cart-token" });
  await client.eshop.cart.quoteFutureDeliveries({ id: ids.cart, language: "en", customer_groups: [{ cart_line_item_id: groupLineId, deliveries: [] }] });
  await client.eshop.cart.previewAccessProduct({ id: ids.cart, language: "en", line_item_id: ids.line, variant_id: ids.variant, quantity: 2, purchase: { type: "catalog" } });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", `/v1/storefront/carts/${ids.cart}/quote`, {}],
    ["POST", `/v1/storefront/carts/${ids.cart}/quote`, {}],
    ["POST", `/v1/storefront/carts/${ids.cart}/future-delivery-quote`, { customer_groups: [{ cart_line_item_id: groupLineId, deliveries: [] }] }],
    ["POST", `/v1/storefront/carts/${ids.cart}/access-product-preview`, { line_item_id: ids.line, variant_id: ids.variant, quantity: 2, purchase: { type: "catalog" } }],
  ]);
  for (const call of calls) {
    assert.equal(JSON.stringify(call.body).includes("language"), false);
    assert.equal(call.headers.get("x-arky-locale"), "bs");
  }
  assert.equal(calls[0].headers.get("x-arky-cart-token"), null);
  assert.equal(calls[1].headers.get("x-arky-cart-token"), "explicit-cart-token");
});

test("Storefront Cart lines carry their own ids and strip price overrides and other browser authority", async (context) => {
  const calls = recordFetch(context, () => cartRecord());
  const client = storefront();
  const override = { allow_promotions: true, currency: "bam", amount: 1, reason: "browser" };
  await client.eshop.cart.update({
    id: ids.cart, expected_updated_at: 3, customer_id: "spoof", store_id: "spoof", origin: { type: "account" },
    sales_channel_id: ids.channel,
    buyer: { type: "customer" },
    line_items: [
      { type: "product", id: ids.line, product_id: ids.product, variant_id: ids.variant, quantity: 2, price_override: override, purchase: { type: "catalog", spoof: true }, store_id: "spoof" },
      { type: "product", id: ids.otherLine, product_id: ids.product, variant_id: ids.variant, quantity: 1, price_override: override,
        purchase: { type: "existing_purchase_access", grant: { order_id: ids.order, order_purchase_access_line_item_id: ids.line, price: 0 } } },
      { type: "booking", id: ids.credit, booking_offering_id: ids.product, requested_interval: { from: 0, to: 60000, timezone: "spoof" }, capacity_units: 1, price_override: override },
      { type: "customer_group", ...groupSelection, id: ids.submission, price_override: override },
    ],
  });
  assert.deepEqual(calls[0].body, {
    expected_updated_at: 3,
    buyer: { type: "customer" },
    line_items: [
      { type: "product", id: ids.line, product_id: ids.product, variant_id: ids.variant, quantity: 2, purchase: { type: "catalog" } },
      { type: "product", id: ids.otherLine, product_id: ids.product, variant_id: ids.variant, quantity: 1,
        purchase: { type: "existing_purchase_access", grant: { order_id: ids.order, order_purchase_access_line_item_id: ids.line } } },
      { type: "booking", id: ids.credit, booking_offering_id: ids.product, requested_interval: { from: 0, to: 60000 }, capacity_units: 1 },
      { type: "customer_group", ...groupSelection, id: ids.submission },
    ],
  });
  const before = calls.length;
  const product = { type: "product", id: ids.line, product_id: ids.product, variant_id: ids.variant, quantity: 1 };
  await assert.rejects(client.eshop.cart.update({ id: ids.cart, expected_updated_at: 3, line_items: [product] }));
  await assert.rejects(client.eshop.cart.update({ id: ids.cart, expected_updated_at: 3, line_items: [{ ...product, purchase: { type: "browser_grant" } }] }), /explicit supported purchase route/);
  await assert.rejects(client.eshop.cart.update({ id: ids.cart, expected_updated_at: 3, line_items: [{ ...product, id: "line-1", purchase: { type: "catalog" } }] }), TypeError);
  await assert.rejects(client.eshop.cart.update({ id: ids.cart, expected_updated_at: 3, line_items: [{ ...product, type: "digital_product", purchase: { type: "catalog" } }] }), /product, a booking or a customer group/);
  assert.equal(calls.length, before);
  await client.eshop.cart.addCustomerGroup({ id: "cart/one", expected_updated_at: 4, customer_group: { ...groupSelection, price_override: override, store_id: "spoof" } });
  assert.equal(calls[1].path, "/v1/storefront/carts/cart%2Fone/customer-group-items");
  assert.deepEqual(calls[1].body, { expected_updated_at: 4, customer_group: groupSelection });
  await assert.rejects(client.eshop.cart.addCustomerGroup({ id: ids.cart, expected_updated_at: 4, customer_group: { ...groupSelection, id: "group-line" } }), TypeError);
  assert.equal(calls.length, 2);
  assert.equal("addSubscriptionPlan" in client.eshop.cart, false);
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
    assert.equal(call.headers.get("x-arky-market"), "bih");
    assert.equal(call.headers.has("x-arky-sales-channel"), false);
    assert.equal(call.headers.get("x-arky-locale"), "bs");
  }
});

test("checkout: Admin names the order language and the storefront does not; a changed quote is typed for the storefront and coded for Admin", async (context) => {
  const calls = recordFetch(context, () => Response.json({ message: "Review the changed quote", error: "COMMERCE.PRESENTATION_CHANGED", status_code: 409, validation_errors: [], quote: quoteRecord() }, { status: 409 }));
  const request = checkoutRequest();
  await assert.rejects(admin().eshop.cart.checkout({ store_id: STORE_ID, ...request, language: "bs" }), (error) => {
    assert.equal(error.name, "ApiError");
    assert.equal(error.statusCode, 409);
    assert.equal(error.code, "COMMERCE.PRESENTATION_CHANGED");
    assert.deepEqual(error.response.quote, quoteRecord());
    return true;
  });
  await assert.rejects(storefront().eshop.cart.checkout(request), (error) => {
    assert.ok(error instanceof CartPresentationChangedError);
    assert.deepEqual(error.quote, quoteRecord());
    return true;
  });
  assert.deepEqual(calls.map((call) => call.path), [`/v1/stores/${STORE_ID}/carts/accept`, "/v1/storefront/carts/accept"]);
  assert.deepEqual(calls.map((call) => call.body), [{ ...request, language: "bs" }, request]);
  await assert.rejects(async () => admin().eshop.cart.checkout({ store_id: STORE_ID, ...request, language: "bs", order_id: "order-1" }), TypeError);
  assert.equal(calls.length, 2);
});

test("initialize quotes and checks out a group-only cart through the reviewed quote and keeps the cart when asked", async (context) => {
  const current = cartRecord({ line_items: [{ type: "customer_group", ...groupSelection, price_override: null }] });
  let quoted = quoteRecord({ ready: false });
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/carts") return { type: "created", cart: current, recovery_token: "cart-recovery-token" };
    if (call.path.endsWith("/quote")) return quoted;
    if (call.path.endsWith("/carts/accept")) return placedAcceptance();
    if (call.method === "GET") return placedOrder();
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  const store = initialize(publishableKey, { apiUrl, locale: "bs", market: "bih", sessionStorage: visitorStorage() });
  await store.eshop.cart.create({ id: ids.cart, buyer: { type: "customer" }, catalog_id: null });
  assert.equal(store.eshop.cart.item_count.get(), 1);
  const { type: _type, ...groupItem } = current.line_items[0];
  assert.deepEqual(store.eshop.cart.customer_group_items.get(), [groupItem]);
  assert.deepEqual(cartCustomerGroupItems(current), [groupItem]);
  assert.deepEqual(store.eshop.cart.product_items.get(), []);
  const payment = { type: "free" };
  await assert.rejects(store.eshop.cart.checkout({ order_id: ids.order, contact_email: null, payment }), /Quote the cart before checkout/);
  await store.eshop.cart.quote();
  await assert.rejects(store.eshop.cart.checkout({ order_id: ids.order, contact_email: null, payment }), /quote isn't ready/);
  quoted = quoteRecord();
  assert.deepEqual(await store.eshop.cart.quote(), quoteRecord());
  assert.deepEqual(await store.eshop.cart.checkout({ order_id: ids.order, contact_email: null, payment, clear_after_checkout: false }), placedAcceptance());
  const accept = calls.find((call) => call.path.endsWith("/carts/accept"));
  assert.deepEqual(accept.body, {
    order_id: ids.order,
    cart_id: ids.cart,
    expected_updated_at: current.updated_at,
    presentation_digest: quoteRecord().presentation_digest,
    contact_email: null,
    payment,
  });
  assert.equal(accept.headers.get("x-arky-cart-token"), "cart-recovery-token");
  assert.equal(calls.filter((call) => call.path.endsWith("/quote")).every((call) => call.headers.get("x-arky-locale") === "bs" && JSON.stringify(call.body) === "{}"), true);
  assert.equal(calls.at(-1).path, `/v1/storefront/orders/${ids.order}`);
  assert.deepEqual(store.eshop.cart.cart.get(), current);
  const lastOrder = store.eshop.cart.last_order.get();
  assert.equal(lastOrder.order_id, ids.order);
  assert.equal(lastOrder.cart_id, ids.cart);
  assert.equal(lastOrder.total, quoteRecord().totals.total);
  assert.equal(lastOrder.currency, "eur");
});

test("Admin and storefront future delivery choices are quoted and saved with the explicit version", async (context) => {
  const choice = { id: ids.credit, entitlement_ids: [ids.variant], destination: { type: "pickup", store_location_id: ids.companyLocation } };
  const groups = [{ cart_line_item_id: groupLineId, deliveries: [choice] }];
  const saved = [{ cart_line_item_id: groupLineId, deliveries: [{ ...choice, shipping: null }] }];
  const offers = [{ cart_line_item_id: groupLineId, occurrence: { type: "permanent", starts_at: 1 }, deliveries: [] }];
  const calls = recordFetch(context, (call) => call.method === "POST" ? offers : cartRecord());
  await admin().eshop.cart.quoteFutureDeliveries({ store_id: STORE_ID, id: "cart/one", language: "bs", customer_groups: groups });
  await admin().eshop.cart.setFutureDeliveries({ store_id: STORE_ID, id: "cart/one", expected_updated_at: 4, customer_groups: saved });
  const client = storefront();
  assert.deepEqual(await client.eshop.cart.quoteFutureDeliveries({ id: "cart/one", store_id: "spoof", customer_groups: groups }), offers);
  await client.eshop.cart.setFutureDeliveries({ id: "cart/one", store_id: "spoof", expected_updated_at: 4, customer_groups: saved });
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["POST", `/v1/stores/${STORE_ID}/carts/cart%2Fone/future-delivery-quote`],
    ["PUT", `/v1/stores/${STORE_ID}/carts/cart%2Fone/future-deliveries`],
    ["POST", "/v1/storefront/carts/cart%2Fone/future-delivery-quote"],
    ["PUT", "/v1/storefront/carts/cart%2Fone/future-deliveries"],
  ]);
  assert.deepEqual(calls.map((call) => call.body), [
    { language: "bs", customer_groups: groups },
    { expected_updated_at: 4, customer_groups: saved },
    { customer_groups: groups },
    { expected_updated_at: 4, customer_groups: saved },
  ]);
  assert.equal(calls[2].headers.get("x-arky-locale"), "bs");
});

test("initialize saves future deliveries into the loaded cart and drops its stale quote", async (context) => {
  const updated = cartRecord({ updated_at: 1_700_000_000_009 });
  const groups = [{ cart_line_item_id: groupLineId, deliveries: [] }];
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/carts") return { type: "created", cart: cartRecord(), recovery_token: "token" };
    if (call.path.endsWith("/quote")) return quoteRecord();
    return updated;
  });
  const store = initialize(publishableKey, { apiUrl, locale: "bs", sessionStorage: visitorStorage() });
  await store.eshop.cart.create({ id: ids.cart, buyer: { type: "customer" }, catalog_id: null });
  await store.eshop.cart.quote();
  assert.notEqual(store.eshop.cart.quote_result.get(), null);
  assert.deepEqual(await store.eshop.cart.setFutureDeliveries(groups), updated);
  assert.deepEqual(store.eshop.cart.cart.get(), updated);
  assert.equal(store.eshop.cart.quote_result.get(), null);
  assert.deepEqual(calls.at(-1).body, { expected_updated_at: cartRecord().updated_at, customer_groups: groups });
});

test("initialize refuses a late quote after the language changed and a late delivery quote after the market changed", async (context) => {
  let release;
  let started;
  let pending = new Promise((resolve) => { release = resolve; });
  let entered = new Promise((resolve) => { started = resolve; });
  recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/carts") return { type: "created", cart: cartRecord(), recovery_token: "token" };
    if (call.path === "/v1/storefront/markets/by-key/ita") return { id: ids.market, key: "ita", currency: "eur", tax_mode: "inclusive", payment_option_ids: [] };
    started();
    return pending;
  });
  const store = initialize(publishableKey, { apiUrl, locale: "bs", market: "bih", sessionStorage: visitorStorage() });
  await store.eshop.cart.create({ id: ids.cart, buyer: { type: "customer" }, catalog_id: null });
  const quote = store.eshop.cart.quote();
  await entered;
  store.setLocale("en");
  release(Response.json(quoteRecord({ language: "bs" })));
  await assert.rejects(quote, /language changed while quoting/);
  assert.equal(store.eshop.cart.quote_result.get(), null);
  pending = new Promise((resolve) => { release = resolve; });
  entered = new Promise((resolve) => { started = resolve; });
  const deliveries = store.eshop.cart.quoteFutureDeliveries([]);
  await entered;
  store.setMarket("ita");
  release(Response.json([]));
  await assert.rejects(deliveries, /context changed during the cart operation/);
  assert.equal(store.eshop.cart.cart.get(), null);
});

test("Cart controller fills the loaded cart's id and version and never quotes implicitly", async () => {
  const calls = [];
  const current = cartRecord();
  const controller = createCartController({
    current: async (params) => { calls.push(["current", params]); return current; },
    addCustomerGroup: async (input) => { calls.push(["add", input]); return current; },
    quote: async () => { throw new Error("Must not quote implicitly"); },
    checkout: async (input) => { calls.push(["checkout", input]); return placedAcceptance(); },
  });
  await controller.init({ buyer: { type: "customer" }, catalog_id: null });
  await controller.addCustomerGroup({ customer_group: groupSelection });
  const reviewed = { order_id: ids.order, presentation_digest: "d".repeat(64), contact_email: null, payment: { type: "free" } };
  await controller.checkout(reviewed);
  assert.deepEqual(calls, [
    ["current", { buyer: { type: "customer" }, catalog_id: null }],
    ["add", { customer_group: groupSelection, id: ids.cart, expected_updated_at: current.updated_at }],
    ["checkout", { ...reviewed, cart_id: ids.cart, expected_updated_at: current.updated_at }],
  ]);
  assert.deepEqual(controller.getState().checkoutResult, placedAcceptance());
  const empty = createCartController({ current: async () => null });
  await empty.init({});
  await assert.rejects(empty.addCustomerGroup({ customer_group: groupSelection }), /no cart id was provided/);
  await assert.rejects(empty.addCustomerGroup({ id: ids.cart, customer_group: groupSelection }), /updated_at of the cart/);
  assert.equal("addSubscriptionPlan" in controller, false);
});
