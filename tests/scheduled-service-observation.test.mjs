import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const conversationId = "7c2e9a41-5b3d-4f86-a1e0-3d4c2b9f6e18";
const messageId = "2a6d8f13-9c47-4e05-b1a8-6f3e0c2d7b95";
const supportToken = "s".repeat(64);
const conversationPath = `/v1/storefront/support/conversations/${conversationId}`;

function conversation(status = { type: "ai", step_key: "assistant" }) {
  return { id: conversationId, store_id: ids.store, channel_id: "channel", language: "en", status, created_at: 1, updated_at: 1 };
}

function chatMessage(aiReply) {
  return { id: messageId, store_id: ids.store, conversation_id: conversationId, type: { type: "customer_chat", text: "Help", ai_reply: aiReply }, created_at: 1, updated_at: 1 };
}

function storefront() {
  return createStorefront(publishableKey, { apiUrl, sessionStorage: visitorStorage() });
}

test("support sends once, follows the exact message while the AI reply is pending, then reads the conversation once", async (context) => {
  const pending = { conversation: conversation(), messages_cursor: null, messages: [chatMessage({ type: "waiting" })] };
  const answered = {
    conversation: conversation(),
    messages_cursor: null,
    messages: [
      chatMessage({ type: "answered" }),
      { id: "assistant", store_id: ids.store, conversation_id: conversationId, type: { type: "ai", text: "How can I help?" }, created_at: 2, updated_at: 2 },
    ],
  };
  let observations = 0;
  const calls = recordFetch(context, (call) => {
    if (call.method === "POST") return pending;
    if (call.path === `${conversationPath}/messages/${messageId}`) {
      observations += 1;
      return chatMessage(observations === 1 ? { type: "answering", until: 5 } : { type: "answered" });
    }
    if (call.path === conversationPath) return answered;
    throw new Error(`Unexpected support request: ${call.method} ${call.path}`);
  });
  let successes = 0;
  const result = await storefront().support.sendMessage(
    { conversation_id: conversationId, support_token: supportToken, message_id: messageId, input: { type: "text", text: "Help" } },
    { onSuccess() { successes += 1; } },
  );
  assert.deepEqual(result, answered);
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["POST", `${conversationPath}/messages`],
    ["GET", `${conversationPath}/messages/${messageId}`],
    ["GET", `${conversationPath}/messages/${messageId}`],
    ["GET", conversationPath],
  ]);
  assert.deepEqual(calls[0].body, { message_id: messageId, input: { type: "text", text: "Help" } });
  for (const call of calls) {
    assert.equal(call.headers.get("x-arky-support-token"), supportToken);
    assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
  }
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(successes, 1);
});

test("support reads the exact message once when the write answer left it out, and returns the write answer when nothing is pending", async (context) => {
  const escalated = { conversation: conversation({ type: "escalated" }), messages_cursor: null, messages: [] };
  const calls = recordFetch(context, (call) => call.method === "POST" ? escalated : chatMessage({ type: "not_asked" }));
  const result = await storefront().support.sendMessage({
    conversation_id: conversationId,
    support_token: supportToken,
    message_id: messageId,
    input: { type: "button", label: "Talk to a person" },
  });
  assert.deepEqual(result, escalated);
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["POST", `${conversationPath}/messages`],
    ["GET", `${conversationPath}/messages/${messageId}`],
  ]);
});

test("a message the AI isn't asked to answer returns the write answer without any observation", async (context) => {
  const sent = { conversation: conversation({ type: "flow", step_key: "start" }), messages_cursor: null, messages: [chatMessage({ type: "not_asked" })] };
  const calls = recordFetch(context, () => sent);
  assert.deepEqual(await storefront().support.sendMessage({ conversation_id: conversationId, support_token: supportToken, message_id: messageId, input: { type: "text", text: "Help" } }), sent);
  assert.equal(calls.length, 1);
});

test("the caller's abort stops a pending observation", async (context) => {
  const controller = new AbortController();
  const calls = recordFetch(context, (call) => {
    if (call.method === "POST") return { conversation: conversation(), messages_cursor: null, messages: [chatMessage({ type: "waiting" })] };
    controller.abort(new Error("left the chat"));
    return chatMessage({ type: "waiting" });
  });
  await assert.rejects(
    storefront().support.sendMessage({ conversation_id: conversationId, support_token: supportToken, message_id: messageId, input: { type: "text", text: "Help" } }, { signal: controller.signal }),
    /left the chat/,
  );
  assert.deepEqual(calls.map(({ method }) => method), ["POST", "GET"]);
});

test("the support token travels only in its header, a caller copy is replaced, and a missing token or message id is refused before any request", async (context) => {
  const calls = recordFetch(context, () => ({ conversation: conversation(), messages_cursor: null, messages: [] }));
  const support = storefront().support;
  await support.getConversation(
    { conversation_id: conversationId, support_token: supportToken, message_limit: 20, message_cursor: "older" },
    { headers: { "X-ARKY-SUPPORT-TOKEN": "forged" } },
  );
  assert.equal(calls[0].path, conversationPath);
  assert.deepEqual(calls[0].query, { message_limit: "20", message_cursor: "older" });
  assert.equal(calls[0].headers.get("x-arky-support-token"), supportToken);
  await assert.rejects(support.getConversation({ conversation_id: conversationId, support_token: "" }), /needs the token its start returned/);
  await assert.rejects(support.getMessage({ conversation_id: conversationId, message_id: messageId, support_token: "" }), /needs the token its start returned/);
  await assert.rejects(support.sendMessage({ conversation_id: conversationId, support_token: supportToken, message_id: "message-1", input: { type: "text", text: "x" } }), {
    name: "TypeError",
    message: "The support message id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 1);
});

test("an account reply is one write with the app-picked message id and no scheduled observation", async (context) => {
  const answer = { conversation: { id: conversationId }, messages_cursor: null, messages: [] };
  const calls = recordFetch(context, () => answer);
  const admin = createAdmin({ baseUrl: apiUrl, apiToken: "arky_api_support" });
  assert.equal("sendConversationMessage" in admin.support.conversation, false);
  assert.deepEqual(await admin.support.conversation.reply({ store_id: ids.store, conversation_id: conversationId, message_id: messageId, expected_updated_at: 4, text: "I can help from here.", resolve: false }), answer);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${ids.store}/support/conversations/${conversationId}/reply`, { message_id: messageId, expected_updated_at: 4, text: "I can help from here.", resolve: false }],
  ]);
  await assert.rejects(async () => admin.support.conversation.reply({ store_id: ids.store, conversation_id: conversationId, message_id: "reply-1", expected_updated_at: 4, text: "x", resolve: true }), TypeError);
  assert.equal(calls.length, 1);
});
