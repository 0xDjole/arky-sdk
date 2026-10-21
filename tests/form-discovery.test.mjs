import assert from "node:assert/strict";
import { File } from "node:buffer";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { initialize } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch, visitorStorage } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "a8c41e2f-6d95-4b07-83f1-0e5d7a9c2b36";
const FORM_ID = ids.form;
const SUBMISSION_ID = ids.submission;

function admin() {
  return createAdmin({ apiUrl: "https://forms.test", secretKey: "arky_api_forms" });
}

function submissionOf(call) {
  assert.ok(call.body instanceof FormData, "form submissions are multipart");
  return JSON.parse(call.body.get("submission"));
}

const intake = {
  id: FORM_ID,
  store_id: STORE_ID,
  key: "intake",
  questions: [
    { id: "q-answer", key: "answer", type: "text", required: true, label: { type: "shown", text: { en: "Answer" } }, min_length: null, max_length: null, pattern: null },
    { id: "q-topic", key: "topic", type: "select_one", required: false, label: { type: "hidden" }, options: [{ key: "sales", label: { en: "Sales" } }] },
  ],
  stages: [{ id: "new", key: "new" }],
  status: { type: "active" },
  created_at: 1,
  updated_at: 1,
  questions_updated_at: 1,
};

test("Form discovery keeps native filters, nullable continuations and exact id batches", async (context) => {
  const calls = recordFetch(context, (_call, count) => ({ items: [], cursor: count === 1 ? "form:+/=" : null }));
  const api = admin().forms;
  const filters = { key: "intake", query: "intake", status: "closed", limit: 0, sort_field: "key", sort_direction: "asc", created_at_from: 0, created_at_to: 3 };
  const page = await api.find({ store_id: STORE_ID, ...filters });
  assert.equal(page.cursor, "form:+/=");
  await api.find({ store_id: STORE_ID, ...filters, cursor: page.cursor });
  await api.find({ store_id: STORE_ID, ids: [FORM_ID] });
  for (const call of calls.slice(0, 2)) {
    assert.equal(call.path, `/v1/stores/${STORE_ID}/forms`);
    assert.equal(call.method, "GET");
    assert.equal("store_id" in call.query, false);
    assert.equal(call.body, null);
    for (const [key, value] of Object.entries(filters)) assert.equal(call.query[key], String(value));
  }
  assert.equal(calls[1].query.cursor, page.cursor);
  assert.equal(calls[2].path, `/v1/stores/${STORE_ID}/forms`);
  assert.deepEqual(Object.keys(calls[2].query), ["ids"]);
  assert.deepEqual(JSON.parse(calls[2].query.ids), [FORM_ID]);
  for (const removed of ["findByIds", "getPresentation", "getSubmissions", "permanentlyDelete"]) assert.equal(removed in api, false, removed);
});

test("Form writes carry the app-picked id, typed questions and stages, and the version", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? { deleted: true } : intake);
  const api = admin().forms;
  const create = { id: FORM_ID, key: "intake", questions: intake.questions, stages: intake.stages };
  assert.deepEqual(await api.create({ store_id: STORE_ID, ...create }), intake);
  await api.update({ store_id: STORE_ID, id: FORM_ID, expected_updated_at: 1, status: { type: "closed" } });
  await api.get({ store_id: STORE_ID, id: FORM_ID });
  await api.getByKey({ store_id: STORE_ID, key: "intake/form" });
  assert.deepEqual(await api.delete({ store_id: STORE_ID, id: FORM_ID, expected_updated_at: 2 }), { deleted: true });
  assert.deepEqual(calls.map(({ method, path, url, body }) => [method, path, url.search, body]), [
    ["POST", `/v1/stores/${STORE_ID}/forms`, "", create],
    ["PUT", `/v1/stores/${STORE_ID}/forms/${FORM_ID}`, "", { expected_updated_at: 1, status: { type: "closed" } }],
    ["GET", `/v1/stores/${STORE_ID}/forms/${FORM_ID}`, "", null],
    ["GET", `/v1/stores/${STORE_ID}/forms/by-key/intake%2Fform`, "", null],
    ["DELETE", `/v1/stores/${STORE_ID}/forms/${FORM_ID}`, "?expected_updated_at=2", null],
  ]);
  await assert.rejects(async () => api.create({ store_id: STORE_ID, ...create, id: "intake" }), TypeError);
  assert.equal(calls.length, 5);
});

