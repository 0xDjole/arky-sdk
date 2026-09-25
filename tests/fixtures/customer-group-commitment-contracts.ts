import type { createAdmin } from "arky-sdk/admin";
import type {
  CustomerGroupPlan,
  CustomerGroupPlanTerm,
  CustomerGroupCommitment,
  CustomerGroupCommitmentEndAction,
  CreateCustomerGroupPlanParams,
  UpdateCustomerGroupPlanParams,
  CustomerGroupPlanBenefit,
  CustomerGroupPlanBenefitType,
  CreateCustomerGroupPlanBenefitParams,
  UpdateCustomerGroupPlanBenefitParams,
  DeleteCustomerGroupPlanBenefitParams,
  FindCustomerGroupPlanBenefitsParams,
  StorefrontCustomerGroupPlan,
  StorefrontCustomerGroupPlanBenefit,
  CustomerGroupBenefitSnapshotType,
  CustomerGroupProductSnapshot,
  CustomerGroupSubscriptionControl,
  CustomerGroupSubscriptionControlType,
  ControlCustomerGroupSubscriptionParams,
  CustomerGroupSubscriptionControlResult,
  CustomerGroupSubscriptionSelf,
  CustomerGroupCalendarChange,
  CustomerGroupCalendarChangeType,
  CustomerGroupCalendarOptions,
  CustomerGroupCalendarReview,
  CustomerGroupCalendarChangeResult,
  GetCustomerGroupCalendarOptionsParams,
  ReviewCustomerGroupCalendarChangeParams,
  AcceptCustomerGroupCalendarChangeParams,
  CustomerGroupFundingChange,
  CustomerGroupFundingReview,
  CustomerGroupFundingChangeResult,
  ReviewCustomerGroupFundingChangeParams,
  AcceptCustomerGroupFundingChangeParams,
  CustomerGroupRevisionBoundary,
  CustomerGroupRevisionChangeEnd,
  CustomerGroupRevisionChangeResult,
  CustomerGroupSubscriptionSchedule,
  CustomerGroupCollection,
  CustomerGroupAcceptedTerms,
  EpochMilliseconds,
} from "arky-sdk";
import type {
  CustomerGroupSubscriptionControlResult as PublicControlResult,
  CustomerGroupCalendarChange as PublicCalendarChange,
  CustomerGroupFundingChange as PublicFundingChange,
} from "arky-sdk/types";

type Same<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type True<T extends true> = T;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Admin = ReturnType<typeof createAdmin>["eshop"];
type BenefitApi = Admin["customerGroupPlanBenefit"];
type SubscriptionApi = Admin["customerGroupSubscription"];
type Recurring = Extract<CustomerGroupPlanTerm, { type: "recurring" }>;
type Benefit<T extends CustomerGroupPlanBenefitType["type"]> = Extract<CustomerGroupPlanBenefitType, { type: T }>;
type RentalSnapshot = Extract<CustomerGroupBenefitSnapshotType, { type: "rental" }>;

export type CommitmentContract = [
  True<Same<keyof Recurring, "type" | "cadence" | "recovery_policy" | "commitment">>,
  True<Same<Recurring["commitment"], CustomerGroupCommitment | null>>,
  True<RequiredField<Recurring, "commitment">>,
  True<Same<keyof CustomerGroupCommitment, "occurrences" | "end_action">>,
  True<Same<CustomerGroupCommitmentEndAction, { type: "renew" } | { type: "renew_once" } | { type: "continue_without_term" } | { type: "stop" }>>,
  True<Same<Extract<CustomerGroupPlanTerm, { type: "permanent" }>, { type: "permanent" }>>,
];

