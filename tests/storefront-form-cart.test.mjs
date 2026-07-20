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
