import assert from "node:assert/strict";
import { checkoutSources } from "./helpers/checkout-sources.mjs";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createAdmin, SDK_VERSION } from "../dist/index.js";
import { createStorefront } from "../dist/storefront.js";

const baseUrl = "https://api.example.test";
const storeId = "b1e6d4a9-2c75-4f38-9a0e-5d7c3b8f1e62";
const otherStoreId = "4a9c2e71-8d36-4b05-a1f7-3e6b0d9c5f28";
const sessionId = "7f2a5c90-1d64-4e38-b9a7-0c3e8f6d2b15";
const publishableKey = `arky_pk_${"k".repeat(43)}`;

function storedVisitorSession(token, customerId = "customer-client-contract") {
  return JSON.stringify({
    version: 2,
    customer: {
      id: customerId,
      status: { type: "active" },
      identities: [],
      categories: [],
      created_at: 1,
      updated_at: 1,
    },
    session: {
      id: `session-${customerId}`,
      customer_id: customerId,
      status: { type: "active" },
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

test("Admin non-commerce reads do not need or invent a Market", async (t) => {
  const admin = createAdmin({ baseUrl, apiToken: "arky_api_admin_contract" });
  const calls = [];
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), headers: new Headers(init.headers) });
    return jsonResponse({ id: storeId });
  };
  assert.equal(admin.getMarket(), undefined);
  assert.equal("getStoreId" in admin, false);
  await admin.store.get({ id: storeId });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${baseUrl}/v1/stores/${storeId}`);
  assert.equal(calls[0].headers.has("X-Arky-Market"), false);
  admin.setMarket("bih");
  assert.equal(admin.getMarket(), "bih");
});

test("message delivery history routes preserve recipient and run filters", async () => {
  const admin = createAdmin({
    baseUrl,
    apiToken: "arky_api_message_delivery_contract",
  });
  const delivery = {
    id: "delivery-contract",
    scope: { type: "store", store_id: storeId },
    source: { type: "receipt_resend", automation_id: "automation-contract", order_id: "order-contract", request_id: "request-contract" },
    recipient_key: "buyer@example.test",
    request_retention: "prepared",
    claim: null,
    outcome: { type: "pending" },
    created_at: 1,
    updated_at: 1,
  };
  const calls = [];
  const responses = [{ items: [delivery], cursor: null }, delivery, delivery];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method });
    return jsonResponse(responses.shift());
  };

  try {
    const page = await admin.notification.delivery.find({
      store_id: storeId,
      recipient: "buyer@example.test",
      run_id: "run-contract",
      limit: 25,
    });
    assert.deepEqual(page.items, [delivery]);
    assert.deepEqual(await admin.notification.delivery.get({ store_id: storeId, id: delivery.id }), delivery);
    assert.deepEqual(
      await admin.notification.delivery.stop({ store_id: storeId, id: delivery.id, expected_updated_at: 1 }),
      delivery,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${storeId}/message-deliveries?recipient=buyer%40example.test&run_id=run-contract&limit=25`,
      method: "GET",
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}/message-deliveries/${delivery.id}`,
      method: "GET",
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}/message-deliveries/${delivery.id}/stop`,
      method: "POST",
    },
  ]);
});

