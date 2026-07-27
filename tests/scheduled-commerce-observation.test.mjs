import assert from "node:assert/strict";
import test from "node:test";

import { createStorefront } from "../dist/storefront.js";
import { admin, baseUrl, jsonResponse, storeId } from "./helpers/scheduled-observation-fixtures.mjs";

test("checkout POSTs once and observes the exact order payment", async () => {
  const pending = {
    order_id: "order-scheduled",
    number: "1001",
    payment_action: { type: "none" },
    payment: {
      status: { status: "processing", at: 1 },
      amount: 1250,
      currency: "EUR",
      paid: 0,
      method_type: "credit_card",
    },
  };
  const requiresAction = {
    ...pending,
    payment_action: {
      type: "handle_next_action",
      client_secret: "pi_scheduled_secret",
      connected_account_id: "acct_scheduled",
    },
    payment: {
      ...pending.payment,
      status: { status: "requires_action", at: 2 },
      payment_action: {
        type: "handle_next_action",
        client_secret: "pi_scheduled_secret",
        connected_account_id: "acct_scheduled",
      },
    },
  };
  const calls = [];
  let transforms = 0;
  let successes = 0;
  let errors = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method || "GET",
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    });
    return jsonResponse(
      init.method === "POST" ? pending : requiresAction.payment,
    );
  };

  try {
    const result = await admin().eshop.cart.checkout(
      {
        id: "cart-scheduled",
        store_id: storeId,
        payment_method_key: "credit_card",
      },
      {
        transformRequest(body) {
          transforms += 1;
          return { ...body, transformed_once: true };
        },
        onSuccess() {
          successes += 1;
        },
        onError() {
          errors += 1;
        },
      },
    );
    assert.equal(result.payment.status.status, "requires_action");
    assert.deepEqual(result.payment_action, requiresAction.payment_action);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map((call) => [call.url, call.method]),
    [
      [`${baseUrl}/v1/stores/${storeId}/carts/cart-scheduled/checkout`, "POST"],
      [`${baseUrl}/v1/stores/${storeId}/orders/order-scheduled/payment`, "GET"],
    ],
  );
  assert.equal(calls[0].body.transformed_once, true);
  assert.equal(calls[1].body, undefined);
  assert.equal(transforms, 1);
  assert.equal(successes, 1);
  assert.equal(errors, 0);
});

