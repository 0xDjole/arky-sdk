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
const collectionPath = `/v1/tenants/${ids.tenant}/private-collections`;
const entriesPath = `${collectionPath}/${collectionId}/entries`;

function admin() {
  return createAdmin({ apiUrl, accountToken });
}

test("private collections have their own routes and preserve type, filters and versions", async (context) => {
  const calls = recordFetch(context, () => ({ id: collectionId, type: "private" }));
  const api = admin().content.privateCollection;
  await api.create({ tenant_id: ids.tenant, id: collectionId, type: "private", key: "history", schema: [], blocks: [] });
  await api.create({ tenant_id: ids.tenant, id: collectionId, type: "user", key: "charts", schema: [], blocks: [] });
  await api.find({ tenant_id: ids.tenant, type: "private", key: "history", status: "active", limit: 10, cursor: "collections" });
  await api.get({ tenant_id: ids.tenant, id: collectionId });
  await api.update({ tenant_id: ids.tenant, id: collectionId, expected_updated_at: 3, status: { type: "archived" } });
  await api.delete({ tenant_id: ids.tenant, id: collectionId, expected_updated_at: 4 });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", collectionPath, {}, { id: collectionId, type: "private", key: "history", schema: [], blocks: [] }],
    ["POST", collectionPath, {}, { id: collectionId, type: "user", key: "charts", schema: [], blocks: [] }],
    ["GET", collectionPath, { type: "private", key: "history", status: "active", limit: "10", cursor: "collections" }, null],
    ["GET", `${collectionPath}/${collectionId}`, {}, null],
    ["PUT", `${collectionPath}/${collectionId}`, {}, { expected_updated_at: 3, status: { type: "archived" } }],
    ["DELETE", `${collectionPath}/${collectionId}`, { expected_updated_at: "4" }, null],
  ]);
});

test("private and user entries name their collection, and one user's entries list by user_id", async (context) => {
  const calls = recordFetch(context, () => ({ id: entryId, type: { type: "user", user_id: ids.user } }));
  const api = admin().content.privateEntry;
  const target = { tenant_id: ids.tenant, collection_id: collectionId };
  const type = { type: "user", user_id: ids.user };
  await api.create({ ...target, id: entryId, type, blocks: [], status: { type: "draft" } });
  await api.create({ ...target, id: entryId, type: { type: "private" }, blocks: [] });
  await api.find({ ...target, user_id: ids.user, limit: 2, cursor: "user-page" });
  await api.find({ ...target, limit: 5 });
  await api.get({ ...target, id: entryId });
  await api.update({ ...target, id: entryId, expected_updated_at: 6, blocks: [], status: { type: "active" } });
  await api.delete({ ...target, id: entryId, expected_updated_at: 7 });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", entriesPath, {}, { id: entryId, type, blocks: [], status: { type: "draft" } }],
    ["POST", entriesPath, {}, { id: entryId, type: { type: "private" }, blocks: [] }],
    ["GET", entriesPath, { user_id: ids.user, limit: "2", cursor: "user-page" }, null],
    ["GET", entriesPath, { limit: "5" }, null],
    ["GET", `${entriesPath}/${entryId}`, {}, null],
    ["PUT", `${entriesPath}/${entryId}`, {}, { expected_updated_at: 6, blocks: [], status: { type: "active" } }],
    ["DELETE", `${entriesPath}/${entryId}`, { expected_updated_at: "7" }, null],
  ]);
  assert.ok(calls.every((call) => call.headers.get("authorization") === `Bearer ${accountToken}`));
});

test("the staff entry search lists every user's entries of a collection named by its id alone, and a deleting status reads back", async (context) => {
  const userEntry = { id: entryId, collection_id: collectionId, type: { type: "user", user_id: ids.user } };
  const otherEntry = { ...userEntry, id: mediaId, type: { type: "user", user_id: ids.otherUser } };
  const calls = recordFetch(context, () => ({ items: [userEntry, otherEntry], cursor: "search:+/=" }));
  const api = admin().content;
  const page = await api.entry.find({ tenant_id: ids.tenant, collection_id: collectionId, query: "insulin", limit: 50 });
  assert.deepEqual(page.items.map((item) => item.type), [userEntry.type, otherEntry.type]);
  await api.entry.find({ tenant_id: ids.tenant, collection_id: collectionId, cursor: page.cursor });
  await api.privateEntry.find({ tenant_id: ids.tenant, collection_id: collectionId, user_id: ids.user, status: "deleting" });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `/v1/tenants/${ids.tenant}/entries`, { collection_id: collectionId, query: "insulin", limit: "50" }, null],
    ["GET", `/v1/tenants/${ids.tenant}/entries`, { collection_id: collectionId, cursor: "search:+/=" }, null],
    ["GET", entriesPath, { user_id: ids.user, status: "deleting" }, null],
  ]);
});

test("a_private_entry_file_link_names_its_entry_and_file", async (context) => {
  const link = { url: "https://private.example.test/object?signature=limited", expires_at: 1_900_000_300_000 };
  const calls = recordFetch(context, () => link);
  const result = await admin().content.privateEntry.fileLink({
    tenant_id: ids.tenant,
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

test("entry reads are found in the tenant's audit log by entry, collection or account", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: "next" }));
  assert.equal("entryAccess" in admin().content, false);
  const api = admin().tenant.auditLog;
  assert.deepEqual(Object.keys(api), ["find"]);
  for (const target of [{ subject_type: "entry", subject_id: entryId }, { subject_type: "collection", subject_id: collectionId }, { account_id: ids.account }]) {
    assert.deepEqual(await api.find({ tenant_id: ids.tenant, ...target, limit: 100, cursor: "kept" }), { items: [], cursor: "next" });
    assert.equal(calls.at(-1).path, `/v1/tenants/${ids.tenant}/audit-logs`);
    assert.deepEqual(calls.at(-1).query, { ...target, limit: "100", cursor: "kept" });
  }
});

