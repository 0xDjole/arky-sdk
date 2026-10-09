import type { EpochMilliseconds } from "./time";

export type CustomerGroupStatus = { type: "active" } | { type: "deleting" };

export interface CustomerGroup {
  id: string;
  store_id: string;
  key: string;
  status: CustomerGroupStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CustomerGroupMember {
  id: string;
  store_id: string;
  customer_group_id: string;
  customer_id: string;
  created_at: EpochMilliseconds;
}

export interface CreateCustomerGroupParams {
  store_id: string;
  id: string;
  key: string;
}

export interface GetCustomerGroupParams {
  store_id: string;
  id: string;
}

export interface GetCustomerGroupByKeyParams {
  store_id: string;
  key: string;
}

export interface DeleteCustomerGroupParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCustomerGroupsParams {
  store_id: string;
  key?: string;
  status?: CustomerGroupStatus["type"];
  limit?: number;
  cursor?: string | null;
}

export interface AddCustomerGroupMemberParams {
  store_id: string;
  id: string;
  customer_group_id: string;
  customer_id: string;
}

export interface GetCustomerGroupMemberParams {
  store_id: string;
  id: string;
}

export interface RemoveCustomerGroupMemberParams {
  store_id: string;
  id: string;
}

export interface FindCustomerGroupMembersParams {
  store_id: string;
  customer_group_id?: string;
  customer_id?: string;
  limit?: number;
  cursor?: string | null;
}
