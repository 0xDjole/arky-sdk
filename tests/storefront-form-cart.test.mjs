import assert from "node:assert/strict";
import test from "node:test";

import { initialize } from "../dist/storefront.js";
import {
  SessionStorage,
  apiUrl,
  cartRecord,
  customerRecord,
  ids,
  publishableKey,
  recordFetch,
  sessionResult,
  visitorSession,
  visitorStorage,
  visitorToken,
} from "./helpers/arky-fixtures.mjs";

const personal = { type: "personal" };

const contactForm = {
  id: ids.form,
  store_id: ids.store,
  key: "contact-form",
  questions: [
    { id: "q-name", key: "name", type: "text", required: true, label: { type: "shown", text: { it: "Nome" } }, min_length: null, max_length: null, pattern: null },
    { id: "q-age", key: "age", type: "number", required: false, label: { type: "hidden" }, min: null, max: null },
    { id: "q-member", key: "member", type: "boolean", required: false, label: { type: "hidden" } },
    { id: "q-location", key: "location", type: "geo_location", required: false, label: { type: "hidden" } },
    { id: "q-note", key: "note", type: "text", required: false, label: { type: "hidden" }, min_length: null, max_length: null, pattern: null },
    { id: "q-topics", key: "topics", type: "select_many", required: false, label: { type: "hidden" }, options: [{ key: "sales", label: { it: "Vendite" } }] },
  ],
  stages: [{ id: "new", key: "new" }],
  status: { type: "active" },
  created_at: 1,
  updated_at: 1,
};

function storedSessionOf(storage) {
  const [key] = storage.keys("arky_customer_session:v3:");
  return key ? JSON.parse(storage.getItem(key)) : null;
}

function submissionOf(call) {
  assert.ok(call.body instanceof FormData);
  return JSON.parse(call.body.get("submission"));
}

test("the store loads its setup and confirms the selected market before it exposes currency and payment options", async (context) => {
  const setupRecord = { name: "Bottega", timezone: "Europe/Rome", languages: ["it", "en"], payment_options: [] };
  const market = { id: ids.market, key: "ita", currency: "eur", tax_mode: "exclusive", payment_option_ids: [ids.paymentOption] };
  let marketKey = "ita";
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront") return setupRecord;
    if (call.path === "/v1/storefront/markets/by-key/ita") return { ...market, key: marketKey };
    throw new Error(`Unexpected setup request: ${call.method} ${call.path}`);
  });
  const store = initialize(publishableKey, { apiUrl, market: "ita", locale: "it", sessionStorage: visitorStorage() });
  assert.deepEqual(await store.store.load(), setupRecord);
  assert.deepEqual(store.market.get(), market);
  assert.equal(store.currency.get(), "eur");
  assert.deepEqual(store.allowed_payment_option_ids.get(), [ids.paymentOption]);
  assert.deepEqual(store.setup.get(), setupRecord);
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["GET", "/v1/storefront"],
    ["GET", "/v1/storefront/markets/by-key/ita"],
  ]);
  for (const call of calls) {
    assert.equal(call.headers.get("x-arky-market"), "ita");
    assert.equal(call.headers.get("x-arky-locale"), "it");
    assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
  }
  marketKey = "deu";
  const other = initialize(publishableKey, { apiUrl, market: "ita", sessionStorage: visitorStorage() });
  await assert.rejects(other.store.load(), /didn't confirm the selected key/);
  assert.equal(other.market.get(), null);
  assert.equal(other.currency.get(), null);
  assert.equal(other.setup.get(), null);
});

