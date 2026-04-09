import type { ApiConfig } from "../index";
import type {
  CreateZoneParams,
  DeleteZoneParams,
  RequestOptions,
  UpdateZoneParams,
} from "../types/api";
import type { Zone } from "../types";

// Zones are now their own entity (their own table) and are no longer embedded
// in BusinessConfigs. Reads and writes go through these endpoints.
export const createZoneApi = (apiConfig: ApiConfig) => {
  return {
    async list(options?: RequestOptions): Promise<Zone[]> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/zones`,
        options,
      );
    },

    async get(id: string, options?: RequestOptions): Promise<Zone> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/zones/${id}`,
        options,
      );
    },

    async create(
      params: CreateZoneParams,
      options?: RequestOptions,
    ): Promise<Zone> {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/zones`,
        { ...params, businessId: apiConfig.businessId },
        options,
      );
    },

    async update(
      params: UpdateZoneParams,
      options?: RequestOptions,
    ): Promise<Zone> {
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/zones/${params.id}`,
        { ...params, businessId: apiConfig.businessId },
        options,
      );
    },

    async delete(
      params: DeleteZoneParams,
      options?: RequestOptions,
    ): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/zones/${params.id}`,
        options,
      );
    },
  };
};
