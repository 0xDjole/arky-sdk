import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { initialize } from "../dist/storefront.js";
import { storefrontSessionStorage } from "./helpers/storefront-session-storage.mjs";
import { checkoutSources } from "./helpers/checkout-sources.mjs";
import {
  ExclusiveLockManager,
  MemoryStorage,
} from "./helpers/durable-request-fixtures.mjs";

const apiUrl = "https://api.example.test";
const publishableKey = `arky_pk_${"a".repeat(42)}A`;
const cartId = "9f1b6e23-e2ea-4ab9-a1b7-eaaf550ddf41";
const secondId = "2b815d21-78be-431a-b49c-0d5d62c87823";
const originals = new Map(
  ["fetch", "window", "localStorage", "navigator"].map((name) => [
    name,
    Object.getOwnPropertyDescriptor(globalThis, name),
  ]),
);
afterEach(() => {
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});

function session(customerId = "customer-a") {
  return {
    customer: {
      id: customerId,
      status: { type: "active" },
      identities: [],
      classifications: [],
      created_at: 1,
      updated_at: 1,
    },
    session: {
      id: `session-${customerId}`,
      customer_id: customerId,
      type: "visitor",
      token: `customer_visitor_${(customerId === "customer-a" ? "a" : "b").repeat(64)}`,
      status: { type: "active" },
      expires_at: 1900000000000,
    },
  };
}

function cart(overrides = {}) {
  return {
    id: cartId,
    customer_id: "customer-a",
    company: null,
    market_id: "market-a",
    sales_channel_id: "channel-a",
    status: { type: "active" },
    origin: {
      type: "storefront",
      customer_id: "customer-a",
      customer_session_id: "session-customer-a",
    },
    line_items: [],
    delivery_groups: [],
    billing_address: null,
    promotion_code_ids: [],
    purchase_order_number: null,
    item_count: 0,
    last_action_at: 1,
    abandoned_at: null,
    created_at: 1,
    updated_at: 1,
    ...overrides,
  };
}

function setup(respond) {
  const storage = storefrontSessionStorage(
    JSON.stringify({ version: 2, ...session() }),
  );
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const call = {
      path: new URL(url).pathname,
      method: init.method,
      body: init.body ? JSON.parse(init.body) : null,
      headers: new Headers(init.headers),
    };
    calls.push(call);
    if (call.path.endsWith("/customer/identify"))
      return Response.json(session("customer-b"));
    if (call.path === "/v1/storefront")
      return Response.json({
        timezone: "UTC",
        languages: { default: "en", available: ["en", "de"] },
        commerce: { type: "ready", default_market_id: "market-a", default_sales_channel_id: "channel-a" },
        default_market: { id: "market-a", key: "market-a", currency: "eur", tax_mode: "exclusive", payment_provider_ids: [] },
        payment_providers: [],
        support: { email: null },
        readiness: { market: true, payment: false, commerce: true },
      });
    if (call.path === "/v1/storefront/markets/by-key/market-b")
      return Response.json({ id: "market-b", key: "market-b", currency: "usd", tax_mode: "exclusive", payment_provider_ids: [] });
    return respond(call);
  };
  const store = initialize(publishableKey, {
    apiUrl,
    locale: "en",
    market: "market-a",
    sessionStorage: storage,
  });
  return { store, storage, calls };
}

function gate() {
  let release;
  let enter;
  const waiting = new Promise((resolve) => {
    release = resolve;
  });
  const started = new Promise((resolve) => {
    enter = resolve;
  });
  return { release, enter, waiting, started };
}

