import assert from "node:assert/strict";
import test from "node:test";

import { createStorefront } from "../dist/storefront.js";

const apiUrl = "https://api.example.test";
const publishableKeyA = `arky_pk_${"a".repeat(42)}A`;
const publishableKeyB = `arky_pk_${"b".repeat(42)}A`;
const visitorTokenA = `customer_visitor_${"a".repeat(64)}`;
const visitorTokenB = `customer_visitor_${"b".repeat(64)}`;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function memoryStorage(initialToken = null) {
  const values = new Map();
  let fallback = initialToken;
  return {
    values,
    adapter: {
      getItem(key) {
        return values.get(key) ?? fallback;
      },
      setItem(key, value) {
        fallback = null;
        values.set(key, value);
      },
      removeItem(key) {
        if (key.includes("arky_customer_session")) fallback = null;
        values.delete(key);
      },
    },
  };
}

function identifyResponse(token = visitorTokenA, id = "customer-a") {
  return {
    customer: {
      id,
      status: "active",
      identities: [],
      classifications: [],
      created_at: 1,
      updated_at: 1,
    },
    session: {
      id: `session-${id}`,
      customer_id: id,
      type: "visitor",
      token,
      status: "active",
      expires_at: 10_000,
    },
  };
}

function storedVisitorSession(token = visitorTokenA, id = "customer-a") {
  const { customer, session } = identifyResponse(token, id);
  return JSON.stringify({ version: 2, customer, session });
}

function cart(id = "cart-a") {
  return {
    id,
    customer_id: "customer-a",
    customer_session_id: "session-customer-a",
    token: "cart-token",
    status: "active",
    origin: "storefront",
    created_by_account_id: null,
    market: "bih",
    product_items: [],
    booking_items: [],
    digital_items: [],
    shipping_address: null,
    billing_address: null,
    promo_code: null,
    payment_provider_id: null,
    shipping_method_id: null,
    converted_order_id: null,
    item_count: 0,
    last_action_at: 1,
    abandoned_at: null,
    created_at: 1,
    updated_at: 1,
  };
}

test("publishable-key initialization is synchronous, network-free, and rejects every other credential class", () => {
  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error("initialize must not fetch");
  };

  try {
    const client = createStorefront(publishableKeyA);
    assert.equal(fetchCalls, 0);
    assert.equal(client.getLocale(), "");
    assert.equal(client.getMarket(), "");
    assert.equal("getStoreId" in client, false);
    assert.equal("forStore" in client, false);
    assert.throws(() => createStorefront("arky_api_private"), /publishable key/i);
    assert.throws(() => createStorefront("customer_visitor_visitor"), /publishable key/i);
    assert.throws(() => createStorefront("arky_vst_visitor"), /publishable key/i);
    assert.throws(() => createStorefront("contact_visitor"), /publishable key/i);
    assert.throws(
      () => createStorefront(`arky_pk_${"a".repeat(43)}`),
      /publishable key/i,
    );
    assert.throws(() => createStorefront({}), /publishable key/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("requests use the production URL by default and force publishable/context headers on keyless routes", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), headers: new Headers(init.headers) });
    return jsonResponse({ items: [], cursor: null });
  };

  try {
    const root = createStorefront(publishableKeyA, { locale: "en" });
    root.setContext({ market: "bih" });
    const italian = root.withContext({ locale: "it", market: "ita" });

    await root.eshop.product.find(
      { limit: 1, store_id: "caller-store", market: "caller-market" },
      {
        headers: {
          Authorization: "Bearer arky_api_caller",
          "x-arky-publishable-key": publishableKeyB,
          "x-arky-locale": "caller-locale",
          "x-arky-market": "caller-market",
        },
      },
    );
    await italian.eshop.product.find({ limit: 1 });

    assert.equal(root.getLocale(), "en");
    assert.equal(root.getMarket(), "bih");
    assert.equal(italian.getLocale(), "it");
    assert.equal(italian.getMarket(), "ita");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls[0].url, "https://api.arky.io/v1/storefront/products?limit=1");
  assert.equal(calls[0].headers.get("x-arky-publishable-key"), publishableKeyA);
  assert.equal(calls[0].headers.get("x-arky-locale"), "en");
  assert.equal(calls[0].headers.get("x-arky-market"), "bih");
  assert.equal(calls[0].headers.get("authorization"), null);
  assert.equal(calls[1].headers.get("x-arky-locale"), "it");
  assert.equal(calls[1].headers.get("x-arky-market"), "ita");
});

