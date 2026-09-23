import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { initialize } from "../dist/storefront.js";
import { storefrontSessionStorage } from "./helpers/storefront-session-storage.mjs";

test("Form discovery preserves native filters, nullable continuations and separate exact batches", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? "form:+/=" : null }),
      { headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://forms.test", storeId: "store" }).forms;
  const filters = { key: "intake", query: "intake", status: "archived", limit: 0, sort_field: "key",
    sort_direction: "asc", created_at_from: 0, created_at_to: 3 };
  const page = await api.find(filters);
  assert.equal(page.cursor, "form:+/=");
  await api.find({ ...filters, cursor: page.cursor });
  await api.findByIds({ ids: ["form"] });
  for (const call of calls.slice(0, 2)) {
    assert.equal(call.url.pathname, "/v1/stores/store/forms"); assert.equal(call.method, "GET");
    assert.equal(call.body, undefined);
    for (const [key, value] of Object.entries(filters)) assert.equal(call.url.searchParams.get(key), String(value));
  }
  assert.equal(calls[1].url.searchParams.get("cursor"), page.cursor);
  assert.deepEqual([...calls[2].url.searchParams.keys()], ["ids"]);
  assert.deepEqual(JSON.parse(calls[2].url.searchParams.get("ids")), ["form"]);
});

test("Form writes and Submission discovery match retained backend contracts", async (context) => {
  const calls = [];
  const submission = { id: "submission", store_id: "store", form_id: "form", customer_id: "customer",
    customer_session_id: "original-session", authentication: { type: "visitor" },
    snapshot: { form_key: "original_name", questions: [] }, fields: [], created_at: 1 };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    const response = init.method === "DELETE" ? true : init.method === "PUT" ? { status: { type: "archived" } } : { items: [submission], cursor: null };
    return new Response(JSON.stringify(response), { headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://forms.test", storeId: "store" }).forms;
  assert.equal("submit" in api, false);
  assert.equal("updateSubmission" in api, false);
  const result = await api.getSubmissions({ form_ids: ["form"], customer_id: "customer", query: "answer",
    sort_field: "created_at", sort_direction: "asc", limit: 1, created_at_from: 0, cursor: "sub:+/=" });
  assert.deepEqual(result, { items: [submission], cursor: null });
  assert.deepEqual(JSON.parse(calls[0].url.searchParams.get("form_ids")), ["form"]);
  assert.equal(calls[0].url.searchParams.get("customer_id"), "customer");
  assert.equal(calls[0].url.searchParams.get("cursor"), "sub:+/=");
  assert.equal(calls[0].url.searchParams.get("created_at_from"), "0");
  assert.deepEqual((await api.update({ id: "form", status: { type: "archived" } })).status, { type: "archived" });
  assert.deepEqual(calls[1].body, { id: "form", status: { type: "archived" } });
  assert.equal(await api.delete({ id: "form" }), true);
});

test("Form submitByKey retains the displayed presentation and caller request identity across response loss", async (context) => {
  const calls = [];
  const presentation = { id: "form", key: "intake", locale: "en", presentation_digest: "a".repeat(64),
    schema: [{ id: "field", key: "answer", type: "text", required: true, question: null }] };
  const session = JSON.stringify({ version: 2, customer: { id: "customer", created_at: 1, updated_at: 1 },
    session: { id: "session", type: "visitor", token: "customer_visitor_" + "a".repeat(64),
      customer_id: "customer", status: { type: "active" }, expires_at: 10_000 } });
  const store = initialize("arky_pk_" + "f".repeat(42) + "A", { apiUrl: "https://forms.test", market: "us",
    locale: "en", sessionStorage: storefrontSessionStorage(session) });
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : undefined,
      headers: new Headers(init.headers) });
    if (init.method === "GET") return new Response(JSON.stringify(presentation), { headers: { "content-type": "application/json" } });
    if (calls.length === 2) throw new TypeError("response lost");
    return new Response(JSON.stringify({ id: "request", snapshot: { form_key: "intake", questions: [] } }),
      { headers: { "content-type": "application/json" } });
  });
  const request = { id: "request", key: "intake", values: { answer: "kept" } };
  await assert.rejects(store.forms.submitByKey(request), /Load the Form presentation/);
  assert.equal(calls.length, 0);
  await store.forms.get({ key: "intake" });
  await assert.rejects(store.forms.submitByKey(request), /response lost|fetch|network/i);
  await store.forms.submitByKey(request);
  assert.equal(calls.filter((call) => call.method === "GET").length, 1);
  assert.deepEqual(calls[1].body, calls[2].body);
  assert.deepEqual(calls[2].body, { id: "request", form_id: "form", presentation_digest: presentation.presentation_digest,
    fields: [{ id: "field", key: "answer", type: "text", value: "kept" }] });
  assert.equal(calls[2].headers.get("x-arky-locale"), "en");
  store.setContext({ locale: "bs" });
  await assert.rejects(store.forms.submitByKey(request), /presentation locale differs/);
  assert.equal(calls.length, 3);
});
