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

function storedVisitorSession(token, customerId = "customer-provider-contract") {
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

test("commerce PromoCode create sends every canonical discount and condition wire variant without IDs", async () => {
  const promo = {
    id: "b7091941-b7f6-4776-8dc9-5167bc28fdc2",
    store_id: defaultStoreId,
    code: "SAVE10",
    discounts: [
      {
        type: "item_percentage",
        id: itemPercentageDiscountId,
        market: "us",
        basis_points: 1_000,
      },
      {
        type: "item_fixed",
        id: itemFixedDiscountId,
        market: "eu",
        money: { amount: 500, currency: "eur" },
      },
      {
        type: "shipping_percentage",
        id: shippingDiscountId,
        market: "us",
        basis_points: 2_000,
      },
    ],
    conditions: [
      { type: "products", product_ids: ["product-contract"] },
      {
        type: "booking_services",
        service_ids: ["booking-service-contract"],
      },
      {
        type: "digital_products",
        product_ids: ["digital-product-contract"],
      },
      {
        type: "minimum_order_amount",
        market: "us",
        money: { amount: 2_500, currency: "usd" },
      },
      {
        type: "redemption_window",
        starts_at: null,
        ends_at: 1_800_000_000,
      },
      { type: "maximum_uses", count: 100 },
      { type: "maximum_uses_per_customer", count: 1 },
    ],
    status: "active",
    uses: 0,
    created_at: 1,
    updated_at: 1,
  };
  const { calls, result } = await captureFetch(promo, () =>
    admin().eshop.promoCode.createPromoCode({
      store_id: defaultStoreId,
      code: promo.code,
      discounts: [
        { type: "item_percentage", market: "us", basis_points: 1_000 },
        {
          type: "item_fixed",
          market: "eu",
          money: { amount: 500, currency: "eur" },
        },
        {
          type: "shipping_percentage",
          market: "us",
          basis_points: 2_000,
        },
      ],
      conditions: promo.conditions,
    }),
  );

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${defaultStoreId}/promo-codes`,
      method: "POST",
      body: {
        code: "SAVE10",
        discounts: [
          { type: "item_percentage", market: "us", basis_points: 1_000 },
          {
            type: "item_fixed",
            market: "eu",
            money: { amount: 500, currency: "eur" },
          },
          {
            type: "shipping_percentage",
            market: "us",
            basis_points: 2_000,
          },
        ],
        conditions: [
          { type: "products", product_ids: ["product-contract"] },
          {
            type: "booking_services",
            service_ids: ["booking-service-contract"],
          },
          {
            type: "digital_products",
            product_ids: ["digital-product-contract"],
          },
          {
            type: "minimum_order_amount",
            market: "us",
            money: { amount: 2_500, currency: "usd" },
          },
          {
            type: "redemption_window",
            starts_at: null,
            ends_at: 1_800_000_000,
          },
          { type: "maximum_uses", count: 100 },
          { type: "maximum_uses_per_customer", count: 1 },
        ],
      },
    },
  ]);
  assert.deepEqual(result, promo);
  for (const discount of result.discounts) {
    assert.match(discount.id, uuidV4Pattern);
  }
  assert.deepEqual(result.conditions[4], {
    type: "redemption_window",
    starts_at: null,
    ends_at: 1_800_000_000,
  });
});

test("audience PromotionDiscount uses its canonical response ID and create can omit conditions", async () => {
  const promo = {
    id: "58152d68-559a-42a7-b98b-d173818dc6f1",
    store_id: defaultStoreId,
    code: "MEMBER15",
    discounts: [
      {
        type: "audience_percentage",
        id: audienceDiscountId,
        audience_id: "audience-contract",
        tier_ids: ["tier-contract"],
        price_ids: ["price-contract"],
        basis_points: 1_500,
      },
    ],
    conditions: [],
    status: "active",
    uses: 0,
    created_at: 1,
    updated_at: 1,
  };
  const { calls, result } = await captureFetch(promo, () =>
    admin().eshop.promoCode.createPromoCode({
      code: promo.code,
      discounts: [
        {
          type: "audience_percentage",
          audience_id: "audience-contract",
          tier_ids: ["tier-contract"],
          price_ids: ["price-contract"],
          basis_points: 1_500,
        },
      ],
    }),
  );

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${defaultStoreId}/promo-codes`,
      method: "POST",
      body: {
        code: "MEMBER15",
        discounts: [
          {
            type: "audience_percentage",
            audience_id: "audience-contract",
            tier_ids: ["tier-contract"],
            price_ids: ["price-contract"],
            basis_points: 1_500,
          },
        ],
      },
    },
  ]);
  assert.deepEqual(result, promo);
  assert.match(result.discounts[0].id, uuidV4Pattern);
});