test("storefront scheduled mutations await exact response persistence before observation or return", async () => {
  const publishableKey = `arky_pk_${"s".repeat(43)}`;
  const visitorToken = `arky_vst_${"c".repeat(64)}`;
  const storefront = createStorefront(publishableKey, {
    apiUrl: baseUrl,
    sessionStorage: {
      getItem: () => visitorToken,
      setItem() {},
      removeItem() {},
    },
  });
  const pending = {
    order_id: "storefront-order-hook",
    number: "1004",
    payment_action: { type: "none" },
    payment: {
      status: { status: "processing", at: 1 },
      amount: 1250,
      currency: "EUR",
      paid: 0,
      method_type: "credit_card",
    },
  };
  const captured = {
    ...pending.payment,
    status: { status: "captured", at: 2, amount: 1250 },
    payment_action: { type: "none" },
  };
  const calls = [];
  let enterHook;
  let releaseHook;
  const hookEntered = new Promise((resolve) => {
    enterHook = resolve;
  });
  const hookGate = new Promise((resolve) => {
    releaseHook = resolve;
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || "GET" });
    return jsonResponse(init.method === "POST" ? pending : captured);
  };

  try {
    const checkoutPromise = storefront.eshop.cart.checkout(
      {
        id: "storefront-cart-hook",
        payment_method_key: "credit_card",
      },
      {
        async onScheduledResponse(response) {
          assert.equal(response.order_id, "storefront-order-hook");
          enterHook();
          await hookGate;
        },
      },
    );
    await hookEntered;
    assert.deepEqual(
      calls.map((call) => call.method),
      ["POST"],
      "observation must not start until exact response persistence completes",
    );
    releaseHook();
    const result = await checkoutPromise;
    assert.equal(result.payment.status.status, "captured");

    calls.length = 0;
    globalThis.fetch = async (url, init = {}) => {
      calls.push({ url: String(url), method: init.method || "GET" });
      return jsonResponse({
        payment_action: { type: "none" },
        payment_attempt: null,
        membership: {
          id: "membership-hook",
          contact_id: "contact-hook",
          contact_list_id: "list-hook",
          status: "active",
        },
      });
    };
    await assert.rejects(
      storefront.crm.contactList.subscribe(
        {
          id: "list-hook",
          contact_id: "contact-hook",
        },
        {
          async onScheduledResponse(response) {
            assert.equal(response.membership.id, "membership-hook");
            throw new Error("durable transition failed");
          },
        },
      ),
      /durable transition failed/,
    );
    assert.deepEqual(
      calls.map((call) => call.method),
      ["POST"],
      "a failed durable transition must reject before return or observation",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("storefront checkout preserves an unknown provider outcome without repeating checkout", async () => {
  const publishableKey = `arky_pk_${"u".repeat(42)}A`;
  const visitorToken = `arky_vst_${"c".repeat(64)}`;
  const pending = {
    order_id: "storefront-order-unknown",
    number: "1003",
    payment_action: { type: "none" },
    payment: {
      status: { status: "processing", at: 1 },
      amount: 1250,
      currency: "EUR",
      paid: 0,
      method_type: "credit_card",
    },
  };
  const unknownPayment = {
    ...pending.payment,
    status: {
      status: "unknown",
      at: 2,
      reason: "Provider outcome is unknown",
    },
    payment_action: { type: "none" },
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || "GET" });
    return jsonResponse(init.method === "POST" ? pending : unknownPayment);
  };

  try {
    const storefront = createStorefront(publishableKey, {
      apiUrl: baseUrl,
      sessionStorage: {
        getItem: () => visitorToken,
        setItem() {},
        removeItem() {},
      },
    });
    const result = await storefront.eshop.cart.checkout({
      id: "storefront-cart-unknown",
      payment_method_key: "credit_card",
    });
    assert.equal(result.payment.status.status, "unknown");
    assert.equal(result.payment.status.reason, "Provider outcome is unknown");
    assert.deepEqual(result.payment_action, { type: "none" });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map((call) => [call.url, call.method]),
    [
      [
        `${baseUrl}/v1/storefront/carts/storefront-cart-unknown/checkout`,
        "POST",
      ],
      [
        `${baseUrl}/v1/storefront/orders/storefront-order-unknown/payment`,
        "GET",
      ],
    ],
  );
});

test("storefront subscription POSTs once and observes the exact payment attempt", async () => {
  const publishableKey = `arky_pk_${"s".repeat(43)}`;
  const visitorToken = `arky_vst_${"c".repeat(64)}`;
  const attemptId = "payment-attempt-scheduled";
  const pending = {
    payment_action: { type: "none" },
    payment_attempt: {
      plan_id: "plan-scheduled",
      amount: 900,
      currency: "EUR",
      status: "processing",
    },
    membership: {
      id: "membership-scheduled",
      contact_id: "contact-scheduled",
      contact_list_id: "list-scheduled",
      current_payment_attempt_id: attemptId,
      status: "pending",
    },
  };
  const succeeded = {
    ...pending,
    payment_attempt: { ...pending.payment_attempt, status: "succeeded" },
    membership: { ...pending.membership, status: "active" },
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method || "GET",
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    });
    return jsonResponse(init.method === "POST" ? pending : succeeded);
  };

  try {
    const storefront = createStorefront(publishableKey, {
      apiUrl: baseUrl,
      sessionStorage: {
        getItem: () => visitorToken,
        setItem() {},
        removeItem() {},
      },
    });
    const result = await storefront.crm.contactList.subscribe({
      id: "list-scheduled",
      contact_id: "contact-scheduled",
      price_id: "price-scheduled",
      confirmation_token_id: "confirmation-scheduled",
    });
    assert.deepEqual(result, succeeded);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map((call) => [call.url, call.method]),
    [
      [
        `${baseUrl}/v1/storefront/contact-lists/list-scheduled/subscribe`,
        "POST",
      ],
      [
        `${baseUrl}/v1/storefront/contact-lists/list-scheduled/subscription-attempts/${attemptId}`,
        "GET",
      ],
    ],
  );
});

