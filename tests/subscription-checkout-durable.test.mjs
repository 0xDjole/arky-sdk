import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { createStorefront } from "../dist/storefront.js";
import {
  ExclusiveLockManager,
  MemoryStorage,
} from "./helpers/durable-request-fixtures.mjs";

const apiUrl = "https://api.example.test";
const publishableKey = `arky_pk_${"c".repeat(43)}`;
const audienceId = "ed5e9d77-17b0-4102-8ca5-b0e44b6a4b3c";
const membershipId = "6ef796c1-e503-4679-b0d7-79966c193ca2";
const storageKey = `arky:commerce-subscription-checkout:v1:${encodeURIComponent(`${apiUrl}:${publishableKey}`)}:${membershipId}`;
const request = {
  request_id: "5718472c-5ab5-4a5f-99fd-afda6be3ac82",
  selection: {
    audience_id: audienceId,
    membership_id: membershipId,
    market_id: "ac61b4dc-aa97-4eb2-a27d-366b58232854",
    sales_channel_id: "d8654f1f-bae5-4ffb-bf5f-de375017f4ed",
    payment_provider_id: "4a2c7c0d-4389-4aae-b3d7-02ff834a024d",
    currency: "eur",
    billing: { type: "recurring", interval: "month", interval_count: 1 },
  },
  presentation_digest: "a".repeat(64),
  return_url: "https://merchant.example.test/audience-return",
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
  installGlobal("localStorage", storage);
  installGlobal("navigator", { locks: new ExclusiveLockManager() });
  installGlobal("window", globalThis);
  return { storage };
}

function sessionStorage() {
  const value = JSON.stringify({
    version: 2,
    customer: {
      id: "customer-audience-durable",
      status: "active",
      identities: [],
      classifications: [],
      created_at: 1,
      updated_at: 1,
    },
    session: {
      id: "visitor-session-audience-durable",
      customer_id: "customer-audience-durable",
      type: "visitor",
      token: `customer_visitor_${"d".repeat(64)}`,
      status: "active",
      expires_at: 1_900_000_000_000,
    },
  });
  return {
    getItem: () => value,
    setItem() {},
    removeItem() {},
  };
}

function storefront() {
  return createStorefront(publishableKey, { apiUrl, sessionStorage: sessionStorage() });
}

function checkoutResult() {
  return {
    request_id: request.request_id,
    subscription_id: "cf5e3226-0358-4d77-ba7f-458e1ca87e9d",
    checkout_id: "2a5d2950-6ea7-4d9f-82be-25e947ea7fca",
    publishable_key: "pk_test_audience",
    client_secret: "cs_audience_secret_exact",
    connected_account_id: "acct_audience_exact",
    expires_at: 1_900_000_000_000,
  };
}

function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function restoreGlobals() {
  for (const [name, descriptor] of originalDescriptors) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
}

afterEach(() => {
  restoreGlobals();
});

