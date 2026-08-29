import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { createAdmin } from "../dist/admin.js";
import { readPendingMediaCreate } from "../dist/utils.js";
import { ExclusiveLockManager } from "./helpers/durable-request-fixtures.mjs";
import { MemoryIndexedDbFactory } from "./helpers/indexeddb-fixture.mjs";

const baseUrl = "https://api.example.test";
const storeId = "a7349ac4-b21a-46f5-b706-a9fa32f13f6b";
const mediaId = "2b3026cf-a495-46a6-b34e-1514d80b0b0b";
const storageKey = `arky:media-create:v1:${encodeURIComponent(storeId)}`;
const originalDescriptors = new Map(
  ["fetch", "indexedDB", "navigator", "window"].map((name) => [
    name,
    Object.getOwnPropertyDescriptor(globalThis, name),
  ]),
);

function installGlobal(name, value) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  });
}

function installBrowserState() {
  const indexedDB = new MemoryIndexedDbFactory();
  installGlobal("indexedDB", indexedDB);
  installGlobal("navigator", { locks: new ExclusiveLockManager() });
  installGlobal("window", globalThis);
  return { indexedDB };
}

function restoreGlobals() {
  for (const [name, descriptor] of originalDescriptors) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
}

function admin() {
  return createAdmin({ baseUrl, storeId, apiToken: "contract-token" });
}

function media(id = mediaId) {
  return {
    id,
    store_id: storeId,
    original: {
      url: `https://assets.example.test/${id}/original.png`,
      file_name: "asset.png",
      mime_type: "image/png",
      size_bytes: 4,
      width_px: 1,
      height_px: 1,
    },
    renditions: [],
    created_at: 1,
    updated_at: 1,
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function notFound() {
  return jsonResponse(
    {
      message: "Not found",
      error: "NOT_FOUND",
      statusCode: 404,
      validationErrors: [],
    },
    404,
  );
}

afterEach(() => {
  restoreGlobals();
});

test("Media create persists and replays the exact File after a lost response and reload", async () => {
  const { indexedDB } = installBrowserState();
  const file = new File([new Uint8Array([1, 2, 3, 4])], "asset.png", {
    type: "image/png",
    lastModified: 1234,
  });
  const calls = [];
  installGlobal("fetch", async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || "GET", body: init.body });
    if (init.method === "PUT") throw new TypeError("response connection was lost");
    return notFound();
  });

  await assert.rejects(admin().media.create({ media_id: mediaId, file }));
  assert.equal(calls.filter((call) => call.method === "PUT").length, 1);
  assert.equal(calls.filter((call) => call.method === "GET").length, 1);
  const raw = indexedDB.peek("arky-durable-requests-v1", "media-create", storageKey);
  assert.equal(raw.storageKey, storageKey);
  assert.equal(raw.blob instanceof Blob, true);
  assert.equal(raw.blob.size, file.size);
  assert.equal(raw.requestJson.includes("source_url"), false);

  const recovered = await readPendingMediaCreate(storeId);
  assert.equal(recovered.media_id, mediaId);
  assert.equal(recovered.file.name, "asset.png");
  assert.equal(recovered.file.lastModified, 1234);
  assert.deepEqual(
    [...new Uint8Array(await recovered.file.arrayBuffer())],
    [1, 2, 3, 4],
  );

  let replayedFile;
  installGlobal("fetch", async (_url, init = {}) => {
    replayedFile = init.body.get("file");
    return jsonResponse(media());
  });
  assert.deepEqual(await admin().media.create(recovered), media());
  assert.equal(replayedFile.name, "asset.png");
  assert.deepEqual(
    [...new Uint8Array(await replayedFile.arrayBuffer())],
    [1, 2, 3, 4],
  );
  assert.equal(await readPendingMediaCreate(storeId), null);
});

test("Media URL import persists source_url only in IndexedDB and clears after exact-read reconciliation", async () => {
  const { indexedDB } = installBrowserState();
  const sourceUrl = "https://source.example.test/photo.png";
  const calls = [];
  installGlobal("fetch", async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || "GET", body: init.body });
    if (init.method === "PUT") throw new TypeError("response connection was lost");
    return jsonResponse(media());
  });

  assert.deepEqual(
    await admin().media.create({ media_id: mediaId, source_url: sourceUrl }),
    media(),
  );
  const put = calls.find((call) => call.method === "PUT");
  assert.equal(put.body.get("source_url"), sourceUrl);
  assert.equal(calls.filter((call) => call.method === "GET").length, 1);
  assert.equal(
    indexedDB.peek("arky-durable-requests-v1", "media-create", storageKey),
    null,
  );
});

test("Media create rejects changed Blob input while an ambiguous request is retained", async () => {
  installBrowserState();
  let puts = 0;
  installGlobal("fetch", async (_url, init = {}) => {
    if (init.method === "PUT") {
      puts += 1;
      throw new TypeError("response connection was lost");
    }
    return notFound();
  });
  const first = new File([new Uint8Array([1])], "asset.png", {
    type: "image/png",
  });
  const changed = new File([new Uint8Array([2])], "asset.png", {
    type: "image/png",
  });

  await assert.rejects(admin().media.create({ media_id: mediaId, file: first }));
  await assert.rejects(
    admin().media.create({ media_id: mediaId, file: changed }),
    /different unresolved payload/,
  );

  assert.equal(puts, 1);
  assert.notEqual(await readPendingMediaCreate(storeId), null);
});

test("concurrent tabs issue at most one Media create PUT", async () => {
  installBrowserState();
  const file = new File([new Uint8Array([1, 2])], "asset.png", {
    type: "image/png",
  });
  let releaseUpload;
  let markUploadEntered;
  const uploadEntered = new Promise((resolve) => {
    markUploadEntered = resolve;
  });
  const uploadGate = new Promise((resolve) => {
    releaseUpload = resolve;
  });
  let puts = 0;
  installGlobal("fetch", async (_url, init = {}) => {
    if (init.method !== "PUT") return notFound();
    puts += 1;
    markUploadEntered();
    await uploadGate;
    return jsonResponse(media());
  });

  const first = admin().media.create({ media_id: mediaId, file });
  await uploadEntered;
  await assert.rejects(
    admin().media.create({ media_id: mediaId, file }),
    /already active in another tab/,
  );
  releaseUpload();
  await first;

  assert.equal(puts, 1);
});

test("Media create fails closed before sending when IndexedDB is unavailable", async () => {
  installGlobal("window", globalThis);
  installGlobal("navigator", { locks: new ExclusiveLockManager() });
  installGlobal("indexedDB", undefined);
  let calls = 0;
  installGlobal("fetch", async () => {
    calls += 1;
    return jsonResponse(media());
  });

  await assert.rejects(
    admin().media.create({
      media_id: mediaId,
      source_url: "https://source.example.test/photo.png",
    }),
    /IndexedDB request storage is unavailable/,
  );
  assert.equal(calls, 0);
});
