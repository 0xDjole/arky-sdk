#!/usr/bin/env node
import assert from "node:assert/strict";
import { createAdmin } from "../dist/admin.js";
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
assert.equal(typeof arky.account.update, "function");
assert.equal(typeof arky.account.delete, "function");
assert.equal(typeof arky.account.getMe, "function");
assert.equal(typeof arky.account.search, "function");

assert.equal(typeof arky.store.create, "function");
assert.equal(typeof arky.store.update, "function");
assert.equal(typeof arky.store.get, "function");
assert.equal(typeof arky.store.find, "function");
assert.equal(typeof arky.store.subscription.getPlans, "function");
assert.equal(typeof arky.store.subscription.select, "function");
assert.equal(typeof arky.store.subscription.createPortalSession, "function");
assert.equal(typeof arky.customer.audience.manage, "function");
assert.equal(
  typeof arky.customer.audience.createPaymentMethodSession,
  "function",
);
assert.equal(typeof arky.customer.audience.cancelSubscription, "function");
assert.equal(typeof arky.customer.audience.unsubscribe, "function");
assert.equal(typeof arky.store.member.add, "function");
assert.equal(typeof arky.store.member.invite, "function");
assert.equal(typeof arky.store.member.remove, "function");
assert.equal(typeof arky.store.buildHook.list, "function");
assert.equal(typeof arky.store.webhook.list, "function");
assert.equal(typeof arky.store.paymentProvider.list, "function");
assert.equal(typeof arky.store.paymentProvider.stripe.connect, "function");
assert.equal(typeof arky.store.paymentProvider.stripe.refresh, "function");
assert.equal(
  typeof arky.store.paymentProvider.stripe.openDashboard,
  "function",
);
assert.equal(typeof arky.store.paymentProvider.delete, "function");
assert.equal(typeof arky.media.replaceMediaContent, "function");

const customerAudienceCalls = [];
const customerAudienceOriginalFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  const call = {
    url: String(url),
    method: init.method || "GET",
    body: init.body ? JSON.parse(String(init.body)) : null,
  };
  customerAudienceCalls.push(call);
  const body = call.url.endsWith("/stores/plans")
    ? { items: [], cursor: null }
    : call.url.endsWith("/manage")
      ? { has_access: true }
    : call.url.endsWith("/payment-method")
        ? { portal_url: "https://billing.test/session" }
        : { success: true };
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
  assert.deepEqual(
    await arky.customer.audience.manage({ token: "manage-token" }),
    { has_access: true },
  );
  assert.deepEqual(
    await arky.customer.audience.createPaymentMethodSession({
      token: "portal-token",
      return_url: "https://customer.test/account",
    }),
    { portal_url: "https://billing.test/session" },
  );
  assert.deepEqual(
    await arky.customer.audience.cancelSubscription({
      token: "cancel-token",
    }),
    { success: true },
  );
  assert.deepEqual(
    await arky.customer.audience.unsubscribe({
      token: "unsubscribe-token",
    }),
    { success: true },
  );
} finally {
  globalThis.fetch = customerAudienceOriginalFetch;
}
assert.deepEqual(
  customerAudienceCalls.map(({ url, ...call }) => ({
    ...call,
    url: url.replace("http://127.0.0.1:1", ""),
  })),
  [
    { url: "/v1/stores/plans", method: "GET", body: null },
    {
      url: "/v1/customer/audiences/manage",
      method: "POST",
      body: { token: "manage-token" },
    },
    {
      url: "/v1/customer/audiences/payment-method",
      method: "POST",
      body: {
        token: "portal-token",
        return_url: "https://customer.test/account",
      },
    },
    {
      url: "/v1/customer/audiences/subscription/cancel",
      method: "POST",
      body: { token: "cancel-token" },
    },
    {
      url: "/v1/customer/audiences/unsubscribe",
      method: "POST",
      body: { token: "unsubscribe-token" },
    },
  ],
);