test("Cart helper saves explicit delivery identities, rates and schedules without manufacturing another group", async () => {
  const group = {
    id: "8b79e7c7-7e98-4962-a245-7836a7774054",
    items: [{ line_item: { type: "product", line_item_id: "line-a" }, quantity: 1 }],
    destination: { type: "pickup", store_location_id: "location-a" },
    shipping_rate_id: "rate-a",
    quote_acceptance: null,
    scheduled_window: { from: 1800000000000, to: 1800003600000 },
  };
  let saved = cart({ line_items: [productLine], item_count: 1 });
  const { store, calls } = setup((call) => {
    if (call.path === "/v1/storefront/carts")
      return Response.json({ cart: saved, recovery_token: "private" });
    if (call.path === "/v1/storefront/products/product-a")
      return Response.json(product());
    if (call.path === "/v1/storefront/products/product-a/variants/variant-a")
      return Response.json({ ...product().variants[0], fulfillment: { type: "physical", shipping_profile_id: "profile-a", inventory_requirements: [], backorder: { type: "disallow" } } });
    if (call.method === "PUT") {
      saved = { ...saved, ...call.body };
      return Response.json(saved);
    }
    throw new Error(`Unexpected request ${call.path}`);
  });
  await store.eshop.cart.load();
  await store.eshop.cart.refresh({ delivery_groups: [group] });
  assert.equal(store.eshop.cart.product_items.get()[0].shipping_profile_id, "profile-a");
  assert.deepEqual(calls.find((call) => call.method === "PUT").body.delivery_groups, [group]);
  assert.deepEqual(store.eshop.cart.cart.get().delivery_groups, [group]);
  await store.eshop.cart.refresh();
  assert.equal(Object.hasOwn(calls.filter((call) => call.method === "PUT").at(-1).body, "delivery_groups"), false);
  await store.eshop.cart.refresh({ delivery_groups: [] });
  assert.deepEqual(calls.filter((call) => call.method === "PUT").at(-1).body.delivery_groups, []);
  const before = calls.length;
  await assert.rejects(store.eshop.cart.refresh({ delivery_groups: [group], shipping_address: null }), /not both/);
  assert.equal(calls.length, before);
});

test("Cart edits preserve promotion identities without submitting them as coupon codes", async () => {
  const promotionId = "292e102d-c879-4813-925a-e508ab7015e5";
  let saved = cart({ promotion_code_ids: [promotionId], line_items: [productLine], item_count: 1 });
  const { store, calls } = setup((call) => {
    if (call.path === "/v1/storefront/carts")
      return Response.json({ cart: saved, recovery_token: "private" });
    if (call.path === "/v1/storefront/products/product-a")
      return Response.json(product());
    if (call.path === "/v1/storefront/products/product-a/variants/variant-a")
      return Response.json(product().variants[0]);
    if (call.method === "PUT") {
      if (Object.hasOwn(call.body, "promotion_codes")) {
        assert.deepEqual(call.body.promotion_codes, []);
        saved = { ...saved, promotion_code_ids: [] };
      }
      return Response.json(saved);
    }
    if (call.path.endsWith("/quote"))
      return Response.json({
        sources: checkoutSources(cartId),
        presentation_digest: "a".repeat(64),
        order: {
          locale: "en",
          money: { promotions: saved.promotion_code_ids.length ? [{ code: "SAVE10" }, { code: null }] : [] },
        },
      });
    throw new Error(`Unexpected request ${call.path}`);
  });
  await store.eshop.cart.load();
  assert.deepEqual(store.eshop.cart.promotion_codes.get(), []);
  await store.eshop.cart.quote({ delivery_groups: [] });
  assert.deepEqual(store.eshop.cart.promotion_codes.get(), ["SAVE10"]);
  store.setLocale("de");
  assert.deepEqual(store.eshop.cart.promotion_codes.get(), []);
  await store.eshop.cart.quote();
  assert.deepEqual(store.eshop.cart.promotion_codes.get(), ["SAVE10"]);
  await store.eshop.cart.refresh({ billing_address: null });
  assert.deepEqual(store.eshop.cart.cart.get().promotion_code_ids, [promotionId]);
  assert.deepEqual(store.eshop.cart.promotion_codes.get(), []);
  for (const call of calls.filter((call) => call.method === "PUT"))
    assert.equal(Object.hasOwn(call.body, "promotion_codes"), false);
  await store.eshop.cart.removePromoCode();
  assert.deepEqual(store.eshop.cart.cart.get().promotion_code_ids, []);
  assert.deepEqual(store.eshop.cart.promotion_codes.get(), []);
  assert.deepEqual(calls.filter((call) => call.method === "PUT").at(-1).body.promotion_codes, []);
});

