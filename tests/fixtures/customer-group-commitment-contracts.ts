import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  ChangeSubscriptionCalendarParams,
  ChangeSubscriptionPaymentMethodParams,
  ChangeSubscriptionPlanParams,
  ControlSubscriptionParams,
  CreateSubscriptionPlanParams,
  StorefrontChangeSubscriptionPlanParams,
  StorefrontControlSubscriptionParams,
  StorefrontSubscriptionPlan,
  StorefrontSubscriptionPlanEntitlement,
  Subscription,
  SubscriptionCalendarChangeType,
  SubscriptionCalendarOptions,
  SubscriptionCalendarOptionsSelf,
  SubscriptionChangeEnd,
  SubscriptionChangeResult,
  SubscriptionChangeResultSelf,
  SubscriptionCollection,
  SubscriptionCommitment,
  SubscriptionCommitmentEndAction,
  SubscriptionControlType,
  SubscriptionPlan,
  SubscriptionPlanEntitlement,
  SubscriptionPlanEntitlementType,
  SubscriptionPlanTerm,
  SubscriptionSchedule,
  SubscriptionSelf,
  SubscriptionSelfPlanSnapshot,
  UpdateSubscriptionPlanParams,
} from "arky-sdk";
import type { StorefrontSubscriptionPlanEntitlement as PublicCardEntitlement } from "arky-sdk/types";
import type { StorefrontSubscriptionPlanEntitlement as StorefrontCardEntitlement } from "arky-sdk/storefront";
import type { StorefrontSubscriptionPlanEntitlement as AdminCardEntitlement } from "arky-sdk/admin";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type OptionalField<T, K extends keyof T> = {} extends Pick<T, K> ? true : false;
type AdminEshop = ReturnType<typeof createAdmin>["eshop"];
type AdminSubscriptions = AdminEshop["subscription"];
type BuyerSubscriptions = ReturnType<typeof createStorefront>["eshop"]["subscription"];
type BuyerPlans = ReturnType<typeof createStorefront>["subscription_plans"];
type Recurring = Extract<SubscriptionPlanTerm, { type: "recurring" }>;
type Entitlement<T extends SubscriptionPlanEntitlementType["type"]> = Extract<SubscriptionPlanEntitlementType, { type: T }>;

export type CommitmentContract = [
  Assert<Equal<keyof Recurring, "type" | "cadence" | "recovery_policy" | "commitment">>,
  Assert<Equal<Recurring["commitment"], SubscriptionCommitment | null>>,
  Assert<RequiredField<Recurring, "commitment">>,
  Assert<Equal<keyof SubscriptionCommitment, "occurrences" | "end_action">>,
  Assert<Equal<SubscriptionCommitmentEndAction, { type: "renew" } | { type: "renew_once" } | { type: "continue_without_term" } | { type: "stop" }>>,
  Assert<Equal<Extract<SubscriptionPlanTerm, { type: "permanent" }>, { type: "permanent" }>>,
];

export type EntitlementContract = [
  Assert<Equal<SubscriptionPlan["entitlements"], SubscriptionPlanEntitlement[]>>,
  Assert<RequiredField<CreateSubscriptionPlanParams, "entitlements">>,
  Assert<RequiredField<UpdateSubscriptionPlanParams, "entitlements">>,
  Assert<Missing<AdminEshop, "subscriptionPlanEntitlement">>,
  Assert<Equal<keyof SubscriptionPlanEntitlement, "id" | "type" | "allocation_weight">>,
  Assert<Equal<StorefrontSubscriptionPlan["entitlements"], StorefrontSubscriptionPlanEntitlement[]>>,
  Assert<Equal<keyof StorefrontSubscriptionPlanEntitlement, "id" | "type">>,
  Assert<Equal<StorefrontSubscriptionPlanEntitlement["type"], SubscriptionPlanEntitlementType>>,
  Assert<Equal<PublicCardEntitlement, StorefrontSubscriptionPlanEntitlement>>,
  Assert<Equal<StorefrontCardEntitlement, StorefrontSubscriptionPlanEntitlement>>,
  Assert<Equal<AdminCardEntitlement, StorefrontSubscriptionPlanEntitlement>>,
  Assert<Equal<Awaited<ReturnType<BuyerPlans["get"]>>, StorefrontSubscriptionPlan>>,
  Assert<Equal<SubscriptionSelfPlanSnapshot["entitlements"], SubscriptionPlanEntitlement[]>>,
  Assert<Equal<SubscriptionPlanEntitlementType["type"], "product" | "digital" | "rental" | "purchase_access">>,
  Assert<Equal<keyof Entitlement<"rental">, "type" | "variant_id" | "quantity" | "tax_category_id">>,
  Assert<Equal<Entitlement<"rental">["tax_category_id"], string>>,
  Assert<Equal<keyof Entitlement<"purchase_access">, "type" | "variant_ids" | "catalog_ids" | "limits" | "tax_category_id">>,
  Assert<Missing<Entitlement<"rental">, "product_id" | "delivery" | "inventory_item_id">>,
];

