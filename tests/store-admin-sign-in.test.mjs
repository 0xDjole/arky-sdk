import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const baseUrl = "https://store-admin-sign-in.test";
const storeId = "8ccad9a6-502e-440b-8373-b0fbaf36154c";
const sessionId = "6f1d3b85-2c47-4e90-a8b3-5d7f9e1c3a62";
const otherSessionId = "9a2c4e61-8b3d-4f07-b5e9-1c6d8f0a2b74";

test("a store-admin code is asked for in the language its store email is written in, and Arky's own code needs only the email, each under the app's sign-in session id", async (context) => {
  const calls = recordFetch(context, (call) => ({ session_id: call.body.session_id, verification_expires_at: 900 }));
  const auth = createAdmin({ apiUrl: baseUrl }).account.auth;
  assert.deepEqual(await auth.requestCode({ session_id: sessionId, email: "owner@example.test", store_id: storeId, language: "bs" }), { session_id: sessionId, verification_expires_at: 900 });
  await auth.requestCode({ session_id: otherSessionId, email: "operator@example.test" });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${storeId}/auth/code`, { session_id: sessionId, email: "owner@example.test", language: "bs" }],
    ["POST", "/v1/auth/code", { session_id: otherSessionId, email: "operator@example.test" }],
  ]);
  await assert.rejects(async () => auth.requestCode({ session_id: sessionId, email: "owner@example.test", store_id: "store", language: "bs" }), {
    name: "TypeError",
    message: "A Store target must be an explicit canonical UUID-v4",
  });
  assert.equal(calls.length, 2);
});

test("a code request without the app's canonical sign-in session id is refused before any request", async (context) => {
  const calls = recordFetch(context, (call) => ({ session_id: call.body.session_id, verification_expires_at: 900 }));
  const auth = createAdmin({ apiUrl: baseUrl }).account.auth;
  for (const session_id of [undefined, "pending", sessionId.toUpperCase(), "00000000-0000-1000-8000-000000000000"]) {
    for (const params of [{ session_id, email: "operator@example.test" }, { session_id, email: "owner@example.test", store_id: storeId, language: "bs" }]) {
      await assert.rejects(async () => auth.requestCode(params), {
        name: "TypeError",
        message: "The sign-in session id must be a canonical UUID v4 picked by the app",
      });
    }
  }
  assert.equal(calls.length, 0);
});

test("a retried code request sends the same app-picked sign-in session id, so the Server answers the same pending session", async (context) => {
  let lose = true;
  const calls = recordFetch(context, (call) => {
    if (lose) {
      lose = false;
      throw new TypeError("Lost response");
    }
    return { session_id: call.body.session_id, verification_expires_at: 900 };
  });
  const auth = createAdmin({ apiUrl: baseUrl }).account.auth;
  const params = { session_id: sessionId, email: "owner@example.test", store_id: storeId, language: "en" };
  await assert.rejects(auth.requestCode(params), /Lost response/);
  assert.deepEqual(await auth.requestCode(params), { session_id: sessionId, verification_expires_at: 900 });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].body, calls[1].body);
  assert.deepEqual(calls[1].body, { session_id: sessionId, email: "owner@example.test", language: "en" });
});

test("a refused store-admin code request keeps the Server's code", async (context) => {
  for (const code of ["STORE_SIGN_IN.UNAVAILABLE", "EMAIL_ADDRESS.NOT_SENDING", "GENERAL.CONFLICT", "ACCOUNT_SIGN_IN.CODE_RECENT"]) {
    const calls = recordFetch(context, () => Response.json({ message: "Refused", error: code, status_code: 409, validation_errors: [] }, { status: 409 }));
    await assert.rejects(createAdmin({ apiUrl: baseUrl }).account.auth.requestCode({ session_id: sessionId, email: "owner@example.test", store_id: storeId, language: "en" }), (error) => {
      assert.equal(error.code, code);
      assert.equal(error.statusCode, 409);
      return true;
    });
    assert.equal(calls.length, 1);
    context.mock.restoreAll();
  }
});
