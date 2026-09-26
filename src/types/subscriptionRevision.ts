import type { SubscriptionAcceptedTerms } from "./commerce";
import type { SubscriptionSelf } from "./subscription";
import type { EpochMilliseconds } from "./time";
import type { Money } from "./index";

export type SubscriptionSchedule =
  | { type: "one_time"; timezone: string }
  | {
      type: "recurring";
      timezone: string;
      anchor: EpochMilliseconds;
      first_period_offset: number;
    };

export type SubscriptionCollection =
  | { type: "free" }
  | { type: "saved_method"; payment_method_id: string };

export interface SubscriptionRevisionBoundary {
  effective_from_occurrence: number;
  terms: SubscriptionAcceptedTerms;
  schedule: SubscriptionSchedule;
  collection: SubscriptionCollection;
  tax_policy_version: string;
}

export type SubscriptionRevisionChangeEnd =
  | { type: "from_here_onward" }
  | { type: "before"; occurrence_index: number };

export interface SubscriptionRevisionChangeResult {
  timeline_digest: string;
  created_revision_ids: string[];
  withdrawn_revision_ids: string[];
}

export type SubscriptionCalendarChangeType = "resume" | "skip_next";

export interface SubscriptionCalendarBoundary {
  effective_from_occurrence: number;
  schedule: SubscriptionSchedule;
}

export interface SubscriptionCalendarChange {
  subscription_id: string;
  expected_updated_at: EpochMilliseconds;
  expected_previous_revision_id: string;
  expected_next_occurrence_index: number;
  first_occurrence: number;
  end: SubscriptionRevisionChangeEnd;
  type: SubscriptionCalendarChangeType;
  calendars: SubscriptionCalendarBoundary[];
  reason: string;
}

export interface GetSubscriptionCalendarOptionsParams {
  store_id?: string;
  command_id: string;
  subscription_id: string;
}

export interface SubscriptionCalendarOptions {
  subscription: SubscriptionSelf;
  expected_previous_revision_id: string;
  next_occurrence_index: number;
  timeline: SubscriptionRevisionBoundary[];
  skip_next_schedule: SubscriptionSchedule;
}

export interface ReviewSubscriptionCalendarChangeParams {
  store_id?: string;
  command_id: string;
  request: SubscriptionCalendarChange;
}

export interface AcceptSubscriptionCalendarChangeParams
  extends ReviewSubscriptionCalendarChangeParams {
  timeline_digest: string;
}

export interface SubscriptionCalendarReview {
  command_id: string;
  request: SubscriptionCalendarChange;
  timeline_digest: string;
  timeline: SubscriptionRevisionBoundary[];
  withdrawn_revision_ids: string[];
}

export interface SubscriptionCalendarChangeResult {
  command_id: string;
  accepted_at: EpochMilliseconds;
  result: SubscriptionRevisionChangeResult;
}

export interface SubscriptionFundingChange {
  subscription_id: string;
  expected_updated_at: EpochMilliseconds;
  expected_previous_revision_id: string;
  expected_next_occurrence_index: number;
  first_occurrence: number;
  end: SubscriptionRevisionChangeEnd;
  payment_method_id: string;
  reason: string;
}

export interface ReviewSubscriptionFundingChangeParams {
  store_id?: string;
  command_id: string;
  request: SubscriptionFundingChange;
}

export interface AcceptSubscriptionFundingChangeParams
  extends ReviewSubscriptionFundingChangeParams {
  timeline_digest: string;
}

export interface SubscriptionFundingReview {
  command_id: string;
  request: SubscriptionFundingChange;
  timeline_digest: string;
  timeline: SubscriptionRevisionBoundary[];
  withdrawn_revision_ids: string[];
}

export interface SubscriptionFundingChangeResult {
  command_id: string;
  accepted_at: EpochMilliseconds;
  result: SubscriptionRevisionChangeResult;
}

export interface SubscriptionCardUpdateRequest {
  subscription_id: string;
  order_id: string;
  payment_method_id: string;
}

export interface UpdateSubscriptionCardParams {
  store_id?: string;
  command_id: string;
  request: SubscriptionCardUpdateRequest;
}

export interface SubscriptionCardUpdateResult {
  command_id: string;
  accepted_at: EpochMilliseconds;
  closed_payment_id: string;
  payment_id: string;
  amount: Money;
}

export type SubscriptionRentalChange =
  | { type: "continue"; rental_id: string; to_entitlement_id: string }
  | { type: "return"; rental_id: string };

export interface SubscriptionPlanChange {
  subscription_id: string;
  expected_updated_at: EpochMilliseconds;
  expected_previous_revision_id: string;
  expected_next_occurrence_index: number;
  to_subscription_plan_id: string;
  rentals: SubscriptionRentalChange[];
  reason: string;
}

export interface ReviewSubscriptionPlanChangeParams {
  store_id?: string;
  command_id: string;
  request: SubscriptionPlanChange;
}

export interface AcceptSubscriptionPlanChangeParams
  extends ReviewSubscriptionPlanChangeParams {
  timeline_digest: string;
}

export interface SubscriptionPlanChangeReview {
  command_id: string;
  request: SubscriptionPlanChange;
  timeline_digest: string;
  timeline: SubscriptionRevisionBoundary[];
}

export interface SubscriptionPlanChangeResult {
  command_id: string;
  accepted_at: EpochMilliseconds;
  result: SubscriptionRevisionChangeResult;
}
