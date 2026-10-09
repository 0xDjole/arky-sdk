import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  AddCustomerGroupMemberParams,
  CreateCustomerGroupParams,
  CustomerGroup,
  CustomerGroupMember,
  DeleteCustomerGroupParams,
  FindCustomerGroupMembersParams,
  FindCustomerGroupsParams,
  GetCustomerGroupByKeyParams,
  GetCustomerGroupMemberParams,
  GetCustomerGroupParams,
  RemoveCustomerGroupMemberParams,
} from "../types/customerGroup";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

export const createCustomerGroupApi = (apiConfig: ApiConfig) => ({
  find(params: FindCustomerGroupsParams, options?: RequestOptions): Promise<PaginatedResponse<CustomerGroup>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<CustomerGroup>>(storePath(store_id, "customer-groups"), {
      ...options,
      params: query,
    });
  },

  get(params: GetCustomerGroupParams, options?: RequestOptions): Promise<CustomerGroup> {
    return apiConfig.httpClient.get<CustomerGroup>(storeRecordPath(params.store_id, "customer-groups", params.id), options);
  },

  getByKey(params: GetCustomerGroupByKeyParams, options?: RequestOptions): Promise<CustomerGroup> {
    return apiConfig.httpClient.get<CustomerGroup>(
      storePath(params.store_id, `customer-groups/by-key/${segment(params.key)}`),
      options,
    );
  },

  create(params: CreateCustomerGroupParams, options?: RequestOptions): Promise<CustomerGroup> {
    requireId(params.id, "customer group");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<CustomerGroup>(storePath(store_id, "customer-groups"), body, options);
  },

  delete(params: DeleteCustomerGroupParams, options?: RequestOptions): Promise<CustomerGroup> {
    return apiConfig.httpClient.delete<CustomerGroup>(storeRecordPath(params.store_id, "customer-groups", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createCustomerGroupMemberApi = (apiConfig: ApiConfig) => ({
  find(params: FindCustomerGroupMembersParams, options?: RequestOptions): Promise<PaginatedResponse<CustomerGroupMember>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<CustomerGroupMember>>(storePath(store_id, "customer-group-members"), {
      ...options,
      params: query,
    });
  },

  get(params: GetCustomerGroupMemberParams, options?: RequestOptions): Promise<CustomerGroupMember> {
    return apiConfig.httpClient.get<CustomerGroupMember>(
      storeRecordPath(params.store_id, "customer-group-members", params.id),
      options,
    );
  },

  add(params: AddCustomerGroupMemberParams, options?: RequestOptions): Promise<CustomerGroupMember> {
    requireId(params.id, "customer group member");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<CustomerGroupMember>(storePath(store_id, "customer-group-members"), body, options);
  },

  remove(params: RemoveCustomerGroupMemberParams, options?: RequestOptions): Promise<CustomerGroupMember> {
    return apiConfig.httpClient.delete<CustomerGroupMember>(
      storeRecordPath(params.store_id, "customer-group-members", params.id),
      options,
    );
  },
});
