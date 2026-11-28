import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateUserRoleParams,
  CreateTenantAssistantMembershipParams,
  CreateTenantRoleParams,
  UserRole,
  DeleteUserRoleParams,
  DeleteTenantAssistantMembershipParams,
  DeleteTenantRoleParams,
  FindTenantAssistantMembershipsParams,
  FindTenantRolesParams,
  GetUserRoleParams,
  GetTenantAssistantMembershipParams,
  GetTenantRoleParams,
  TenantAssistantMembership,
  TenantRole,
  UpdateUserRoleParams,
  UpdateTenantAssistantMembershipParams,
  UpdateTenantRoleParams,
} from "../types/tenantRole";
import { requireId } from "../utils/ids";
import { tenantPath, tenantRecordPath } from "./paths";

export const createTenantRoleApi = (apiConfig: ApiConfig) => ({
  find(params: FindTenantRolesParams, options?: RequestOptions): Promise<PaginatedResponse<TenantRole>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<TenantRole>>(tenantPath(tenant_id, "roles"), { ...options, params: query });
  },

  get(params: GetTenantRoleParams, options?: RequestOptions): Promise<TenantRole> {
    return apiConfig.httpClient.get<TenantRole>(tenantRecordPath(params.tenant_id, "roles", params.id), options);
  },

  create(params: CreateTenantRoleParams, options?: RequestOptions): Promise<TenantRole> {
    requireId(params.id, "role");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<TenantRole>(tenantPath(tenant_id, "roles"), body, options);
  },

  update(params: UpdateTenantRoleParams, options?: RequestOptions): Promise<TenantRole> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<TenantRole>(tenantRecordPath(tenant_id, "roles", id), body, options);
  },

  delete(params: DeleteTenantRoleParams, options?: RequestOptions): Promise<{ deleted: true }> {
    return apiConfig.httpClient.delete<{ deleted: true }>(tenantRecordPath(params.tenant_id, "roles", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createUserRoleApi = (apiConfig: ApiConfig) => ({
  get(params: GetUserRoleParams, options?: RequestOptions): Promise<UserRole> {
    return apiConfig.httpClient.get<UserRole>(tenantPath(params.tenant_id, "users-role"), options);
  },

  create(params: CreateUserRoleParams, options?: RequestOptions): Promise<UserRole> {
    requireId(params.id, "users role");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<UserRole>(tenantPath(tenant_id, "users-role"), body, options);
  },

  update(params: UpdateUserRoleParams, options?: RequestOptions): Promise<UserRole> {
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.put<UserRole>(tenantPath(tenant_id, "users-role"), body, options);
  },

  delete(params: DeleteUserRoleParams, options?: RequestOptions): Promise<{ deleted: true }> {
    return apiConfig.httpClient.delete<{ deleted: true }>(tenantPath(params.tenant_id, "users-role"), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createTenantAssistantMembershipApi = (apiConfig: ApiConfig) => ({
  find(
    params: FindTenantAssistantMembershipsParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<TenantAssistantMembership>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<TenantAssistantMembership>>(
      tenantPath(tenant_id, "assistant-memberships"),
      { ...options, params: query },
    );
  },

  get(params: GetTenantAssistantMembershipParams, options?: RequestOptions): Promise<TenantAssistantMembership> {
    return apiConfig.httpClient.get<TenantAssistantMembership>(
      tenantRecordPath(params.tenant_id, "assistant-memberships", params.id),
      options,
    );
  },

  create(params: CreateTenantAssistantMembershipParams, options?: RequestOptions): Promise<TenantAssistantMembership> {
    requireId(params.id, "assistant membership");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<TenantAssistantMembership>(tenantPath(tenant_id, "assistant-memberships"), body, options);
  },

  update(params: UpdateTenantAssistantMembershipParams, options?: RequestOptions): Promise<TenantAssistantMembership> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<TenantAssistantMembership>(
      tenantRecordPath(tenant_id, "assistant-memberships", id),
      body,
      options,
    );
  },

  delete(params: DeleteTenantAssistantMembershipParams, options?: RequestOptions): Promise<{ deleted: true }> {
    return apiConfig.httpClient.delete<{ deleted: true }>(
      tenantRecordPath(params.tenant_id, "assistant-memberships", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});