test("admin code login activates the same pending Account Session", async () => {
  const admin = createAdmin({ baseUrl, market: "us" });
  const calls = [];
  const responses = [
    {
      session_id: "session-client-contract",
      verification_expires_at: 900,
    },
    {
      id: sessionId,
      scope: { type: "account" },
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
    const verified = await admin.account.auth.verify({
      session_id: pending.session_id,
      code: "123456",
    });
    assert.deepEqual(verified.scope, { type: "account" });
    assert.deepEqual(admin.session, { id: sessionId, email: "operator@example.test", scope: { type: "account" } });
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
  const admin = createAdmin({ baseUrl, market: "us" });
  const invitationStoreId = otherStoreId;
  const calls = [];
  const responses = [
    {
      session_id: "session-invitation-contract",
      verification_expires_at: 900,
    },
    {
      id: "0b8e4d27-5f13-4a69-9c2e-7d1a6f3b8e40",
      scope: { type: "account" },
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
    const verified = await admin.account.auth.storeVerify(invitationStoreId, {
      session_id: pending.session_id,
      code: "123456",
    });
    assert.deepEqual(verified.scope, { type: "account" });
    await assert.rejects(async () => admin.account.auth.storeCode("store-invitation-contract", { email: "invitee@example.test" }), TypeError);
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
  const admin = createAdmin({ baseUrl, market: "us" });
  const calls = [];
  const issued = {
    id: sessionId,
    scope: { type: "store", store_id: storeId },
    access_token: "access-previous",
    refresh_token: "refresh-previous",
    access_expires_at: 1_000,
    refresh_expires_at: 3_000,
    authenticated_at: 500,
    created_at: 500,
    updated_at: 500,
  };
  const response = {
    id: sessionId,
    scope: { type: "store", store_id: storeId },
    access_token: "access-rotated",
    refresh_token: "refresh-rotated",
    access_expires_at: 2_000,
    refresh_expires_at: 3_000,
    authenticated_at: 500,
    created_at: 500,
    updated_at: 1_000,
  };
  const responses = [issued, response];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: JSON.parse(String(init.body)),
    });
    return jsonResponse(responses.shift());
  };

  let result;
  try {
    await admin.account.auth.storeVerify(storeId, { session_id: "pending-session", code: "123456" });
    await assert.rejects(admin.account.auth.refresh({ refresh_token: "refresh-unknown" }), /Account session changed/);
    assert.equal(calls.length, 1);
    result = await admin.account.auth.refresh({
      refresh_token: "refresh-previous",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(result, response);
  assert.equal(result.authenticated_at, 500);
  assert.deepEqual(result.scope, { type: "store", store_id: storeId });
  assert.deepEqual(admin.session, { id: sessionId, email: undefined, scope: { type: "store", store_id: storeId } });
  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${storeId}/auth/verify`,
      method: "POST",
      body: { session_id: "pending-session", code: "123456" },
    },
    {
      url: `${baseUrl}/v1/auth/refresh`,
      method: "POST",
      body: { refresh_token: "refresh-previous" },
    },
  ]);
});

test("request errors preserve the server response while normalizing validation details", async () => {
  const admin = createAdmin({ baseUrl, market: "us" });
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

test("admin Store methods keep billing and optional contact email independent", async () => {
  const admin = createAdmin({
    baseUrl,
    apiToken: "arky_api_admin_contract",
  });
  const store = {
    id: storeId,
    name: "Client Contract",
    billing_email: "owner@example.test",
    contact_email: null,
    publishable_key: publishableKey,
    default_sales_channel_id: "channel-storefront",
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
        billing_email: "owner@example.test",
        contact_email: "contact@example.test",
        timezone: "Europe/Sarajevo",
        default_language: "en",
        supported_languages: ["en", "bs"],
      }),
      store,
    );
    await admin.store.update({
      id: storeId,
      name: "Client Contract",
      billing_email: "owner@example.test",
      contact_email: null,
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
        billing_email: "owner@example.test",
        contact_email: "contact@example.test",
        timezone: "Europe/Sarajevo",
        default_language: "en",
        supported_languages: ["en", "bs"],
      },
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}`,
      method: "PUT",
      body: {
        name: "Client Contract",
        billing_email: "owner@example.test",
        contact_email: null,
        default_language: "en",
        supported_languages: ["en", "bs"],
      },
    },
  ]);
});

test("admin Store deletion returns the exact physical-deletion result", async () => {
  const admin = createAdmin({
    baseUrl,
    market: "us",
  });
  const deletionResult = {
    success: true,
    store_id: storeId,
  };
  let call;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    call = {
      url: String(url),
      method: init.method,
      body: JSON.parse(String(init.body)),
    };
    return jsonResponse(deletionResult);
  };

  try {
    assert.deepEqual(
      await admin.store.requestDeletion({ id: storeId, confirmation: "Client Contract" }),
      deletionResult,
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
  const admin = createAdmin({ baseUrl, market: "bih" });
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
    await admin.store.location.create({ store_id: storeId, key: "main", address, timezone: "Europe/Sarajevo", allows_pickup: false });
    await admin.store.location.update({
      store_id: storeId,
      id: "location-contract",
      allows_pickup: true,
    });
    await admin.store.webhook.create({
      store_id: storeId,
      url: "https://events.example.test/hook",
      events: [{ type: "customer.archived" }],
      headers: {},
      secret: "s".repeat(32),
      status: { type: "disabled" },
    });
    await admin.store.webhook.update({
      store_id: storeId,
      id: "webhook-contract",
      status: { type: "active" },
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
        body: { key: "main", address, timezone: "Europe/Sarajevo", allows_pickup: false },
      },
      {
        url: `/v1/stores/${storeId}/locations/location-contract`,
        method: "PUT",
        body: {
          allows_pickup: true,
        },
      },
      {
        url: `/v1/stores/${storeId}/webhooks`,
        method: "POST",
        body: {
          url: "https://events.example.test/hook",
          events: [{ type: "customer.archived" }],
          headers: {},
          secret: "s".repeat(32),
          status: { type: "disabled" },
        },
      },
      {
        url: `/v1/stores/${storeId}/webhooks/webhook-contract`,
        method: "PUT",
        body: { status: { type: "active" } },
      },
    ],
  );
});

test("Admin Market and Payment Option APIs retain merchant configurations and explicit Market allowlists", async () => {
  const admin = createAdmin({
    baseUrl,
    apiToken: "arky_api_admin_contract",
  });
  const cashProvider = {
    id: "2f0a5d3c-9a1e-4b7e-8f4c-6c2a1b3d5e70",
    store_id: storeId,
    type: { type: "cash_on_delivery" },
    key: "payment", blocks: [], status: { type: "active" },
    created_at: 1,
    updated_at: 1,
  };
  const stripeProvider = {
    id: "5b8c1e47-3d29-4a6f-9c15-7e0d2f4a8b31",
    store_id: storeId,
    type: {
      type: "stripe",
      connection: {
        type: "configured",
        configuration: {
          account_id: "acct_merchant", livemode: false, publishable_key: "pk_test_merchant",
          account_observed_at: 2, charges_enabled: true, webhook: { type: "unconfigured" },
        },
      },
    },
    key: "payment", blocks: [], status: { type: "active" },
    created_at: 1,
    updated_at: 2,
  };
  const market = {
    id: "9c1d5e83-4a27-4f60-b8e2-6d3a0f7c1b94",
    store_id: storeId,
    key: "bih",
    currency: "bam",
    tax_mode: "inclusive",
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
  };
  const allowed = {
    id: "e5a8c2d7-3b91-4f06-9d4e-1c7b6a0f3e28",
    store_id: storeId,
    market_id: market.id,
    payment_option_id: stripeProvider.id,
    status: { type: "active" },
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
    if (String(url).endsWith("/payment-options")) return jsonResponse({ items: [cashProvider, stripeProvider], cursor: null });
    if (String(url).includes("/market-payment-options")) return jsonResponse(allowed);
    return jsonResponse(market);
  };

  try {
    const providers = await admin.store.paymentOption.list({ store_id: storeId });
    assert.equal(providers.items[0].type.type, "cash_on_delivery");
    assert.equal(providers.items[1].type.connection.configuration.charges_enabled, true);
    assert.equal(providers.items[1].type.connection.configuration.account_id, "acct_merchant");
    assert.equal("connected_account_id" in providers.items[1].type.connection.configuration, false);
    assert.deepEqual(
      await admin.store.market.create({
        store_id: storeId,
        key: "bih",
        currency: "bam",
        tax_mode: "inclusive",
      }),
      market,
    );
    assert.deepEqual(
      await admin.store.marketPaymentOption.create({ store_id: storeId, market_id: market.id, payment_option_id: stripeProvider.id }),
      allowed,
    );
    assert.deepEqual(
      await admin.store.marketPaymentOption.lookup({ store_id: storeId, market_id: market.id, payment_option_id: stripeProvider.id }),
      allowed,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${storeId}/payment-options`,
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
      },
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}/market-payment-options`,
      method: "POST",
      body: { market_id: market.id, payment_option_id: stripeProvider.id },
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}/market-payment-options/lookup?market_id=${market.id}&payment_option_id=${stripeProvider.id}`,
      method: "GET",
      body: null,
    },
  ]);
});

test("admin cart update, quote, and checkout preserve one Payment Provider UUID", async () => {
  const admin = createAdmin({
    baseUrl,
    market: "bih",
    apiToken: "arky_api_admin_contract",
  });
  const paymentOptionId = "5b8c1e47-3d29-4a6f-9c15-7e0d2f4a8b31";
  const cartId = "c4f2a9e1-6b83-4d57-9e02-1a7c5d8f3b46";
  const orderId = "8a3e6f21-47bd-4c90-b5e3-0d7f19c4a8b2";
  const checkoutRequestId = "c4a8e1d2-7b93-4f6a-8c05-19d7f3b2e8a1";
  const presentationDigest = "e".repeat(64);
  const cart = {
    id: cartId,
    store_id: storeId,
    customer_id: "customer-contract",
    company: null,
    sales_channel_id: "channel-contract",
    status: { type: "converted", order_id: orderId, request_id: checkoutRequestId },
    origin: {
      type: "admin",
      actor: {
        account_id: "account-contract",
        snapshot: { email: "operator@example.com", credential_type: "api_token" },
      },
    },
    market_id: "market-bih",
    catalog_id: "catalog-bih",
    line_items: [],
    delivery_groups: [],
    billing_address: null,
    promotion_code_ids: [],
    purchase_order_number: null,
    item_count: 0,
    last_action_at: 1,
    abandoned_at: null,
    created_at: 1,
    updated_at: 2,
  };
  const quote = {
    sources: checkoutSources(cartId),
    presentation_digest: presentationDigest,
    order: {
    context: {},
    seller: {},
    timezone: "Europe/Sarajevo",
    payment_terms: null,
    purchase_order_number: null,
    locale: "en",
    presentation_digest: "f".repeat(64),
    delivery_quote_version: "v1",
    product_lines: [],
    booking_lines: [],
    digital_lines: [],
    subscription_lines: [],
    delivery_groups: [],
    payment_option_id: paymentOptionId,
    payment_option_ids: [paymentOptionId],
    money: null,
    },
  };
  const checkout = {
    order_id: orderId,
    number: "1001",
    payment_action: { type: "none" },
    payment: {
      id: "f17c0b95-2e4d-4a83-9b6c-31d5e8a70f24",
      store_id: storeId,
      order_id: orderId,
      payer: { type: "customer", customer_id: "customer-contract" },
      route: {
        type: "stripe_checkout",
        payment_option_id: paymentOptionId,
        checkout_expires_at: 10,
        checkout_session_id: "checkout-provider-contract",
        payment_intent_id: null,
      },
      status: { type: "requires_action" },
      checkout_expiration: null,
      amounts: {
        currency: "bam",
        total: 100,
        authorized: 0,
        captured: 0,
        capture_pending: 0,
        refund_pending: 0,
        refunded: 0,
      },
      request_id: "payment-request-contract",
      reconciliation: { type: "clear" },
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
    if (call.url.endsWith("/carts/accept")) return jsonResponse(checkout);
    if (call.url.endsWith(`/orders/${orderId}`)) return jsonResponse({ id: orderId, source: { type: "cart_acceptance", request_id: checkoutRequestId, submission_fingerprint: "a".repeat(64), initial_payment_id: checkout.payment.id, cart: quote.sources.cart, converted_lines: quote.sources.converted_lines } });
    if (call.url.endsWith("/quote")) return jsonResponse(quote);
    return jsonResponse(cart);
  };

  try {
    assert.equal(
      (await admin.eshop.cart.update({ store_id: storeId, id: cart.id })).status.order_id,
      orderId,
    );
    assert.equal(
      (await admin.eshop.cart.quote({ store_id: storeId, id: cart.id })).order.payment_option_id,
      paymentOptionId,
    );
    assert.equal(
      (
        await admin.eshop.order.getQuote({
          store_id: storeId,
          market: "bih",
        })
      ).order.payment_option_ids[0],
      paymentOptionId,
    );
    assert.equal(
      (
        await admin.eshop.cart.checkout({
          store_id: storeId,
          id: cart.id,
          request_id: checkoutRequestId,
          locale: "en",
          presentation_digest: presentationDigest,
          sources: quote.sources,
          payment_option_id: paymentOptionId,
          return_url: "https://admin.example.test/checkout/return",
        })
      ).payment.route.payment_option_id,
      paymentOptionId,
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
        body: {},
      },
      {
        url: `/v1/stores/${storeId}/carts/${cart.id}/quote`,
        method: "POST",
        body: { locale: "en" },
      },
      {
        url: `/v1/stores/${storeId}/orders/quote`,
        method: "POST",
        body: {
          line_items: [],
          delivery_groups: [],
          locale: "en",
          market: "bih",
        },
      },
      {
        url: `/v1/stores/${storeId}/carts/accept`,
        method: "POST",
        body: {
          request_id: checkoutRequestId,
          sources: quote.sources,
          locale: "en",
          presentation_digest: presentationDigest,
          payment_option_id: paymentOptionId,
          return_url: "https://admin.example.test/checkout/return",
        },
      },
      {
        url: `/v1/stores/${storeId}/orders/${orderId}`,
        method: "GET",
        body: null,
      },
    ],
  );
});

test("admin Order uses the embedded product-item route and canonical Customer filter", async () => {
  const admin = createAdmin({
    baseUrl,
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
    await admin.eshop.order.find({ store_id: storeId, customer_id: "customer-contract" });
    await admin.eshop.order.cancelProductItem({
      store_id: storeId,
      order_id: "order-contract",
      order_product_item_id: "order-product-item-contract",
      request_id: "3e8b1f64-9c27-4d50-a6e3-7b2d0c9f4a18",
      expected_updated_at: 1789990000000,
      units: [{ first_unit: 0, quantity: 1 }],
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
      body: {
        request_id: "3e8b1f64-9c27-4d50-a6e3-7b2d0c9f4a18",
        expected_updated_at: 1789990000000,
        units: [{ first_unit: 0, quantity: 1 }],
      },
    },
  ]);
});

test("product cancellation preserves exact units and revision through explicit retry and encodes owner IDs", async () => {
  const admin = createAdmin({ baseUrl, apiToken: "arky_api_admin_contract" });
  const request = {
    store_id: otherStoreId,
    order_id: "order/one",
    order_product_item_id: "line/one",
    request_id: "5c7a2e91-4f38-4b06-8d1c-9e3b6a0f2d47",
    expected_updated_at: 1789990000000,
    units: [{ first_unit: 1, quantity: 2 }, { first_unit: 5, quantity: 1 }],
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method, body: JSON.parse(init.body) });
    return jsonResponse(calls.length === 1 ? { message: "Response unavailable" } : { id: request.order_id }, calls.length === 1 ? 503 : 200);
  };
  try {
    await assert.rejects(admin.eshop.order.cancelProductItem(request), (error) => error.statusCode === 503);
    assert.equal(calls.length, 1);
    assert.deepEqual(await admin.eshop.order.cancelProductItem(request), { id: request.order_id });
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[1], calls[0]);
    assert.deepEqual(calls[0], {
      url: `${baseUrl}/v1/stores/${otherStoreId}/orders/order%2Fone/product-items/line%2Fone/cancel`,
      method: "POST",
      body: { request_id: request.request_id, expected_updated_at: request.expected_updated_at, units: request.units },
    });
    await assert.rejects(admin.eshop.order.cancelProductItem({ ...request, request_id: "cancellation-command" }), TypeError);
    await assert.rejects(admin.eshop.order.cancelProductItem({ ...request, store_id: "store/one" }), TypeError);
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("admin market deletion preserves the version and accepted Deleting response without a default replacement", async () => {
  const admin = createAdmin({
    baseUrl,
    apiToken: "arky_api_admin_contract",
  });
  let call;
  const deleting = {
    id: "market-old",
    status: { type: "deleting" },
    updated_at: 1788862721001,
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    call = { url: String(url), method: init.method };
    return jsonResponse(deleting, 202);
  };

  try {
    assert.deepEqual(
      await admin.store.market.delete({
        store_id: storeId,
        id: "market-old",
        expected_updated_at: 1788862721000,
      }),
      deleting,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(call, {
    url: `${baseUrl}/v1/stores/${storeId}/markets/market-old?expected_updated_at=1788862721000`,
    method: "DELETE",
  });
});

test("Category is top-level and uses the renamed Admin and storefront routes", async () => {
  const admin = createAdmin({ baseUrl, market: "us" });
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
    if (target.endsWith("/children")) return jsonResponse({ items: [], cursor: null });
    if ((init.method || "GET") === "DELETE") return jsonResponse(true);
    if (target.includes("?status=active")) {
      return jsonResponse({ items: [], cursor: null });
    }
    return jsonResponse({
      id: "category-contract",
      store_id: storeId,
      key: "topics",
      parent_id: null,
      schema: [],
      status: { type: "active" },
      created_at: 1,
      updated_at: 1,
    });
  };

  try {
    assert.equal("category" in admin.content, false);
    assert.equal("category" in storefront.content, false);
    await admin.category.create({ store_id: storeId, key: "topics", schema: [] });
    await admin.category.update({
      store_id: storeId,
      id: "category-contract",
      key: "subjects",
    });
    await admin.category.get({ store_id: storeId, id: "category-contract" });
    await admin.category.find({ store_id: storeId, status: "active" });
    await storefront.category.get({ key: "topics" });
    await storefront.category.getChildren({
      id: "category-contract",
    });
    assert.equal(
      await admin.category.delete({ store_id: storeId, id: "category-contract" }),
      true,
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
        url: `/v1/stores/${storeId}/categories`,
        method: "POST",
        body: { key: "topics", schema: [] },
      },
      {
        url: `/v1/stores/${storeId}/categories/category-contract`,
        method: "PUT",
        body: { key: "subjects" },
      },
      {
        url: `/v1/stores/${storeId}/categories/category-contract`,
        method: "GET",
        body: null,
      },
      {
        url: `/v1/stores/${storeId}/categories?status=active`,
        method: "GET",
        body: null,
      },
      {
        url: "/v1/storefront/categories/topics",
        method: "GET",
        body: null,
      },
      {
        url: "/v1/storefront/categories/category-contract/children",
        method: "GET",
        body: null,
      },
      {
        url: `/v1/stores/${storeId}/categories/category-contract`,
        method: "DELETE",
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

test("admin Product writes and InventoryLevel reads preserve backorders and set-aside stock", async () => {
  const admin = createAdmin({ baseUrl, market: "us" });
  const create = {
    key: "canonical-product",
    slugs: { en: "canonical-product" },
    blocks: [{ id: "name-contract", key: "name", type: "text", value: "Product" }],
    categories: [],
  };
  const product = {
    id: "product-contract",
    store_id: storeId,
    key: create.key,
    slugs: create.slugs,
    blocks: create.blocks,
    categories: [],
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
  };
  const update = {
    id: product.id,
    expected_updated_at: product.updated_at,
    slugs: { en: "canonical-product-updated" },
    status: { type: "draft" },
  };
  const inventory = [
    {
      id: "inventory-contract",
      store_id: storeId,
      inventory_item_id: "item-contract",
      store_location_id: "location-contract",
      on_hand: 12,
      reserved: 13,
      unavailable: 2,
      available: -3,
      created_at: 1,
      updated_at: 2,
    },
  ];
  const updatedProduct = {
    ...product,
    slugs: update.slugs,
    status: update.status,
    updated_at: 2,
  };
  const calls = [];
  const responses = [product, updatedProduct, { items: inventory, cursor: null }];
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
    created = await admin.eshop.product.create({ store_id: storeId, ...create });
    updated = await admin.eshop.product.update({ store_id: storeId, ...update });
    loadedInventory = await admin.eshop.inventoryLevel.find({ store_id: storeId, inventory_item_id: "item-contract", store_location_id: "location-contract" });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(created, product);
  assert.deepEqual(updated, updatedProduct);
  assert.deepEqual(loadedInventory, { items: inventory, cursor: null });
  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${storeId}/products`,
      method: "POST",
      body: create,
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}/products/${product.id}`,
      method: "PUT",
      body: (({ id: _id, ...body }) => body)(update),
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}/inventory-levels?inventory_item_id=item-contract&store_location_id=location-contract`,
      method: "GET",
      body: null,
    },
  ]);
});

test("storefront variant read carries the exact product and buyer context", async () => {
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
    await storefront.eshop.productVariant.get({ product_id: "lean-product", id: "variant-one", company_id: "company-one", company_location_id: "branch-one", include_price: true });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    call.url,
    `${baseUrl}/v1/storefront/products/lean-product/variants/variant-one?company_id=company-one&company_location_id=branch-one&include_price=true`,
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
  const price = {
    unit_price: { amount: 0, currency: "eur" },
    compare_at: null,
    billing: { type: "one_time" },
    min_quantity: 1,
    max_quantity: null,
    priced_at: 1,
  };

  assert.equal(storefront.utils.getPriceAmount(price), 0);
  assert.notEqual(storefront.utils.formatPrice(price), "");
  assert.equal(storefront.utils.getPriceAmount(null), null);
  assert.equal(storefront.utils.formatPrice(null), "");
  assert.equal(
    storefront.utils.getPriceAmount({
      ...price,
      unit_price: { amount: -1, currency: "eur" },
    }),
    null,
  );
  assert.equal(
    storefront.utils.getPriceAmount({
      ...price,
      unit_price: { amount: 1.5, currency: "eur" },
    }),
    null,
  );
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
