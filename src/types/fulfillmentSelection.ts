export class FulfillmentSelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FulfillmentSelectionError";
  }
}
