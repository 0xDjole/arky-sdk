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

function storedVisitorSession(token, customerId = "customer-scheduled-contract") {
  return JSON.stringify({
    version: 2,
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

test("support AI POSTs once, polls the exact message, then loads the conversation once", async () => {
  const publishableKey = `arky_pk_${"s".repeat(43)}`;
  const visitorToken = `customer_visitor_${"a".repeat(64)}`;
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
        getItem: () => storedVisitorSession(visitorToken),
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

test("storefront support exact-reads a requested message omitted from the write response", async () => {
  const publishableKey = `arky_pk_${"s".repeat(43)}`;
  const visitorToken = `customer_visitor_${"a".repeat(64)}`;
  const supportToken = "c".repeat(64);
  const messageId = "support-message-exact-observation";
  const response = {
    conversation: { id: "conversation-escalated", status: "escalated" },
    messages: [
      {
        id: "support-handoff-response",
        role: "action",
        content: "A team member will join shortly.",
        metadata: {},
        ai_response: null,
      },
    ],
  };
  const requestedMessage = {
    id: messageId,
    role: "user",
    content: "Talk to human",
    metadata: { input: { type: "button", label: "Talk to human" } },
    ai_response: null,
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method || "GET",
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    });
    if (init.method === "POST") return jsonResponse(response);
    if (String(url).endsWith(`/messages/${messageId}`)) {
      return jsonResponse(requestedMessage);
    }
    throw new Error(`Unexpected support observation: ${url}`);
  };

  let result;
  try {
    const storefront = createStorefront(publishableKey, {
      apiUrl: baseUrl,
      sessionStorage: {
        getItem: () => storedVisitorSession(visitorToken),
        setItem() {},
        removeItem() {},
      },
    });
    result = await storefront.support.sendMessage({
      conversation_id: "conversation-escalated",
      support_token: supportToken,
      message_id: messageId,
      input: { type: "button", label: "Talk to human" },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(result, response);
  assert.deepEqual(
    calls.map((call) => [call.url, call.method]),
    [
      [
        `${baseUrl}/v1/storefront/support/conversations/conversation-escalated/messages`,
        "POST",
      ],
      [
        `${baseUrl}/v1/storefront/support/conversations/conversation-escalated/messages/${messageId}`,
        "GET",
      ],
    ],
  );
  assert.equal(calls[0].body.message_id, messageId);
});

test("admin support exact-reads a requested message omitted from the write response", async () => {
  const messageId = "support-staff-message-exact-observation";
  const response = {
    conversation: { id: "conversation-staff", status: "escalated" },
    messages: [],
  };
  const requestedMessage = {
    id: messageId,
    store_id: storeId,
    conversation_id: "conversation-staff",
    role: "user",
    content: "I can help from here.",
    metadata: { input: { type: "text", content: "I can help from here." } },
    ai_response: null,
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method || "GET",
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    });
    if (init.method === "POST") return jsonResponse(response);
    if (String(url).endsWith(`/messages/${messageId}`)) {
      return jsonResponse(requestedMessage);
    }
    throw new Error(`Unexpected support observation: ${url}`);
  };

  let result;
  try {
    result = await admin().support.sendConversationMessage({
      store_id: storeId,
      conversation_id: "conversation-staff",
      message_id: messageId,
      input: { type: "text", content: "I can help from here." },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(result, response);
  assert.deepEqual(
    calls.map((call) => [call.url, call.method]),
    [
      [
        `${baseUrl}/v1/stores/${storeId}/support/conversations/conversation-staff/messages`,
        "POST",
      ],
      [
        `${baseUrl}/v1/stores/${storeId}/support/conversations/conversation-staff/messages/${messageId}`,
        "GET",
      ],
    ],
  );
  assert.equal(calls[0].body.message_id, messageId);
});

test("direct provider calls keep their original store scope", async () => {
  const originalStoreId = "store-original";
  const replacementStoreId = "store-replacement";
  const client = createAdmin({
    baseUrl,
    storeId: originalStoreId,
    apiToken: "scheduled-contract-token",
  });
  const providerId = "provider-store-scope";
  const requestedProvider = {
    id: providerId,
    store_id: originalStoreId,
    type: "stripe",
    setup_status: "pending",
    payments_enabled: false,
    payouts_enabled: false,
    platform_debits_authorized: false,
    state_observed_at: 1,
    disabled_at: null,
    created_at: 1,
    updated_at: 1,
  };
  const requestedConnection = {
    id: "connection-store-scope",
    store_id: originalStoreId,
    payment_provider_id: providerId,
    type: "stripe",
    status: "requested",
    requested_at: 1,
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const target = String(url);
    calls.push({ target, method: init.method || "GET" });
    if (init.method === "POST") {
      client.setStoreId(replacementStoreId);
      return jsonResponse({
        provider: requestedProvider,
        connection: requestedConnection,
        onboarding_url: null,
      });
    }
    throw new Error(`Unexpected provider observation: ${target}`);
  };

  try {
    await client.store.paymentProvider.stripe.connect({
      attempt_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      return_url: "https://admin.example.test/return",
      refresh_url: "https://admin.example.test/refresh",
      country: "BA",
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
    ],
  );
});
