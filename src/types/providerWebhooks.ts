export const STRIPE_WEBHOOK_PATH = "/v1/webhooks/stripe";
export const MONRI_WEBHOOK_PATH = "/v1/webhooks/monri";
export const RESEND_WEBHOOK_PATH = "/v1/webhooks/resend";

export const STRIPE_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "payment_intent.created",
  "payment_intent.processing",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
  "payment_intent.requires_action",
  "setup_intent.succeeded",
  "setup_intent.setup_failed",
  "setup_intent.canceled",
  "payment_method.detached",
  "refund.created",
  "refund.updated",
  "refund.failed",
  "charge.dispute.created",
  "charge.dispute.updated",
  "charge.dispute.closed",
  "charge.dispute.funds_withdrawn",
  "charge.dispute.funds_reinstated",
] as const;

export const RESEND_WEBHOOK_EVENTS = [
  "email.sent",
  "email.delivered",
  "email.delivery_delayed",
  "email.bounced",
  "email.failed",
  "email.complained",
  "email.suppressed",
  "email.received",
] as const;