test("submission discovery reads every form or one form and sends the select filter as select, JSON-encoded", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  const api = admin().forms;
  const select = [{ question_id: "q-topic", option_keys: ["sales"] }];
  const filters = { form_ids: [FORM_ID], customer_id: ids.customer, stage_id: "new", select, query: "answer", sort_field: "created_at", sort_direction: "asc", limit: 1, created_at_from: 0, cursor: "sub:+/=" };
  await api.findSubmissions({ store_id: STORE_ID, ...filters });
  await api.findSubmissions({ store_id: STORE_ID, form_id: FORM_ID, select });
  assert.equal(calls[0].path, `/v1/stores/${STORE_ID}/forms/submissions`);
  assert.deepEqual(JSON.parse(calls[0].query.form_ids), [FORM_ID]);
  assert.deepEqual(JSON.parse(calls[0].query.select), select);
  assert.equal(calls[0].query.customer_id, ids.customer);
  assert.equal(calls[0].query.cursor, "sub:+/=");
  assert.equal(calls[0].query.created_at_from, "0");
  for (const removed of ["company_id", "assignee_account_id"]) assert.equal(removed in calls[0].query, false, removed);
  assert.equal(calls[1].path, `/v1/stores/${STORE_ID}/forms/${FORM_ID}/submissions`);
  assert.deepEqual(Object.keys(calls[1].query), ["select"]);
  assert.equal("form_id" in calls[1].query, false);
});

test("storefront submit with the loaded form keeps the caller's id and answers across response loss", async (context) => {
  let submissions = 0;
  const calls = recordFetch(context, () => {
    if (++submissions === 1) throw new TypeError("response lost");
    return { id: SUBMISSION_ID, form_id: FORM_ID, language: "en", answers: [], stage_id: "new", created_at: 2, updated_at: 2 };
  });
  const store = initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, locale: "en", sessionStorage: visitorStorage() });
  const request = { id: SUBMISSION_ID, form: intake, language: "en", values: { answer: "kept" } };
  await assert.rejects(store.forms.submit(request), /response lost/);
  const answer = await store.forms.submit(request);
  assert.equal(answer.stage_id, "new");
  assert.equal(calls.length, 2);
  assert.deepEqual(submissionOf(calls[0]), submissionOf(calls[1]));
  assert.deepEqual(submissionOf(calls[1]), {
    id: SUBMISSION_ID,
    questions_updated_at: intake.questions_updated_at,
    language: "en",
    answers: [{ question_id: "q-answer", key: "answer", type: "text", value: "kept" }],
  });
  assert.equal(calls[1].path, `/v1/storefront/forms/${FORM_ID}/submissions`);
  assert.equal(calls[1].headers.get("x-arky-locale"), "en");
  assert.equal(calls[1].headers.get("content-type"), null);
});

test("a submission against a form that changed since it loaded is refused as FORM_CHANGED without a hidden reload or resubmission", async (context) => {
  const calls = recordFetch(context, () => Response.json({ message: "The form changed; reload it", error: "FORM_SUBMISSION.FORM_CHANGED", status_code: 409, validation_errors: [] }, { status: 409 }));
  const store = initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, locale: "en", sessionStorage: visitorStorage() });
  const loaded = { ...intake, questions_updated_at: 7, updated_at: 8 };
  await assert.rejects(store.forms.submit({ id: SUBMISSION_ID, form: loaded, language: "en", values: { answer: "Kept" } }), (error) => {
    assert.equal(error.code, "FORM_SUBMISSION.FORM_CHANGED");
    assert.equal(error.statusCode, 409);
    return true;
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].path, `/v1/storefront/forms/${FORM_ID}/submissions`);
  assert.equal(submissionOf(calls[0]).questions_updated_at, 7);
});

test("a refused submission whose answers don't fit the form propagates its field errors without a resubmission", async (context) => {
  const calls = recordFetch(context, () => Response.json({ message: "The answers don't fit the form", error: "FORM_SUBMISSION.INVALID_INPUT", status_code: 400, validation_errors: [{ field: "answers[0].question_id", error: "FORM_SUBMISSION.UNKNOWN_QUESTION" }] }, { status: 400 }));
  const store = initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, locale: "en", sessionStorage: visitorStorage() });
  await assert.rejects(store.forms.submit({ id: SUBMISSION_ID, form: intake, language: "en", values: { answer: "Kept" } }), (error) => {
    assert.equal(error.code, "FORM_SUBMISSION.INVALID_INPUT");
    assert.equal(error.statusCode, 400);
    assert.deepEqual(error.validationErrors, [{ field: "answers[0].question_id", error: "FORM_SUBMISSION.UNKNOWN_QUESTION" }]);
    return true;
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "POST");
});

