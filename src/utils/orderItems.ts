import type {
  BookingCheckoutCompatibleItemInput,
  BookingCreatePart,
  BookingQuoteCompatibleItemInput,
  BookingQuoteItem,
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

export function normalizeBookingQuoteItems(
  items: BookingQuoteCompatibleItemInput[],
): BookingQuoteItem[] {
  return items.map((item) => {
    if ("type" in item) {
      const { type: _type, ...rest } = item;
      return rest;
    }

    return item;
  });
}

export function normalizeBookingCheckoutItems(
  items: BookingCheckoutCompatibleItemInput[],
): BookingCreatePart[] {
  return items.map((item) => {
    if ("type" in item) {
      const { type: _type, forms, price: _price, ...rest } = item;
      return { ...rest, forms: forms ?? [] };
    }

    return item;
  });
}
