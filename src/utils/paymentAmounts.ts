import type {
  StorefrontMonriRefund,
  StorefrontPayment,
  StorefrontRecordedRefund,
  StorefrontStripeRefund,
  StripeDispute,
} from "../types/payment";

export interface PaymentAmounts {
  paid: number;
  refunded: number;
  refund_pending: number;
  disputed: number;
  net_paid: number;
}

function paid(payment: StorefrontPayment): number {
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

export type PaymentRefundView =
  | { type: "stripe"; refund: StorefrontStripeRefund }
  | { type: "monri"; refund: StorefrontMonriRefund }
  | { type: "recorded"; refund: StorefrontRecordedRefund };

export function refundAmounts(view: PaymentRefundView): { refunded: number; pending: number } {
  switch (view.type) {
    case "stripe": {
      const status = view.refund.status.type;
      return {
        refunded: status === "succeeded" ? view.refund.money.amount : 0,
        pending: ["requested", "creating", "unknown", "pending"].includes(status) ? view.refund.money.amount : 0,
      };
    }
    case "monri": {
      const status = view.refund.status;
      const refunded =
        status.type === "succeeded"
          ? status.transaction.amount
          : status.type === "confirmed_made"
            ? view.refund.money.amount
            : 0;
      return {
        refunded,
        pending: ["requested", "sending", "unknown"].includes(status.type) ? view.refund.money.amount : 0,
      };
    }
    case "recorded": {
      const status = view.refund.status.type;
      return {
        refunded: status === "sent" ? view.refund.money.amount : 0,
        pending: status === "requested" ? view.refund.money.amount : 0,
      };
    }
  }
}

function refundViews(payment: StorefrontPayment): PaymentRefundView[] {
  const type = payment.type;
  switch (type.type) {
    case "stripe_checkout":
    case "stripe_card":
      return type.refunds.map((refund) => ({ type: "stripe", refund }));
    case "monri_checkout":
    case "monri_card":
      return type.refunds.map((refund) => ({ type: "monri", refund }));
    case "cash_on_delivery":
    case "manual":
      return type.refunds.map((refund) => ({ type: "recorded", refund }));
  }
}

function refunds(payment: StorefrontPayment): { refunded: number; pending: number } {
  return refundViews(payment)
    .map(refundAmounts)
    .reduce(
      (total, amounts) => ({
        refunded: total.refunded + amounts.refunded,
        pending: total.pending + amounts.pending,
      }),
      { refunded: 0, pending: 0 },
    );
}

export function disputeWithdrawnAmount(dispute: StripeDispute): number {
  const amount = dispute.balance_changes.reduce((total, change) => {
    if (change.type !== "withdrawn" && change.type !== "reinstated") return total;
    const counted = change.money.currency === dispute.money.currency ? change.money.amount : dispute.money.amount;
    return change.type === "withdrawn" ? total + counted : total - counted;
  }, 0);
  return Math.max(amount, 0);
}

function disputed(payment: StorefrontPayment): number {
  const type = payment.type;
  if (type.type !== "stripe_checkout" && type.type !== "stripe_card") return 0;
  return type.disputes.reduce((total, dispute) => total + disputeWithdrawnAmount(dispute), 0);
}

export function paymentAmounts(payments: readonly StorefrontPayment[]): PaymentAmounts {
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
