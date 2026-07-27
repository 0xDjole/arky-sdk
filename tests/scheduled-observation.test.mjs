import assert from "node:assert/strict";
import test from "node:test";

import {
  ScheduledResultTimeoutError,
  createAdmin,
} from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";

const baseUrl = "https://api.example.test";
const storeId = "store-scheduled";

function admin() {
  return createAdmin({
    baseUrl,
    storeId,
    apiToken: "scheduled-contract-token",
  });
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("aggregate email sends once and observes only its exact delivery resources", async () => {
  const request = {
    send_id: "send-scheduled",
    send: {
      type: "subscription_confirmation",
      data: {
        store_id: storeId,
        mailbox_id: "mailbox-scheduled",
        template_id: "template-scheduled",
        recipients: ["one@example.test", "two@example.test"],
      },
    },
  };
  const pending = {
    sent: 0,
    deliveries: [
      {
        delivery_id: "delivery-one",
        revision: 1,
        recipient: "one@example.test",
        mailbox_id: "mailbox-scheduled",
        template_id: "template-scheduled",
        status: "pending",
      },
      {
        delivery_id: "delivery-two",
        revision: 1,
        recipient: "two@example.test",
        mailbox_id: "mailbox-scheduled",
        template_id: "template-scheduled",
        status: "sending",
      },
    ],
  };
  const sent = {
    sent: 2,
    deliveries: pending.deliveries.map((delivery, index) => ({
      ...delivery,
      revision: 2,
      status: "sent",
      provider_message_id: `provider-message-${index + 1}`,
      provider_thread_id: `provider-thread-${index + 1}`,
    })),
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
      headers: new Headers(init.headers),
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    });
    if (init.method === "POST") return jsonResponse(pending);
    const delivery = sent.deliveries.find((candidate) =>
      String(url).endsWith(candidate.delivery_id),
    );
    if (!delivery) throw new Error(`Unexpected email observation: ${url}`);
    return jsonResponse({
      id: delivery.delivery_id,
      revision: delivery.revision,
      status: delivery.status,
      error: delivery.error,
      provider_message_id: delivery.provider_message_id,
      provider_thread_id: delivery.provider_thread_id,
    });
  };

  try {
    const result = await admin().notification.email.send(request, {
      headers: { "x-observation-contract": "preserved" },
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
    });

    assert.deepEqual(result, sent);
    assert.equal(result.deliveries[0].provider_message_id, "provider-message-1");
    assert.equal(result.deliveries[1].provider_thread_id, "provider-thread-2");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 3);
  assert.equal(calls[0].body.transformed_once, true);
  assert.deepEqual(
    calls.map((call) => [call.url, call.method]),
    [
      [`${baseUrl}/v1/notifications/email`, "POST"],
      [
        `${baseUrl}/v1/notifications/email-deliveries/delivery-one`,
        "GET",
      ],
      [
        `${baseUrl}/v1/notifications/email-deliveries/delivery-two`,
        "GET",
      ],
    ],
  );
  assert.ok(
    calls.every(
      (call) =>
        call.headers.get("x-observation-contract") === "preserved",
    ),
  );
  assert.equal(transforms, 1);
  assert.equal(successes, 1);
  assert.equal(errors, 0);
});

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
    },
    payment: {
      ...pending.payment,
      status: { status: "requires_action", at: 2 },
      payment_action: {
        type: "handle_next_action",
        client_secret: "pi_scheduled_secret",
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
      [
        `${baseUrl}/v1/stores/${storeId}/carts/cart-scheduled/checkout`,
        "POST",
      ],
      [
        `${baseUrl}/v1/stores/${storeId}/orders/order-scheduled/payment`,
        "GET",
      ],
    ],
  );
  assert.equal(calls[0].body.transformed_once, true);
  assert.equal(calls[1].body, undefined);
  assert.equal(transforms, 1);
  assert.equal(successes, 1);
  assert.equal(errors, 0);
});

