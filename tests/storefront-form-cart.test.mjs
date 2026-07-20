import assert from "node:assert/strict";
import test from "node:test";

import { initialize } from "../dist/storefront.js";

const apiUrl = "https://api.example.test";
const publishableKey = `arky_pk_${"f".repeat(42)}A`;
const visitorToken = `arky_vst_${"f".repeat(64)}`;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function memoryStorage() {
  const values = new Map();
  return {
    values,
    adapter: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  };
}

function contact(email = null) {
  return {
    id: "contact-form-contract",
    email,
    verified: Boolean(email),
    status: "active",
    channels: [],
    promo_usage: [],
    taxonomies: [],
    created_at: 1,
    updated_at: 1,
  };
}

function identifyResponse(email = null) {
  return {
    contact: contact(email),
    token: {
      id: "visitor-session-form-contract",
      token: visitorToken,
      status: "active",
      created_at: 1,
      expires_at: 10_000,
    },
    verification_challenge: null,
  };
}

function form() {
  return {
    id: "form-contact",
    key: "contact-form",
    schema: [
      { id: "field-name", key: "name", type: "text", required: true },
      { id: "field-age", key: "age", type: "number", required: false },
      { id: "field-member", key: "member", type: "boolean", required: false },
      {
        id: "field-location",
        key: "location",
        type: "geo_location",
        required: false,
      },
    ],
    blocks: [],
    created_at: 1,
    updated_at: 1,
  };
}

test("a fresh cart load resolves Store defaults before hydrating persisted product items", async () => {
  const calls = [];
  const store = initialize(publishableKey, {
    apiUrl,
    sessionStorage: {
      getItem: () => visitorToken,
      setItem() {},
      removeItem() {},
    },
  });
  const cart = {
    id: "cart-hydration-contract",
    contact_id: "contact-form-contract",
    token: "cart-recovery-contract",
    status: "active",
    origin: "storefront",
    market: "ita",
    items: [
      {
        type: "product",
        id: "line-hydration-contract",
        product_id: "product-hydration-contract",
        variant_id: "variant-hydration-contract",
        quantity: 1,
      },
    ],
    forms: [],
    item_count: 1,
    created_at: 1,
    updated_at: 1,
  };
  const setup = {
    timezone: "Europe/Rome",
    languages: { default: "it", available: ["it"] },
    markets: {
      default: "ita",
      available: [
        {
          id: "market-ita",
          key: "ita",
          currency: "EUR",
          payment_methods: [],
          zones: [],
        },
      ],
    },
    support: { email: "support@example.test" },
    payment: null,
    readiness: { market: true, payment: false, commerce: true },
  };
  const product = {
    id: "product-hydration-contract",
    key: "hydrated-product",
    slug: { it: "prodotto-idratato" },
    blocks: [{ key: "name", value: { it: "Prodotto idratato" } }],
    variants: [
      {
        id: "variant-hydration-contract",
        prices: [{ market: "ita", amount: 1250, currency: "EUR" }],
        inventory: [],
        attributes: [],
        requires_shipping: false,
      },
    ],
    status: "active",
    created_at: 1,
    updated_at: 1,
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const call = {
      url: String(url),
      method: init.method,
      authorization: new Headers(init.headers).get("authorization"),
    };
    calls.push(call);
    if (call.url.endsWith("/carts/current")) return jsonResponse(cart);
    if (call.url === `${apiUrl}/v1/storefront`) return jsonResponse(setup);
    if (call.url.endsWith("/products/product-hydration-contract")) {
      return jsonResponse(product);
    }
    throw new Error(
      `Unexpected cart hydration request: ${call.method} ${call.url}`,
    );
  };

  try {
    assert.equal((await store.eshop.cart.load()).id, cart.id);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map((call) => call.url),
    [
      `${apiUrl}/v1/storefront/carts/current`,
      `${apiUrl}/v1/storefront`,
      `${apiUrl}/v1/storefront/products/product-hydration-contract`,
    ],
  );
  assert.equal(
    calls.every((call) => call.authorization === `Bearer ${visitorToken}`),
    true,
  );
  assert.deepEqual(store.eshop.cart.product_items.get(), [
    {
      id: "line-hydration-contract",
      product_id: product.id,
      variant_id: "variant-hydration-contract",
      product_name: "Prodotto idratato",
      product_slug: "prodotto-idratato",
      variant_attributes: [],
      requires_shipping: false,
      price: { market: "ita", amount: 1250, currency: "EUR" },
      quantity: 1,
      added_at: 1000,
      max_stock: 0,
    },
  ]);
  assert.equal(store.eshop.cart.status.get().error, null);
  assert.equal(store.getMarket(), "ita");
  assert.equal(store.getLocale(), "it");
});

