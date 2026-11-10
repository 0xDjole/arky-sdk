import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront, getImageUrl, initialize } from "../dist/storefront.js";
import {
  accessToken,
  apiUrl,
  errorResponse,
  fixedIdFactories,
  ids,
  recordFetch,
  SessionStorage,
  signedInStorage,
  storefrontIdentity,
} from "./helpers/arky-fixtures.mjs";

const collectionId = "65b1c04a-e82f-42d6-9173-54fd2e29a860";
const entryId = "c247b1d6-90a4-42b8-8651-a39d4d5eabf0";
const mediaId = "7c814c0e-f20d-4479-a5e8-681fbab490c5";
const accountToken = `arky_at_${"a".repeat(42)}A`;
const collectionPath = `/v1/stores/${ids.store}/private-collections`;
const entriesPath = `${collectionPath}/${collectionId}/entries`;

function admin() {
  return createAdmin({ apiUrl, accountToken });
}

test("private collections have their own routes and preserve type, filters and versions", async (context) => {
  const calls = recordFetch(context, () => ({ id: collectionId, type: "private" }));
  const api = admin().content.privateCollection;
  await api.create({ store_id: ids.store, id: collectionId, type: "private", key: "history", schema: [], blocks: [] });
  await api.find({ store_id: ids.store, type: "private", key: "history", status: "active", limit: 10, cursor: "collections" });
  await api.get({ store_id: ids.store, id: collectionId });
  await api.update({ store_id: ids.store, id: collectionId, expected_updated_at: 3, status: { type: "archived" } });
  await api.delete({ store_id: ids.store, id: collectionId, expected_updated_at: 4 });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", collectionPath, {}, { id: collectionId, type: "private", key: "history", schema: [], blocks: [] }],
    ["GET", collectionPath, { type: "private", key: "history", status: "active", limit: "10", cursor: "collections" }, null],
    ["GET", `${collectionPath}/${collectionId}`, {}, null],
    ["PUT", `${collectionPath}/${collectionId}`, {}, { expected_updated_at: 3, status: { type: "archived" } }],
    ["DELETE", `${collectionPath}/${collectionId}`, { expected_updated_at: "4" }, null],
  ]);
});

test("private entries name their collection and encode one owner without public search filters", async (context) => {
  const calls = recordFetch(context, () => ({ id: entryId, type: { type: "private_customer", customer_id: ids.customer } }));
  const api = admin().content.privateEntry;
  const target = { store_id: ids.store, collection_id: collectionId };
  const type = { type: "private_customer", customer_id: ids.customer };
  const owner = { type: "customer", customer_id: ids.customer };
  await api.create({ ...target, id: entryId, type, blocks: [], status: { type: "draft" } });
  await api.find({ ...target, owner, limit: 2, cursor: "owner-page" });
  await api.find({ ...target, limit: 5 });
  await api.get({ ...target, id: entryId });
  await api.update({ ...target, id: entryId, expected_updated_at: 6, blocks: [], status: { type: "active" } });
  await api.delete({ ...target, id: entryId, expected_updated_at: 7 });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", entriesPath, {}, { id: entryId, type, blocks: [], status: { type: "draft" } }],
    ["GET", entriesPath, { owner: JSON.stringify(owner), limit: "2", cursor: "owner-page" }, null],
    ["GET", entriesPath, { limit: "5" }, null],
    ["GET", `${entriesPath}/${entryId}`, {}, null],
    ["PUT", `${entriesPath}/${entryId}`, {}, { expected_updated_at: 6, blocks: [], status: { type: "active" } }],
    ["DELETE", `${entriesPath}/${entryId}`, { expected_updated_at: "7" }, null],
  ]);
  assert.ok(calls.every((call) => call.headers.get("authorization") === `Bearer ${accountToken}`));
});

test("a_private_entry_file_link_names_its_entry_and_file", async (context) => {
  const link = { url: "https://private.example.test/object?signature=limited", expires_at: 1_900_000_300_000 };
  const calls = recordFetch(context, () => link);
  const result = await admin().content.privateEntry.fileLink({
    store_id: ids.store,
    collection_id: collectionId,
    id: entryId,
    media_id: mediaId,
    variant: "original",
  });
  assert.deepEqual(result, link);
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `${entriesPath}/${entryId}/files/${mediaId}`, { variant: "original" }, null],
  ]);
});

