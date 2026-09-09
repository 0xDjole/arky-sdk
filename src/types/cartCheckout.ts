import type { Cart } from "./cart";
import type { CheckoutCartParams, RequestOptions } from "./api";
import type { OrderCheckoutResult } from "./index";
import type { OrderQuote } from "./quote";
import type { RequestSuccessContext } from "./httpClient";

export type CartCheckoutRequest = Omit<CheckoutCartParams, "store_id">;
export type CartCheckoutProof = Pick<Cart, "id" | "status" | "converted_order_id">;

export interface CartCheckoutTransport<Result extends Pick<OrderCheckoutResult, "order_id" | "number" | "payment_action">> {
  post(request: CartCheckoutRequest, options?: RequestOptions): Promise<Result>;
  getCart(id: string, options?: RequestOptions): Promise<CartCheckoutProof>;
}

export interface CartCheckoutSubmission<Result> {
  result: Result;
  success: RequestSuccessContext | undefined;
}

export class CartPresentationChangedError extends Error {
  readonly name = "CartPresentationChangedError";
  readonly statusCode = 409;
  readonly code = "COMMERCE.PRESENTATION_CHANGED";

  constructor(readonly quote: OrderQuote) {
    super("The checkout presentation changed. Review the refreshed quote before accepting.");
  }
}

export interface RecoverCartCheckoutParams {
  store_id?: string;
}
