import type { ApiConfig } from "../index";

/**
 * Entities that support SEO slugs (have seo.slug field in their schema)
 * Only these entities can use slug-based queries with locale
 */
export type SeoEnabledEntity = "product" | "service" | "collection" | "entry";

/**
 * Entities that ONLY support UUID-based queries (no SEO slugs)
 */
export type UuidOnlyEntity = "order" | "reservation" | "provider";

/**
 * Check if a string is a valid UUID (v4 format)
 */
export const isUuid = (str: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * @deprecated This function is no longer needed. The server now handles
 * ID format detection automatically. Just pass the ID directly to API methods.
 *
 * The server supports:
 * - UUID: Direct primary key lookup
 * - Slug (businessId:locale:slug): SEO slug lookup
 * - Plain key: Key-based lookup (for entities with key indexes like Node)
 *
 * @param id - The ID or slug to format
 * @param apiConfig - The API configuration containing businessId and locale
 * @returns Formatted ID string
 */
export const formatIdOrSlug = (id: string, apiConfig: ApiConfig): string => {
  // If it's already a UUID, return as-is
  if (isUuid(id)) {
    return id;
  }

  // If it already contains colons, assume it's already formatted
  if (id.includes(":")) {
    return id;
  }

  // Otherwise, format as businessId:locale:slug
  return `${apiConfig.businessId}:${apiConfig.locale}:${id}`;
};
