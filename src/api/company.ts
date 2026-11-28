import type { ApiConfig } from "../services/clientTypes";
import type { HttpClient } from "../types/httpClient";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  Company,
  CompanyUserAccess,
  CompanyLocation,
  CompanyMembership,
  CompanyRole,
  CreateCompanyLocationParams,
  CreateCompanyMembershipParams,
  ResendCompanyInviteParams,
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
  SetCompanyTaxParams,
  StorefrontCompany,
  StorefrontCompanyLocation,
  StorefrontCreateCompanyLocationParams,
  StorefrontCreateCompanyMembershipParams,
  StorefrontDeleteCompanyLocationParams,
  StorefrontDeleteCompanyMembershipParams,
  StorefrontFindCompanyLocationsParams,
  StorefrontFindCompanyMembershipsParams,
  StorefrontFindCompanyRolesParams,
  StorefrontGetCompanyAccessParams,
  StorefrontGetCompanyLocationParams,
  StorefrontResendCompanyInviteParams,
  StorefrontUpdateCompanyLocationParams,
  StorefrontUpdateCompanyMembershipParams,
  StorefrontUpdateCompanyParams,
  SubmitCompanyTaxRegistrationParams,
  UpdateCompanyLocationParams,
  UpdateCompanyMembershipParams,
  UpdateCompanyParams,
  UpdateCompanyRoleParams,
} from "../types/company";
import { requireId } from "../utils/ids";
import { segment, storefrontBase, tenantPath, tenantRecordPath } from "./paths";

function taxRegistrationRoutes<T>(apiConfig: ApiConfig, collection: string) {
  return {
    setTax(params: SetCompanyTaxParams, options?: RequestOptions): Promise<T> {
      const { tenant_id, id, ...body } = params;
      return apiConfig.httpClient.put<T>(`${tenantRecordPath(tenant_id, collection, id)}/tax`, body, options);
    },
    submitTaxRegistration(params: SubmitCompanyTaxRegistrationParams, options?: RequestOptions): Promise<T> {
      const { tenant_id, id, ...body } = params;
      return apiConfig.httpClient.post<T>(`${tenantRecordPath(tenant_id, collection, id)}/tax/registrations`, body, options);
    },

    reviewTaxRegistration(params: ReviewCompanyTaxRegistrationParams, options?: RequestOptions): Promise<T> {
      const { tenant_id, id, ...body } = params;
      return apiConfig.httpClient.post<T>(
        `${tenantRecordPath(tenant_id, collection, id)}/tax/registrations/review`,
        body,
        options,
      );
    },

    setPurchasing(params: SetCompanyPurchasingParams, options?: RequestOptions): Promise<T> {
      const { tenant_id, id, ...body } = params;
      return apiConfig.httpClient.put<T>(`${tenantRecordPath(tenant_id, collection, id)}/purchasing`, body, options);
    },
  };
}

export const createCompanyApi = (apiConfig: ApiConfig) => ({
  find(params: FindCompaniesParams, options?: RequestOptions): Promise<PaginatedResponse<Company>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Company>>(tenantPath(tenant_id, "companies"), { ...options, params: query });
  },

  get(params: GetCompanyParams, options?: RequestOptions): Promise<Company> {
    return apiConfig.httpClient.get<Company>(tenantRecordPath(params.tenant_id, "companies", params.id), options);
  },

  create(params: CreateCompanyParams, options?: RequestOptions): Promise<Company> {
    requireId(params.id, "company");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<Company>(tenantPath(tenant_id, "companies"), body, options);
  },

  update(params: UpdateCompanyParams, options?: RequestOptions): Promise<Company> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<Company>(tenantRecordPath(tenant_id, "companies", id), body, options);
  },

  delete(params: DeleteCompanyParams, options?: RequestOptions): Promise<Company> {
    return apiConfig.httpClient.delete<Company>(tenantRecordPath(params.tenant_id, "companies", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },

  ...taxRegistrationRoutes<Company>(apiConfig, "companies"),
});

