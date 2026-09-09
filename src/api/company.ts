import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  Company,
  CreateCompanyParams,
  GetCompanyParams,
  FindCompaniesParams,
  DeleteCompanyParams,
  UpdateCompanyParams,
  CompanyUsage,
} from "../types/company";

export const createCompanyApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/companies`;
  return {
    create(
      params: CreateCompanyParams,
      options?: RequestOptions,
    ): Promise<Company> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Company>(
        basePath(store_id),
        payload,
        options,
      );
    },
    get(params: GetCompanyParams, options?: RequestOptions): Promise<Company> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<Company>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindCompaniesParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Company>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Company>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    update(
      params: UpdateCompanyParams,
      options?: RequestOptions,
    ): Promise<Company> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<Company>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    delete(
      params: DeleteCompanyParams,
      options?: RequestOptions,
    ): Promise<Company> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.delete<Company>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: query },
      );
    },
    usage(
      params: GetCompanyParams,
      options?: RequestOptions,
    ): Promise<CompanyUsage> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<CompanyUsage>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/usage`,
        options,
      );
    },
  };
};
