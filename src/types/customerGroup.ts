import type { EpochMilliseconds } from "./time";

export type CustomerGroupEditableStatus =
  | { type: "draft" }
  | { type: "active" }
  | { type: "closed" }
  | { type: "archived" };
export type CustomerGroupStatus =
  CustomerGroupEditableStatus | { type: "deleting" };

export type CustomerGroupJoinPolicy = { type: "open" } | { type: "private" };

export type CustomerGroupConsentPolicy =
  | { type: "immediate" }
  | { type: "confirmation" };

export type CustomerGroupCommunication =
  | { type: "disabled" }
  | { type: "email"; consent_policy: CustomerGroupConsentPolicy };

export interface CustomerGroup {
  id: string;
  store_id: string;
  key: string;
  name: string;
  status: CustomerGroupStatus;
  join_policy: CustomerGroupJoinPolicy;
  communication: CustomerGroupCommunication;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CustomerGroupUsage {
  catalog_entitlement_ids: string[];
  more_catalog_entitlements: boolean;
  plan_ids: string[];
  more_plans: boolean;
  member_ids: string[];
  more_members: boolean;
  email_consent_ids: string[];
  more_email_consents: boolean;
  shipping_rate_ids: string[];
  more_shipping_rates: boolean;
}

export interface CreateCustomerGroupParams {
  store_id?: string;
  key: string;
  name: string;
  status: CustomerGroupEditableStatus;
  join_policy: CustomerGroupJoinPolicy;
  communication: CustomerGroupCommunication;
}

export interface GetCustomerGroupParams {
  store_id?: string;
  id: string;
}

export interface GetCustomerGroupByKeyParams {
  store_id?: string;
  key: string;
}

export interface UpdateCustomerGroupParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  name: string;
  status: CustomerGroupEditableStatus;
  join_policy: CustomerGroupJoinPolicy;
  communication: CustomerGroupCommunication;
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
  status?: CustomerGroupStatus["type"];
}

export interface StorefrontCustomerGroup {
  id: string;
  key: string;
  name: string;
  join_policy: CustomerGroupJoinPolicy;
  communication: CustomerGroupCommunication;
}

export interface GetStorefrontCustomerGroupParams {
  identifier: string;
  company_id?: string;
  company_location_id?: string;
}
