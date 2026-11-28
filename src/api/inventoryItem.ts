import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  CreateInventoryItemParams,
  DeleteInventoryItemParams,
  FindInventoryItemsParams,
  GetInventoryItemByKeyParams,
  GetInventoryItemParams,
  InventoryItem,
  UpdateInventoryItemParams,
} from "../types/inventory";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

const collection = "inventory-items";

export const createInventoryItemApi = (apiConfig: ApiConfig) => ({
  create(params: CreateInventoryItemParams, options?: RequestOptions): Promise<InventoryItem> {
    requireId(params.id, "inventory item");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<InventoryItem>(tenantPath(tenant_id, collection), body, options);
  },

  update(params: UpdateInventoryItemParams, options?: RequestOptions): Promise<InventoryItem> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<InventoryItem>(tenantRecordPath(tenant_id, collection, id), body, options);
  },

  get(params: GetInventoryItemParams, options?: RequestOptions): Promise<InventoryItem> {
    return apiConfig.httpClient.get<InventoryItem>(tenantRecordPath(params.tenant_id, collection, params.id), options);
  },

  getByKey(params: GetInventoryItemByKeyParams, options?: RequestOptions): Promise<InventoryItem> {
    return apiConfig.httpClient.get<InventoryItem>(
      tenantPath(params.tenant_id, `${collection}/by-key/${segment(params.key)}`),
      options,
    );
  },

  find(params: FindInventoryItemsParams, options?: RequestOptions): Promise<PaginatedResponse<InventoryItem>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<InventoryItem>>(tenantPath(tenant_id, collection), {
      ...options,
      params: query,
    });
  },

  delete(params: DeleteInventoryItemParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(tenantRecordPath(params.tenant_id, collection, params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
