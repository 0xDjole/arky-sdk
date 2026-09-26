import type { createAdmin } from "arky-sdk/admin";
import type {
  SubscriptionPlan,
  SubscriptionPlanTerm,
  SubscriptionCommitment,
  SubscriptionCommitmentEndAction,
  CreateSubscriptionPlanParams,
  UpdateSubscriptionPlanParams,
  SubscriptionPlanEntitlement,
  SubscriptionPlanEntitlementType,
  CreateSubscriptionPlanEntitlementParams,
  UpdateSubscriptionPlanEntitlementParams,
  DeleteSubscriptionPlanEntitlementParams,
  FindSubscriptionPlanEntitlementsParams,
  StorefrontSubscriptionPlan,
  StorefrontSubscriptionPlanEntitlement,
  SubscriptionPlanEntitlementSnapshotType,
  SubscriptionProductSnapshot,
  SubscriptionControl,
  SubscriptionControlType,
  ControlSubscriptionParams,
  SubscriptionControlResult,
  SubscriptionSelf,
  SubscriptionCalendarChange,
  SubscriptionCalendarChangeType,
  SubscriptionCalendarOptions,
  SubscriptionCalendarReview,
  SubscriptionCalendarChangeResult,
  GetSubscriptionCalendarOptionsParams,
  ReviewSubscriptionCalendarChangeParams,
  AcceptSubscriptionCalendarChangeParams,
  SubscriptionFundingChange,
  SubscriptionFundingReview,
  SubscriptionFundingChangeResult,
  ReviewSubscriptionFundingChangeParams,
  AcceptSubscriptionFundingChangeParams,
  SubscriptionRevisionBoundary,
  SubscriptionRevisionChangeEnd,
  SubscriptionRevisionChangeResult,
  SubscriptionSchedule,
  SubscriptionCollection,
  SubscriptionAcceptedTerms,
  EpochMilliseconds,
} from "arky-sdk";
import type {
  SubscriptionControlResult as PublicControlResult,
  SubscriptionCalendarChange as PublicCalendarChange,
  SubscriptionFundingChange as PublicFundingChange,
} from "arky-sdk/types";

type Same<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type True<T extends true> = T;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Admin = ReturnType<typeof createAdmin>["eshop"];
type EntitlementApi = Admin["subscriptionPlanEntitlement"];
type SubscriptionApi = Admin["subscription"];
type Recurring = Extract<SubscriptionPlanTerm, { type: "recurring" }>;
type Entitlement<T extends SubscriptionPlanEntitlementType["type"]> = Extract<SubscriptionPlanEntitlementType, { type: T }>;
type RentalSnapshot = Extract<SubscriptionPlanEntitlementSnapshotType, { type: "rental" }>;

export type CommitmentContract = [
  True<Same<keyof Recurring, "type" | "cadence" | "recovery_policy" | "commitment">>,
  True<Same<Recurring["commitment"], SubscriptionCommitment | null>>,
  True<RequiredField<Recurring, "commitment">>,
  True<Same<keyof SubscriptionCommitment, "occurrences" | "end_action">>,
  True<Same<SubscriptionCommitmentEndAction, { type: "renew" } | { type: "renew_once" } | { type: "continue_without_term" } | { type: "stop" }>>,
  True<Same<Extract<SubscriptionPlanTerm, { type: "permanent" }>, { type: "permanent" }>>,
];

