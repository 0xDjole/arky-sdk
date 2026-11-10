import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { DurableRequestError, discardPendingMediaCreate, readPendingMediaCreate } from "../dist/utils.js";
import { ExclusiveLockManager } from "./helpers/durable-request-fixtures.mjs";
import { MemoryIndexedDbFactory } from "./helpers/indexeddb-fixture.mjs";
import { errorResponse, installGlobal, jsonResponse, recordFetch } from "./helpers/arky-fixtures.mjs";

const baseUrl = "https://api.example.test";
const storeId = "a7349ac4-b21a-46f5-b706-a9fa32f13f6b";
const mediaId = "2b3026cf-a495-46a6-b34e-1514d80b0b0b";
const otherMediaId = "6d1f8a42-3c95-4e07-b2a8-9c4e1d7f3b60";
const storageKey = `arky:media-create:v2:${encodeURIComponent(storeId)}`;

function installBrowserState(context) {
  const indexedDB = new MemoryIndexedDbFactory();
  installGlobal(context, "indexedDB", indexedDB);
  installGlobal(context, "navigator", { locks: new ExclusiveLockManager() });
  installGlobal(context, "window", globalThis);
  return { indexedDB };
}

function admin() {
  return createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
}

function media(id = mediaId, visibility = "public") {
  return {
    id,
    store_id: storeId,
    file_name: "asset.png",
    alt: null,
    generation_id: "generation",
    visibility,
    content: { type: "image", width_px: 1, height_px: 1 },
    status: { type: "ready" },
    created_at: 1,
    updated_at: 1,
  };
}

function asset(bytes = [1, 2, 3, 4]) {
  return new File([new Uint8Array(bytes)], "asset.png", { type: "image/png", lastModified: 1234 });
}

test("a media create keeps the exact file under its app-picked id after a lost response and replays it after a reload", async (context) => {
  const { indexedDB } = installBrowserState(context);
  const calls = recordFetch(context, (call) => {
    if (call.method === "PUT") throw new TypeError("response connection was lost");
    return errorResponse(404, "MEDIA.NOT_FOUND", "Not found");
  });
  await assert.rejects(admin().media.create({ store_id: storeId, id: mediaId, file: asset() }), /connection was lost/);
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["PUT", `/v1/stores/${storeId}/media/${mediaId}`],
    ["GET", `/v1/stores/${storeId}/media/${mediaId}`],
  ]);
  const raw = indexedDB.peek("arky-durable-requests-v1", "media-create", storageKey);
  assert.equal(raw.storageKey, storageKey);
  assert.equal(raw.blob instanceof Blob, true);
  assert.equal(raw.blob.size, 4);
  assert.equal(raw.requestJson.includes("source_url"), false);
  assert.equal(JSON.parse(raw.requestJson).media_id, mediaId);

  const recovered = await readPendingMediaCreate(storeId);
  assert.equal(recovered.store_id, storeId);
  assert.equal(recovered.id, mediaId);
  assert.equal(recovered.file.name, "asset.png");
  assert.equal(recovered.file.lastModified, 1234);
  assert.deepEqual([...new Uint8Array(await recovered.file.arrayBuffer())], [1, 2, 3, 4]);

  context.mock.restoreAll();
  const replays = recordFetch(context, () => media());
  assert.deepEqual(await admin().media.create(recovered), media());
  assert.equal(replays.length, 1);
  assert.equal(replays[0].href, `${baseUrl}/v1/stores/${storeId}/media/${mediaId}`);
  const replayed = replays[0].body.get("file");
  assert.equal(replayed.name, "asset.png");
  assert.deepEqual([...new Uint8Array(await replayed.arrayBuffer())], [1, 2, 3, 4]);
  assert.equal(await readPendingMediaCreate(storeId), null);
});

test("a URL import keeps its source only in IndexedDB and clears it once the exact read finds the media", async (context) => {
  const { indexedDB } = installBrowserState(context);
  const sourceUrl = "https://source.example.test/photo.png";
  const calls = recordFetch(context, (call) => {
    if (call.method === "PUT") throw new TypeError("response connection was lost");
    return media();
  });
  assert.deepEqual(await admin().media.create({ store_id: storeId, id: mediaId, source_url: sourceUrl }), media());
  const put = calls.find((call) => call.method === "PUT");
  assert.equal(put.body.get("source_url"), sourceUrl);
  assert.equal(calls.filter((call) => call.method === "GET").length, 1);
  assert.equal(indexedDB.peek("arky-durable-requests-v1", "media-create", storageKey), null);
});

