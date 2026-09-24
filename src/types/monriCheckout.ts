import type { MonriEnvironment } from "./index";

export interface MonriComponentsAction {
  type: "monri_components";
  payment_id: string;
  environment: MonriEnvironment;
  authenticity_token: string;
  client_secret: string;
}

export interface MonriBuyerDetails {
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
      tokenizePan: false;
      tokenizePanOffered: false;
      showInstallmentsSelection: false;
    }): MonriCardComponent;
  };
  confirmPayment(card: MonriCardComponent, details: MonriBuyerDetails & { orderInfo: string }): Promise<unknown>;
}

export type MonriBrowserFactory = (authenticityToken: string) => MonriBrowserClient;

export class MonriCheckoutError extends Error {
  readonly name = "MonriCheckoutError";
  constructor(
    readonly code: "invalid_action" | "unavailable" | "invalid_details" | "already_submitted" | "unknown_result",
    message: string,
  ) {
    super(message);
  }
}
