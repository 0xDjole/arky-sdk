import type { ApiConfig } from "../index";
import type { RequestOptions } from "../types/api";

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
      return apiConfig.httpClient.get(`/v1/platform/location/countries`, options);
    },

    async getCountryStates(
      countryCode: string,
      options?: RequestOptions
    ): Promise<LocationCountry> {
      return apiConfig.httpClient.get(
        `/v1/platform/location/countries/${countryCode}/states`,
        options
      );
    },
  };
};