test("staff submission work uses exact stage, file, note and deletion routes and has no assignee or company link", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "GET" && call.path.endsWith("/notes")
    ? { items: [], cursor: null }
    : call.method === "DELETE" && call.path.endsWith(SUBMISSION_ID) ? { deleted: true } : { id: SUBMISSION_ID });
  const api = admin().forms;
  for (const removed of ["processSubmission", "assignSubmission", "setSubmissionCompany"]) assert.equal(removed in api, false, removed);
  const file = new File(["%PDF"], "brief.pdf", { type: "application/pdf" });
  await api.createSubmission({
    store_id: STORE_ID, form_id: FORM_ID, id: SUBMISSION_ID, customer_id: ids.customer, language: "en",
    answers: [
      { type: "text", question_id: "q-answer", key: "answer", value: "Called" },
      { type: "file", question_id: "q-files", key: "files", files: [file] },
    ],
  });
  const noteId = "9d1f3b5c-7e8a-4c2e-b4d6-8f0a2c4e6b7d";
  await api.changeSubmissionStage({ store_id: STORE_ID, form_id: FORM_ID, id: SUBMISSION_ID, expected_stage_id: "new", expected_changed_at: 5, to_stage_id: "won", note: { id: noteId, body: "Signed" } });
  await api.getSubmissionFile({ store_id: STORE_ID, form_id: FORM_ID, id: SUBMISSION_ID, sha256: "c".repeat(64) });
  await api.notes.create({ store_id: STORE_ID, form_id: FORM_ID, form_submission_id: SUBMISSION_ID, id: noteId, body: "Called back" });
  await api.notes.find({ store_id: STORE_ID, form_id: FORM_ID, form_submission_id: SUBMISSION_ID, limit: 20 });
  assert.deepEqual(await api.deleteSubmission({ store_id: STORE_ID, form_id: FORM_ID, id: SUBMISSION_ID, expected_updated_at: 7 }), { deleted: true });
  const base = `/v1/stores/${STORE_ID}/forms/${FORM_ID}/submissions`;
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [
    ["POST", base, {}],
    ["POST", `${base}/${SUBMISSION_ID}/stage`, {}],
    ["GET", `${base}/${SUBMISSION_ID}/files/${"c".repeat(64)}`, {}],
    ["POST", `${base}/${SUBMISSION_ID}/notes`, {}],
    ["GET", `${base}/${SUBMISSION_ID}/notes`, { limit: "20" }],
    ["DELETE", `${base}/${SUBMISSION_ID}`, { expected_updated_at: "7" }],
  ]);
  assert.deepEqual(submissionOf(calls[0]), {
    id: SUBMISSION_ID,
    customer_id: ids.customer,
    language: "en",
    answers: [
      { type: "text", question_id: "q-answer", key: "answer", value: "Called" },
      { type: "file", question_id: "q-files", key: "files", parts: ["file-0"] },
    ],
  });
  const part = calls[0].body.get("file-0");
  assert.equal(part.name, "brief.pdf");
  assert.equal(await part.text(), "%PDF");
  assert.deepEqual(calls[1].body, { expected_stage_id: "new", expected_changed_at: 5, to_stage_id: "won", note: { id: noteId, body: "Signed" } });
  assert.deepEqual(calls[3].body, { id: noteId, body: "Called back" });
  await assert.rejects(async () => api.changeSubmissionStage({ store_id: STORE_ID, form_id: FORM_ID, id: SUBMISSION_ID, expected_stage_id: "new", expected_changed_at: 5, to_stage_id: "won", note: { id: "note-1", body: "x" } }), TypeError);
  await assert.rejects(async () => api.createSubmission({ store_id: STORE_ID, form_id: FORM_ID, id: "submission-1", customer_id: ids.customer, language: "en", answers: [] }), TypeError);
  await assert.rejects(async () => api.notes.create({ store_id: STORE_ID, form_id: FORM_ID, form_submission_id: SUBMISSION_ID, id: "note-1", body: "x" }), TypeError);
  assert.equal(calls.length, 6);
});

