import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  CreateShippingMethodParams,
  DeleteShippingMethodParams,
  FindShippingMethodsParams,
  ShippingMethod,
  UpdateShippingMethodParams,
} from "../types/shipping";
import type { StoreRecordByKeyParams, StoreRecordParams } from "../types/market";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

const collection = "shipping-methods";

export const createShippingMethodApi = (apiConfig: ApiConfig) => ({
  find(params: FindShippingMethodsParams, options?: RequestOptions): Promise<PaginatedResponse<ShippingMethod>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<ShippingMethod>>(storePath(store_id, collection), { ...options, params: query });
  },

  get(params: StoreRecordParams, options?: RequestOptions): Promise<ShippingMethod> {
    return apiConfig.httpClient.get<ShippingMethod>(storeRecordPath(params.store_id, collection, params.id), options);
  },

  getByKey(params: StoreRecordByKeyParams, options?: RequestOptions): Promise<ShippingMethod> {
    return apiConfig.httpClient.get<ShippingMethod>(storePath(params.store_id, `${collection}/by-key/${segment(params.key)}`), options);
  },

  create(params: CreateShippingMethodParams, options?: RequestOptions): Promise<ShippingMethod> {
    requireId(params.id, "shipping method");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<ShippingMethod>(storePath(store_id, collection), body, options);
  },

  update(params: UpdateShippingMethodParams, options?: RequestOptions): Promise<ShippingMethod> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<ShippingMethod>(storeRecordPath(store_id, collection, id), body, options);
  },

  delete(params: DeleteShippingMethodParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(storeRecordPath(params.store_id, collection, params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
