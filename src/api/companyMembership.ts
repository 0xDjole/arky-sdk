import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  CompanyMembership,
  CreateCompanyMembershipParams,
  GetCompanyMembershipParams,
  FindCompanyMembershipsParams,
  DeleteCompanyMembershipParams,
  UpdateCompanyMembershipParams,
} from "../types/companyMembership";

export const createCompanyMembershipApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/company-memberships`;
  return {
    create(
      params: CreateCompanyMembershipParams,
      options?: RequestOptions,
    ): Promise<CompanyMembership> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<CompanyMembership>(
        basePath(store_id),
        payload,
        options,
      );
    },
    get(
      params: GetCompanyMembershipParams,
      options?: RequestOptions,
    ): Promise<CompanyMembership> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<CompanyMembership>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindCompanyMembershipsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CompanyMembership>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CompanyMembership>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    update(
      params: UpdateCompanyMembershipParams,
      options?: RequestOptions,
    ): Promise<CompanyMembership> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<CompanyMembership>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    delete(
      params: DeleteCompanyMembershipParams,
      options?: RequestOptions,
    ): Promise<CompanyMembership> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.delete<CompanyMembership>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: query },
      );
    },
  };
};
