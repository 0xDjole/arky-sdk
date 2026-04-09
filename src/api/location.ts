import type { ApiConfig } from "../index";
import type {
  CreateLocationParams,
  DeleteLocationParams,
  RequestOptions,
  UpdateLocationParams,
} from "../types/api";
import type { Location } from "../types";

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
      return apiConfig.httpClient.get(`/v1/platform/countries`, options);
    },

    async getCountry(
      countryCode: string,
      options?: RequestOptions,
    ): Promise<LocationCountry> {
      return apiConfig.httpClient.get(
        `/v1/platform/countries/${countryCode}`,
        options,
      );
    },

    // Business location CRUD. Locations are now first-class entities (their own
    // table) and are no longer embedded in BusinessConfigs. Reads and writes go
    // through these endpoints.
    async list(options?: RequestOptions): Promise<Location[]> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/locations`,
        options,
      );
    },

    async get(id: string, options?: RequestOptions): Promise<Location> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/locations/${id}`,
        options,
      );
    },

    async create(
      params: CreateLocationParams,
      options?: RequestOptions,
    ): Promise<Location> {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/locations`,
        { ...params, businessId: apiConfig.businessId },
        options,
      );
    },

    async update(
      params: UpdateLocationParams,
      options?: RequestOptions,
    ): Promise<Location> {
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/locations/${params.id}`,
        { ...params, businessId: apiConfig.businessId },
        options,
      );
    },

    async delete(
      params: DeleteLocationParams,
      options?: RequestOptions,
    ): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/locations/${params.id}`,
        options,
      );
    },
  };
};
