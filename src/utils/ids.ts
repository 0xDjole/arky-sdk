const canonicalUuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function isCanonicalId(value: unknown): value is string {
  return typeof value === "string" && canonicalUuidV4.test(value);
}

export function requireId(value: unknown, label = "record"): string {
  if (!isCanonicalId(value)) {
    throw new TypeError(`The ${label} id must be a canonical UUID v4 picked by the app`);
  }
  return value;
}
