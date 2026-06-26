#!/usr/bin/env node
import assert from "node:assert/strict";
import { createAdmin } from "../dist/admin.js";

const arky = createAdmin({
  baseUrl: "http://127.0.0.1:1",
  storeId: "smoke-store",
  apiToken: "smoke-token",
});

assert.equal(typeof arky.paymentProviders.listProviders, "function");
assert.equal(typeof arky.paymentProviders.connectStripe, "function");
assert.equal(typeof arky.payments.listConnections, "function");
assert.equal(typeof arky.payments.startOnboarding, "function");
assert.equal(arky.payments.listConnections, arky.paymentProviders.listProviders);
assert.equal(arky.payments.startOnboarding, arky.paymentProviders.connectStripe);

assert.equal(typeof arky.automation.workflow.accounts.getConnectUrl, "function");
assert.equal(typeof arky.automation.workflow.accounts.connect, "function");
assert.equal(typeof arky.automation.workflow.getGoogleDriveConnectUrl, "function");
assert.equal(typeof arky.automation.workflow.connectGoogleDriveAccount, "function");
assert.equal(typeof arky.automation.integrations.accounts.list, "function");
assert.equal(typeof arky.automation.integrations.accounts.getConnectUrl, "function");
assert.equal(typeof arky.automation.integrations.accounts.connect, "function");
assert.equal(typeof arky.automation.integrations.accounts.delete, "function");
assert.equal(
  arky.automation.integrations.accounts.getConnectUrl,
  arky.automation.workflow.accounts.getConnectUrl,
);

console.log("Admin SDK smoke test passed.");
