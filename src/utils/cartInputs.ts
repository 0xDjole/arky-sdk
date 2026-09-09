import type {
  CartBookingInput,
  CartAudienceInput,
  CartDigitalItemInput,
  CartProductInput,
} from "../types/api";
import type { StorefrontUpdateCartParams } from "../types/storefront";

export function sanitizePublicCartAudiences(
  items: readonly CartAudienceInput[],
): CartAudienceInput[] {
  return items.map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    audience_id: item.audience_id,
    membership_id: item.membership_id,
  }));
}

export function sanitizePublicCartUpdate(input: StorefrontUpdateCartParams): StorefrontUpdateCartParams {
  return {
    id: input.id,
    ...(input.company_id !== undefined ? { company_id: input.company_id } : {}),
    ...(input.company_location_id !== undefined ? { company_location_id: input.company_location_id } : {}),
    ...(input.market_id !== undefined ? { market_id: input.market_id } : {}),
    ...(input.sales_channel_id !== undefined ? { sales_channel_id: input.sales_channel_id } : {}),
    ...(input.product_items !== undefined ? { product_items: sanitizePublicCartProducts(input.product_items) } : {}),
    ...(input.booking_items !== undefined ? { booking_items: sanitizePublicCartBookings(input.booking_items) } : {}),
    ...(input.digital_items !== undefined ? { digital_items: sanitizePublicCartDigitalProducts(input.digital_items) } : {}),
    ...(input.audience_items !== undefined ? { audience_items: sanitizePublicCartAudiences(input.audience_items) } : {}),
    ...(input.shipping_address !== undefined ? { shipping_address: input.shipping_address } : {}),
    ...(input.billing_address !== undefined ? { billing_address: input.billing_address } : {}),
    ...(input.promo_code !== undefined ? { promo_code: input.promo_code } : {}),
    ...(input.payment_provider_id !== undefined ? { payment_provider_id: input.payment_provider_id } : {}),
    ...(input.shipping_method_id !== undefined ? { shipping_method_id: input.shipping_method_id } : {}),
  };
}

export function sanitizePublicCartProducts(
  items: readonly CartProductInput[],
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
  items: readonly CartBookingInput[],
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
  items: readonly CartDigitalItemInput[],
): CartDigitalItemInput[] {
  return items.map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    digital_product_id: item.digital_product_id,
    name_block_id: item.name_block_id,
    ...(item.form_submission_id !== undefined
      ? { form_submission_id: item.form_submission_id }
      : {}),
  }));
}
