import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  ExecuteRentalParams,
  FindRentalsParams,
  GetRentalParams,
  Rental,
  RentalDetail,
} from "../types/rental";

export const createRentalApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/rentals`;

  return {
    find(
      params: FindRentalsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Rental>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Rental>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    get(params: GetRentalParams, options?: RequestOptions): Promise<RentalDetail> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<RentalDetail>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    execute(params: ExecuteRentalParams, options?: RequestOptions): Promise<Rental> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.post<Rental>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/commands`,
        payload,
        options,
      );
    },
  };
};
