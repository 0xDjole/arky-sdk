import type {
  BookingOfferingStatus,
  BookingResourceStatus,
  BookingServiceStatus,
  CustomerGroup,
  CustomerGroupMember,
  CustomerGroupStatus,
  FindStorefrontSubscriptionPlansParams,
  GetStorefrontSubscriptionPlanParams,
  StorefrontSubscriptionPlan,
  StorefrontSubscriptionPlanEntitlement,
  SubscriptionOfferingStatus,
  SubscriptionPlanEntitlement,
  SubscriptionPlanEntitlementType,
  SubscriptionPlanStatus,
} from "arky-sdk";
import type * as Public from "arky-sdk/types";
import type { createAdmin } from "arky-sdk/admin";
import type { StorefrontClient } from "arky-sdk/storefront";

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Eshop = ReturnType<typeof createAdmin>["eshop"];

export type MembershipContracts = [
  Expect<Equal<NonNullable<FindStorefrontSubscriptionPlansParams["sort_field"]>, "key" | "created_at" | "price" | "catalog_order">>,
  Expect<Equal<FindStorefrontSubscriptionPlansParams["include_price"], boolean | undefined>>,
  Expect<Equal<GetStorefrontSubscriptionPlanParams["subscription_offering_id"], string | undefined>>,
  Expect<Equal<CustomerGroupStatus["type"], "active" | "deleting">>,
  Expect<Equal<keyof CustomerGroup, "id" | "store_id" | "key" | "status" | "created_at" | "updated_at">>,
  Expect<Equal<keyof CustomerGroupMember, "id" | "store_id" | "customer_group_id" | "customer_id" | "created_at">>,
  Expect<Missing<CustomerGroup, "communication">>,
  Expect<Missing<CustomerGroup, "join_policy">>,
  Expect<Equal<keyof Eshop["customerGroup"], "find" | "get" | "getByKey" | "create" | "delete">>,
  Expect<Equal<keyof Eshop["customerGroupMember"], "find" | "get" | "add" | "remove">>,
  Expect<Missing<Eshop, "customerGroupEmailConsent">>,
  Expect<Missing<StorefrontClient, "customer_groups">>,
  Expect<Missing<StorefrontClient, "customer_group_email_consents">>,
  Expect<Equal<StorefrontSubscriptionPlan["entitlements"], StorefrontSubscriptionPlanEntitlement[]>>,
  Expect<Equal<keyof StorefrontSubscriptionPlanEntitlement, "id" | "type">>,
  Expect<Equal<StorefrontSubscriptionPlanEntitlement["type"], SubscriptionPlanEntitlementType>>,
  Expect<Missing<StorefrontSubscriptionPlanEntitlement, "allocation_weight">>,
  Expect<Equal<SubscriptionPlanEntitlement["allocation_weight"], number>>,
  Expect<Equal<Public.StorefrontSubscriptionPlanEntitlement, StorefrontSubscriptionPlanEntitlement>>,
  Expect<Missing<StorefrontSubscriptionPlan, "purchase_allowed">>,
  Expect<Equal<Extract<keyof StorefrontSubscriptionPlan, "status" | "store_id">, never>>,
  Expect<Equal<SubscriptionPlanStatus["type"], "draft" | "active" | "closed" | "archived">>,
  Expect<Equal<SubscriptionOfferingStatus["type"], "draft" | "active" | "closed" | "archived">>,
  Expect<Equal<BookingServiceStatus["type"], "draft" | "active" | "archived" | "deleting">>,
  Expect<Equal<BookingResourceStatus["type"], "draft" | "active" | "archived" | "deleting">>,
  Expect<Equal<BookingOfferingStatus["type"], "draft" | "active" | "archived" | "deleting">>,
];
