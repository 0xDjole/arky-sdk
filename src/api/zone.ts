import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  Zone,
  CreateZoneParams,
  UpdateZoneParams,
  GetZoneParams,
  GetZoneByKeyParams,
  FindZonesParams,
  DeleteZoneParams,
} from "../types/zone";

export const createZoneApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/zones`;

  return {
    create(params: CreateZoneParams, options?: RequestOptions): Promise<Zone> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Zone>(basePath(store_id), payload, options);
    },
    update(params: UpdateZoneParams, options?: RequestOptions): Promise<Zone> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<Zone>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(params: GetZoneParams, options?: RequestOptions): Promise<Zone> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<Zone>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    getByKey(params: GetZoneByKeyParams, options?: RequestOptions): Promise<Zone> {
      const { store_id, key } = params;
      return apiConfig.httpClient.get<Zone>(`${basePath(store_id)}/by-key/${encodeURIComponent(key)}`, options);
    },
    find(
      params: FindZonesParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Zone>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Zone>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    delete(params: DeleteZoneParams, options?: RequestOptions): Promise<Zone> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<Zone>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
