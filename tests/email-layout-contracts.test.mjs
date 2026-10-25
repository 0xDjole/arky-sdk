import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const store = "5f0e7d93-2b46-4c18-9a7d-e1c3b5f82a06";
const layout = "7c9e1b3d-5f2a-4c8e-a0b2-4d6f8a0c2e4b";
const logo = "9a1c3e5b-7d2f-4b6a-8c0e-2f4a6c8e0b1d";
const content = { en: { html: "<main>{{{body}}}</main>", text: "{{body}}" }, bs: { html: "<main>{{{body}}}</main>", text: "{{body}}" } };

function layouts() {
  return createAdmin({ apiUrl: "https://layouts.test", secretKey: "arky_api_layouts" }).notification.layout;
}

test("email layouts are listed in pages and read by id", async (context) => {
  const record = { id: layout, store_id: store, key: "plain", name: "Plain", logo_media_id: null, content, created_at: 1, updated_at: 1 };
  const calls = recordFetch(context, (call) => call.path.endsWith("/email-layouts") ? { items: [record], cursor: "next" } : record);
  const api = layouts();
  assert.deepEqual(await api.find({ store_id: store, limit: 20, cursor: "previous" }), { items: [record], cursor: "next" });
  assert.deepEqual(await api.get({ store_id: store, id: layout }), record);
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `/v1/stores/${store}/email-layouts`, { limit: "20", cursor: "previous" }, null],
    ["GET", `/v1/stores/${store}/email-layouts/${layout}`, {}, null],
  ]);
});

test("an email layout is created under the app's id, replaced whole with its version and deleted with that version", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? true : { id: layout });
  const api = layouts();
  await api.create({ store_id: store, id: layout, key: "plain", name: "Plain", content });
  await api.create({ store_id: store, id: layout, key: "branded", name: "Branded", logo_media_id: logo, content });
  await api.update({ store_id: store, id: layout, expected_updated_at: 4, key: "plain", name: "Plain", logo_media_id: null, content });
  assert.equal(await api.delete({ store_id: store, id: layout, expected_updated_at: 5 }), true);
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/stores/${store}/email-layouts`, {}, { id: layout, key: "plain", name: "Plain", content }],
    ["POST", `/v1/stores/${store}/email-layouts`, {}, { id: layout, key: "branded", name: "Branded", logo_media_id: logo, content }],
    ["PUT", `/v1/stores/${store}/email-layouts/${layout}`, {}, { expected_updated_at: 4, key: "plain", name: "Plain", logo_media_id: null, content }],
    ["DELETE", `/v1/stores/${store}/email-layouts/${layout}`, { expected_updated_at: "5" }, null],
  ]);
  await assert.rejects(async () => api.create({ store_id: store, id: "plain", key: "plain", name: "Plain", content }), {
    name: "TypeError",
    message: "The email layout id must be a canonical UUID v4 picked by the app",
  });
  await assert.rejects(async () => api.get({ store_id: "store", id: layout }), TypeError);
  assert.equal(calls.length, 4);
});
