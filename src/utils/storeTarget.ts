const canonicalStoreId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function requireStoreId(value: unknown): string {
  if (typeof value !== "string" || !canonicalStoreId.test(value)) {
    throw new TypeError("A Store target must be an explicit canonical UUID-v4");
  }
  return value;
}
