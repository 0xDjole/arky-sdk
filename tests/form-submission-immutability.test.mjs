#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

test("FormSubmission is read-only and exposes only explicit deletion", async () => {
  const arky = createAdmin({
    baseUrl: "https://api.test",
    storeId: "store-contract",
    apiToken: "token-contract",
  });
  assert.equal("updateSubmission" in arky.forms, false);
  assert.equal(typeof arky.forms.getSubmission, "function");
  assert.equal(typeof arky.forms.deleteSubmission, "function");
  assert.equal(typeof arky.forms.permanentlyDelete, "function");

  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method || "GET",
      body: init.body ?? null,
    });
    return new Response("true", {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  try {
    assert.equal(
      await arky.forms.deleteSubmission({
        id: "submission-contract",
        form_id: "form-contract",
      }),
      true,
    );
    assert.equal(
      await arky.forms.permanentlyDelete({ id: "form-contract" }),
      true,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(calls, [
    {
      url: "https://api.test/v1/stores/store-contract/forms/form-contract/submissions/submission-contract",
      method: "DELETE",
      body: null,
    },
    {
      url: "https://api.test/v1/stores/store-contract/forms/form-contract/permanent",
      method: "DELETE",
      body: null,
    },
  ]);

  const declaration = readFileSync(new URL("../dist/index.d.ts", import.meta.url), "utf8");
  assert.doesNotMatch(declaration, /\bUpdateFormSubmissionParams\b/);
  assert.doesNotMatch(declaration, /\bupdateSubmission\b/);
});