export type EntitlementContract = [
  True<"entitlements" extends keyof SubscriptionPlan ? false : true>,
  True<"entitlements" extends keyof CreateSubscriptionPlanParams ? false : true>,
  True<"entitlements" extends keyof UpdateSubscriptionPlanParams ? false : true>,
  True<Same<StorefrontSubscriptionPlan["entitlements"], StorefrontSubscriptionPlanEntitlement[]>>,
  True<Same<keyof StorefrontSubscriptionPlanEntitlement, "id" | "type">>,
  True<Same<StorefrontSubscriptionPlanEntitlement["type"], SubscriptionPlanEntitlementType>>,
  True<Same<keyof SubscriptionPlanEntitlement, "id" | "store_id" | "subscription_plan_id" | "type" | "allocation_weight" | "created_at" | "updated_at">>,
  True<Same<SubscriptionPlanEntitlementType["type"], "product" | "digital_product" | "rental">>,
  True<Same<keyof Entitlement<"rental">, "type" | "product_id" | "variant_id" | "quantity">>,
  True<Same<Entitlement<"rental">["quantity"], number>>,
  True<"delivery" extends keyof Entitlement<"rental"> ? false : true>,
  True<"inventory_item_id" extends keyof Entitlement<"rental"> ? false : true>,
  True<Same<keyof RentalSnapshot, "type" | "snapshot" | "quantity" | "inventory_item_id">>,
  True<Same<RentalSnapshot["snapshot"], SubscriptionProductSnapshot>>,
  True<Same<keyof EntitlementApi, "find" | "create" | "update" | "delete">>,
  True<Same<Parameters<EntitlementApi["find"]>[0], FindSubscriptionPlanEntitlementsParams>>,
  True<Same<keyof FindSubscriptionPlanEntitlementsParams, "store_id" | "subscription_plan_id">>,
  True<Same<Awaited<ReturnType<EntitlementApi["find"]>>, { items: SubscriptionPlanEntitlement[] }>>,
  True<Same<Parameters<EntitlementApi["create"]>[0], CreateSubscriptionPlanEntitlementParams>>,
  True<Same<Awaited<ReturnType<EntitlementApi["create"]>>, SubscriptionPlanEntitlement>>,
  True<Same<Awaited<ReturnType<EntitlementApi["update"]>>, SubscriptionPlanEntitlement>>,
  True<Same<Awaited<ReturnType<EntitlementApi["delete"]>>, void>>,
  True<Same<keyof CreateSubscriptionPlanEntitlementParams, "store_id" | "subscription_plan_id" | "entitlement_id" | "type" | "allocation_weight">>,
  True<Same<Parameters<EntitlementApi["update"]>[0], UpdateSubscriptionPlanEntitlementParams>>,
  True<Same<keyof UpdateSubscriptionPlanEntitlementParams, "store_id" | "subscription_plan_id" | "id" | "expected_updated_at" | "type" | "allocation_weight">>,
  True<Same<Parameters<EntitlementApi["delete"]>[0], DeleteSubscriptionPlanEntitlementParams>>,
  True<Same<keyof DeleteSubscriptionPlanEntitlementParams, "store_id" | "subscription_plan_id" | "id" | "expected_updated_at">>,
];

