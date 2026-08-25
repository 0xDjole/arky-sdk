import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createAdmin, SDK_VERSION } from "../dist/index.js";
import { createStorefront } from "../dist/storefront.js";

const baseUrl = "https://api.example.test";
const storeId = "store-client-contract";
const publishableKey = `arky_pk_${"k".repeat(43)}`;

function storedVisitorSession(token, customerId = "customer-client-contract") {
  return JSON.stringify({
    version: 1,
    customer: {
      id: customerId,
      status: "active",
      identities: [],
      classifications: [],
      created_at: 1,
      updated_at: 1,
    },
    session: {
      id: `session-${customerId}`,
      customer_id: customerId,
      status: "active",
      type: "visitor",
      token,
      expires_at: 10_000,
    },
  });
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("admin code login activates the same pending Account Session", async () => {
  const admin = createAdmin({ baseUrl, storeId, market: "us" });
  const calls = [];
  const responses = [
    {
      session_id: "session-client-contract",
      verification_expires_at: 900,
    },
    {
      id: "session-client-contract",
      access_token: "access-client-contract",
      refresh_token: "refresh-client-contract",
      access_expires_at: 1000,
      refresh_expires_at: 2000,
      authenticated_at: 20,
      created_at: 10,
      updated_at: 20,
    },
  ];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: JSON.parse(String(init.body)),
    });
    return jsonResponse(responses.shift());
  };

  try {
    const pending = await admin.account.auth.code({
      email: "operator@example.test",
    });
    await admin.account.auth.verify({
      session_id: pending.session_id,
      code: "123456",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/auth/code`,
      method: "POST",
      body: { email: "operator@example.test" },
    },
    {
      url: `${baseUrl}/v1/auth/verify`,
      method: "POST",
      body: {
        session_id: "session-client-contract",
        code: "123456",
      },
    },
  ]);
});

test("Store invitation login wraps the platform-global pending Account Session", async () => {
  const admin = createAdmin({ baseUrl, storeId, market: "us" });
  const invitationStoreId = "store-invitation-contract";
  const calls = [];
  const responses = [
    {
      session_id: "session-invitation-contract",
      verification_expires_at: 900,
    },
    {
      id: "session-invitation-contract",
      access_token: "access-invitation-contract",
      refresh_token: "refresh-invitation-contract",
      access_expires_at: 1000,
      refresh_expires_at: 2000,
      authenticated_at: 20,
      created_at: 10,
      updated_at: 20,
    },
  ];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: JSON.parse(String(init.body)),
    });
    return jsonResponse(responses.shift());
  };

  try {
    const pending = await admin.account.auth.storeCode(
      invitationStoreId,
      { email: "invitee@example.test" },
    );
    await admin.account.auth.storeVerify(invitationStoreId, {
      session_id: pending.session_id,
      code: "123456",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${invitationStoreId}/auth/code`,
      method: "POST",
      body: { email: "invitee@example.test" },
    },
    {
      url: `${baseUrl}/v1/stores/${invitationStoreId}/auth/verify`,
      method: "POST",
      body: {
        session_id: "session-invitation-contract",
        code: "123456",
      },
    },
  ]);
});

