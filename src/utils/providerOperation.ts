export interface ProviderOperation {
  storageKey: string;
  request_json: string;
  operation_id: string;
}

type StoredProviderOperation = Omit<ProviderOperation, "storageKey">;

export class ProviderOperationStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderOperationStorageError";
  }
}

function operationStorage(label: string): Storage {
  try {
    const storage = globalThis.localStorage;
    if (!storage) throw new Error("localStorage is unavailable");
    return storage;
  } catch {
    throw new ProviderOperationStorageError(
      `Cannot safely start ${label} because persistent operation storage is unavailable`,
    );
  }
}

function readStoredOperation(
  storage: Storage,
  storageKey: string,
  label: string,
): StoredProviderOperation | null {
  let raw: string | null;
  try {
    raw = storage.getItem(storageKey);
  } catch {
    throw new ProviderOperationStorageError(
      `Cannot safely start ${label} because its operation state cannot be read`,
    );
  }
  if (raw === null) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new ProviderOperationStorageError(
      `Cannot safely start ${label} because its saved operation state is corrupt`,
    );
  }
  if (
    typeof value !== "object" ||
    value === null ||
    Object.keys(value).length !== 2 ||
    typeof (value as Record<string, unknown>).request_json !== "string" ||
    !(value as Record<string, unknown>).request_json ||
    typeof (value as Record<string, unknown>).operation_id !== "string" ||
    !(value as Record<string, unknown>).operation_id
  ) {
    throw new ProviderOperationStorageError(
      `Cannot safely start ${label} because its saved operation state is invalid`,
    );
  }
  try {
    JSON.parse((value as Record<string, string>).request_json);
  } catch {
    throw new ProviderOperationStorageError(
      `Cannot safely start ${label} because its saved request is corrupt`,
    );
  }

  return value as StoredProviderOperation;
}

function serializeRequest(request: unknown, label: string): string {
  try {
    const serialized = JSON.stringify(request);
    if (!serialized) throw new Error("Request is not JSON serializable");
    return serialized;
  } catch {
    throw new ProviderOperationStorageError(
      `Cannot safely start ${label} because its request cannot be persisted`,
    );
  }
}

export function readProviderOperation(
  storageKey: string,
  label: string,
): ProviderOperation | null {
  const stored = readStoredOperation(operationStorage(label), storageKey, label);
  return stored ? { storageKey, ...stored } : null;
}

export function providerOperationRequest(
  operation: ProviderOperation,
): unknown {
  return JSON.parse(operation.request_json);
}

export async function withProviderOperationLock<T>(
  storageKey: string,
  label: string,
  task: () => Promise<T>,
): Promise<T> {
  let lockManager: LockManager;
  try {
    lockManager = globalThis.navigator.locks;
    if (!lockManager) throw new Error("Web Locks are unavailable");
  } catch {
    throw new ProviderOperationStorageError(
      `Cannot safely start ${label} because cross-tab operation locking is unavailable`,
    );
  }

  let callbackEntered = false;
  try {
    return await lockManager.request(
      `arky:provider-operation:${storageKey}`,
      { mode: "exclusive", ifAvailable: true },
      async (lock) => {
        callbackEntered = true;
        if (!lock) {
          throw new ProviderOperationStorageError(
            `Cannot start ${label} while it is already running in another tab`,
          );
        }
        return task();
      },
    );
  } catch (error) {
    if (callbackEntered) throw error;
    throw new ProviderOperationStorageError(
      `Cannot safely start ${label} because its cross-tab lock could not be acquired`,
    );
  }
}

export function providerOperationFor(
  storageKey: string,
  request: unknown,
  label: string,
): ProviderOperation {
  const storage = operationStorage(label);
  const request_json = serializeRequest(request, label);
  const stored = readStoredOperation(storage, storageKey, label);
  if (stored) {
    if (stored.request_json !== request_json) {
      throw new ProviderOperationStorageError(
        `Cannot start ${label} while a different saved operation still needs review`,
      );
    }
    return { storageKey, ...stored };
  }

  const operation: StoredProviderOperation = {
    request_json,
    operation_id: crypto.randomUUID(),
  };
  try {
    storage.setItem(storageKey, JSON.stringify(operation));
  } catch {
    throw new ProviderOperationStorageError(
      `Cannot safely start ${label} because its operation state cannot be saved`,
    );
  }

  const persisted = readStoredOperation(storage, storageKey, label);
  if (
    persisted?.request_json !== operation.request_json ||
    persisted.operation_id !== operation.operation_id
  ) {
    throw new ProviderOperationStorageError(
      `Cannot safely start ${label} because its operation state was not saved`,
    );
  }
  return { storageKey, ...operation };
}

export function clearProviderOperation(
  operation: ProviderOperation,
  label: string,
): void {
  const storage = operationStorage(label);
  const stored = readStoredOperation(storage, operation.storageKey, label);
  if (stored === null) {
    throw new ProviderOperationStorageError(
      `${label} completed, but its saved operation state is missing`,
    );
  }
  if (
    stored.request_json !== operation.request_json ||
    stored.operation_id !== operation.operation_id
  ) {
    throw new ProviderOperationStorageError(
      `Cannot clear ${label} because its saved operation state changed`,
    );
  }

  try {
    storage.removeItem(operation.storageKey);
  } catch {
    throw new ProviderOperationStorageError(
      `${label} completed, but its saved operation state could not be cleared`,
    );
  }
  if (readStoredOperation(storage, operation.storageKey, label) !== null) {
    throw new ProviderOperationStorageError(
      `${label} completed, but its saved operation state was not cleared`,
    );
  }
}
