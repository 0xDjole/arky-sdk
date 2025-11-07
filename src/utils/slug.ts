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
 * Auto-format slug queries with businessId:locale:slug pattern for SEO-enabled entities
 *
 * **ONLY use this for entities with SEO support:**
 * - Product (has seo.slug)
 * - Service (has seo.slug)
 * - Collection (has seo.slug)
 * - Entry (has seo.slug)
 *
 * **DO NOT use for:**
 * - Order (UUID only)
 * - Reservation (UUID only)
 * - Provider (UUID only)
 *
 * @param id - The ID or slug to format
 * @param apiConfig - The API configuration containing businessId and locale
 * @returns Formatted ID string
 *
 * Rules:
 * - If it's a UUID, return as-is
 * - If it already contains colons (pre-formatted), return as-is
 * - Otherwise, format as businessId:locale:slug
 *
 * @example
 * // UUID - returns unchanged
 * formatIdOrSlug("123e4567-e89b-12d3-a456-426614174000", config)
 * // => "123e4567-e89b-12d3-a456-426614174000"
 *
 * // Pre-formatted - returns unchanged
 * formatIdOrSlug("myBusiness:en:website", config)
 * // => "myBusiness:en:website"
 *
 * // Plain slug - auto-formats with businessId:locale:slug
 * formatIdOrSlug("website", config)
 * // => "businessId:en:website"
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
