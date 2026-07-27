import assert from "node:assert/strict";
import test from "node:test";

import {
  ScheduledResultTimeoutError,
  createAdmin,
} from "../dist/admin.js";

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

test("aggregate email observation repeats one deterministic send without callback or transform replay", async () => {
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
        provider_message_id: "provider-message-one",
        provider_thread_id: "provider-thread-one",
      },
      {
        delivery_id: "delivery-two",
        revision: 1,
        recipient: "two@example.test",
        mailbox_id: "mailbox-scheduled",
        template_id: "template-scheduled",
        status: "sending",
        provider_message_id: "provider-message-two",
        provider_thread_id: "provider-thread-two",
      },
    ],
  };
  const sent = {
    sent: 2,
    deliveries: pending.deliveries.map((delivery) => ({
      ...delivery,
      revision: 2,
      status: "sent",
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
      method: init.method,
      headers: new Headers(init.headers),
      body: JSON.parse(String(init.body)),
    });
    return jsonResponse(calls.length === 1 ? pending : sent);
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
    assert.equal(result.deliveries[0].provider_message_id, "provider-message-one");
    assert.equal(result.deliveries[1].provider_thread_id, "provider-thread-two");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].body, calls[1].body);
  assert.equal(calls[0].body.transformed_once, true);
  assert.ok(
    calls.every(
      (call) =>
        call.url === `${baseUrl}/v1/notifications/email` &&
        call.method === "POST" &&
        call.headers.get("x-observation-contract") === "preserved",
    ),
  );
  assert.equal(transforms, 1);
  assert.equal(successes, 1);
  assert.equal(errors, 0);
});

test("checkout observation replays the exact transformed body but mutation callbacks only once", async () => {
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
  const captured = {
    ...pending,
    payment: {
      ...pending.payment,
      status: { status: "captured", at: 2, amount: 1250 },
      paid: 1250,
    },
  };
  const bodies = [];
  let transforms = 0;
  let successes = 0;
  let errors = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init = {}) => {
    bodies.push(JSON.parse(String(init.body)));
    return jsonResponse(bodies.length === 1 ? pending : captured);
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
    assert.equal(result.payment.status.status, "captured");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(bodies.length, 2);
  assert.deepEqual(bodies[0], bodies[1]);
  assert.equal(bodies[0].transformed_once, true);
  assert.equal(transforms, 1);
  assert.equal(successes, 1);
  assert.equal(errors, 0);
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
    deleted: false,
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