test("storefront subscription preserves an unknown exact attempt without repeating subscribe", async () => {
  const publishableKey = `arky_pk_${"n".repeat(42)}A`;
  const visitorToken = `arky_vst_${"c".repeat(64)}`;
  const attemptId = "payment-attempt-unknown";
  const pending = {
    payment_action: { type: "none" },
    payment_attempt: {
      plan_id: "plan-unknown",
      amount: 900,
      currency: "EUR",
      status: "processing",
    },
    membership: {
      id: "membership-unknown",
      contact_id: "contact-unknown",
      contact_list_id: "list-unknown",
      current_payment_attempt_id: attemptId,
      status: "pending",
    },
  };
  const unknown = {
    ...pending,
    payment_attempt: { ...pending.payment_attempt, status: "unknown" },
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || "GET" });
    return jsonResponse(init.method === "POST" ? pending : unknown);
  };

  try {
    const storefront = createStorefront(publishableKey, {
      apiUrl: baseUrl,
      sessionStorage: {
        getItem: () => visitorToken,
        setItem() {},
        removeItem() {},
      },
    });
    const result = await storefront.crm.contactList.subscribe({
      id: "list-unknown",
      contact_id: "contact-unknown",
      price_id: "price-unknown",
      confirmation_token_id: "confirmation-unknown",
    });
    assert.equal(result.payment_attempt.status, "unknown");
    assert.equal(result.membership.current_payment_attempt_id, attemptId);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map((call) => [call.url, call.method]),
    [
      [`${baseUrl}/v1/storefront/contact-lists/list-unknown/subscribe`, "POST"],
      [
        `${baseUrl}/v1/storefront/contact-lists/list-unknown/subscription-attempts/${attemptId}`,
        "GET",
      ],
    ],
  );
});

test("storefront reload observes one exact subscription attempt without repeating the mutation", async () => {
  const publishableKey = `arky_pk_${"s".repeat(43)}`;
  const visitorToken = `arky_vst_${"d".repeat(64)}`;
  const response = {
    payment_action: {
      type: "handle_next_action",
      client_secret: "pi_subscription_secret",
      connected_account_id: "acct_subscription",
    },
    payment_attempt: {
      plan_id: "plan-resume",
      amount: 900,
      currency: "EUR",
      status: "requires_action",
    },
    membership: {
      id: "membership-resume",
      contact_id: "contact-resume",
      contact_list_id: "list-resume",
      current_payment_attempt_id: "attempt-resume",
      status: "pending",
    },
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method || "GET",
      headers: new Headers(init.headers),
    });
    return jsonResponse(response);
  };

  try {
    const storefront = createStorefront(publishableKey, {
      apiUrl: baseUrl,
      sessionStorage: {
        getItem: () => visitorToken,
        setItem() {},
        removeItem() {},
      },
    });
    const result = await storefront.crm.contactList.subscriptionAttempts.get({
      id: "list-resume",
      payment_attempt_id: "attempt-resume",
    });
    assert.deepEqual(result, response);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    `${baseUrl}/v1/storefront/contact-lists/list-resume/subscription-attempts/attempt-resume`,
  );
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.equal(calls[0].headers.get("x-arky-publishable-key"), publishableKey);
});

