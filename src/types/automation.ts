import type { EmailSender } from "./index";
import type { EpochMilliseconds } from "./time";

export type AutomationStatus =
  | { type: "draft" }
  | { type: "active"; activated_at: EpochMilliseconds }
  | { type: "paused"; paused_at: EpochMilliseconds };

export type AutomationStatusType = AutomationStatus["type"];

export type AutomationTrigger =
  | { type: "order_placed" }
  | { type: "order_accepted" }
  | { type: "order_cancelled" }
  | { type: "order_refunded" }
  | { type: "fulfillment_dispatched" }
  | { type: "fulfillment_delivered" }
  | { type: "fulfillment_ready_for_pickup" }
  | { type: "fulfillment_job_opened" }
  | { type: "fulfillment_job_held" }
  | { type: "booking_reminder_due" }
  | { type: "return_requested" }
  | { type: "return_approved" }
  | { type: "return_declined" }
  | { type: "cart_sent" }
  | { type: "company_access_prepared" }
  | { type: "subscription_started" }
  | { type: "subscription_renewed" }
  | { type: "subscription_renewal_upcoming"; days_before: number }
  | { type: "subscription_payment_failed" }
  | { type: "subscription_cancelled" }
  | { type: "form_submitted"; form_id: string }
  | { type: "any_form_submitted" }
  | { type: "form_submission_stage_changed"; form_id: string; stage_id: string }
  | { type: "customer_created" }
  | { type: "customer_joined_group"; customer_group_id: string }
  | { type: "first_order_placed" }
  | { type: "cart_abandoned" }
  | { type: "schedule"; cron: string; timezone: string };

export type AutomationTriggerType = AutomationTrigger["type"];

export type AutomationRecipient =
  | { type: "subject" }
  | { type: "store_role"; store_role_id: string }
  | { type: "location_staff" }
  | { type: "email"; email: string };

export type AutomationCondition =
  | { type: "has_ordered_since_start" }
  | { type: "submitted_by_customer" }
  | { type: "cart_revised" }
  | { type: "in_customer_group"; customer_group_id: string }
  | { type: "order_total_at_least"; amount: number }
  | { type: "all"; conditions: AutomationCondition[] }
  | { type: "any"; conditions: AutomationCondition[] };

export type AutomationStepType =
  | { type: "wait"; minutes: number }
  | {
      type: "branch";
      condition: AutomationCondition;
      then_steps: AutomationStep[];
      else_steps: AutomationStep[];
    }
  | {
      type: "send_email";
      to: AutomationRecipient;
      sender: EmailSender;
      template_id: string;
    }
  | { type: "add_to_customer_group"; customer_group_id: string }
  | { type: "remove_from_customer_group"; customer_group_id: string }
  | { type: "enroll_in_campaign"; campaign_id: string; customer_group_id: string }
  | { type: "send_webhook"; webhook_id: string };

export interface AutomationStep {
  id: string;
  type: AutomationStepType;
}

export type AutomationExit =
  | { type: "order_placed" }
  | { type: "order_cancelled" }
  | { type: "cart_converted" }
  | { type: "subscription_cancelled" }
  | { type: "left_customer_group"; customer_group_id: string };

export interface Automation {
  id: string;
  store_id: string;
  key: string;
  trigger: AutomationTrigger;
  steps: AutomationStep[];
  exits: AutomationExit[];
  status: AutomationStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type AutomationSubject =
  | { type: "store" }
  | { type: "customer"; customer_id: string }
  | { type: "company_access"; customer_id: string; company_membership_id: string }
  | { type: "order"; order_id: string }
  | { type: "fulfillment"; order_id: string; fulfillment_id: string }
  | { type: "fulfillment_job"; fulfillment_job_id: string }
  | { type: "booking"; order_id: string; booking_line_id: string }
  | { type: "return"; return_id: string }
  | { type: "cart"; cart_id: string }
  | { type: "subscription"; subscription_id: string }
  | { type: "form_submission"; form_submission_id: string };

export type AutomationRunExit =
  | { type: "exit"; exit: AutomationExit }
  | { type: "no_longer_eligible" }
  | { type: "step_deleted" };

export type AutomationRunStatus =
  | { type: "running"; step_id: string }
  | { type: "waiting"; step_id: string; until: EpochMilliseconds }
  | { type: "held"; step_id: string; held_at: EpochMilliseconds }
  | { type: "completed"; completed_at: EpochMilliseconds }
  | { type: "exited"; exit: AutomationRunExit; exited_at: EpochMilliseconds }
  | {
      type: "failed";
      step_id: string;
      error: string;
      failed_at: EpochMilliseconds;
    };

export type AutomationRunStatusType = AutomationRunStatus["type"];

export type AutomationEnrollmentSkip =
  | { type: "already_enrolled"; campaign_enrollment_id: string }
  | { type: "completed"; campaign_enrollment_id: string }
  | { type: "not_consented" }
  | { type: "suppressed" }
  | { type: "campaign_unavailable" };

export type AutomationRunStepOutcome =
  | { type: "waited"; until: EpochMilliseconds }
  | { type: "branched"; matched: boolean }
  | { type: "email_requested"; delivery_ids: string[] }
  | { type: "receipt_fell_back"; failed_delivery_id: string; delivery_id: string }
  | { type: "email_skipped"; reason: string }
  | { type: "added_to_customer_group"; changed: boolean }
  | { type: "removed_from_customer_group"; changed: boolean }
  | { type: "customer_group_skipped"; reason: string }
  | { type: "enrolled_in_campaign"; campaign_enrollment_id: string }
  | { type: "campaign_enrollment_skipped"; reason: AutomationEnrollmentSkip }
  | { type: "webhook_requested"; webhook_delivery_id: string }
  | { type: "webhook_skipped"; reason: string };

export interface AutomationRunStepResult {
  step_id: string;
  outcome: AutomationRunStepOutcome;
  at: EpochMilliseconds;
}

export interface AutomationRun {
  id: string;
  store_id: string;
  automation_id: string;
  trigger_event_id: string;
  subject: AutomationSubject;
  status: AutomationRunStatus;
  step_results: AutomationRunStepResult[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateAutomationParams {
  store_id: string;
  id: string;
  key: string;
  trigger: AutomationTrigger;
  steps: AutomationStep[];
  exits: AutomationExit[];
  active: boolean;
}

export interface UpdateAutomationParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key: string;
  trigger: AutomationTrigger;
  steps: AutomationStep[];
  exits: AutomationExit[];
}

export interface GetAutomationParams {
  store_id: string;
  id: string;
}

export interface ChangeAutomationStatusParams extends GetAutomationParams {
  expected_updated_at: EpochMilliseconds;
}

export type DeleteAutomationParams = ChangeAutomationStatusParams;

export interface FindAutomationsParams {
  store_id: string;
  key?: string;
  status?: AutomationStatusType;
  trigger_type?: AutomationTriggerType;
  limit?: number;
  cursor?: string;
}

export interface ResendReceiptParams {
  store_id: string;
  order_id: string;
  request_id: string;
}

export interface GetAutomationRunParams {
  store_id: string;
  id: string;
}

export interface FindAutomationRunsParams {
  store_id: string;
  automation_id?: string;
  subject_id?: string;
  status?: AutomationRunStatusType;
  limit?: number;
  cursor?: string;
}
