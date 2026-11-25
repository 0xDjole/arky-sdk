import { ArkyError } from "../types/apiError";

const queues = new Map<string, Promise<unknown>>();

export async function exclusive<T>(key: string, operation: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 35_000);
    try {
      return await navigator.locks.request(key, { signal: controller.signal }, operation);
    } finally {
      clearTimeout(timer);
    }
  }
  if (typeof window !== "undefined") {
    throw new ArkyError("storage", "This browser has no Web Locks, so the session can't be refreshed in one tab at a time");
  }
  const previous = queues.get(key) ?? Promise.resolve();
  const current = previous.then(operation, operation);
  queues.set(key, current);
  try {
    return await current;
  } finally {
    if (queues.get(key) === current) queues.delete(key);
  }
}
