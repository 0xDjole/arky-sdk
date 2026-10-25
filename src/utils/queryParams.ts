export type QueryParams = object;

export function buildQueryString(params: QueryParams): string {
  const entries = Object.entries(params as Record<string, unknown>).filter(
    ([, value]) => value !== null && value !== undefined,
  );
  const queryParts = entries.flatMap(
    ([key, value]) => {
      const encodedKey = encodeURIComponent(key);
      if (!key) throw new TypeError("Query names must be nonempty");
      if (typeof value === "string") {
        return [`${encodedKey}=${encodeURIComponent(value)}`];
      }
      if (typeof value === "number" || typeof value === "boolean") {
        if (typeof value === "number" && !Number.isFinite(value)) {
          throw new TypeError(`Query field ${key} requires a finite number`);
        }
        return [`${encodedKey}=${value}`];
      }
      if (Array.isArray(value) || typeof value === "object") {
        const json = JSON.stringify(value);
        if (new TextEncoder().encode(json).length > 32 * 1024) {
          throw new TypeError(`Structured query field ${key} exceeds 32 KiB`);
        }
        return [`${encodedKey}=${encodeURIComponent(json)}`];
      }
      throw new TypeError(`Unsupported query value for ${key}`);
    },
  );

  const query = queryParts.join("&");
  return query ? `?${query}` : "";
}