test("storefront checkout observes the exact payment action without repeating checkout", async () => {
  const publishableKey = `arky_pk_${"s".repeat(43)}`;
  const visitorToken = `arky_vst_${"c".repeat(64)}`;
  const pending = {
    order_id: "storefront-order-scheduled",
    number: "1002",
    payment_action: { type: "none" },
    payment: {
      status: { status: "processing", at: 1 },
      payment_action: { type: "none" },
      amount: 1250,
      currency: "EUR",
      paid: 0,
      method_type: "credit_card",
    },
  };
  const observedPayment = {
    ...pending.payment,
    status: { status: "requires_action", at: 2 },
    payment_action: {
      type: "handle_next_action",
      client_secret: "pi_storefront_scheduled_secret",
    },
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || "GET" });
    return jsonResponse(
      init.method === "POST" ? pending : observedPayment,
    );
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
      id: "storefront-cart-scheduled",
      payment_method_key: "credit_card",
    });
    assert.equal(result.payment.status.status, "requires_action");
    assert.deepEqual(
      result.payment_action,
      observedPayment.payment_action,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map((call) => [call.url, call.method]),
    [
      [
        `${baseUrl}/v1/storefront/carts/storefront-cart-scheduled/checkout`,
        "POST",
      ],
      [
        `${baseUrl}/v1/storefront/orders/storefront-order-scheduled/payment`,
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

test("support AI POSTs once, polls the exact message, then loads the conversation once", async () => {
  const publishableKey = `arky_pk_${"s".repeat(43)}`;
  const visitorToken = `arky_vst_${"a".repeat(64)}`;
  const supportToken = "b".repeat(64);
  const messageId = "support-message-scheduled";
  const pending = {
    conversation: { id: "conversation-scheduled", status: "ai_mode" },
    messages: [
      {
        id: messageId,
        role: "user",
        content: "Help",
        ai_response: { status: "requested" },
      },
    ],
  };
  const succeeded = {
    ...pending,
    messages: [
      {
        ...pending.messages[0],
        ai_response: { status: "succeeded", completed_at: 10 },
      },
      {
        id: "support-assistant-scheduled",
        role: "assistant",
        content: "How can I help?",
      },
    ],
  };
  const calls = [];
  let successes = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    });
    if (init.method === "POST") return jsonResponse(pending);
    if (String(url).endsWith(`/messages/${messageId}`)) {
      return jsonResponse(succeeded.messages[0]);
    }
    return jsonResponse(succeeded);
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
    const result = await storefront.support.sendMessage(
      {
        conversation_id: "conversation-scheduled",
        support_token: supportToken,
        message_id: messageId,
        input: { type: "text", content: "Help" },
      },
      {
        onSuccess() {
          successes += 1;
        },
      },
    );
    assert.deepEqual(result, succeeded);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 3);
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[1].method, "GET");
  assert.equal(
    calls[1].url,
    `${baseUrl}/v1/storefront/support/conversations/conversation-scheduled/messages/${messageId}`,
  );
  assert.equal(calls[2].method, "GET");
  assert.equal(
    calls[2].url,
    `${baseUrl}/v1/storefront/support/conversations/conversation-scheduled`,
  );
  assert.equal(calls[0].body.message_id, messageId);
  assert.equal(successes, 1);
});

test("social classification POSTs once and observes the exact run with GET", async () => {
  const runId = "classification-run-scheduled";
  const pending = {
    run_id: runId,
    status: "requested",
    comments_scanned: 2,
    comments_classified: 0,
    comments_skipped: 0,
    comments: [],
    skipped_comment_ids: [],
    errors: [],
  };
  const succeeded = {
    ...pending,
    status: "succeeded",
    comments_classified: 2,
    completed_at: 20,
    comments: [
      { id: "comment-one", classification_intent: "lead" },
      { id: "comment-two", classification_intent: "support" },
    ],
  };
  const calls = [];
  let transforms = 0;
  let successes = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    });
    return jsonResponse(calls.length === 1 ? pending : succeeded);
  };

  try {
    const result = await admin().social.publication.classifyComments(
      {
        store_id: storeId,
        publication_id: "publication-scheduled",
        force: true,
      },
      {
        transformRequest(body) {
          transforms += 1;
          return { ...body, transformed_once: true };
        },
        onSuccess() {
          successes += 1;
        },
      },
    );
    assert.deepEqual(result, succeeded);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 2);
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[1].method, "GET");
  assert.equal(
    calls[0].url,
    `${baseUrl}/v1/stores/${storeId}/social-publications/comments/classify`,
  );
  assert.equal(
    calls[1].url,
    `${baseUrl}/v1/stores/${storeId}/social-publications/comments/classifications/${runId}`,
  );
  assert.equal(calls[0].body.transformed_once, true);
  assert.equal(transforms, 1);
  assert.equal(successes, 1);
});

