import type { RequestOptions, RequestSuccessContext } from "./httpClient";
import type { CartQuote, CheckoutAcceptance, StorefrontCheckoutCartInput } from "./cart";
import type { Order } from "./order";
import { ArkyApiError, type ArkyApiErrorDetails } from "./apiError";

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

export class CartPresentationChangedError extends ArkyApiError {
  readonly name: string = "CartPresentationChangedError";
  readonly [presentationChangedBrand] = true;

  static [Symbol.hasInstance](value: unknown): boolean {
    return value instanceof Error && presentationChangedBrand in value;
  }

  constructor(
    readonly quote: CartQuote,
    answer: Pick<ArkyApiErrorDetails, "response" | "method" | "url" | "requestId"> = {},
  ) {
    super({
      message: "The checkout presentation changed. Review the refreshed quote before ordering.",
      code: "COMMERCE.PRESENTATION_CHANGED",
      statusCode: 409,
      response: answer.response,
      method: answer.method,
      url: answer.url,
      requestId: answer.requestId,
    });
  }
}

export interface RecoverCartCheckoutParams {
  store_id: string;
}
