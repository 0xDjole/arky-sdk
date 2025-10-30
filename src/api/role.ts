import type { ApiConfig } from "../index";
import type {
  CreateRoleParams,
  UpdateRoleParams,
  DeleteRoleParams,
  GetRoleParams,
  GetRolesParams,
  RequestOptions,
} from "../types/api";

export const createRoleApi = (apiConfig: ApiConfig) => {
  return {
    async createRole(
      params: CreateRoleParams,
      options?: RequestOptions
    ): Promise<void> {
      return apiConfig.httpClient.post(`/v1/roles`, params, options);
    },

    async updateRole(params: UpdateRoleParams, options?: RequestOptions) {
      return apiConfig.httpClient.put(
        `/v1/roles/${params.id}`,
        params,
        options
      );
    },

    async deleteRole(params: DeleteRoleParams, options?: RequestOptions) {
      return apiConfig.httpClient.delete(`/v1/roles/${params.id}`, options);
    },

    async getRole(params: GetRoleParams, options?: RequestOptions) {
      return apiConfig.httpClient.get(`/v1/roles/${params.id}`, options);
    },

    async getRoles(params: GetRolesParams, options?: RequestOptions) {
      return apiConfig.httpClient.get(`/v1/roles`, {
        ...options,
        params: {
          action: params.action,
          businessId: apiConfig.businessId,
        },
      });
    },
  };
};
