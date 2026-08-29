import type { CreateMediaParams } from "../types/api";
import { DurableRequestStorageError } from "./durableRequest";

const databaseName = "arky-durable-requests-v1";
const objectStoreName = "media-create";
const databaseVersion = 1;
const mediaCreateLabel = "Media create";
const canonicalUuidV4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

interface DurableMediaCreate {
  storageKey: string;
  requestJson: string;
  blob: Blob | null;
}

interface FileMediaCreatePayload {
  store_id: string;
  media_id: string;
  type: "file";
  file_name: string;
  mime_type: string;
  last_modified: number;
  size: number;
  sha256: string;
}

interface UrlMediaCreatePayload {
  store_id: string;
  media_id: string;
  type: "source_url";
  source_url: string;
}

type MediaCreatePayload = FileMediaCreatePayload | UrlMediaCreatePayload;

function unavailable(reason: string): DurableRequestStorageError {
  return new DurableRequestStorageError(
    `Cannot safely start ${mediaCreateLabel} because its durable IndexedDB request ${reason}`,
  );
}

function indexedDb(): IDBFactory {
  try {
    const factory = globalThis.indexedDB;
    if (!factory) throw new Error("IndexedDB is unavailable");
    return factory;
  } catch {
    throw unavailable("storage is unavailable");
  }
}

async function openDatabase(): Promise<IDBDatabase> {
  const factory = indexedDb();
  return new Promise((resolve, reject) => {
    let settled = false;
    let request: IDBOpenDBRequest;
    try {
      request = factory.open(databaseName, databaseVersion);
    } catch {
      reject(unavailable("storage cannot be opened"));
      return;
    }
    request.onupgradeneeded = () => {
      try {
        if (!request.result.objectStoreNames.contains(objectStoreName)) {
          request.result.createObjectStore(objectStoreName, {
            keyPath: "storageKey",
          });
        }
      } catch {
        request.transaction?.abort();
      }
    };
    request.onerror = () => {
      settled = true;
      reject(unavailable("storage cannot be opened"));
    };
    request.onblocked = () => {
      settled = true;
      reject(unavailable("storage upgrade is blocked"));
    };
    request.onsuccess = () => {
      if (settled) {
        request.result.close();
        return;
      }
      settled = true;
      resolve(request.result);
    };
  });
}

async function readRaw(storageKey: string): Promise<unknown | null> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      let result: unknown;
      let transaction: IDBTransaction;
      try {
        transaction = database.transaction(objectStoreName, "readonly");
        const request = transaction.objectStore(objectStoreName).get(storageKey);
        request.onsuccess = () => {
          result = request.result;
        };
        request.onerror = () => reject(unavailable("state cannot be read"));
      } catch {
        reject(unavailable("state cannot be read"));
        return;
      }
      transaction.oncomplete = () => resolve(result ?? null);
      transaction.onerror = () => reject(unavailable("state cannot be read"));
      transaction.onabort = () => reject(unavailable("state cannot be read"));
    });
  } finally {
    database.close();
  }
}

async function writeRaw(request: DurableMediaCreate): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      let transaction: IDBTransaction;
      try {
        transaction = database.transaction(objectStoreName, "readwrite");
        const write = transaction.objectStore(objectStoreName).put(request);
        write.onerror = () => reject(unavailable("state cannot be saved"));
      } catch {
        reject(unavailable("state cannot be saved"));
        return;
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(unavailable("state cannot be saved"));
      transaction.onabort = () => reject(unavailable("state cannot be saved"));
    });
  } finally {
    database.close();
  }
}

async function deleteRaw(storageKey: string): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      let transaction: IDBTransaction;
      try {
        transaction = database.transaction(objectStoreName, "readwrite");
        const deletion = transaction.objectStore(objectStoreName).delete(storageKey);
        deletion.onerror = () => reject(unavailable("state could not be cleared"));
      } catch {
        reject(unavailable("state could not be cleared"));
        return;
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(unavailable("state could not be cleared"));
      transaction.onabort = () => reject(unavailable("state could not be cleared"));
    });
  } finally {
    database.close();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === expected.length && expected.every((key) => keys.includes(key))
  );
}

function parsePayload(requestJson: string): MediaCreatePayload {
  let value: unknown;
  try {
    value = JSON.parse(requestJson);
  } catch {
    throw unavailable("payload is corrupt");
  }
  if (!isRecord(value)) throw unavailable("payload is invalid");
  if (
    typeof value.store_id !== "string" ||
    !canonicalUuidV4.test(value.store_id) ||
    typeof value.media_id !== "string" ||
    !canonicalUuidV4.test(value.media_id)
  ) {
    throw unavailable("payload identity is invalid");
  }
  if (
    value.type === "source_url" &&
    exactKeys(value, ["store_id", "media_id", "type", "source_url"]) &&
    typeof value.source_url === "string" &&
    value.source_url.length > 0
  ) {
    return value as unknown as UrlMediaCreatePayload;
  }
  if (
    value.type === "file" &&
    exactKeys(value, [
      "store_id",
      "media_id",
      "type",
      "file_name",
      "mime_type",
      "last_modified",
      "size",
      "sha256",
    ]) &&
    typeof value.file_name === "string" &&
    value.file_name.length > 0 &&
    typeof value.mime_type === "string" &&
    Number.isSafeInteger(value.last_modified) &&
    (value.last_modified as number) >= 0 &&
    Number.isSafeInteger(value.size) &&
    (value.size as number) >= 0 &&
    typeof value.sha256 === "string" &&
    /^[0-9a-f]{64}$/.test(value.sha256)
  ) {
    return value as unknown as FileMediaCreatePayload;
  }
  throw unavailable("payload is invalid");
}

