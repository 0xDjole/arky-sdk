import { epochMilliseconds } from "arky-sdk";
import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  Actor,
  CancelCustomerGroupMemberParams,
  ChangeCustomerGroupMemberTermsParams,
  CreateCustomerGroupParams,
  CustomerGroup,
  CustomerGroupCommitment,
  CustomerGroupCommitmentEndAction,
  CustomerGroupEntitlement,
  CustomerGroupEntitlementType,
  CustomerGroupMember,
  CustomerGroupMemberAcceptedTerms,
  CustomerGroupMemberPurchaseLimitUsage,
  CustomerGroupProductChoice,
  CustomerGroupMemberActionParams,
  CustomerGroupMemberCalendar,
  CustomerGroupMemberCalendarSelf,
  CustomerGroupMemberChange,
  CustomerGroupMemberChangeSelf,
  CustomerGroupMemberPaymentMethod,
  CustomerGroupMemberRevision,
  CustomerGroupMemberSchedule,
  CustomerGroupMemberSelf,
  CustomerGroupMemberType,
  CustomerGroupOccurrence,
  CustomerGroupSelfSnapshot,
  CustomerGroupStart,
  CustomerGroupTerm,
  CustomerGroupTaxPolicy,
  EpochMilliseconds,
  PauseCustomerGroupMemberParams,
  PurchaseRequirement,
  PurchaseAccessLimitAvailability,
  PurchaseRequirementScope,
  SkipNextCustomerGroupMemberRenewalParams,
  StorefrontSkipNextCustomerGroupMemberRenewalParams,
  CustomerGroupMemberPurchaseAccessGrant,
  CustomerGroupMemberPurchaseAccessSource,
  ProductReference,
  StorefrontCustomerGroup,
  StorefrontCustomerGroupEntitlement,
  StorefrontCustomerGroupRentalProduct,
  StorefrontSwitchCustomerGroupMemberParams,
  StorefrontChangeCustomerGroupMemberTermsParams,
  SwitchCustomerGroupMemberParams,
  UpdateCustomerGroupParams,
  TimeRange,
} from "arky-sdk";
import type { StorefrontCustomerGroupEntitlement as PublicCardEntitlement } from "arky-sdk/types";
import type { StorefrontCustomerGroupEntitlement as StorefrontCardEntitlement } from "arky-sdk/storefront";
import type { StorefrontCustomerGroupEntitlement as AdminCardEntitlement } from "arky-sdk/admin";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type OptionalField<T, K extends keyof T> = {} extends Pick<T, K> ? true : false;
type AdminEshop = ReturnType<typeof createAdmin>["eshop"];
type AdminMembers = AdminEshop["customerGroupMember"];
type BuyerMembers = ReturnType<typeof createStorefront>["eshop"]["customerGroupMember"];
type BuyerGroups = ReturnType<typeof createStorefront>["eshop"]["customerGroup"];
type Recurring = Extract<CustomerGroupTerm, { type: "recurring" }>;
type RecurringMember = Extract<CustomerGroupMemberType, { type: "recurring" }>;
type Entitlement<T extends CustomerGroupEntitlementType["type"]> = Extract<CustomerGroupEntitlementType, { type: T }>;

export type CommitmentContract = [
  Assert<Equal<keyof CustomerGroupTaxPolicy, "id" | "areas" | "starts_at" | "ends_at" | "type">>,
  Assert<Equal<keyof Recurring, "type" | "cadence" | "renewal_reminder_days" | "commitment" | "on_exhaustion" | "unpaid_order" | "retry_offsets_seconds" | "recovery_window_seconds">>,
  Assert<Equal<Recurring["commitment"], CustomerGroupCommitment | null>>,
  Assert<RequiredField<Recurring, "commitment">>,
  Assert<Equal<keyof CustomerGroupCommitment, "occurrences" | "end_action">>,
  Assert<Equal<CustomerGroupCommitmentEndAction, { type: "renew" } | { type: "renew_once" } | { type: "continue_without_term" } | { type: "stop" }>>,
  Assert<Equal<Extract<CustomerGroupTerm, { type: "permanent" }>, { type: "permanent" }>>,
  Assert<Equal<CustomerGroupStart, { type: "on_acceptance" } | { type: "scheduled"; starts_at: EpochMilliseconds } | { type: "switch"; customer_group_member_id: string } | { type: "amend"; customer_group_member_id: string; expected_updated_at: EpochMilliseconds; reason: string }>>,
  Assert<Equal<CustomerGroupOccurrence["type"], "permanent" | "period">>,
  Assert<Equal<Extract<CustomerGroupOccurrence, { type: "period" }>["period"], TimeRange>>,
  Assert<Equal<PurchaseRequirementScope, { type: "per_location" } | { type: "company_wide" }>>,
  Assert<Equal<keyof PurchaseRequirement, "minimum_quantity" | "qualifying_variants" | "scope">>,
];

