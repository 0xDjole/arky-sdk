import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const baseUrl = "https://store-admin-sign-in.test";
const storeId = "8ccad9a6-502e-440b-8373-b0fbaf36154c";

test("a store-admin code is asked for in the language its store email is written in, and Arky's own code needs only the email", async (context) => {
  const calls = recordFetch(context, () => ({ session_id: "pending", verification_expires_at: 900 }));
  const auth = createAdmin({ apiUrl: baseUrl }).account.auth;
  assert.deepEqual(await auth.requestCode({ email: "owner@example.test", store_id: storeId, language: "bs" }), { session_id: "pending", verification_expires_at: 900 });
  await auth.requestCode({ email: "operator@example.test" });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${storeId}/auth/code`, { email: "owner@example.test", language: "bs" }],
    ["POST", "/v1/auth/code", { email: "operator@example.test" }],
  ]);
  await assert.rejects(async () => auth.requestCode({ email: "owner@example.test", store_id: "store", language: "bs" }), {
    name: "TypeError",
    message: "A Store target must be an explicit canonical UUID-v4",
  });
  assert.equal(calls.length, 2);
});

test("a refused store-admin code request keeps the Server's code", async (context) => {
  for (const code of ["STORE_SIGN_IN.UNAVAILABLE", "EMAIL_ADDRESS.NOT_SENDING"]) {
    const calls = recordFetch(context, () => Response.json({ message: "Refused", error: code, status_code: 409, validation_errors: [] }, { status: 409 }));
    await assert.rejects(createAdmin({ apiUrl: baseUrl }).account.auth.requestCode({ email: "owner@example.test", store_id: storeId, language: "en" }), (error) => {
      assert.equal(error.code, code);
      assert.equal(error.statusCode, 409);
      return true;
    });
    assert.equal(calls.length, 1);
    context.mock.restoreAll();
  }
});