export type BenefitContract = [
  True<"benefits" extends keyof CustomerGroupPlan ? false : true>,
  True<"benefits" extends keyof CreateCustomerGroupPlanParams ? false : true>,
  True<"benefits" extends keyof UpdateCustomerGroupPlanParams ? false : true>,
  True<Same<StorefrontCustomerGroupPlan["benefits"], StorefrontCustomerGroupPlanBenefit[]>>,
  True<Same<keyof StorefrontCustomerGroupPlanBenefit, "id" | "type">>,
  True<Same<StorefrontCustomerGroupPlanBenefit["type"], CustomerGroupPlanBenefitType>>,
  True<Same<keyof CustomerGroupPlanBenefit, "id" | "store_id" | "customer_group_plan_id" | "type" | "allocation_weight" | "created_at" | "updated_at">>,
  True<Same<CustomerGroupPlanBenefitType["type"], "product" | "digital_product" | "rental">>,
  True<Same<keyof Benefit<"rental">, "type" | "product_id" | "variant_id" | "quantity">>,
  True<Same<Benefit<"rental">["quantity"], number>>,
  True<"delivery" extends keyof Benefit<"rental"> ? false : true>,
  True<"inventory_item_id" extends keyof Benefit<"rental"> ? false : true>,
  True<Same<keyof RentalSnapshot, "type" | "snapshot" | "quantity" | "inventory_item_id">>,
  True<Same<RentalSnapshot["snapshot"], CustomerGroupProductSnapshot>>,
  True<Same<keyof BenefitApi, "find" | "create" | "update" | "delete">>,
  True<Same<Parameters<BenefitApi["find"]>[0], FindCustomerGroupPlanBenefitsParams>>,
  True<Same<keyof FindCustomerGroupPlanBenefitsParams, "store_id" | "customer_group_plan_id">>,
  True<Same<Awaited<ReturnType<BenefitApi["find"]>>, { items: CustomerGroupPlanBenefit[] }>>,
  True<Same<Parameters<BenefitApi["create"]>[0], CreateCustomerGroupPlanBenefitParams>>,
  True<Same<Awaited<ReturnType<BenefitApi["create"]>>, CustomerGroupPlanBenefit>>,
  True<Same<Awaited<ReturnType<BenefitApi["update"]>>, CustomerGroupPlanBenefit>>,
  True<Same<Awaited<ReturnType<BenefitApi["delete"]>>, void>>,
  True<Same<keyof CreateCustomerGroupPlanBenefitParams, "store_id" | "customer_group_plan_id" | "benefit_id" | "type" | "allocation_weight">>,
  True<Same<Parameters<BenefitApi["update"]>[0], UpdateCustomerGroupPlanBenefitParams>>,
  True<Same<keyof UpdateCustomerGroupPlanBenefitParams, "store_id" | "customer_group_plan_id" | "id" | "expected_updated_at" | "type" | "allocation_weight">>,
  True<Same<Parameters<BenefitApi["delete"]>[0], DeleteCustomerGroupPlanBenefitParams>>,
  True<Same<keyof DeleteCustomerGroupPlanBenefitParams, "store_id" | "customer_group_plan_id" | "id" | "expected_updated_at">>,
];

