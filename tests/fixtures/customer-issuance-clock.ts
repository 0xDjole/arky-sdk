import type { CustomerCodeResult, CustomerEmailVerification } from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

export type CustomerIssuanceClockContracts = [
  Assert<Equal<keyof CustomerCodeResult["email_verification"], "issued_at" | "expires_at">>,
  Assert<Equal<CustomerEmailVerification["issued_at"], CustomerCodeResult["email_verification"]["issued_at"]>>,
  Assert<Equal<keyof CustomerEmailVerification, "email" | "failed_attempts" | "notification_id" | "issued_at" | "expires_at">>,
  Assert<Missing<CustomerEmailVerification, "sent_at">>,
  Assert<Missing<CustomerEmailVerification, "identity_id">>,
  Assert<Missing<CustomerCodeResult["email_verification"], "sent_at">>,
];
