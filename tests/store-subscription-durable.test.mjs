import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { createAdmin } from "../dist/admin.js";
import {
  ExclusiveLockManager,
  MemoryStorage,
} from "./helpers/durable-request-fixtures.mjs";

const baseUrl = "https://api.example.test";
const storeId = "7b2d9e40-1c63-4f85-a9e7-3d0c5b8f2a16";
const storageKey = `arky:store-subscription-checkout:${storeId}`;
const checkoutIds = [
  "018f477d-1cae-4c12-bf12-123456789abc",
  "2c7e9a51-4b08-4d36-8f1e-6a3d0c9b5e72",
  "9e4b1d73-0f26-4a58-b3c9-7d2e5f8a1c04",
];
const request = {
  store_id: storeId,
  checkout_id: checkoutIds[0],
  plan_id: "plan_basic_monthly_v1",
  return_url: "https://merchant.test/settings/billing",
};
const { store_id: _requestStore, ...requestBody } = request;
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
    apiToken: "contract-token",
  });
}

function openSubscription(checkoutId) {
  return {
    id: "d397ff50-690b-4da7-9fb9-17740e535d69",
    store_id: storeId,
    plan_access: null,
    status: { type: "pending" },
    operation: null,
    checkout: {
      id: checkoutId,
      plan_id: request.plan_id,
      stripe_price_id: "price_basic_monthly",
      stripe_customer_id: null,
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

function definiteFailure() {
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
}

test("Store subscription Checkout survives a lost response and SDK reload without persisting its secret", async () => {
  const { storage } = installBrowserState();
  const calls = [];
  installGlobal("fetch", async (url, init = {}) => {
    calls.push({ path: new URL(url).pathname, body: JSON.parse(init.body) });
    throw new TypeError("response connection was lost");
  });

  const target = { store_id: storeId };
  assert.equal(await admin().store.subscription.pendingSelection(target), null);
  await admin().store.subscription.retainSelection(request);
  const retainedBeforeReload = storage.getItem(storageKey);
  assert.notEqual(retainedBeforeReload, null);
  assert.deepEqual(JSON.parse(JSON.parse(retainedBeforeReload).requestJson), requestBody);
  await assert.rejects(admin().store.subscription.recoverSelection(target), /connection was lost/);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], { path: `/v1/stores/${storeId}/subscription`, body: requestBody });
  assert.equal(storage.getItem(storageKey), retainedBeforeReload);

  installGlobal("fetch", async (url, init = {}) => {
    const payload = JSON.parse(init.body);
    calls.push({ path: new URL(url).pathname, body: payload });
    return new Response(JSON.stringify(openSubscription(payload.checkout_id)), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
  const reloaded = admin();
  assert.deepEqual(await reloaded.store.subscription.pendingSelection(target), requestBody);
  const subscription = await reloaded.store.subscription.recoverSelection(target);

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1], calls[0]);
  assert.equal(subscription.checkout.id, checkoutIds[0]);
  assert.equal(
    subscription.payment_action.client_secret,
    "cs_store_durable_subscription_secret_exact",
  );
  assert.equal(storage.getItem(storageKey), null);
  assert.equal(await reloaded.store.subscription.recoverSelection(target), null);
  assert.equal(await reloaded.store.subscription.pendingSelection(target), null);
  assert.equal(calls.length, 2);
});

test("a definite Checkout failure clears the exact request and the next action retains a new caller ID", async () => {
  const { storage } = installBrowserState();
  const calls = [];
  let reply = definiteFailure;
  installGlobal("fetch", async (_url, init = {}) => {
    calls.push(JSON.parse(init.body));
    return reply();
  });
  const target = { store_id: storeId };

  await admin().store.subscription.retainSelection(request);
  await assert.rejects(
    admin().store.subscription.recoverSelection(target),
    /failed definitively/,
  );
  assert.equal(storage.getItem(storageKey), null);
  await admin().store.subscription.retainSelection({ ...request, checkout_id: checkoutIds[1] });
  await assert.rejects(
    admin().store.subscription.recoverSelection(target),
    /failed definitively/,
  );
  assert.equal(calls.length, 2);
  assert.equal(calls[0].checkout_id, checkoutIds[0]);
  assert.equal(calls[1].checkout_id, checkoutIds[1]);
  assert.equal(storage.getItem(storageKey), null);

  reply = () => new Response(JSON.stringify({ message: "Checkout is still processing", statusCode: 409 }), {
    status: 409,
    headers: { "content-type": "application/json" },
  });
  await admin().store.subscription.retainSelection({ ...request, checkout_id: checkoutIds[2] });
  await assert.rejects(admin().store.subscription.recoverSelection(target), (error) => error.statusCode === 409);
  assert.deepEqual(await admin().store.subscription.pendingSelection(target), { ...requestBody, checkout_id: checkoutIds[2] });
  await assert.rejects(
    admin().store.subscription.retainSelection({ ...request, checkout_id: checkoutIds[0] }),
    /different unresolved payload/,
  );
  assert.equal(calls.length, 3);
});

test("plan selection requires the caller's canonical checkout identity before any request", async () => {
  const { storage } = installBrowserState();
  let calls = 0;
  installGlobal("fetch", async () => {
    calls += 1;
    return new Response(JSON.stringify(openSubscription(checkoutIds[0])), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
  for (const checkout_id of [undefined, "", "checkout", checkoutIds[0].toUpperCase()]) {
    await assert.rejects(
      admin().store.subscription.select({ ...request, checkout_id }),
      /caller's canonical UUID-v4 checkout_id/,
    );
    await assert.rejects(
      admin().store.subscription.retainSelection({ ...request, checkout_id }),
      /caller's canonical UUID-v4 checkout_id/,
    );
  }
  await assert.rejects(admin().store.subscription.select({ ...request, store_id: "store-durable-subscription" }), TypeError);
  assert.equal(calls, 0);
  assert.equal(storage.getItem(storageKey), null);
  const selected = await admin().store.subscription.select(request);
  assert.equal(selected.checkout.id, checkoutIds[0]);
  assert.equal(calls, 1);
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

  const target = { store_id: storeId };
  await admin().store.subscription.retainSelection(request);
  const first = admin().store.subscription.recoverSelection(target);
  await providerEntered;
  await assert.rejects(
    admin().store.subscription.recoverSelection(target),
    /already active in another tab/,
  );
  await assert.rejects(
    admin().store.subscription.pendingSelection(target),
    /already active in another tab/,
  );
  releaseProvider();
  assert.equal((await first).checkout.id, checkoutIds[0]);

  assert.equal(calls.length, 1);
});
