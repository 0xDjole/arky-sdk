import { paymentAmounts, refundAmounts } from "arky-sdk";
import { paymentAmounts as utilsPaymentAmounts, refundAmounts as utilsRefundAmounts } from "arky-sdk/utils";
import type {
  MonriRefund,
  Payment,
  PaymentAmounts,
  PaymentRefundView,
  RecordedRefund,
  RecordedRefundMethod,
  StorefrontMonriRefund,
  StorefrontPayment,
  StorefrontRecordedRefund,
  StorefrontStripeRefund,
  StripeRefund,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type StaffRefundView =
  | { type: "stripe"; refund: StripeRefund }
  | { type: "monri"; refund: MonriRefund }
  | { type: "recorded"; refund: RecordedRefund };

declare const staffPayments: Payment[];
declare const storefrontPayments: StorefrontPayment[];
declare const staffPayment: Payment;
declare const staffView: StaffRefundView;
declare const sentWithIdentityDocument: RecordedRefund & {
  status: { type: "sent"; method: Extract<RecordedRefundMethod, { type: "cash_with_identity_document" }> };
};

export const staffAmounts: PaymentAmounts = paymentAmounts(staffPayments);
export const storefrontAmounts: PaymentAmounts = paymentAmounts(storefrontPayments);
export const oneStaffPayment: PaymentAmounts = utilsPaymentAmounts([staffPayment]);
export const staffRefund: { refunded: number; pending: number } = refundAmounts(staffView);
export const identityDocumentRefund: { refunded: number; pending: number } = utilsRefundAmounts({ type: "recorded", refund: sentWithIdentityDocument });

export type PaymentAmountContracts = [
  Assert<Equal<Parameters<typeof paymentAmounts>[0], readonly (Payment | StorefrontPayment)[]>>,
  Assert<Equal<Parameters<typeof refundAmounts>[0], PaymentRefundView>>,
  Assert<
    Equal<
      PaymentRefundView,
      | { type: "stripe"; refund: StripeRefund | StorefrontStripeRefund }
      | { type: "monri"; refund: MonriRefund | StorefrontMonriRefund }
      | { type: "recorded"; refund: RecordedRefund | StorefrontRecordedRefund }
    >
  >,
  Assert<StaffRefundView extends PaymentRefundView ? true : false>,
];
