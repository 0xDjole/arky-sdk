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
  return items.map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    booking_offering_id: item.booking_offering_id,
    requested_interval: item.requested_interval,
    ...(item.form_submission_id
      ? { form_submission_id: item.form_submission_id }
      : {}),
  }));
}

export function sanitizePublicCartDigitalProducts(
  items: CartDigitalProductInput[],
): CartDigitalProductInput[] {
  return items.map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    digital_product_id: item.digital_product_id,
  }));
}