for (const permitted of [true, false]) {
  test(`Cart checkout ${permitted ? "retains a permitted alternative" : "rejects an unquoted"} payment provider`, async () => {
    const durable = new MemoryStorage();
    for (const [name, value] of [
      ["window", { location: { href: "https://merchant.example/checkout" } }],
      ["localStorage", durable],
      ["navigator", { locks: new ExclusiveLockManager() }],
    ]) Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
    const suggested = "79f91663-1603-4b63-9953-42316875906e";
    const selected = "01c2af6e-ad1d-445f-a818-a135d9abca0a";
    const { store, calls } = setup((call) => {
      assert.equal(call.path, "/v1/storefront/checkouts");
      throw new TypeError("response lost");
    });
    store.eshop.cart.cart.set(cart());
    store.eshop.cart.quote_result.set({
      sources: checkoutSources(cartId),
      presentation_digest: "a".repeat(64),
      order: { locale: "en", payment_provider_id: suggested, payment_provider_ids: permitted ? [suggested, selected] : [suggested] },
    });
    await assert.rejects(
      store.eshop.cart.checkout({ payment_provider_id: selected }),
      permitted ? /response lost/ : /not available in the reviewed Cart quote/,
    );
    const posts = calls.filter((call) => call.path.endsWith("/checkouts"));
    assert.equal(posts.length, permitted ? 1 : 0);
    if (permitted) {
      assert.equal(posts[0].body.payment_provider_id, selected);
      assert.equal((await store.eshop.cart.pendingCheckout()).payment_provider_id, selected);
    } else assert.equal(await store.eshop.cart.pendingCheckout(), null);
  });
}

const productLine = {
  type: "product",
  id: "line-a",
  product_id: "product-a",
  variant_id: "variant-a",
  quantity: 1,
  form_submission_id: null,
  price_override: null,
};
function product() {
  return {
    id: "product-a",
    key: "product-a",
    blocks: [],
    slugs: {},
    classifications: [],
    variants: [
      {
        id: "variant-a",
        product_id: "product-a",
        sku: null,
        price: null,
        attributes: [],
        reference_labels: {},
        fulfillment: { type: "none" },
        status: { type: "active" },
      },
    ],
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
  };
}

test("Market changes clear the selected empty Cart view and a late old load cannot reset the new loading state", async () => {
  const old = gate();
  const next = gate();
  const { store, calls } = setup(async (call) => {
    assert.equal(call.path, "/v1/storefront/carts");
    const isOld = call.headers.get("x-arky-market") === "market-a";
    const request = isOld ? old : next;
    request.enter();
    await request.waiting;
    return Response.json({
      cart: cart(isOld ? {} : { id: secondId, market_id: "market-b" }),
      recovery_token: "private",
    });
  });
  const first = store.eshop.cart.load();
  const rejected = assert.rejects(
    first,
    /Customer or Market changed|buyer or Market changed/,
  );
  await old.started;
  store.setMarket("market-b");
  const second = store.eshop.cart.load();
  await next.started;
  old.release();
  await rejected;
  assert.equal(store.eshop.cart.cart.get(), null);
  assert.equal(store.eshop.cart.status.get().loading, true);
  assert.equal(store.eshop.cart.status.get().error, null);
  next.release();
  assert.equal((await second).id, secondId);
  assert.equal(store.eshop.cart.cart.get().id, secondId);
  assert.equal(store.eshop.cart.status.get().loading, false);
  assert.equal(calls.length, 2);
});

test("late product hydration cannot repopulate a different buyer's Cart or report an old read failure", async () => {
  const hydration = gate();
  const { store } = setup(async (call) => {
    if (call.path === "/v1/storefront/carts") {
      const next = call.headers.get("authorization").includes("b".repeat(64));
      return Response.json({
        cart: cart(
          next
            ? { id: secondId, customer_id: "customer-b" }
            : { line_items: [productLine], item_count: 1 },
        ),
        recovery_token: "private",
      });
    }
    if (call.path.endsWith("/products/product-a/variants/variant-a")) return Response.json(product().variants[0]);
    if (call.path.endsWith("/products/product-a")) {
      hydration.enter();
      await hydration.waiting;
      return Response.json(
        { message: "Old buyer cannot read this product" },
        { status: 403 },
      );
    }
    throw new Error(`Unexpected request ${call.path}`);
  });
  const first = store.eshop.cart.load();
  const rejected = assert.rejects(first, /buyer or Market changed/);
  await hydration.started;
  await store.customer.identify();
  assert.equal(store.eshop.cart.cart.get(), null);
  assert.equal(store.eshop.cart.item_count.get(), 0);
  assert.equal((await store.eshop.cart.load()).id, secondId);
  hydration.release();
  await rejected;
  assert.equal(store.eshop.cart.cart.get().customer_id, "customer-b");
  assert.deepEqual(store.eshop.cart.product_items.get(), []);
  assert.equal(store.eshop.cart.status.get().error, null);
});

