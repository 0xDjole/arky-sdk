import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";

const baseUrl = "https://api.example.test";
const defaultStoreId = "store-contract";
const resourceId = "018f477d-1cae-7c12-bf12-123456789abc";
const itemPercentageDiscountId = "86b7bf60-67e8-4c92-b14c-e98f4b2f4101";
const itemFixedDiscountId = "fca5ba8e-86af-4dd8-a1cd-6d19bca62e12";
const shippingDiscountId = "d8b35cf1-6867-49b0-863d-fdc1a6a6e6dc";
const audienceDiscountId = "ac4425e9-c3ee-4b85-820c-7c8d9314d034";
const newShippingDiscountId = "467e9608-2b42-479a-8c5b-d9152fbb7870";
const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function storedVisitorSession(
  token,
  customerId = "customer-provider-contract",
) {
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

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function admin() {
  return createAdmin({
    baseUrl,
    storeId: defaultStoreId,
    apiToken: "contract-token",
  });
}

async function captureFetch(responseBody, request) {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: init.body === undefined ? undefined : JSON.parse(init.body),
    });
    return jsonResponse(responseBody);
  };

  try {
    return { calls, result: await request() };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("Checkout quote preserves per-unit promotion/manual provenance and delivery money", async () => {
  const address = {
    street1: "1 Main Street",
    city: "Boston",
    postal_code: "02108",
    country: "US",
  };
  const taxAssessment = {
    type: "assessed",
    assessment: {
      tax_mode: "exclusive",
      treatment: { type: "not_collecting", reason_code: "not_registered" },
      address_basis: { type: "delivery" },
      address,
      location_evidence: [],
      source: {
        type: "arky_rule",
        market_zone_id: "zone",
        tax_rule_id: "rule",
        tax_category_id: null,
        tax_category_key: null,
      },
      policy_version: "policy",
      rounding_version: "rounding",
      assessed_at: 1,
      tax_date: 1,
      buyer_evidence: null,
    },
  };
  const lineMoney = {
    unit_price: 2_000,
    subtotal: 2_000,
    discount_allocations: [
      {
        id: "item-promotion-allocation",
        source: {
          type: "promotion",
          promotion_id: "promotion",
          effect_id: itemPercentageDiscountId,
          promotion_code_id: null,
        },
        amount: 200,
      },
      {
        id: "item-manual-allocation",
        source: {
          type: "manual",
          actor: {
            account_id: "operator",
            snapshot: {
              email: "operator@example.test",
              credential_type: "api_token",
            },
          },
          reason: "Accepted adjustment",
        },
        amount: 50,
      },
    ],
    discount_total: 250,
    tax_lines: [],
    tax_total: 0,
    duty_lines: [],
    duty_total: 0,
    tax_assessment: taxAssessment,
    total: 1_750,
  };
  const shippingMoney = {
    unit_price: 500,
    subtotal: 500,
    discount_allocations: [
      {
        id: "shipping-allocation",
        source: {
          type: "promotion",
          promotion_id: "promotion",
          effect_id: shippingDiscountId,
          promotion_code_id: null,
        },
        amount: 100,
      },
    ],
    discount_total: 100,
    tax_lines: [],
    tax_total: 0,
    duty_lines: [],
    duty_total: 0,
    tax_assessment: taxAssessment,
    total: 400,
  };
  const quote = {
    context: {
      market_id: "market",
      market_snapshot: {
        key: "us",
        currency: "usd",
        tax_mode: "exclusive",
        source_market_id: "market",
      },
      sales_channel_id: "channel",
      sales_channel_snapshot: {
        key: "web",
        name: "Web",
        source_sales_channel_id: "channel",
      },
      customer_id: "customer",
      customer_snapshot: {
        email: null,
        authentication: null,
        source_customer_id: "customer",
        source_email_identity_id: null,
      },
      company_id: null,
      company_location_id: null,
      company_snapshot: null,
      company_location_snapshot: null,
      origin: {
        type: "admin",
        actor: {
          account_id: "operator",
          snapshot: {
            email: "operator@example.test",
            credential_type: "api_token",
          },
        },
      },
    },
    seller: {
      profile: { legal_name: "Seller", registration_number: null, tax_registrations: [], address },
      configuration_digest: "a".repeat(64),
    },
    invoice_policy: { type: "external" },
    timezone: "UTC",
    payment_terms: null,
    purchase_order_number: null,
    locale: "en",
    presentation_digest: "b".repeat(64),
    delivery_quote_version: "v1",
    product_lines: [
      {
        line_item_id: "cart-line",
        product_id: "product-contract",
        variant_id: "variant-contract",
        quantity: 1,
        money: {
          subtotal: 2000,
          discount_total: 250,
          tax_total: 0,
          duty_total: 0,
          total: 1750,
        },
        money_runs: [
          {
            span: { first_unit: 0, quantity: 1 },
            delivery_group_id: "delivery",
            per_unit: lineMoney,
          },
        ],
        snapshot: {
          product_key: "product-contract",
          variant_sku: null,
          variant_attributes: [],
          price: {
            unit_price: { amount: 2_000, currency: "usd" },
            tax_mode: "exclusive",
            compare_at: null,
            min_quantity: 1,
            max_quantity: null,
            source: { type: "base", price_id: "price" },
            priced_at: 1,
          },
          source_product_id: "product-contract",
          source_variant_id: "variant-contract",
          fulfillment: {
            type: "physical",
            shipping_profile_id: "profile",
            shipping_profile_key: "default",
            source_shipping_profile_id: "profile",
            backorder: { type: "disallow" },
            inventory_requirements: [
              {
                inventory_item_id: "component",
                inventory_item_key: "component",
                source_inventory_item_id: "component",
                quantity: 1,
                physical: { weight_grams: 100, dimensions: null },
                customs: {
                  origin_country: "US",
                  hs_code: null,
                  material: null,
                },
                tracking: { type: "tracked" },
                sku: null,
                barcode: null,
              },
            ],
          },
        },
      },
    ],
    booking_lines: [],
    digital_lines: [],
    subscription_lines: [],
    delivery_groups: [
      {
        cart_delivery_group_id: "delivery",
        shipping_profile_id: "profile",
        shipping_profile_key: "default",
        selected_market_zone_id: "zone",
        destination: { type: "delivery", address },
        units: [
          {
            cart_delivery_group_id: "delivery",
            line_item: { type: "product", line_item_id: "cart-line" },
            unit_span: { first_unit: 0, quantity: 1 },
          },
        ],
        rental_items: [],
        selected_shipping_rate_id: "rate",
        offers: [
          {
            shipping_rate_id: "rate",
            shipping_method_id: "method",
            shipping_method_key: "standard",
            content: [
              { id: "name", key: "name", type: "text", value: "Standard" },
            ],
            tax_category_id: null,
            delivery_estimate: null,
            pricing: {
              type: "calculated",
              pricing: {
                source_shipping_method_id: "method",
                source_shipping_profile_id: "profile",
                selected_market_zone_id: "zone",
                source: {
                  type: "shipping_rate",
                  source_shipping_rate_id: "rate",
                  merchandise_basis: { amount: 1750, currency: "usd" },
                  weight_grams: 100,
                  calculation: {
                    type: "flat",
                    amount: { amount: 500, currency: "usd" },
                  },
                  free_above_subtotal: null,
                },
                policy_digest: "policy",
                customer_subtotal: { amount: 500, currency: "usd" },
                accepted_at: 1,
                rounding_version: "arky-shipping-half-up-v1",
              },
            },
          },
        ],
        money: shippingMoney,
      },
    ],
    payment_option_id: "payment-option-contract",
    payment_option_ids: ["payment-option-contract"],
    money: {
      currency: "usd",
      subtotal: 2_000,
      delivery: 500,
      discount: 350,
      tax_total: 0,
      duty_total: 0,
      total: 2_150,
      promotions: [],
    },
  };
  const response = {
    sources: null,
    order: quote,
    presentation_digest: "c".repeat(64),
  };
  const { result } = await captureFetch(response, () =>
    admin().eshop.order.getQuote({
      market: "us",
      locale: "en",
      line_items: [
        {
          type: "product",
          product_id: "product-contract",
          variant_id: "variant-contract",
          quantity: 1,
        },
      ],
    }),
  );
  assert.deepEqual(result, response);
  const product = result.order.product_lines[0];
  const allocations = product.money_runs[0].per_unit.discount_allocations;

  assert.equal(allocations[0].source.effect_id, itemPercentageDiscountId);
  assert.equal(allocations[0].source.promotion_code_id, null);
  assert.equal(
    result.order.delivery_groups[0].money.discount_allocations[0].source
      .effect_id,
    shippingDiscountId,
  );
  assert.equal("discount_application_id" in allocations[0], false);
  assert.equal(allocations[1].source.type, "manual");
  assert.equal(allocations[1].source.reason, "Accepted adjustment");
  assert.equal(
    product.money.total + result.order.delivery_groups[0].money.total,
    result.order.money.total,
  );
  assert.equal("unit_price" in product.money, false);
  assert.equal("promotion_discount_id" in allocations[0], false);
  assert.equal("shipping_lines" in result.order, false);
});

test("subscription selection returns its ephemeral Stripe action in one POST", async () => {
  const subscription = {
    id: "d397ff50-690b-4da7-9fb9-17740e535d69",
    store_id: "store-subscription",
    plan_access: null,
    status: { type: "pending" },
    operation: null,
    checkout: {
      id: "018f477d-1cae-4c12-bf12-123456789abc",
      plan_id: "pro",
      stripe_price_id: "price_pro",
      stripe_customer_id: null,
      trial_end: null,
      expires_at: 1_800_000_000_000,
      status: { type: "open", stripe_checkout_session_id: "cs_subscription" },
      requested_at: 1,
      updated_at: 2,
    },
    payment_action: {
      type: "stripe_embedded_checkout",
      publishable_key: "pk_test_subscription",
      client_secret: "cs_subscription_secret_exact",
      stripe_account_id: null,
      expires_at: 1_800_000_000_000,
    },
    trial_started_at: null,
    created_at: 1,
    updated_at: 2,
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: init.body === undefined ? undefined : JSON.parse(init.body),
    });
    return jsonResponse(subscription);
  };
  let result;
  try {
    result = await admin().store.subscription.select({
      store_id: "store-subscription",
      plan_id: "pro",
      return_url: "https://merchant.test/return",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    `${baseUrl}/v1/stores/store-subscription/subscription`,
  );
  assert.equal(calls[0].method, "POST");
  assert.match(calls[0].body.checkout_id, uuidV4Pattern);
  assert.equal(calls[0].body.plan_id, "pro");
  assert.equal(calls[0].body.return_url, "https://merchant.test/return");
  assert.deepEqual(result, subscription);
  assert.deepEqual(result.status, { type: "pending" });
  assert.equal(result.operation, null);
  assert.equal("provider" in result, false);
  assert.equal("checkout_id" in result, false);
  assert.equal("payment" in result, false);
});

test("subscription reads return no payment action", async () => {
  const subscription = {
    id: "d397ff50-690b-4da7-9fb9-17740e535d69",
    store_id: "store-subscription",
    plan_access: {
      plan_id: "pro",
      started_at: 1,
      access_until: null,
    },
    status: { type: "active" },
    checkout: null,
    operation: null,
    payment_action: { type: "none" },
    trial_started_at: null,
    created_at: 1,
    updated_at: 2,
  };
  const { calls, result } = await captureFetch(subscription, () =>
    admin().store.subscription.get({ store_id: "store-subscription" }),
  );

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/store-subscription/subscription`,
      method: "GET",
      body: undefined,
    },
  ]);
  assert.deepEqual(result, subscription);
});

test("the permanent payment-option binding has no delete operation", () => {
  assert.equal("delete" in admin().store.paymentOption, false);
});

test("Stripe Express Dashboard uses one authenticated provider link request", async () => {
  const { calls, result } = await captureFetch(
    { dashboard_url: "https://connect.stripe.test/express/link" },
    () =>
      admin().store.paymentOption.stripe.openDashboard({
        store_id: "store-dashboard",
        id: "provider-contract",
      }),
  );

  assert.deepEqual(result, {
    dashboard_url: "https://connect.stripe.test/express/link",
  });
  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/store-dashboard/payment-options/stripe/provider-contract/dashboard`,
      method: "POST",
      body: {},
    },
  ]);
});