test("PromoCode update preserves owned discount IDs and omits IDs for additions", async () => {
  const promoId = "b7091941-b7f6-4776-8dc9-5167bc28fdc2";
  const promo = {
    id: promoId,
    store_id: defaultStoreId,
    code: "SAVE20",
    discounts: [
      {
        type: "item_percentage",
        id: itemPercentageDiscountId,
        market: "us",
        basis_points: 2_000,
      },
      {
        type: "shipping_percentage",
        id: newShippingDiscountId,
        market: "us",
        basis_points: 1_000,
      },
    ],
    conditions: [],
    status: "draft",
    uses: 2,
    created_at: 1,
    updated_at: 2,
  };
  const { calls, result } = await captureFetch(promo, () =>
    admin().eshop.promoCode.updatePromoCode({
      id: promoId,
      store_id: defaultStoreId,
      code: "SAVE20",
      discounts: [
        {
          type: "item_percentage",
          id: itemPercentageDiscountId,
          market: "us",
          basis_points: 2_000,
        },
        {
          type: "shipping_percentage",
          market: "us",
          basis_points: 1_000,
        },
      ],
      conditions: [],
      status: "draft",
    }),
  );

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${defaultStoreId}/promo-codes/${promoId}`,
      method: "PUT",
      body: {
        code: "SAVE20",
        discounts: [
          {
            type: "item_percentage",
            id: itemPercentageDiscountId,
            market: "us",
            basis_points: 2_000,
          },
          {
            type: "shipping_percentage",
            market: "us",
            basis_points: 1_000,
          },
        ],
        conditions: [],
        status: "draft",
      },
    },
  ]);
  assert.deepEqual(result, promo);
  assert.equal(result.discounts[0].id, itemPercentageDiscountId);
  assert.equal(result.discounts[1].id, newShippingDiscountId);
});

test("PromoCode list sends only the implemented server query contract", async () => {
  const response = { items: [], cursor: null };
  const { calls, result } = await captureFetch(response, () =>
    admin().eshop.promoCode.getPromoCodes({
      store_id: defaultStoreId,
      ids: ["b7091941-b7f6-4776-8dc9-5167bc28fdc2"],
      query: "SAVE",
      status: "active",
      limit: 20,
      cursor: "20",
      sort_field: "created_at",
      sort_direction: "desc",
      created_at_from: 1,
      created_at_to: 2,
    }),
  );

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${defaultStoreId}/promo-codes?ids=%5B%22b7091941-b7f6-4776-8dc9-5167bc28fdc2%22%5D&query=SAVE&status=active&limit=20&cursor=20&sort_field=created_at&sort_direction=desc&created_at_from=1&created_at_to=2`,
      method: "GET",
      body: undefined,
    },
  ]);
  assert.deepEqual(result, response);
});

