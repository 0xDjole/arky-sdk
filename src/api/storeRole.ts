import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateCustomerRoleParams,
  CreateStoreAssistantMembershipParams,
  CreateStoreRoleParams,
  CustomerRole,
  DeleteCustomerRoleParams,
  DeleteStoreAssistantMembershipParams,
  DeleteStoreRoleParams,
  FindStoreAssistantMembershipsParams,
  FindStoreRolesParams,
  GetCustomerRoleParams,
  GetStoreAssistantMembershipParams,
  GetStoreRoleParams,
  StoreAssistantMembership,
  StoreRole,
  UpdateCustomerRoleParams,
  UpdateStoreAssistantMembershipParams,
  UpdateStoreRoleParams,
} from "../types/storeRole";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

export const createStoreRoleApi = (apiConfig: ApiConfig) => ({
  find(params: FindStoreRolesParams, options?: RequestOptions): Promise<PaginatedResponse<StoreRole>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<StoreRole>>(storePath(store_id, "roles"), { ...options, params: query });
  },

  get(params: GetStoreRoleParams, options?: RequestOptions): Promise<StoreRole> {
    return apiConfig.httpClient.get<StoreRole>(storeRecordPath(params.store_id, "roles", params.id), options);
  },

  create(params: CreateStoreRoleParams, options?: RequestOptions): Promise<StoreRole> {
    requireId(params.id, "role");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<StoreRole>(storePath(store_id, "roles"), body, options);
  },

  update(params: UpdateStoreRoleParams, options?: RequestOptions): Promise<StoreRole> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<StoreRole>(storeRecordPath(store_id, "roles", id), body, options);
  },

  delete(params: DeleteStoreRoleParams, options?: RequestOptions): Promise<{ deleted: true }> {
    return apiConfig.httpClient.delete<{ deleted: true }>(storeRecordPath(params.store_id, "roles", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createCustomerRoleApi = (apiConfig: ApiConfig) => ({
  get(params: GetCustomerRoleParams, options?: RequestOptions): Promise<CustomerRole> {
    return apiConfig.httpClient.get<CustomerRole>(storePath(params.store_id, "customers-role"), options);
  },

  create(params: CreateCustomerRoleParams, options?: RequestOptions): Promise<CustomerRole> {
    requireId(params.id, "customers role");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<CustomerRole>(storePath(store_id, "customers-role"), body, options);
  },

  update(params: UpdateCustomerRoleParams, options?: RequestOptions): Promise<CustomerRole> {
    const { store_id, ...body } = params;
    return apiConfig.httpClient.put<CustomerRole>(storePath(store_id, "customers-role"), body, options);
  },

  delete(params: DeleteCustomerRoleParams, options?: RequestOptions): Promise<{ deleted: true }> {
    return apiConfig.httpClient.delete<{ deleted: true }>(storePath(params.store_id, "customers-role"), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createStoreAssistantMembershipApi = (apiConfig: ApiConfig) => ({
  find(
    params: FindStoreAssistantMembershipsParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<StoreAssistantMembership>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<StoreAssistantMembership>>(
      storePath(store_id, "assistant-memberships"),
      { ...options, params: query },
    );
  },

  get(params: GetStoreAssistantMembershipParams, options?: RequestOptions): Promise<StoreAssistantMembership> {
    return apiConfig.httpClient.get<StoreAssistantMembership>(
      storeRecordPath(params.store_id, "assistant-memberships", params.id),
      options,
    );
  },

  create(params: CreateStoreAssistantMembershipParams, options?: RequestOptions): Promise<StoreAssistantMembership> {
    requireId(params.id, "assistant membership");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<StoreAssistantMembership>(storePath(store_id, "assistant-memberships"), body, options);
  },

  update(params: UpdateStoreAssistantMembershipParams, options?: RequestOptions): Promise<StoreAssistantMembership> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<StoreAssistantMembership>(
      storeRecordPath(store_id, "assistant-memberships", id),
      body,
      options,
    );
  },

  delete(params: DeleteStoreAssistantMembershipParams, options?: RequestOptions): Promise<{ deleted: true }> {
    return apiConfig.httpClient.delete<{ deleted: true }>(
      storeRecordPath(params.store_id, "assistant-memberships", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});