export type SubscriptionControlContract = [
  True<Same<CustomerGroupSubscriptionControlResult, PublicControlResult>>,
  True<Same<CustomerGroupCalendarChange, PublicCalendarChange>>,
  True<Same<CustomerGroupFundingChange, PublicFundingChange>>,
  True<Same<CustomerGroupSubscriptionControlType, { type: "pause"; reason: string } | { type: "cancel"; reason: string }>>,
  True<Same<keyof CustomerGroupSubscriptionControl, "customer_group_subscription_id" | "expected_updated_at" | "type">>,
  True<Same<CustomerGroupSubscriptionControl["type"], CustomerGroupSubscriptionControlType>>,
  True<Same<keyof ControlCustomerGroupSubscriptionParams, "store_id" | "command_id" | "request">>,
  True<Same<keyof CustomerGroupSubscriptionControlResult, "command_id" | "accepted_at" | "subscription">>,
  True<Same<CustomerGroupSubscriptionControlResult["subscription"], CustomerGroupSubscriptionSelf>>,
  True<Same<Parameters<SubscriptionApi["control"]>[0], ControlCustomerGroupSubscriptionParams>>,
  True<Same<Awaited<ReturnType<SubscriptionApi["control"]>>, CustomerGroupSubscriptionControlResult>>,
  True<Same<keyof GetCustomerGroupCalendarOptionsParams, "store_id" | "command_id" | "customer_group_subscription_id">>,
  True<Same<Parameters<SubscriptionApi["calendarOptions"]>[0], GetCustomerGroupCalendarOptionsParams>>,
  True<Same<Awaited<ReturnType<SubscriptionApi["calendarOptions"]>>, CustomerGroupCalendarOptions>>,
  True<Same<keyof CustomerGroupCalendarOptions, "subscription" | "expected_previous_revision_id" | "next_occurrence_index" | "timeline" | "skip_next_schedule">>,
  True<Same<CustomerGroupCalendarOptions["timeline"], CustomerGroupRevisionBoundary[]>>,
  True<Same<keyof CustomerGroupRevisionBoundary, "effective_from_occurrence" | "terms" | "schedule" | "collection" | "tax_policy_version">>,
  True<Same<CustomerGroupRevisionBoundary["terms"], CustomerGroupAcceptedTerms>>,
  True<Same<CustomerGroupSubscriptionSchedule["type"], "one_time" | "recurring">>,
  True<Same<keyof Extract<CustomerGroupSubscriptionSchedule, { type: "recurring" }>, "type" | "timezone" | "anchor" | "first_period_offset">>,
  True<Same<CustomerGroupCollection, { type: "free" } | { type: "saved_method"; customer_payment_method_id: string }>>,
  True<Same<CustomerGroupRevisionChangeEnd, { type: "from_here_onward" } | { type: "before"; occurrence_index: number }>>,
  True<Same<CustomerGroupCalendarChangeType, "resume" | "skip_next">>,
  True<Same<keyof CustomerGroupCalendarChange, "customer_group_subscription_id" | "expected_updated_at" | "expected_previous_revision_id" | "expected_next_occurrence_index" | "first_occurrence" | "end" | "type" | "calendars" | "reason">>,
  True<Same<keyof ReviewCustomerGroupCalendarChangeParams, "store_id" | "command_id" | "request">>,
  True<Same<keyof AcceptCustomerGroupCalendarChangeParams, "store_id" | "command_id" | "request" | "timeline_digest">>,
  True<Same<Parameters<SubscriptionApi["calendarReview"]>[0], ReviewCustomerGroupCalendarChangeParams>>,
  True<Same<Awaited<ReturnType<SubscriptionApi["calendarReview"]>>, CustomerGroupCalendarReview>>,
  True<Same<keyof CustomerGroupCalendarReview, "command_id" | "request" | "timeline_digest" | "timeline" | "withdrawn_revision_ids">>,
  True<Same<Parameters<SubscriptionApi["calendarAccept"]>[0], AcceptCustomerGroupCalendarChangeParams>>,
  True<Same<Awaited<ReturnType<SubscriptionApi["calendarAccept"]>>, CustomerGroupCalendarChangeResult>>,
  True<Same<keyof CustomerGroupCalendarChangeResult, "command_id" | "accepted_at" | "result">>,
  True<Same<keyof CustomerGroupRevisionChangeResult, "timeline_digest" | "created_revision_ids" | "withdrawn_revision_ids">>,
  True<Same<keyof CustomerGroupFundingChange, "customer_group_subscription_id" | "expected_updated_at" | "expected_previous_revision_id" | "expected_next_occurrence_index" | "first_occurrence" | "end" | "customer_payment_method_id" | "reason">>,
  True<Same<keyof AcceptCustomerGroupFundingChangeParams, "store_id" | "command_id" | "request" | "timeline_digest">>,
  True<Same<Parameters<SubscriptionApi["fundingReview"]>[0], ReviewCustomerGroupFundingChangeParams>>,
  True<Same<Awaited<ReturnType<SubscriptionApi["fundingReview"]>>, CustomerGroupFundingReview>>,
  True<Same<Parameters<SubscriptionApi["fundingAccept"]>[0], AcceptCustomerGroupFundingChangeParams>>,
  True<Same<Awaited<ReturnType<SubscriptionApi["fundingAccept"]>>, CustomerGroupFundingChangeResult>>,
];

const committed: CustomerGroupPlanTerm = {
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
const rental: CustomerGroupPlanBenefitType = { type: "rental", product_id: "product", variant_id: "variant", quantity: 1 };
const cancel: CustomerGroupSubscriptionControl = {
  customer_group_subscription_id: "subscription",
  expected_updated_at: 1700000000000 as EpochMilliseconds,
  type: { type: "cancel", reason: "Customer asked to stop" },
};
void [committed, rental, cancel];
