#!/usr/bin/env node
import assert from "node:assert/strict";
import { createAdmin } from "../dist/admin.js";

const arky = createAdmin({
  baseUrl: "http://127.0.0.1:1",
  storeId: "smoke-store",
  apiToken: "smoke-token",
});

assert.equal(typeof arky.account.auth.code, "function");
assert.equal(typeof arky.account.auth.verify, "function");
assert.equal(typeof arky.account.auth.refresh, "function");
assert.equal(typeof arky.account.update, "function");
assert.equal(typeof arky.account.delete, "function");
assert.equal(typeof arky.account.getMe, "function");
assert.equal(typeof arky.account.search, "function");
assert.equal("updateAccount" in arky.account, false);
assert.equal("deleteAccount" in arky.account, false);
assert.equal("searchAccounts" in arky.account, false);
assert.equal("auth" in arky, false);

assert.equal(typeof arky.store.create, "function");
assert.equal(typeof arky.store.update, "function");
assert.equal(typeof arky.store.delete, "function");
assert.equal(typeof arky.store.get, "function");
assert.equal(typeof arky.store.find, "function");
assert.equal(typeof arky.store.subscription.getPlans, "function");
assert.equal(typeof arky.store.subscription.subscribe, "function");
assert.equal(typeof arky.store.subscription.createPortalSession, "function");
assert.equal(typeof arky.store.member.add, "function");
assert.equal(typeof arky.store.member.invite, "function");
assert.equal(typeof arky.store.member.remove, "function");
assert.equal(typeof arky.store.buildHook.list, "function");
assert.equal(typeof arky.store.webhook.list, "function");
assert.equal(typeof arky.store.config.get, "function");
assert.equal(typeof arky.store.media.find, "function");
assert.equal(typeof arky.store.paymentProvider.list, "function");
assert.equal(typeof arky.store.paymentProvider.refresh, "function");
assert.equal(typeof arky.store.paymentProvider.connectStripe, "function");
assert.equal(typeof arky.store.paymentProvider.delete, "function");
assert.equal("createStore" in arky.store, false);
assert.equal("getSubscriptionPlans" in arky.store, false);
assert.equal("listBuildHooks" in arky.store, false);
assert.equal("listWebhooks" in arky.store, false);
assert.equal("paymentProviders" in arky, false);
assert.equal("payments" in arky, false);

assert.equal(typeof arky.social.account.list, "function");
assert.equal(typeof arky.social.account.connect, "function");
assert.equal(typeof arky.social.account.getOAuthAttempt, "function");
assert.equal(typeof arky.social.account.selectDestination, "function");
assert.equal(typeof arky.social.account.delete, "function");
assert.equal(typeof arky.social.publication.getComments, "function");
assert.equal(typeof arky.social.publication.syncComments, "function");
assert.equal(typeof arky.social.publication.getCommentThread, "function");
assert.equal(typeof arky.social.publication.syncCommentThread, "function");
assert.equal(typeof arky.social.publication.getMetrics, "function");
assert.equal(typeof arky.social.publication.syncMetrics, "function");
assert.equal("syncPublicationComments" in arky.social, false);
assert.equal("getPublicationMetrics" in arky.social, false);

assert.equal(typeof arky.automation.workflow.listAccounts, "function");
assert.equal(typeof arky.automation.workflow.getAccountConnectUrl, "function");
assert.equal(typeof arky.automation.workflow.connectAccount, "function");
assert.equal(typeof arky.automation.workflow.deleteAccount, "function");
assert.equal("accounts" in arky.automation.workflow, false);
assert.equal("getGoogleDriveConnectUrl" in arky.automation.workflow, false);
assert.equal("connectGoogleDriveAccount" in arky.automation.workflow, false);
assert.equal("integrations" in arky.automation, false);

const workflowFetchCalls = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  workflowFetchCalls.push({
    url: String(url),
    method: init.method,
    body: init.body,
  });
  return new Response(JSON.stringify({ authorization_url: "https://oauth.test", state: "state" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

try {
  await arky.automation.workflow.getAccountConnectUrl({
    type: "google_drive",
    redirect_uri: "https://admin.test/workflow-accounts/callback",
  });
  await arky.automation.workflow.connectAccount({
    type: "google_drive",
    code: "oauth-code",
    redirect_uri: "https://admin.test/workflow-accounts/callback",
  });
} finally {
  globalThis.fetch = originalFetch;
}

assert.equal(workflowFetchCalls[0].method, "POST");
assert.equal(
  workflowFetchCalls[0].url,
  "http://127.0.0.1:1/v1/stores/smoke-store/workflow-accounts/connect-url",
);
assert.deepEqual(JSON.parse(workflowFetchCalls[0].body), {
  type: "google_drive",
  redirect_uri: "https://admin.test/workflow-accounts/callback",
  store_id: "smoke-store",
});
assert.equal(workflowFetchCalls[1].method, "POST");
assert.equal(
  workflowFetchCalls[1].url,
  "http://127.0.0.1:1/v1/stores/smoke-store/workflow-accounts/connect",
);
assert.deepEqual(JSON.parse(workflowFetchCalls[1].body), {
  type: "google_drive",
  code: "oauth-code",
  redirect_uri: "https://admin.test/workflow-accounts/callback",
  store_id: "smoke-store",
});

assert.equal(typeof arky.automation.support.createAgent, "function");
assert.equal(typeof arky.automation.support.findAgents, "function");
assert.equal(typeof arky.automation.support.findConversations, "function");
assert.equal(typeof arky.automation.support.replyToConversation, "function");
assert.equal("agent" in arky.automation.support, false);
assert.equal("conversation" in arky.automation.support, false);

assert.equal(typeof arky.notification.mailbox.find, "function");
assert.equal(typeof arky.notification.email.trackOpen, "function");
assert.equal(typeof arky.notification.trigger.send, "function");
assert.equal("mailbox" in arky.crm, false);

assert.equal(typeof arky.outreach.campaign.find, "function");
assert.equal(typeof arky.outreach.campaignEnrollment.find, "function");
assert.equal(typeof arky.outreach.campaignMessage.find, "function");
assert.equal(typeof arky.outreach.suppression.find, "function");
assert.equal(typeof arky.outreach.leadResearch.createRun, "function");
assert.equal("campaign" in arky.crm, false);
assert.equal("leadResearch" in arky.crm, false);
assert.equal("leadResearch" in arky, false);

assert.equal(typeof arky.crm.contactList.addMember, "function");
assert.equal(typeof arky.crm.contactList.findMembers, "function");
assert.equal("members" in arky.crm.contactList, false);
assert.equal("contacts" in arky.crm.contactList, false);

assert.equal(typeof arky.eshop.order.getShippingRates, "function");
assert.equal(typeof arky.eshop.order.ship, "function");
assert.equal("shipping" in arky, false);
assert.equal("promoCode" in arky, false);

console.log("Admin SDK smoke test passed.");