test("setup is lazy and deduplicated without creating a visitor", async () => {
  let setupCalls = 0;
  let identifyCalls = 0;
  let release;
  const response = new Promise((resolve) => {
    release = resolve;
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).endsWith("/customer/identify")) identifyCalls += 1;
    if (String(url) === `${apiUrl}/v1/storefront`) {
      setupCalls += 1;
      return response;
    }
    throw new Error(`Unexpected setup request: ${url}`);
  };

  const setup = {
    timezone: "Europe/Sarajevo",
    languages: { default: "en", available: ["en", "bs"] },
    markets: { default: "bih", available: [] },
    support: { email: null },
    readiness: { market: true, payment: false, commerce: false },
  };

  try {
    const client = createStorefront(publishableKeyA, { apiUrl });
    assert.equal(setupCalls, 0);
    const first = client.getSetup();
    const second = client.store.getSetup();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(setupCalls, 1);
    release(jsonResponse(setup));
    assert.deepEqual(await first, setup);
    assert.deepEqual(await second, setup);
    assert.deepEqual(await client.getSetup(), setup);
    assert.equal(setupCalls, 1);
    assert.equal(identifyCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("anonymous reads do not identify and concurrent first stateful calls share one visitor session", async () => {
  const storage = memoryStorage();
  const calls = [];
  let identifyStarted;
  let releaseIdentify;
  const started = new Promise((resolve) => {
    identifyStarted = resolve;
  });
  const identifyGate = new Promise((resolve) => {
    releaseIdentify = resolve;
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const request = {
      url: String(url),
      authorization: new Headers(init.headers).get("authorization"),
      body: init.body ? JSON.parse(String(init.body)) : null,
    };
    calls.push(request);
    if (request.url.endsWith("/products")) {
      return jsonResponse({ items: [], cursor: null });
    }
    if (request.url.endsWith("/customer/identify")) {
      identifyStarted();
      await identifyGate;
      return jsonResponse(identifyResponse());
    }
    if (request.url.endsWith("/carts/current")) return jsonResponse(cart());
    throw new Error(`Unexpected visitor request: ${request.url}`);
  };

  try {
    const client = createStorefront(publishableKeyA, {
      apiUrl,
      locale: "en",
      market: "bih",
      sessionStorage: storage.adapter,
    });
    await client.eshop.product.find({});
    assert.equal(calls.filter((call) => call.url.endsWith("/customer/identify")).length, 0);

    const first = client.eshop.cart.current();
    const second = client.eshop.cart.current();
    await started;
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(calls.filter((call) => call.url.endsWith("/customer/identify")).length, 1);
    releaseIdentify();
    await Promise.all([first, second]);

    const identify = calls.find((call) => call.url.endsWith("/customer/identify"));
    assert.deepEqual(identify.body, {});
    assert.equal(identify.authorization, null);
    const carts = calls.filter((call) => call.url.endsWith("/carts/current"));
    assert.equal(carts.length, 2);
    assert.equal(carts.every((call) => call.authorization === `Bearer ${visitorTokenA}`), true);
    assert.equal(storage.values.size, 1);
    const [[key, value]] = storage.values;
    assert.equal(key.includes(publishableKeyA), false);
    assert.equal(JSON.parse(value).version, 2);
    assert.equal(JSON.parse(value).session.token, visitorTokenA);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("an invalid Visitor session re-identifies once while an invalid publishable key never does", async () => {
  const expiredToken = `customer_visitor_${"c".repeat(64)}`;
  const storage = memoryStorage(storedVisitorSession(expiredToken));
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const request = {
      url: String(url),
      authorization: new Headers(init.headers).get("authorization"),
    };
    calls.push(request);
    if (request.url.endsWith("/customer/identify")) {
      return jsonResponse(identifyResponse(visitorTokenB, "customer-b"));
    }
    if (request.url.endsWith("/carts/current") && calls.filter((call) => call.url.endsWith("/carts/current")).length === 1) {
      return jsonResponse({ message: "expired", statusCode: 401 }, 401);
    }
    if (request.url.endsWith("/carts/current")) return jsonResponse(cart("cart-retried"));
    throw new Error(`Unexpected retry request: ${request.url}`);
  };

  try {
    const client = createStorefront(publishableKeyA, {
      apiUrl,
      sessionStorage: storage.adapter,
    });
    assert.equal((await client.eshop.cart.current()).id, "cart-retried");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map(({ url, authorization }) => [url.slice(apiUrl.length), authorization]),
    [
      ["/v1/storefront/carts/current", `Bearer ${expiredToken}`],
      ["/v1/storefront/customer/identify", null],
      ["/v1/storefront/carts/current", `Bearer ${visitorTokenB}`],
    ],
  );

  let invalidKeyIdentifyCalls = 0;
  const invalidOriginalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).endsWith("/customer/identify")) invalidKeyIdentifyCalls += 1;
    return jsonResponse({ message: "invalid connection", statusCode: 401 }, 401);
  };
  try {
    const invalid = createStorefront(publishableKeyB, { apiUrl });
    await assert.rejects(invalid.eshop.product.find({}), (error) => error.statusCode === 401);
  } finally {
    globalThis.fetch = invalidOriginalFetch;
  }
  assert.equal(invalidKeyIdentifyCalls, 0);
});

test("identify retries its own request once without an expired visitor token", async () => {
  const expiredToken = `customer_visitor_${"d".repeat(64)}`;
  const storage = memoryStorage(storedVisitorSession(expiredToken));
  const authorizations = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    assert.equal(String(url), `${apiUrl}/v1/storefront/customer/identify`);
    const authorization = new Headers(init.headers).get("authorization");
    authorizations.push(authorization);
    return authorization
      ? jsonResponse({ message: "expired", statusCode: 401 }, 401)
      : jsonResponse(identifyResponse(visitorTokenB, "customer-b"));
  };

  try {
    const client = createStorefront(publishableKeyA, {
      apiUrl,
      sessionStorage: storage.adapter,
    });
    const result = await client.customer.identify();
    assert.equal(result.customer.id, "customer-b");
    assert.equal("token" in result, false);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(authorizations, [`Bearer ${expiredToken}`, null]);
  assert.equal(
    JSON.parse([...storage.values.values()][0]).session.token,
    visitorTokenB,
  );
});

test("a delayed stale 401 retries with the newer visitor without replacing it", async () => {
  const storage = memoryStorage(storedVisitorSession(visitorTokenA));
  const cartAuthorizations = [];
  let oldTokenCartCalls = 0;
  let identifyCalls = 0;
  let markSecondOldRequestStarted;
  let releaseSecondOldResponse;
  const secondOldRequestStarted = new Promise((resolve) => {
    markSecondOldRequestStarted = resolve;
  });
  const secondOldResponseGate = new Promise((resolve) => {
    releaseSecondOldResponse = resolve;
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const requestUrl = String(url);
    const authorization = new Headers(init.headers).get("authorization");
    if (requestUrl.endsWith("/customer/identify")) {
      identifyCalls += 1;
      assert.equal(authorization, null);
      return jsonResponse(identifyResponse(visitorTokenB, "customer-b"));
    }
    if (requestUrl.endsWith("/carts/current")) {
      cartAuthorizations.push(authorization);
      if (authorization === `Bearer ${visitorTokenA}`) {
        oldTokenCartCalls += 1;
        if (oldTokenCartCalls === 1) {
          await secondOldRequestStarted;
          return jsonResponse({ message: "expired", statusCode: 401 }, 401);
        }
        markSecondOldRequestStarted();
        await secondOldResponseGate;
        return jsonResponse({ message: "expired", statusCode: 401 }, 401);
      }
      if (authorization === `Bearer ${visitorTokenB}`) {
        return jsonResponse(cart(`cart-new-${cartAuthorizations.length}`));
      }
    }
    throw new Error(`Unexpected stale-401 request: ${requestUrl}`);
  };

  let first;
  let second;
  try {
    const client = createStorefront(publishableKeyA, {
      apiUrl,
      sessionStorage: storage.adapter,
    });
    first = client.eshop.cart.current();
    second = client.eshop.cart.current();
    assert.match((await first).id, /^cart-new-/);
    releaseSecondOldResponse();
    assert.match((await second).id, /^cart-new-/);
  } finally {
    releaseSecondOldResponse?.();
    await Promise.allSettled([first, second].filter(Boolean));
    globalThis.fetch = originalFetch;
  }

  assert.equal(identifyCalls, 1);
  assert.deepEqual(cartAuthorizations, [
    `Bearer ${visitorTokenA}`,
    `Bearer ${visitorTokenA}`,
    `Bearer ${visitorTokenB}`,
    `Bearer ${visitorTokenB}`,
  ]);
  assert.equal(
    JSON.parse([...storage.values.values()][0]).session.token,
    visitorTokenB,
  );
});

test("SSR permits anonymous reads but requires request-local storage for stateful operations", async () => {
  let calls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    calls += 1;
    return jsonResponse({ items: [], cursor: null });
  };

  try {
    const serverClient = createStorefront(publishableKeyA, { apiUrl });
    await serverClient.content.entry.find({ collection_id: "pages" });
    await assert.rejects(
      serverClient.eshop.cart.current(),
      /request-local sessionStorage adapter/,
    );
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("visitor storage is isolated by endpoint and publishable-key fingerprint", async () => {
  const storage = memoryStorage();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const key = new Headers(init.headers).get("x-arky-publishable-key");
    const token = key === publishableKeyA ? visitorTokenA : visitorTokenB;
    return jsonResponse(identifyResponse(token, key === publishableKeyA ? "customer-a" : "customer-b"));
  };

  try {
    await createStorefront(publishableKeyA, {
      apiUrl,
      sessionStorage: storage.adapter,
    }).customer.identify();
    await createStorefront(publishableKeyB, {
      apiUrl,
      sessionStorage: storage.adapter,
    }).customer.identify();
    await createStorefront(publishableKeyA, {
      apiUrl: "https://other.example.test",
      sessionStorage: storage.adapter,
    }).customer.identify();
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(storage.values.size, 3);
  for (const key of storage.values.keys()) {
    assert.equal(key.includes(publishableKeyA), false);
    assert.equal(key.includes(publishableKeyB), false);
  }
});

test("withContext creates an isolated visitor session while reusing explicit SSR storage safely", async () => {
  const storage = memoryStorage();
  const calls = [];
  let identifyCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const request = {
      url: String(url),
      authorization: new Headers(init.headers).get("authorization"),
    };
    calls.push(request);
    if (request.url.endsWith("/customer/identify")) {
      identifyCalls += 1;
      return jsonResponse(
        identifyCalls === 1
          ? identifyResponse(visitorTokenA, "customer-a")
          : identifyResponse(visitorTokenB, "customer-b"),
      );
    }
    if (request.url.endsWith("/carts/current")) return jsonResponse(cart());
    throw new Error(`Unexpected scoped request: ${request.url}`);
  };

  try {
    const root = createStorefront(publishableKeyA, {
      apiUrl,
      sessionStorage: storage.adapter,
    });
    const scoped = root.withContext({ locale: "it", market: "ita" });

    const rootIdentity = await root.customer.identify();
    assert.equal("token" in rootIdentity, false);
    assert.equal(root.session.customer.id, "customer-a");
    assert.equal(scoped.session, null);
    const scopedIdentity = await scoped.customer.identify();
    assert.equal("token" in scopedIdentity, false);
    assert.equal(scoped.session.customer.id, "customer-b");
    assert.equal(root.session.customer.id, "customer-a");

    await root.eshop.cart.current();
    await scoped.eshop.cart.current();
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(storage.values.size, 2);
  assert.deepEqual(
    calls
      .filter((call) => call.url.endsWith("/carts/current"))
      .map((call) => call.authorization),
    [`Bearer ${visitorTokenA}`, `Bearer ${visitorTokenB}`],
  );
  assert.equal(
    calls
      .filter((call) => call.url.endsWith("/customer/identify"))
      .every((call) => call.authorization === null),
    true,
  );
});

test("code-only verification and refresh atomically rotate the discriminated Customer session", async () => {
  const storage = memoryStorage();
  const calls = [];
  let storedBeforeLogout = null;
  const customer = {
    id: "customer-rotation",
    status: "active",
    identities: [
      {
        id: "identity-rotation",
        type: "email",
        email: "person@example.com",
        verified_at: 3,
        created_at: 1,
      },
    ],
    classifications: [],
    created_at: 1,
    updated_at: 3,
  };
  const authenticated = {
    id: "session-authenticated-1",
    customer_id: customer.id,
    status: "active",
    type: "email_authenticated",
    identity_id: "identity-rotation",
    access_token: "customer_access_1",
    refresh_token: "customer_refresh_1",
    access_expires_at: 100,
    refresh_expires_at: 200,
    authenticated_at: 3,
  };
  const rotated = {
    ...authenticated,
    id: "session-authenticated-2",
    access_token: "customer_access_2",
    refresh_token: "customer_refresh_2",
    access_expires_at: 110,
    refresh_expires_at: 210,
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const path = new URL(String(url)).pathname;
    const request = {
      path,
      authorization: new Headers(init.headers).get("authorization"),
      body: init.body ? JSON.parse(String(init.body)) : null,
    };
    calls.push(request);
    if (path.endsWith("/customer/identify")) {
      return jsonResponse(identifyResponse(visitorTokenA, customer.id));
    }
    if (path.endsWith("/customer/request-code")) {
      return jsonResponse({
        customer: { ...customer, identities: [{ ...customer.identities[0], verified_at: null }] },
        session: {
          id: `session-${customer.id}`,
          customer_id: customer.id,
          type: "visitor",
          status: "active",
          superseded_at: null,
          revoked_at: null,
          expires_at: 10_000,
          email_verification: {
            identity_id: "identity-rotation",
            failed_attempts: 0,
            sent_at: 2,
            expires_at: 62,
          },
          last_seen_at: 2,
          created_at: 1,
          updated_at: 2,
        },
        email_verification: { sent_at: 2, expires_at: 62 },
      });
    }
    if (path.endsWith("/customer/verify")) {
      return jsonResponse({ customer, session: authenticated });
    }
    if (path.endsWith("/customer/refresh")) {
      return jsonResponse({ customer, session: rotated });
    }
    if (path.endsWith("/customer/me")) {
      return jsonResponse({
        customer,
        session: {
          id: rotated.id,
          customer_id: customer.id,
          type: "email_authenticated",
          status: "active",
          superseded_at: null,
          revoked_at: null,
          identity_id: rotated.identity_id,
          access_expires_at: rotated.access_expires_at,
          refresh_expires_at: rotated.refresh_expires_at,
          authenticated_at: rotated.authenticated_at,
          last_seen_at: 4,
          created_at: 3,
          updated_at: 4,
        },
      });
    }
    if (path.endsWith("/customer/logout")) return jsonResponse(null);
    throw new Error(`Unexpected Customer session request: ${path}`);
  };

  try {
    const client = createStorefront(publishableKeyA, {
      apiUrl,
      sessionStorage: storage.adapter,
    });
    const requested = await client.customer.requestCode({
      email: "person@example.com",
    });
    assert.equal(requested.email_verification.sent_at, 2);
    assert.equal("token" in requested.session, false);
    const storedAfterCode = JSON.parse([...storage.values.values()][0]);
    assert.equal(storedAfterCode.session.token, visitorTokenA);
    assert.equal(storedAfterCode.session.id, requested.session.id);
    const verified = await client.customer.verify({ code: "123456" });
    assert.equal(verified.session.id, authenticated.id);
    assert.equal(client.isAuthenticated, true);
    assert.deepEqual(client.session, {
      customer,
      id: authenticated.id,
      type: "email_authenticated",
      status: "active",
    });
    assert.equal(authenticated.access_expires_at < Date.now(), true);
    const refreshed = await client.customer.refresh();
    assert.equal(refreshed.session.id, rotated.id);
    const storedAfterRefresh = JSON.parse([...storage.values.values()][0]);
    assert.deepEqual(
      {
        id: storedAfterRefresh.session.id,
        access_token: storedAfterRefresh.session.access_token,
        refresh_token: storedAfterRefresh.session.refresh_token,
      },
      {
        id: rotated.id,
        access_token: rotated.access_token,
        refresh_token: rotated.refresh_token,
      },
    );
    const current = await client.customer.getMe();
    assert.equal(current.session.type, "email_authenticated");
    assert.equal("access_token" in current.session, false);
    assert.equal("refresh_token" in current.session, false);
    storedBeforeLogout = JSON.parse([...storage.values.values()][0]);
    await client.customer.logout();
    assert.equal(client.session, null);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map(({ path, authorization, body }) => [path, authorization, body]),
    [
      ["/v1/storefront/customer/identify", null, {}],
      ["/v1/storefront/customer/request-code", `Bearer ${visitorTokenA}`, { email: "person@example.com" }],
      ["/v1/storefront/customer/verify", `Bearer ${visitorTokenA}`, { code: "123456" }],
      ["/v1/storefront/customer/refresh", null, { refresh_token: "customer_refresh_1" }],
      ["/v1/storefront/customer/me", "Bearer customer_access_2", null],
      ["/v1/storefront/customer/logout", "Bearer customer_access_2", {}],
    ],
  );
  assert.equal(storedBeforeLogout.version, 2);
  assert.equal(storedBeforeLogout.session.id, rotated.id);
  assert.equal(storedBeforeLogout.session.access_token, "customer_access_2");
  assert.equal(storedBeforeLogout.session.refresh_token, "customer_refresh_2");
  assert.equal(storage.values.size, 0);
});

test("refresh 401 keeps the previous authenticated Session and never retries with Authorization", async () => {
  const customer = {
    id: "customer-refresh-failure",
    status: "active",
    identities: [],
    classifications: [],
    created_at: 1,
    updated_at: 1,
  };
  const session = {
    id: "session-refresh-failure",
    customer_id: customer.id,
    status: "active",
    type: "email_authenticated",
    identity_id: "identity-refresh-failure",
    access_token: "customer_access_expired",
    refresh_token: "customer_refresh_rejected",
    access_expires_at: 1,
    refresh_expires_at: 2,
    authenticated_at: 1,
  };
  const initialRecord = JSON.stringify({ version: 2, customer, session });
  let storedRecord = initialRecord;
  const storage = {
    getItem(key) {
      return key.startsWith("arky_customer_session:v2:") ? storedRecord : null;
    },
    setItem(_key, value) {
      storedRecord = value;
    },
    removeItem(key) {
      if (key.startsWith("arky_customer_session:v2:")) storedRecord = null;
    },
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      authorization: new Headers(init.headers).get("authorization"),
      publishableKey: new Headers(init.headers).get("x-arky-publishable-key"),
      body: JSON.parse(String(init.body)),
    });
    return jsonResponse(
      {
        message: "Refresh token rejected",
        error: "CUSTOMER_SESSION_REFRESH_REJECTED",
        statusCode: 401,
        validationErrors: [],
      },
      401,
    );
  };

  try {
    const client = createStorefront(publishableKeyA, {
      apiUrl,
      sessionStorage: storage,
    });
    await assert.rejects(client.customer.refresh(), /Refresh token rejected/);
    assert.deepEqual(client.session, {
      customer,
      id: session.id,
      type: "email_authenticated",
      status: "active",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(calls, [
    {
      url: `${apiUrl}/v1/storefront/customer/refresh`,
      authorization: null,
      publishableKey: publishableKeyA,
      body: { refresh_token: session.refresh_token },
    },
  ]);
  assert.equal(storedRecord, initialRecord);
});

test("initialization rejects a versioned record containing an invalid Visitor credential", () => {
  const removed = [];
  const invalid = storedVisitorSession("invalid-visitor-token");
  const storage = {
    getItem(key) {
      return key.startsWith("arky_customer_session:v2:") ? invalid : null;
    },
    setItem() {},
    removeItem(key) {
      removed.push(key);
    },
  };

  const client = createStorefront(publishableKeyA, {
    apiUrl,
    sessionStorage: storage,
  });

  assert.equal(client.session, null);
  assert.equal(
    removed.some((key) => key.startsWith("arky_customer_session:v2:")),
    true,
  );
});