test("a refused create clears the saved request, so the next create with another file is sent", async (context) => {
  installBrowserState(context);
  let refuse = true;
  const calls = recordFetch(context, (call) => {
    if (call.method !== "PUT") throw new Error("A refusal needs no reconciliation read");
    return refuse ? errorResponse(422, "MEDIA.INVALID_INPUT", "The file isn't an image") : media(otherMediaId);
  });
  await assert.rejects(admin().media.create({ store_id: storeId, id: mediaId, file: asset([1]) }), (error) => error.statusCode === 422);
  assert.equal(await readPendingMediaCreate(storeId), null);
  refuse = false;
  assert.deepEqual(await admin().media.create({ store_id: storeId, id: otherMediaId, file: asset([2]) }), media(otherMediaId));
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["PUT", `/v1/stores/${storeId}/media/${mediaId}`],
    ["PUT", `/v1/stores/${storeId}/media/${otherMediaId}`],
  ]);
  assert.equal(await readPendingMediaCreate(storeId), null);
});

test("a different file can't start while an unclear create is still saved", async (context) => {
  installBrowserState(context);
  let puts = 0;
  recordFetch(context, (call) => {
    if (call.method === "PUT") {
      puts += 1;
      throw new TypeError("response connection was lost");
    }
    return errorResponse(404, "MEDIA.NOT_FOUND", "Not found");
  });
  await assert.rejects(admin().media.create({ store_id: storeId, id: mediaId, file: asset([1]) }), /connection was lost/);
  await assert.rejects(admin().media.create({ store_id: storeId, id: mediaId, file: asset([2]) }), /still keeps a different unresolved request/);
  await assert.rejects(admin().media.create({ store_id: storeId, id: otherMediaId, file: asset([1]) }), /still keeps a different unresolved request/);
  assert.equal(puts, 1);
  assert.notEqual(await readPendingMediaCreate(storeId), null);
});

test("a_pending_media_create_can_be_discarded", async (context) => {
  const { indexedDB } = installBrowserState(context);
  let lose = true;
  const calls = recordFetch(context, (call) => {
    if (call.method === "PUT" && lose) throw new TypeError("response connection was lost");
    if (call.method === "PUT") return media(otherMediaId);
    return errorResponse(404, "MEDIA.NOT_FOUND", "Not found");
  });
  await assert.rejects(admin().media.create({ store_id: storeId, id: mediaId, file: asset([1]) }), /connection was lost/);
  await assert.rejects(admin().media.create({ store_id: storeId, id: otherMediaId, file: asset([2]) }), /still keeps a different unresolved request/);
  await discardPendingMediaCreate(storeId);
  assert.equal(await readPendingMediaCreate(storeId), null);
  assert.equal(indexedDB.peek("arky-durable-requests-v1", "media-create", storageKey), null);
  lose = false;
  assert.deepEqual(await admin().media.create({ store_id: storeId, id: otherMediaId, file: asset([2]) }), media(otherMediaId));
  indexedDB.databases.get("arky-durable-requests-v1").stores.get("media-create").set(storageKey, { storageKey, requestJson: "{", blob: null });
  await assert.rejects(admin().media.create({ store_id: storeId, id: mediaId, file: asset([3]) }), (error) => error instanceof DurableRequestError && error.code === "storage");
  await assert.rejects(readPendingMediaCreate(storeId), (error) => error instanceof DurableRequestError && error.code === "storage");
  await discardPendingMediaCreate(storeId);
  assert.equal(await readPendingMediaCreate(storeId), null);
  assert.deepEqual(calls.filter((call) => call.method === "PUT").map((call) => call.path), [
    `/v1/stores/${storeId}/media/${mediaId}`,
    `/v1/stores/${storeId}/media/${otherMediaId}`,
  ]);
});

