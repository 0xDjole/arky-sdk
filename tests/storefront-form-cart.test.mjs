import assert from "node:assert/strict";
import test from "node:test";

import { initialize } from "../dist/storefront.js";
import { storefrontSessionStorage } from "./helpers/storefront-session-storage.mjs";

const apiUrl = "https://api.example.test";
const publishableKey = `arky_pk_${"f".repeat(42)}A`;
const visitorToken = `customer_visitor_${"f".repeat(64)}`;

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

function customer(email = null) {
  return {
    id: "customer-form-contract",
    status: { type: "active" },
    identities: email
      ? [
          {
            id: "identity-form-contract",
            type: "email",
            email,
            verified_at: null,
            created_at: 1,
          },
        ]
      : [],
    classifications: [],
    created_at: 1,
    updated_at: 1,
  };
}

function identifyResponse(email = null) {
  return {
    customer: customer(email),
    session: {
      id: "visitor-session-form-contract",
      customer_id: "customer-form-contract",
      type: "visitor",
      token: visitorToken,
      status: { type: "active" },
      expires_at: 10_000,
    },
  };
}

function storedVisitorSession() {
  const { customer: customerRecord, session } = identifyResponse();
  return JSON.stringify({ version: 2, customer: customerRecord, session });
}

function form() {
  return {
    id: "form-contact",
    key: "contact-form",
    locale: "it",
    presentation_digest: "a".repeat(64),
    schema: [
      { id: "field-name", key: "name", type: "text", required: true, question: null },
      { id: "field-age", key: "age", type: "number", required: false, question: null, min: null, max: null },
      { id: "field-member", key: "member", type: "boolean", required: false, question: null },
      {
        id: "field-location",
        key: "location",
        type: "geo_location",
        required: false,
        question: null,
      },
    ],
  };
}

