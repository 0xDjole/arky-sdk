import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  CreateManualInventoryReservationParams,
  FindInventoryReservationsParams,
  GetInventoryReservationParams,
  InventoryReservation,
  ReleaseManualInventoryReservationParams,
} from "../types/inventory";

export const createInventoryReservationApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/inventory-reservations`;

  return {
    create(
      params: CreateManualInventoryReservationParams,
      options?: RequestOptions,
    ): Promise<InventoryReservation> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<InventoryReservation>(basePath(store_id), payload, options);
    },
    get(
      params: GetInventoryReservationParams,
      options?: RequestOptions,
    ): Promise<InventoryReservation> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<InventoryReservation>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindInventoryReservationsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<InventoryReservation>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<InventoryReservation>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    release(
      params: ReleaseManualInventoryReservationParams,
      options?: RequestOptions,
    ): Promise<InventoryReservation> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.post<InventoryReservation>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/release`,
        payload,
        options,
      );
    },
  };
};
