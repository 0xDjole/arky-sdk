import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createAdmin, SDK_VERSION } from "../dist/index.js";
import { createStorefront } from "../dist/storefront.js";

const baseUrl = "https://api.example.test";
const storeId = "store-client-contract";
const publishableKey = `arky_pk_${"k".repeat(43)}`;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("admin code login activates the same pending Account Session", async () => {
  const admin = createAdmin({ baseUrl, storeId, market: "us" });
  const calls = [];
  const responses = [
    {
      session_id: "session-client-contract",
      verification_expires_at: 900,
    },
    {
      id: "session-client-contract",
      access_token: "access-client-contract",
      refresh_token: "refresh-client-contract",
      access_expires_at: 1000,
      refresh_expires_at: 2000,
      authenticated_at: 20,
      created_at: 10,
      updated_at: 20,
    },
  ];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: JSON.parse(String(init.body)),
    });
    return jsonResponse(responses.shift());
  };

  try {
    const pending = await admin.account.auth.code({
      email: "operator@example.test",
    });
    await admin.account.auth.verify({
      session_id: pending.session_id,
      code: "123456",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/auth/code`,
      method: "POST",
      body: { email: "operator@example.test" },
    },
    {
      url: `${baseUrl}/v1/auth/verify`,
      method: "POST",
      body: {
        session_id: "session-client-contract",
        code: "123456",
      },
    },
  ]);
});

test("Store invitation login wraps the platform-global pending Account Session", async () => {
  const admin = createAdmin({ baseUrl, storeId, market: "us" });
  const invitationStoreId = "store-invitation-contract";
  const calls = [];
  const responses = [
    {
      session_id: "session-invitation-contract",
      verification_expires_at: 900,
    },
    {
      id: "session-invitation-contract",
      access_token: "access-invitation-contract",
      refresh_token: "refresh-invitation-contract",
      access_expires_at: 1000,
      refresh_expires_at: 2000,
      authenticated_at: 20,
      created_at: 10,
      updated_at: 20,
    },
  ];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: JSON.parse(String(init.body)),
    });
    return jsonResponse(responses.shift());
  };

  try {
    const pending = await admin.account.auth.storeCode(
      invitationStoreId,
      { email: "invitee@example.test" },
    );
    await admin.account.auth.storeVerify(invitationStoreId, {
      session_id: pending.session_id,
      code: "123456",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${invitationStoreId}/auth/code`,
      method: "POST",
      body: { email: "invitee@example.test" },
    },
    {
      url: `${baseUrl}/v1/stores/${invitationStoreId}/auth/verify`,
      method: "POST",
      body: {
        session_id: "session-invitation-contract",
        code: "123456",
      },
    },
  ]);
});

