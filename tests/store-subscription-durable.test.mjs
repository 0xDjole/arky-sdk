import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { createAdmin } from "../dist/admin.js";
import {
  ExclusiveLockManager,
  MemoryStorage,
} from "./helpers/durable-request-fixtures.mjs";

const baseUrl = "https://api.example.test";
const storeId = "store-durable-subscription";
const storageKey = `arky:store-subscription-checkout:${storeId}`;
const request = {
  store_id: storeId,
  plan_id: "plan_basic_monthly_v1",
  return_url: "https://merchant.test/settings/billing",
};
const originalDescriptors = new Map(
  ["fetch", "localStorage", "navigator", "window"].map((name) => [
    name,
    Object.getOwnPropertyDescriptor(globalThis, name),
  ]),
);

function installGlobal(name, value) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  });
}

function installBrowserState() {
  const storage = new MemoryStorage();
  const locks = new ExclusiveLockManager();
  installGlobal("localStorage", storage);
  installGlobal("navigator", { locks });
  installGlobal("window", globalThis);
  return { storage };
}

function restoreGlobals() {
  for (const [name, descriptor] of originalDescriptors) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
}

function admin() {
  return createAdmin({
    baseUrl,
    storeId,
    apiToken: "contract-token",
  });
}

function openSubscription(checkoutId) {
  return {
    id: "d397ff50-690b-4da7-9fb9-17740e535d69",
    store_id: storeId,
    plan_access: null,
    status: "pending",
    checkout: {
      id: checkoutId,
      plan_id: request.plan_id,
      stripe_price_id: "price_basic_monthly",
      stripe_customer_id: null,
      billing_email: "owner@example.test",
      return_url: request.return_url,
      trial_end: null,
      expires_at: 1_800_000_000_000,
      status: {
        type: "open",
        stripe_checkout_session_id: "cs_store_durable_subscription",
      },
      requested_at: 1,
      updated_at: 2,
    },
    payment_action: {
      type: "stripe_embedded_checkout",
      publishable_key: "pk_test_subscription",
      client_secret: "cs_store_durable_subscription_secret_exact",
      stripe_account_id: null,
      expires_at: 1_800_000_000_000,
    },
    trial_started_at: null,
    created_at: 1,
    updated_at: 2,
  };
}

afterEach(() => {
  restoreGlobals();
});

test("Store subscription Checkout survives a lost response and SDK reload without persisting its secret", async () => {
  const { storage } = installBrowserState();
  const calls = [];
  installGlobal("fetch", async (_url, init = {}) => {
    calls.push(JSON.parse(init.body));
    throw new TypeError("response connection was lost");
  });

  await assert.rejects(admin().store.subscription.select(request));
  assert.equal(calls.length, 1);
  const firstCheckoutId = calls[0].checkout_id;
  assert.match(
    firstCheckoutId,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  const retainedBeforeReload = storage.getItem(storageKey);
  assert.notEqual(retainedBeforeReload, null);
  assert.equal(
    JSON.parse(JSON.parse(retainedBeforeReload).requestJson).checkout_id,
    firstCheckoutId,
  );

  installGlobal("fetch", async (_url, init = {}) => {
    const payload = JSON.parse(init.body);
    calls.push(payload);
    return new Response(JSON.stringify(openSubscription(payload.checkout_id)), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
  const reloaded = admin();
  const subscription = await reloaded.store.subscription.select(request);

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1], calls[0]);
  assert.equal(subscription.checkout.id, firstCheckoutId);
  assert.equal(
    subscription.payment_action.client_secret,
    "cs_store_durable_subscription_secret_exact",
  );
  assert.equal(storage.getItem(storageKey), null);
});

test("a definite Checkout failure clears the exact request and the next action gets a new ID", async () => {
  const { storage } = installBrowserState();
  const calls = [];
  installGlobal("fetch", async (_url, init = {}) => {
    calls.push(JSON.parse(init.body));
    return new Response(
      JSON.stringify({
        message:
          "Store subscription Checkout failed definitively; retry with a new checkout_id",
        error: "BAD_REQUEST",
        statusCode: 400,
        validationErrors: [],
      }),
      {
        status: 400,
        headers: { "content-type": "application/json" },
      },
    );
  });

  await assert.rejects(
    admin().store.subscription.select(request),
    /failed definitively/,
  );
  assert.equal(storage.getItem(storageKey), null);
  await assert.rejects(
    admin().store.subscription.select(request),
    /failed definitively/,
  );
  assert.equal(calls.length, 2);
  assert.notEqual(calls[1].checkout_id, calls[0].checkout_id);
  assert.equal(storage.getItem(storageKey), null);
});

test("concurrent tabs issue at most one Store subscription Checkout POST", async () => {
  installBrowserState();
  let releaseProvider;
  let markProviderEntered;
  const providerEntered = new Promise((resolve) => {
    markProviderEntered = resolve;
  });
  const providerGate = new Promise((resolve) => {
    releaseProvider = resolve;
  });
  const calls = [];
  installGlobal("fetch", async (_url, init = {}) => {
    const payload = JSON.parse(init.body);
    calls.push(payload);
    markProviderEntered();
    await providerGate;
    return new Response(JSON.stringify(openSubscription(payload.checkout_id)), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  const first = admin().store.subscription.select(request);
  await providerEntered;
  await assert.rejects(
    admin().store.subscription.select(request),
    /already active in another tab/,
  );
  releaseProvider();
  await first;

  assert.equal(calls.length, 1);
});