test("a newer Cart write wins over an older product hydration without changing buyer context", async () => {
  const hydration = gate();
  const { store } = setup(async (call) => {
    if (call.path === "/v1/storefront/carts")
      return Response.json({
        cart: cart({ line_items: [productLine], item_count: 1 }),
        recovery_token: "private",
      });
    if (call.path.endsWith("/products/product-a/variants/variant-a")) return Response.json(product().variants[0]);
    if (call.path.endsWith("/products/product-a")) {
      hydration.enter();
      await hydration.waiting;
      return Response.json(product());
    }
    if (call.method === "PUT" && call.path.endsWith(`/carts/${cartId}`))
      return Response.json(cart({ updated_at: 2 }));
    throw new Error(`Unexpected request ${call.path}`);
  });
  const first = store.eshop.cart.load();
  await hydration.started;
  await store.eshop.cart.refresh({ product_items: [] });
  hydration.release();
  await first;
  assert.equal(store.eshop.cart.cart.get().updated_at, 2);
  assert.deepEqual(store.eshop.cart.product_items.get(), []);
  assert.equal(store.eshop.cart.item_count.get(), 0);
});

for (const change of ["buyer", "language"]) {
  test(`a quote finishing after a ${change} change cannot become the reviewed quote`, async () => {
    const quote = gate();
    const line = {
      type: "digital_product",
      id: "digital-line",
      digital_product_id: "digital-a",
      beneficiary_customer_id: "customer-a",
      form_submission_id: null,
      price_override: null,
    };
    const { store, calls } = setup(async (call) => {
      if (call.path === "/v1/storefront/carts")
        return Response.json({
          cart: cart({ line_items: [line], item_count: 1 }),
          recovery_token: "private",
        });
      if (call.method === "PUT")
        return Response.json(
          cart({ line_items: [line], item_count: 1, updated_at: 2 }),
        );
      if (call.path.endsWith("/quote")) {
        quote.enter();
        await quote.waiting;
        return Response.json({
          sources: checkoutSources(cartId),
          presentation_digest: "a".repeat(64),
          order: { locale: "en" },
        });
      }
      throw new Error(`Unexpected request ${call.path}`);
    });
    await store.eshop.cart.load();
    const pending = store.eshop.cart.quote();
    const rejected = assert.rejects(
      pending,
      /buyer or Market changed|selections or language changed/,
    );
    await quote.started;
    if (change === "buyer") await store.customer.identify();
    else store.setLocale("de");
    quote.release();
    await rejected;
    assert.equal(store.eshop.cart.quote_result.get(), null);
    assert.equal(store.eshop.cart.status.get().fetching_quote, false);
    assert.equal(store.eshop.cart.status.get().quote_error, null);
    assert.equal(
      calls.filter((call) => call.path.endsWith("/checkouts")).length,
      0,
    );
  });
}

test("identity and Market invalidation leave the unresolved Checkout request byte-for-byte intact", async () => {
  const durable = new MemoryStorage();
  for (const [name, value] of [
    ["window", globalThis],
    ["localStorage", durable],
    ["navigator", { locks: new ExclusiveLockManager() }],
  ]) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value,
    });
  }
  const { store, calls } = setup((call) => {
    assert.equal(call.path, "/v1/storefront/checkouts");
    throw new TypeError("response lost");
  });
  const request = {
    id: cartId,
    request_id: "8c1d4f5a-3f0b-4a7d-8f52-5c0f2b7a91d4",
    locale: "en",
    presentation_digest: "a".repeat(64),
    sources: checkoutSources(cartId),
  };
  await assert.rejects(
    store.client.eshop.cart.checkout(request),
    /response lost/,
  );
  const pending = await store.eshop.cart.pendingCheckout();
  const key = `arky:commerce-cart-checkout:v1:${encodeURIComponent(`storefront:${apiUrl}:${publishableKey}`)}`;
  const retained = durable.getItem(key);
  assert.ok(retained);
  store.setMarket("market-b");
  await store.customer.identify();
  assert.equal(store.eshop.cart.cart.get(), null);
  assert.equal(store.eshop.cart.last_order.get(), null);
  assert.equal(durable.getItem(key), retained);
  assert.deepEqual(await store.eshop.cart.pendingCheckout(), pending);
  assert.equal(
    calls.filter((call) => call.path.endsWith("/checkouts")).length,
    1,
  );
});