test("Subscription Checkout preserves one exact request after a lost response and reload", async () => {
  const { storage } = installBrowserState();
  const calls = [];
  installGlobal("fetch", async (_url, init = {}) => {
    calls.push(JSON.parse(init.body));
    throw new TypeError("response connection was lost");
  });

  await assert.rejects(storefront().eshop.cart.subscription.checkout(request));
  assert.equal(calls.length, 1);
  assert.match(
    calls[0].request_id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  const retained = storage.getItem(storageKey);
  assert.notEqual(retained, null);
  assert.equal(retained.includes("client_secret"), false);

  installGlobal("fetch", async (_url, init = {}) => {
    calls.push(JSON.parse(init.body));
    return response(checkoutResult());
  });
  const result = await storefront().eshop.cart.subscription.checkout(request);

  assert.deepEqual(calls[1], calls[0]);
  assert.deepEqual(result, checkoutResult());
  assert.equal(storage.getItem(storageKey), null);
});

test("Subscription Checkout rejects changed accepted context while an ambiguous request is retained", async () => {
  const { storage } = installBrowserState();
  let calls = 0;
  installGlobal("fetch", async () => {
    calls += 1;
    throw new TypeError("response connection was lost");
  });

  await assert.rejects(storefront().eshop.cart.subscription.checkout(request));
  await assert.rejects(
    storefront().eshop.cart.subscription.checkout({ ...request, selection: { ...request.selection, billing: { type: "recurring", interval: "year", interval_count: 1 } } }),
    /different unresolved payload/,
  );

  assert.equal(calls, 1);
  assert.notEqual(storage.getItem(storageKey), null);
});

test("a definite Subscription Checkout failure permits an explicit new request ID", async () => {
  const { storage } = installBrowserState();
  const calls = [];
  installGlobal("fetch", async (_url, init = {}) => {
    calls.push(JSON.parse(init.body));
    return response(
      {
        message:
          "Subscription Checkout failed definitively; retry with a new request_id",
        error: "BAD_REQUEST",
        statusCode: 400,
        validationErrors: [],
      },
      400,
    );
  });

  await assert.rejects(storefront().eshop.cart.subscription.checkout(request), /failed definitively/);
  assert.equal(storage.getItem(storageKey), null);
  await assert.rejects(storefront().eshop.cart.subscription.checkout({ ...request, request_id: "cc2d4e40-fdd5-4a38-88d9-a8a0042f093c" }), /failed definitively/);

  assert.equal(calls.length, 2);
  assert.notEqual(calls[0].request_id, calls[1].request_id);
  assert.equal(storage.getItem(storageKey), null);
});

test("concurrent tabs issue at most one Subscription Checkout POST", async () => {
  installBrowserState();
  let releaseProvider;
  let markProviderEntered;
  const providerEntered = new Promise((resolve) => {
    markProviderEntered = resolve;
  });
  const providerGate = new Promise((resolve) => {
    releaseProvider = resolve;
  });
  let calls = 0;
  installGlobal("fetch", async () => {
    calls += 1;
    markProviderEntered();
    await providerGate;
    return response(checkoutResult());
  });

  const first = storefront().eshop.cart.subscription.checkout(request);
  await providerEntered;
  await assert.rejects(
    storefront().eshop.cart.subscription.checkout(request),
    /already active in another tab/,
  );
  releaseProvider();
  await first;

  assert.equal(calls, 1);
});

test("Subscription Checkout cannot POST without writable storage and a cross-tab lock", async () => {
  let calls = 0;
  installGlobal("fetch", async () => { calls += 1; return response(checkoutResult()); });
  installBrowserState();
  installGlobal("navigator", {});
  await assert.rejects(storefront().eshop.cart.subscription.checkout(request), /lock is unavailable/);
  installGlobal("navigator", { locks: new ExclusiveLockManager() });
  installGlobal("localStorage", { getItem: () => null, setItem() { throw new Error("full"); } });
  await assert.rejects(storefront().eshop.cart.subscription.checkout(request), /cannot be saved/);
  assert.equal(calls, 0);
});

test("Subscription Checkout retains ambiguous request evidence and rejects mismatched success", async () => {
  const { storage } = installBrowserState();
  installGlobal("fetch", async () => response({ ...checkoutResult(), request_id: "cc2d4e40-fdd5-4a38-88d9-a8a0042f093c" }));
  await assert.rejects(storefront().eshop.cart.subscription.checkout(request), /mismatched or invalid/);
  assert.notEqual(storage.getItem(storageKey), null);
  assert.equal(storage.getItem(storageKey).includes("client_secret"), false);
});

test("Subscription Checkout rejects forged money and tenant selectors before network contact", async () => {
  installBrowserState();
  let calls = 0;
  installGlobal("fetch", async () => { calls += 1; return response(checkoutResult()); });
  for (const field of ["store_id", "price_id", "amount", "payer_email", "customer_id", "origin"]) {
    await assert.rejects(storefront().eshop.cart.subscription.checkout({ ...request, selection: { ...request.selection, [field]: "forged" } }));
  }
  await assert.rejects(storefront().eshop.cart.subscription.checkout({ ...request, selection: { ...request.selection, market_id: undefined } }));
  assert.equal(calls, 0);
});
