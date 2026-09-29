const canonicalRequestId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function requireRequestId(value: unknown): string {
  if (typeof value !== "string" || !canonicalRequestId.test(value)) {
    throw new TypeError("A business request requires the caller's canonical UUID-v4 request_id");
  }
  return value;
}