test("a fresh visitor's first cart load identifies once and reads no cart, and a create then selects the new cart", async (context) => {
  const storage = new SessionStorage();
  const line = { type: "product", id: ids.line, product_id: ids.product, variant_id: ids.variant, quantity: 2, form_submission_id: ids.submission, price_override: null, purchase: { type: "catalog" } };
  const cart = cartRecord({ line_items: [line] });
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/identify") return sessionResult();
    if (call.method === "POST" && call.path === "/v1/storefront/carts") return { type: "created", cart, recovery_token: "cart-recovery-token" };
    if (call.method === "GET" && call.path === `/v1/storefront/carts/${ids.cart}`) return cart;
    throw new Error(`Unexpected cart request: ${call.method} ${call.path}`);
  });
  const firstPage = initialize(publishableKey, { apiUrl, market: "ita", salesChannel: "web", sessionStorage: storage });
  assert.equal(await firstPage.eshop.cart.load({ buyer: personal, catalog_id: ids.catalog }), null);
  assert.equal(firstPage.eshop.cart.status.get().error, null);
  assert.equal(firstPage.hasSession, true);
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [["POST", "/v1/storefront/customer/identify"]]);
  assert.equal((await firstPage.eshop.cart.create({ id: ids.cart, buyer: personal, catalog_id: ids.catalog })).id, ids.cart);
  const { type: _type, ...productItem } = line;
  assert.deepEqual(firstPage.eshop.cart.product_items.get(), [productItem]);
  assert.equal(firstPage.eshop.cart.item_count.get(), 2);

  const reloaded = initialize(publishableKey, { apiUrl, market: "ita", salesChannel: "web", sessionStorage: storage });
  assert.equal(reloaded.hasSession, true);
  assert.equal((await reloaded.eshop.cart.load({ buyer: personal, catalog_id: ids.catalog })).id, ids.cart);
  assert.deepEqual(reloaded.eshop.cart.cart.get(), cart);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", "/v1/storefront/customer/identify", {}],
    ["POST", "/v1/storefront/carts", { id: ids.cart, buyer: personal, catalog_id: ids.catalog }],
    ["GET", `/v1/storefront/carts/${ids.cart}`, null],
  ]);
  assert.equal(calls[0].headers.get("authorization"), null);
  assert.equal(calls[1].headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.equal(calls[2].headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.equal(calls[2].headers.get("x-arky-cart-token"), "cart-recovery-token");
  for (const call of calls) {
    assert.equal(call.headers.get("x-arky-market"), "ita");
    assert.equal(call.headers.get("x-arky-sales-channel"), "web");
  }
  const stored = storedSessionOf(storage);
  assert.equal(stored.version, 3);
  assert.equal(stored.session.token, visitorToken);
});

test("a cart operation that starts with a session still refuses when the store context changes underneath it", async (context) => {
  let releaseRead;
  const reading = new Promise((resolve) => {
    releaseRead = resolve;
  });
  recordFetch(context, async (call) => {
    if (call.method === "POST" && call.path === "/v1/storefront/carts") return { type: "created", cart: cartRecord(), recovery_token: "cart-recovery-token" };
    if (call.method === "GET" && call.path === `/v1/storefront/carts/${ids.cart}`) {
      await reading;
      return cartRecord();
    }
    throw new Error(`Unexpected cart request: ${call.method} ${call.path}`);
  });
  const store = initialize(publishableKey, { apiUrl, sessionStorage: visitorStorage() });
  await store.eshop.cart.create({ id: ids.cart, buyer: personal, catalog_id: ids.catalog });
  const loading = store.eshop.cart.load({ buyer: personal, catalog_id: ids.catalog });
  await new Promise((resolve) => setImmediate(resolve));
  store.setContext({ market: "deu" });
  releaseRead();
  await assert.rejects(loading, /changed during the cart operation/);
  assert.equal(store.eshop.cart.cart.get(), null);
});

test("submitByKey reads the form anonymously, identifies lazily and submits only given answers as multipart with no store routing", async (context) => {
  const storage = new SessionStorage();
  const store = initialize(publishableKey, { apiUrl, locale: "it", market: "ita", sessionStorage: storage });
  const calls = recordFetch(context, (call) => {
    if (call.method === "GET" && call.path === "/v1/storefront/forms/contact-form") return contactForm;
    if (call.path === "/v1/storefront/customer/identify") return sessionResult();
    if (call.path === `/v1/storefront/forms/${ids.form}/submissions`) {
      return { id: ids.submission, form_id: ids.form, language: "it", answers: submissionOf(call).answers, stage_id: "new", created_at: 2, updated_at: 2 };
    }
    throw new Error(`Unexpected form request: ${call.method} ${call.path}`);
  });
  const form = await store.forms.get({ key: "contact-form" });
  assert.equal(store.forms.state.get().forms[`key:contact-form`], form);
  assert.equal(store.forms.state.get().forms[`id:${ids.form}`], form);
  const result = await store.forms.submitByKey({
    id: ids.submission,
    key: "contact-form",
    form,
    language: "it",
    values: { name: "Jane", age: 32, member: false, location: { lat: 43.8563, lon: 18.4131 }, note: "   ", topics: [] },
  });
  assert.equal(result.stage_id, "new");
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["GET", "/v1/storefront/forms/contact-form"],
    ["POST", "/v1/storefront/customer/identify"],
    ["POST", `/v1/storefront/forms/${ids.form}/submissions`],
  ]);
  assert.equal(calls[0].headers.get("authorization"), null);
  assert.equal(calls[2].headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.equal(calls[2].headers.get("x-arky-locale"), "it");
  assert.equal(calls[2].headers.get("x-arky-market"), "ita");
  assert.equal(calls[2].headers.get("content-type"), null);
  assert.deepEqual(calls[1].body, {});
  assert.deepEqual(submissionOf(calls[2]), {
    id: ids.submission,
    language: "it",
    answers: [
      { question_id: "q-name", key: "name", type: "text", value: "Jane" },
      { question_id: "q-age", key: "age", type: "number", value: 32 },
      { question_id: "q-member", key: "member", type: "boolean", value: false },
      { question_id: "q-location", key: "location", type: "geo_location", value: { lat: 43.8563, lon: 18.4131 } },
    ],
  });
  assert.deepEqual([...calls[2].body.keys()], ["submission"]);
  assert.equal(calls.some((call) => call.href.includes("store_id")), false);
  assert.equal(storedSessionOf(storage).version, 3);
});

