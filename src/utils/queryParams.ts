export type QueryParams = object;

export function buildQueryString(params: QueryParams): string {
  const queryParts = Object.entries(params as Record<string, unknown>).flatMap(
    ([key, value]) => {
      if (value === null || value === undefined) return [];
      if (typeof value === "string") {
        return [`${key}=${encodeURIComponent(value)}`];
      }
      if (typeof value === "number" || typeof value === "boolean") {
        return [`${key}=${value}`];
      }
      if (Array.isArray(value) || typeof value === "object") {
        return [`${key}=${encodeURIComponent(JSON.stringify(value))}`];
      }
      return [];
    },
  );

  return queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
}

export function appendQueryString(url: string, params: QueryParams): string {
  const queryString = buildQueryString(params);
  return queryString ? `${url}${queryString}` : url;
}