test("admin refresh returns the rotated Account Session contract", async () => {
  const admin = createAdmin({ baseUrl, storeId, market: "us" });
  const calls = [];
  const response = {
    id: "session-rotated",
    access_token: "access-rotated",
    refresh_token: "refresh-rotated",
    access_expires_at: 2_000,
    refresh_expires_at: 3_000,
    authenticated_at: 500,
    created_at: 1_000,
    updated_at: 1_000,
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: JSON.parse(String(init.body)),
    });
    return jsonResponse(response);
  };

  let result;
  try {
    result = await admin.account.auth.refresh({
      refresh_token: "refresh-previous",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(result, response);
  assert.equal(result.authenticated_at, 500);
  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/auth/refresh`,
      method: "POST",
      body: { refresh_token: "refresh-previous" },
    },
  ]);
});

test("request errors preserve the server response while normalizing validation details", async () => {
  const admin = createAdmin({ baseUrl, storeId, market: "us" });
  const response = {
    message: "Email is invalid",
    error: "GENERAL.VALIDATION_ERROR",
    statusCode: 422,
    validationErrors: [{ field: "email", error: "" }],
  };
  let errorContext;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => jsonResponse(response, 422);

  try {
    await assert.rejects(
      admin.account.auth.code(
        { email: "invalid" },
        {
          onError: (context) => {
            errorContext = context;
          },
        },
      ),
      (error) => {
        assert.equal(error.name, "ApiError");
        assert.equal(error.message, response.message);
        assert.equal(error.statusCode, 422);
        assert.deepEqual(error.validationErrors, [
          { field: "email", error: "GENERAL.VALIDATION_ERROR" },
        ]);
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(errorContext.status, 422);
  assert.deepEqual(errorContext.response, response);
});

test("admin Store methods use the explicit name, email, and language contract", async () => {
  const admin = createAdmin({
    baseUrl,
    storeId,
    apiToken: "arky_api_admin_contract",
  });
  const store = {
    id: storeId,
    name: "Client Contract",
    email: "owner@example.test",
    publishable_key: publishableKey,
    status: "active",
    default_market_id: "market-bih",
    timezone: "Europe/Sarajevo",
    default_language: "en",
    supported_languages: ["en", "bs"],
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: init.body ? JSON.parse(String(init.body)) : null,
    });
    return jsonResponse(store);
  };

  try {
    assert.deepEqual(
      await admin.store.create({
        name: "Client Contract",
        timezone: "Europe/Sarajevo",
        default_language: "en",
        supported_languages: ["en", "bs"],
      }),
      store,
    );
    assert.deepEqual(
      await admin.store.regeneratePublishableKey({ store_id: storeId }),
      store,
    );
    await admin.store.update({
      id: storeId,
      name: "Client Contract",
      email: "owner@example.test",
      default_market_id: "market-bih",
      default_language: "en",
      supported_languages: ["en", "bs"],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores`,
      method: "POST",
      body: {
        name: "Client Contract",
        timezone: "Europe/Sarajevo",
        default_language: "en",
        supported_languages: ["en", "bs"],
      },
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}/publishable-key/regenerate`,
      method: "POST",
      body: {},
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}`,
      method: "PUT",
      body: {
        id: storeId,
        name: "Client Contract",
        email: "owner@example.test",
        default_market_id: "market-bih",
        default_language: "en",
        supported_languages: ["en", "bs"],
      },
    },
  ]);
});

