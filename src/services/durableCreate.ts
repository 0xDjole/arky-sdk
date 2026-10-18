import {
  clearDurableRequest,
  DurableRequestError,
  durableRequestPayload,
  getOrCreateDurableRequest,
  isDefiniteRefusal,
  readDurableRequest,
  withDurableRequestLock,
  type DurableRequest,
} from "../utils/durableRequest";
import { fingerprint } from "../utils/fingerprint";
import { isCanonicalId, requireId } from "../utils/ids";

export interface DurableCreate<T> {
  key: string;
  label: string;
  input: unknown;
  newId: () => string;
  send: (id: string) => Promise<T>;
  confirms: (result: T, id: string) => boolean;
}

interface PendingCreate {
  id: string;
  input: string;
}

function pendingCreate(request: DurableRequest, label: string): PendingCreate {
  const value = durableRequestPayload(request);
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== 2 ||
    !isCanonicalId((value as Record<string, unknown>).id) ||
    typeof (value as Record<string, unknown>).input !== "string"
  ) {
    throw new DurableRequestError("storage", `The saved ${label} can't be read; nothing was sent`);
  }
  return value as PendingCreate;
}

export function durableCreateKey(namespace: string, flow: string, customerId: string, target: string): string {
  return ["arky:pending-create:v1", namespace, flow, encodeURIComponent(customerId), encodeURIComponent(target)].join(":");
}

export function runDurableCreate<T>(create: DurableCreate<T>): Promise<T> {
  return withDurableRequestLock(create.key, create.label, async () => {
    const input = fingerprint(create.input);
    const saved = readDurableRequest(create.key, create.label);
    let kept: { durable: DurableRequest; id: string } | null = null;
    if (saved) {
      const pending = pendingCreate(saved, create.label);
      if (pending.input === input) kept = { durable: saved, id: pending.id };
      else clearDurableRequest(saved, create.label);
    }
    if (!kept) {
      const id = requireId(create.newId(), create.label);
      kept = { durable: getOrCreateDurableRequest(create.key, { id, input }, create.label), id };
    }
    const { durable, id } = kept;
    let result: T;
    try {
      result = await create.send(id);
    } catch (error) {
      if (isDefiniteRefusal(error)) clearDurableRequest(durable, create.label);
      throw error;
    }
    if (!create.confirms(result, id)) {
      throw new DurableRequestError("answer_mismatch", `The ${create.label} answer names another record; the request is kept for a retry`);
    }
    clearDurableRequest(durable, create.label);
    return result;
  });
}
