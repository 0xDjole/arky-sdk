import type {
  OrderCheckoutCompatibleItemInput,
  OrderCheckoutItemInput,
  OrderQuoteCompatibleItemInput,
  OrderQuoteItemInput,
} from "../types/api";

export function normalizeOrderQuoteItems(
  items: OrderQuoteCompatibleItemInput[],
): OrderQuoteItemInput[] {
  return items.map((item) => {
    if ("type" in item) {
      return item;
    }

    if ("product_id" in item) {
      return { type: "product", ...item };
    }

    return { type: "booking", ...item };
  });
}

export function normalizeOrderCheckoutItems(
  items: OrderCheckoutCompatibleItemInput[],
): OrderCheckoutItemInput[] {
  return items.map((item) => {
    if ("type" in item) {
      return item;
    }

    if ("product_id" in item) {
      return { type: "product", ...item };
    }

    return { type: "booking", ...item };
  });
}