test("a_user_entry_read_sends_the_users_session", async (context) => {
  const entry = { id: entryId, type: { type: "user", user_id: ids.user } };
  const link = { url: "https://private.example.test/user?signature=limited", expires_at: 1_900_000_300_000 };
  const calls = recordFetch(context, (call) => call.path.includes("/files/") ? link : call.path.endsWith(entryId) ? entry : { items: [entry], cursor: "next" });
  const store = initialize(storefrontIdentity, { ...fixedIdFactories, apiUrl, sessionStorage: signedInStorage() });
  assert.deepEqual(await store.userEntries.find({ collection_id: collectionId, limit: 5, cursor: "page" }), { items: [entry], cursor: "next" });
  assert.deepEqual(await store.userEntries.get({ id: entryId }), entry);
  assert.deepEqual(await store.userEntries.fileLink({ id: entryId, media_id: mediaId, variant: "small" }), link);
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [
    ["GET", "/v1/storefront/user-entries", { collection_id: collectionId, limit: "5", cursor: "page" }],
    ["GET", `/v1/storefront/user-entries/${entryId}`, {}],
    ["GET", `/v1/storefront/user-entries/${entryId}/files/${mediaId}`, { variant: "small" }],
  ]);
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), `Bearer ${accessToken}`);
    assert.equal(call.headers.get("x-arky-tenant-id"), ids.tenant);
    assert.equal(call.headers.get("x-arky-sales-channel-id"), ids.channel);
  }
});

test("a refused private or user entry read is returned without trying a public route", async (context) => {
  const calls = recordFetch(context, () => errorResponse(404, "GENERAL.NOT_FOUND", "Not found"));
  await assert.rejects(admin().content.privateEntry.get({ tenant_id: ids.tenant, collection_id: collectionId, id: entryId }), (error) => error.code === "GENERAL.NOT_FOUND");
  const client = createStorefront(storefrontIdentity, { ...fixedIdFactories, apiUrl, sessionStorage: new SessionStorage() });
  await assert.rejects(client.userEntries.get({ id: entryId }), (error) => error.code === "GENERAL.NOT_FOUND");
  assert.deepEqual(calls.map((call) => call.path), [
    `${entriesPath}/${entryId}`,
    `/v1/storefront/user-entries/${entryId}`,
  ]);
  assert.equal(calls[1].headers.has("authorization"), false);
  assert.equal(client.hasSession, false);
});

test("media_create_sends_its_visibility", async (context) => {
  const calls = recordFetch(context, () => ({ id: mediaId, tenant_id: ids.tenant, visibility: "private" }));
  const api = admin().media;
  await api.create({ tenant_id: ids.tenant, id: mediaId, source_url: "https://source.example.test/scan.pdf", visibility: "private" });
  await api.create({ tenant_id: ids.tenant, id: mediaId, file: new File(["file"], "scan.pdf", { type: "application/pdf" }), visibility: "private" });
  assert.ok(calls.every((call) => call.method === "PUT" && call.path === `/v1/tenants/${ids.tenant}/media/${mediaId}`));
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

test("a private entry is printed through its own call with no body", async (context) => {
  const entry = { id: entryId, type: { type: "user", user_id: ids.user } };
  const calls = recordFetch(context, () => entry);
  assert.deepEqual(await admin().content.privateEntry.print({ tenant_id: ids.tenant, collection_id: collectionId, id: entryId }), entry);
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `${entriesPath}/${entryId}/print`, {}, null],
  ]);
});

test("staff read a category, a private collection and a public entry by key, a public collection's entries page and private entries by status", async (context) => {
  const tenantId = "4b6e2a91-0c5d-4f37-8a2e-1d9c7b3f5e08";
  const collectionId = "1f3b5d7e-9a2c-4e6b-8d0f-2a4c6e8b0d1f";
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push([init.method ?? "GET", parsed.pathname, Object.fromEntries(parsed.searchParams)]);
    return new Response(JSON.stringify({ items: [], cursor: null }), { headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: "https://content.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  await admin.category.getByKey({ tenant_id: tenantId, key: "kitchen/tools" });
  await admin.content.privateCollection.getByKey({ tenant_id: tenantId, key: "patients" });
  await admin.content.entry.getByKey({ tenant_id: tenantId, collection_id: collectionId, key: "about" });
  await admin.content.collection.findEntries({ tenant_id: tenantId, id: collectionId, limit: 100, cursor: "entries:2" });
  await admin.content.privateEntry.find({ tenant_id: tenantId, collection_id: collectionId, status: "archived", limit: 10 });
  assert.deepEqual(calls, [
    ["GET", `/v1/tenants/${tenantId}/categories/by-key/kitchen%2Ftools`, {}],
    ["GET", `/v1/tenants/${tenantId}/private-collections/by-key/patients`, {}],
    ["GET", `/v1/tenants/${tenantId}/entries/by-key/about`, { collection_id: collectionId }],
    ["GET", `/v1/tenants/${tenantId}/collections/${collectionId}/entries`, { limit: "100", cursor: "entries:2" }],
    ["GET", `/v1/tenants/${tenantId}/private-collections/${collectionId}/entries`, { status: "archived", limit: "10" }],
  ]);
});
