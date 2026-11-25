import type { Payment, StorefrontPayment } from "../types/payment";

export type PaymentOutcome = "paid" | "awaiting" | "unconfirmed" | "failed";

export function paymentOutcome(payment: Payment | StorefrontPayment): PaymentOutcome {
  switch (payment.status) {
    case "paid":
      return "paid";
    case "pending":
    case "open":
    case "requires_action":
    case "closing":
      return "awaiting";
    case "unknown":
      return "unconfirmed";
    case "expired":
    case "cancelled":
    case "declined":
    case "failed":
    case "voided":
      return "failed";
  }
}

export function latestPayment<P extends Payment | StorefrontPayment>(payments: readonly P[]): P | null {
  return payments.reduce<P | null>(
    (latest, payment) => (latest === null || payment.created_at > latest.created_at ? payment : latest),
    null,
  );
}
