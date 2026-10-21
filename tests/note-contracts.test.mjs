import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";

const baseUrl = "https://api.notes.test";
const storeId = "6f2d8b14-3a95-4c07-b1e6-9d4a7c2e5f38";
const recordId = "b7e3c9a2-5d18-4f64-8a0b-2c6e9f1d3a57";
const noteId = "1d9f4b62-8c37-4e05-a2b9-6f3e0c7a5d14";

function capture(context, body) {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ method: init.method ?? "GET", path: parsed.pathname, query: Object.fromEntries(parsed.searchParams), body: init.body ? JSON.parse(String(init.body)) : null });
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  return calls;
}

function note(target) {
  return { id: noteId, store_id: storeId, target, body: "Called back", actor: { account_id: "account", snapshot: { email: "staff@example.test", credential_type: "session" } }, created_at: 1, updated_at: 2 };
}

for (const [label, owner, key, segment, target] of [
  ["order", (admin) => admin.eshop.order.notes, "order_id", "orders", { type: "order", order_id: recordId }],
  ["customer", (admin) => admin.customers.notes, "customer_id", "customers", { type: "customer", customer_id: recordId }],
  ["company", (admin) => admin.companies.notes, "company_id", "companies", { type: "company", company_id: recordId }],
]) {
  test(`${label} notes list, write, edit and delete through the record's notes route`, async (context) => {
    const saved = note(target);
    const calls = capture(context, saved);
    const api = owner(createAdmin({ apiUrl: baseUrl, secretKey: "arky_api_notes" }));
    const scope = { store_id: storeId, [key]: recordId };
    await api.find({ ...scope, limit: 20, cursor: "next" });
    assert.deepEqual(await api.create({ ...scope, id: noteId, body: "Called back" }), saved);
    await api.update({ ...scope, id: noteId, expected_updated_at: 2, body: "Called back twice" });
    await api.delete({ ...scope, id: noteId, expected_updated_at: 3 });
    const base = `/v1/stores/${storeId}/${segment}/${recordId}/notes`;
    assert.deepEqual(calls, [
      { method: "GET", path: base, query: { limit: "20", cursor: "next" }, body: null },
      { method: "POST", path: base, query: {}, body: { id: noteId, body: "Called back" } },
      { method: "PUT", path: `${base}/${noteId}`, query: {}, body: { expected_updated_at: 2, body: "Called back twice" } },
      { method: "DELETE", path: `${base}/${noteId}`, query: { expected_updated_at: "3" }, body: null },
    ]);
    await assert.rejects(async () => api.find({ ...scope, store_id: "store" }), TypeError);
    assert.equal(calls.length, 4);
  });
}

test("submission and conversation notes are Note records, and a stage change carries its note", async (context) => {
  const formId = "a4c7e1b9-2d58-4f36-8b0e-5c9a3d7f1e62";
  const conversationId = "7c2e9a41-5b3d-4f86-a1e0-3d4c2b9f6e18";
  const calls = capture(context, note({ type: "form_submission", form_submission_id: recordId }));
  const admin = createAdmin({ apiUrl: baseUrl, secretKey: "arky_api_notes" });
  const forms = admin.forms;
  const scope = { store_id: storeId, form_id: formId, form_submission_id: recordId };
  for (const removed of ["createSubmissionNote", "findSubmissionNotes", "updateSubmissionNote", "deleteSubmissionNote"]) assert.equal(removed in forms, false, removed);
  await forms.notes.create({ ...scope, id: noteId, body: "Called back" });
  await forms.notes.find({ ...scope, limit: 10 });
  await forms.notes.update({ ...scope, id: noteId, expected_updated_at: 2, body: "Called back twice" });
  await forms.notes.delete({ ...scope, id: noteId, expected_updated_at: 3 });
  await forms.changeSubmissionStage({ store_id: storeId, form_id: formId, id: recordId, to_stage_id: "rejected", expected_stage_id: "new", expected_changed_at: 4, note: { id: noteId, body: "Outside the delivery area" } });
  await forms.findSubmissions({ store_id: storeId, form_id: formId, limit: 5 });
  await admin.support.conversation.notes.create({ store_id: storeId, conversation_id: conversationId, id: noteId, body: "Handed to the team" });
  await admin.support.conversation.notes.find({ store_id: storeId, conversation_id: conversationId, limit: 5 });
  const submission = `/v1/stores/${storeId}/forms/${formId}/submissions/${recordId}`;
  assert.deepEqual(calls, [
    { method: "POST", path: `${submission}/notes`, query: {}, body: { id: noteId, body: "Called back" } },
    { method: "GET", path: `${submission}/notes`, query: { limit: "10" }, body: null },
    { method: "PUT", path: `${submission}/notes/${noteId}`, query: {}, body: { expected_updated_at: 2, body: "Called back twice" } },
    { method: "DELETE", path: `${submission}/notes/${noteId}`, query: { expected_updated_at: "3" }, body: null },
    { method: "POST", path: `${submission}/stage`, query: {}, body: { to_stage_id: "rejected", expected_stage_id: "new", expected_changed_at: 4, note: { id: noteId, body: "Outside the delivery area" } } },
    { method: "GET", path: `/v1/stores/${storeId}/forms/${formId}/submissions`, query: { limit: "5" }, body: null },
    { method: "POST", path: `/v1/stores/${storeId}/conversations/${conversationId}/notes`, query: {}, body: { id: noteId, body: "Handed to the team" } },
    { method: "GET", path: `/v1/stores/${storeId}/conversations/${conversationId}/notes`, query: { limit: "5" }, body: null },
  ]);
  await assert.rejects(async () => forms.notes.create({ ...scope, id: "note-1", body: "x" }), TypeError);
  assert.equal(calls.length, 8);
  for (const removed of ["setSubmissionCompany", "assignSubmission"]) assert.equal(removed in forms, false, removed);
});

test("notes are staff-only and absent from the storefront client", () => {
  const storefront = createStorefront(`arky_pk_${"n".repeat(42)}A`, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl: baseUrl });
  assert.equal("notes" in storefront.eshop.order, false);
  assert.equal("notes" in storefront.companies, false);
});