test("submitByKey reads anonymously, identifies lazily, and submits no Store routing fields", async () => {
  const storage = memoryStorage();
  const store = initialize(publishableKey, {
    apiUrl,
    locale: "it",
    market: "ita",
    sessionStorage: storage.adapter,
  });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const call = {
      url: String(url),
      method: init.method,
      body: init.body ? JSON.parse(String(init.body)) : null,
      headers: new Headers(init.headers),
    };
    calls.push(call);
    if (call.url.endsWith("/forms/contact-form")) return jsonResponse(form());
    if (call.url.endsWith("/account/identify")) return jsonResponse(identifyResponse());
    if (call.url.endsWith("/forms/form-contact/submissions")) {
      return jsonResponse({
        id: "submission-contact",
        form_id: "form-contact",
        fields: call.body.fields,
      });
    }
    throw new Error(`Unexpected form request: ${call.method} ${call.url}`);
  };

  try {
    const result = await store.cms.form.submitByKey({
      key: "contact-form",
      values: {
        name: "Jane",
        age: 32,
        member: false,
        location: {
          coordinates: { lat: 43.8563, lon: 18.4131 },
          label: "Sarajevo",
        },
      },
    });
    assert.equal(result.id, "submission-contact");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map(({ method, url }) => [method, url]),
    [
      ["GET", `${apiUrl}/v1/storefront/forms/contact-form`],
      ["POST", `${apiUrl}/v1/storefront/account/identify`],
      ["POST", `${apiUrl}/v1/storefront/forms/form-contact/submissions`],
    ],
  );
  assert.equal(calls[0].headers.get("authorization"), null);
  assert.equal(calls[2].headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.equal(calls[2].headers.get("x-arky-locale"), "it");
  assert.equal(calls[2].headers.get("x-arky-market"), "ita");
  assert.deepEqual(calls[1].body, {});
  assert.deepEqual(calls[2].body, {
    form_id: "form-contact",
    fields: [
      { id: "field-name", key: "name", type: "text", value: "Jane" },
      { id: "field-age", key: "age", type: "number", value: 32 },
      { id: "field-member", key: "member", type: "boolean", value: false },
      {
        id: "field-location",
        key: "location",
        type: "geo_location",
        value: {
          coordinates: { lat: 43.8563, lon: 18.4131 },
          label: "Sarajevo",
        },
      },
    ],
  });
  assert.equal(JSON.stringify(calls).includes("store_id"), false);
  assert.deepEqual([...storage.values.values()], [visitorToken]);
});

test("submitByKey validates the latest schema before identifying or submitting", async () => {
  const storage = memoryStorage();
  const store = initialize(publishableKey, {
    apiUrl,
    sessionStorage: storage.adapter,
  });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method });
    if ((init.method || "GET") === "GET") return jsonResponse(form());
    throw new Error(`Validation must not issue ${init.method} ${url}`);
  };

  try {
    await assert.rejects(
      store.cms.form.submitByKey({
        key: "contact-form",
        values: { name: "Jane", unknown: "no" },
      }),
      /not defined by the form schema/,
    );
    await assert.rejects(
      store.cms.form.submitByKey({ key: "contact-form", values: {} }),
      /required value is missing/,
    );
    await assert.rejects(
      store.cms.form.submitByKey({
        key: "contact-form",
        values: { name: 42 },
      }),
      /expected text/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 3);
  assert.equal(calls.every((call) => call.method === "GET"), true);
  assert.equal(storage.values.size, 0);
});