test("storefront support keeps its capability token in one forced header on the connected Store", async () => {
  const supportToken = "a".repeat(64);
  const publishableKey = `arky_pk_${"s".repeat(43)}`;
  const visitorToken = `customer_visitor_${"a".repeat(64)}`;
  const customerId = "customer-provider-contract";
  const customerSessionId = `session-${customerId}`;
  const storefront = createStorefront(publishableKey, {
    apiUrl: baseUrl,
    sessionStorage: {
      getItem: () => storedVisitorSession(visitorToken),
      setItem() {},
      removeItem() {},
    },
  });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      headers: init.headers,
      body: init.body === undefined ? undefined : JSON.parse(init.body),
    });
    if (calls.length === 1) {
      return jsonResponse({
        conversation: {
          id: "conversation-contract",
          customer_id: customerId,
          customer_session_id: customerSessionId,
          status: { type: "active" },
        },
        messages: [],
        support_token: supportToken,
        messages_cursor: null,
      });
    }
    return jsonResponse({
      conversation: {
        id: "conversation-contract",
        customer_id: customerId,
        customer_session_id: customerSessionId,
        status: { type: "active" },
      },
      messages: [
        {
          id: resourceId,
          conversation_id: "conversation-contract",
          role: "user",
          content: "Help",
          metadata: {},
          ai_response_status: null,
        },
      ],
    });
  };

  try {
    const started = await storefront.support.startConversation({
      agent_key: "default",
      channel_metadata: { source: "provider-contract" },
    });
    assert.equal(started.support_token, supportToken);
    assert.equal(started.conversation.customer_id, customerId);
    assert.equal(started.conversation.customer_session_id, customerSessionId);
    await storefront.support.sendMessage(
      {
        conversation_id: "conversation-contract",
        support_token: supportToken,
        message_id: resourceId,
        input: { type: "text", content: "Help" },
      },
      {
        headers: {
          "x-arky-support-token": "caller-must-not-override",
          "X-Test-Header": "preserved",
        },
      },
    );
    await storefront.support.getConversation(
      {
        conversation_id: "conversation-contract",
        support_token: supportToken,
        message_limit: 25,
      },
      { headers: { "X-Arky-Support-Token": "caller-must-not-override" } },
    );
    await assert.rejects(
      storefront.support.getConversation({
        conversation_id: "conversation-contract",
        support_token: supportToken.toUpperCase(),
      }),
      /lowercase hexadecimal token/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls.length,
    3,
    "invalid support credentials must execute no HTTP request",
  );
  assert.deepEqual(calls[0].body, {
    agent_key: "default",
    channel_metadata: { source: "provider-contract" },
  });
  assert.equal(calls[0].url, `${baseUrl}/v1/storefront/support/conversations`);
  assert.equal(
    Object.keys(calls[0].headers).some(
      (name) => name.toLowerCase() === "x-arky-support-token",
    ),
    false,
  );
  assert.equal("support_token" in calls[1].body, false);
  assert.deepEqual(calls[1].body, {
    conversation_id: "conversation-contract",
    message_id: resourceId,
    input: { type: "text", content: "Help" },
  });
  assert.equal(calls[1].url.includes(supportToken), false);
  assert.equal(calls[2].url.includes(supportToken), false);
  assert.equal(calls[2].url.includes("store_id="), false);
  assert.equal(calls[2].body, undefined);

  for (const call of calls.slice(1)) {
    const supportHeaders = Object.entries(call.headers).filter(
      ([name]) => name.toLowerCase() === "x-arky-support-token",
    );
    assert.deepEqual(supportHeaders, [["X-Arky-Support-Token", supportToken]]);
  }
  for (const call of calls) {
    assert.equal(call.headers["X-Arky-Publishable-Key"], publishableKey);
    assert.equal(call.headers.Authorization, `Bearer ${visitorToken}`);
  }
  assert.equal(calls[1].headers["X-Test-Header"], "preserved");
});

