import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import {
  admin,
  baseUrl,
  jsonResponse,
  storeId,
} from "./helpers/scheduled-observation-fixtures.mjs";

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
    assert.equal(
      result.deliveries[0].provider_message_id,
      "provider-message-1",
    );
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
      [`${baseUrl}/v1/notifications/email-deliveries/delivery-one`, "GET"],
      [`${baseUrl}/v1/notifications/email-deliveries/delivery-two`, "GET"],
    ],
  );
  assert.ok(
    calls.every(
      (call) => call.headers.get("x-observation-contract") === "preserved",
    ),
  );
  assert.equal(transforms, 1);
  assert.equal(successes, 1);
  assert.equal(errors, 0);
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
        run_id: runId,
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

test("direct provider calls and scheduled observations keep their original store scope", async () => {
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
          onboarding_url: null,
        });
      }
      return jsonResponse(requestedRun);
    }
    return jsonResponse({
      ...requestedRun,
      status: "succeeded",
      completed_at: 2,
    });
  };

  try {
    await client.store.paymentProvider.stripe.connect({
      return_url: "https://admin.example.test/return",
      refresh_url: "https://admin.example.test/refresh",
      country: "BA",
    });
    client.setStoreId(originalStoreId);
    await client.social.publication.classifyComments({
      run_id: requestedRun.run_id,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map(({ target, method }) => [target.replace(baseUrl, ""), method]),
    [
      [
        `/v1/stores/${originalStoreId}/payment-providers/stripe/connect`,
        "POST",
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
