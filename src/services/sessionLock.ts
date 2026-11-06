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
  const previous = queues.get(key) ?? Promise.resolve();
  const current = previous.catch(() => {}).then(operation);
  queues.set(key, current);
  try {
    return await current;
  } finally {
    if (queues.get(key) === current) queues.delete(key);
  }
}
