import { createAdmin } from "arky-sdk/admin";
import type {
  CustomerGroupMember,
  CustomerGroupMemberAcceptedTerms,
  CustomerGroupMemberCurrent,
  CustomerGroupMemberPurchaseLimitPeriod,
  CustomerGroupMemberRevision,
  CustomerGroupMemberRevisionDetail,
  CustomerGroupMemberRevisionDetailSelf,
  CustomerGroupMemberRevisionSelf,
  CustomerGroupMemberSelf,
  FindCustomerGroupMembersParams,
  Order,
  PaginatedResponse,
} from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

const store_id = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
const admin = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
const members: FindCustomerGroupMembersParams = {
  store_id, customer_id: "customer", customer_group_id: "group",
  customer_group_offering_id: "offering", status: "paused", limit: 20, cursor: "opaque",
};
void admin.eshop.customerGroupMember.find(members);
const current: Promise<CustomerGroupMemberCurrent> = admin.eshop.customerGroupMember.current({ store_id, id: "member" });
const orders: Promise<PaginatedResponse<Order>> = admin.eshop.customerGroupMember.findOrders({ store_id, id: "member", limit: 20 });
const revisions: Promise<PaginatedResponse<CustomerGroupMemberRevision>> = admin.eshop.customerGroupMember.revisions({ store_id, id: "member" });
const revision: Promise<CustomerGroupMemberRevisionDetail> = admin.eshop.customerGroupMember.getRevision({ store_id, customer_group_member_id: "member", revision_id: "revision" });
const limits: Promise<PaginatedResponse<CustomerGroupMemberPurchaseLimitPeriod>> = admin.eshop.customerGroupMember.purchaseLimits({ store_id, id: "member" });
void [current, orders, revisions, revision, limits];

export type CustomerGroupHistoryContracts = [
  Assert<Equal<CustomerGroupMemberCurrent["customer_group_member"], CustomerGroupMember>>,
  Assert<Equal<keyof CustomerGroupMemberCurrent, "customer_group_member" | "revision" | "terms" | "head_revision_id">>,
  Assert<Equal<CustomerGroupMemberCurrent["terms"], CustomerGroupMemberAcceptedTerms | null>>,
  Assert<Equal<keyof CustomerGroupMemberAcceptedTerms, "group" | "deliveries" | "billing_address">>,
  Assert<Missing<Extract<CustomerGroupMemberSelf["status"], { type: "paused" }>, "cause">>,
  Assert<Equal<Extract<CustomerGroupMember["status"], { type: "paused" }>["cause"]["type"], "requested" | "renewal_unpaid">>,
  Assert<Missing<Extract<CustomerGroupMember["status"], { type: "blocked" }>, "block">>,
  Assert<Missing<CustomerGroupMemberRevisionSelf, "accepted_by">>,
  Assert<Equal<CustomerGroupMemberRevisionDetailSelf["revision"], CustomerGroupMemberRevisionSelf>>,
  Assert<Missing<ReturnType<typeof createAdmin>["eshop"], "customerGroupEmailConsent" | "subscription">>,
];