test("shipping label quotation sends its exact owner and returns signed carrier rates", async () => {
  const response = [
    {
      quote: "signed-rate-quote",
      carrier: "USPS",
      service: "usps_priority",
      display_name: "USPS Priority",
      postage: { amount: 895, currency: "usd" },
      platform_label_fee: { amount: 10, currency: "usd" },
      total: { amount: 905, currency: "usd" },
      fee_refundable_if_unused: true,
      estimated_days: 3,
      expires_at: 1789000000000,
    },
  ];
  const request = {
    owner: {
      type: "outbound_shipment",
      shipment_id: "6ba7b81a-9dad-41d1-80b4-00c04fd430c8",
    },
  };
  const { calls, result } = await captureFetch(response, () =>
    admin().eshop.shippingLabel.quote(request),
  );

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${defaultStoreId}/shipping-labels/quotes`,
      method: "POST",
      body: { owner: request.owner },
    },
  ]);
  assert.deepEqual(result, response);
});

test("shipping label purchase cites one signed quote and never a raw carrier rate", async () => {
  const response = {
    label: { id: "6ba7b81b-9dad-41d1-80b4-00c04fd430c8" },
    merchant_debit: null,
  };
  const request = {
    shipping_label_id: "6ba7b81b-9dad-41d1-80b4-00c04fd430c8",
    quote: "signed-rate-quote",
  };
  const { calls, result } = await captureFetch(response, () =>
    admin().eshop.shippingLabel.request(request),
  );

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${defaultStoreId}/shipping-labels`,
      method: "POST",
      body: {
        shipping_label_id: request.shipping_label_id,
        quote: request.quote,
      },
    },
  ]);
  assert.deepEqual(result, response);
});

