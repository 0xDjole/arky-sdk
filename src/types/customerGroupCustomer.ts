import type { EpochMilliseconds } from "./time";

export type CustomerGroupCustomerStatus =
  { type: "active" } | { type: "deleting" };

export interface CustomerGroupCustomer {
  id: string;
  store_id: string;
  customer_group_id: string;
  customer_id: string;
  status: CustomerGroupCustomerStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateCustomerGroupCustomerParams {
  store_id?: string;
  customer_group_id: string;
  customer_id: string;
}

export interface GetCustomerGroupCustomerParams {
  store_id?: string;
  id: string;
}

export interface DeleteCustomerGroupCustomerParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCustomerGroupCustomersParams {
  store_id?: string;
  limit?: number;
  cursor?: string;
  customer_group_id?: string;
  customer_id?: string;
}