export type SubscriptionControlContract = [
  True<Same<SubscriptionControlResult, PublicControlResult>>,
  True<Same<SubscriptionCalendarChange, PublicCalendarChange>>,
  True<Same<SubscriptionFundingChange, PublicFundingChange>>,
  True<Same<SubscriptionControlType, { type: "pause"; reason: string } | { type: "cancel"; reason: string }>>,
  True<Same<keyof SubscriptionControl, "subscription_id" | "expected_updated_at" | "type">>,
  True<Same<SubscriptionControl["type"], SubscriptionControlType>>,
  True<Same<keyof ControlSubscriptionParams, "store_id" | "command_id" | "request">>,
  True<Same<keyof SubscriptionControlResult, "command_id" | "accepted_at" | "subscription">>,
  True<Same<SubscriptionControlResult["subscription"], SubscriptionSelf>>,
  True<Same<Parameters<SubscriptionApi["control"]>[0], ControlSubscriptionParams>>,
  True<Same<Awaited<ReturnType<SubscriptionApi["control"]>>, SubscriptionControlResult>>,
  True<Same<keyof GetSubscriptionCalendarOptionsParams, "store_id" | "command_id" | "subscription_id">>,
  True<Same<Parameters<SubscriptionApi["calendarOptions"]>[0], GetSubscriptionCalendarOptionsParams>>,
  True<Same<Awaited<ReturnType<SubscriptionApi["calendarOptions"]>>, SubscriptionCalendarOptions>>,
  True<Same<keyof SubscriptionCalendarOptions, "subscription" | "expected_previous_revision_id" | "next_occurrence_index" | "timeline" | "skip_next_schedule">>,
  True<Same<SubscriptionCalendarOptions["timeline"], SubscriptionRevisionBoundary[]>>,
  True<Same<keyof SubscriptionRevisionBoundary, "effective_from_occurrence" | "terms" | "schedule" | "collection" | "tax_policy_version">>,
  True<Same<SubscriptionRevisionBoundary["terms"], SubscriptionAcceptedTerms>>,
  True<Same<SubscriptionSchedule["type"], "one_time" | "recurring">>,
  True<Same<keyof Extract<SubscriptionSchedule, { type: "recurring" }>, "type" | "timezone" | "anchor" | "first_period_offset">>,
  True<Same<SubscriptionCollection, { type: "free" } | { type: "saved_method"; payment_method_id: string }>>,
  True<Same<SubscriptionRevisionChangeEnd, { type: "from_here_onward" } | { type: "before"; occurrence_index: number }>>,
  True<Same<SubscriptionCalendarChangeType, "resume" | "skip_next">>,
  True<Same<keyof SubscriptionCalendarChange, "subscription_id" | "expected_updated_at" | "expected_previous_revision_id" | "expected_next_occurrence_index" | "first_occurrence" | "end" | "type" | "calendars" | "reason">>,
  True<Same<keyof ReviewSubscriptionCalendarChangeParams, "store_id" | "command_id" | "request">>,
  True<Same<keyof AcceptSubscriptionCalendarChangeParams, "store_id" | "command_id" | "request" | "timeline_digest">>,
  True<Same<Parameters<SubscriptionApi["calendarReview"]>[0], ReviewSubscriptionCalendarChangeParams>>,
  True<Same<Awaited<ReturnType<SubscriptionApi["calendarReview"]>>, SubscriptionCalendarReview>>,
  True<Same<keyof SubscriptionCalendarReview, "command_id" | "request" | "timeline_digest" | "timeline" | "withdrawn_revision_ids">>,
  True<Same<Parameters<SubscriptionApi["calendarAccept"]>[0], AcceptSubscriptionCalendarChangeParams>>,
  True<Same<Awaited<ReturnType<SubscriptionApi["calendarAccept"]>>, SubscriptionCalendarChangeResult>>,
  True<Same<keyof SubscriptionCalendarChangeResult, "command_id" | "accepted_at" | "result">>,
  True<Same<keyof SubscriptionRevisionChangeResult, "timeline_digest" | "created_revision_ids" | "withdrawn_revision_ids">>,
  True<Same<keyof SubscriptionFundingChange, "subscription_id" | "expected_updated_at" | "expected_previous_revision_id" | "expected_next_occurrence_index" | "first_occurrence" | "end" | "payment_method_id" | "reason">>,
  True<Same<keyof AcceptSubscriptionFundingChangeParams, "store_id" | "command_id" | "request" | "timeline_digest">>,
  True<Same<Parameters<SubscriptionApi["fundingReview"]>[0], ReviewSubscriptionFundingChangeParams>>,
  True<Same<Awaited<ReturnType<SubscriptionApi["fundingReview"]>>, SubscriptionFundingReview>>,
  True<Same<Parameters<SubscriptionApi["fundingAccept"]>[0], AcceptSubscriptionFundingChangeParams>>,
  True<Same<Awaited<ReturnType<SubscriptionApi["fundingAccept"]>>, SubscriptionFundingChangeResult>>,
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
const rental: SubscriptionPlanEntitlementType = { type: "rental", product_id: "product", variant_id: "variant", quantity: 1 };
const cancel: SubscriptionControl = {
  subscription_id: "subscription",
  expected_updated_at: 1700000000000 as EpochMilliseconds,
  type: { type: "cancel", reason: "Customer asked to stop" },
};
void [committed, rental, cancel];
