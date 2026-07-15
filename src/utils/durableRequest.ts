export interface DurableRequest {
  storageKey: string;
  requestJson: string;
  id: string;
}

type StoredDurableRequest = Omit<DurableRequest, "storageKey">;

export class DurableRequestStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DurableRequestStorageError";
  }
}

function unavailable(label: string, reason: string): DurableRequestStorageError {
  return new DurableRequestStorageError(
    `Cannot safely start ${label} because its durable request ${reason}`,
  );
}

function requestStorage(label: string): Storage {
  try {
    const storage = globalThis.localStorage;
    if (!storage) throw new Error("localStorage is unavailable");
    return storage;
  } catch {
    throw unavailable(label, "storage is unavailable");
  }
}

function readStoredRequest(
  storage: Storage,
  storageKey: string,
  label: string,
): StoredDurableRequest | null {
  let raw: string | null;
  try {
    raw = storage.getItem(storageKey);
  } catch {
    throw unavailable(label, "state cannot be read");
  }
  if (raw === null) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw unavailable(label, "state is corrupt");
  }
  if (
    typeof value !== "object" ||
    value === null ||
    Object.keys(value).length !== 2 ||
    typeof (value as Record<string, unknown>).requestJson !== "string" ||
    !(value as Record<string, unknown>).requestJson ||
    typeof (value as Record<string, unknown>).id !== "string" ||
    !(value as Record<string, unknown>).id
  ) {
    throw unavailable(label, "state is invalid");
  }
  try {
    JSON.parse((value as Record<string, string>).requestJson);
  } catch {
    throw unavailable(label, "payload is corrupt");
  }
  return value as StoredDurableRequest;
}

function serializeRequest(request: unknown, label: string): string {
  try {
    const serialized = JSON.stringify(request);
    if (!serialized) throw new Error("Request is not JSON serializable");
    return serialized;
  } catch {
    throw unavailable(label, "payload cannot be persisted");
  }
}

export function readDurableRequest(
  storageKey: string,
  label: string,
): DurableRequest | null {
  const stored = readStoredRequest(requestStorage(label), storageKey, label);
  return stored ? { storageKey, ...stored } : null;
}

export function durableRequestPayload(request: DurableRequest): unknown {
  return JSON.parse(request.requestJson);
}

export async function withDurableRequestLock<T>(
  storageKey: string,
  label: string,
  task: () => Promise<T>,
): Promise<T> {
  let locks: LockManager;
  try {
    locks = globalThis.navigator.locks;
    if (!locks) throw new Error("Web Locks are unavailable");
  } catch {
    throw unavailable(label, "cross-tab lock is unavailable");
  }

  let callbackEntered = false;
  try {
    return await locks.request(
      `arky:durable-request:${storageKey}`,
      { mode: "exclusive", ifAvailable: true },
      async (lock) => {
        callbackEntered = true;
        if (!lock) {
          throw unavailable(label, "is already active in another tab");
        }
        return task();
      },
    );
  } catch (error) {
    if (callbackEntered) throw error;
    throw unavailable(label, "cross-tab lock could not be acquired");
  }
}

export function getOrCreateDurableRequest(
  storageKey: string,
  payload: unknown,
  label: string,
): DurableRequest {
  const storage = requestStorage(label);
  const requestJson = serializeRequest(payload, label);
  const stored = readStoredRequest(storage, storageKey, label);
  if (stored) {
    if (stored.requestJson !== requestJson) {
      throw unavailable(label, "has a different unresolved payload");
    }
    return { storageKey, ...stored };
  }

  const request: StoredDurableRequest = {
    requestJson,
    id: crypto.randomUUID(),
  };
  try {
    storage.setItem(storageKey, JSON.stringify(request));
  } catch {
    throw unavailable(label, "state cannot be saved");
  }
  const persisted = readStoredRequest(storage, storageKey, label);
  if (persisted?.requestJson !== request.requestJson || persisted.id !== request.id) {
    throw unavailable(label, "state was not saved exactly");
  }
  return { storageKey, ...request };
}

export function clearDurableRequest(request: DurableRequest, label: string): void {
  const storage = requestStorage(label);
  const stored = readStoredRequest(storage, request.storageKey, label);
  if (
    stored?.requestJson !== request.requestJson ||
    stored.id !== request.id
  ) {
    throw unavailable(label, "state changed before it could be cleared");
  }
  try {
    storage.removeItem(request.storageKey);
  } catch {
    throw unavailable(label, "state could not be cleared");
  }
  if (readStoredRequest(storage, request.storageKey, label) !== null) {
    throw unavailable(label, "state was not cleared");
  }
}
