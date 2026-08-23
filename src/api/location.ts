import type { ApiConfig } from "../services/clientTypes";
import type {
  CreateStoreLocationParams,
  DeleteStoreLocationParams,
  RequestOptions,
  UpdateStoreLocationParams,
} from "../types/api";
import type { StoreLocation } from "../types";

export interface LocationState {
  code: string;
  name: string;
}

export interface LocationCountry {
  code: string;
  name: string;
  states: LocationState[];
}

export interface GetCountriesResponse {
  items: LocationCountry[];
  cursor: string | null;
}

export const createLocationApi = (apiConfig: ApiConfig) => {
  return {
    async getCountries(options?: RequestOptions): Promise<GetCountriesResponse> {
      return apiConfig.httpClient.get<GetCountriesResponse>(`/v1/platform/countries`, options);
    },

    async getCountry(
      countryCode: string,
      options?: RequestOptions,
    ): Promise<LocationCountry> {
      return apiConfig.httpClient.get<LocationCountry>(
        `/v1/platform/countries/${countryCode}`,
        options,
      );
    },


    async list(options?: RequestOptions): Promise<StoreLocation[]> {
      return apiConfig.httpClient.get<StoreLocation[]>(
        `/v1/stores/${apiConfig.storeId}/locations`,
        options,
      );
    },

    async get(id: string, options?: RequestOptions): Promise<StoreLocation> {
      return apiConfig.httpClient.get<StoreLocation>(
        `/v1/stores/${apiConfig.storeId}/locations/${id}`,
        options,
      );
    },

    async create(
      params: CreateStoreLocationParams,
      options?: RequestOptions,
    ): Promise<StoreLocation> {
      return apiConfig.httpClient.post<StoreLocation>(
        `/v1/stores/${apiConfig.storeId}/locations`,
        { ...params, store_id: apiConfig.storeId },
        options,
      );
    },

    async update(
      params: UpdateStoreLocationParams,
      options?: RequestOptions,
    ): Promise<StoreLocation> {
      return apiConfig.httpClient.put<StoreLocation>(
        `/v1/stores/${apiConfig.storeId}/locations/${params.id}`,
        { ...params, store_id: apiConfig.storeId },
        options,
      );
    },

    async delete(
      params: DeleteStoreLocationParams,
      options?: RequestOptions,
    ): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${apiConfig.storeId}/locations/${params.id}`,
        options,
      );
    },
  };
};
