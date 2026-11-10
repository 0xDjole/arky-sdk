import type { RequestOptions, RequestSuccessContext } from "./httpClient";
import type { StorefrontCartQuote, StorefrontCheckoutAcceptance, StorefrontCheckoutCartInput } from "./cart";
import type { StorefrontOrder } from "./order";
import { ArkyApiError, type ArkyApiErrorDetails } from "./apiError";

export type CartCheckoutRequest = StorefrontCheckoutCartInput;

export interface CartCheckoutTransport<Request> {
  post(request: Request, options?: RequestOptions): Promise<StorefrontCheckoutAcceptance>;
  getOrder(id: string, options?: RequestOptions): Promise<StorefrontOrder>;
}

export interface CartCheckoutSubmission {
  result: StorefrontCheckoutAcceptance;
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
    readonly quote: StorefrontCartQuote,
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
