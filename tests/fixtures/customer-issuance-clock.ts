import type { CustomerCode, CustomerCodeResult, CustomerSessionCode } from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

export type CustomerIssuanceClockContracts = [
  Assert<Equal<keyof CustomerCodeResult["code"], "issued_at" | "expires_at">>,
  Assert<Equal<CustomerCode["issued_at"], CustomerCodeResult["code"]["issued_at"]>>,
  Assert<Equal<keyof CustomerCode, "failed_attempts" | "outgoing_message_id" | "issued_at" | "expires_at">>,
  Assert<Equal<keyof Extract<CustomerSessionCode, { type: "email" }>, "type" | "email" | "language" | "code">>,
  Assert<Equal<keyof Extract<CustomerSessionCode, { type: "phone" }>, "type" | "number" | "language" | "code">>,
  Assert<Missing<CustomerCode, "sent_at">>,
  Assert<Missing<CustomerCode, "identity_id">>,
  Assert<Missing<CustomerCode, "code_digest">>,
  Assert<Missing<CustomerCodeResult["code"], "sent_at">>,
  Assert<Missing<CustomerCodeResult, "email_verification">>,
];
