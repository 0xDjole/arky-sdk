import type { CustomerGroupAcceptedTerms } from "./commerce";
import type { CustomerGroupSubscriptionSelf } from "./customerGroupSubscription";
import type { EpochMilliseconds } from "./time";

export type CustomerGroupSubscriptionSchedule =
  | { type: "one_time"; timezone: string }
  | {
      type: "recurring";
      timezone: string;
      anchor: EpochMilliseconds;
      first_period_offset: number;
    };

export type CustomerGroupCollection =
  | { type: "free" }
  | { type: "saved_method"; customer_payment_method_id: string };

export interface CustomerGroupRevisionBoundary {
  effective_from_occurrence: number;
  terms: CustomerGroupAcceptedTerms;
  schedule: CustomerGroupSubscriptionSchedule;
  collection: CustomerGroupCollection;
  tax_policy_version: string;
}

export type CustomerGroupRevisionChangeEnd =
  | { type: "from_here_onward" }
  | { type: "before"; occurrence_index: number };

export interface CustomerGroupRevisionChangeResult {
  timeline_digest: string;
  created_revision_ids: string[];
  withdrawn_revision_ids: string[];
}

export type CustomerGroupCalendarChangeType = "resume" | "skip_next";

export interface CustomerGroupCalendarBoundary {
  effective_from_occurrence: number;
  schedule: CustomerGroupSubscriptionSchedule;
}

export interface CustomerGroupCalendarChange {
  customer_group_subscription_id: string;
  expected_updated_at: EpochMilliseconds;
  expected_previous_revision_id: string;
  expected_next_occurrence_index: number;
  first_occurrence: number;
  end: CustomerGroupRevisionChangeEnd;
  type: CustomerGroupCalendarChangeType;
  calendars: CustomerGroupCalendarBoundary[];
  reason: string;
}

export interface GetCustomerGroupCalendarOptionsParams {
  store_id?: string;
  command_id: string;
  customer_group_subscription_id: string;
}

export interface CustomerGroupCalendarOptions {
  subscription: CustomerGroupSubscriptionSelf;
  expected_previous_revision_id: string;
  next_occurrence_index: number;
  timeline: CustomerGroupRevisionBoundary[];
  skip_next_schedule: CustomerGroupSubscriptionSchedule;
}

export interface ReviewCustomerGroupCalendarChangeParams {
  store_id?: string;
  command_id: string;
  request: CustomerGroupCalendarChange;
}

export interface AcceptCustomerGroupCalendarChangeParams
  extends ReviewCustomerGroupCalendarChangeParams {
  timeline_digest: string;
}

export interface CustomerGroupCalendarReview {
  command_id: string;
  request: CustomerGroupCalendarChange;
  timeline_digest: string;
  timeline: CustomerGroupRevisionBoundary[];
  withdrawn_revision_ids: string[];
}

export interface CustomerGroupCalendarChangeResult {
  command_id: string;
  accepted_at: EpochMilliseconds;
  result: CustomerGroupRevisionChangeResult;
}

export interface CustomerGroupFundingChange {
  customer_group_subscription_id: string;
  expected_updated_at: EpochMilliseconds;
  expected_previous_revision_id: string;
  expected_next_occurrence_index: number;
  first_occurrence: number;
  end: CustomerGroupRevisionChangeEnd;
  customer_payment_method_id: string;
  reason: string;
}

export interface ReviewCustomerGroupFundingChangeParams {
  store_id?: string;
  command_id: string;
  request: CustomerGroupFundingChange;
}

export interface AcceptCustomerGroupFundingChangeParams
  extends ReviewCustomerGroupFundingChangeParams {
  timeline_digest: string;
}

export interface CustomerGroupFundingReview {
  command_id: string;
  request: CustomerGroupFundingChange;
  timeline_digest: string;
  timeline: CustomerGroupRevisionBoundary[];
  withdrawn_revision_ids: string[];
}

export interface CustomerGroupFundingChangeResult {
  command_id: string;
  accepted_at: EpochMilliseconds;
  result: CustomerGroupRevisionChangeResult;
}
