import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  ExecuteRentalPlacementParams,
  FindRentalPlacementsParams,
  GetRentalPlacementParams,
  RentalPlacement,
} from "../types/rentalPlacement";

export const createRentalPlacementApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/rental-placements`;

  return {
    find(
      params: FindRentalPlacementsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<RentalPlacement>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<RentalPlacement>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    get(params: GetRentalPlacementParams, options?: RequestOptions): Promise<RentalPlacement> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<RentalPlacement>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    execute(
      params: ExecuteRentalPlacementParams,
      options?: RequestOptions,
    ): Promise<RentalPlacement> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.post<RentalPlacement>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/commands`,
        payload,
        options,
      );
    },
  };
};