test("provider-effect APIs send one resource identity and return direct server evidence", async (t) => {
  const cases = [
    {
      name: "webhook delivery",
      response: {
        delivery_id: resourceId,
        status: "unknown",
        response_status: null,
        error: "Provider outcome is unknown",
      },
      request: (arky) =>
        arky.store.webhook.test({
          delivery_id: resourceId,
          webhook_id: "webhook-contract",
        }),
      expected: {
        url: `${baseUrl}/v1/stores/${defaultStoreId}/webhooks/test`,
        method: "POST",
        body: { delivery_id: resourceId, webhook_id: "webhook-contract" },
      },
    },
    {
      name: "order refund",
      response: {
        refund_id: resourceId,
        money: { amount: 1250, currency: "usd" },
        status: { type: "requested" },
      },
      request: (arky) =>
        arky.eshop.refund.create({
          payment_id: "payment-refund-contract",
          refund_id: resourceId,
          payment_capture_id: null,
          money: { amount: 1250, currency: "usd" },
          reference: null,
          application: {
            type: "commercial_credit",
            allocations: [
              {
                order_credit_id: "order-credit-contract",
                order_credit_allocation_id: "product-credit-allocation",
                amount: 1250,
              },
            ],
          },
          reason: "duplicate",
          private_note: "Duplicate checkout",
        }),
      expected: {
        url: `${baseUrl}/v1/stores/${defaultStoreId}/refunds`,
        method: "POST",
        body: {
          payment_id: "payment-refund-contract",
          payment_capture_id: null,
          money: { amount: 1250, currency: "usd" },
          reference: null,
          refund_id: resourceId,
          application: {
            type: "commercial_credit",
            allocations: [
              {
                order_credit_id: "order-credit-contract",
                order_credit_allocation_id: "product-credit-allocation",
                amount: 1250,
              },
            ],
          },
          reason: "duplicate",
          private_note: "Duplicate checkout",
        },
      },
    },
    {
      name: "cash-on-delivery refund intent",
      response: {
        refund_id: resourceId,
        money: { amount: 700, currency: "usd" },
        status: { type: "requested" },
      },
      request: (arky) =>
        arky.eshop.refund.create({
          payment_id: "payment-cash-refund-contract",
          refund_id: resourceId,
          payment_capture_id: null,
          money: { amount: 700, currency: "usd" },
          reference: null,
          application: {
            type: "commercial_credit",
            allocations: [
              {
                order_credit_id: "order-credit-contract",
                order_credit_allocation_id: "delivery-credit-allocation",
                amount: 700,
              },
            ],
          },
          reason: "other",
          private_note: "Cash returned by operator",
        }),
      expected: {
        url: `${baseUrl}/v1/stores/${defaultStoreId}/refunds`,
        method: "POST",
        body: {
          payment_id: "payment-cash-refund-contract",
          payment_capture_id: null,
          money: { amount: 700, currency: "usd" },
          reference: null,
          refund_id: resourceId,
          application: {
            type: "commercial_credit",
            allocations: [
              {
                order_credit_id: "order-credit-contract",
                order_credit_allocation_id: "delivery-credit-allocation",
                amount: 700,
              },
            ],
          },
          reason: "other",
          private_note: "Cash returned by operator",
        },
      },
    },
    {
      name: "common Refund for a SubscriptionPlan credit",
      response: {
        refund_id: resourceId,
        money: { amount: 500, currency: "usd" },
        status: { type: "requested" },
      },
      request: (arky) =>
        arky.eshop.refund.create({
          store_id: defaultStoreId,
          payment_id: "audience-payment-contract",
          refund_id: resourceId,
          payment_capture_id: null,
          money: { amount: 500, currency: "usd" },
          reference: null,
          application: {
            type: "commercial_credit",
            allocations: [
              {
                order_credit_id: "group-credit",
                order_credit_allocation_id: "group-credit-allocation",
                amount: 500,
              },
            ],
          },
          reason: "fraudulent",
          private_note: "Risk review",
        }),
      expected: {
        url: `${baseUrl}/v1/stores/${defaultStoreId}/refunds`,
        method: "POST",
        body: {
          payment_id: "audience-payment-contract",
          refund_id: resourceId,
          payment_capture_id: null,
          money: { amount: 500, currency: "usd" },
          reference: null,
          application: {
            type: "commercial_credit",
            allocations: [
              {
                order_credit_id: "group-credit",
                order_credit_allocation_id: "group-credit-allocation",
                amount: 500,
              },
            ],
          },
          reason: "fraudulent",
          private_note: "Risk review",
        },
      },
    },
    {
      name: "shipment creation",
      response: {
        shipment_id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
        shipment: {
          id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
          status: { type: "pending" },
          selected_label_id: null,
          dispatch: null,
        },
      },
      request: (arky) =>
        arky.eshop.shipment.create({
          shipment_id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
          origin_store_location_id: "6ba7b818-9dad-41d1-80b4-00c04fd430c8",
          fulfillment_order_id: "6ba7b813-9dad-41d1-80b4-00c04fd430c8",
          lines: [
            {
              fulfillment_order_line_id: "6ba7b814-9dad-41d1-80b4-00c04fd430c8",
              unit_spans: [{ first_unit: 0, quantity: 2 }],
            },
          ],
          parcel: {
            length: 150,
            width: 100,
            height: 50,
            weight: 750,
            distance_unit: "mm",
            mass_unit: "g",
          },
        }),
      expected: {
        url: `${baseUrl}/v1/stores/${defaultStoreId}/shipments`,
        method: "POST",
        body: {
          shipment_id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
          origin_store_location_id: "6ba7b818-9dad-41d1-80b4-00c04fd430c8",
          fulfillment_order_id: "6ba7b813-9dad-41d1-80b4-00c04fd430c8",
          lines: [
            {
              fulfillment_order_line_id: "6ba7b814-9dad-41d1-80b4-00c04fd430c8",
              unit_spans: [{ first_unit: 0, quantity: 2 }],
            },
          ],
          parcel: {
            length: 150,
            width: 100,
            height: 50,
            weight: 750,
            distance_unit: "mm",
            mass_unit: "g",
          },
        },
      },
    },
  ];

  for (const contract of cases) {
    await t.test(contract.name, async () => {
      const { calls, result } = await captureFetch(contract.response, () =>
        contract.request(admin()),
      );
      assert.deepEqual(calls, [contract.expected]);
      assert.deepEqual(result, contract.response);
    });
  }
});

