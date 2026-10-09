import type { RequestOptions } from "../types/httpClient";
import type {
  CartProductPurchase,
  FindStorefrontCartOffersParams,
  StorefrontCartBookingLineItemInput,
  StorefrontCartLineItemInput,
  StorefrontCartProductLineItemInput,
  StorefrontCartSubscriptionLineItemInput,
  StorefrontUpdateCartParams,
} from "../types/cart";
import { isCanonicalId, requireId } from "./ids";

export function copyCartProductPurchase(purchase: CartProductPurchase): CartProductPurchase {
  switch (purchase.type) {
    case "catalog":
      return { type: "catalog" };
    case "existing_purchase_access":
      return {
        type: "existing_purchase_access",
        grant: {
          order_id: purchase.grant.order_id,
          order_purchase_access_line_item_id: purchase.grant.order_purchase_access_line_item_id,
        },
      };
    case "same_cart_purchase_access":
      return {
        type: "same_cart_purchase_access",
        cart_subscription_line_item_id: purchase.cart_subscription_line_item_id,
        entitlement_id: purchase.entitlement_id,
      };
    default:
      throw new Error("A cart product needs an explicit supported purchase route");
  }
}

export function cartTokenOptions(options?: RequestOptions, token?: string | null): RequestOptions {
  const headers = Object.fromEntries(
    Object.entries(options?.headers ?? {}).filter(([name]) => name.toLowerCase() !== "x-arky-cart-token"),
  );
  const params = options?.params
    ? Object.fromEntries(
        Object.entries(options.params).filter(([name]) => !["token", "cart_token"].includes(name.toLowerCase())),
      )
    : undefined;
  return {
    ...options,
    headers: { ...headers, ...(token ? { "X-Arky-Cart-Token": token } : {}) },
    ...(params ? { params } : {}),
  };
}

export function cartOffersQuery(input: FindStorefrontCartOffersParams): FindStorefrontCartOffersParams {
  if (!isCanonicalId(input?.company_id) || !isCanonicalId(input.company_location_id)) {
    throw new TypeError("Cart offers need the exact company and branch ids");
  }
  if (input.limit !== undefined && (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 100)) {
    throw new TypeError("The cart offer page size must be an integer from 1 to 100");
  }
  return {
    company_id: input.company_id,
    company_location_id: input.company_location_id,
    ...(input.limit !== undefined ? { limit: input.limit } : {}),
    ...(input.cursor !== undefined && input.cursor !== null ? { cursor: input.cursor } : {}),
  };
}

export function storefrontCartProduct(item: StorefrontCartProductLineItemInput): StorefrontCartProductLineItemInput {
  requireId(item.id, "cart line");
  return {
    id: item.id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    purchase: copyCartProductPurchase(item.purchase),
    ...(item.form_submission_id !== undefined ? { form_submission_id: item.form_submission_id } : {}),
  };
}

export function storefrontCartBooking(item: StorefrontCartBookingLineItemInput): StorefrontCartBookingLineItemInput {
  requireId(item.id, "cart line");
  return {
    id: item.id,
    booking_offering_id: item.booking_offering_id,
    requested_interval: { from: item.requested_interval.from, to: item.requested_interval.to },
    capacity_units: item.capacity_units,
    ...(item.form_submission_id !== undefined ? { form_submission_id: item.form_submission_id } : {}),
  };
}

export function storefrontCartSubscriptionPlan(
  item: StorefrontCartSubscriptionLineItemInput,
): StorefrontCartSubscriptionLineItemInput {
  requireId(item.id, "cart line");
  return {
    id: item.id,
    subscription_plan_id: item.subscription_plan_id,
    start: item.start,
    ...(item.deliveries !== undefined ? { deliveries: item.deliveries } : {}),
  };
}

export function storefrontCartLineItems(items: readonly StorefrontCartLineItemInput[]): StorefrontCartLineItemInput[] {
  return items.map((item) => {
    switch (item.type) {
      case "product":
        return { type: "product", ...storefrontCartProduct(item) };
      case "booking":
        return { type: "booking", ...storefrontCartBooking(item) };
      case "subscription_plan":
        return { type: "subscription_plan", ...storefrontCartSubscriptionPlan(item) };
      default:
        throw new Error("A cart line must be a product, a booking or a subscription plan");
    }
  });
}

export function storefrontCartUpdateBody(
  input: StorefrontUpdateCartParams,
): Omit<StorefrontUpdateCartParams, "id" | "token"> {
  return {
    expected_updated_at: input.expected_updated_at,
    ...(input.buyer !== undefined ? { buyer: input.buyer } : {}),
    ...(input.catalog !== undefined ? { catalog: input.catalog } : {}),
    ...(input.line_items !== undefined ? { line_items: storefrontCartLineItems(input.line_items) } : {}),
    ...(input.delivery_groups !== undefined ? { delivery_groups: input.delivery_groups } : {}),
    ...(input.billing_address !== undefined ? { billing_address: input.billing_address } : {}),
    ...(input.promotion_codes !== undefined ? { promotion_codes: input.promotion_codes } : {}),
  };
}
