import type {
  OrderCheckoutCompatibleItemInput,
  OrderCheckoutItemInput,
  OrderQuoteCompatibleItemInput,
  OrderQuoteItemInput,
  TrustedOrderCheckoutCompatibleItemInput,
  TrustedOrderCheckoutItemInput,
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

    return { type: "service", ...item };
  });
}

export function normalizeOrderCheckoutItems(
  items: TrustedOrderCheckoutCompatibleItemInput[],
): TrustedOrderCheckoutItemInput[] {
  return items.map((item) => {
    if ("type" in item) {
      return item;
    }

    if ("product_id" in item) {
      return { type: "product", ...item };
    }

    return { type: "service", ...item };
  });
}

export function normalizePublicCheckoutItems(
  items: OrderCheckoutCompatibleItemInput[],
): OrderCheckoutItemInput[] {
  return normalizeOrderCheckoutItems(items).map((item) => {
    const { price: _price, ...publicItem } = item;
    return publicItem;
  });
}
