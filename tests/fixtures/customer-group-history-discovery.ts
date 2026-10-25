import { createAdmin } from "arky-sdk/admin";
import type {
  Block,
  CustomerGroupMemberDeliveryOptions,
  StorefrontGetCustomerGroupMemberDeliveryOptionsParams,
  CustomerGroupMember,
  CustomerGroupMemberAcceptedTerms,
  CustomerGroupMemberCurrent,
  CustomerGroupMemberCurrentSelf,
  CustomerGroupMemberProductChoices,
  CustomerGroupProductAlternative,
  CustomerGroupProductChoices,
  GetStorefrontCustomerGroupProductChoicesParams,
  StorefrontGetCustomerGroupMemberProductChoicesParams,
  CustomerGroupMemberPurchaseLimitUsage,
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
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

const store_id = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
const admin = createAdmin({
  apiUrl: "https://api.example.test",
  secretKey: "arky_secret_test",
});
const members: FindCustomerGroupMembersParams = {
  store_id,
  customer_id: "customer",
  customer_group_id: "group",
  customer_group_offering_id: "offering",
  status: "paused",
  limit: 20,
  cursor: "opaque",
};
void admin.eshop.customerGroupMember.find(members);
const current: Promise<CustomerGroupMemberCurrent> =
  admin.eshop.customerGroupMember.getCurrent({ store_id, id: "member" });
const orders: Promise<PaginatedResponse<Order>> =
  admin.eshop.customerGroupMember.findOrders({
    store_id,
    id: "member",
    limit: 20,
  });
const revisions: Promise<PaginatedResponse<CustomerGroupMemberRevision>> =
  admin.eshop.customerGroupMember.findRevisions({ store_id, id: "member" });
const revision: Promise<CustomerGroupMemberRevisionDetail> =
  admin.eshop.customerGroupMember.getRevision({
    store_id,
    customer_group_member_id: "member",
    revision_id: "revision",
  });
const limits: Promise<
  PaginatedResponse<CustomerGroupMemberPurchaseLimitUsage>
> = admin.eshop.customerGroupMember.findPurchaseLimits({ store_id, id: "member" });
void [current, orders, revisions, revision, limits];

export type CustomerGroupHistoryContracts = [
  Assert<
    Equal<
      CustomerGroupMemberCurrent["customer_group_member"],
      CustomerGroupMember
    >
  >,
  Assert<
    Equal<
      keyof CustomerGroupMemberCurrentSelf,
      "customer_group_member" | "revision" | "terms" | "head_revision_id"
    >
  >,
  Assert<
    Equal<
      keyof CustomerGroupMemberDeliveryOptions,
      | "customer_group_member"
      | "revision_id"
      | "delivery_id"
      | "language"
      | "currency"
      | "destination"
      | "offers"
    >
  >,
  Assert<
    Equal<
      keyof StorefrontGetCustomerGroupMemberDeliveryOptionsParams,
      | "id"
      | "expected_updated_at"
      | "revision_id"
      | "delivery_id"
      | "language"
      | "quantity"
      | "choices"
      | "deliveries"
      | "billing_address"
    >
  >,
  Assert<
    Equal<
      CustomerGroupMemberCurrentSelf["customer_group_member"],
      CustomerGroupMemberSelf
    >
  >,
  Assert<
    Equal<
      keyof CustomerGroupProductAlternative,
      | "variant_id"
      | "sku"
      | "product_blocks"
      | "variant_blocks"
      | "available"
    >
  >,
  Assert<Equal<CustomerGroupProductAlternative["variant_blocks"], Block[]>>,
  Assert<Equal<CustomerGroupProductAlternative["product_blocks"], Block[]>>,
  Assert<Missing<CustomerGroupProductChoices, "language">>,
  Assert<Missing<CustomerGroupMemberProductChoices, "language">>,
  Assert<
    Equal<
      CustomerGroupProductChoices["alternatives"],
      CustomerGroupProductAlternative[]
    >
  >,
  Assert<
    Equal<
      CustomerGroupMemberProductChoices["alternatives"],
      CustomerGroupProductAlternative[]
    >
  >,
  Assert<
    Equal<
      keyof StorefrontGetCustomerGroupMemberProductChoicesParams,
      | "id"
      | "expected_updated_at"
      | "entitlement_id"
      | "revision_id"
    >
  >,
  Assert<
    Missing<
      GetStorefrontCustomerGroupProductChoicesParams,
      "include_price" | "product_id" | "language"
    >
  >,
  Assert<
    Equal<
      keyof CustomerGroupMemberCurrent,
      "customer_group_member" | "revision" | "terms" | "head_revision_id"
    >
  >,
  Assert<
    Equal<
      CustomerGroupMemberCurrent["terms"],
      CustomerGroupMemberAcceptedTerms | null
    >
  >,
  Assert<
    Equal<
      keyof CustomerGroupMemberAcceptedTerms,
      "group" | "quantity" | "choices" | "deliveries" | "billing_address"
    >
  >,
  Assert<
    Equal<
      Extract<
        CustomerGroupMemberSelf["status"],
        { type: "paused" }
      >["cause"]["type"],
      "requested" | "renewal_unpaid"
    >
  >,
  Assert<
    Missing<
      Extract<
        Extract<CustomerGroupMemberSelf["status"], { type: "paused" }>["cause"],
        { type: "requested" }
      >,
      "by" | "reason"
    >
  >,
  Assert<
    Equal<
      Extract<
        CustomerGroupMember["status"],
        { type: "paused" }
      >["cause"]["type"],
      "requested" | "renewal_unpaid"
    >
  >,
  Assert<
    Missing<
      Extract<CustomerGroupMember["status"], { type: "blocked" }>,
      "block"
    >
  >,
  Assert<Missing<CustomerGroupMemberRevisionSelf, "accepted_by">>,
  Assert<
    Equal<
      CustomerGroupMemberRevisionDetailSelf["revision"],
      CustomerGroupMemberRevisionSelf
    >
  >,
  Assert<
    Missing<
      ReturnType<typeof createAdmin>["eshop"],
      "customerGroupEmailConsent" | "subscription"
    >
  >,
];
