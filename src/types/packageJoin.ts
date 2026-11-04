import { ArkyError } from "./apiError";
import type { EmailContact } from "./common";

export type PackageJoinErrorCode =
  | "sign_in_required"
  | "email_mismatch"
  | "not_free"
  | "sign_up_used"
  | "sign_up_expired";

const joinErrorBrand = Symbol.for("arky.commerce.PackageJoinError");

export class PackageJoinError extends ArkyError {
  readonly name: string = "PackageJoinError";
  readonly [joinErrorBrand] = true;

  static [Symbol.hasInstance](value: unknown): boolean {
    return value instanceof Error && joinErrorBrand in value;
  }

  constructor(
    readonly code: PackageJoinErrorCode,
    message: string,
  ) {
    super(code, message);
  }
}

export type JoinFreePackageParams = ({ id: string } | { key: string }) & {
  package_id: string;
  language: string;
};

export type JoinFreePackageResult =
  | { type: "joined"; order_id: string }
  | { type: "already_member"; package_member_id: string };

export interface RequestNewsletterCodeParams {
  contact: EmailContact;
  bot_check_token?: string;
}

export type RequestNewsletterCodeResult = { type: "code_sent" } | { type: "verified" };

export type JoinNewsletterParams = JoinFreePackageParams & {
  email: string;
  code?: string;
};