test("Order quote allocations preserve embedded PromotionDiscount provenance and canonical null", async () => {
  const lineMoney = {
    unit_price: 2_000,
    subtotal: 2_000,
    discount_allocations: [
      { promotion_discount_id: itemPercentageDiscountId, amount: 200 },
      { promotion_discount_id: null, amount: 50 },
    ],
    discount_total: 250,
    taxable_base: 1_750,
    tax_lines: [],
    tax_total: 0,
    total: 1_750,
  };
  const shippingMoney = {
    unit_price: 500,
    subtotal: 500,
    discount_allocations: [
      { promotion_discount_id: shippingDiscountId, amount: 100 },
    ],
    discount_total: 100,
    taxable_base: 400,
    tax_lines: [],
    tax_total: 0,
    total: 400,
  };
  const quote = {
    product_lines: [
      {
        product_id: "product-contract",
        variant_id: "variant-contract",
        quantity: 1,
        money: lineMoney,
        snapshot: {
          product_key: "product-contract",
          variant_sku: null,
          variant_attributes: [],
          price: { amount: 2_000, currency: "usd", market: "us" },
          requires_shipping: true,
          weight_grams: 100,
        },
      },
    ],
    booking_lines: [],
    digital_lines: [],
    shipping_lines: [
      {
        id: "shipping-line-contract",
        shipping_method_id: "shipping-method-contract",
        title: "Standard",
        money: shippingMoney,
      },
    ],
    shipping_methods: [],
    payment_provider_id: "payment-provider-contract",
    payment_provider_ids: ["payment-provider-contract"],
    money: {
      currency: "usd",
      market: "us",
      subtotal: 2_000,
      shipping: 400,
      discount: 350,
      tax_total: 0,
      total: 2_150,
      promo_code: { id: "promo-contract", code: "SAVE10" },
      zone_id: null,
      shipping_method_id: "shipping-method-contract",
    },
  };
  const { result } = await captureFetch(quote, () =>
    admin().eshop.order.getQuote({ market: "us" }),
  );

  assert.equal(
    result.product_lines[0].money.discount_allocations[0]
      .promotion_discount_id,
    itemPercentageDiscountId,
  );
  assert.equal(
    result.product_lines[0].money.discount_allocations[1]
      .promotion_discount_id,
    null,
  );
  assert.equal(
    result.shipping_lines[0].money.discount_allocations[0]
      .promotion_discount_id,
    shippingDiscountId,
  );
  assert.equal(
    "discount_application_id" in
      result.product_lines[0].money.discount_allocations[0],
    false,
  );
});

test("subscription selection returns its ephemeral Stripe action in one POST", async () => {
  const subscription = {
    id: "d397ff50-690b-4da7-9fb9-17740e535d69",
    store_id: "store-subscription",
    plan_access: null,
    status: "pending",
    payment_action: {
      type: "stripe_embedded_checkout",
      publishable_key: "pk_test_subscription",
      client_secret: "cs_subscription_secret_exact",
      stripe_account_id: null,
      expires_at: 1_800_000_000,
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

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/store-subscription/subscription`,
      method: "POST",
      body: {
        plan_id: "pro",
        return_url: "https://merchant.test/return",
      },
    },
  ]);
  assert.deepEqual(result, subscription);
  assert.equal(result.status, "pending");
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
    status: "active",
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

test("payment-provider disable uses one request", async () => {
  const { calls, result } = await captureFetch({ disabled: true }, () =>
    admin().store.paymentProvider.delete({
      store_id: "store-deletion",
      id: "provider-contract",
    }),
  );

  assert.deepEqual(result, { disabled: true });
  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/store-deletion/payment-providers/provider-contract`,
      method: "DELETE",
      body: undefined,
    },
  ]);
});

test("Stripe Express Dashboard uses one authenticated provider link request", async () => {
  const { calls, result } = await captureFetch(
    { dashboard_url: "https://connect.stripe.test/express/link" },
    () =>
      admin().store.paymentProvider.stripe.openDashboard({
        store_id: "store-dashboard",
        id: "provider-contract",
      }),
  );

  assert.deepEqual(result, {
    dashboard_url: "https://connect.stripe.test/express/link",
  });
  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/store-dashboard/payment-providers/stripe/provider-contract/dashboard`,
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
          status: "active",
        },
        messages: [],
        support_token: supportToken,
      });
    }
    return jsonResponse({
      conversation: {
        id: "conversation-contract",
        customer_id: customerId,
        customer_session_id: customerSessionId,
        status: "active",
      },
      messages: [
        {
          id: resourceId,
          conversation_id: "conversation-contract",
          role: "user",
          content: "Help",
          metadata: {},
          ai_response: null,
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

test("shipping rate lookup sends only persisted context identifiers and package facts", async () => {
  const response = [
    {
      id: "signed-rate-quote",
      carrier: "USPS",
      service: "usps_priority",
      display_name: "USPS Priority",
      postage: { amount: 895, currency: "usd" },
      platform_label_fee: { amount: 10, currency: "usd" },
      total: { amount: 905, currency: "usd" },
      estimated_days: 3,
    },
  ];
  const request = {
    order_id: "6ba7b81a-9dad-41d1-80b4-00c04fd430c8",
    store_location_id: "6ba7b818-9dad-41d1-80b4-00c04fd430c8",
    lines: [
      {
        order_product_item_id: "6ba7b817-9dad-41d1-80b4-00c04fd430c8",
        quantity: 2,
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
    customs_declaration: {
      contents_type: "MERCHANDISE",
      contents_explanation: null,
      non_delivery_option: "RETURN",
      certify: true,
      certify_signer: "Warehouse Operator",
      eel_pfc: "NOEEI_30_37_a",
      incoterm: "DDU",
      items: [
        {
          description: "Printed guide",
          quantity: 2,
          net_weight: "375",
          mass_unit: "g",
          value_amount: "12.50",
          value_currency: "USD",
          origin_country: "US",
          tariff_number: null,
        },
      ],
    },
  };
  const { calls, result } = await captureFetch(response, () =>
    admin().eshop.shipment.getRates(request),
  );

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${defaultStoreId}/orders/${request.order_id}/shipping/rates`,
      method: "POST",
      body: {
        store_location_id: request.store_location_id,
        lines: request.lines,
        parcel: request.parcel,
        customs_declaration: request.customs_declaration,
      },
    },
  ]);
  assert.deepEqual(result, response);
});

