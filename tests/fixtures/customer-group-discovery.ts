import { createAdmin } from "arky-sdk/admin";
import type {
  CustomerGroup,
  CustomerGroupMember,
  FindCustomerGroupsParams,
  FindCustomerGroupMembersParams,
  GetCustomerGroupByKeyParams,
  AddCustomerGroupMemberParams,
} from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

const store_id = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
const admin = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
const groups: FindCustomerGroupsParams = { store_id, key: "members", status: "active", limit: 20, cursor: "opaque" };
const members: FindCustomerGroupMembersParams = { store_id, customer_group_id: "group", customer_id: "customer", limit: 20 };
const key: GetCustomerGroupByKeyParams = { store_id, key: "members" };
void admin.eshop.customerGroup.find(groups);
void admin.eshop.customerGroupMember.find(members);
const group: Promise<CustomerGroup> = admin.eshop.customerGroup.getByKey(key);
const added: Promise<CustomerGroupMember> = admin.eshop.customerGroupMember.add({ store_id, id: "e245588f-0542-4bb3-97c8-23de326627d1", customer_group_id: "group", customer_id: "customer" });
void [group, added];

export type CustomerGroupDiscoveryContracts = [
  Assert<Equal<keyof FindCustomerGroupsParams, "store_id" | "key" | "status" | "limit" | "cursor">>,
  Assert<Equal<FindCustomerGroupsParams["cursor"], string | null | undefined>>,
  Assert<Equal<FindCustomerGroupsParams["status"], "active" | "deleting" | undefined>>,
  Assert<Equal<keyof FindCustomerGroupMembersParams, "store_id" | "customer_group_id" | "customer_id" | "limit" | "cursor">>,
  Assert<RequiredField<AddCustomerGroupMemberParams, "id">>,
  Assert<Equal<Awaited<ReturnType<typeof admin.eshop.customerGroup.delete>>, CustomerGroup>>,
  Assert<Equal<Awaited<ReturnType<typeof admin.eshop.customerGroupMember.remove>>, CustomerGroupMember>>,
];
