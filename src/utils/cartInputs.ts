import type {
  CartBookingInput,
  CartSubscriptionPlanInput,
  CartDigitalItemInput,
  CartProductInput,
  RequestOptions,
} from "../types/api";
import type { CartPublicLineItemInput, FindStorefrontPreparedCartsParams, StorefrontUpdateCartParams } from "../types/storefront";
import type { CartProductPurchase } from "../types/purchaseAccess";

export function copyCartProductPurchase(purchase: CartProductPurchase): CartProductPurchase {
  switch (purchase.type) {
    case "catalog": return { type: "catalog" };
    case "existing_purchase_access": return { type: "existing_purchase_access", grant: {
      order_id: purchase.grant.order_id,
      order_purchase_access_line_item_id: purchase.grant.order_purchase_access_line_item_id,
    } };
    case "same_cart_purchase_access": return { type: "same_cart_purchase_access",
      cart_subscription_line_item_id: purchase.cart_subscription_line_item_id, entitlement_id: purchase.entitlement_id };
    default: throw new Error("Cart product requires an explicit supported purchase route");
  }
}

export function publicCartReadOptions(options?: RequestOptions, token?: string): RequestOptions {
  const params = Object.fromEntries(Object.entries(options?.params ?? {})
    .filter(([name]) => !["token", "cart_token"].includes(name.toLowerCase())));
  const headers = Object.fromEntries(Object.entries(options?.headers ?? {})
    .filter(([name]) => name.toLowerCase() !== "x-arky-cart-token"));
  return {
    ...options,
    headers: { ...headers, ...(token ? { "X-Arky-Cart-Token": token } : {}) },
    params: Object.keys(params).length ? params : undefined,
  };
}

export function preparedCartQuery(input: FindStorefrontPreparedCartsParams): FindStorefrontPreparedCartsParams {
  const canonicalId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  if (typeof input?.company_id !== "string" || !canonicalId.test(input.company_id) ||
    typeof input.company_location_id !== "string" || !canonicalId.test(input.company_location_id)) {
    throw new TypeError("Prepared Cart discovery requires explicit canonical Company and CompanyLocation UUID-v4 identities");
  }
  if (input.limit !== undefined && (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 100)) {
    throw new TypeError("Prepared Cart discovery limit must be an integer from 1 to 100");
  }
  if (input.cursor !== undefined && (typeof input.cursor !== "string" || input.cursor.length === 0 || new TextEncoder().encode(input.cursor).length > 2048)) {
    throw new TypeError("Prepared Cart discovery cursor must be a nonempty opaque string of at most 2048 bytes");
  }
  return {
    company_id: input.company_id,
    company_location_id: input.company_location_id,
    ...(input.limit !== undefined ? { limit: input.limit } : {}),
    ...(input.cursor !== undefined ? { cursor: input.cursor } : {}),
  };
}

export function sanitizePublicCartSubscriptionPlans(
  items: readonly Omit<CartSubscriptionPlanInput, "price_override">[],
): CartSubscriptionPlanInput[] {
  return items.map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    subscription_plan_id: item.subscription_plan_id,
    subject: item.subject,
    start: item.start,
    deliveries: item.deliveries,
  }));
}

export function sanitizePublicCartLineItems(
  items: readonly CartPublicLineItemInput[],
): CartPublicLineItemInput[] {
  return items.map((item) => {
    switch (item.type) {
      case "product":
        return { type: "product", ...sanitizePublicCartProducts([item])[0] };
      case "booking":
        return { type: "booking", ...sanitizePublicCartBookings([item])[0] };
      case "digital_product":
        return { type: "digital_product", ...sanitizePublicCartDigitalProducts([item])[0] };
      default:
        return {
          type: "subscription_plan",
          ...sanitizePublicCartSubscriptionPlans([item])[0],
        };
    }
  });
}

export function sanitizePublicCartUpdate(input: StorefrontUpdateCartParams): StorefrontUpdateCartParams {
  return {
    id: input.id,
    ...(input.company !== undefined ? { company: input.company === null ? null : {
      company_id: input.company.company_id,
      company_location_id: input.company.company_location_id,
    } } : {}),
    ...(input.market_id !== undefined ? { market_id: input.market_id } : {}),
    ...(input.sales_channel_id !== undefined ? { sales_channel_id: input.sales_channel_id } : {}),
    ...(input.line_items !== undefined ? { line_items: sanitizePublicCartLineItems(input.line_items) } : {}),
    ...(input.delivery_groups !== undefined ? { delivery_groups: input.delivery_groups } : {}),
    ...(input.billing_address !== undefined ? { billing_address: input.billing_address } : {}),
    ...(input.promotion_codes !== undefined ? { promotion_codes: input.promotion_codes ?? [] } : {}),
    ...(input.purchase_order_number !== undefined ? { purchase_order_number: input.purchase_order_number } : {}),
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
    purchase: copyCartProductPurchase(item.purchase),
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
    capacity_units: item.capacity_units,
    ...(item.form_submission_id !== undefined
      ? { form_submission_id: item.form_submission_id }
      : {}),
  }));
}

export function sanitizePublicCartDigitalProducts(
  items: readonly Omit<CartDigitalItemInput, "price_override">[],
): CartDigitalItemInput[] {
  return items.map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    digital_product_id: item.digital_product_id,
    beneficiary_customer_id: item.beneficiary_customer_id,
    ...(item.form_submission_id !== undefined
      ? { form_submission_id: item.form_submission_id }
      : {}),
  }));
}
