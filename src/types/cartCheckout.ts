import type { CheckoutCartParams, RequestOptions } from "./api";
import type { OrderCheckoutResult } from "./index";
import type { CheckoutQuote } from "./checkout";
import type { Order } from "./order";
import type { RequestSuccessContext } from "./httpClient";

export type CartCheckoutInput = Omit<CheckoutCartParams, "store_id">;
export type CartCheckoutRequest = CartCheckoutInput & { request_id: string };
export type CartAcceptanceProof = Pick<Order, "id" | "source">;

export interface CartCheckoutTransport<Result extends Pick<OrderCheckoutResult, "order_id" | "number" | "payment_action">> {
  post(request: CartCheckoutRequest, options?: RequestOptions): Promise<Result>;
  getOrder(id: string, options?: RequestOptions): Promise<CartAcceptanceProof>;
}

export interface CartCheckoutSubmission<Result> {
  result: Result;
  success: RequestSuccessContext | undefined;
}

const presentationChangedBrand = Symbol.for("arky.commerce.CartPresentationChangedError");

export class CartPresentationChangedError extends Error {
  readonly name = "CartPresentationChangedError";
  readonly statusCode = 409;
  readonly code = "COMMERCE.PRESENTATION_CHANGED";
  readonly [presentationChangedBrand] = true;

  static [Symbol.hasInstance](value: unknown): boolean {
    return value instanceof Error && presentationChangedBrand in value;
  }

  constructor(readonly quote: CheckoutQuote) {
    super("The checkout presentation changed. Review the refreshed quote before accepting.");
  }
}

export interface RecoverCartCheckoutParams {
  store_id?: string;
}