test("explicit provider retries POST once and then observe their exact resource with GET", async () => {
  const calls = [];
  let transforms = 0;
  let successes = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const target = String(url);
    const method = init.method ?? "GET";
    calls.push({ target, method });

    if (target.includes("/payment/transactions/transaction-one")) {
      return jsonResponse({
        id: "transaction-one",
        status: method === "POST" ? "requested" : "succeeded",
      });
    }
    if (target.includes("/shipments/shipment-one/refunds/refund-one")) {
      return jsonResponse({
        id: "refund-one",
        status: method === "POST" ? "processing" : "succeeded",
      });
    }
    if (target.includes("/shipments/shipment-one/settlements/settlement-one")) {
      return jsonResponse({
        id: "settlement-one",
        status: method === "POST" ? "requested" : "succeeded",
      });
    }
    if (target.includes("/shipments/shipment-one")) {
      return jsonResponse({
        id: "shipment-one",
        label_status: method === "POST" ? "requested" : "succeeded",
      });
    }
    if (target.includes("/refunds/membership-refund-one")) {
      return jsonResponse({
        id: "membership-refund-one",
        status: method === "POST" ? "requested" : "succeeded",
      });
    }
    if (target.includes("/cancellations/cancellation-one")) {
      return jsonResponse({
        id: "cancellation-one",
        status: method === "POST" ? "processing" : "succeeded",
      });
    }
    if (target.includes("/plans/plan-one")) {
      return jsonResponse({
        id: "plan-one",
        catalog_status: method === "POST" ? "requested" : "succeeded",
      });
    }
    throw new Error(`Unexpected request: ${method} ${target}`);
  };
  const options = {
    transformRequest(body) {
      transforms += 1;
      return body;
    },
    onSuccess() {
      successes += 1;
    },
  };

  try {
    assert.equal(
      (
        await admin().eshop.order.retryPaymentTransaction(
          {
            store_id: storeId,
            order_id: "order-one",
            transaction_id: "transaction-one",
          },
          options,
        )
      ).status,
      "succeeded",
    );
    assert.equal(
      (
        await admin().eshop.shipment.retry(
          {
            store_id: storeId,
            order_id: "order-one",
            shipment_id: "shipment-one",
          },
          options,
        )
      ).label_status,
      "succeeded",
    );
    assert.equal(
      (
        await admin().eshop.shipment.refund.retry(
          {
            store_id: storeId,
            order_id: "order-one",
            shipment_id: "shipment-one",
            refund_id: "refund-one",
          },
          options,
        )
      ).status,
      "succeeded",
    );
    assert.equal(
      (
        await admin().eshop.shipment.settlement.retry(
          {
            store_id: storeId,
            order_id: "order-one",
            shipment_id: "shipment-one",
            settlement_id: "settlement-one",
          },
          options,
        )
      ).status,
      "succeeded",
    );
    assert.equal(
      (
        await admin().crm.contactList.memberships.refunds.retry(
          {
            store_id: storeId,
            contact_list_id: "list-one",
            membership_id: "membership-one",
            id: "membership-refund-one",
          },
          options,
        )
      ).status,
      "succeeded",
    );
    assert.equal(
      (
        await admin().crm.contactList.memberships.cancellations.retry(
          {
            store_id: storeId,
            contact_list_id: "list-one",
            membership_id: "membership-one",
            id: "cancellation-one",
          },
          options,
        )
      ).status,
      "succeeded",
    );
    assert.equal(
      (
        await admin().crm.contactList.plans.retryCatalog(
          {
            store_id: storeId,
            contact_list_id: "list-one",
            plan_id: "plan-one",
          },
          options,
        )
      ).catalog_status,
      "succeeded",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(transforms, 7);
  assert.equal(successes, 7);
  assert.equal(calls.length, 14);
  for (let index = 0; index < calls.length; index += 2) {
    assert.equal(calls[index].method, "POST");
    assert.match(calls[index].target, /\/retry$/);
    assert.equal(calls[index + 1].method, "GET");
    assert.doesNotMatch(calls[index + 1].target, /\/retry$/);
  }
});