test("admin refresh returns the rotated Account Session contract", async () => {
  const admin = createAdmin({ baseUrl, storeId, market: "us" });
  const calls = [];
  const response = {
    id: "session-rotated",
    access_token: "access-rotated",
    refresh_token: "refresh-rotated",
    access_expires_at: 2_000,
    refresh_expires_at: 3_000,
    authenticated_at: 500,
    created_at: 1_000,
    updated_at: 1_000,
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: JSON.parse(String(init.body)),
    });
    return jsonResponse(response);
  };

  let result;
  try {
    result = await admin.account.auth.refresh({
      refresh_token: "refresh-previous",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(result, response);
  assert.equal(result.authenticated_at, 500);
  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/auth/refresh`,
      method: "POST",
      body: { refresh_token: "refresh-previous" },
    },
  ]);
});

test("request errors preserve the server response while normalizing validation details", async () => {
  const admin = createAdmin({ baseUrl, storeId, market: "us" });
  const response = {
    message: "Email is invalid",
    error: "GENERAL.VALIDATION_ERROR",
    statusCode: 422,
    validationErrors: [{ field: "email", error: "" }],
  };
  let errorContext;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => jsonResponse(response, 422);

  try {
    await assert.rejects(
      admin.account.auth.code(
        { email: "invalid" },
        {
          onError: (context) => {
            errorContext = context;
          },
        },
      ),
      (error) => {
        assert.equal(error.name, "ApiError");
        assert.equal(error.message, response.message);
        assert.equal(error.statusCode, 422);
        assert.deepEqual(error.validationErrors, [
          { field: "email", error: "GENERAL.VALIDATION_ERROR" },
        ]);
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(errorContext.status, 422);
  assert.deepEqual(errorContext.response, response);
});

test("admin Store methods expose publishable-key regeneration and default-market changes", async () => {
  const admin = createAdmin({
    baseUrl,
    storeId,
    apiToken: "arky_api_admin_contract",
  });
  const store = {
    id: storeId,
    key: "client-contract",
    publishable_key: publishableKey,
    default_market_id: "market-bih",
    timezone: "Europe/Sarajevo",
    languages: ["en"],
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: init.body ? JSON.parse(String(init.body)) : null,
    });
    return jsonResponse(store);
  };

  try {
    assert.deepEqual(
      await admin.store.regeneratePublishableKey({ store_id: storeId }),
      store,
    );
    await admin.store.update({ id: storeId, default_market_id: "market-bih" });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${storeId}/publishable-key/regenerate`,
      method: "POST",
      body: {},
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}`,
      method: "PUT",
      body: { id: storeId, default_market_id: "market-bih" },
    },
  ]);
});

test("admin Store deletion requests the lifecycle transition with exact confirmation", async () => {
  const admin = createAdmin({
    baseUrl,
    storeId,
    market: "us",
  });
  const deletingStore = {
    id: storeId,
    key: "client-contract",
    publishable_key: publishableKey,
    lifecycle: "deleting",
    default_market_id: null,
    timezone: "Europe/Sarajevo",
    languages: ["en"],
    emails: {
      billing: "billing@example.test",
      support: "support@example.test",
    },
  };
  let call;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    call = {
      url: String(url),
      method: init.method,
      body: JSON.parse(String(init.body)),
    };
    return jsonResponse(deletingStore);
  };

  try {
    assert.deepEqual(
      await admin.store.requestDeletion({ confirmation: "client-contract" }),
      deletingStore,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(call, {
    url: `${baseUrl}/v1/stores/${storeId}/deletion`,
    method: "POST",
    body: { confirmation: "client-contract" },
  });
});

test("admin market deletion sends an explicit replacement default as query context", async () => {
  const admin = createAdmin({
    baseUrl,
    storeId,
    apiToken: "arky_api_admin_contract",
  });
  let call;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    call = { url: String(url), method: init.method };
    return jsonResponse({ deleted: true });
  };

  try {
    await admin.store.market.delete({
      id: "market-old",
      replacement_default_market_id: "market-next",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(call, {
    url: `${baseUrl}/v1/stores/${storeId}/markets/market-old?replacement_default_market_id=market-next`,
    method: "DELETE",
  });
});

test("Classification is top-level and uses the renamed Admin and storefront routes", async () => {
  const admin = createAdmin({ baseUrl, storeId, market: "us" });
  const storefront = createStorefront(publishableKey, { apiUrl: baseUrl });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const target = String(url);
    calls.push({
      url: target,
      method: init.method || "GET",
      body: init.body ? JSON.parse(String(init.body)) : null,
    });
    if (target.endsWith("/children")) return jsonResponse([]);
    if (target.includes("?status=active")) {
      return jsonResponse({ items: [], cursor: null });
    }
    return jsonResponse({
      id: "classification-contract",
      store_id: storeId,
      key: "topics",
      parent_id: null,
      schema: [],
      status: "active",
      created_at: 1,
      updated_at: 1,
    });
  };

  try {
    assert.equal("classification" in admin.cms, false);
    assert.equal("classification" in storefront.cms, false);
    await admin.classification.create({ key: "topics", schema: [] });
    await admin.classification.get({ id: "classification-contract" });
    await admin.classification.find({ status: "active" });
    await storefront.classification.get({ key: "topics" });
    await storefront.classification.getChildren({
      id: "classification-contract",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map((call) => ({
      ...call,
      url: call.url.replace(baseUrl, ""),
    })),
    [
      {
        url: `/v1/stores/${storeId}/classifications`,
        method: "POST",
        body: { key: "topics", schema: [] },
      },
      {
        url: `/v1/stores/${storeId}/classifications/classification-contract`,
        method: "GET",
        body: null,
      },
      {
        url: `/v1/stores/${storeId}/classifications?status=active`,
        method: "GET",
        body: null,
      },
      {
        url: "/v1/storefront/classifications/topics",
        method: "GET",
        body: null,
      },
      {
        url: "/v1/storefront/classifications/classification-contract/children",
        method: "GET",
        body: null,
      },
    ],
  );
});

test("storefront collection lookup uses a keyless route and publishable-key header", async () => {
  const storefront = createStorefront(publishableKey, {
    apiUrl: baseUrl,
    locale: "en",
  });
  let call;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    call = { url: String(url), headers: new Headers(init.headers) };
    return jsonResponse({ id: "collection-contract", key: "articles" });
  };

  try {
    await storefront.cms.collection.get({ key: "articles" });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(call.url, `${baseUrl}/v1/storefront/collections/articles`);
  assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
  assert.equal(call.headers.get("x-arky-locale"), "en");
  assert.equal(call.headers.get("authorization"), null);
});

test("storefront product inventory is an explicit child-resource request", async () => {
  const storefront = createStorefront(publishableKey, {
    apiUrl: baseUrl,
    locale: "en",
  });
  let call;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    call = { url: String(url), headers: new Headers(init.headers) };
    return jsonResponse([]);
  };

  try {
    await storefront.eshop.product.getInventory({ slug: "lean-product" });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    call.url,
    `${baseUrl}/v1/storefront/products/lean-product/inventory`,
  );
  assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
});

test("storefront cart recovery sends its credential only in the cart-token header", async () => {
  const visitorToken = `arky_vst_${"c".repeat(64)}`;
  const recoveryToken = "cart-recovery-contract-token";
  const storefront = createStorefront(publishableKey, {
    apiUrl: baseUrl,
    sessionStorage: {
      getItem: () => visitorToken,
      setItem() {},
      removeItem() {},
    },
  });
  let call;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    call = {
      url: String(url),
      headers: new Headers(init.headers),
      body: init.body,
    };
    return jsonResponse({ id: "cart-recovery-contract", token: recoveryToken });
  };

  try {
    await storefront.eshop.cart.get(
      { id: "cart-recovery-contract", token: recoveryToken },
      {
        headers: { "x-arky-cart-token": "caller-cannot-override" },
        params: {
          token: "unexpected-query-token",
          cart_token: "unexpected-query-cart-token",
          include: "summary",
        },
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    call.url,
    `${baseUrl}/v1/storefront/carts/cart-recovery-contract?include=summary`,
  );
  assert.equal(call.headers.get("x-arky-cart-token"), recoveryToken);
  assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.equal(call.body, undefined);
  assert.equal(call.url.includes("token"), false);
});

test("storefront money helpers preserve exact zero and reject invalid minor units", () => {
  const storefront = createStorefront(publishableKey, {
    apiUrl: baseUrl,
    market: "ita",
  });
  const prices = [
    { market: "other", amount: 999, currency: "USD" },
    { market: "ita", amount: 0, currency: "EUR" },
  ];

  assert.equal(storefront.utils.getPriceAmount(prices), 0);
  assert.notEqual(storefront.utils.formatPrice(prices), "");
  storefront.setContext({ market: "missing" });
  assert.equal(storefront.utils.getPriceAmount(prices), null);
  assert.equal(storefront.utils.formatPrice(prices), "");
  assert.throws(() => storefront.utils.formatMinor(1.5, "EUR"), /safe integer/);
});

test("SDK_VERSION equals the package version", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.equal(SDK_VERSION, packageJson.version);
});

test("recursive storefront declarations never degrade to any", async () => {
  const declaration = await readFile(
    new URL("../dist/index.d.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(declaration, /\/\*elided\*\/ any/);
  assert.match(
    declaration,
    /withContext\(context: StorefrontContext\): StorefrontClient/,
  );
  assert.match(
    declaration,
    /withContext\(context: ArkyStoreContext\): InitializedStore/,
  );
});
