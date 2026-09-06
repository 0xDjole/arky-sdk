import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { createStorefront } from "../dist/storefront.js";
import {
  ExclusiveLockManager,
  MemoryStorage,
} from "./helpers/durable-request-fixtures.mjs";

const apiUrl = "https://api.example.test";
const publishableKey = `arky_pk_${"c".repeat(43)}`;
const audienceId = "audience-durable-checkout";
const storageKey = `arky:audience-checkout:v1:${encodeURIComponent(apiUrl)}:${encodeURIComponent(publishableKey)}:${encodeURIComponent(audienceId)}`;
const request = {
  audience_id: audienceId,
  email: "member@example.test",
  cadence: "monthly",
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
      expires_at: 2_000_000_000,
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

test("Audience Checkout reuses one SDK-owned request ID after a lost response and reload", async () => {
  const { storage } = installBrowserState();
  const calls = [];
  installGlobal("fetch", async (_url, init = {}) => {
    calls.push(JSON.parse(init.body));
    throw new TypeError("response connection was lost");
  });

  await assert.rejects(storefront().audiences.checkout(request));
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
  const result = await storefront().audiences.checkout(request);

  assert.deepEqual(calls[1], calls[0]);
  assert.deepEqual(result, checkoutResult());
  assert.equal(storage.getItem(storageKey), null);
});

test("Audience Checkout rejects changed immutable input while an ambiguous request is retained", async () => {
  const { storage } = installBrowserState();
  let calls = 0;
  installGlobal("fetch", async () => {
    calls += 1;
    throw new TypeError("response connection was lost");
  });

  await assert.rejects(storefront().audiences.checkout(request));
  await assert.rejects(
    storefront().audiences.checkout({ ...request, cadence: "yearly" }),
    /different immutable input/,
  );

  assert.equal(calls, 1);
  assert.notEqual(storage.getItem(storageKey), null);
});

test("a definite Audience Checkout failure clears the request and permits a new ID", async () => {
  const { storage } = installBrowserState();
  const calls = [];
  installGlobal("fetch", async (_url, init = {}) => {
    calls.push(JSON.parse(init.body));
    return response(
      {
        message:
          "Audience Checkout failed definitively; retry with a new request_id",
        error: "BAD_REQUEST",
        statusCode: 400,
        validationErrors: [],
      },
      400,
    );
  });

  await assert.rejects(storefront().audiences.checkout(request), /failed definitively/);
  assert.equal(storage.getItem(storageKey), null);
  await assert.rejects(storefront().audiences.checkout(request), /failed definitively/);

  assert.equal(calls.length, 2);
  assert.notEqual(calls[0].request_id, calls[1].request_id);
  assert.equal(storage.getItem(storageKey), null);
});

test("concurrent tabs issue at most one Audience Checkout POST", async () => {
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

  const first = storefront().audiences.checkout(request);
  await providerEntered;
  await assert.rejects(
    storefront().audiences.checkout(request),
    /already active in another tab/,
  );
  releaseProvider();
  await first;

  assert.equal(calls, 1);
});
