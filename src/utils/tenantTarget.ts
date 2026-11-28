import { isCanonicalId } from "./ids";

export function requireTenantId(value: unknown): string {
  if (!isCanonicalId(value)) {
    throw new TypeError("A Tenant target must be an explicit canonical UUID-v4");
  }
  return value;
}
