import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { ids, recordFetch } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "6d2e8a14-b0c7-4f93-a5d1-3c9e7b0f2a48";

test("FormSubmission answers are read-only and a submission leaves only through a versioned delete", async (context) => {
  const arky = createAdmin({ baseUrl: "https://api.test", apiToken: "token-contract" });
  for (const removed of ["updateSubmission", "permanentlyDelete", "restoreSubmission"]) assert.equal(removed in arky.forms, false, removed);
  assert.equal(typeof arky.forms.getSubmission, "function");
  assert.equal(typeof arky.forms.deleteSubmission, "function");
  const calls = recordFetch(context, () => ({ deleted: true }));
  assert.deepEqual(await arky.forms.deleteSubmission({ store_id: STORE_ID, form_id: ids.form, id: ids.submission, expected_updated_at: 1_700_000_000_123 }), { deleted: true });
  assert.deepEqual(calls.map(({ href, method, body }) => ({ href, method, body })), [
    {
      href: `https://api.test/v1/stores/${STORE_ID}/forms/${ids.form}/submissions/${ids.submission}?expected_updated_at=1700000000123`,
      method: "DELETE",
      body: null,
    },
  ]);
  for (const declarations of ["index.d.ts", "admin.d.ts"]) {
    const declaration = readFileSync(new URL(`../dist/${declarations}`, import.meta.url), "utf8");
    assert.doesNotMatch(declaration, /\bUpdateFormSubmissionParams\b/);
    assert.doesNotMatch(declaration, /\bupdateSubmission\b/);
    assert.doesNotMatch(declaration, /\bpermanentlyDelete\b/);
  }
});
