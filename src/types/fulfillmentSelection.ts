import { ArkyError } from "./apiError";

const fulfillmentSelectionErrorBrand = Symbol.for("arky.FulfillmentSelectionError");

export class FulfillmentSelectionError extends ArkyError {
  readonly name: string = "FulfillmentSelectionError";
  readonly code: "invalid_selection" = "invalid_selection";
  readonly [fulfillmentSelectionErrorBrand] = true;

  static [Symbol.hasInstance](value: unknown): boolean {
    return value instanceof Error && fulfillmentSelectionErrorBrand in value;
  }

  constructor(message: string) {
    super("invalid_selection", message);
  }
}