test("provider-effect APIs send one resource identity and return direct server evidence", async (t) => {
  const send = {
    type: "contact_store_notification",
    data: {
      store_id: defaultStoreId,
      mailbox_id: "mailbox-contract",
      template_id: "template-contract",
      recipients: ["owner@example.test"],
    },
  };
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
      name: "email delivery",
      response: { sent: 1, deliveries: [] },
      request: (arky) =>
        arky.notification.email.send({ send_id: resourceId, send }),
      expected: {
        url: `${baseUrl}/v1/notifications/email`,
        method: "POST",
        body: { send_id: resourceId, send },
      },
    },
    {
      name: "order refund",
      response: {
        refund_id: resourceId,
        money: { amount: 1250, currency: "usd" },
        status: "requested",
      },
      request: (arky) =>
        arky.eshop.order.createRefund({
          order_id: "order-refund-contract",
          refund_id: resourceId,
          amount: 1250,
          allocations: [
            {
              type: "product",
              item_id: "order-product-contract",
              amount: 1250,
            },
          ],
          reason: "duplicate",
          private_note: "Duplicate checkout",
        }),
      expected: {
        url: `${baseUrl}/v1/stores/${defaultStoreId}/orders/order-refund-contract/refunds`,
        method: "POST",
        body: {
          amount: 1250,
          refund_id: resourceId,
          allocations: [
            {
              type: "product",
              item_id: "order-product-contract",
              amount: 1250,
            },
          ],
          reason: "duplicate",
          private_note: "Duplicate checkout",
        },
      },
    },
    {
      name: "cash-on-delivery refund record",
      response: {
        refund_id: resourceId,
        money: { amount: 700, currency: "usd" },
        status: "succeeded",
      },
      request: (arky) =>
        arky.eshop.order.recordCashOnDeliveryRefund({
          order_id: "order-cash-refund-contract",
          refund_id: resourceId,
          amount: 700,
          allocations: [
            {
              type: "shipping",
              line_id: "shipping-line-contract",
              amount: 700,
            },
          ],
          reason: "other",
          private_note: "Cash returned by operator",
        }),
      expected: {
        url: `${baseUrl}/v1/stores/${defaultStoreId}/orders/order-cash-refund-contract/refunds/cash-on-delivery`,
        method: "POST",
        body: {
          amount: 700,
          refund_id: resourceId,
          allocations: [
            {
              type: "shipping",
              line_id: "shipping-line-contract",
              amount: 700,
            },
          ],
          reason: "other",
          private_note: "Cash returned by operator",
        },
      },
    },
    {
      name: "Audience payment refund",
      response: { refund_id: resourceId, amount: 500, status: "requested" },
      request: (arky) =>
        arky.crm.audience.members.refund({
          store_id: defaultStoreId,
          audience_id: "audience-refund-contract",
          member_id: "member-refund-contract",
          payment_id: "payment-refund-contract",
          amount: 500,
          refund_id: resourceId,
          reason: "fraudulent",
          private_note: "Risk review",
        }),
      expected: {
        url: `${baseUrl}/v1/stores/${defaultStoreId}/audiences/audience-refund-contract/members/member-refund-contract/payments/payment-refund-contract/refunds`,
        method: "POST",
        body: {
          amount: 500,
          refund_id: resourceId,
          reason: "fraudulent",
          private_note: "Risk review",
        },
      },
    },
    {
      name: "shipping-label purchase",
      response: {
        shipment_id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
        shipment: {
          id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
          status: "pending",
          label: null,
        },
      },
      request: (arky) =>
        arky.eshop.shipment.create({
          order_id: "6ba7b81a-9dad-41d1-80b4-00c04fd430c8",
          shipment_id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
          rate_id: "signed-rate-quote",
          origin_store_location_id: "6ba7b818-9dad-41d1-80b4-00c04fd430c8",
          fulfillment_order_id: "6ba7b813-9dad-41d1-80b4-00c04fd430c8",
          lines: [
            {
              order_product_item_id: "6ba7b817-9dad-41d1-80b4-00c04fd430c8",
              fulfillment_order_line_id: "6ba7b814-9dad-41d1-80b4-00c04fd430c8",
              quantity: 2,
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
        url: `${baseUrl}/v1/stores/${defaultStoreId}/orders/6ba7b81a-9dad-41d1-80b4-00c04fd430c8/shipments`,
        method: "POST",
        body: {
          shipment_id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
          rate_id: "signed-rate-quote",
          origin_store_location_id: "6ba7b818-9dad-41d1-80b4-00c04fd430c8",
          fulfillment_order_id: "6ba7b813-9dad-41d1-80b4-00c04fd430c8",
          lines: [
            {
              order_product_item_id: "6ba7b817-9dad-41d1-80b4-00c04fd430c8",
              fulfillment_order_line_id: "6ba7b814-9dad-41d1-80b4-00c04fd430c8",
              quantity: 2,
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
        status: "succeeded",
      },
      request: (arky) =>
        arky.eshop.order.createRefund({
          order_id: "order-refund-contract",
          refund_id: resourceId,
          amount: 1250,
          allocations: [
            { type: "adjustment", amount: 1250, reason: "contract" },
          ],
          reason: "customer_request",
        }),
      error: /Refund response did not match the requested refund_id/,
    },
    {
      name: "cash-on-delivery refund record",
      response: {
        refund_id: otherResourceId,
        money: { amount: 1250, currency: "usd" },
        status: "succeeded",
      },
      request: (arky) =>
        arky.eshop.order.recordCashOnDeliveryRefund({
          order_id: "order-refund-contract",
          refund_id: resourceId,
          amount: 1250,
          allocations: [
            { type: "adjustment", amount: 1250, reason: "contract" },
          ],
          reason: "customer_request",
        }),
      error: /Refund response did not match the requested refund_id/,
    },
    {
      name: "Audience payment refund",
      response: {
        refund_id: otherResourceId,
        amount: 500,
        status: "succeeded",
      },
      request: (arky) =>
        arky.crm.audience.members.refund({
          store_id: defaultStoreId,
          audience_id: "audience-refund-contract",
          member_id: "member-refund-contract",
          payment_id: "payment-refund-contract",
          amount: 500,
          refund_id: resourceId,
          reason: "customer_request",
        }),
      error: /Audience refund response did not match the requested refund_id/,
    },
    {
      name: "shipping-label purchase",
      response: {
        shipment_id: otherResourceId,
        shipment: { id: otherResourceId, status: "label_created" },
      },
      request: (arky) =>
        arky.eshop.shipment.create({
          order_id: "6ba7b81a-9dad-41d1-80b4-00c04fd430c8",
          shipment_id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
          rate_id: "signed-rate-quote",
          origin_store_location_id: "6ba7b818-9dad-41d1-80b4-00c04fd430c8",
          fulfillment_order_id: "6ba7b813-9dad-41d1-80b4-00c04fd430c8",
          lines: [
            {
              order_product_item_id: "6ba7b817-9dad-41d1-80b4-00c04fd430c8",
              fulfillment_order_line_id: "6ba7b814-9dad-41d1-80b4-00c04fd430c8",
              quantity: 1,
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
    admin().eshop.order.createRefund({
      order_id: "order-refund-contract",
      refund_id: resourceId,
      amount: 1250,
      allocations: [{ type: "adjustment", amount: 1250, reason: "contract" }],
      reason: "other",
    });

  await t.test("mismatched amount", async () => {
    await assert.rejects(
      captureFetch(
        {
          refund_id: resourceId,
          money: { amount: 1251, currency: "usd" },
          status: "succeeded",
        },
        request,
      ),
      /Refund response did not match the requested amount/,
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
      /Refund response did not match the requested amount/,
    );
  });

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
        provider: {
          type: "cash_on_delivery",
          payment_provider_id: "provider-cash-contract",
          marked_paid_by_account_id: "account-operator-contract",
        },
        status: "paid",
        amounts: {
          currency: "usd",
          total: 1250,
          paid: 1250,
          refund_pending: 0,
          refunded: 0,
        },
        requested_at: 1,
        completed_at: 2,
        created_at: 1,
        updated_at: 2,
        safe_error: null,
      },
      request: (arky) =>
        arky.eshop.order.getPayment({ order_id: "order-contract" }),
      url: `${baseUrl}/v1/stores/${defaultStoreId}/orders/order-contract/payment`,
    },
    {
      name: "refund",
      response: {
        id: resourceId,
        store_id: defaultStoreId,
        order_id: "order-contract",
        payment_id: "payment-contract",
        provider: {
          type: "stripe",
          payment_provider_id: "provider-stripe-contract",
          refund_id: "stripe-refund-contract",
          refund_status: "pending",
          failure_reason: null,
        },
        money: { amount: 500, currency: "usd" },
        allocations: [
          { type: "digital", item_id: "digital-item-contract", amount: 500 },
        ],
        requested_by_account_id: "account-contract",
        reason: "customer_request",
        private_note: null,
        status: "unknown",
        safe_error: "The refund outcome is unknown; contact support before retrying",
        requested_at: 1,
        processing_started_at: 2,
        processing_deadline_at: 3,
        completed_at: null,
        created_at: 1,
        updated_at: 3,
      },
      request: (arky) =>
        arky.eshop.order.getRefund({
          order_id: "order-contract",
          refund_id: resourceId,
        }),
      url: `${baseUrl}/v1/stores/${defaultStoreId}/orders/order-contract/refunds/${resourceId}`,
    },
    {
      name: "payment dispute",
      response: {
        id: "payment-dispute-contract",
        store_id: defaultStoreId,
        order_id: "order-contract",
        payment_id: "payment-contract",
        money: { amount: 1250, currency: "usd" },
        status: "needs_response",
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
        arky.eshop.order.getDispute({
          order_id: "order-contract",
          dispute_id: "payment-dispute-contract",
        }),
      url: `${baseUrl}/v1/stores/${defaultStoreId}/orders/order-contract/disputes/payment-dispute-contract`,
    },
    {
      name: "shipment",
      response: {
        id: "shipment-contract",
        order_id: "order-contract",
        label_status: "unknown",
      },
      request: (arky) =>
        arky.eshop.shipment.get({
          order_id: "order-contract",
          shipment_id: "shipment-contract",
        }),
      url: `${baseUrl}/v1/stores/${defaultStoreId}/orders/order-contract/shipments/shipment-contract`,
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

test("payment dispute history uses the canonical order-scoped read", async () => {
  const response = {
    items: [
      {
        id: "payment-dispute-contract",
        store_id: defaultStoreId,
        order_id: "order-contract",
        payment_id: "payment-contract",
        money: { amount: 1250, currency: "usd" },
        status: "under_review",
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
    admin().eshop.order.getDisputes({
      order_id: "order-contract",
      limit: 20,
      cursor: "cursor-contract",
    }),
  );

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${defaultStoreId}/orders/order-contract/disputes?limit=20&cursor=cursor-contract`,
      method: "GET",
      body: undefined,
    },
  ]);
  assert.deepEqual(result, response);
});

test("workflow trigger keeps arbitrary object data while the path secret wins", async () => {
  const response = {
    id: "execution-trigger-contract",
    input: {
      type: "webhook",
      payload: { order: { id: "order-contract" }, tags: ["one", "two"] },
    },
  };
  const { calls, result } = await captureFetch(response, () =>
    admin().automation.workflow.trigger({
      secret: "path-secret-contract",
      order: { id: "order-contract" },
      tags: ["one", "two"],
    }),
  );

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/workflows/trigger/path-secret-contract`,
      method: "POST",
      body: { order: { id: "order-contract" }, tags: ["one", "two"] },
    },
  ]);
  assert.deepEqual(result, response);
  assert.equal("secret" in calls[0].body, false);
});