test("scheduled observations stay scoped to the store captured by their mutation", async () => {
  const originalStoreId = "store-original";
  const replacementStoreId = "store-replacement";
  const client = createAdmin({
    baseUrl,
    storeId: originalStoreId,
    apiToken: "scheduled-contract-token",
  });
  const providerId = "provider-store-scope";
  const runId = "classification-store-scope";
  const requestedProvider = {
    id: providerId,
    store_id: originalStoreId,
    key: "stripe",
    provider: {
      type: "stripe",
      onboarding_status: "pending",
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
    },
    connection: {
      status: "requested",
      revision: 1,
      attempts: 0,
      requested_at: 1,
    },
    created_at: 1,
    updated_at: 1,
  };
  const requestedRun = {
    run_id: runId,
    status: "requested",
    comments_scanned: 0,
    comments_classified: 0,
    comments_skipped: 0,
    comments: [],
    skipped_comment_ids: [],
    errors: [],
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const target = String(url);
    calls.push({ target, method: init.method || "GET" });
    if (init.method === "POST") {
      client.setStoreId(replacementStoreId);
      if (target.endsWith("/payment-providers/stripe/connect")) {
        return jsonResponse({
          provider: requestedProvider,
          onboarding_url: "",
        });
      }
      return jsonResponse(requestedRun);
    }
    if (target.endsWith(`/payment-providers/${providerId}/connection`)) {
      return jsonResponse({
        provider: {
          ...requestedProvider,
          connection: {
            ...requestedProvider.connection,
            status: "succeeded",
            attempts: 1,
            completed_at: 2,
          },
        },
        onboarding_url: "https://connect.example.test/onboarding",
      });
    }
    return jsonResponse({
      ...requestedRun,
      status: "succeeded",
      completed_at: 2,
    });
  };

  try {
    await client.store.paymentProvider.connectStripe({
      return_url: "https://admin.example.test/return",
      refresh_url: "https://admin.example.test/refresh",
      country: "BA",
    });
    client.setStoreId(originalStoreId);
    await client.social.publication.classifyComments();
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map(({ target, method }) => [
      target.replace(baseUrl, ""),
      method,
    ]),
    [
      [
        `/v1/stores/${originalStoreId}/payment-providers/stripe/connect`,
        "POST",
      ],
      [
        `/v1/stores/${originalStoreId}/payment-providers/${providerId}/connection`,
        "GET",
      ],
      [
        `/v1/stores/${originalStoreId}/social-publications/comments/classify`,
        "POST",
      ],
      [
        `/v1/stores/${originalStoreId}/social-publications/comments/classifications/${runId}`,
        "GET",
      ],
    ],
  );
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
    if (
      target.includes("/shipments/shipment-one/refunds/refund-one")
    ) {
      return jsonResponse({
        id: "refund-one",
        status: method === "POST" ? "processing" : "succeeded",
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

  assert.equal(transforms, 6);
  assert.equal(successes, 6);
  assert.equal(calls.length, 12);
  for (let index = 0; index < calls.length; index += 2) {
    assert.equal(calls[index].method, "POST");
    assert.match(calls[index].target, /\/retry$/);
    assert.equal(calls[index + 1].method, "GET");
    assert.doesNotMatch(calls[index + 1].target, /\/retry$/);
  }
});

test("shipping settlement retry POSTs once and observes the exact settlement resource", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method });
    return jsonResponse({
      id: "settlement-one",
      status: init.method === "POST" ? "requested" : "succeeded",
    });
  };

  try {
    const result = await admin().eshop.shipment.settlement.retry({
      store_id: storeId,
      order_id: "order-one",
      shipment_id: "shipment-one",
      settlement_id: "settlement-one",
    });
    assert.equal(result.status, "succeeded");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 2);
  assert.equal(calls[0].method, "POST");
  assert.match(calls[0].url, /\/settlements\/settlement-one\/retry$/);
  assert.equal(calls[1].method, "GET");
  assert.match(calls[1].url, /\/settlements\/settlement-one$/);
});

