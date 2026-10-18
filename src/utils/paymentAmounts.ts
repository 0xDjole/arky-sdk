import type { Payment, StripeDispute } from "../types/payment";

export interface PaymentAmounts {
  paid: number;
  refunded: number;
  refund_pending: number;
  disputed: number;
  net_paid: number;
}

function paid(payment: Payment): number {
  const type = payment.type;
  switch (type.type) {
    case "stripe_checkout":
    case "stripe_card":
      return type.status.type === "paid" ? type.status.amount : 0;
    case "monri_checkout":
      return type.status.type === "paid" ? type.status.transaction.amount : 0;
    case "monri_card":
      if (type.status.type === "paid") return type.status.transaction.amount;
      return type.status.type === "confirmed_made" ? payment.money.amount : 0;
    case "cash_on_delivery":
    case "manual":
      return type.collections
        .filter((collection) => collection.status.type === "active")
        .reduce((total, collection) => total + collection.money.amount, 0);
  }
}

function refunds(payment: Payment): { refunded: number; pending: number } {
  const type = payment.type;
  let refunded = 0;
  let pending = 0;
  switch (type.type) {
    case "stripe_checkout":
    case "stripe_card":
      for (const refund of type.refunds) {
        if (refund.status.type === "succeeded") refunded += refund.money.amount;
        if (["requested", "creating", "unknown", "pending"].includes(refund.status.type)) pending += refund.money.amount;
      }
      break;
    case "monri_checkout":
    case "monri_card":
      for (const refund of type.refunds) {
        if (refund.status.type === "succeeded") refunded += refund.status.transaction.amount;
        if (refund.status.type === "confirmed_made") refunded += refund.money.amount;
        if (["requested", "sending", "unknown"].includes(refund.status.type)) pending += refund.money.amount;
      }
      break;
    case "cash_on_delivery":
    case "manual":
      for (const refund of type.refunds) {
        if (refund.status.type === "sent") refunded += refund.money.amount;
        if (refund.status.type === "requested") pending += refund.money.amount;
      }
      break;
  }
  return { refunded, pending };
}

function withdrawn(dispute: StripeDispute): number {
  const amount = dispute.balance_changes.reduce((total, change) => {
    if (change.type === "withdrawn") return total + change.money.amount;
    if (change.type === "reinstated") return total - change.money.amount;
    return total;
  }, 0);
  return Math.max(amount, 0);
}

function disputed(payment: Payment): number {
  const type = payment.type;
  if (type.type !== "stripe_checkout" && type.type !== "stripe_card") return 0;
  return type.disputes.reduce((total, dispute) => total + withdrawn(dispute), 0);
}

export function paymentAmounts(payments: readonly Payment[]): PaymentAmounts {
  const [first] = payments;
  if (first && payments.some((payment) => payment.order_id !== first.order_id || payment.money.currency !== first.money.currency)) {
    throw new TypeError("Payment amounts add up the payments of one order in one currency");
  }
  const amounts: PaymentAmounts = { paid: 0, refunded: 0, refund_pending: 0, disputed: 0, net_paid: 0 };
  for (const payment of payments) {
    const settled = refunds(payment);
    amounts.paid += paid(payment);
    amounts.refunded += settled.refunded;
    amounts.refund_pending += settled.pending;
    amounts.disputed += disputed(payment);
  }
  amounts.net_paid = amounts.paid - amounts.refunded - amounts.disputed;
  return amounts;
}
