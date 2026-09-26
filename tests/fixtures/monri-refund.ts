import { epochMilliseconds, type CustomerMoneyEvidence, type MonriRefundResult, type RefundProvider } from "arky-sdk";

export const result = {
  claim: { id: "550e8400-e29b-41d4-a716-446655440000", fence: 1, started_at: epochMilliseconds(1000), deadline_at: epochMilliseconds(211000) },
  transaction_id: "18446744073709551615",
  amount: 4000,
  currency: null,
  status: "approved",
  response_code: "0000",
  transaction_created_at: epochMilliseconds(1200),
  observed_at: epochMilliseconds(1300),
} satisfies MonriRefundResult;

export const provider = { type: "monri", payment_option_id: "550e8400-e29b-41d4-a716-446655440001", environment: "test", result } satisfies RefundProvider;
export const evidence = { type: "monri", transaction_id: result.transaction_id } satisfies CustomerMoneyEvidence;
const { currency, ...missingCurrency } = result;
// @ts-expect-error Observed currency is explicitly nullable, never omitted.
const invalidCurrency: MonriRefundResult = missingCurrency;
// @ts-expect-error Provider transaction IDs must retain integer precision.
const invalidTransaction: MonriRefundResult = { ...result, transaction_id: 123 };
// @ts-expect-error Original XML result is not an exact provider read.
provider.result.observation;
