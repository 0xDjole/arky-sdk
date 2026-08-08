import type {
  CartBookingInput,
  CartDigitalProductInput,
  CartProductInput,
} from "../types/api";

export function sanitizePublicCartProducts(
  items: CartProductInput[],
): CartProductInput[] {
  return items.map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
  }));
}

export function sanitizePublicCartBookings(
  items: CartBookingInput[],
): CartBookingInput[] {
  return items.map((item) => {
    return {
      ...(item.id ? { id: item.id } : {}),
      service_id: item.service_id,
      provider_id: item.provider_id,
      slots: item.slots,
      ...(item.forms ? { forms: item.forms } : {}),
    };
  });
}

export function sanitizePublicCartDigitalProducts(
  items: CartDigitalProductInput[],
): CartDigitalProductInput[] {
  return items.map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    digital_product_id: item.digital_product_id,
  }));
}
