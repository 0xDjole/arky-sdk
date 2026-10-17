export type CustomerGroupJoinErrorCode =
  | "sign_in_required"
  | "email_mismatch"
  | "not_free"
  | "sign_up_used"
  | "sign_up_expired";

const joinErrorBrand = Symbol.for("arky.commerce.CustomerGroupJoinError");

export class CustomerGroupJoinError extends Error {
  readonly name = "CustomerGroupJoinError";
  readonly [joinErrorBrand] = true;

  static [Symbol.hasInstance](value: unknown): boolean {
    return value instanceof Error && joinErrorBrand in value;
  }

  constructor(
    readonly code: CustomerGroupJoinErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export interface JoinFreeCustomerGroupParams {
  identifier: string;
  catalog_id: string;
}

export type JoinFreeCustomerGroupResult =
  | { type: "joined"; order_id: string }
  | { type: "already_member"; customer_group_member_id: string };

export interface SendNewsletterCodeParams {
  email: string;
  language: string;
  bot_check_token?: string | null;
}

export type SendNewsletterCodeResult = { type: "code_sent" } | { type: "verified" };

export interface JoinNewsletterParams extends JoinFreeCustomerGroupParams {
  email: string;
  code?: string;
}
