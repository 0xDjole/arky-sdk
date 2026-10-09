export type QueryParams = object;

export function buildQueryString(params: QueryParams): string {
  const entries = Object.entries(params as Record<string, unknown>).filter(
    ([, value]) => value !== null && value !== undefined,
  );
  if (entries.length > 128) throw new Error("Query exceeds 128 fields");
  const queryParts = entries.flatMap(
    ([key, value]) => {
      const encodedKey = encodeURIComponent(key);
      if (!key) throw new Error("Query names must be nonempty");
      if (typeof value === "string") {
        return [`${encodedKey}=${encodeURIComponent(value)}`];
      }
      if (typeof value === "number" || typeof value === "boolean") {
        if (typeof value === "number" && !Number.isFinite(value)) {
          throw new Error(`Query field ${key} requires a finite number`);
        }
        return [`${encodedKey}=${value}`];
      }
      if (Array.isArray(value) || typeof value === "object") {
        const json = JSON.stringify(value);
        if (new TextEncoder().encode(json).length > 32 * 1024) {
          throw new Error(`Structured query field ${key} exceeds 32 KiB`);
        }
        return [`${encodedKey}=${encodeURIComponent(json)}`];
      }
      throw new Error(`Unsupported query value for ${key}`);
    },
  );

  const query = queryParts.join("&");
  if (query.length > 64 * 1024) throw new Error("Query exceeds 64 KiB");
  return query ? `?${query}` : "";
}

export function appendQueryString(url: string, params: QueryParams): string {
  const queryString = buildQueryString(params);
  return queryString ? `${url}${queryString}` : url;
}
