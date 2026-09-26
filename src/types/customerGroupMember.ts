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
  reason: string;
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
      company_location_id: string;
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

export type JoinStorefrontCustomerGroupParams = Omit<JoinCustomerGroupParams, "store_id">;

export type GetStorefrontCustomerGroupMemberParams = {
  customer_group_id: string;
} & (
  | { company_id?: never; company_location_id?: never }
  | { company_id: string; company_location_id: string }
);

export interface GetCustomerGroupMemberParams {
  store_id?: string;
  id: string;
}

export interface FindCustomerGroupMembersParams {
  store_id?: string;
  customer_group_id?: string;
  customer_id?: string;
  company_id?: string;
  admission?: CustomerGroupAdmission["type"];
  limit?: number;
  cursor?: string;
}

export type LookupCustomerGroupMemberParams = {
  store_id?: string;
  customer_group_id: string;
} & (
  | { customer_id: string; company_id?: never }
  | { company_id: string; customer_id?: never }
);

export type CustomerGroupSelfAdmission =
  | { type: "requested" }
  | { type: "granted"; granted_at: EpochMilliseconds }
  | { type: "revoked"; revoked_at: EpochMilliseconds };

export type CustomerGroupMemberSelf = Omit<CustomerGroupMember, "admission" | "administrative_access"> & {
  admission: CustomerGroupSelfAdmission;
};

export interface CustomerGroupJoinResult {
  command_id: string;
  accepted_at: EpochMilliseconds;
  member: CustomerGroupMemberSelf;
}

export type CustomerGroupMemberCommandResultType =
  | { type: "admission_granted"; policy_at_grant: CustomerGroupJoinPolicy }
  | { type: "admission_revoked" }
  | { type: "administrative_access_granted" }
  | { type: "administrative_access_cleared" };

export interface CustomerGroupMemberCommandReceipt {
  id: string;
  store_id: string;
  accepted_at: EpochMilliseconds;
  command: {
    type: "customer_group_member";
    actor: AccountActor;
    request: CustomerGroupMemberCommand;
    result: {
      customer_group_member_id: string;
      member_updated_at: EpochMilliseconds;
      type: CustomerGroupMemberCommandResultType;
    };
  };
}

export interface CustomerGroupMemberCommandResponse {
  receipt: CustomerGroupMemberCommandReceipt;
  member: CustomerGroupMember;
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

export type CustomerGroupMemberCommand =
  | {
      type: "grant_admission";
      customer_group_id: string;
      member: CustomerGroupMemberType;
      expected_updated_at: EpochMilliseconds | null;
    }
  | {
      type: "revoke_admission";
      customer_group_member_id: string;
      expected_updated_at: EpochMilliseconds;
      reason: string;
    }
  | {
      type: "grant_administrative_access";
      customer_group_member_id: string;
      expected_updated_at: EpochMilliseconds;
      expires_at: EpochMilliseconds | null;
      reason: string;
    }
  | {
      type: "clear_administrative_access";
      customer_group_member_id: string;
      expected_updated_at: EpochMilliseconds;
      reason: string;
    };

export interface ExecuteCustomerGroupMemberCommandParams {
  store_id?: string;
  command_id: string;
  command: CustomerGroupMemberCommand;
}
