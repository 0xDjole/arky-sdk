import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateStoreLocationParams,
  DeleteStoreLocationParams,
  FindStoreLocationsParams,
  LocationCountry,
  StoreLocation,
  StoreRecordByKeyParams,
  StoreRecordParams,
  UpdateStoreLocationParams,
} from "../types/market";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

export interface GetCountriesResponse {
  items: LocationCountry[];
  cursor: string | null;
}

export const createLocationApi = (apiConfig: ApiConfig) => ({
  getCountries(options?: RequestOptions): Promise<GetCountriesResponse> {
    return apiConfig.httpClient.get<GetCountriesResponse>("/v1/platform/countries", options);
  },

  getCountry(countryCode: string, options?: RequestOptions): Promise<LocationCountry> {
    return apiConfig.httpClient.get<LocationCountry>(`/v1/platform/countries/${segment(countryCode)}`, options);
  },

  list(params: FindStoreLocationsParams, options?: RequestOptions): Promise<PaginatedResponse<StoreLocation>> {
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