test("admin Store deletion requests the deleting status with exact name confirmation", async () => {
  const admin = createAdmin({
    baseUrl,
    storeId,
    market: "us",
  });
  const deletingStore = {
    id: storeId,
    name: "Client Contract",
    email: "owner@example.test",
    publishable_key: publishableKey,
    status: "deleting",
    default_market_id: null,
    timezone: "Europe/Sarajevo",
    default_language: "en",
    supported_languages: ["en"],
  };
  let call;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    call = {
      url: String(url),
      method: init.method,
      body: JSON.parse(String(init.body)),
    };
    return jsonResponse(deletingStore);
  };

  try {
    assert.deepEqual(
      await admin.store.requestDeletion({ confirmation: "Client Contract" }),
      deletingStore,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(call, {
    url: `${baseUrl}/v1/stores/${storeId}/deletion`,
    method: "POST",
    body: { confirmation: "Client Contract" },
  });
});

test("Store endpoint configurations and physical locations use their cleaned contracts", async () => {
  const admin = createAdmin({ baseUrl, storeId, market: "bih" });
  const address = {
    street1: "1 Contract Way",
    city: "Sarajevo",
    postal_code: "71000",
    country: "BA",
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method || "GET",
      body: init.body ? JSON.parse(String(init.body)) : null,
    });
    return jsonResponse({});
  };

  try {
    await admin.store.location.create({ key: "main", address });
    await admin.store.location.update({
      id: "location-contract",
      is_pickup_location: true,
    });
    await admin.store.buildHook.create({
      store_id: storeId,
      url: "https://deploy.example.test/hook",
      status: "disabled",
    });
    await admin.store.buildHook.update({
      store_id: storeId,
      id: "build-hook-contract",
      status: "active",
    });
    await admin.store.webhook.create({
      store_id: storeId,
      url: "https://events.example.test/hook",
      events: [{ event: "customer.archived" }],
      headers: {},
      secret: "s".repeat(32),
      status: "disabled",
    });
    await admin.store.webhook.update({
      store_id: storeId,
      id: "webhook-contract",
      status: "active",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map(({ url, ...call }) => ({
      ...call,
      url: url.replace(baseUrl, ""),
    })),
    [
      {
        url: `/v1/stores/${storeId}/locations`,
        method: "POST",
        body: { key: "main", address, store_id: storeId },
      },
      {
        url: `/v1/stores/${storeId}/locations/location-contract`,
        method: "PUT",
        body: {
          id: "location-contract",
          is_pickup_location: true,
          store_id: storeId,
        },
      },
      {
        url: `/v1/stores/${storeId}/build-hooks`,
        method: "POST",
        body: {
          url: "https://deploy.example.test/hook",
          status: "disabled",
        },
      },
      {
        url: `/v1/stores/${storeId}/build-hooks/build-hook-contract`,
        method: "PUT",
        body: { status: "active" },
      },
      {
        url: `/v1/stores/${storeId}/webhooks`,
        method: "POST",
        body: {
          url: "https://events.example.test/hook",
          events: [{ event: "customer.archived" }],
          headers: {},
          secret: "s".repeat(32),
          status: "disabled",
        },
      },
      {
        url: `/v1/stores/${storeId}/webhooks/webhook-contract`,
        method: "PUT",
        body: { status: "active" },
      },
    ],
  );
});

test("admin Market and Payment Provider APIs use provider roots and UUID allowlists", async () => {
  const admin = createAdmin({
    baseUrl,
    storeId,
    apiToken: "arky_api_admin_contract",
  });
  const cashProvider = {
    id: "provider-cash-on-delivery",
    store_id: storeId,
    configuration: { type: "cash_on_delivery" },
    disabled_at: null,
    created_at: 1,
    updated_at: 1,
  };
  const stripeProvider = {
    id: "provider-stripe",
    store_id: storeId,
    configuration: {
      type: "stripe",
      connected_account_id: "acct_contract",
      account_setup_submitted: true,
      payments_enabled: true,
      payouts_enabled: true,
      state_observed_at: 2,
      platform_debit_consent: {
        connected_account_id: "acct_contract",
        accepted_by_account_id: "account-contract",
        accepted_at: 2,
        terms_version: 1,
      },
    },
    disabled_at: null,
    created_at: 1,
    updated_at: 2,
  };
  const market = {
    id: "market-contract",
    store_id: storeId,
    key: "bih",
    currency: "bam",
    tax_mode: "inclusive",
    payment_provider_ids: [cashProvider.id, stripeProvider.id],
    zones: [],
    created_at: 1,
    updated_at: 1,
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method || "GET",
      body: init.body ? JSON.parse(String(init.body)) : null,
    });
    return String(url).endsWith("/payment-providers")
      ? jsonResponse([cashProvider, stripeProvider])
      : jsonResponse(market);
  };

  try {
    const providers = await admin.store.paymentProvider.list();
    assert.equal(providers[0].configuration.type, "cash_on_delivery");
    assert.equal(
      providers[1].configuration.platform_debit_consent.terms_version,
      1,
    );
    assert.deepEqual(
      await admin.store.market.create({
        key: "bih",
        currency: "bam",
        tax_mode: "inclusive",
        payment_provider_ids: [cashProvider.id, stripeProvider.id],
        zones: [],
      }),
      market,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${storeId}/payment-providers`,
      method: "GET",
      body: null,
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}/markets`,
      method: "POST",
      body: {
        key: "bih",
        currency: "bam",
        tax_mode: "inclusive",
        payment_provider_ids: [cashProvider.id, stripeProvider.id],
        zones: [],
        store_id: storeId,
      },
    },
  ]);
});