test("a fresh cart load resolves Store defaults before loading persisted product references", async () => {
  const calls = [];
  const store = initialize(publishableKey, {
    apiUrl,
    sessionStorage: storefrontSessionStorage(storedVisitorSession()),
  });
  const cart = {
    id: "cart-hydration-contract",
    store_id: "store-form-contract",
    customer_id: "customer-form-contract",
    company: null,
    sales_channel_id: "channel-form-contract",
    status: { type: "active" },
    origin: {
      type: "storefront",
      customer_id: "customer-form-contract",
      customer_session_id: "visitor-session-form-contract",
    },
    market_id: "market-ita",
    line_items: [
      {
        type: "product",
        id: "line-hydration-contract",
        product_id: "product-hydration-contract",
        variant_id: "variant-hydration-contract",
        quantity: 1,
        form_submission_id: "form-submission-hydration-contract",
        price_override: null,
      },
    ],
    delivery_groups: [],
    billing_address: null,
    promotion_code_ids: [],
    purchase_order_number: null,
    item_count: 1,
    last_action_at: 1,
    abandoned_at: null,
    created_at: 0,
    updated_at: 1,
  };
  const setup = {
    timezone: "Europe/Rome",
    languages: { default: "it", available: ["it"] },
    commerce: { type: "ready", default_market_id: "market-ita", default_sales_channel_id: "channel-form-contract" },
    default_market: {
      id: "market-ita",
      key: "ita",
      currency: "eur",
      tax_mode: "exclusive",
      payment_provider_ids: [],
    },
    payment_providers: [],
    support: { email: "support@example.test" },
    readiness: { market: true, payment: false, commerce: true },
  };
  const product = {
    id: "product-hydration-contract",
    key: "hydrated-product",
    slugs: { it: "prodotto-idratato" },
    blocks: [
      {
        id: "product-name",
        key: "name",
        type: "object",
        value: {
          it: {
            id: "product-name-it",
            key: "it",
            type: "text",
            value: "Prodotto idratato",
          },
        },
      },
    ],
    classifications: [],
    variants: [
      {
        id: "variant-hydration-contract",
        sku: null,
        price: {
          unit_price: { amount: 1250, currency: "eur" },
          compare_at: null,
          tax_mode: "exclusive",
          min_quantity: 1,
          max_quantity: null,
          priced_at: 1,
        },
        purchase_allowed: true,
        attributes: [],
        reference_labels: {},
        fulfillment: { type: "none" },
        tax_category_id: null,
        status: { type: "active" },
        product_id: "product-hydration-contract",
      },
    ],
    status: { type: "active" },
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
    if (call.url.endsWith("/carts")) return jsonResponse({ cart, recovery_token: "cart-recovery-token" });
    if (call.url === `${apiUrl}/v1/storefront`) return jsonResponse(setup);
    if (new URL(call.url).pathname.endsWith("/products/product-hydration-contract")) {
      const { variants, status, created_at, updated_at, ...card } = product;
      return jsonResponse({ ...card, name_block_id: "product-name", price: variants[0].price, purchase_allowed: true });
    }
    if (new URL(call.url).pathname.endsWith("/products/product-hydration-contract/variants/variant-hydration-contract")) {
      return jsonResponse(product.variants[0]);
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
      `${apiUrl}/v1/storefront/carts`,
      `${apiUrl}/v1/storefront`,
      `${apiUrl}/v1/storefront/products/product-hydration-contract?include_price=true`,
      `${apiUrl}/v1/storefront/products/product-hydration-contract/variants/variant-hydration-contract?include_price=true`,
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
      shipping_profile_id: null,
      price: {
        unit_price: { amount: 1250, currency: "eur" },
        compare_at: null,
        tax_mode: "exclusive",
        min_quantity: 1,
        max_quantity: null,
        priced_at: 1,
      },
      quantity: 1,
      form_submission_id: "form-submission-hydration-contract",
      added_at: 0,
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
    if (call.url.endsWith("/customer/identify"))
      return jsonResponse(identifyResponse());
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
    const presentation = await store.forms.get({ key: "contact-form" });
    const result = await store.forms.submitByKey({ id: "submission-contact",
      key: "contact-form",
      presentation,
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
      ["POST", `${apiUrl}/v1/storefront/customer/identify`],
      ["POST", `${apiUrl}/v1/storefront/forms/form-contact/submissions`],
    ],
  );
  assert.equal(calls[0].headers.get("authorization"), null);
  assert.equal(calls[2].headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.equal(calls[2].headers.get("x-arky-locale"), "it");
  assert.equal(calls[2].headers.get("x-arky-market"), "ita");
  assert.deepEqual(calls[1].body, {});
  assert.deepEqual(calls[2].body, {
    id: "submission-contact",
    presentation_digest: "a".repeat(64),
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
  assert.deepEqual([...storage.values.values()], [storedVisitorSession()]);
});

test("submitByKey validates the displayed schema before identifying or submitting", async () => {
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
    const presentation = await store.forms.get({ key: "contact-form" });
    await assert.rejects(
      store.forms.submitByKey({ id: "submission-contact",
        key: "contact-form",
        presentation,
        values: { name: "Jane", unknown: "no" },
      }),
      /not defined by the form schema/,
    );
    await assert.rejects(
      store.forms.submitByKey({ id: "submission-contact", key: "contact-form", presentation, values: {} }),
      /required value is missing/,
    );
    await assert.rejects(
      store.forms.submitByKey({ id: "submission-contact",
        key: "contact-form",
        presentation,
        values: { name: 42 },
      }),
      /expected text/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 1);
  assert.equal(
    calls.every((call) => call.method === "GET"),
    true,
  );
  assert.equal(storage.values.size, 0);
});

test("email identity attachment remains an explicit first-visit identify operation", async () => {
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
    assert.equal("identifyEmailIfMissing" in store.customer, false);
    const result = await store.customer.identify({
      email: "person@example.com",
    });
    assert.equal(result.customer.identities[0].email, "person@example.com");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].body, { email: "person@example.com" });
  assert.equal(calls[0].url, `${apiUrl}/v1/storefront/customer/identify`);
});

test("a page reload reuses the stored Visitor without identifying again", async () => {
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
    if (request.url.endsWith("/customer/identify") && !request.authorization) {
      return jsonResponse(identifyResponse());
    }
    if (request.url.endsWith("/carts") || request.url.endsWith("/carts/cart-reload-contract")) {
      const cart = {
        id: "cart-reload-contract",
        store_id: "store-form-contract",
        customer_id: "customer-form-contract",
        company: null,
        sales_channel_id: "channel-form-contract",
        status: { type: "active" },
        origin: {
          type: "storefront",
          customer_id: "customer-form-contract",
          customer_session_id: "visitor-session-form-contract",
        },
        market_id: "market-ita",
        line_items: [],
        delivery_groups: [],
        billing_address: null,
        promotion_code_ids: [],
        purchase_order_number: null,
        item_count: 0,
        last_action_at: 1,
        abandoned_at: null,
        created_at: 1,
        updated_at: 1,
      };
      return jsonResponse(request.url.endsWith("/carts") ? { cart, recovery_token: "cart-recovery-token" } : cart);
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
      ["/v1/storefront/customer/identify", null, {}],
      ["/v1/storefront/carts", `Bearer ${visitorToken}`, {}],
      ["/v1/storefront/carts/cart-reload-contract", `Bearer ${visitorToken}`, null],
    ],
  );
  const stored = JSON.parse([...storage.values.values()][0]);
  assert.equal(stored.version, 2);
  assert.equal(stored.session.token, visitorToken);
});

test("raw form submission remains stateful and keeps only caller form fields", async () => {
  const storage = memoryStorage();
  const store = initialize(publishableKey, {
    apiUrl,
    locale: "it",
    sessionStorage: storage.adapter,
  });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), body: JSON.parse(String(init.body)) });
    if (String(url).endsWith("/customer/identify")) {
      return jsonResponse(identifyResponse());
    }
    return jsonResponse({
      id: "submission-raw",
      ...JSON.parse(String(init.body)),
    });
  };

  try {
    await store.forms.submit({
      id: "submission-raw", locale: "it", presentation_digest: "b".repeat(64),
      form_id: "form-raw",
      fields: [
        { id: "field-raw", key: "message", type: "text", value: "Hello" },
      ],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map((call) => call.url),
    [
      `${apiUrl}/v1/storefront/customer/identify`,
      `${apiUrl}/v1/storefront/forms/form-raw/submissions`,
    ],
  );
  assert.deepEqual(calls[1].body, {
    id: "submission-raw", presentation_digest: "b".repeat(64),
    form_id: "form-raw",
    fields: [{ id: "field-raw", key: "message", type: "text", value: "Hello" }],
  });
});
