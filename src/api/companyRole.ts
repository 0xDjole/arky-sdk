import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  CompanyRole,
  CreateCompanyRoleParams,
  GetCompanyRoleParams,
  FindCompanyRolesParams,
  DeleteCompanyRoleParams,
  UpdateCompanyRoleParams,
  CompanyRoleUsage,
} from "../types/companyRole";

export const createCompanyRoleApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/company-roles`;
  return {
    create(
      params: CreateCompanyRoleParams,
      options?: RequestOptions,
    ): Promise<CompanyRole> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<CompanyRole>(
        basePath(store_id),
        payload,
        options,
      );
    },
    get(
      params: GetCompanyRoleParams,
      options?: RequestOptions,
    ): Promise<CompanyRole> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<CompanyRole>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: query },
      );
    },
    find(
      params: FindCompanyRolesParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CompanyRole>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CompanyRole>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    update(
      params: UpdateCompanyRoleParams,
      options?: RequestOptions,
    ): Promise<CompanyRole> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<CompanyRole>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    delete(
      params: DeleteCompanyRoleParams,
      options?: RequestOptions,
    ): Promise<CompanyRole> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.delete<CompanyRole>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: query },
      );
    },
    usage(
      params: GetCompanyRoleParams,
      options?: RequestOptions,
    ): Promise<CompanyRoleUsage> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<CompanyRoleUsage>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/usage`,
        { ...options, params: query },
      );
    },
  };
};
