import { requireStoreId } from "../utils/storeTarget";
import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type { BranchMinimumProgress, GetBranchMinimumProgressParams } from "../types/minimumProgress";
import type {
  CompanyLocation,
  CreateCompanyLocationParams,
  GetCompanyLocationParams,
  FindCompanyLocationsParams,
  DeleteCompanyLocationParams,
  UpdateCompanyLocationParams,
  SetCompanyLocationCommercePolicyParams,
  SetCompanyLocationServedFromParams,
} from "../types/companyLocation";

export const createCompanyLocationApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId: string) =>
    `/v1/stores/${encodeURIComponent(requireStoreId(storeId))}/company-locations`;
  return {
    minimumProgress(
      params: GetBranchMinimumProgressParams,
      options?: RequestOptions,
    ): Promise<BranchMinimumProgress> {
      const { store_id, company_id, company_location_id } = params;
      return apiConfig.httpClient.get<BranchMinimumProgress>(
        `/v1/stores/${encodeURIComponent(requireStoreId(store_id))}/companies/${encodeURIComponent(company_id)}/locations/${encodeURIComponent(company_location_id)}/minimum-progress`,
        options,
      );
    },
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
      params: FindCompanyLocationsParams,
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
    setCommercePolicy(
      params: SetCompanyLocationCommercePolicyParams,
      options?: RequestOptions,
    ): Promise<CompanyLocation> {
      const { store_id, id, expected_updated_at, commerce } = params;
      return apiConfig.httpClient.put<CompanyLocation>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/commerce`,
        { expected_updated_at, commerce },
        options,
      );
    },
    setServedFrom(
      params: SetCompanyLocationServedFromParams,
      options?: RequestOptions,
    ): Promise<CompanyLocation> {
      const { store_id, id, expected_updated_at, fulfillment_store_location_id } = params;
      return apiConfig.httpClient.put<CompanyLocation>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/served-from`,
        { expected_updated_at, fulfillment_store_location_id },
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