test("admin cart update, quote, and checkout preserve one Payment Provider UUID", async () => {
  const admin = createAdmin({
    baseUrl,
    storeId,
    market: "bih",
    apiToken: "arky_api_admin_contract",
  });
  const paymentProviderId = "provider-stripe";
  const cart = {
    id: "cart-provider-contract",
    store_id: storeId,
    customer_id: "customer-contract",
    customer_session_id: null,
    token: "cart-token-contract",
    status: "active",
    origin: "admin",
    created_by_account_id: "account-contract",
    market: "bih",
    product_items: [],
    booking_items: [],
    digital_items: [],
    shipping_address: null,
    billing_address: null,
    promo_code: null,
    payment_provider_id: paymentProviderId,
    shipping_method_id: null,
    converted_order_id: null,
    item_count: 0,
    last_action_at: 1,
    abandoned_at: null,
    created_at: 1,
    updated_at: 2,
  };
  const quote = {
    product_lines: [],
    booking_lines: [],
    digital_lines: [],
    shipping_lines: [],
    shipping_methods: [],
    payment_provider_id: paymentProviderId,
    payment_provider_ids: [paymentProviderId],
    money: {
      currency: "bam",
      market: "bih",
      subtotal: 0,
      shipping: 0,
      discount: 0,
      tax_total: 0,
      total: 0,
      promo_code: null,
      zone_id: null,
      shipping_method_id: null,
    },
  };
  const checkout = {
    order_id: "order-provider-contract",
    number: "1001",
    payment_action: { type: "none" },
    payment: {
      id: "payment-provider-contract",
      store_id: storeId,
      order_id: "order-provider-contract",
      provider: {
        type: "stripe",
        payment_provider_id: paymentProviderId,
        checkout_expires_at: 10,
        checkout_session_id: "checkout-provider-contract",
        payment_intent_id: null,
        checkout_session_status: null,
        checkout_payment_status: null,
      },
      status: "requires_action",
      amounts: {
        currency: "bam",
        total: 100,
        paid: 0,
        refund_pending: 0,
        refunded: 0,
      },
      requested_at: 1,
      completed_at: null,
      created_at: 1,
      updated_at: 1,
      safe_error: null,
    },
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const call = {
      url: String(url),
      method: init.method || "GET",
      body: init.body ? JSON.parse(String(init.body)) : null,
    };
    calls.push(call);
    if (call.url.endsWith("/checkout")) return jsonResponse(checkout);
    if (call.url.endsWith("/quote")) return jsonResponse(quote);
    return jsonResponse(cart);
  };

  try {
    assert.equal(
      (
        await admin.eshop.cart.update({
          id: cart.id,
          payment_provider_id: paymentProviderId,
        })
      ).payment_provider_id,
      paymentProviderId,
    );
    assert.equal(
      (await admin.eshop.cart.quote({ id: cart.id })).payment_provider_id,
      paymentProviderId,
    );
    assert.equal(
      (
        await admin.eshop.order.getQuote({
          market: "bih",
          payment_provider_id: paymentProviderId,
        })
      ).payment_provider_ids[0],
      paymentProviderId,
    );
    assert.equal(
      (
        await admin.eshop.cart.checkout({
          id: cart.id,
          payment_provider_id: paymentProviderId,
          return_url: "https://admin.example.test/checkout/return",
        })
      ).payment.provider.payment_provider_id,
      paymentProviderId,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map((call) => ({
      ...call,
      url: call.url.replace(baseUrl, ""),
    })),
    [
      {
        url: `/v1/stores/${storeId}/carts/${cart.id}`,
        method: "PUT",
        body: { payment_provider_id: paymentProviderId },
      },
      {
        url: `/v1/stores/${storeId}/carts/${cart.id}/quote`,
        method: "POST",
        body: {},
      },
      {
        url: `/v1/stores/${storeId}/orders/quote`,
        method: "POST",
        body: {
          payment_provider_id: paymentProviderId,
          products: [],
          bookings: [],
          digital: [],
          market: "bih",
        },
      },
      {
        url: `/v1/stores/${storeId}/carts/${cart.id}/checkout`,
        method: "POST",
        body: {
          payment_provider_id: paymentProviderId,
          return_url: "https://admin.example.test/checkout/return",
        },
      },
    ],
  );
});

test("admin Order uses the embedded product-item route and canonical Customer filter", async () => {
  const admin = createAdmin({
    baseUrl,
    storeId,
    apiToken: "arky_api_admin_contract",
  });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const call = {
      url: String(url),
      method: init.method || "GET",
      body: init.body ? JSON.parse(String(init.body)) : null,
    };
    calls.push(call);
    return jsonResponse(call.method === "GET" ? { items: [], cursor: null } : {});
  };

  try {
    await admin.eshop.order.find({ customer_id: "customer-contract" });
    await admin.eshop.order.cancelProductItem({
      order_id: "order-contract",
      order_product_item_id: "order-product-item-contract",
      quantity: 1,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal("getProducts" in admin.eshop.order, false);
  assert.equal("getDigitalProducts" in admin.eshop.order, false);
  assert.equal("cancelProduct" in admin.eshop.order, false);
  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${storeId}/orders?customer_id=customer-contract`,
      method: "GET",
      body: null,
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}/orders/order-contract/product-items/order-product-item-contract/cancel`,
      method: "POST",
      body: { quantity: 1 },
    },
  ]);
});

