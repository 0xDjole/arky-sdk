import type { EpochMilliseconds } from "./time";

export type CustomerGroupEditableStatus =
  { type: "active" } | { type: "archived" };
export type CustomerGroupStatus =
  CustomerGroupEditableStatus | { type: "deleting" };

export interface CustomerGroup {
  id: string;
  store_id: string;
  key: string;
  name: string;
  status: CustomerGroupStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CustomerGroupUsage {
  catalog_entitlement_ids: string[];
  more_catalog_entitlements: boolean;
  customer_edge_ids: string[];
  more_customer_edges: boolean;
  company_edge_ids: string[];
  more_company_edges: boolean;
}

export interface CreateCustomerGroupParams {
  store_id?: string;
  key: string;
  name: string;
  status: CustomerGroupEditableStatus;
}

export interface GetCustomerGroupParams {
  store_id?: string;
  id: string;
}

export interface UpdateCustomerGroupParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  name: string;
  status: CustomerGroupEditableStatus;
}

export interface DeleteCustomerGroupParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCustomerGroupsParams {
  store_id?: string;
  limit?: number;
  cursor?: string;
  key?: string;
}