test("form emails name the received, stage and new-submission alert selections and the alert recipients", async (context) => {
  const roleId = "5b7e2c94-1d38-4f60-a9e5-3c8d0f2b6a17";
  const selection = (email_template_id) => ({ email_template_id, sending_address_id: "4b6d8f0a-2e3a-4b7d-9f1c-3e5a7b9d1f2a", from_name: "Shop", reply_to: { type: "address", email_address_id: "8e0a2c4e-6b7d-4f9a-b1c3-5d7f9b1d3f5a" } });
  const emails = {
    received: selection("3a5c7e9b-1d2f-4a6c-8e0b-2d4f6a8c0e1f"),
    stage_changed: { won: selection("9c1e3a5b-7d2f-4b6a-8c0e-2a4c6e8a0b1d") },
    new_submission_alert: selection("1b3d5f7a-9c2e-4a6b-8d0f-2b4d6f8a0c1e"),
    alert_recipients: [{ type: "store_role", store_role_id: roleId, language: "en" }, { type: "email", email: "sales@example.test", language: "bs" }],
  };
  const calls = recordFetch(context, () => ({ ...intake, emails }));
  const api = admin().forms;
  const create = { id: FORM_ID, key: "intake", questions: intake.questions, stages: intake.stages, emails };
  assert.deepEqual((await api.create({ store_id: STORE_ID, ...create })).emails, emails);
  const silent = { received: null, stage_changed: {}, new_submission_alert: null, alert_recipients: [] };
  await api.update({ store_id: STORE_ID, id: FORM_ID, expected_updated_at: 1, emails: silent });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${STORE_ID}/forms`, create],
    ["PUT", `/v1/stores/${STORE_ID}/forms/${FORM_ID}`, { expected_updated_at: 1, emails: silent }],
  ]);
  for (const removed of ["alert", "staff_new_submission", "staff_recipients"]) assert.equal(removed in calls[0].body.emails, false, removed);
});

test("a staff submission read carries the email contact the Server derived from its email answer", async (context) => {
  const submission = {
    id: SUBMISSION_ID,
    form_id: FORM_ID,
    store_id: STORE_ID,
    customer_id: ids.customer,
    source: { type: "account", actor: { account_id: ids.account, snapshot: { email: "staff@example.test", credential_type: { type: "session" } } } },
    language: "bs",
    email_contact: { email: "buyer@example.test", language: "bs" },
    snapshot: { form_key: "intake", questions: [], options: [] },
    answers: [{ type: "email", question_id: "q-email", key: "email", value: "buyer@example.test" }],
    stage: { stage_id: "new", changed_at: 1 },
    stage_history: [],
    created_at: 1,
    updated_at: 1,
  };
  const calls = recordFetch(context, () => submission);
  const read = await admin().forms.getSubmission({ store_id: STORE_ID, form_id: FORM_ID, id: SUBMISSION_ID });
  assert.deepEqual(read.email_contact, { email: "buyer@example.test", language: "bs" });
  for (const removed of ["company_id", "assignee_account_id"]) assert.equal(removed in read, false, removed);
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [["GET", `/v1/stores/${STORE_ID}/forms/${FORM_ID}/submissions/${SUBMISSION_ID}`]]);
});

test("file answers are checked against the per-file, per-request and file-count limits before any upload", async (context) => {
  const calls = recordFetch(context, () => ({ id: SUBMISSION_ID }));
  const api = admin().forms;
  const answer = (files) => ({ store_id: STORE_ID, form_id: FORM_ID, id: SUBMISSION_ID, customer_id: ids.customer, language: "en", answers: [{ type: "file", question_id: "q", key: "files", files }] });
  await assert.rejects(async () => api.createSubmission(answer([new File([], "empty.pdf")])), /between 1 byte and 10 MiB/);
  await assert.rejects(async () => api.createSubmission(answer([new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.pdf")])), /between 1 byte and 10 MiB/);
  await assert.rejects(async () => api.createSubmission(answer(Array.from({ length: 21 }, (_, index) => new File(["x"], `f${index}.pdf`)))), /at most 20 files/);
  const nine = new Uint8Array(9 * 1024 * 1024);
  await assert.rejects(async () => api.createSubmission(answer(Array.from({ length: 6 }, (_, index) => new File([nine], `f${index}.pdf`)))), /50 MiB together/);
  assert.equal(calls.length, 0);
});

test("a staff submission leaves out whitespace-only text, empty choices and empty file lists, like the storefront", async (context) => {
  const calls = recordFetch(context, () => ({ id: SUBMISSION_ID }));
  await admin().forms.createSubmission({
    store_id: STORE_ID,
    form_id: FORM_ID,
    id: SUBMISSION_ID,
    customer_id: ids.customer,
    language: "en",
    answers: [
      { type: "text", question_id: "q-answer", key: "answer", value: "  " },
      { type: "select_many", question_id: "q-topics", key: "topics", option_keys: [] },
      { type: "file", question_id: "q-files", key: "files", files: [] },
      { type: "boolean", question_id: "q-member", key: "member", value: false },
    ],
  });
  assert.deepEqual(submissionOf(calls[0]), {
    id: SUBMISSION_ID,
    customer_id: ids.customer,
    language: "en",
    answers: [{ type: "boolean", question_id: "q-member", key: "member", value: false }],
  });
  assert.deepEqual([...calls[0].body.keys()], ["submission"]);
});
