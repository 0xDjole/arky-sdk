import type { ApiConfig } from "../index";

export type SeoEnabledEntity = "product" | "service" | "collection" | "entry";

export type UuidOnlyEntity = "order" | "reservation" | "provider";

export const isUuid = (str: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const formatIdOrSlug = (id: string, apiConfig: ApiConfig): string => {
  
  if (isUuid(id)) {
    return id;
  }

  if (id.includes(":")) {
    return id;
  }

  return `${apiConfig.businessId}:${apiConfig.locale}:${id}`;
};
