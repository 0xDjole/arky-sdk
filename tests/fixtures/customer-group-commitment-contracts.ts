import { epochMilliseconds } from "arky-sdk";
import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  Actor,
  CreateCustomerGroupParams,
  CustomerGroup,
  CustomerGroupCommitment,
  CustomerGroupCommitmentEndAction,
  CustomerGroupEntitlement,
  CustomerGroupEntitlementType,
  CustomerGroupMember,
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
  EpochMilliseconds,
  PauseCustomerGroupMemberParams,
  PurchaseRequirementScope,
  SkipNextCustomerGroupMemberPurchaseParams,
  StorefrontCustomerGroup,
  StorefrontCustomerGroupEntitlement,
  StorefrontSwitchCustomerGroupMemberParams,
  SwitchCustomerGroupMemberParams,
  UpdateCustomerGroupParams,
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
  Assert<Equal<keyof Recurring, "type" | "cadence" | "recovery_policy" | "commitment">>,
  Assert<Equal<Recurring["commitment"], CustomerGroupCommitment | null>>,
  Assert<RequiredField<Recurring, "commitment">>,
  Assert<Equal<keyof CustomerGroupCommitment, "occurrences" | "end_action">>,
  Assert<Equal<CustomerGroupCommitmentEndAction, { type: "renew" } | { type: "renew_once" } | { type: "continue_without_term" } | { type: "stop" }>>,
  Assert<Equal<Extract<CustomerGroupTerm, { type: "permanent" }>, { type: "permanent" }>>,
  Assert<Equal<CustomerGroupStart, { type: "on_acceptance" } | { type: "scheduled"; starts_at: EpochMilliseconds } | { type: "switch"; customer_group_member_id: string }>>,
  Assert<Equal<CustomerGroupOccurrence["type"], "permanent" | "period">>,
  Assert<Equal<PurchaseRequirementScope, { type: "per_location" } | { type: "company_wide" }>>,
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
  Assert<Equal<CustomerGroupSelfSnapshot["entitlements"], CustomerGroupEntitlement[]>>,
  Assert<Equal<CustomerGroupEntitlementType["type"], "product" | "rental" | "purchase_access">>,
  Assert<Equal<keyof Entitlement<"rental">, "type" | "variant_id" | "quantity" | "tax_category_id">>,
  Assert<Equal<Entitlement<"rental">["tax_category_id"], string>>,
  Assert<Equal<keyof Entitlement<"purchase_access">, "type" | "variant_ids" | "catalog_ids" | "limits" | "tax_category_id">>,
  Assert<Missing<Entitlement<"rental">, "product_id" | "delivery" | "inventory_item_id">>,
];

export type MemberChangeContract = [
  Assert<Equal<keyof RecurringMember, "type" | "next_occurrence_index" | "payment_method" | "purchase_end_at">>,
  Assert<Equal<RecurringMember["payment_method"], CustomerGroupMemberPaymentMethod | null>>,
  Assert<Equal<CustomerGroupMemberPaymentMethod["authorization"]["by"], Actor>>,
  Assert<Equal<keyof CustomerGroupMemberActionParams, "store_id" | "id" | "expected_updated_at">>,
  Assert<Equal<Parameters<AdminMembers["cancel"]>[0], CustomerGroupMemberActionParams>>,
  Assert<Equal<Parameters<AdminMembers["pause"]>[0], PauseCustomerGroupMemberParams>>,
  Assert<Equal<Parameters<AdminMembers["skipNext"]>[0], SkipNextCustomerGroupMemberPurchaseParams>>,
  Assert<Equal<Awaited<ReturnType<AdminMembers["cancel"]>>, CustomerGroupMember>>,
  Assert<Equal<Awaited<ReturnType<BuyerMembers["cancel"]>>, CustomerGroupMemberSelf>>,
  Assert<Equal<Awaited<ReturnType<AdminMembers["calendar"]>>, CustomerGroupMemberCalendar>>,
  Assert<Equal<Awaited<ReturnType<BuyerMembers["calendar"]>>, CustomerGroupMemberCalendarSelf>>,
  Assert<Equal<Awaited<ReturnType<AdminMembers["switch"]>>, CustomerGroupMemberChange>>,
  Assert<Equal<Awaited<ReturnType<BuyerMembers["switch"]>>, CustomerGroupMemberChangeSelf>>,
  Assert<Equal<Parameters<AdminMembers["reviewSwitch"]>[0], SwitchCustomerGroupMemberParams>>,
  Assert<Equal<Parameters<BuyerMembers["switch"]>[0], StorefrontSwitchCustomerGroupMemberParams>>,
  Assert<Equal<keyof CustomerGroupMemberChange, "customer_group_member" | "created" | "withdrawn">>,
  Assert<Equal<CustomerGroupMemberChange["created"], CustomerGroupMemberRevision | null>>,
  Assert<OptionalField<SwitchCustomerGroupMemberParams, "catalog_id">>,
  Assert<OptionalField<StorefrontSwitchCustomerGroupMemberParams, "catalog_id">>,
  Assert<Missing<SwitchCustomerGroupMemberParams, "rentals">>,
  Assert<Missing<StorefrontSwitchCustomerGroupMemberParams, "store_id" | "rentals">>,
  Assert<Equal<CustomerGroupMemberSchedule["type"], "permanent" | "recurring">>,
  Assert<Missing<AdminMembers, "control" | "calendarOptions" | "changeCalendar" | "changePaymentMethod" | "changePlan">>,
  Assert<Missing<BuyerMembers, "control" | "calendarOptions" | "changeCalendar" | "changePaymentMethod" | "changePlan" | "revoke" | "scheduleEnd">>,
];

const committed: CustomerGroupTerm = {
  type: "recurring",
  cadence: { interval: "month", interval_count: 1 },
  recovery_policy: {
    retry_offsets_seconds: [86400],
    recovery_window_seconds: 604800,
    on_exhaustion: { type: "pause" },
    unpaid_order: { type: "retain_debt" },
  },
  commitment: { occurrences: 12, end_action: { type: "renew_once" } },
};
const rental: CustomerGroupEntitlementType = { type: "rental", variant_id: "variant", quantity: 1, tax_category_id: "tax" };
const card: StorefrontCustomerGroupEntitlement = { id: "entitlement", type: rental };
const recurring: CustomerGroupMemberType = {
  type: "recurring",
  next_occurrence_index: 2,
  payment_method: { payment_method_id: "method", authorization: { by: { type: "customer", customer_id: "customer", customer_session_id: "session" }, accepted_at: epochMilliseconds(1) } },
  purchase_end_at: null,
};
void [committed, rental, card, recurring];