const scheduledAdminCalls = [];
const requestedProvider = {
  id: "provider-scheduled",
  store_id: "contract-store",
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
const succeededProvider = {
  ...requestedProvider,
  connection: {
    ...requestedProvider.connection,
    status: "succeeded",
    attempts: 1,
    completed_at: 2,
  },
  updated_at: 2,
};
const selectedSubscription = {
  id: "subscription-contract",
  store_id: "contract-store",
  plan_id: "free",
  payment: { currency: "EUR", market: "ba" },
  billing_status: "pending",
  checkout: {
    plan_id: "basic",
    status: "requires_action",
    expires_at: 10,
  },
  payment_action: {
    type: "stripe_embedded_checkout",
    publishable_key: "pk_test_subscription",
    client_secret: "cs_subscription_secret_contract",
    stripe_account_id: null,
    expires_at: 10,
  },
  access_started_at: 1,
  access_until: 2,
  created_at: 1,
  updated_at: 2,
};
const scheduledOriginalFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  const target = String(url);
  const method = init.method || "GET";
  scheduledAdminCalls.push([target, method]);
  let body;
  if (target.endsWith("/payment-providers/stripe/connect")) {
    body = {
      provider: succeededProvider,
      onboarding_url: "https://connect.test/onboarding",
    };
  } else if (
    target.endsWith("/payment-providers/stripe/provider-scheduled/connection")
  ) {
    body = {
      provider: succeededProvider,
      onboarding_url: "https://connect.test/onboarding",
    };
  } else if (target.endsWith("/subscription") && method === "POST") {
    body = selectedSubscription;
  } else if (target.endsWith("/payment-providers/provider-scheduled")) {
    body = { deleted: true };
  } else {
    throw new Error(`Unexpected scheduled admin request: ${method} ${target}`);
  }
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
try {
  const connected = await arky.store.paymentProvider.stripe.connect({
    store_id: "contract-store",
    return_url: "https://admin.test/return",
    refresh_url: "https://admin.test/refresh",
    country: "BA",
  });
  assert.equal(connected.onboarding_url, "https://connect.test/onboarding");

  const subscription = await arky.store.subscription.select({
    store_id: "contract-store",
    plan_id: "basic",
    return_url: "https://admin.test/return",
  });
  assert.equal(subscription.checkout.status, "requires_action");
  assert.equal(subscription.payment_action.type, "stripe_embedded_checkout");
  assert.equal(
    subscription.payment_action.client_secret,
    "cs_subscription_secret_contract",
  );

  assert.deepEqual(
    await arky.store.paymentProvider.delete({
      store_id: "contract-store",
      id: "provider-scheduled",
    }),
    { deleted: true },
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
    ["/v1/stores/contract-store/payment-providers/stripe/connect", "POST"],
    ["/v1/stores/contract-store/subscription", "POST"],
    [
      "/v1/stores/contract-store/payment-providers/provider-scheduled",
      "DELETE",
    ],
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
  const replacement = await arky.media.replaceMediaContent({
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

assert.equal(typeof arky.social.connection.list, "function");
assert.equal(typeof arky.social.connection.connect, "function");
assert.equal(typeof arky.social.connection.getOAuthAttempt, "function");
assert.equal(typeof arky.social.connection.selectDestination, "function");
assert.equal(typeof arky.social.connection.delete, "function");
assert.equal(typeof arky.social.publication.getComments, "function");
assert.equal(typeof arky.social.publication.syncComments, "function");
assert.equal(typeof arky.social.publication.getCommentThread, "function");
assert.equal(typeof arky.social.publication.syncCommentThread, "function");
assert.equal(typeof arky.social.publication.classifyComments, "function");
assert.equal(
  typeof arky.social.publication.getCommentClassificationRun,
  "function",
);
assert.equal(typeof arky.social.publication.getMetrics, "function");
assert.equal(typeof arky.social.publication.syncMetrics, "function");

assert.equal(typeof arky.automation.workflow.listConnections, "function");
assert.equal(
  typeof arky.automation.workflow.getConnectionConnectUrl,
  "function",
);
assert.equal(typeof arky.automation.workflow.deleteConnection, "function");

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
  await arky.automation.workflow.getConnectionConnectUrl({
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

assert.equal(typeof arky.automation.support.createAgent, "function");
assert.equal(typeof arky.automation.support.findAgents, "function");
assert.equal(typeof arky.automation.support.findConversations, "function");
assert.equal(typeof arky.automation.support.replyToConversation, "function");

assert.equal(typeof arky.notification.mailbox.find, "function");
assert.equal(typeof arky.notification.mailbox.connectGoogle, "function");
assert.equal(typeof arky.notification.email.send, "function");
assert.equal(typeof arky.notification.email.getDelivery, "function");
assert.equal(typeof arky.notification.email.retryDelivery, "function");

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
assert.equal(typeof arky.outreach.campaign.find, "function");
assert.equal(typeof arky.outreach.campaignEnrollment.find, "function");
assert.equal(typeof arky.outreach.campaignMessage.find, "function");
assert.equal(typeof arky.outreach.suppression.find, "function");
assert.equal(typeof arky.outreach.leadResearch.createRun, "function");

assert.equal(typeof arky.crm.audience.members.add, "function");
assert.equal(typeof arky.crm.audience.members.find, "function");

assert.equal(typeof arky.eshop.order.createRefund, "function");
assert.equal(typeof arky.eshop.order.getRefunds, "function");
assert.equal(typeof arky.eshop.order.getPayment, "function");
assert.equal(typeof arky.eshop.order.getPaymentAttempts, "function");
assert.equal(typeof arky.eshop.order.getPaymentAttempt, "function");
assert.equal(typeof arky.eshop.order.getDisputes, "function");
assert.equal(typeof arky.eshop.order.getDispute, "function");
assert.equal(typeof arky.eshop.shipment.getRates, "function");
assert.equal(typeof arky.eshop.shipment.create, "function");
assert.equal(typeof arky.eshop.shipment.fulfillment.find, "function");
assert.equal(typeof arky.eshop.shipment.fulfillment.get, "function");
assert.equal(typeof arky.eshop.shipment.refund.retry, "function");
assert.equal(typeof arky.eshop.shipment.settlement.get, "function");
assert.equal(typeof arky.eshop.shipment.settlement.retry, "function");

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
  await arky.eshop.shipment.fulfillment.find({
    order_id: "order-1",
    limit: 20,
  });
  await arky.eshop.shipment.fulfillment.get({
    order_id: "order-1",
    fulfillment_order_id: "fulfillment-1",
  });
} finally {
  globalThis.fetch = originalFetch;
}
assert.deepEqual(
  fulfillmentCalls.map(({ url, method }) => [url, method]),
  [
    [
      "http://127.0.0.1:1/v1/stores/contract-store/orders/order-1/fulfillment-orders?limit=20",
      "GET",
    ],
    [
      "http://127.0.0.1:1/v1/stores/contract-store/orders/order-1/fulfillment-orders/fulfillment-1",
      "GET",
    ],
  ],
);

const paymentCalls = [];
globalThis.fetch = async (url, init = {}) => {
  paymentCalls.push({ url: String(url), method: init.method });
  const body = String(url).includes("/attempts?")
    ? { items: [], cursor: null }
    : {};
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
try {
  await arky.eshop.order.getPayment({ order_id: "order-1" });
  await arky.eshop.order.getPaymentAttempts({
    order_id: "order-1",
    limit: 20,
  });
  await arky.eshop.order.getPaymentAttempt({
    order_id: "order-1",
    attempt_id: "attempt-1",
  });
} finally {
  globalThis.fetch = originalFetch;
}
assert.deepEqual(
  paymentCalls.map(({ url, method }) => [url, method]),
  [
    [
      "http://127.0.0.1:1/v1/stores/contract-store/orders/order-1/payment",
      "GET",
    ],
    [
      "http://127.0.0.1:1/v1/stores/contract-store/orders/order-1/payment/attempts?limit=20",
      "GET",
    ],
    [
      "http://127.0.0.1:1/v1/stores/contract-store/orders/order-1/payment/attempts/attempt-1",
      "GET",
    ],
  ],
);

console.log("Admin SDK contract test passed.");
