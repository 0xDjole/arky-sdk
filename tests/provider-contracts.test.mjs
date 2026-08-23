import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";

const baseUrl = "https://api.example.test";
const defaultStoreId = "store-contract";
const resourceId = "018f477d-1cae-7c12-bf12-123456789abc";

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

test("digital-product promo conditions keep their tagged wire contract", async () => {
  const promo = {
    id: "promo-contract",
    store_id: defaultStoreId,
    code: "DIGITAL10",
    discounts: [],
    conditions: [
      {
        type: "digital_products",
        digital_product_ids: ["digital-product-contract"],
      },
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
        { type: "items_percentage", market_key: "us", bps: 1_000 },
      ],
      conditions: promo.conditions,
    }),
  );

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${defaultStoreId}/promo-codes`,
      method: "POST",
      body: {
        code: "DIGITAL10",
        discounts: [
          { type: "items_percentage", market_key: "us", bps: 1_000 },
        ],
        conditions: [
          {
            type: "digital_products",
            digital_product_ids: ["digital-product-contract"],
          },
        ],
      },
    },
  ]);
  assert.deepEqual(result, promo);
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
  const visitorToken = `arky_vst_${"a".repeat(64)}`;
  const storefront = createStorefront(publishableKey, {
    apiUrl: baseUrl,
    sessionStorage: {
      getItem: () => visitorToken,
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
        conversation: { id: "conversation-contract", status: "active" },
        messages: [],
        support_token: supportToken,
      });
    }
    return jsonResponse({
      conversation: { id: "conversation-contract", status: "active" },
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
      amount: 895,
      currency: "USD",
      estimated_days: 3,
    },
  ];
  const request = {
    order_id: "order-shipping-contract",
    location_id: "location-contract",
    lines: [{ order_product_id: "product-contract", quantity: 2 }],
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
      url: `${baseUrl}/v1/stores/${defaultStoreId}/orders/order-shipping-contract/shipping/rates`,
      method: "POST",
      body: {
        location_id: request.location_id,
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
        shipment_id: "shipment-contract",
        shipment: { id: "shipment-contract", label_status: "requested" },
      },
      request: (arky) =>
        arky.eshop.shipment.create({
          order_id: "order-shipping-contract",
          shipment_id: "shipment-contract",
          rate_id: "signed-rate-quote",
          location_id: "location-contract",
          fulfillment_order_id: null,
          lines: [
            {
              order_product_id: "product-contract",
              fulfillment_order_line_id: null,
              quantity: 2,
            },
          ],
        }),
      expected: {
        url: `${baseUrl}/v1/stores/${defaultStoreId}/orders/order-shipping-contract/shipments`,
        method: "POST",
        body: {
          shipment_id: "shipment-contract",
          rate_id: "signed-rate-quote",
          location_id: "location-contract",
          fulfillment_order_id: null,
          lines: [
            {
              order_product_id: "product-contract",
              fulfillment_order_line_id: null,
              quantity: 2,
            },
          ],
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
        shipment: { id: otherResourceId, label_status: "succeeded" },
      },
      request: (arky) =>
        arky.eshop.shipment.create({
          order_id: "order-shipping-contract",
          shipment_id: "shipment-contract",
          rate_id: "signed-rate-quote",
          location_id: "location-contract",
          fulfillment_order_id: null,
          lines: [
            {
              order_product_id: "product-contract",
              fulfillment_order_line_id: null,
              quantity: 1,
            },
          ],
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
