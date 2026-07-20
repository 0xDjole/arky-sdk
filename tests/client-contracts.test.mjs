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

test("admin verification sends only the challenge identifier and code", async () => {
  const admin = createAdmin({ baseUrl, storeId, market: "us" });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: JSON.parse(String(init.body)),
    });
    return jsonResponse({
      id: "session-client-contract",
      access_token: "access-client-contract",
      refresh_token: "refresh-client-contract",
      access_expires_at: 1000,
      refresh_expires_at: 2000,
      created_at: 1,
      is_verified: true,
    });
  };

  try {
    await admin.account.auth.verify({
      challenge_id: "challenge-client-contract",
      code: "123456",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/auth/verify`,
      method: "POST",
      body: {
        challenge_id: "challenge-client-contract",
        code: "123456",
      },
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
    languages: [{ id: "en" }],
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

  assert.equal(
    call.url,
    `${baseUrl}/v1/storefront/collections/articles`,
  );
  assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
  assert.equal(call.headers.get("x-arky-locale"), "en");
  assert.equal(call.headers.get("authorization"), null);
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
