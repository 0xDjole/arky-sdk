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
      const type = (item as { type?: string }).type;
      return type === "booking" ? ({ ...item, type: "service" } as OrderQuoteItemInput) : item;
    }

    if ("product_id" in item) {
      return { type: "product", ...item };
    }

    return { type: "service", ...item };
  });
}

export function normalizeOrderCheckoutItems(
  items: OrderCheckoutCompatibleItemInput[],
): OrderCheckoutItemInput[] {
  return items.map((item) => {
    if ("type" in item) {
      const type = (item as { type?: string }).type;
      return type === "booking" ? ({ ...item, type: "service" } as OrderCheckoutItemInput) : item;
    }

    if ("product_id" in item) {
      return { type: "product", ...item };
    }

    return { type: "service", ...item };
  });
}
