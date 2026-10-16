import { isCanonicalId } from "./ids";

export function requireStoreId(value: unknown): string {
  if (!isCanonicalId(value)) {
    throw new TypeError("A Store target must be an explicit canonical UUID-v4");
  }
  return value;
}
