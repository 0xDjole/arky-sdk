import type { AccountActor } from "./accountActor";
import type { CustomerGroupMemberType } from "./api";
import type { CustomerGroupJoinPolicy } from "./customerGroup";
import type { EpochMilliseconds } from "./time";

export type CustomerGroupAdmissionSource =
  | { type: "customer"; customer_id: string }
  | { type: "company"; company_membership_id: string }
  | { type: "account"; actor: AccountActor };

export type CustomerGroupAdmission =
  | { type: "requested" }
  | {
      type: "granted";
      command_id: string;
      source: CustomerGroupAdmissionSource;
      policy_at_grant: CustomerGroupJoinPolicy;
      granted_at: EpochMilliseconds;
    }
  | {
      type: "revoked";
      command_id: string;
      actor: AccountActor;
      reason: string;
      revoked_at: EpochMilliseconds;
    };

export interface CustomerGroupAdministrativeAccess {
  command_id: string;
  actor: AccountActor;
  granted_at: EpochMilliseconds;
  expires_at: EpochMilliseconds | null;
}

export interface CustomerGroupMember {
  id: string;
  store_id: string;
  customer_group_id: string;
  member: CustomerGroupMemberType;
  admission: CustomerGroupAdmission;
  administrative_access: CustomerGroupAdministrativeAccess | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CustomerGroupJoinScope =
  | { type: "customer" }
  | {
      type: "company";
      company_id: string;
      company_location_id: string | null;
    };

export interface CustomerGroupJoinRequest {
  customer_group_id: string;
  scope: CustomerGroupJoinScope;
  expected_updated_at: EpochMilliseconds | null;
}

export interface JoinCustomerGroupParams {
  store_id?: string;
  command_id: string;
  request: CustomerGroupJoinRequest;
}

export interface GetCustomerGroupMemberParams {
  store_id?: string;
  id: string;
}

export interface FindCustomerGroupMembersParams {
  store_id?: string;
  customer_group_id?: string;
  limit?: number;
  cursor?: string;
}

export interface GetCurrentCustomerGroupMemberParams {
  store_id?: string;
  customer_group_id: string;
  company_id?: string;
  company_location_id?: string;
}

export interface FindCustomerGroupMemberCommandsParams {
  store_id?: string;
  id: string;
  limit?: number;
  cursor?: string;
}