export type SubscriptionChangeContract = [
  Assert<Equal<SubscriptionControlType, { type: "pause"; reason: string } | { type: "cancel"; reason: string }>>,
  Assert<Equal<keyof ControlSubscriptionParams, "store_id" | "id" | "expected_updated_at" | "type">>,
  Assert<Equal<keyof StorefrontControlSubscriptionParams, "id" | "expected_updated_at" | "type">>,
  Assert<Equal<Awaited<ReturnType<AdminSubscriptions["control"]>>, Subscription>>,
  Assert<Equal<Awaited<ReturnType<BuyerSubscriptions["control"]>>, SubscriptionSelf>>,
  Assert<Equal<Awaited<ReturnType<AdminSubscriptions["calendarOptions"]>>, SubscriptionCalendarOptions>>,
  Assert<Equal<Awaited<ReturnType<BuyerSubscriptions["calendarOptions"]>>, SubscriptionCalendarOptionsSelf>>,
  Assert<Equal<Awaited<ReturnType<AdminSubscriptions["changeCalendar"]>>, SubscriptionChangeResult>>,
  Assert<Equal<Awaited<ReturnType<BuyerSubscriptions["changeCalendar"]>>, SubscriptionChangeResultSelf>>,
  Assert<Equal<Parameters<AdminSubscriptions["reviewCalendarChange"]>[0], ChangeSubscriptionCalendarParams>>,
  Assert<Equal<Parameters<AdminSubscriptions["changePaymentMethod"]>[0], ChangeSubscriptionPaymentMethodParams>>,
  Assert<Equal<Parameters<AdminSubscriptions["changePlan"]>[0], ChangeSubscriptionPlanParams>>,
  Assert<Equal<Parameters<BuyerSubscriptions["changePlan"]>[0], StorefrontChangeSubscriptionPlanParams>>,
  Assert<OptionalField<ChangeSubscriptionPlanParams, "catalog_id">>,
  Assert<OptionalField<StorefrontChangeSubscriptionPlanParams, "catalog_id">>,
  Assert<Missing<StorefrontChangeSubscriptionPlanParams, "store_id">>,
  Assert<Missing<ChangeSubscriptionCalendarParams, "request_id" | "timeline_digest" | "expected_previous_revision_id">>,
  Assert<Equal<SubscriptionCalendarChangeType, "resume" | "skip_next">>,
  Assert<Equal<SubscriptionChangeEnd, { type: "from_here_onward" } | { type: "before"; occurrence_index: number }>>,
  Assert<Equal<SubscriptionSchedule["type"], "one_time" | "recurring">>,
  Assert<Equal<SubscriptionCollection, { type: "free" } | { type: "payment_method"; payment_method_id: string }>>,
];

const committed: SubscriptionPlanTerm = {
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
const rental: SubscriptionPlanEntitlementType = { type: "rental", variant_id: "variant", quantity: 1, tax_category_id: "tax" };
const card: StorefrontSubscriptionPlanEntitlement = { id: "entitlement", type: rental };
void [committed, rental, card];
