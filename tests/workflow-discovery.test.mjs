import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

test("Execution history preserves native ID/status filters, empty continuation and tagged detail", async (context) => {
  const calls = [];
  const item = { id: "execution", workflow_id: "workflow", status: { type: "completed" }, scheduled_at: 0, started_at: 1, completed_at: 2 };
  const detail = { ...item, store_id: "store", graph: { nodes: {}, edges: [] }, input: { type: "webhook", payload: { private: true } }, results: {}, error: null, created_at: 0, updated_at: 2 };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    const value = calls.length === 1 ? { items: [], cursor: "opaque:+/=" }
      : calls.length === 2 ? { items: [item], cursor: null } : detail;
    return new Response(JSON.stringify(value), { status: 200, headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://workflow-contract.test", storeId: "store" }).workflow;
  const filters = { workflow_id: "workflow", query: "execution", status: "completed", limit: 1, sort_field: "updated_at", sort_direction: "asc" };
  const first = await api.getExecutions(filters);
  assert.deepEqual(first, { items: [], cursor: "opaque:+/=" });
  assert.deepEqual(await api.getExecutions({ ...filters, cursor: first.cursor }), { items: [item], cursor: null });
  assert.deepEqual(await api.getExecution({ workflow_id: "workflow", execution_id: "execution" }), detail);
  assert.equal(calls.length, 3);
  assert.ok(calls.every((call) => call.method === "GET" && call.body === undefined));
  assert.equal(calls[0].url.pathname, "/v1/stores/store/workflows/workflow/executions");
  for (const [key, value] of Object.entries(filters).filter(([key]) => key !== "workflow_id")) {
    assert.equal(calls[0].url.searchParams.get(key), String(value));
    assert.equal(calls[1].url.searchParams.get(key), String(value));
  }
  assert.equal(calls[1].url.searchParams.get("cursor"), first.cursor);
  assert.equal(calls[2].url.pathname, "/v1/stores/store/workflows/workflow/executions/execution");
  assert.equal(calls[2].url.search, "");
});

test("Workflow connections page public tagged status and read a saved selection by exact identity", async (context) => {
  const calls = [];
  const connection = {
    id: "connection", store_id: "store", created_at: 0, updated_at: 1,
    data: { type: "google_drive", account: { external_account_id: "account", display_name: "Drive", email: "drive@arky.test" },
      authorization_status: { type: "reauthorization_required", detected_at: 1 } },
  };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    const value = calls.length === 1 ? { items: [], cursor: "opaque:+/=" }
      : calls.length === 2 ? { items: [connection], cursor: null } : connection;
    return new Response(JSON.stringify(value), { status: 200, headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://workflow-contract.test", storeId: "store" }).workflow;
  const filters = { query: "Drive", type: "google_drive", status: "reauthorization_required", limit: 1, sort_field: "updated_at", sort_direction: "asc" };
  const first = await api.listConnections(filters);
  assert.deepEqual(first, { items: [], cursor: "opaque:+/=" });
  assert.deepEqual(await api.listConnections({ ...filters, cursor: first.cursor }), { items: [connection], cursor: null });
  assert.deepEqual(await api.getConnection({ id: "connection" }), connection);
  await api.getConnection({ store_id: "other-store", id: "escaped/identity" });
  assert.equal(calls.length, 4);
  assert.ok(calls.every((call) => call.method === "GET" && call.body === undefined));
  assert.equal(calls[0].url.pathname, "/v1/stores/store/workflow-connections");
  for (const [key, value] of Object.entries(filters)) {
    assert.equal(calls[0].url.searchParams.get(key), String(value));
    assert.equal(calls[1].url.searchParams.get(key), String(value));
  }
  assert.equal(calls[1].url.searchParams.get("cursor"), first.cursor);
  assert.equal(calls[2].url.pathname, "/v1/stores/store/workflow-connections/connection");
  assert.equal(calls[2].url.search, "");
  assert.equal(calls[3].url.pathname, "/v1/stores/other-store/workflow-connections/escaped%2Fidentity");
});

test("Workflow discovery preserves scoped filters and empty continuation; exact key reads never search or execute", async (context) => {
  const calls = [];
  const workflow = {
    id: "workflow", store_id: "store", key: "demo_workflow", status: { type: "active" }, schedule: null,
    created_at: 0, updated_at: 1, graph: { nodes: {}, edges: [] }, webhook_url: "/v1/workflows/webhooks/private",
  };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    const value = calls.length === 1 ? { items: [], cursor: "opaque:+/=" }
      : calls.length === 2 ? { items: [workflow], cursor: null } : workflow;
    return new Response(JSON.stringify(value), { status: 200, headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://workflow-contract.test", storeId: "store" }).workflow;
  const filters = { query: "demo", status: "active", sort_field: "created_at", sort_direction: "asc", created_at_from: -5, created_at_to: 0, limit: 1 };
  const first = await api.find(filters);
  assert.deepEqual(first, { items: [], cursor: "opaque:+/=" });
  assert.deepEqual(await api.find({ ...filters, cursor: first.cursor }), { items: [workflow], cursor: null });
  assert.deepEqual(await api.get({ id: "store:demo_workflow" }), workflow);
  await api.get({ store_id: "other-store", id: "other-store:demo_workflow" });
  assert.equal(calls.length, 4);
  assert.ok(calls.every((call) => call.method === "GET" && call.body === undefined));
  assert.equal(calls[0].url.pathname, "/v1/stores/store/workflows");
  for (const [key, value] of Object.entries(filters)) {
    assert.equal(calls[0].url.searchParams.get(key), String(value));
    assert.equal(calls[1].url.searchParams.get(key), String(value));
  }
  assert.equal(calls[1].url.searchParams.get("cursor"), first.cursor);
  assert.equal(decodeURIComponent(calls[2].url.pathname), "/v1/stores/store/workflows/store:demo_workflow");
  assert.equal(calls[2].url.search, "");
  assert.equal(decodeURIComponent(calls[3].url.pathname), "/v1/stores/other-store/workflows/other-store:demo_workflow");
});

test("Workflow key ordering transports the complete bounded opaque continuation", async (context) => {
  const cursor = "+/a=".repeat(512);
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url) => {
    calls.push(new URL(url));
    return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? cursor : null }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  });
  const api = createAdmin({ baseUrl: "https://workflow-contract.test", storeId: "store" }).workflow;
  const first = await api.find({ sort_field: "key", sort_direction: "desc", limit: 1 });
  assert.equal(first.cursor, cursor);
  assert.deepEqual(await api.find({ sort_field: "key", sort_direction: "desc", limit: 1, cursor: first.cursor }), {
    items: [], cursor: null,
  });
  assert.equal(calls[1].searchParams.get("cursor"), cursor);
  assert.equal(calls[1].searchParams.get("sort_field"), "key");
  assert.equal(calls[1].searchParams.get("sort_direction"), "desc");
});