export const createCompanyLocationApi = (apiConfig: ApiConfig) => {
  const locationPath = (tenantId: string, id: string) => tenantRecordPath(tenantId, "company-locations", id);
  return {
    find(params: FindCompanyLocationsParams, options?: RequestOptions): Promise<PaginatedResponse<CompanyLocation>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CompanyLocation>>(tenantPath(tenant_id, "company-locations"), {
        ...options,
        params: query,
      });
    },

    get(params: GetCompanyLocationParams, options?: RequestOptions): Promise<CompanyLocation> {
      return apiConfig.httpClient.get<CompanyLocation>(locationPath(params.tenant_id, params.id), options);
    },

    create(params: CreateCompanyLocationParams, options?: RequestOptions): Promise<CompanyLocation> {
      requireId(params.id, "company location");
      const { tenant_id, ...body } = params;
      return apiConfig.httpClient.post<CompanyLocation>(tenantPath(tenant_id, "company-locations"), body, options);
    },

    update(params: UpdateCompanyLocationParams, options?: RequestOptions): Promise<CompanyLocation> {
      const { tenant_id, id, ...body } = params;
      return apiConfig.httpClient.put<CompanyLocation>(locationPath(tenant_id, id), body, options);
    },

    setFulfillment(params: SetCompanyLocationFulfillmentParams, options?: RequestOptions): Promise<CompanyLocation> {
      const { tenant_id, id, ...body } = params;
      return apiConfig.httpClient.put<CompanyLocation>(`${locationPath(tenant_id, id)}/served-from`, body, options);
    },

    ...taxRegistrationRoutes<CompanyLocation>(apiConfig, "company-locations"),

    delete(params: DeleteCompanyLocationParams, options?: RequestOptions): Promise<DeletedResponse> {
      return apiConfig.httpClient.delete<DeletedResponse>(locationPath(params.tenant_id, params.id), {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },
  };
};

export const createCompanyRoleApi = (apiConfig: ApiConfig) => ({
  find(params: FindCompanyRolesParams, options?: RequestOptions): Promise<PaginatedResponse<CompanyRole>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<CompanyRole>>(tenantPath(tenant_id, "company-roles"), {
      ...options,
      params: query,
    });
  },

  get(params: GetCompanyRoleParams, options?: RequestOptions): Promise<CompanyRole> {
    return apiConfig.httpClient.get<CompanyRole>(tenantRecordPath(params.tenant_id, "company-roles", params.id), {
      ...options,
      params: { company_id: params.company_id },
    });
  },

  create(params: CreateCompanyRoleParams, options?: RequestOptions): Promise<CompanyRole> {
    requireId(params.id, "company role");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<CompanyRole>(tenantPath(tenant_id, "company-roles"), body, options);
  },

  update(params: UpdateCompanyRoleParams, options?: RequestOptions): Promise<CompanyRole> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<CompanyRole>(tenantRecordPath(tenant_id, "company-roles", id), body, options);
  },

  delete(params: DeleteCompanyRoleParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(tenantRecordPath(params.tenant_id, "company-roles", params.id), {
      ...options,
      params: { company_id: params.company_id, expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createCompanyMembershipApi = (apiConfig: ApiConfig) => ({
  find(params: FindCompanyMembershipsParams, options?: RequestOptions): Promise<PaginatedResponse<CompanyMembership>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<CompanyMembership>>(tenantPath(tenant_id, "company-memberships"), {
      ...options,
      params: query,
    });
  },

  get(params: GetCompanyMembershipParams, options?: RequestOptions): Promise<CompanyMembership> {
    return apiConfig.httpClient.get<CompanyMembership>(
      tenantRecordPath(params.tenant_id, "company-memberships", params.id),
      options,
    );
  },

  create(params: CreateCompanyMembershipParams, options?: RequestOptions): Promise<CompanyMembership> {
    requireId(params.id, "company membership");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<CompanyMembership>(tenantPath(tenant_id, "company-memberships"), body, options);
  },

  resendInvite(params: ResendCompanyInviteParams, options?: RequestOptions): Promise<CompanyMembership> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.post<CompanyMembership>(`${tenantRecordPath(tenant_id, "company-memberships", id)}/resend-invite`, body, options);
  },

  update(params: UpdateCompanyMembershipParams, options?: RequestOptions): Promise<CompanyMembership> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<CompanyMembership>(tenantRecordPath(tenant_id, "company-memberships", id), body, options);
  },

  delete(params: DeleteCompanyMembershipParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(
      tenantRecordPath(params.tenant_id, "company-memberships", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});

export function createStorefrontCompanyApi(httpClient: HttpClient, ensureVisitorSession: () => Promise<void>) {
  const locationPath = (id: string) => `${storefrontBase}/company-locations/${segment(id)}`;
  const membershipPath = (id: string) => `${storefrontBase}/company-memberships/${segment(id)}`;

  return {
    async getAccess(params: StorefrontGetCompanyAccessParams, options?: RequestOptions): Promise<CompanyUserAccess> {
      await ensureVisitorSession();
      return httpClient.get<CompanyUserAccess>(`${storefrontBase}/companies/${segment(params.id)}/access`, options);
    },

    async update(params: StorefrontUpdateCompanyParams, options?: RequestOptions): Promise<StorefrontCompany> {
      await ensureVisitorSession();
      const { id, ...body } = params;
      return httpClient.put<StorefrontCompany>(`${storefrontBase}/companies/${segment(id)}`, body, options);
    },

    location: {
      async find(
        params: StorefrontFindCompanyLocationsParams = {},
        options?: RequestOptions,
      ): Promise<PaginatedResponse<StorefrontCompanyLocation>> {
        await ensureVisitorSession();
        return httpClient.get<PaginatedResponse<StorefrontCompanyLocation>>(`${storefrontBase}/company-locations`, { ...options, params });
      },

      async get(params: StorefrontGetCompanyLocationParams, options?: RequestOptions): Promise<StorefrontCompanyLocation> {
        await ensureVisitorSession();
        return httpClient.get<StorefrontCompanyLocation>(locationPath(params.id), options);
      },

      async create(params: StorefrontCreateCompanyLocationParams, options?: RequestOptions): Promise<StorefrontCompanyLocation> {
        requireId(params.id, "company location");
        await ensureVisitorSession();
        return httpClient.post<StorefrontCompanyLocation>(`${storefrontBase}/company-locations`, params, options);
      },

      async update(params: StorefrontUpdateCompanyLocationParams, options?: RequestOptions): Promise<StorefrontCompanyLocation> {
        await ensureVisitorSession();
        const { id, ...body } = params;
        return httpClient.put<StorefrontCompanyLocation>(locationPath(id), body, options);
      },

      async delete(params: StorefrontDeleteCompanyLocationParams, options?: RequestOptions): Promise<DeletedResponse> {
        await ensureVisitorSession();
        return httpClient.delete<DeletedResponse>(locationPath(params.id), {
          ...options,
          params: { expected_updated_at: params.expected_updated_at },
        });
      },
    },

    membership: {
      async find(
        params: StorefrontFindCompanyMembershipsParams = {},
        options?: RequestOptions,
      ): Promise<PaginatedResponse<CompanyMembership>> {
        await ensureVisitorSession();
        return httpClient.get<PaginatedResponse<CompanyMembership>>(`${storefrontBase}/company-memberships`, { ...options, params });
      },

      async create(params: StorefrontCreateCompanyMembershipParams, options?: RequestOptions): Promise<CompanyMembership> {
        requireId(params.id, "company membership");
        await ensureVisitorSession();
        return httpClient.post<CompanyMembership>(`${storefrontBase}/company-memberships`, params, options);
      },

      async update(params: StorefrontUpdateCompanyMembershipParams, options?: RequestOptions): Promise<CompanyMembership> {
        await ensureVisitorSession();
        const { id, ...body } = params;
        return httpClient.put<CompanyMembership>(membershipPath(id), body, options);
      },

      async delete(params: StorefrontDeleteCompanyMembershipParams, options?: RequestOptions): Promise<DeletedResponse> {
        await ensureVisitorSession();
        return httpClient.delete<DeletedResponse>(membershipPath(params.id), {
          ...options,
          params: { expected_updated_at: params.expected_updated_at },
        });
      },

      async resendInvite(params: StorefrontResendCompanyInviteParams, options?: RequestOptions): Promise<CompanyMembership> {
        await ensureVisitorSession();
        return httpClient.post<CompanyMembership>(
          `${membershipPath(params.id)}/resend-invite`,
          { expected_updated_at: params.expected_updated_at },
          options,
        );
      },
    },

    role: {
      async find(params: StorefrontFindCompanyRolesParams, options?: RequestOptions): Promise<PaginatedResponse<CompanyRole>> {
        await ensureVisitorSession();
        return httpClient.get<PaginatedResponse<CompanyRole>>(`${storefrontBase}/company-roles`, { ...options, params });
      },
    },
  };
}
