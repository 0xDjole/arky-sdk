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
  GetCustomerGroupMemberByBindingParams,
  GetCustomerGroupByKeyParams,
} from "arky-sdk/types";

const admin = createAdmin({ storeId: "store", market: "configured-market", baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
const groups: FindCustomerGroupsParams = { key: "members", status: "closed", limit: 20, cursor: "opaque" };
const members: FindCustomerGroupMembersParams = { customer_group_id: "group", customer_id: "customer", admission: "granted", limit: 20 };
const binding: GetCustomerGroupMemberByBindingParams = { customer_group_id: "group", company_id: "company" };
const key: GetCustomerGroupByKeyParams = { key: "members" };
void admin.eshop.customerGroup.find(groups);
void admin.eshop.customerGroupMember.find(members);
const group: Promise<CustomerGroup> = admin.eshop.customerGroup.getByKey(key);
const member: Promise<CustomerGroupMember> = admin.eshop.customerGroupMember.getByBinding(binding);
const current: Promise<CustomerGroupMemberSelf | null> = admin.eshop.customerGroupMember.current({ customer_group_id: "group" });
const join: Promise<CustomerGroupJoinResult> = admin.eshop.customerGroupMember.join({ command_id: "command", request: { customer_group_id: "group", scope: { type: "customer" }, expected_updated_at: null } });
const command: Promise<CustomerGroupMemberCommandResponse> = admin.eshop.customerGroupMember.execute({ command_id: "command", command: { type: "clear_administrative_access", customer_group_member_id: "member", expected_updated_at: 1 as CustomerGroupMember["updated_at"], reason: "Explicit operator choice" } });
const usage: Promise<CustomerGroupUsage> = admin.eshop.customerGroup.usage({ id: "group" });
void [group, member, current, join, command, usage];