test("submitByKey checks the shown form before identifying or submitting, and a whitespace-only required answer is missing", async (context) => {
  const storage = new SessionStorage();
  const store = initialize(publishableKey, { apiUrl, sessionStorage: storage });
  const calls = recordFetch(context, (call) => {
    if (call.method === "GET") return contactForm;
    throw new Error(`Validation must not issue ${call.method} ${call.path}`);
  });
  const form = await store.forms.get({ id: ids.form });
  const request = { id: ids.submission, key: "contact-form", form, language: "it" };
  await assert.rejects(async () => store.forms.submitByKey({ ...request, values: { name: "Jane", unknown: "no" } }), /'unknown' isn't part of the form/);
  await assert.rejects(async () => store.forms.submitByKey({ ...request, values: {} }), /'name': an answer is required/);
  await assert.rejects(async () => store.forms.submitByKey({ ...request, values: { name: "   " } }), /'name': an answer is required/);
  await assert.rejects(async () => store.forms.submitByKey({ ...request, values: { name: 42 } }), /'name': expected text/);
  await assert.rejects(async () => store.forms.submitByKey({ ...request, values: { name: "Jane", topics: ["sales", "sales"] } }), /'topics': contains an unknown or repeated option/);
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [["GET", `/v1/storefront/forms/${ids.form}`]]);
  assert.equal(storedSessionOf(storage), null);
  assert.equal(store.hasSession, false);
});

test("a raw storefront submission stays stateful and sends only the id, the language and the given answers", async (context) => {
  const storage = new SessionStorage();
  const store = initialize(publishableKey, { apiUrl, locale: "it", sessionStorage: storage });
  const calls = recordFetch(context, (call) => call.path === "/v1/storefront/customer/identify"
    ? sessionResult()
    : { id: ids.submission, form_id: ids.form, language: "it", answers: [], stage_id: "new", created_at: 2, updated_at: 2 });
  await store.forms.submit({
    form_id: ids.form,
    id: ids.submission,
    language: "it",
    answers: [
      { type: "text", question_id: "q-name", key: "name", value: "Hello" },
      { type: "text", question_id: "q-note", key: "note", value: "  " },
      { type: "select_many", question_id: "q-topics", key: "topics", option_keys: [] },
      { type: "file", question_id: "q-files", key: "files", files: [] },
    ],
  });
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["POST", "/v1/storefront/customer/identify"],
    ["POST", `/v1/storefront/forms/${ids.form}/submissions`],
  ]);
  assert.deepEqual(submissionOf(calls[1]), {
    id: ids.submission,
    language: "it",
    answers: [{ type: "text", question_id: "q-name", key: "name", value: "Hello" }],
  });
  await assert.rejects(async () => store.forms.submit({ form_id: ids.form, id: "submission-raw", language: "it", answers: [] }), TypeError);
  assert.equal(calls.length, 2);
});

test("an email reaches the Server only through an explicit identify call", async (context) => {
  const storage = new SessionStorage();
  const store = initialize(publishableKey, { apiUrl, sessionStorage: storage });
  const customer = customerRecord(ids.customer, { email: { type: "contact", email: "person@example.com" } });
  const calls = recordFetch(context, () => ({ customer, session: visitorSession() }));
  assert.equal("identifyEmailIfMissing" in store.customer, false);
  assert.equal("captureEmail" in store.customer, false);
  const result = await store.customer.identify({ email: "person@example.com" });
  assert.deepEqual(result.customer.email, { type: "contact", email: "person@example.com" });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", "/v1/storefront/customer/identify", { email: "person@example.com" }],
  ]);
  assert.deepEqual(storedSessionOf(storage).customer.email, { type: "contact", email: "person@example.com" });
});