async function sha256(blob: Blob): Promise<string> {
  const digest = globalThis.crypto?.subtle?.digest;
  if (!digest) throw unavailable("Blob integrity verification is unavailable");
  let bytes: ArrayBuffer;
  try {
    bytes = await blob.arrayBuffer();
  } catch {
    throw unavailable("Blob cannot be read");
  }
  let hash: ArrayBuffer;
  try {
    hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  } catch {
    throw unavailable("Blob integrity cannot be calculated");
  }
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function durableRecord(value: unknown, storageKey: string): DurableMediaCreate {
  if (
    !isRecord(value) ||
    !exactKeys(value, ["storageKey", "requestJson", "blob"]) ||
    value.storageKey !== storageKey ||
    typeof value.requestJson !== "string" ||
    (value.blob !== null && !(value.blob instanceof Blob))
  ) {
    throw unavailable("state is invalid");
  }
  return value as unknown as DurableMediaCreate;
}

async function decodeDurable(
  value: unknown,
  storageKey: string,
): Promise<{ durable: DurableMediaCreate; payload: MediaCreatePayload }> {
  const durable = durableRecord(value, storageKey);
  const payload = parsePayload(durable.requestJson);
  if (storageKey !== mediaCreateStorageKey(payload.store_id)) {
    throw unavailable("key does not match its exact Store");
  }
  if (payload.type === "source_url") {
    if (durable.blob !== null) throw unavailable("URL payload contains a Blob");
  } else {
    if (
      durable.blob === null ||
      durable.blob.size !== payload.size ||
      durable.blob.type !== payload.mime_type ||
      (await sha256(durable.blob)) !== payload.sha256
    ) {
      throw unavailable("Blob does not match its exact payload");
    }
  }
  return { durable, payload };
}

async function payloadFor(
  storeId: string,
  params: CreateMediaParams,
): Promise<{ payload: MediaCreatePayload; blob: Blob | null }> {
  if (!canonicalUuidV4.test(storeId) || !canonicalUuidV4.test(params.media_id)) {
    throw unavailable("identity is not a canonical UUID-v4");
  }
  if (params.file) {
    const blob = params.file;
    return {
      payload: {
        store_id: storeId,
        media_id: params.media_id,
        type: "file",
        file_name: params.file.name,
        mime_type: params.file.type,
        last_modified: params.file.lastModified,
        size: params.file.size,
        sha256: await sha256(params.file),
      },
      blob,
    };
  }
  return {
    payload: {
      store_id: storeId,
      media_id: params.media_id,
      type: "source_url",
      source_url: params.source_url,
    },
    blob: null,
  };
}

function paramsFrom(
  durable: DurableMediaCreate,
  payload: MediaCreatePayload,
): CreateMediaParams {
  if (payload.type === "source_url") {
    return {
      store_id: payload.store_id,
      media_id: payload.media_id,
      source_url: payload.source_url,
    };
  }
  const FileConstructor = globalThis.File;
  if (!FileConstructor || durable.blob === null) {
    throw unavailable("Blob cannot be reconstructed as a File");
  }
  return {
    store_id: payload.store_id,
    media_id: payload.media_id,
    file: new FileConstructor([durable.blob], payload.file_name, {
      type: payload.mime_type,
      lastModified: payload.last_modified,
    }),
  };
}

export function mediaCreateStorageKey(storeId: string): string {
  return `arky:media-create:v1:${encodeURIComponent(storeId)}`;
}

export async function readPendingMediaCreate(
  storeId: string,
): Promise<CreateMediaParams | null> {
  const storageKey = mediaCreateStorageKey(storeId);
  const value = await readRaw(storageKey);
  if (value === null) return null;
  const decoded = await decodeDurable(value, storageKey);
  return paramsFrom(decoded.durable, decoded.payload);
}

export async function getOrCreatePendingMediaCreate(
  storeId: string,
  params: CreateMediaParams,
): Promise<{ durable: DurableMediaCreate; params: CreateMediaParams }> {
  const storageKey = mediaCreateStorageKey(storeId);
  const candidate = await payloadFor(storeId, params);
  const requestJson = JSON.stringify(candidate.payload);
  const existing = await readRaw(storageKey);
  if (existing !== null) {
    const decoded = await decodeDurable(existing, storageKey);
    if (decoded.durable.requestJson !== requestJson) {
      throw unavailable("has a different unresolved payload");
    }
    return {
      durable: decoded.durable,
      params: paramsFrom(decoded.durable, decoded.payload),
    };
  }
  await writeRaw({ storageKey, requestJson, blob: candidate.blob });
  const persisted = await readRaw(storageKey);
  if (persisted === null) throw unavailable("state was not saved exactly");
  const decoded = await decodeDurable(persisted, storageKey);
  if (decoded.durable.requestJson !== requestJson) {
    throw unavailable("state was not saved exactly");
  }
  return {
    durable: decoded.durable,
    params: paramsFrom(decoded.durable, decoded.payload),
  };
}

export async function clearPendingMediaCreate(
  durable: DurableMediaCreate,
): Promise<void> {
  const stored = await readRaw(durable.storageKey);
  if (stored === null) throw unavailable("state changed before it could be cleared");
  const decoded = await decodeDurable(stored, durable.storageKey);
  if (decoded.durable.requestJson !== durable.requestJson) {
    throw unavailable("state changed before it could be cleared");
  }
  await deleteRaw(durable.storageKey);
  if ((await readRaw(durable.storageKey)) !== null) {
    throw unavailable("state was not cleared");
  }
}

export type { DurableMediaCreate };