test("money and shipping clients reject evidence for any other resource ID", async (t) => {
  const otherResourceId = "018f477d-1cae-7c12-bf12-000000000000";
  const cases = [
    {
      name: "order refund",
      response: {
        refund_id: otherResourceId,
        money: { amount: 1250, currency: "usd" },
        status: { type: "succeeded" },
      },
      request: (arky) =>
        arky.eshop.refund.create({
          payment_id: "payment-refund-contract",
          refund_id: resourceId,
          payment_capture_id: null,
          money: { amount: 1250, currency: "usd" },
          private_note: null,
          reference: null,
          application: { type: "excess_collection", reason: "contract" },
          reason: "customer_request",
        }),
      error: /Refund response did not match the requested refund_id/,
    },
    {
      name: "cash-on-delivery refund intent",
      response: {
        refund_id: otherResourceId,
        money: { amount: 1250, currency: "usd" },
        status: { type: "succeeded" },
      },
      request: (arky) =>
        arky.eshop.refund.create({
          payment_id: "payment-refund-contract",
          refund_id: resourceId,
          payment_capture_id: null,
          money: { amount: 1250, currency: "usd" },
          private_note: null,
          reference: null,
          application: { type: "excess_collection", reason: "contract" },
          reason: "customer_request",
        }),
      error: /Refund response did not match the requested refund_id/,
    },
    {
      name: "common SubscriptionPlan credit Refund mismatched identity",
      response: {
        refund_id: otherResourceId,
        money: { amount: 500, currency: "usd" },
        status: { type: "succeeded" },
      },
      request: (arky) =>
        arky.eshop.refund.create({
          store_id: defaultStoreId,
          payment_id: "audience-payment-contract",
          refund_id: resourceId,
          payment_capture_id: null,
          money: { amount: 500, currency: "usd" },
          private_note: null,
          reference: null,
          application: {
            type: "commercial_credit",
            allocations: [
              {
                order_credit_id: "group-credit",
                order_credit_allocation_id: "group-credit-allocation",
                amount: 500,
              },
            ],
          },
          reason: "customer_request",
        }),
      error: /Refund response did not match the requested refund_id/,
    },
    {
      name: "shipment creation",
      response: {
        shipment_id: otherResourceId,
        shipment: { id: otherResourceId, status: { type: "label_created" } },
      },
      request: (arky) =>
        arky.eshop.shipment.create({
          shipment_id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
          origin_store_location_id: "6ba7b818-9dad-41d1-80b4-00c04fd430c8",
          fulfillment_order_id: "6ba7b813-9dad-41d1-80b4-00c04fd430c8",
          lines: [
            {
              fulfillment_order_line_id: "6ba7b814-9dad-41d1-80b4-00c04fd430c8",
              unit_spans: [{ first_unit: 0, quantity: 1 }],
            },
          ],
          parcel: {
            length: 150,
            width: 100,
            height: 50,
            weight: 750,
            distance_unit: "mm",
            mass_unit: "g",
          },
        }),
      error: /Shipping response did not match the requested shipment_id/,
    },
  ];

  for (const contract of cases) {
    await t.test(contract.name, async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => jsonResponse(contract.response);
      try {
        await assert.rejects(contract.request(admin()), contract.error);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  }
});

test("order refunds reject mismatched money and statuses outside the closed lifecycle", async (t) => {
  const request = () =>
    admin().eshop.refund.create({
      payment_id: "payment-refund-contract",
      refund_id: resourceId,
      payment_capture_id: null,
      money: { amount: 1250, currency: "usd" },
      private_note: null,
      reference: null,
      application: { type: "excess_collection", reason: "contract" },
      reason: "other",
    });

  await t.test("mismatched amount", async () => {
    await assert.rejects(
      captureFetch(
        {
          refund_id: resourceId,
          money: { amount: 1251, currency: "usd" },
          status: { type: "succeeded" },
        },
        request,
      ),
      /Refund response did not match the requested money/,
    );
  });

  await t.test("unsafe amount", async () => {
    await assert.rejects(
      captureFetch(
        {
          refund_id: resourceId,
          money: {
            amount: Number.MAX_SAFE_INTEGER + 1,
            currency: "usd",
          },
          status: "succeeded",
        },
        request,
      ),
      /Refund response did not match the requested money/,
    );
  });

  for (const status of [
    "succeeded",
    null,
    [],
    { type: "succeeded", extra: true },
    { type: "not_a_status" },
  ]) {
    await t.test(
      `reject malformed refund status ${JSON.stringify(status)}`,
      async () => {
        await assert.rejects(
          captureFetch(
            {
              refund_id: resourceId,
              money: { amount: 1250, currency: "usd" },
              status,
            },
            request,
          ),
          /Refund response contained an invalid status/,
        );
      },
    );
  }

  await t.test("unknown status value", async () => {
    await assert.rejects(
      captureFetch(
        {
          refund_id: resourceId,
          money: { amount: 1250, currency: "usd" },
          status: "pending",
        },
        request,
      ),
      /Refund response contained an invalid status/,
    );
  });
});

test("payment, refund, dispute, and shipment lifecycles are read through explicit resources", async (t) => {
  const cases = [
    {
      name: "payment",
      response: {
        id: "payment-contract",
        store_id: defaultStoreId,
        order_id: "order-contract",
        payer_customer_id: "customer-contract",
        provider: {
          type: "cash_on_delivery",
          payment_option_id: "provider-cash-contract",
          marked_paid_by_account_id: "account-operator-contract",
        },
        status: { type: "completed" },
        checkout_expiration: null,
        amounts: {
          currency: "usd",
          total: 1250,
          authorized: 0,
          captured: 1250,
          capture_pending: 0,
          refund_pending: 0,
          refunded: 0,
        },
        request_id: "payment-request-contract",
        reconciliation: { type: "clear" },
        completed_at: 2,
        created_at: 1,
        updated_at: 2,
        safe_error: null,
      },
      request: (arky) => arky.eshop.payment.get({ id: "payment-contract" }),
      url: `${baseUrl}/v1/stores/${defaultStoreId}/payments/payment-contract`,
    },
    {
      name: "refund",
      response: {
        id: resourceId,
        store_id: defaultStoreId,
        order_id: "order-contract",
        payment_id: "payment-contract",
        payment_capture_id: null,
        provider: {
          type: "stripe",
          payment_option_id: "provider-stripe-contract",
          refund_id: "stripe-refund-contract",
        },
        money: { amount: 500, currency: "usd" },
        application: {
          type: "commercial_credit",
          allocations: [
            {
              order_credit_id: "credit-contract",
              order_credit_allocation_id: "credit-allocation-contract",
              amount: 500,
            },
          ],
        },
        requester: {
          type: "account",
          actor: {
            account_id: "account-contract",
            snapshot: {
              email: "historical.operator@example.test",
              credential_type: "session",
            },
          },
          reason: "customer_request",
          private_note: null,
        },
        status: { type: "unknown" },
        financial_effects: [],
        safe_error:
          "The refund outcome is unknown; contact support before retrying",
        requested_at: 1,
        processing_started_at: 2,
        processing_deadline_at: 3,
        completed_at: null,
        created_at: 1,
        updated_at: 3,
      },
      request: (arky) =>
        arky.eshop.refund.get({
          id: resourceId,
        }),
      url: `${baseUrl}/v1/stores/${defaultStoreId}/refunds/${resourceId}`,
    },
    {
      name: "payment dispute",
      response: {
        id: "payment-dispute-contract",
        store_id: defaultStoreId,
        payment_id: "payment-contract",
        money: { amount: 1250, currency: "usd" },
        status: {
          type: "needs_response",
          response: { type: "due_at", due_at: 123_000 },
        },
        reason: "fraudulent",
        provider: {
          type: "stripe",
          dispute_id: "stripe-dispute-contract",
          charge_id: "stripe-charge-contract",
        },
        created_at: 1,
        updated_at: 2,
      },
      request: (arky) =>
        arky.eshop.dispute.get({
          dispute_id: "payment-dispute-contract",
        }),
      url: `${baseUrl}/v1/stores/${defaultStoreId}/disputes/payment-dispute-contract`,
    },
    {
      name: "shipment",
      response: {
        id: "shipment-contract",
        fulfillment_order_id: "work-contract",
        label_status: "unknown",
      },
      request: (arky) =>
        arky.eshop.shipment.get({
          shipment_id: "shipment-contract",
        }),
      url: `${baseUrl}/v1/stores/${defaultStoreId}/shipments/shipment-contract`,
    },
  ];

  for (const contract of cases) {
    await t.test(contract.name, async () => {
      const { calls, result } = await captureFetch(contract.response, () =>
        contract.request(admin()),
      );
      assert.deepEqual(calls, [
        { url: contract.url, method: "GET", body: undefined },
      ]);
      assert.deepEqual(result, contract.response);
    });
  }
});

test("payment dispute history filters the common Payment owner", async () => {
  const response = {
    items: [
      {
        id: "payment-dispute-contract",
        store_id: defaultStoreId,
        payment_id: "payment-contract",
        money: { amount: 1250, currency: "usd" },
        status: { type: "under_review" },
        reason: "fraudulent",
        provider: {
          type: "stripe",
          dispute_id: "stripe-dispute-contract",
          charge_id: "stripe-charge-contract",
        },
        created_at: 1,
        updated_at: 2,
      },
    ],
    cursor: "next-dispute-contract",
  };
  const { calls, result } = await captureFetch(response, () =>
    admin().eshop.dispute.find({
      payment_id: "payment-contract",
      limit: 20,
      cursor: "cursor-contract",
    }),
  );

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${defaultStoreId}/disputes?payment_id=payment-contract&limit=20&cursor=cursor-contract`,
      method: "GET",
      body: undefined,
    },
  ]);
  assert.deepEqual(result, response);
});

test("common dispute history can list the Store without an Order or Payment selector", async () => {
  const response = { items: [], cursor: null };
  const { calls, result } = await captureFetch(response, () =>
    admin().eshop.dispute.find(),
  );
  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${defaultStoreId}/disputes`,
      method: "GET",
      body: undefined,
    },
  ]);
  assert.deepEqual(result, response);
});

