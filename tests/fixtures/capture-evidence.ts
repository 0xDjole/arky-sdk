import { epochMilliseconds, type MonriCaptureProof, type PaymentCaptureEvidence } from "arky-sdk";

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

export const monriEvidence = {
  type: "monri",
  payment_option_id: "550e8400-e29b-41d4-a716-446655440000",
  environment: "test",
  transaction_id: "18446744073709551615",
  proof: { type: "notification", receipt_id: "550e8400-e29b-41d4-a716-446655440001" },
} satisfies PaymentCaptureEvidence;

const { proof, ...missingReceipt } = monriEvidence;
// @ts-expect-error Monri collection evidence must identify its retained authenticated receipt.
const invalidMonriReceipt: PaymentCaptureEvidence = missingReceipt;
// @ts-expect-error Native transaction identities must not lose precision in JavaScript numbers.
const invalidMonriTransaction: PaymentCaptureEvidence = { ...monriEvidence, transaction_id: 123 };

export const monriResponseProof = {
  type: "original_response",
  claim: { id: "550e8400-e29b-41d4-a716-446655440002", fence: 1, started_at: epochMilliseconds(1000), deadline_at: epochMilliseconds(211000) },
  response_code: "000",
  transaction_created_at: epochMilliseconds(1500),
  currency: null,
} satisfies MonriCaptureProof;
export const responseEvidence = { ...monriEvidence, proof: monriResponseProof } satisfies PaymentCaptureEvidence;
const { currency, ...missingCurrency } = monriResponseProof;
// @ts-expect-error Observed currency is explicitly nullable, not omitted or inferred.
const invalidCurrency: MonriCaptureProof = missingCurrency;
const { claim, ...missingClaim } = monriResponseProof;
// @ts-expect-error An original response must retain its exact original claim.
const invalidClaim: MonriCaptureProof = missingClaim;
