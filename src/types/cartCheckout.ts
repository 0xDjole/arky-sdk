import type { RequestOptions, RequestSuccessContext } from "./httpClient";
import type { CartQuote, CheckoutAcceptance, StorefrontCheckoutCartInput } from "./cart";
import type { Order } from "./order";

export type CartCheckoutRequest = StorefrontCheckoutCartInput;

export interface CartCheckoutTransport<Request> {
  post(request: Request, options?: RequestOptions): Promise<CheckoutAcceptance>;
  getOrder(id: string, options?: RequestOptions): Promise<Order>;
}

export interface CartCheckoutSubmission {
  result: CheckoutAcceptance;
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

  constructor(readonly quote: CartQuote) {
    super("The checkout presentation changed. Review the refreshed quote before ordering.");
  }
}

export interface RecoverCartCheckoutParams {
  store_id: string;
}
