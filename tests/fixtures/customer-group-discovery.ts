import { createAdmin } from "arky-sdk/admin";
import type {
  CustomerGroup,
  CustomerGroupUsage,
  CustomerGroupMember,
  CustomerGroupMemberSelf,
  CustomerGroupJoinResult,
  CustomerGroupMemberCommandResponse,
  FindCustomerGroupsParams,
  FindCustomerGroupMembersParams,
  LookupCustomerGroupMemberParams,
  GetCustomerGroupByKeyParams,
} from "arky-sdk/types";

const store_id = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
const admin = createAdmin({ market: "configured-market", baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
const groups: FindCustomerGroupsParams = { store_id, key: "members", status: "closed", limit: 20, cursor: "opaque" };
const members: FindCustomerGroupMembersParams = { store_id, customer_group_id: "group", customer_id: "customer", admission: "granted", limit: 20 };
const binding: LookupCustomerGroupMemberParams = { store_id, customer_group_id: "group", company_id: "company" };
const key: GetCustomerGroupByKeyParams = { store_id, key: "members" };
void admin.eshop.customerGroup.find(groups);
void admin.eshop.customerGroupMember.find(members);
const group: Promise<CustomerGroup> = admin.eshop.customerGroup.getByKey(key);
const member: Promise<CustomerGroupMember> = admin.eshop.customerGroupMember.lookup(binding);
const current: Promise<CustomerGroupMemberSelf | null> = admin.eshop.customerGroupMember.current({ store_id, customer_group_id: "group" });
const join: Promise<CustomerGroupJoinResult> = admin.eshop.customerGroupMember.join({ store_id, request_id: "6b9d9e19-3d13-4f30-a1a0-442a3c92f212", request: { customer_group_id: "group", scope: { type: "customer" }, expected_updated_at: null } });
const command: Promise<CustomerGroupMemberCommandResponse> = admin.eshop.customerGroupMember.execute({ store_id, request_id: "3c7f2e10-b854-4d69-a0e7-59f1b6c4d823", command: { type: "clear_administrative_access", customer_group_member_id: "member", expected_updated_at: 1 as CustomerGroupMember["updated_at"], reason: "Explicit operator choice" } });
const usage: Promise<CustomerGroupUsage> = admin.eshop.customerGroup.usage({ store_id, id: "group" });
void [group, member, current, join, command, usage];
// @ts-expect-error
void admin.eshop.customerGroupMember.join({ store_id, command_id: "6b9d9e19-3d13-4f30-a1a0-442a3c92f212", request: { customer_group_id: "group", scope: { type: "customer" }, expected_updated_at: null } });
// @ts-expect-error
void admin.eshop.customerGroupMember.lookup({ customer_group_id: "group", company_id: "company" });
