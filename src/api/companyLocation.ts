import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  CompanyLocation,
  CreateCompanyLocationParams,
  GetCompanyLocationParams,
  FindCompanyLocationsParams,
  DeleteCompanyLocationParams,
  UpdateCompanyLocationParams,
} from "../types/companyLocation";

export const createCompanyLocationApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/company-locations`;
  return {
    create(
      params: CreateCompanyLocationParams,
      options?: RequestOptions,
    ): Promise<CompanyLocation> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<CompanyLocation>(
        basePath(store_id),
        payload,
        options,
      );
    },
    get(
      params: GetCompanyLocationParams,
      options?: RequestOptions,
    ): Promise<CompanyLocation> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<CompanyLocation>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindCompanyLocationsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CompanyLocation>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CompanyLocation>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    update(
      params: UpdateCompanyLocationParams,
      options?: RequestOptions,
    ): Promise<CompanyLocation> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<CompanyLocation>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    delete(
      params: DeleteCompanyLocationParams,
      options?: RequestOptions,
    ): Promise<CompanyLocation> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.delete<CompanyLocation>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: query },
      );
    },
  };
};
