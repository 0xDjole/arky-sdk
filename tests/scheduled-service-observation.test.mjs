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

test("support AI POSTs once, polls the exact message, then loads the conversation once", async () => {
  const publishableKey = `arky_pk_${"s".repeat(43)}`;
  const visitorToken = `customer_visitor_${"a".repeat(64)}`;
  const supportToken = "b".repeat(64);
  const messageId = "support-message-scheduled";
  const pending = {
    conversation: { id: "conversation-scheduled", status: { type: "ai_mode" } },
    messages_cursor: null,
    messages: [
      {
        id: messageId,
        role: "user",
        content: "Help",
        ai_response_status: { type: "requested", requested_at: 1 },
      },
    ],
  };
  const succeeded = {
    ...pending,
    messages: [
      {
        ...pending.messages[0],
        ai_response_status: { type: "succeeded", completed_at: 10 },
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
    conversation: { id: "conversation-escalated", status: { type: "escalated" } },
    messages_cursor: null,
    messages: [
      {
        id: "support-handoff-response",
        role: "action",
        content: "A team member will join shortly.",
        metadata: {},
        ai_response_status: null,
      },
    ],
  };
  const requestedMessage = {
    id: messageId,
    role: "user",
    content: "Talk to human",
    metadata: { input: { type: "button", label: "Talk to human" } },
    ai_response_status: null,
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
    conversation: { id: "conversation-staff", status: { type: "escalated" } },
    messages_cursor: null,
    messages: [],
  };
  const requestedMessage = {
    id: messageId,
    store_id: storeId,
    conversation_id: "conversation-staff",
    role: "user",
    content: "I can help from here.",
    metadata: { input: { type: "text", content: "I can help from here." } },
    ai_response_status: null,
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

test("direct provider calls keep their explicit Store scope", async () => {
  const replacementStoreId = "a7c3e1f5-6b28-4d90-9e4a-2f8d0b6c1e73";
  const client = createAdmin({
    baseUrl,
    apiToken: "scheduled-contract-token",
  });
  assert.equal("setStoreId" in client, false);
  const providerId = "provider-store-scope";
  const requestId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const params = {
    store_id: storeId,
    id: providerId,
    request_id: requestId,
    expected_updated_at: 7,
    configuration: { type: "access", restricted_key: "rk_test_scope", publishable_key: "pk_test_scope" },
  };
  const change = {
    store_id: storeId, payment_option_id: providerId, request_id: requestId, type: "access",
    expected_updated_at: 7, accepted_updated_at: 8, accepted_at: 8, account_id: "acct_scope", livemode: false,
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const target = String(url);
    calls.push({ target, method: init.method || "GET", body: init.body ? JSON.parse(String(init.body)) : null });
    if (init.method === "POST") {
      params.store_id = replacementStoreId;
      return jsonResponse(change);
    }
    throw new Error(`Unexpected provider observation: ${target}`);
  };

  try {
    assert.deepEqual(await client.store.paymentOption.stripe.configure(params), change);
    await assert.rejects(async () => client.store.paymentOption.stripe.configure({ ...params, store_id: undefined }), TypeError);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map(({ target, method }) => [target.replace(baseUrl, ""), method]),
    [
      [
        `/v1/stores/${storeId}/payment-options/stripe/${providerId}/configuration`,
        "POST",
      ],
    ],
  );
  assert.deepEqual(calls[0].body, {
    request_id: requestId,
    expected_updated_at: 7,
    configuration: { type: "access", restricted_key: "rk_test_scope", publishable_key: "pk_test_scope" },
  });
});