test("workflow webhook keeps arbitrary object payload data", async () => {
  const response = {
    id: "execution-trigger-contract",
    status: "pending",
  };
  const { calls, result } = await captureFetch(response, () =>
    admin().workflow.invokeWebhook({
      webhook_url: `${baseUrl}/v1/workflows/webhooks/path-secret-contract`,
      payload: {
        order: { id: "order-contract" },
        tags: ["one", "two"],
      },
    }),
  );

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/workflows/webhooks/path-secret-contract`,
      method: "POST",
      body: { order: { id: "order-contract" }, tags: ["one", "two"] },
    },
  ]);
  assert.deepEqual(result, response);
});

test("common Refund history is Store-scoped and can filter by exact Payment without an Order", async () => {
  const response = { items: [], cursor: null };
  const filtered = await captureFetch(response, () =>
    admin().eshop.refund.find({
      store_id: "selected-store",
      payment_id: "payment-history-contract",
      limit: 20,
      cursor: "next-page",
    }),
  );
  assert.equal(filtered.calls.length, 1);
  const url = new URL(filtered.calls[0].url);
  assert.equal(url.pathname, "/v1/stores/selected-store/refunds");
  assert.equal(url.searchParams.get("payment_id"), "payment-history-contract");
  assert.equal(url.searchParams.get("limit"), "20");
  assert.equal(url.searchParams.get("cursor"), "next-page");
  assert.equal(url.searchParams.has("order_id"), false);
  assert.equal(url.searchParams.has("store_id"), false);
  assert.equal(filtered.calls[0].method, "GET");
  assert.equal(filtered.calls[0].body, undefined);
  assert.deepEqual(filtered.result, response);
  const all = await captureFetch(response, () => admin().eshop.refund.find());
  assert.equal(
    new URL(all.calls[0].url).pathname,
    `/v1/stores/${defaultStoreId}/refunds`,
  );
  assert.equal(new URL(all.calls[0].url).search, "");
  assert.equal(all.calls[0].method, "GET");
});

test("common Refund commands preserve exact commercial-credit allocations for all four sellable families", async (t) => {
  const allocations = [
    {
      order_credit_id: resourceId,
      order_credit_allocation_id: "c1e80a5f-9cc3-43e7-8e2f-a424fbb45911",
      amount: 100,
    },
    {
      order_credit_id: resourceId,
      order_credit_allocation_id: "c1e80a5f-9cc3-43e7-8e2f-a424fbb45912",
      amount: 200,
    },
    {
      order_credit_id: resourceId,
      order_credit_allocation_id: "c1e80a5f-9cc3-43e7-8e2f-a424fbb45913",
      amount: 300,
    },
    {
      order_credit_id: resourceId,
      order_credit_allocation_id: "c1e80a5f-9cc3-43e7-8e2f-a424fbb45914",
      amount: 400,
    },
  ];
  const request = {
    payment_id: "c1e80a5f-9cc3-43e7-8e2f-a424fbb45915",
    refund_id: "c1e80a5f-9cc3-43e7-8e2f-a424fbb45916",
    payment_capture_id: null,
    money: { amount: 1000, currency: "eur" },
    reference: null,
    application: { type: "commercial_credit", allocations },
    reason: "customer_request",
    private_note: "Return across the accepted Order items",
  };
  for (const [method, suffix, status] of [
    ["create", "", "requested"],
    ["create", "", "requires_action"],
  ]) {
    await t.test(method, async () => {
      const response = {
        refund_id: request.refund_id,
        money: request.money,
        status: { type: status },
      };
      const { calls, result } = await captureFetch(response, () =>
        admin().eshop.refund[method](request),
      );
      assert.deepEqual(calls, [
        {
          url: `${baseUrl}/v1/stores/${defaultStoreId}/refunds${suffix}`,
          method: "POST",
          body: request,
        },
      ]);
      assert.deepEqual(result, response);
      assert.equal("order_id" in calls[0].body, false);
      assert.equal("membership_id" in calls[0].body, false);
    });
  }
});
