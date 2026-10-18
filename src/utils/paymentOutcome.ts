import type { Payment } from "../types/payment";

export type PaymentOutcome = "paid" | "pay_later" | "awaiting" | "unconfirmed" | "failed";

function collected(payment: Payment): number {
  const type = payment.type;
  if (type.type !== "cash_on_delivery" && type.type !== "manual") return 0;
  return type.collections
    .filter((collection) => collection.status.type === "active" && collection.money.currency === payment.money.currency)
    .reduce((total, collection) => total + collection.money.amount, 0);
}

export function paymentOutcome(payment: Payment): PaymentOutcome {
  const recorded = payment.type.type === "cash_on_delivery" || payment.type.type === "manual";
  switch (payment.status) {
    case "paid":
      return "paid";
    case "open":
      if (!recorded) return "awaiting";
      return collected(payment) >= payment.money.amount ? "paid" : "pay_later";
    case "pending":
    case "requires_action":
    case "closing":
      return "awaiting";
    case "unknown":
      return "unconfirmed";
    case "expired":
    case "cancelled":
    case "declined":
    case "failed":
      return "failed";
  }
}

export function latestPayment(payments: readonly Payment[]): Payment | null {
  return payments.reduce<Payment | null>(
    (latest, payment) => (latest === null || payment.created_at > latest.created_at ? payment : latest),
    null,
  );
}
