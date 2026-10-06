import type { createAdmin } from "arky-sdk/admin";
import type {
  Automation, AutomationRun, AutomationTrigger, AutomationStepType, AutomationRecipient, AutomationCondition,
  AutomationExit, AutomationStatus, AutomationRunStatus, AutomationSubject, AutomationRunExit, AutomationEnrollmentSkip,
  AutomationRunStepOutcome, ChangeAutomationStatusParams, CreateAutomationParams, FindAutomationRunsParams,
  FindAutomationsParams, MessageDelivery, MessageDeliverySource, ResendReceiptParams, EmailSender, PaginatedResponse,
  CustomerActionOrigin, EmailTemplateData, SendEmailTemplateTestParams,
} from "arky-sdk";

type Same<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type True<T extends true> = T;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Api = ReturnType<typeof createAdmin>["automation"];
type TemplateApi = ReturnType<typeof createAdmin>["notification"]["template"];

export type AutomationContracts = [
  True<Same<keyof Api, "create" | "update" | "get" | "find" | "delete" | "activate" | "pause" | "resendReceipt" | "run">>,
  True<Same<keyof Api["run"], "find" | "get">>,
  True<Same<Awaited<ReturnType<Api["create"]>>, Automation>>,
  True<Same<Awaited<ReturnType<Api["activate"]>>, Automation>>,
  True<Same<Awaited<ReturnType<Api["pause"]>>, Automation>>,
  True<Same<Awaited<ReturnType<Api["delete"]>>, boolean>>,
  True<Same<Awaited<ReturnType<Api["find"]>>, PaginatedResponse<Automation>>>,
  True<Same<Awaited<ReturnType<Api["run"]["find"]>>, PaginatedResponse<AutomationRun>>>,
  True<Same<Awaited<ReturnType<Api["resendReceipt"]>>, MessageDelivery>>,
  True<Same<Parameters<Api["resendReceipt"]>[0], ResendReceiptParams>>,
  True<Same<keyof ResendReceiptParams, "store_id" | "order_id" | "request_id">>,
  True<RequiredField<ChangeAutomationStatusParams, "expected_updated_at">>,
  True<RequiredField<CreateAutomationParams, "active">>,
  True<Same<keyof FindAutomationsParams, "store_id" | "key" | "status" | "trigger_type" | "limit" | "cursor">>,
  True<Same<keyof FindAutomationRunsParams, "store_id" | "automation_id" | "subject_id" | "status" | "limit" | "cursor">>,
  True<Same<AutomationStatus["type"], "draft" | "active" | "paused">>,
  True<Same<AutomationTrigger["type"],
    | "order_placed" | "order_accepted" | "order_cancelled" | "order_refunded" | "fulfillment_dispatched" | "fulfillment_delivered"
    | "fulfillment_ready_for_pickup" | "fulfillment_job_opened" | "fulfillment_job_held" | "booking_reminder_due"
    | "return_requested" | "return_approved" | "return_declined" | "cart_sent" | "company_access_prepared"
    | "subscription_started" | "subscription_renewed"
    | "subscription_renewal_upcoming" | "subscription_payment_failed" | "subscription_cancelled" | "form_submitted"
    | "any_form_submitted" | "form_submission_stage_changed" | "customer_created" | "customer_joined_group" | "first_order_placed"
    | "cart_abandoned" | "schedule">>,
  True<Same<AutomationStepType["type"], "wait" | "branch" | "send_email" | "add_to_customer_group" | "remove_from_customer_group" | "enroll_in_campaign" | "send_webhook">>,
  True<Same<Extract<AutomationStepType, { type: "send_webhook" }>, { type: "send_webhook"; webhook_id: string }>>,
  True<Same<Extract<AutomationRunStepOutcome, { type: "webhook_requested" }>, { type: "webhook_requested"; webhook_delivery_id: string }>>,
  True<Same<Extract<AutomationRunStepOutcome, { type: "webhook_skipped" }>, { type: "webhook_skipped"; reason: string }>>,
  True<Same<Extract<CustomerActionOrigin, { type: "automation" }>, { type: "automation"; automation_id: string; run_id: string }>>,
  True<Same<Extract<EmailTemplateData, { type: "sign_in" }>, { type: "sign_in"; sender: EmailSender }>>,
  True<"any_form_submission" extends EmailTemplateData["type"] ? true : false>,
  True<Same<Parameters<TemplateApi["test"]>[0], SendEmailTemplateTestParams>>,
  True<Same<Awaited<ReturnType<TemplateApi["test"]>>, MessageDelivery>>,
  True<Same<SendEmailTemplateTestParams["sender"], EmailSender>>,
  True<RequiredField<SendEmailTemplateTestParams, "request_id">>,
  True<Same<Extract<AutomationStepType, { type: "send_email" }>["sender"], EmailSender>>,
  True<RequiredField<Extract<AutomationStepType, { type: "enroll_in_campaign" }>, "customer_group_id">>,
  True<Same<AutomationRecipient["type"], "subject" | "store_role" | "location_staff" | "email">>,
  True<Same<AutomationCondition["type"], "has_ordered_since_start" | "submitted_by_customer" | "cart_revised" | "in_customer_group" | "order_total_at_least" | "all" | "any">>,
  True<Same<AutomationExit["type"], "order_placed" | "order_cancelled" | "cart_converted" | "subscription_cancelled" | "left_customer_group">>,
  True<Same<AutomationRunStatus["type"], "running" | "waiting" | "held" | "completed" | "exited" | "failed">>,
  True<Same<AutomationRunExit["type"], "exit" | "no_longer_eligible" | "step_deleted">>,
  True<Same<AutomationSubject["type"], "store" | "customer" | "company_access" | "order" | "fulfillment" | "fulfillment_job" | "booking" | "return" | "cart" | "subscription" | "form_submission">>,
  True<Same<AutomationEnrollmentSkip["type"], "already_enrolled" | "completed" | "not_consented" | "suppressed" | "campaign_unavailable">>,
  True<"campaign_enrollment_skipped" extends AutomationRunStepOutcome["type"] ? true : false>,
  True<RequiredField<AutomationRun, "step_results">>,
  True<Same<MessageDeliverySource["type"], "account_sign_in" | "customer_sign_in" | "store_invite" | "group_email_consent" | "automation_step" | "receipt_resend" | "template_test" | "campaign_message" | "support_reply">>,
  True<Same<Extract<MessageDeliverySource, { type: "template_test" }>, { type: "template_test"; template_id: string; request_id: string }>>,
  True<RequiredField<MessageDelivery, "recipient_key">>,
  True<RequiredField<Extract<MessageDeliverySource, { type: "store_invite" }>, "session_id">>,
];