test("entry access logs expose only reads with one entry, collection or account target", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: "next" }));
  const api = admin().content.entryAccess;
  assert.deepEqual(Object.keys(api), ["find"]);
  for (const target of [{ entry_id: entryId }, { collection_id: collectionId }, { account_id: ids.account }]) {
    assert.deepEqual(await api.find({ store_id: ids.store, ...target, limit: 100, cursor: "kept" }), { items: [], cursor: "next" });
    assert.equal(calls.at(-1).path, `/v1/stores/${ids.store}/entry-accesses`);
    assert.deepEqual(calls.at(-1).query, { ...target, limit: "100", cursor: "kept" });
  }
});

test("a_shared_entry_read_sends_the_customers_session", async (context) => {
  const entry = { id: entryId, type: { type: "shared", customer_id: ids.customer } };
  const link = { url: "https://private.example.test/shared?signature=limited", expires_at: 1_900_000_300_000 };
  const calls = recordFetch(context, (call) => call.path.includes("/files/") ? link : call.path.endsWith(entryId) ? entry : { items: [entry], cursor: "next" });
  const store = initialize(storefrontIdentity, { ...fixedIdFactories, apiUrl, sessionStorage: signedInStorage() });
  assert.deepEqual(await store.sharedEntries.find({ collection_id: collectionId, limit: 5, cursor: "page" }), { items: [entry], cursor: "next" });
  assert.deepEqual(await store.sharedEntries.get({ id: entryId }), entry);
  assert.deepEqual(await store.sharedEntries.fileLink({ id: entryId, media_id: mediaId, variant: "small" }), link);
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [
    ["GET", "/v1/storefront/shared-entries", { collection_id: collectionId, limit: "5", cursor: "page" }],
    ["GET", `/v1/storefront/shared-entries/${entryId}`, {}],
    ["GET", `/v1/storefront/shared-entries/${entryId}/files/${mediaId}`, { variant: "small" }],
  ]);
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), `Bearer ${accessToken}`);
    assert.equal(call.headers.get("x-arky-store-id"), ids.store);
    assert.equal(call.headers.get("x-arky-sales-channel-id"), ids.channel);
  }
});

test("a refused private or shared read is returned without trying a public route", async (context) => {
  const calls = recordFetch(context, () => errorResponse(404, "GENERAL.NOT_FOUND", "Not found"));
  await assert.rejects(admin().content.privateEntry.get({ store_id: ids.store, collection_id: collectionId, id: entryId }), (error) => error.code === "GENERAL.NOT_FOUND");
  const client = createStorefront(storefrontIdentity, { ...fixedIdFactories, apiUrl, sessionStorage: new SessionStorage() });
  await assert.rejects(client.sharedEntries.get({ id: entryId }), (error) => error.code === "GENERAL.NOT_FOUND");
  assert.deepEqual(calls.map((call) => call.path), [
    `${entriesPath}/${entryId}`,
    `/v1/storefront/shared-entries/${entryId}`,
  ]);
  assert.equal(calls[1].headers.has("authorization"), false);
  assert.equal(client.hasSession, false);
});

test("media_create_sends_its_visibility", async (context) => {
  const calls = recordFetch(context, () => ({ id: mediaId, store_id: ids.store, visibility: "private" }));
  const api = admin().media;
  await api.create({ store_id: ids.store, id: mediaId, source_url: "https://source.example.test/scan.pdf", visibility: "private" });
  await api.create({ store_id: ids.store, id: mediaId, file: new File(["file"], "scan.pdf", { type: "application/pdf" }), visibility: "private" });
  assert.ok(calls.every((call) => call.method === "PUT" && call.path === `/v1/stores/${ids.store}/media/${mediaId}`));
  assert.ok(calls.every((call) => call.body.get("visibility") === "private"));
  assert.equal(calls[0].body.get("source_url"), "https://source.example.test/scan.pdf");
  assert.equal(calls[1].body.get("file").name, "scan.pdf");
});

test("private media never produces a preview URL", () => {
  const file = { size_bytes: 10, sha256: "hash", url: null };
  const media = { visibility: "private", content: { type: "pdf", original: file } };
  assert.equal(getImageUrl(media), null);
  assert.equal(getImageUrl({ ...media, content: { type: "pdf", original: { ...file, url: "https://stale.example.test/file" } } }), null);
  assert.equal(getImageUrl({ ...media, visibility: "public", content: { type: "pdf", original: { ...file, url: "https://media.example.test/file" } } }), "https://media.example.test/file");
});