test("a media create still being sent can't be discarded from another tab", async (context) => {
  installBrowserState(context);
  let releaseUpload;
  let markUploadEntered;
  const uploadEntered = new Promise((resolve) => {
    markUploadEntered = resolve;
  });
  const uploadGate = new Promise((resolve) => {
    releaseUpload = resolve;
  });
  recordFetch(context, async () => {
    markUploadEntered();
    await uploadGate;
    return media();
  });
  const first = admin().media.create({ store_id: storeId, id: mediaId, file: asset() });
  await uploadEntered;
  await assert.rejects(discardPendingMediaCreate(storeId), (error) => error instanceof DurableRequestError && error.code === "busy");
  releaseUpload();
  assert.deepEqual(await first, media());
  assert.equal(await readPendingMediaCreate(storeId), null);
});

test("concurrent tabs send at most one media create", async (context) => {
  installBrowserState(context);
  let releaseUpload;
  let markUploadEntered;
  const uploadEntered = new Promise((resolve) => {
    markUploadEntered = resolve;
  });
  const uploadGate = new Promise((resolve) => {
    releaseUpload = resolve;
  });
  let puts = 0;
  recordFetch(context, async (call) => {
    if (call.method !== "PUT") return errorResponse(404, "MEDIA.NOT_FOUND", "Not found");
    puts += 1;
    markUploadEntered();
    await uploadGate;
    return media();
  });
  const first = admin().media.create({ store_id: storeId, id: mediaId, file: asset() });
  await uploadEntered;
  await assert.rejects(admin().media.create({ store_id: storeId, id: mediaId, file: asset() }), /already running in this or another tab/);
  releaseUpload();
  await first;
  assert.equal(puts, 1);
});

test("a browser create fails closed before sending without IndexedDB, and ids are checked first", async (context) => {
  installGlobal(context, "window", globalThis);
  installGlobal(context, "navigator", { locks: new ExclusiveLockManager() });
  installGlobal(context, "indexedDB", undefined);
  const calls = recordFetch(context, () => jsonResponse(media()));
  const source = { store_id: storeId, id: mediaId, source_url: "https://source.example.test/photo.png" };
  await assert.rejects(admin().media.create(source), /IndexedDB request storage is unavailable/);
  await assert.rejects(admin().media.create({ ...source, store_id: undefined }), { name: "TypeError", message: "A Store target must be an explicit canonical UUID-v4" });
  await assert.rejects(admin().media.create({ ...source, id: "photo" }), { name: "TypeError", message: "The media id must be a canonical UUID v4 picked by the app" });
  assert.equal(calls.length, 0);
});

test("a create outside the browser is one plain upload with nothing saved", async (context) => {
  const calls = recordFetch(context, () => media());
  assert.deepEqual(await admin().media.create({ store_id: storeId, id: mediaId, file: asset(), alt: { en: "Logo" } }), media());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "PUT");
  assert.equal(calls[0].body.get("alt"), JSON.stringify({ en: "Logo" }));
  assert.equal(calls[0].body.get("file").name, "asset.png");
});

test("a private media retry keeps visibility with the exact file after a reload", async (context) => {
  installBrowserState(context);
  const first = recordFetch(context, (call) => call.method === "PUT"
    ? Promise.reject(new TypeError("response connection was lost"))
    : errorResponse(404, "GENERAL.NOT_FOUND", "Not found"));
  const request = { store_id: storeId, id: mediaId, file: asset(), visibility: "private" };
  await assert.rejects(admin().media.create(request), /connection was lost/);
  assert.equal(first[0].body.get("visibility"), "private");
  const recovered = await readPendingMediaCreate(storeId);
  assert.equal(recovered.visibility, "private");
  await assert.rejects(admin().media.create({ ...request, visibility: "public" }), /still keeps a different unresolved request/);
  assert.equal(first.length, 2);
  context.mock.restoreAll();
  const retries = recordFetch(context, () => media(mediaId, "private"));
  assert.deepEqual(await admin().media.create(recovered), media(mediaId, "private"));
  assert.equal(retries[0].body.get("visibility"), "private");
  assert.equal(await readPendingMediaCreate(storeId), null);
});

test("an ambiguous private media create is not reconciled against a public file with the same id", async (context) => {
  installBrowserState(context);
  const calls = recordFetch(context, (call) => call.method === "PUT"
    ? Promise.reject(new TypeError("response connection was lost"))
    : media(mediaId, "public"));
  await assert.rejects(admin().media.create({ store_id: storeId, id: mediaId, file: asset(), visibility: "private" }), /connection was lost/);
  assert.equal(calls.length, 2);
  assert.equal((await readPendingMediaCreate(storeId)).visibility, "private");
});
