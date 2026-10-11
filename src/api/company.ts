import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  Company,
  CompanyLocation,
  CompanyMembership,
  CompanyRole,
  CreateCompanyLocationParams,
  CreateCompanyMembershipParams,
  CreateCompanyParams,
  CreateCompanyRoleParams,
  DeleteCompanyLocationParams,
  DeleteCompanyMembershipParams,
  DeleteCompanyParams,
  DeleteCompanyRoleParams,
  FindCompaniesParams,
  FindCompanyLocationsParams,
  FindCompanyMembershipsParams,
  FindCompanyRolesParams,
  GetCompanyLocationParams,
  GetCompanyMembershipParams,
  GetCompanyParams,
  GetCompanyRoleParams,
  ReviewCompanyTaxRegistrationParams,
  SetCompanyLocationFulfillmentParams,
  SetCompanyPurchasingParams,
  SubmitCompanyTaxRegistrationParams,
  UpdateCompanyLocationParams,
  UpdateCompanyMembershipParams,
  UpdateCompanyParams,
  UpdateCompanyRoleParams,
} from "../types/company";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

function taxRegistrationRoutes<T>(apiConfig: ApiConfig, collection: string) {
  return {
    submitTaxRegistration(params: SubmitCompanyTaxRegistrationParams, options?: RequestOptions): Promise<T> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.post<T>(`${storeRecordPath(store_id, collection, id)}/tax/registrations`, body, options);
    },

    reviewTaxRegistration(params: ReviewCompanyTaxRegistrationParams, options?: RequestOptions): Promise<T> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.post<T>(
        `${storeRecordPath(store_id, collection, id)}/tax/registrations/review`,
        body,
        options,
      );
    },

    setPurchasing(params: SetCompanyPurchasingParams, options?: RequestOptions): Promise<T> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.put<T>(`${storeRecordPath(store_id, collection, id)}/purchasing`, body, options);
    },
  };
}

export const createCompanyApi = (apiConfig: ApiConfig) => ({
  find(params: FindCompaniesParams, options?: RequestOptions): Promise<PaginatedResponse<Company>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Company>>(storePath(store_id, "companies"), { ...options, params: query });
  },

  get(params: GetCompanyParams, options?: RequestOptions): Promise<Company> {
    return apiConfig.httpClient.get<Company>(storeRecordPath(params.store_id, "companies", params.id), options);
  },

  create(params: CreateCompanyParams, options?: RequestOptions): Promise<Company> {
    requireId(params.id, "company");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<Company>(storePath(store_id, "companies"), body, options);
  },

  update(params: UpdateCompanyParams, options?: RequestOptions): Promise<Company> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<Company>(storeRecordPath(store_id, "companies", id), body, options);
  },

  delete(params: DeleteCompanyParams, options?: RequestOptions): Promise<Company> {
    return apiConfig.httpClient.delete<Company>(storeRecordPath(params.store_id, "companies", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },

  ...taxRegistrationRoutes<Company>(apiConfig, "companies"),
});

export const createCompanyLocationApi = (apiConfig: ApiConfig) => {
  const locationPath = (storeId: string, id: string) => storeRecordPath(storeId, "company-locations", id);
  return {
    find(params: FindCompanyLocationsParams, options?: RequestOptions): Promise<PaginatedResponse<CompanyLocation>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CompanyLocation>>(storePath(store_id, "company-locations"), {
        ...options,
        params: query,
      });
    },

    get(params: GetCompanyLocationParams, options?: RequestOptions): Promise<CompanyLocation> {
      return apiConfig.httpClient.get<CompanyLocation>(locationPath(params.store_id, params.id), options);
    },

    create(params: CreateCompanyLocationParams, options?: RequestOptions): Promise<CompanyLocation> {
      requireId(params.id, "company location");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<CompanyLocation>(storePath(store_id, "company-locations"), body, options);
    },

    update(params: UpdateCompanyLocationParams, options?: RequestOptions): Promise<CompanyLocation> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.put<CompanyLocation>(locationPath(store_id, id), body, options);
    },

    setFulfillment(params: SetCompanyLocationFulfillmentParams, options?: RequestOptions): Promise<CompanyLocation> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.put<CompanyLocation>(`${locationPath(store_id, id)}/served-from`, body, options);
    },

    ...taxRegistrationRoutes<CompanyLocation>(apiConfig, "company-locations"),

    delete(params: DeleteCompanyLocationParams, options?: RequestOptions): Promise<CompanyLocation> {
      return apiConfig.httpClient.delete<CompanyLocation>(locationPath(params.store_id, params.id), {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },
  };
};

export const createCompanyRoleApi = (apiConfig: ApiConfig) => ({
  find(params: FindCompanyRolesParams, options?: RequestOptions): Promise<PaginatedResponse<CompanyRole>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<CompanyRole>>(storePath(store_id, "company-roles"), {
      ...options,
      params: query,
    });
  },

  get(params: GetCompanyRoleParams, options?: RequestOptions): Promise<CompanyRole> {
    return apiConfig.httpClient.get<CompanyRole>(storeRecordPath(params.store_id, "company-roles", params.id), options);
  },

  create(params: CreateCompanyRoleParams, options?: RequestOptions): Promise<CompanyRole> {
    requireId(params.id, "company role");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<CompanyRole>(storePath(store_id, "company-roles"), body, options);
  },

  update(params: UpdateCompanyRoleParams, options?: RequestOptions): Promise<CompanyRole> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<CompanyRole>(storeRecordPath(store_id, "company-roles", id), body, options);
  },

  delete(params: DeleteCompanyRoleParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(storeRecordPath(params.store_id, "company-roles", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createCompanyMembershipApi = (apiConfig: ApiConfig) => ({
  find(params: FindCompanyMembershipsParams, options?: RequestOptions): Promise<PaginatedResponse<CompanyMembership>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<CompanyMembership>>(storePath(store_id, "company-memberships"), {
      ...options,
      params: query,
    });
  },

  get(params: GetCompanyMembershipParams, options?: RequestOptions): Promise<CompanyMembership> {
    return apiConfig.httpClient.get<CompanyMembership>(
      storeRecordPath(params.store_id, "company-memberships", params.id),
      options,
    );
  },

  create(params: CreateCompanyMembershipParams, options?: RequestOptions): Promise<CompanyMembership> {
    requireId(params.id, "company membership");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<CompanyMembership>(storePath(store_id, "company-memberships"), body, options);
  },

  update(params: UpdateCompanyMembershipParams, options?: RequestOptions): Promise<CompanyMembership> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<CompanyMembership>(storeRecordPath(store_id, "company-memberships", id), body, options);
  },

  delete(params: DeleteCompanyMembershipParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(
      storeRecordPath(params.store_id, "company-memberships", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});
