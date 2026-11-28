import { requireTenantId } from "../utils/tenantTarget";

export function segment(value: string): string {
  return encodeURIComponent(value);
}

export const storefrontBase = "/v1/storefront";

export function tenantPath(tenantId: string, path: string): string {
  return `/v1/tenants/${requireTenantId(tenantId)}/${path}`;
}

export function tenantRecordPath(tenantId: string, collection: string, id: string): string {
  return `${tenantPath(tenantId, collection)}/${segment(id)}`;
}