export type EntitlementContract = [
  Assert<Equal<CustomerGroup["entitlements"], CustomerGroupEntitlement[]>>,
  Assert<RequiredField<CreateCustomerGroupParams, "entitlements">>,
  Assert<RequiredField<UpdateCustomerGroupParams, "entitlements">>,
  Assert<RequiredField<UpdateCustomerGroupParams, "expected_updated_at">>,
  Assert<Missing<AdminEshop, "subscriptionPlanEntitlement">>,
  Assert<Equal<keyof CustomerGroupEntitlement, "id" | "type" | "allocation_weight">>,
  Assert<Equal<StorefrontCustomerGroup["entitlements"], StorefrontCustomerGroupEntitlement[]>>,
  Assert<Equal<keyof StorefrontCustomerGroupEntitlement, "id" | "type">>,
  Assert<Equal<StorefrontCustomerGroupEntitlement["type"], CustomerGroupEntitlementType>>,
  Assert<Equal<PublicCardEntitlement, StorefrontCustomerGroupEntitlement>>,
  Assert<Equal<StorefrontCardEntitlement, StorefrontCustomerGroupEntitlement>>,
  Assert<Equal<AdminCardEntitlement, StorefrontCustomerGroupEntitlement>>,
  Assert<Equal<Awaited<ReturnType<BuyerGroups["get"]>>, StorefrontCustomerGroup>>,
  Assert<Equal<StorefrontCustomerGroup["rental_products"], StorefrontCustomerGroupRentalProduct[]>>,
  Assert<RequiredField<StorefrontCustomerGroup, "rental_products">>,
  Assert<Equal<keyof StorefrontCustomerGroupRentalProduct, "entitlement_id" | "product">>,
  Assert<Equal<StorefrontCustomerGroupRentalProduct["entitlement_id"], string>>,
  Assert<Equal<StorefrontCustomerGroupRentalProduct["product"], ProductReference | null>>,
  Assert<Missing<CustomerGroup, "rental_products">>,
  Assert<Equal<CustomerGroupSelfSnapshot["entitlements"], CustomerGroupEntitlement[]>>,
  Assert<Equal<CustomerGroupEntitlementType["type"], "product" | "rental" | "purchase_access">>,
  Assert<Equal<keyof Entitlement<"product">, "type" | "variant_ids" | "delivery">>,
  Assert<Equal<Entitlement<"product">["variant_ids"], string[]>>,
  Assert<Equal<Extract<Entitlement<"product">["delivery"], { type: "none" }>, { type: "none"; quantity: number }>>,
  Assert<Equal<keyof Entitlement<"rental">, "type" | "variant_id" | "quantity" | "tax_category_id">>,
  Assert<Equal<Entitlement<"rental">["tax_category_id"], string>>,
  Assert<Equal<keyof Entitlement<"purchase_access">, "type" | "variant_ids" | "catalog_ids" | "limits" | "tax_category_id">>,
  Assert<Missing<Entitlement<"rental">, "product_id" | "delivery" | "inventory_item_id">>,
];

