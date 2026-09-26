#!/usr/bin/env node
import assert from "node:assert/strict";
import { createAdmin } from "../dist/admin.js";
import { stripeConnectionFixture } from "./helpers/stripe-connection.mjs";
import {
  SUPPORTED_STORE_CURRENCIES,
  convertToMajor,
  convertToMinor,
  formatMinor,
  getCurrencyMinorUnits,
} from "../dist/utils.js";

const expectedStoreCurrencies = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
  "CHF",
  "AUD",
  "CAD",
  "HKD",
  "SGD",
  "NZD",
  "KRW",
  "SEK",
  "NOK",
  "DKK",
  "INR",
  "MXN",
  "BRL",
  "ZAR",
  "RUB",
  "TRY",
  "PLN",
  "THB",
  "IDR",
  "MYR",
  "PHP",
  "CZK",
  "ILS",
  "AED",
  "SAR",
  "HUF",
  "RON",
  "BGN",
  "HRK",
  "BAM",
  "RSD",
  "MKD",
  "ALL",
];

assert.deepEqual([...SUPPORTED_STORE_CURRENCIES], expectedStoreCurrencies);
for (const currency of expectedStoreCurrencies) {
  const expectedMinorUnits = currency === "JPY" || currency === "KRW" ? 0 : 2;
  assert.equal(
    getCurrencyMinorUnits(currency),
    expectedMinorUnits,
    `${currency} minor units must match the server currency contract`,
  );
}
assert.equal(getCurrencyMinorUnits(" jpy "), 0);
assert.equal(getCurrencyMinorUnits("IDR"), 2);
assert.equal(getCurrencyMinorUnits("HUF"), 2);
assert.equal(getCurrencyMinorUnits("ALL"), 2);
assert.equal(convertToMinor(12.34, "USD"), 1234);
assert.equal(convertToMajor(1234, "USD"), 12.34);
assert.equal(convertToMinor(100, "JPY"), 100);
assert.equal(convertToMajor(100, "JPY"), 100);
assert.equal(convertToMinor(100, "KRW"), 100);
assert.equal(convertToMajor(100, "KRW"), 100);
assert.match(formatMinor(100, "JPY"), /100/);
assert.doesNotMatch(formatMinor(100, "JPY"), /100[.,]00/);
for (const currency of ["IDR", "HUF", "ALL"]) {
  assert.equal(convertToMajor(1234, currency), 12.34);
  assert.equal(convertToMinor(12.34, currency), 1234);
  assert.match(
    formatMinor(1234, currency),
    /12[.,]34/,
    `${currency} formatting must retain the server's two minor-unit digits`,
  );
}
assert.equal(formatMinor(100, " jpy "), formatMinor(100, "JPY"));
assert.throws(() => convertToMinor(1, "ZZZ"), /Unsupported currency/);

const arky = createAdmin({
  baseUrl: "http://127.0.0.1:1",
  storeId: "contract-store",
  apiToken: "contract-token",
});

assert.equal(typeof arky.account.auth.code, "function");
assert.equal(typeof arky.account.auth.verify, "function");
assert.equal(typeof arky.account.auth.refresh, "function");
assert.equal(typeof arky.account.auth.storeCode, "function");
assert.equal(typeof arky.account.auth.storeVerify, "function");
assert.equal("googleStart" in arky.account.auth, false);
assert.equal("googleComplete" in arky.account.auth, false);
assert.equal("update" in arky.account, false);
assert.equal(typeof arky.account.delete, "function");
assert.equal(typeof arky.account.getMe, "function");
assert.equal(typeof arky.account.search, "function");
assert.equal(typeof arky.account.apiToken.list, "function");
assert.equal(typeof arky.account.apiToken.create, "function");
assert.equal(typeof arky.account.apiToken.update, "function");
assert.equal(typeof arky.account.apiToken.revoke, "function");
assert.equal(typeof arky.account.session.list, "function");
assert.equal(typeof arky.account.session.revoke, "function");

