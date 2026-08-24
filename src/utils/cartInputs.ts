import type {
  CartBookingInput,
  CartDigitalItemInput,
  CartProductInput,
  TrustedCartBookingInput,
  TrustedCartDigitalItemInput,
  TrustedCartProductInput,
} from "../types/api";

export function sanitizePublicCartProducts(
  items: TrustedCartProductInput[],
): CartProductInput[] {
  return items.map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    ...(item.form_submission_id !== undefined
      ? { form_submission_id: item.form_submission_id }
      : {}),
  }));
}

export function sanitizePublicCartBookings(
  items: TrustedCartBookingInput[],
): CartBookingInput[] {
  return items.map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    booking_offering_id: item.booking_offering_id,
    requested_interval: item.requested_interval,
    ...(item.form_submission_id !== undefined
      ? { form_submission_id: item.form_submission_id }
      : {}),
  }));
}

export function sanitizePublicCartDigitalProducts(
  items: TrustedCartDigitalItemInput[],
): CartDigitalItemInput[] {
  return items.map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    digital_product_id: item.digital_product_id,
    ...(item.form_submission_id !== undefined
      ? { form_submission_id: item.form_submission_id }
      : {}),
  }));
}
