import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  CreateShippingProfileParams,
  DeleteShippingProfileParams,
  FindShippingProfilesParams,
  ShippingProfile,
  UpdateShippingProfileParams,
} from "../types/shipping";
import type { StoreRecordByKeyParams, StoreRecordParams } from "../types/market";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

const collection = "shipping-profiles";

export const createShippingProfileApi = (apiConfig: ApiConfig) => ({
  find(params: FindShippingProfilesParams, options?: RequestOptions): Promise<PaginatedResponse<ShippingProfile>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<ShippingProfile>>(storePath(store_id, collection), { ...options, params: query });
  },

  get(params: StoreRecordParams, options?: RequestOptions): Promise<ShippingProfile> {
    return apiConfig.httpClient.get<ShippingProfile>(storeRecordPath(params.store_id, collection, params.id), options);
  },

  getByKey(params: StoreRecordByKeyParams, options?: RequestOptions): Promise<ShippingProfile> {
    return apiConfig.httpClient.get<ShippingProfile>(storePath(params.store_id, `${collection}/by-key/${segment(params.key)}`), options);
  },

  create(params: CreateShippingProfileParams, options?: RequestOptions): Promise<ShippingProfile> {
    requireId(params.id, "shipping profile");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<ShippingProfile>(storePath(store_id, collection), body, options);
  },

  update(params: UpdateShippingProfileParams, options?: RequestOptions): Promise<ShippingProfile> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<ShippingProfile>(storeRecordPath(store_id, collection, id), body, options);
  },

  delete(params: DeleteShippingProfileParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(storeRecordPath(params.store_id, collection, params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