test("admin market deletion sends an explicit replacement default as query context", async () => {
  const admin = createAdmin({
    baseUrl,
    storeId,
    apiToken: "arky_api_admin_contract",
  });
  let call;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    call = { url: String(url), method: init.method };
    return jsonResponse({ deleted: true });
  };

  try {
    await admin.store.market.delete({
      id: "market-old",
      replacement_default_market_id: "market-next",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(call, {
    url: `${baseUrl}/v1/stores/${storeId}/markets/market-old?replacement_default_market_id=market-next`,
    method: "DELETE",
  });
});

test("Classification is top-level and uses the renamed Admin and storefront routes", async () => {
  const admin = createAdmin({ baseUrl, storeId, market: "us" });
  const storefront = createStorefront(publishableKey, { apiUrl: baseUrl });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const target = String(url);
    calls.push({
      url: target,
      method: init.method || "GET",
      body: init.body ? JSON.parse(String(init.body)) : null,
    });
    if (target.endsWith("/children")) return jsonResponse([]);
    if (target.includes("?status=active")) {
      return jsonResponse({ items: [], cursor: null });
    }
    return jsonResponse({
      id: "classification-contract",
      store_id: storeId,
      key: "topics",
      parent_id: null,
      schema: [],
      status: "active",
      created_at: 1,
      updated_at: 1,
    });
  };

  try {
    assert.equal("classification" in admin.content, false);
    assert.equal("classification" in storefront.content, false);
    await admin.classification.create({ key: "topics", schema: [] });
    await admin.classification.get({ id: "classification-contract" });
    await admin.classification.find({ status: "active" });
    await storefront.classification.get({ key: "topics" });
    await storefront.classification.getChildren({
      id: "classification-contract",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map((call) => ({
      ...call,
      url: call.url.replace(baseUrl, ""),
    })),
    [
      {
        url: `/v1/stores/${storeId}/classifications`,
        method: "POST",
        body: { key: "topics", schema: [] },
      },
      {
        url: `/v1/stores/${storeId}/classifications/classification-contract`,
        method: "GET",
        body: null,
      },
      {
        url: `/v1/stores/${storeId}/classifications?status=active`,
        method: "GET",
        body: null,
      },
      {
        url: "/v1/storefront/classifications/topics",
        method: "GET",
        body: null,
      },
      {
        url: "/v1/storefront/classifications/classification-contract/children",
        method: "GET",
        body: null,
      },
    ],
  );
});

test("storefront collection lookup uses a keyless route and publishable-key header", async () => {
  const storefront = createStorefront(publishableKey, {
    apiUrl: baseUrl,
    locale: "en",
  });
  let call;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    call = { url: String(url), headers: new Headers(init.headers) };
    return jsonResponse({ id: "collection-contract", key: "articles" });
  };

  try {
    await storefront.content.collection.get({ key: "articles" });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(call.url, `${baseUrl}/v1/storefront/collections/articles`);
  assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
  assert.equal(call.headers.get("x-arky-locale"), "en");
  assert.equal(call.headers.get("authorization"), null);
});

test("admin Product writes and ProductInventory reads use the canonical wire fields", async () => {
  const admin = createAdmin({ baseUrl, storeId, market: "us" });
  const create = {
    key: "canonical-product",
    slugs: { en: "canonical-product" },
    blocks: [],
    classifications: [],
    variants: [
      {
        prices: [],
        inventory: [
          {
            store_location_id: "location-contract",
            on_hand: 10,
          },
        ],
        attributes: [],
        requires_shipping: true,
        weight_grams: 500,
      },
    ],
  };
  const product = {
    id: "product-contract",
    store_id: storeId,
    key: create.key,
    slugs: create.slugs,
    blocks: [],
    classifications: [],
    variants: [
      {
        id: "variant-contract",
        sku: null,
        prices: [],
        attributes: [],
        requires_shipping: true,
        weight_grams: 500,
      },
    ],
    status: "active",
    created_at: 1,
    updated_at: 1,
  };
  const update = {
    id: product.id,
    slugs: { en: "canonical-product-updated" },
    variants: [
      {
        id: "variant-contract",
        inventory: [
          {
            store_location_id: "location-contract",
            on_hand: 12,
          },
        ],
        weight_grams: null,
      },
    ],
    status: "draft",
  };
  const inventory = [
    {
      id: "inventory-contract",
      store_id: storeId,
      product_id: product.id,
      variant_id: "variant-contract",
      store_location_id: "location-contract",
      on_hand: 12,
      reserved: 3,
      updated_at: 2,
    },
  ];
  const updatedProduct = {
    ...product,
    slugs: update.slugs,
    variants: [{ ...product.variants[0], weight_grams: null }],
    status: "draft",
    updated_at: 2,
  };
  const calls = [];
  const responses = [product, updatedProduct, inventory];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: init.body ? JSON.parse(String(init.body)) : null,
    });
    return jsonResponse(responses.shift());
  };

  let created;
  let updated;
  let loadedInventory;
  try {
    created = await admin.eshop.product.create(create);
    updated = await admin.eshop.product.update(update);
    loadedInventory = await admin.eshop.product.getInventory({ id: product.id });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(created, product);
  assert.deepEqual(updated, updatedProduct);
  assert.deepEqual(loadedInventory, inventory);
  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${storeId}/products`,
      method: "POST",
      body: create,
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}/products/${product.id}`,
      method: "PUT",
      body: update,
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}/products/${product.id}/inventory`,
      method: "GET",
      body: null,
    },
  ]);
});

test("storefront product inventory is an explicit child-resource request", async () => {
  const storefront = createStorefront(publishableKey, {
    apiUrl: baseUrl,
    locale: "en",
  });
  let call;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    call = { url: String(url), headers: new Headers(init.headers) };
    return jsonResponse([]);
  };

  try {
    await storefront.eshop.product.getInventory({ slug: "lean-product" });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    call.url,
    `${baseUrl}/v1/storefront/products/lean-product/inventory`,
  );
  assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
});

test("storefront cart recovery sends its credential only in the cart-token header", async () => {
  const visitorToken = `customer_visitor_${"c".repeat(64)}`;
  const recoveryToken = "cart-recovery-contract-token";
  const storefront = createStorefront(publishableKey, {
    apiUrl: baseUrl,
    sessionStorage: {
      getItem: () => storedVisitorSession(visitorToken),
      setItem() {},
      removeItem() {},
    },
  });
  let call;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    call = {
      url: String(url),
      headers: new Headers(init.headers),
      body: init.body,
    };
    return jsonResponse({ id: "cart-recovery-contract", token: recoveryToken });
  };

  try {
    await storefront.eshop.cart.get(
      { id: "cart-recovery-contract", token: recoveryToken },
      {
        headers: { "x-arky-cart-token": "caller-cannot-override" },
        params: {
          token: "unexpected-query-token",
          cart_token: "unexpected-query-cart-token",
          include: "summary",
        },
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    call.url,
    `${baseUrl}/v1/storefront/carts/cart-recovery-contract?include=summary`,
  );
  assert.equal(call.headers.get("x-arky-cart-token"), recoveryToken);
  assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.equal(call.body, undefined);
  assert.equal(call.url.includes("token"), false);
});

test("storefront money helpers preserve exact zero and reject invalid minor units", () => {
  const storefront = createStorefront(publishableKey, {
    apiUrl: baseUrl,
    market: "ita",
  });
  const prices = [
    { market: "other", amount: 999, currency: "USD" },
    { market: "ita", amount: 0, currency: "EUR" },
  ];

  assert.equal(storefront.utils.getPriceAmount(prices), 0);
  assert.notEqual(storefront.utils.formatPrice(prices), "");
  storefront.setContext({ market: "missing" });
  assert.equal(storefront.utils.getPriceAmount(prices), null);
  assert.equal(storefront.utils.formatPrice(prices), "");
  assert.throws(() => storefront.utils.formatMinor(1.5, "EUR"), /safe integer/);
});

test("SDK_VERSION equals the package version", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.equal(SDK_VERSION, packageJson.version);
});

test("recursive storefront declarations never degrade to any", async () => {
  const declaration = await readFile(
    new URL("../dist/index.d.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(declaration, /\/\*elided\*\/ any/);
  assert.match(
    declaration,
    /withContext\(context: StorefrontContext\): StorefrontClient/,
  );
  assert.match(
    declaration,
    /withContext\(context: ArkyStoreContext\): InitializedStore/,
  );
});
