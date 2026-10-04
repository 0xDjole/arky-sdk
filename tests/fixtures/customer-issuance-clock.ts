import type { CustomerEmailVerification, StorefrontRequestCodeResult } from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

export type CustomerIssuanceClockContracts = [
  Assert<Equal<keyof StorefrontRequestCodeResult["email_verification"], "issued_at" | "expires_at">>,
  Assert<Equal<CustomerEmailVerification["issued_at"], StorefrontRequestCodeResult["email_verification"]["issued_at"]>>,
  Assert<Missing<CustomerEmailVerification, "sent_at">>,
  Assert<Missing<StorefrontRequestCodeResult["email_verification"], "sent_at">>,
];