test("blocked payment-provider deletion returns authoritative evidence without polling", async () => {
  const calls = [];
  const blocked = {
    id: "deletion-blocked",
    store_id: storeId,
    payment_provider_id: "provider-blocked",
    revision: 3,
    status: "blocked",
    terminal: true,
    requested_at: 1,
    processing_started_at: 2,
    completed_at: 3,
    error: {
      type: "provider_binding_changed",
      message: "provider is still in use",
      at: 3,
    },
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method });
    return jsonResponse(blocked);
  };

  try {
    assert.deepEqual(
      await admin().store.paymentProvider.delete({
        store_id: storeId,
        id: "provider-blocked",
      }),
      blocked,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "DELETE");
});

test("observation timeout is typed, fast-testable, and carries the last authoritative result", async () => {
  const pending = {
    order_id: "order-timeout",
    payment: {
      status: { status: "processing", at: 1 },
    },
  };
  const originalFetch = globalThis.fetch;
  const originalSetTimeout = globalThis.setTimeout;
  let triggerDeadline;
  let observationSignal;
  let calls = 0;
  let transforms = 0;
  let successes = 0;

  globalThis.fetch = async (_url, init = {}) => {
    calls += 1;
    if (calls === 1) return jsonResponse(pending);
    observationSignal = init.signal;
    queueMicrotask(() => triggerDeadline());
    return new Promise((_resolve, reject) => {
      init.signal.addEventListener(
        "abort",
        () => reject(init.signal.reason),
        { once: true },
      );
    });
  };
  globalThis.setTimeout = (callback, delay = 0, ...args) => {
    if (Number(delay) === 20_000) {
      triggerDeadline = () => callback(...args);
      return originalSetTimeout(() => {}, 60_000);
    }
    return originalSetTimeout(callback, 0, ...args);
  };

  try {
    await assert.rejects(
      admin().eshop.cart.checkout(
        {
          id: "cart-timeout",
          store_id: storeId,
          payment_method_key: "credit_card",
        },
        {
          transformRequest(body) {
            transforms += 1;
            return body;
          },
          onSuccess() {
            successes += 1;
          },
        },
      ),
      (error) => {
        assert.ok(error instanceof ScheduledResultTimeoutError);
        assert.equal(
          error.lastResult.payment.status.status,
          "processing",
        );
        assert.match(error.message, /observation timed out/i);
        assert.doesNotMatch(error.message, /delivery failed/i);
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalSetTimeout;
  }

  assert.equal(calls, 2);
  assert.equal(observationSignal.aborted, true);
  assert.equal(transforms, 1);
  assert.equal(successes, 1);
});

test("an observation failure does not replay the caller error callback", async () => {
  const pending = {
    order_id: "order-observation-error",
    payment: {
      status: { status: "processing", at: 1 },
    },
  };
  let calls = 0;
  let successes = 0;
  let errors = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    calls += 1;
    return calls === 1
      ? jsonResponse(pending)
      : jsonResponse(
          {
            message: "observation unavailable",
            error: "OBSERVATION_UNAVAILABLE",
            statusCode: 503,
            validationErrors: [],
          },
          503,
        );
  };

  try {
    await assert.rejects(
      admin().eshop.cart.checkout(
        {
          id: "cart-observation-error",
          store_id: storeId,
          payment_method_key: "credit_card",
        },
        {
          onSuccess() {
            successes += 1;
          },
          onError() {
            errors += 1;
          },
        },
      ),
      /observation unavailable/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls, 2);
  assert.equal(successes, 1);
  assert.equal(errors, 0);
});
