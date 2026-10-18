import { ArkyError } from "./apiError";

export interface MonriBuyerDetails {
  full_name: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
  country: string;
  email: string;
}

export interface MonriBrowserBuyerDetails {
  fullName: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
  country: string;
  email: string;
}

export interface MonriCardComponent {
  mount(elementId: string): void;
  onChange(listener: (event: { error?: { message?: string } | null }) => void): void;
}

export interface MonriBrowserClient {
  components(options: { clientSecret: string }): {
    create(type: "card", options: {
      tokenizePan: boolean;
      tokenizePanOffered: false;
      showInstallmentsSelection: false;
    }): MonriCardComponent;
  };
  confirmPayment(card: MonriCardComponent, details: MonriBrowserBuyerDetails & { orderInfo: string }): Promise<unknown>;
}

export type MonriBrowserFactory = (authenticityToken: string) => MonriBrowserClient;

const monriCheckoutErrorBrand = Symbol.for("arky.MonriCheckoutError");

export type MonriCheckoutErrorCode =
  | "invalid_action"
  | "unavailable"
  | "invalid_card"
  | "invalid_details"
  | "already_submitted"
  | "unknown_result";

export class MonriCheckoutError extends ArkyError {
  readonly name: string = "MonriCheckoutError";
  readonly [monriCheckoutErrorBrand] = true;

  static [Symbol.hasInstance](value: unknown): boolean {
    return value instanceof Error && monriCheckoutErrorBrand in value;
  }

  constructor(
    readonly code: MonriCheckoutErrorCode,
    message: string,
  ) {
    super(code, message);
  }
}
