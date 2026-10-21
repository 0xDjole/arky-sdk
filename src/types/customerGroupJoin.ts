import { ArkyError } from "./apiError";
import type { EmailContact } from "./common";

export type CustomerGroupJoinErrorCode =
  | "sign_in_required"
  | "email_mismatch"
  | "not_free"
  | "sign_up_used"
  | "sign_up_expired";

const joinErrorBrand = Symbol.for("arky.commerce.CustomerGroupJoinError");

export class CustomerGroupJoinError extends ArkyError {
  readonly name: string = "CustomerGroupJoinError";
  readonly [joinErrorBrand] = true;

  static [Symbol.hasInstance](value: unknown): boolean {
    return value instanceof Error && joinErrorBrand in value;
  }

  constructor(
    readonly code: CustomerGroupJoinErrorCode,
    message: string,
  ) {
    super(code, message);
  }
}

export type JoinFreeCustomerGroupParams = ({ id: string } | { key: string }) & {
  catalog_id: string;
};

export type JoinFreeCustomerGroupResult =
  | { type: "joined"; order_id: string }
  | { type: "already_member"; customer_group_member_id: string };

export interface RequestNewsletterCodeParams {
  contact: EmailContact;
  bot_check_token?: string;
}

export type RequestNewsletterCodeResult = { type: "code_sent" } | { type: "verified" };

export type JoinNewsletterParams = JoinFreeCustomerGroupParams & {
  email: string;
  code?: string;
};
