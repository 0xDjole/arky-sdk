import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const storeId = "5c9e1a37-8d24-4f60-b3a5-0e7f2c4d6b18";

test("store languages go to the Server as the caller wrote them and come back as the Server's canonical tags", async (context) => {
  const store = { id: storeId, name: "Shop", owner_account_id: "a35bc883-e98c-4fa9-94a2-8cbb7c3ac755", timezone: "Europe/Sarajevo", languages: ["en", "bs-BA", "sr-Latn"], status: { type: "active" }, email_sending: { type: "allowed" }, created_at: 1, updated_at: 2 };
  const calls = recordFetch(context, () => store);
  const read = await createAdmin({ apiUrl: "https://stores.test", secretKey: "arky_api_stores" }).store.update({ id: storeId, expected_updated_at: 1, languages: ["EN", "bs-ba", "sr-latn"] });
  assert.deepEqual(read.languages, ["en", "bs-BA", "sr-Latn"]);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["PUT", `/v1/stores/${storeId}`, { expected_updated_at: 1, languages: ["EN", "bs-ba", "sr-latn"] }],
  ]);
});