export type MemberChangeContract = [
  Assert<Equal<keyof RecurringMember, "type" | "next_occurrence_index" | "payment_method" | "renewal_end_at">>,
  Assert<Equal<RecurringMember["payment_method"], CustomerGroupMemberPaymentMethod | null>>,
  Assert<Equal<CustomerGroupMemberPaymentMethod["authorization"]["by"], Actor>>,
  Assert<Equal<keyof CustomerGroupMemberActionParams, "store_id" | "id" | "expected_updated_at">>,
  Assert<Equal<Parameters<AdminMembers["cancel"]>[0], CancelCustomerGroupMemberParams>>,
  Assert<RequiredField<CancelCustomerGroupMemberParams, "notify_customer">>,
  Assert<Missing<CancelCustomerGroupMemberParams, "language">>,
  Assert<Equal<Parameters<AdminMembers["pause"]>[0], PauseCustomerGroupMemberParams>>,
  Assert<RequiredField<PauseCustomerGroupMemberParams, "resumes_at">>,
  Assert<Equal<Parameters<AdminMembers["skipNext"]>[0], SkipNextCustomerGroupMemberRenewalParams>>,
  Assert<Equal<Parameters<BuyerMembers["skipNext"]>[0], StorefrontSkipNextCustomerGroupMemberRenewalParams>>,
  Assert<Equal<keyof SkipNextCustomerGroupMemberRenewalParams, "store_id" | "id" | "expected_updated_at" | "occurrence_index">>,
  Assert<Equal<keyof StorefrontSkipNextCustomerGroupMemberRenewalParams, "id" | "expected_updated_at" | "occurrence_index">>,
  Assert<Equal<CustomerGroupMemberPurchaseAccessGrant["source"], CustomerGroupMemberPurchaseAccessSource>>,
  Assert<Equal<CustomerGroupMemberPurchaseAccessSource, { type: "order"; order_id: string; order_purchase_access_line_item_id: string } | { type: "assigned" }>>,
  Assert<Missing<CustomerGroupMemberPurchaseAccessGrant, "order_id" | "order_purchase_access_line_item_id">>,
  Assert<Equal<keyof CustomerGroupMemberPurchaseAccessGrant, "source" | "entitlement_id" | "starts_at" | "ends_at" | "variant_ids" | "catalog_id" | "limits">>,
  Assert<Equal<Awaited<ReturnType<AdminMembers["cancel"]>>, CustomerGroupMember>>,
  Assert<Equal<Awaited<ReturnType<BuyerMembers["cancel"]>>, CustomerGroupMemberSelf>>,
  Assert<Equal<Awaited<ReturnType<AdminMembers["getCalendar"]>>, CustomerGroupMemberCalendar>>,
  Assert<Equal<Awaited<ReturnType<BuyerMembers["getCalendar"]>>, CustomerGroupMemberCalendarSelf>>,
  Assert<Equal<Awaited<ReturnType<AdminMembers["switch"]>>, CustomerGroupMemberChange>>,
  Assert<Equal<Awaited<ReturnType<BuyerMembers["switch"]>>, CustomerGroupMemberChangeSelf>>,
  Assert<Equal<Parameters<AdminMembers["reviewSwitch"]>[0], SwitchCustomerGroupMemberParams>>,
  Assert<Equal<Parameters<BuyerMembers["switch"]>[0], StorefrontSwitchCustomerGroupMemberParams>>,
  Assert<Equal<Parameters<AdminMembers["reviewTerms"]>[0], ChangeCustomerGroupMemberTermsParams>>,
  Assert<Equal<Parameters<BuyerMembers["changeTerms"]>[0], StorefrontChangeCustomerGroupMemberTermsParams>>,
  Assert<Equal<ChangeCustomerGroupMemberTermsParams["terms"], CustomerGroupMemberAcceptedTerms>>,
  Assert<Missing<StorefrontChangeCustomerGroupMemberTermsParams, "group" | "terms" | "store_id">>,
  Assert<RequiredField<StorefrontChangeCustomerGroupMemberTermsParams, "billing_address">>,
  Assert<RequiredField<SwitchCustomerGroupMemberParams, "choices">>,
  Assert<Equal<SwitchCustomerGroupMemberParams["choices"], CustomerGroupProductChoice[]>>,
  Assert<Equal<keyof CustomerGroupMemberChange, "customer_group_member" | "created" | "withdrawn">>,
  Assert<Equal<CustomerGroupMemberChange["created"], CustomerGroupMemberRevision | null>>,
  Assert<RequiredField<SwitchCustomerGroupMemberParams, "catalog_id">>,
  Assert<RequiredField<StorefrontSwitchCustomerGroupMemberParams, "catalog_id">>,
  Assert<RequiredField<SwitchCustomerGroupMemberParams, "catalog_item_price_id">>,
  Assert<RequiredField<StorefrontSwitchCustomerGroupMemberParams, "catalog_item_price_id">>,
  Assert<Missing<SwitchCustomerGroupMemberParams, "rentals">>,
  Assert<Missing<StorefrontSwitchCustomerGroupMemberParams, "store_id" | "rentals">>,
  Assert<Equal<CustomerGroupMemberSchedule["type"], "permanent" | "recurring">>,
  Assert<Missing<AdminMembers, "control" | "calendarOptions" | "changeCalendar" | "changePaymentMethod" | "changePlan">>,
  Assert<Missing<BuyerMembers, "control" | "calendarOptions" | "changeCalendar" | "changePaymentMethod" | "changePlan" | "revoke" | "scheduleEnd">>,
];

export type UsageContract = [
  Assert<Equal<CustomerGroupMemberPurchaseLimitUsage["period"], TimeRange>>,
  Assert<Equal<PurchaseAccessLimitAvailability["period"], TimeRange>>,
  Assert<Equal<PurchaseAccessLimitAvailability["customer_group_member_purchase_limit_usage_id"], string | null>>,
  Assert<Missing<PurchaseAccessLimitAvailability, "customer_group_member_purchase_limit_period_id">>,
  Assert<RequiredField<CustomerGroupMemberAcceptedTerms, "quantity">>,
  Assert<RequiredField<CustomerGroupMemberAcceptedTerms, "choices">>,
];

const committed: CustomerGroupTerm = {
  type: "recurring",
  renewal_reminder_days: null,
  cadence: { interval: "month", interval_count: 1 },
  retry_offsets_seconds: [86400],
  recovery_window_seconds: 604800,
  on_exhaustion: { type: "pause" },
  unpaid_order: { type: "retain_debt" },
  commitment: { occurrences: 12, end_action: { type: "renew_once" } },
};
const rental: CustomerGroupEntitlementType = { type: "rental", variant_id: "variant", quantity: 1, tax_category_id: "tax" };
const card: StorefrontCustomerGroupEntitlement = { id: "entitlement", type: rental };
const recurring: CustomerGroupMemberType = {
  type: "recurring",
  next_occurrence_index: 2,
  payment_method: { payment_method_id: "method", authorization: { by: { type: "customer", customer_id: "customer", customer_session_id: "session" }, accepted_at: epochMilliseconds(1) } },
  renewal_end_at: null,
};
void [committed, rental, card, recurring];