assert.equal(typeof arky.store.create, "function");
assert.equal(typeof arky.store.update, "function");
assert.equal(typeof arky.store.get, "function");
assert.equal(typeof arky.store.find, "function");
assert.equal(typeof arky.store.subscription.getPlans, "function");
assert.equal(typeof arky.store.subscription.select, "function");
assert.equal("getCheckout" in arky.store.subscription, false);
assert.equal(typeof arky.store.subscription.cancel, "function");
assert.equal(typeof arky.store.subscription.reactivate, "function");
assert.equal(typeof arky.store.subscription.createPortalSession, "function");
assert.equal("customer" in arky, false);
assert.equal(typeof arky.eshop.customerGroupMember.find, "function");
assert.equal(typeof arky.eshop.customerGroupMember.get, "function");
assert.equal(typeof arky.eshop.customerGroupMember.join, "function");
assert.equal(typeof arky.eshop.subscription.find, "function");
assert.equal(typeof arky.eshop.subscription.get, "function");
assert.equal(typeof arky.eshop.subscription.findOrders, "function");
assert.equal(typeof arky.store.member.add, "function");
assert.equal(typeof arky.store.member.invite, "function");
assert.equal(typeof arky.store.member.remove, "function");
assert.equal(typeof arky.store.buildHook.list, "function");
assert.equal(typeof arky.store.webhook.list, "function");
assert.equal(typeof arky.store.paymentOption.list, "function");
assert.equal(typeof arky.store.paymentOption.stripe.connect, "function");
assert.equal(typeof arky.store.paymentOption.stripe.refresh, "function");
assert.equal(
  typeof arky.store.paymentOption.stripe.openDashboard,
  "function",
);
assert.equal("delete" in arky.store.paymentOption, false);
assert.equal(typeof arky.media.replaceContent, "function");
assert.equal(typeof arky.classification.create, "function");
assert.equal(typeof arky.classification.find, "function");
assert.equal("classification" in arky.content, false);
assert.equal(typeof arky.content.collection.find, "function");
assert.equal(typeof arky.content.entry.find, "function");
assert.equal(typeof arky.forms.find, "function");
assert.equal(typeof arky.notification.template.find, "function");
assert.equal(typeof arky.actions.find, "function");
assert.equal("cms" in arky, false);
assert.equal("crm" in arky, false);
assert.equal(typeof arky.eshop.digital.product.create, "function");
assert.equal(typeof arky.eshop.digital.asset.upload, "function");

// Stable keys are looked up in the Store's exact index, not composed into old IDs.
const contentKeyCalls = [];
const contentKeyOriginalFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  contentKeyCalls.push([String(url), init.method]);
  return new Response(JSON.stringify({ id: "current-uuid" }), {
    status: 200, headers: { "content-type": "application/json" },
  });
};
try {
  await arky.content.collection.get({ key: "articles" });
  await arky.forms.get({ key: "intake", store_id: "selected-store" });
  await arky.content.collection.get({ id: "collection-uuid" });
  await arky.forms.get({ id: "form-uuid" });
  assert.deepEqual(contentKeyCalls, [
    ["http://127.0.0.1:1/v1/stores/contract-store/collections/by-key/articles", "GET"],
    ["http://127.0.0.1:1/v1/stores/selected-store/forms/by-key/intake", "GET"],
    ["http://127.0.0.1:1/v1/stores/contract-store/collections/collection-uuid", "GET"],
    ["http://127.0.0.1:1/v1/stores/contract-store/forms/form-uuid", "GET"],
  ]);
} finally {
  globalThis.fetch = contentKeyOriginalFetch;
}

const storePlanCalls = [];
assert.equal("subscription" in arky.eshop.cart, false);
assert.equal(typeof arky.eshop.subscription.find, "function");
assert.equal(typeof arky.eshop.subscriptionPlan.create, "function");
const storePlanOriginalFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  const call = {
    url: String(url),
    method: init.method || "GET",
    body: init.body ? JSON.parse(String(init.body)) : null,
  };
  storePlanCalls.push(call);
  const body = { items: [], cursor: null };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
try {
  assert.deepEqual(await arky.store.subscription.getPlans(), {
    items: [],
    cursor: null,
  });
} finally {
  globalThis.fetch = storePlanOriginalFetch;
}
assert.deepEqual(
  storePlanCalls.map(({ url, ...call }) => ({
    ...call,
    url: url.replace("http://127.0.0.1:1", ""),
  })),
  [{ url: "/v1/stores/plans", method: "GET", body: null }],
);