test("email identification normalizes the address and reuses the exact identified visitor", async () => {
  const storage = memoryStorage();
  const store = initialize(publishableKey, {
    apiUrl,
    sessionStorage: storage.adapter,
  });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const body = JSON.parse(String(init.body));
    calls.push({ url: String(url), body });
    return jsonResponse(identifyResponse(body.email));
  };

  try {
    const first = await store.identifyContactEmailIfMissing("  Person@Example.COM  ");
    const second = await store.identifyContactEmailIfMissing("person@example.com");
    assert.equal(first.contact.email, "person@example.com");
    assert.equal(second.contact.email, "person@example.com");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].body, { email: "person@example.com" });
  assert.equal(calls[0].url, `${apiUrl}/v1/storefront/account/identify`);
});

test("email identification after a page reload preserves the stored visitor session", async () => {
  const storage = memoryStorage();
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const request = {
      url: String(url),
      authorization: new Headers(init.headers).get("authorization"),
      body: init.body ? JSON.parse(String(init.body)) : null,
    };
    calls.push(request);
    if (request.url.endsWith("/account/identify") && !request.authorization) {
      return jsonResponse(identifyResponse());
    }
    if (request.url.endsWith("/account/identify")) {
      return jsonResponse({
        ...identifyResponse("person@example.com"),
        token: null,
      });
    }
    if (request.url.endsWith("/carts/current")) {
      return jsonResponse({
        id: "cart-reload-contract",
        contact_id: "contact-form-contract",
        token: "cart-recovery-contract",
        status: "active",
        origin: "storefront",
        market: "ita",
        items: [],
        forms: [],
        item_count: 0,
        created_at: 1,
        updated_at: 1,
      });
    }
    throw new Error(`Unexpected reload request: ${request.url}`);
  };

  try {
    const firstPage = initialize(publishableKey, {
      apiUrl,
      market: "ita",
      sessionStorage: storage.adapter,
    });
    await firstPage.eshop.cart.load();

    const reloadedPage = initialize(publishableKey, {
      apiUrl,
      market: "ita",
      sessionStorage: storage.adapter,
    });
    await reloadedPage.identifyContactEmailIfMissing("person@example.com");
    await reloadedPage.eshop.cart.load();
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map(({ url, authorization, body }) => [
      url.slice(apiUrl.length),
      authorization,
      body,
    ]),
    [
      ["/v1/storefront/account/identify", null, {}],
      ["/v1/storefront/carts/current", `Bearer ${visitorToken}`, {}],
      [
        "/v1/storefront/account/identify",
        `Bearer ${visitorToken}`,
        { email: "person@example.com" },
      ],
      ["/v1/storefront/carts/current", `Bearer ${visitorToken}`, {}],
    ],
  );
  assert.deepEqual([...storage.values.values()], [visitorToken]);
});

test("raw form submission remains stateful and keeps only caller form fields", async () => {
  const storage = memoryStorage();
  const store = initialize(publishableKey, {
    apiUrl,
    sessionStorage: storage.adapter,
  });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), body: JSON.parse(String(init.body)) });
    if (String(url).endsWith("/account/identify")) {
      return jsonResponse(identifyResponse());
    }
    return jsonResponse({ id: "submission-raw", ...JSON.parse(String(init.body)) });
  };

  try {
    await store.cms.form.submit({
      form_id: "form-raw",
      fields: [{ id: "field-raw", key: "message", type: "text", value: "Hello" }],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(calls.map((call) => call.url), [
    `${apiUrl}/v1/storefront/account/identify`,
    `${apiUrl}/v1/storefront/forms/form-raw/submissions`,
  ]);
  assert.deepEqual(calls[1].body, {
    form_id: "form-raw",
    fields: [{ id: "field-raw", key: "message", type: "text", value: "Hello" }],
  });
});
