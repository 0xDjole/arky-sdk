import assert from "node:assert/strict";
import test from "node:test";

import { createStorefront, initialize } from "../dist/storefront.js";
import {
  accessToken,
  apiUrl,
  errorResponse,
  fixedIdFactories,
  ids,
  recordFetch,
  signedInStorage,
  storefrontIdentity,
  visitorStorage,
  visitorToken,
} from "./helpers/arky-fixtures.mjs";

function submission(id, created_at) {
  return {
    id,
    form_id: ids.form,
    form_key: "intake",
    language: "bs",
    answers: [{ type: "text", question_id: "q-note", key: "note", value: "Nalaz" }],
    stage_id: null,
    created_at,
    updated_at: created_at,
  };
}

test("a signed-in customer pages their own form submissions, newest first, under their own session", async (context) => {
  const newer = submission(ids.submission, 9);
  const older = submission(ids.picked, 5);
  const calls = recordFetch(context, (_call, count) => (count === 1 ? { items: [newer], cursor: "next:+/=" } : { items: [older], cursor: null }));
  const forms = createStorefront(storefrontIdentity, { ...fixedIdFactories, apiUrl, locale: "bs", sessionStorage: signedInStorage() }).forms;
  const first = await forms.findSubmissions({ limit: 1 });
  assert.deepEqual(first, { items: [newer], cursor: "next:+/=" });
  assert.deepEqual(await forms.findSubmissions({ limit: 1, cursor: first.cursor }), { items: [older], cursor: null });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", "/v1/storefront/form-submissions", { limit: "1" }, null],
    ["GET", "/v1/storefront/form-submissions", { limit: "1", cursor: "next:+/=" }, null],
  ]);
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), `Bearer ${accessToken}`);
    for (const named of ["customer_id", "store_id", "form_id", "sort_field"]) assert.equal(named in call.query, false, named);
  }
});

test("a visitor's form submission list is refused with 403 and keeps the visitor's session", async (context) => {
  const calls = recordFetch(context, () => errorResponse(403, "GENERAL.FORBIDDEN", "Forbidden"));
  const store = initialize(storefrontIdentity, { ...fixedIdFactories, apiUrl, locale: "bs", sessionStorage: visitorStorage() });
  await assert.rejects(store.forms.findSubmissions(), { statusCode: 403, code: "GENERAL.FORBIDDEN" });
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [["GET", "/v1/storefront/form-submissions", {}]]);
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${visitorToken}`);
});
