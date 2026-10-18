import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateStoreLocationParams,
  DeleteStoreLocationParams,
  FindStoreLocationsParams,
  GetCountryParams,
  LocationCountry,
  StoreLocation,
  StoreRecordByKeyParams,
  StoreRecordParams,
  UpdateStoreLocationParams,
} from "../types/market";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

export const createCountryApi = (apiConfig: ApiConfig) => ({
  find(options?: RequestOptions): Promise<PaginatedResponse<LocationCountry>> {
    return apiConfig.httpClient.get<PaginatedResponse<LocationCountry>>("/v1/platform/countries", options);
  },

  get(params: GetCountryParams, options?: RequestOptions): Promise<LocationCountry> {
    return apiConfig.httpClient.get<LocationCountry>(`/v1/platform/countries/${segment(params.code)}`, options);
  },
});

export const createLocationApi = (apiConfig: ApiConfig) => ({

  find(params: FindStoreLocationsParams, options?: RequestOptions): Promise<PaginatedResponse<StoreLocation>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<StoreLocation>>(storePath(store_id, "locations"), {
      ...options,
      params: query,
    });
  },

  get(params: StoreRecordParams, options?: RequestOptions): Promise<StoreLocation> {
    return apiConfig.httpClient.get<StoreLocation>(storeRecordPath(params.store_id, "locations", params.id), options);
  },

  getByKey(params: StoreRecordByKeyParams, options?: RequestOptions): Promise<StoreLocation> {
    return apiConfig.httpClient.get<StoreLocation>(
      storePath(params.store_id, `locations/by-key/${segment(params.key)}`),
      options,
    );
  },

  create(params: CreateStoreLocationParams, options?: RequestOptions): Promise<StoreLocation> {
    requireId(params.id, "location");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<StoreLocation>(storePath(store_id, "locations"), body, options);
  },

  update(params: UpdateStoreLocationParams, options?: RequestOptions): Promise<StoreLocation> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<StoreLocation>(storeRecordPath(store_id, "locations", id), body, options);
  },

  delete(params: DeleteStoreLocationParams, options?: RequestOptions): Promise<StoreLocation> {
    return apiConfig.httpClient.delete<StoreLocation>(storeRecordPath(params.store_id, "locations", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
