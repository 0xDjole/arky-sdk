import { epochMilliseconds, type PaymentCaptureEvidence } from "arky-sdk";

const evidence = {
  type: "stripe",
  connected_account_id: "acct_capture",
  livemode: false,
  charge_id: "ch_capture",
  payment_intent_id: null,
  last_observation: {
    type: "exact_read",
    observed_at: epochMilliseconds(1000),
    provider_updated_at: null,
  },
} satisfies PaymentCaptureEvidence;

const { connected_account_id, ...missingAccount } = evidence;
const { livemode, ...missingMode } = evidence;
// @ts-expect-error Capture evidence must retain its original Stripe account.
const invalidAccount: PaymentCaptureEvidence = missingAccount;
// @ts-expect-error Capture evidence must explicitly retain test/live mode.
const invalidMode: PaymentCaptureEvidence = missingMode;

export type CaptureEvidenceContract = typeof evidence;
