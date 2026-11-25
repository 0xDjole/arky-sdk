import { latestPayment, paymentOutcome } from "arky-sdk";
import { latestPayment as storefrontLatestPayment, paymentOutcome as storefrontPaymentOutcome } from "arky-sdk/storefront";
import { latestPayment as utilsLatestPayment, paymentOutcome as utilsPaymentOutcome } from "arky-sdk/utils";
import type { Payment, PaymentOutcome, StorefrontPayment } from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

declare const staffPayment: Payment;
declare const staffPayments: Payment[];
declare const storefrontPayment: StorefrontPayment;
declare const storefrontPayments: StorefrontPayment[];

export const staffOutcome: PaymentOutcome = paymentOutcome(staffPayment);
export const storefrontStaffOutcome: PaymentOutcome = storefrontPaymentOutcome(staffPayment);
export const utilsStaffOutcome: PaymentOutcome = utilsPaymentOutcome(staffPayment);
export const buyerOutcome: PaymentOutcome = storefrontPaymentOutcome(storefrontPayment);
export const latestStaff: Payment | null = latestPayment(staffPayments);
export const storefrontLatestStaff: Payment | null = storefrontLatestPayment(staffPayments);
export const utilsLatestStaff: Payment | null = utilsLatestPayment(staffPayments);
export const latestBuyer: StorefrontPayment | null = storefrontLatestPayment(storefrontPayments);

export type PaymentOutcomeContracts = [
  Assert<Equal<Parameters<typeof paymentOutcome>[0], Payment | StorefrontPayment>>,
  Assert<Equal<Parameters<typeof storefrontPaymentOutcome>[0], Payment | StorefrontPayment>>,
];
