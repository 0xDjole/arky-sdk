import assert from "node:assert/strict";
import test from "node:test";

import { createStorefront } from "../dist/storefront.js";

const apiUrl = "https://api.example.test";
const publishableKeyA = `arky_pk_${"a".repeat(42)}A`;
const publishableKeyB = `arky_pk_${"b".repeat(42)}A`;
const visitorTokenA = `arky_vst_${"a".repeat(64)}`;
const visitorTokenB = `arky_vst_${"b".repeat(64)}`;

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
        fallback = null;
        values.delete(key);
      },
    },
  };
}

function identifyResponse(token = visitorTokenA, id = "contact-a") {
  return {
    contact: {
      id,
      email: null,
      verified: false,
      status: "active",
      channels: [],
      promo_usage: [],
      taxonomies: [],
      created_at: 1,
      updated_at: 1,
    },
    token: {
      id: `session-${id}`,
      token,
      status: "active",
      created_at: 1,
      expires_at: 10_000,
    },
    verification_challenge: null,
  };
}

function cart(id = "cart-a") {
  return {
    id,
    contact_id: "contact-a",
    token: "cart-token",
    status: "active",
    origin: "storefront",
    market: "bih",
    items: [],
    shipping_address: null,
    billing_address: null,
    forms: [],
    promo_code: null,
    payment_method_key: null,
    shipping_method_id: null,
    quote_snapshot: null,
    converted_order_id: null,
    item_count: 0,
    last_action_at: 1,
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
    if (String(url).endsWith("/account/identify")) identifyCalls += 1;
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
    if (request.url.endsWith("/account/identify")) {
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
    assert.equal(calls.filter((call) => call.url.endsWith("/account/identify")).length, 0);

    const first = client.eshop.cart.current();
    const second = client.eshop.cart.current();
    await started;
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(calls.filter((call) => call.url.endsWith("/account/identify")).length, 1);
    releaseIdentify();
    await Promise.all([first, second]);

    const identify = calls.find((call) => call.url.endsWith("/account/identify"));
    assert.deepEqual(identify.body, {});
    assert.equal(identify.authorization, null);
    const carts = calls.filter((call) => call.url.endsWith("/carts/current"));
    assert.equal(carts.length, 2);
    assert.equal(carts.every((call) => call.authorization === `Bearer ${visitorTokenA}`), true);
    assert.equal(storage.values.size, 1);
    const [[key, value]] = storage.values;
    assert.equal(key.includes(publishableKeyA), false);
    assert.equal(value, visitorTokenA);
    assert.equal(value.startsWith("{"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("an invalid visitor token re-identifies once while an invalid publishable key never does", async () => {
  const storage = memoryStorage(`arky_vst_${"c".repeat(64)}`);
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const request = {
      url: String(url),
      authorization: new Headers(init.headers).get("authorization"),
    };
    calls.push(request);
    if (request.url.endsWith("/account/identify")) {
      return jsonResponse(identifyResponse(visitorTokenB, "contact-b"));
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
      ["/v1/storefront/carts/current", `Bearer arky_vst_${"c".repeat(64)}`],
      ["/v1/storefront/account/identify", null],
      ["/v1/storefront/carts/current", `Bearer ${visitorTokenB}`],
    ],
  );

  let invalidKeyIdentifyCalls = 0;
  const invalidOriginalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).endsWith("/account/identify")) invalidKeyIdentifyCalls += 1;
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
  const expiredToken = `arky_vst_${"d".repeat(64)}`;
  const storage = memoryStorage(expiredToken);
  const authorizations = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    assert.equal(String(url), `${apiUrl}/v1/storefront/account/identify`);
    const authorization = new Headers(init.headers).get("authorization");
    authorizations.push(authorization);
    return authorization
      ? jsonResponse({ message: "expired", statusCode: 401 }, 401)
      : jsonResponse(identifyResponse(visitorTokenB, "contact-b"));
  };

  try {
    const client = createStorefront(publishableKeyA, {
      apiUrl,
      sessionStorage: storage.adapter,
    });
    const result = await client.identify();
    assert.equal(result.contact.id, "contact-b");
    assert.equal("token" in result, false);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(authorizations, [`Bearer ${expiredToken}`, null]);
  assert.deepEqual([...storage.values.values()], [visitorTokenB]);
});

test("a delayed stale 401 retries with the newer visitor without replacing it", async () => {
  const storage = memoryStorage(visitorTokenA);
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
    if (requestUrl.endsWith("/account/identify")) {
      identifyCalls += 1;
      assert.equal(authorization, null);
      return jsonResponse(identifyResponse(visitorTokenB, "contact-b"));
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
  assert.deepEqual([...storage.values.values()], [visitorTokenB]);
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
    await serverClient.cms.entry.find({ collection_id: "pages" });
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
    return jsonResponse(identifyResponse(token, key === publishableKeyA ? "contact-a" : "contact-b"));
  };

  try {
    await createStorefront(publishableKeyA, {
      apiUrl,
      sessionStorage: storage.adapter,
    }).identify();
    await createStorefront(publishableKeyB, {
      apiUrl,
      sessionStorage: storage.adapter,
    }).identify();
    await createStorefront(publishableKeyA, {
      apiUrl: "https://other.example.test",
      sessionStorage: storage.adapter,
    }).identify();
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
    if (request.url.endsWith("/account/identify")) {
      identifyCalls += 1;
      return jsonResponse(
        identifyCalls === 1
          ? identifyResponse(visitorTokenA, "contact-a")
          : identifyResponse(visitorTokenB, "contact-b"),
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

    const rootIdentity = await root.identify();
    assert.equal("token" in rootIdentity, false);
    assert.equal(root.session.contact.id, "contact-a");
    assert.equal(scoped.session, null);
    const scopedIdentity = await scoped.crm.contact.identify();
    assert.equal("token" in scopedIdentity, false);
    assert.equal(scoped.session.contact.id, "contact-b");
    assert.equal(root.session.contact.id, "contact-a");

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
      .filter((call) => call.url.endsWith("/account/identify"))
      .every((call) => call.authorization === null),
    true,
  );
});