const scheduledAdminCalls = [];
const succeededConnection = stripeConnectionFixture('contract-store', 'provider-scheduled', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
const succeededProvider = succeededConnection.provider;
succeededProvider.configuration.connection.platform_debit_consent = {
  accepted_by: { account_id: 'account-contract', snapshot: { email: 'owner@example.test', credential_type: 'session' } },
  accepted_at: 2, terms_version: 1, revoked_at: null
};
succeededConnection.operation.debit_consent_account_id = 'account-contract';
const selectedSubscription = {
  id: "d397ff50-690b-4da7-9fb9-17740e535d69",
  store_id: "contract-store",
  plan_access: null,
  status: { type: "pending" },
  operation: null,
  checkout: {
    id: "018f477d-1cae-4c12-bf12-123456789abc",
    plan_id: "basic",
    stripe_price_id: "price-basic",
    stripe_customer_id: null,
    trial_end: null,
    expires_at: 10,
    status: {
      type: "open",
      stripe_checkout_session_id: "cs_subscription_contract",
    },
    requested_at: 1,
    updated_at: 2,
  },
  payment_action: {
    type: "stripe_embedded_checkout",
    publishable_key: "pk_test_subscription",
    client_secret: "cs_subscription_secret_contract",
    stripe_account_id: null,
    expires_at: 10,
  },
  trial_started_at: null,
  created_at: 1,
  updated_at: 2,
};
const scheduledOriginalFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  const target = String(url);
  const method = init.method || "GET";
  scheduledAdminCalls.push([target, method]);
  let body;
  if (target.endsWith("/payment-options/stripe/connect")) {
    body = succeededConnection;
  } else if (target.endsWith("/subscription") && method === "POST") {
    body = selectedSubscription;
  } else {
    throw new Error(`Unexpected scheduled admin request: ${method} ${target}`);
  }
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
try {
  const connected = await arky.store.paymentOption.stripe.connect({
    store_id: "contract-store",
    operation_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    payment_option_id: "provider-scheduled",
    authorize_account_debits: true,
    return_url: "https://admin.test/return",
    refresh_url: "https://admin.test/refresh",
    country: "BA",
  });
  assert.equal(connected.onboarding_url, "https://connect.test/onboarding");
  assert.equal(connected.provider.configuration.type, "stripe");
  assert.equal(
    connected.provider.configuration.connection.platform_debit_consent.terms_version,
    1,
  );
  assert.equal(connected.operation.id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

  const subscription = await arky.store.subscription.select({
    store_id: "contract-store",
    checkout_id: "018f477d-1cae-4c12-bf12-123456789abc",
    plan_id: "basic",
    return_url: "https://admin.test/return",
  });
  assert.deepEqual(subscription.status, { type: "pending" });
  assert.equal(subscription.operation, null);
  assert.equal(subscription.plan_access, null);
  assert.equal("provider" in subscription, false);
  assert.equal(
    subscription.checkout.id,
    "018f477d-1cae-4c12-bf12-123456789abc",
  );
  assert.equal(subscription.payment_action.type, "stripe_embedded_checkout");
  assert.equal(
    subscription.payment_action.client_secret,
    "cs_subscription_secret_contract",
  );
} finally {
  globalThis.fetch = scheduledOriginalFetch;
}
assert.deepEqual(
  scheduledAdminCalls.map(([url, method]) => [
    url.replace("http://127.0.0.1:1", ""),
    method,
  ]),
  [
    ["/v1/stores/contract-store/payment-options/stripe/connect", "POST"],
    ["/v1/stores/contract-store/subscription", "POST"],
  ],
);

const mediaOriginalFetch = globalThis.fetch;
let mediaReplacementRequest;
globalThis.fetch = async (url, init = {}) => {
  mediaReplacementRequest = { url: String(url), init };
  return new Response(JSON.stringify({ id: "media-contract" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
try {
  const replacement = await arky.media.replaceContent({
    media_id: "media-contract",
    file: new Blob(["replacement"], { type: "text/plain" }),
  });
  assert.equal(replacement.id, "media-contract");
} finally {
  globalThis.fetch = mediaOriginalFetch;
}
assert.equal(
  mediaReplacementRequest.url,
  "http://127.0.0.1:1/v1/stores/contract-store/media/media-contract/content",
);
assert.equal(mediaReplacementRequest.init.method, "PUT");
assert.equal(
  await mediaReplacementRequest.init.body.get("file").text(),
  "replacement",
);

assert.equal(typeof arky.social.connections.find, "function");
assert.equal(typeof arky.social.connections.connect, "function");
assert.equal(typeof arky.social.connections.disconnect, "function");
assert.equal(typeof arky.social.posts.find, "function");
assert.equal(typeof arky.social.posts.create, "function");
assert.equal(typeof arky.social.posts.get, "function");
assert.equal(typeof arky.social.posts.cancel, "function");
assert.equal(typeof arky.social.posts.messages.find, "function");
assert.equal(typeof arky.social.posts.messages.create, "function");
assert.equal(typeof arky.social.posts.messages.sync, "function");
assert.equal("publication" in arky.social, false);

const socialFetchCalls = [];
const socialOriginalFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  socialFetchCalls.push({
    url: String(url),
    method: init.method,
    body: init.body,
  });
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
try {
  await arky.social.connections.find();
  await arky.social.connections.connect({ type: "facebook_page" });
  await arky.social.connections.disconnect({ connection_id: "connection-1" });
  await arky.social.posts.find({
    social_connection_id: "connection-1",
    limit: 25,
    cursor: "post-cursor",
  });
  await arky.social.posts.create({
    social_connection_id: "connection-1",
    content: {
      type: "facebook_page",
      text: "Exact Social post",
      media_ids: [],
      link_url: null,
    },
    publish_at: 123,
  });
  await arky.social.posts.get({ post_id: "post-1" });
  await arky.social.posts.cancel({ post_id: "post-1" });
  await arky.social.posts.messages.find({
    post_id: "post-1",
    parent_message_id: "parent-1",
    limit: 20,
    cursor: "message-cursor",
  });
  await arky.social.posts.messages.create({
    post_id: "post-1",
    id: "message-1",
    parent_message_id: "parent-1",
    text: "Exact Social reply",
  });
  await arky.social.posts.messages.sync({
    post_id: "post-1",
    sync: {
      type: {
        type: "top_level",
        cursor: null,
        limit: 20,
      },
    },
  });
} finally {
  globalThis.fetch = socialOriginalFetch;
}

assert.deepEqual(
  socialFetchCalls.map(({ method, url }) => [method, new URL(url).pathname]),
  [
    ["GET", "/v1/stores/contract-store/social/connections"],
    ["POST", "/v1/stores/contract-store/social/connections/connect"],
    [
      "POST",
      "/v1/stores/contract-store/social/connections/connection-1/disconnect",
    ],
    ["GET", "/v1/stores/contract-store/social/posts"],
    ["POST", "/v1/stores/contract-store/social/posts"],
    ["GET", "/v1/stores/contract-store/social/posts/post-1"],
    ["POST", "/v1/stores/contract-store/social/posts/post-1/cancel"],
    ["GET", "/v1/stores/contract-store/social/posts/post-1/messages"],
    ["POST", "/v1/stores/contract-store/social/posts/post-1/messages"],
    ["POST", "/v1/stores/contract-store/social/posts/post-1/messages/sync"],
  ],
);
assert.deepEqual(JSON.parse(socialFetchCalls[1].body), {
  type: "facebook_page",
});
assert.deepEqual(JSON.parse(socialFetchCalls[2].body), {});
const socialPostsQuery = new URL(socialFetchCalls[3].url).searchParams;
assert.equal(socialPostsQuery.get("social_connection_id"), "connection-1");
assert.equal(socialPostsQuery.get("limit"), "25");
assert.equal(socialPostsQuery.get("cursor"), "post-cursor");
assert.deepEqual(JSON.parse(socialFetchCalls[4].body), {
  social_connection_id: "connection-1",
  content: {
    type: "facebook_page",
    text: "Exact Social post",
    media_ids: [],
    link_url: null,
  },
  publish_at: 123,
});
assert.deepEqual(JSON.parse(socialFetchCalls[6].body), {});
const socialMessagesQuery = new URL(socialFetchCalls[7].url).searchParams;
assert.equal(socialMessagesQuery.get("parent_message_id"), "parent-1");
assert.equal(socialMessagesQuery.get("limit"), "20");
assert.equal(socialMessagesQuery.get("cursor"), "message-cursor");
assert.deepEqual(JSON.parse(socialFetchCalls[8].body), {
  id: "message-1",
  parent_message_id: "parent-1",
  text: "Exact Social reply",
});
assert.deepEqual(JSON.parse(socialFetchCalls[9].body), {
  sync: {
    type: {
      type: "top_level",
      cursor: null,
      limit: 20,
    },
  },
});

assert.equal(typeof arky.workflow.listConnections, "function");
assert.equal(typeof arky.workflow.getConnectionConnectUrl, "function");
assert.equal(typeof arky.workflow.deleteConnection, "function");

const workflowFetchCalls = [];
const originalFetch = globalThis.fetch;

globalThis.fetch = async (url, init = {}) => {
  workflowFetchCalls.push({
    url: String(url),
    method: init.method,
    body: init.body,
  });
  return new Response(
    JSON.stringify({ authorization_url: "https://oauth.test", state: "state" }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
};

try {
  await arky.workflow.getConnectionConnectUrl({
    type: "google_drive",
  });
} finally {
  globalThis.fetch = originalFetch;
}

assert.equal(workflowFetchCalls[0].method, "POST");
assert.equal(
  workflowFetchCalls[0].url,
  "http://127.0.0.1:1/v1/stores/contract-store/workflow-connections/connect-url",
);
assert.deepEqual(JSON.parse(workflowFetchCalls[0].body), {
  type: "google_drive",
  store_id: "contract-store",
});
assert.equal(workflowFetchCalls.length, 1);

assert.equal(typeof arky.support.createAgent, "function");
assert.equal(typeof arky.support.getAgentDefinition, "function");
assert.equal(typeof arky.support.replaceAgentDefinition, "function");
assert.equal(typeof arky.support.findAgents, "function");
assert.equal(typeof arky.support.findConversations, "function");
assert.equal(typeof arky.support.replyToConversation, "function");
assert.equal("automation" in arky, false);

assert.equal(typeof arky.notification.mailbox.find, "function");
assert.equal(typeof arky.notification.mailbox.connectGoogle, "function");
assert.equal(typeof arky.notification.mailbox.disconnect, "function");
assert.equal("email" in arky.notification, false);

const mailboxFetchCalls = [];
globalThis.fetch = async (url, init = {}) => {
  mailboxFetchCalls.push({
    url: String(url),
    method: init.method,
    body: init.body,
  });
  return new Response(
    JSON.stringify({ authorization_url: "https://oauth.test", state: "state" }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
};

try {
  await arky.notification.mailbox.connectGoogle({
    key: "founder",
    from_name: "Founder",
    sync_enabled: true,
    sync_interval_seconds: 300,
  });
  await arky.notification.mailbox.disconnect({ id: "mailbox-id" });
} finally {
  globalThis.fetch = originalFetch;
}

assert.equal(mailboxFetchCalls[0].method, "POST");
assert.equal(
  mailboxFetchCalls[0].url,
  "http://127.0.0.1:1/v1/stores/contract-store/mailboxes/google/connect-url",
);
assert.deepEqual(JSON.parse(mailboxFetchCalls[0].body), {
  key: "founder",
  from_name: "Founder",
  sync_enabled: true,
  sync_interval_seconds: 300,
});
assert.equal(mailboxFetchCalls[1].method, "POST");
assert.equal(
  mailboxFetchCalls[1].url,
  "http://127.0.0.1:1/v1/stores/contract-store/mailboxes/mailbox-id/disconnect",
);
assert.deepEqual(JSON.parse(mailboxFetchCalls[1].body), {});
assert.equal(typeof arky.campaign.find, "function");
assert.equal(typeof arky.campaign.findEnrollments, "function");
assert.equal(typeof arky.campaignEnrollment.getConversation, "function");
assert.equal(typeof arky.campaignMessage.replaceDraft, "function");
assert.equal(typeof arky.leadResearch.create, "function");

assert.equal("audiences" in arky, false);
assert.equal(typeof arky.eshop.customerGroupMember.findCommands, "function");
assert.equal(typeof arky.eshop.subscription.findCommands, "function");
assert.equal("refunds" in arky.eshop.subscription, false);
assert.equal("disputes" in arky.eshop.subscription, false);
assert.equal("getInventory" in arky.eshop.product, false);
assert.equal(typeof arky.eshop.inventoryLevel.find, "function");

const separateResourceCalls = [];
globalThis.fetch = async (url, init = {}) => {
  separateResourceCalls.push({ url: String(url), method: init.method });
  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
try {
  await arky.support.getAgentDefinition({
    store_id: "contract-store",
    support_agent_id: "agent-contract",
  });
  await arky.eshop.customerGroupMember.find({
    customer_group_id: "audience-contract",
  });
  await arky.eshop.inventoryLevel.find({ inventory_item_id: "item-contract", store_location_id: "location-contract" });
} finally {
  globalThis.fetch = originalFetch;
}
assert.deepEqual(separateResourceCalls, [
  {
    method: "GET",
    url: "http://127.0.0.1:1/v1/stores/contract-store/support/agents/agent-contract/definition",
  },
  {
    method: "GET",
    url: "http://127.0.0.1:1/v1/stores/contract-store/customer-group-members?customer_group_id=audience-contract",
  },
  {
    method: "GET",
    url: "http://127.0.0.1:1/v1/stores/contract-store/inventory-levels?inventory_item_id=item-contract&store_location_id=location-contract",
  },
]);

assert.equal(typeof arky.eshop.refund.create, "function");
const subscriptionOrderCalls = [];
const subscriptionOrders = { items: [], cursor: "next-order-page" };
globalThis.fetch = async (url, init = {}) => {
  subscriptionOrderCalls.push({ url: String(url), method: init.method });
  return new Response(JSON.stringify(subscriptionOrders), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
try {
  assert.deepEqual(await arky.eshop.subscription.findOrders({
    id: "history-subscription",
    limit: 10,
    cursor: "prior-order-page",
  }), subscriptionOrders);
} finally {
  globalThis.fetch = originalFetch;
}
assert.equal(subscriptionOrderCalls.length, 1);
const subscriptionOrderUrl = new URL(subscriptionOrderCalls[0].url);
assert.equal(subscriptionOrderCalls[0].method, "GET");
assert.equal(subscriptionOrderUrl.pathname, "/v1/stores/contract-store/subscriptions/history-subscription/orders");
assert.deepEqual(Object.fromEntries(subscriptionOrderUrl.searchParams), {
  limit: "10",
  cursor: "prior-order-page",
});

assert.equal(arky.eshop.refund.recordCashOnDelivery, undefined);
assert.equal(typeof arky.eshop.refund.recordMoney, "function");
assert.equal(typeof arky.eshop.refund.cancelLocal, "function");
assert.equal(typeof arky.eshop.refund.find, "function");
assert.equal(typeof arky.eshop.refund.get, "function");
assert.equal("createRefund" in arky.eshop.order, false);
assert.equal("getRefunds" in arky.eshop.order, false);
assert.equal("getRefund" in arky.eshop.order, false);
assert.equal("recordCashOnDeliveryRefund" in arky.eshop.order, false);
assert.equal(typeof arky.eshop.payment.get, "function");
assert.equal(typeof arky.eshop.payment.find, "function");
assert.equal(typeof arky.eshop.order.getPayment, "function");
assert.equal(typeof arky.eshop.order.findPayments, "function");
assert.equal(arky.eshop.order.markCashOnDeliveryPaid, undefined);
assert.equal(arky.eshop.payment.markCashOnDeliveryPaid, undefined);
assert.equal(typeof arky.eshop.payment.recordCashOnDeliveryCollection, "function");
assert.equal(typeof arky.eshop.payment.recordManualCollection, "function");
assert.equal(typeof arky.eshop.payment.createManual, "function");
assert.equal(typeof arky.eshop.dispute.find, "function");
assert.equal(typeof arky.eshop.dispute.get, "function");
assert.equal(arky.eshop.order.getDisputes, undefined);
assert.equal(arky.eshop.order.getDispute, undefined);
assert.equal(typeof arky.eshop.shipment.create, "function");
assert.equal(typeof arky.eshop.shipment.dispatch, "function");
assert.equal(typeof arky.eshop.fulfillmentOrder.find, "function");
assert.equal(typeof arky.eshop.fulfillmentOrder.get, "function");
assert.equal(typeof arky.eshop.fulfillmentOrder.unitSlots, "function");
assert.equal("fulfillment" in arky.eshop.shipment, false);
assert.equal(typeof arky.eshop.rental.find, "function");
assert.equal(typeof arky.eshop.rental.execute, "function");
assert.equal("rentalPlacement" in arky.eshop, false);
assert.equal(typeof arky.eshop.subscriptionPlanEntitlement.find, "function");
assert.equal(typeof arky.eshop.subscription.control, "function");
assert.equal("getRates" in arky.eshop.shipment, false);
assert.equal("label" in arky.eshop.shipment, false);
assert.equal(typeof arky.eshop.shippingLabel.quote, "function");
assert.equal(typeof arky.eshop.shippingLabel.request, "function");
assert.equal(typeof arky.eshop.shippingLabel.get, "function");
assert.equal(typeof arky.eshop.shippingLabel.find, "function");
assert.equal(typeof arky.eshop.shippingLabel.reconcile, "function");
assert.equal(typeof arky.eshop.shippingLabelRefund.request, "function");
assert.equal(typeof arky.eshop.shippingLabelRefund.retry, "function");
assert.equal(typeof arky.eshop.shippingLabelRefund.reconcile, "function");
assert.equal(typeof arky.eshop.merchantDebitReversal.request, "function");
assert.equal(typeof arky.eshop.merchantDebitReversal.reconcile, "function");
assert.equal(typeof arky.eshop.orderCredit.create, "function");
assert.equal(typeof arky.eshop.orderCredit.find, "function");
assert.equal(typeof arky.eshop.fulfillmentRoutingPolicy.create, "function");
assert.equal(typeof arky.store.paymentTerms.create, "function");
assert.equal(typeof arky.store.marketSalesChannel.create, "function");
assert.equal(typeof arky.store.storefrontClient.create, "function");
assert.equal("retry" in arky.eshop.shipment, false);
assert.equal("refund" in arky.eshop.shipment, false);
assert.equal("charge" in arky.eshop.shipment, false);

const fulfillmentCalls = [];
globalThis.fetch = async (url, init = {}) => {
  fulfillmentCalls.push({ url: String(url), method: init.method });
  const body = String(url).includes("/fulfillment-orders?")
    ? { items: [], cursor: null }
    : {};
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
try {
  await arky.eshop.fulfillmentOrder.find({
    order_id: "6ba7b81a-9dad-41d1-80b4-00c04fd430c8",
    limit: 20,
  });
  await arky.eshop.fulfillmentOrder.find({
    rental_id: "6ba7b816-9dad-41d1-80b4-00c04fd430c8",
  });
  await arky.eshop.fulfillmentOrder.get({
    fulfillment_order_id: "6ba7b813-9dad-41d1-80b4-00c04fd430c8",
  });
} finally {
  globalThis.fetch = originalFetch;
}
assert.deepEqual(
  fulfillmentCalls.map(({ url, method }) => [url, method]),
  [
    [
      "http://127.0.0.1:1/v1/stores/contract-store/fulfillment-orders?order_id=6ba7b81a-9dad-41d1-80b4-00c04fd430c8&limit=20",
      "GET",
    ],
    [
      "http://127.0.0.1:1/v1/stores/contract-store/fulfillment-orders?rental_id=6ba7b816-9dad-41d1-80b4-00c04fd430c8",
      "GET",
    ],
    [
      "http://127.0.0.1:1/v1/stores/contract-store/fulfillment-orders/6ba7b813-9dad-41d1-80b4-00c04fd430c8",
      "GET",
    ],
  ],
);

const paymentCalls = [];
globalThis.fetch = async (url, init = {}) => {
  paymentCalls.push({
    url: String(url),
    method: init.method,
    body: init.body ? JSON.parse(String(init.body)) : null,
  });
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
try {
  await arky.eshop.payment.get({ id: "payment-1" });
  await arky.eshop.payment.find({ store_id: "another-store", limit: 25, cursor: "next" });
  await arky.eshop.payment.recordCashOnDeliveryCollection({ id: "payment-1", payment_capture_id: "capture-1", money: { amount: 1250, currency: "usd" } });
  await arky.eshop.payment.recordManualCollection({ store_id: "another-store", id: "payment-2", payment_capture_id: "capture-2", money: { amount: 900, currency: "eur" }, reference: "bank-receipt" });
  await arky.eshop.payment.createManual({ id: "payment-3", order_id: "order-3", payment_option_id: "provider-3", money: { amount: 500, currency: "usd" }, reference: null });
} finally {
  globalThis.fetch = originalFetch;
}
assert.deepEqual(
  paymentCalls.map(({ url, method, body }) => [url, method, body]),
  [
    [
      "http://127.0.0.1:1/v1/stores/contract-store/payments/payment-1",
      "GET",
      null,
    ],
    [
      "http://127.0.0.1:1/v1/stores/another-store/payments?limit=25&cursor=next",
      "GET",
      null,
    ],
    [
      "http://127.0.0.1:1/v1/stores/contract-store/payments/payment-1/cash-on-delivery/collections",
      "POST",
      { payment_capture_id: "capture-1", money: { amount: 1250, currency: "usd" } },
    ],
    [
      "http://127.0.0.1:1/v1/stores/another-store/payments/payment-2/manual/collections", "POST",
      { payment_capture_id: "capture-2", money: { amount: 900, currency: "eur" }, reference: "bank-receipt" },
    ],
    [
      "http://127.0.0.1:1/v1/stores/contract-store/payments/manual", "POST",
      { id: "payment-3", order_id: "order-3", payment_option_id: "provider-3", money: { amount: 500, currency: "usd" }, reference: null },
    ],
  ],
);

assert.equal(typeof arky.analytics.get, "function");
const analyticsCalls = [];
globalThis.fetch = async (url, init = {}) => {
  analyticsCalls.push({
    url: String(url),
    method: init.method,
    body: init.body ? JSON.parse(String(init.body)) : null,
  });
  return new Response(
    JSON.stringify({ time: { from: 0, to: 1 }, reports: [] }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
};
try {
  await arky.analytics.get(
    {
      time: { from: 86_400_000, to: 172_800_000 },
      reports: [
        {
          key: "recent_customer_action",
          limit: 100,
          category: "customer_actions",
          cursor_created_at: 86_400_000,
          cursor_id: "fact next",
        },
      ],
    },
    { store_id: "override-store" },
  );
} finally {
  globalThis.fetch = originalFetch;
}
assert.deepEqual(analyticsCalls, [
  {
    url: "http://127.0.0.1:1/v1/stores/override-store/analytics",
    method: "POST",
    body: {
      time: { from: 86_400_000, to: 172_800_000 },
      reports: [
        {
          key: "recent_customer_action",
          limit: 100,
          category: "customer_actions",
          cursor_created_at: 86_400_000,
          cursor_id: "fact next",
        },
      ],
    },
  },
]);

for (const method of ["getCurrencies", "getWebhookEvents"]) {
  assert.equal(typeof arky.platform[method], "function");
}
const platformCalls = [];
globalThis.fetch = async (url, init = {}) => {
  platformCalls.push({
    url: String(url),
    method: init.method,
    body: init.body ?? null,
  });
  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
try {
  await arky.platform.getCurrencies();
  await arky.platform.getWebhookEvents();
} finally {
  globalThis.fetch = originalFetch;
}
assert.deepEqual(platformCalls, [
  {
    url: "http://127.0.0.1:1/v1/platform/currencies",
    method: "GET",
    body: null,
  },
  {
    url: "http://127.0.0.1:1/v1/platform/events",
    method: "GET",
    body: null,
  },
]);

for (const method of [
  "create",
  "update",
  "delete",
  "get",
  "regenerateWebhookUrl",
  "find",
  "invokeWebhook",
  "getExecutions",
  "getExecution",
]) {
  assert.equal(
    typeof arky.workflow[method],
    "function",
    `Admin Workflow must expose ${method}`,
  );
}
for (const obsolete of [
  "getDefinition",
  "replaceDefinition",
  "getTrigger",
  "rotateTrigger",
  "getExecutionDefinition",
  "getExecutionInput",
  "getExecutionResults",
]) {
  assert.equal(obsolete in arky.workflow, false);
}

const workflowCoreCalls = [];
globalThis.fetch = async (url, init = {}) => {
  workflowCoreCalls.push({
    url: String(url),
    method: init.method,
    body: init.body ? JSON.parse(String(init.body)) : null,
  });
  if (init.method === "DELETE") {
    return new Response(null, { status: 204 });
  }
  const body = String(url).includes("?") ? { items: [], cursor: null } : {};
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
try {
  const graph = {
    nodes: {
      start: { type: "transform", code: "input", delay_ms: null },
    },
    edges: [],
  };
  await arky.workflow.create({
    key: "customer_welcome",
    status: "active",
    schedule: null,
    graph,
  });
  await arky.workflow.update({
    store_id: "override-store",
    id: "workflow-contract",
    key: "customer_welcome_v2",
    status: "draft",
    schedule: null,
    graph,
  });
  await arky.workflow.delete({ id: "workflow-contract" });
  await arky.workflow.get({ id: "workflow-contract" });
  await arky.workflow.regenerateWebhookUrl({
    workflow_id: "workflow-contract",
  });
  await arky.workflow.find({
    status: "active",
    limit: 20,
    cursor: "next page",
  });
  await arky.workflow.getExecutions({
    workflow_id: "workflow-contract",
    status: "running",
    limit: 10,
    cursor: "execution page",
  });
  await arky.workflow.getExecution({
    workflow_id: "workflow-contract",
    execution_id: "execution-contract",
  });
} finally {
  globalThis.fetch = originalFetch;
}
assert.deepEqual(workflowCoreCalls, [
  {
    url: "http://127.0.0.1:1/v1/stores/contract-store/workflows",
    method: "POST",
    body: {
      key: "customer_welcome",
      status: "active",
      schedule: null,
      graph: {
        nodes: {
          start: { type: "transform", code: "input", delay_ms: null },
        },
        edges: [],
      },
      store_id: "contract-store",
    },
  },
  {
    url: "http://127.0.0.1:1/v1/stores/override-store/workflows/workflow-contract",
    method: "PUT",
    body: {
      key: "customer_welcome_v2",
      status: "draft",
      schedule: null,
      graph: {
        nodes: {
          start: { type: "transform", code: "input", delay_ms: null },
        },
        edges: [],
      },
    },
  },
  {
    url: "http://127.0.0.1:1/v1/stores/contract-store/workflows/workflow-contract",
    method: "DELETE",
    body: null,
  },
  {
    url: "http://127.0.0.1:1/v1/stores/contract-store/workflows/workflow-contract",
    method: "GET",
    body: null,
  },
  {
    url: "http://127.0.0.1:1/v1/stores/contract-store/workflows/workflow-contract/regenerate-webhook-url",
    method: "POST",
    body: {},
  },
  {
    url: "http://127.0.0.1:1/v1/stores/contract-store/workflows?status=active&limit=20&cursor=next%20page",
    method: "GET",
    body: null,
  },
  {
    url: "http://127.0.0.1:1/v1/stores/contract-store/workflows/workflow-contract/executions?status=running&limit=10&cursor=execution%20page",
    method: "GET",
    body: null,
  },
  {
    url: "http://127.0.0.1:1/v1/stores/contract-store/workflows/workflow-contract/executions/execution-contract",
    method: "GET",
    body: null,
  },
]);

for (const method of [
  "create",
  "replaceDraft",
  "deleteDraft",
  "start",
  "pause",
  "resume",
  "complete",
  "get",
  "find",
  "results",
]) {
  assert.equal(
    typeof arky.experiments[method],
    "function",
    `Admin Experiments must expose ${method}`,
  );
}

const experimentCalls = [];
globalThis.fetch = async (url, init = {}) => {
  experimentCalls.push({
    url: String(url),
    method: init.method,
    body: init.body ? JSON.parse(String(init.body)) : null,
  });
  if (init.method === "DELETE") {
    return new Response(null, { status: 204 });
  }
  const body = String(url).includes("?status=")
    ? { items: [], cursor: null }
    : {};
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
try {
  const definition = {
    key: "homepage_hero",
    goal_action_key: "lead_submitted",
    attribution_window_days: 30,
    variants: [
      { key: "control", allocation_bps: 5000 },
      { key: "guided", allocation_bps: 5000 },
    ],
  };
  await arky.experiments.create(definition);
  await arky.experiments.replaceDraft({
    store_id: "override-store",
    experiment_id: "experiment-contract",
    ...definition,
    key: "homepage_hero_v2",
  });
  for (const method of [
    "deleteDraft",
    "start",
    "pause",
    "resume",
    "complete",
    "get",
    "results",
  ]) {
    await arky.experiments[method]({ experiment_id: "experiment-contract" });
  }
  await arky.experiments.find({
    status: "running",
    limit: 25,
    cursor: "next page",
  });
} finally {
  globalThis.fetch = originalFetch;
}
assert.deepEqual(experimentCalls, [
  {
    url: "http://127.0.0.1:1/v1/stores/contract-store/experiments",
    method: "POST",
    body: {
      key: "homepage_hero",
      goal_action_key: "lead_submitted",
      attribution_window_days: 30,
      variants: [
        { key: "control", allocation_bps: 5000 },
        { key: "guided", allocation_bps: 5000 },
      ],
    },
  },
  {
    url: "http://127.0.0.1:1/v1/stores/override-store/experiments/experiment-contract",
    method: "PUT",
    body: {
      key: "homepage_hero_v2",
      goal_action_key: "lead_submitted",
      attribution_window_days: 30,
      variants: [
        { key: "control", allocation_bps: 5000 },
        { key: "guided", allocation_bps: 5000 },
      ],
    },
  },
  ...[
    ["DELETE", ""],
    ["POST", "/start"],
    ["POST", "/pause"],
    ["POST", "/resume"],
    ["POST", "/complete"],
    ["GET", ""],
    ["GET", "/results"],
  ].map(([method, suffix]) => ({
    url: `http://127.0.0.1:1/v1/stores/contract-store/experiments/experiment-contract${suffix}`,
    method,
    body: null,
  })),
  {
    url: "http://127.0.0.1:1/v1/stores/contract-store/experiments?status=running&limit=25&cursor=next%20page",
    method: "GET",
    body: null,
  },
]);

console.log("Admin SDK contract test passed.");
