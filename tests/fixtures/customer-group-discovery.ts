import { createAdmin } from "arky-sdk/admin";
import type {
  AssignCustomerGroupMemberParams,
  CommerceParty,
  CustomerGroup,
  CustomerGroupMember,
  CustomerGroupOffering,
  CustomerGroupStatus,
  FindCustomerGroupMembersParams,
  FindCustomerGroupOfferingsParams,
  FindCustomerGroupsParams,
  GetCustomerGroupByKeyParams,
} from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

const store_id = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
const admin = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
const groups: FindCustomerGroupsParams = { store_id, customer_group_offering_id: "offering", status: { type: "active" }, query: "members", limit: 20, cursor: "opaque" };
const offerings: FindCustomerGroupOfferingsParams = { store_id, key: "club", status: "active", sort_field: "updated_at", limit: 20 };
const members: FindCustomerGroupMembersParams = { store_id, customer_group_id: "group", company_location_id: "location", status: "active", limit: 20 };
const key: GetCustomerGroupByKeyParams = { store_id, key: "members" };
void admin.eshop.customerGroup.find(groups);
void admin.eshop.customerGroupOffering.find(offerings);
void admin.eshop.customerGroupMember.find(members);
const group: Promise<CustomerGroup> = admin.eshop.customerGroup.getByKey(key);
const offering: Promise<CustomerGroupOffering> = admin.eshop.customerGroupOffering.getByKey(key);
const assigned: Promise<CustomerGroupMember> = admin.eshop.customerGroupMember.assign({
  store_id,
  id: "e245588f-0542-4bb3-97c8-23de326627d1",
  customer_group_id: "group",
  subject: { type: "company", company_id: "company" },
  access_end_at: null,
});
void [group, offering, assigned];

export type CustomerGroupDiscoveryContracts = [
  Assert<Equal<keyof FindCustomerGroupsParams, "store_id" | "customer_group_offering_id" | "status" | "query" | "sort_field" | "sort_direction" | "created_at_from" | "created_at_to" | "limit" | "cursor">>,
  Assert<Equal<FindCustomerGroupsParams["cursor"], string | null | undefined>>,
  Assert<Equal<FindCustomerGroupsParams["status"], CustomerGroupStatus | undefined>>,
  Assert<Equal<keyof FindCustomerGroupMembersParams, "store_id" | "customer_id" | "company_id" | "company_location_id" | "customer_group_id" | "customer_group_offering_id" | "status" | "limit" | "cursor">>,
  Assert<Equal<keyof AssignCustomerGroupMemberParams, "store_id" | "id" | "customer_group_id" | "subject" | "access_end_at">>,
  Assert<RequiredField<AssignCustomerGroupMemberParams, "id">>,
  Assert<RequiredField<AssignCustomerGroupMemberParams, "access_end_at">>,
  Assert<Equal<AssignCustomerGroupMemberParams["subject"], CommerceParty>>,
  Assert<Equal<CommerceParty, { type: "customer"; customer_id: string } | { type: "company"; company_id: string } | { type: "company_location"; company_location_id: string }>>,
  Assert<Equal<Awaited<ReturnType<typeof admin.eshop.customerGroup.delete>>, void>>,
  Assert<Equal<Awaited<ReturnType<typeof admin.eshop.customerGroupOffering.delete>>, void>>,
  Assert<Equal<Awaited<ReturnType<typeof admin.eshop.customerGroupMember.assign>>, CustomerGroupMember>>,
];
