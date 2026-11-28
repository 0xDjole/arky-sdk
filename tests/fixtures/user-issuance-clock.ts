import type { UserCode, UserCodeResult, UserSessionCode } from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

export type UserIssuanceClockContracts = [
  Assert<Equal<keyof UserCodeResult["code"], "issued_at" | "expires_at">>,
  Assert<Equal<UserCode["issued_at"], UserCodeResult["code"]["issued_at"]>>,
  Assert<Equal<keyof UserCode, "failed_attempts" | "outgoing_message_id" | "issued_at" | "expires_at">>,
  Assert<Equal<keyof Extract<UserSessionCode, { type: "email" }>, "type" | "email" | "language" | "code">>,
  Assert<Equal<keyof Extract<UserSessionCode, { type: "phone" }>, "type" | "number" | "language" | "code">>,
  Assert<Missing<UserCode, "sent_at">>,
  Assert<Missing<UserCode, "identity_id">>,
  Assert<Missing<UserCode, "code_digest">>,
  Assert<Missing<UserCodeResult["code"], "sent_at">>,
  Assert<Missing<UserCodeResult, "email_verification">>,
];
