import assert from "node:assert/strict";
import { checkoutSources } from "./helpers/checkout-sources.mjs";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createAdmin, SDK_VERSION } from "../dist/index.js";
import { createStorefront } from "../dist/storefront.js";

const baseUrl = "https://api.example.test";
const storeId = "store-client-contract";
const publishableKey = `arky_pk_${"k".repeat(43)}`;

function storedVisitorSession(token, customerId = "customer-client-contract") {
  return JSON.stringify({
    version: 2,
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
  const admin = createAdmin({ baseUrl, storeId, apiToken: "arky_api_admin_contract" });
  const calls = [];
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), headers: new Headers(init.headers) });
    return jsonResponse({ id: storeId });
  };
  assert.equal(admin.getMarket(), undefined);
  await admin.store.get({ id: storeId });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${baseUrl}/v1/stores/${storeId}`);
  assert.equal(calls[0].headers.has("X-Arky-Market"), false);
  admin.setMarket("bih");
  assert.equal(admin.getMarket(), "bih");
});

test("workflow external-operation audit routes preserve execution scope", async () => {
  const admin = createAdmin({
    baseUrl,
    storeId,
    apiToken: "arky_api_workflow_operation_contract",
  });
  const operation = {
    id: "operation-contract",
    store_id: storeId,
    workflow_id: "workflow-contract",
    execution_id: "execution-contract",
    node_id: "http_1",
    iteration_key: "root",
    type: "http_mutation",
    status: { type: "succeeded" },
    requested_at: 1,
    processing_started_at: 2,
    completed_at: 3,
    result: { type: "provider", provider_status: 200 },
    error: null,
    updated_at: 3,
  };
  const calls = [];
  const responses = [{ items: [operation], cursor: null }, operation];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method });
    return jsonResponse(responses.shift());
  };

  try {
    const page = await admin.workflow.listExternalOperations({
      workflow_id: operation.workflow_id,
      execution_id: operation.execution_id,
      limit: 25,
    });
    assert.deepEqual(page.items, [operation]);
    assert.deepEqual(
      await admin.workflow.getExternalOperation({
        workflow_id: operation.workflow_id,
        execution_id: operation.execution_id,
        operation_id: operation.id,
      }),
      operation,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${storeId}/workflows/${operation.workflow_id}/executions/${operation.execution_id}/external-operations?limit=25`,
      method: "GET",
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}/workflows/${operation.workflow_id}/executions/${operation.execution_id}/external-operations/${operation.id}`,
      method: "GET",
    },
  ]);
});

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
    scope: { type: "store", store_id: storeId },
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
  assert.deepEqual(result.scope, { type: "store", store_id: storeId });
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

test("admin Store methods keep billing and optional contact email independent", async () => {
  const admin = createAdmin({
    baseUrl,
    storeId,
    apiToken: "arky_api_admin_contract",
  });
  const store = {
    id: storeId,
    name: "Client Contract",
    billing_email: "owner@example.test",
    contact_email: null,
    publishable_key: publishableKey,
    default_market_id: "market-bih",
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
        id: storeId,
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
    storeId,
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
      await admin.store.requestDeletion({ confirmation: "Client Contract" }),
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
      status: { type: "disabled" },
    });
    await admin.store.buildHook.update({
      store_id: storeId,
      id: "build-hook-contract",
      status: { type: "active" },
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
          status: { type: "disabled" },
        },
      },
      {
        url: `/v1/stores/${storeId}/build-hooks/build-hook-contract`,
        method: "PUT",
        body: { status: { type: "active" } },
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
    status: { type: "active" },
    payment_provider_ids: [cashProvider.id, stripeProvider.id],
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
  const paymentProviderId = "5b8c1e47-3d29-4a6f-9c15-7e0d2f4a8b31";
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
    status: { type: "converted", order_id: orderId, command_id: checkoutRequestId },
    origin: {
      type: "admin",
      actor: {
        account_id: "account-contract",
        snapshot: { email: "operator@example.com", credential_type: "api_token" },
      },
    },
    market_id: "market-bih",
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
    invoice_policy: { type: "external" },
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
    payment_provider_id: paymentProviderId,
    payment_provider_ids: [paymentProviderId],
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
      payer_customer_id: "customer-contract",
      provider: {
        type: "stripe_checkout",
        payment_provider_id: paymentProviderId,
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
    if (call.url.endsWith(`/orders/${orderId}`)) return jsonResponse({ id: orderId, source: { type: "cart_acceptance", command_id: checkoutRequestId, carts: quote.sources.carts, bindings: quote.sources.lines } });
    if (call.url.endsWith("/quote")) return jsonResponse(quote);
    return jsonResponse(cart);
  };

  try {
    assert.equal(
      (await admin.eshop.cart.update({ id: cart.id })).status.order_id,
      orderId,
    );
    assert.equal(
      (await admin.eshop.cart.quote({ id: cart.id })).order.payment_provider_id,
      paymentProviderId,
    );
    assert.equal(
      (
        await admin.eshop.order.getQuote({
          market: "bih",
        })
      ).order.payment_provider_ids[0],
      paymentProviderId,
    );
    assert.equal(
      (
        await admin.eshop.cart.checkout({
          id: cart.id,
          request_id: checkoutRequestId,
          locale: "en",
          presentation_digest: presentationDigest,
          sources: quote.sources,
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
          payment_provider_id: paymentProviderId,
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
      command_id: "cancellation-command",
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
        command_id: "cancellation-command",
        expected_updated_at: 1789990000000,
        units: [{ first_unit: 0, quantity: 1 }],
      },
    },
  ]);
});

test("product cancellation preserves exact units and revision through explicit retry and encodes owner IDs", async () => {
  const admin = createAdmin({ baseUrl, storeId, apiToken: "arky_api_admin_contract" });
  const request = {
    store_id: "store/one",
    order_id: "order/one",
    order_product_item_id: "line/one",
    command_id: "cancellation-command",
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
      url: `${baseUrl}/v1/stores/store%2Fone/orders/order%2Fone/product-items/line%2Fone/cancel`,
      method: "POST",
      body: { command_id: request.command_id, expected_updated_at: request.expected_updated_at, units: request.units },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("admin market deletion preserves the version, replacement and accepted Deleting response", async () => {
  const admin = createAdmin({
    baseUrl,
    storeId,
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
        id: "market-old",
        expected_updated_at: 1788862721000,
        replacement_default_market_id: "market-next",
      }),
      deleting,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(call, {
    url: `${baseUrl}/v1/stores/${storeId}/markets/market-old?expected_updated_at=1788862721000&replacement_default_market_id=market-next`,
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
    if (target.endsWith("/children")) return jsonResponse({ items: [], cursor: null });
    if ((init.method || "GET") === "DELETE") return jsonResponse(true);
    if (target.includes("?status=active")) {
      return jsonResponse({ items: [], cursor: null });
    }
    return jsonResponse({
      id: "classification-contract",
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
    assert.equal("classification" in admin.content, false);
    assert.equal("classification" in storefront.content, false);
    await admin.classification.create({ key: "topics", schema: [] });
    await admin.classification.update({
      id: "classification-contract",
      key: "subjects",
    });
    await admin.classification.get({ id: "classification-contract" });
    await admin.classification.find({ status: "active" });
    await storefront.classification.get({ key: "topics" });
    await storefront.classification.getChildren({
      id: "classification-contract",
    });
    assert.equal(
      await admin.classification.delete({ id: "classification-contract" }),
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
        url: `/v1/stores/${storeId}/classifications`,
        method: "POST",
        body: { key: "topics", schema: [] },
      },
      {
        url: `/v1/stores/${storeId}/classifications/classification-contract`,
        method: "PUT",
        body: { key: "subjects" },
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
      {
        url: `/v1/stores/${storeId}/classifications/classification-contract`,
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

test("admin Product writes and ProductInventory reads use the canonical wire fields", async () => {
  const admin = createAdmin({ baseUrl, storeId, market: "us" });
  const create = {
    key: "canonical-product",
    slugs: { en: "canonical-product" },
    blocks: [{ id: "name-contract", key: "name", type: "text", value: "Product" }],
    classifications: [],
  };
  const product = {
    id: "product-contract",
    store_id: storeId,
    key: create.key,
    slugs: create.slugs,
    blocks: create.blocks,
    classifications: [],
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
      reserved: 3,
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
    created = await admin.eshop.product.create(create);
    updated = await admin.eshop.product.update(update);
    loadedInventory = await admin.eshop.inventoryLevel.find({ inventory_item_id: "item-contract", store_location_id: "location-contract" });
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
      body: update,
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
