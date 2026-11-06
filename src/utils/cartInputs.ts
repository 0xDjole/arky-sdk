import type { RequestOptions, TransportOptions } from "../types/httpClient";
import type {
  CartBookingLineItemInput,
  CartLineItemInput,
  CartPackageLineItemInput,
  CartProductLineItemInput,
  FindStorefrontCartOffersParams,
  StorefrontUpdateCartParams,
} from "../types/cart";
import type { PackagePriceRef } from "../types/package";
import { requireId } from "./ids";

export function copyPackagePriceRef(price: PackagePriceRef): PackagePriceRef {
  if (typeof price !== "object" || price === null) {
    throw new TypeError("A cart line names its exact price: { package_id, package_item_id, price_id }");
  }
  return { package_id: price.package_id, package_item_id: price.package_item_id, price_id: price.price_id };
}

export function refusePerCallMarket(options?: RequestOptions): void {
  if (options?.market !== undefined) {
    throw new TypeError("A cart call uses the storefront's market; change it with setContext({ market })");
  }
}

export function cartTokenOptions(options?: RequestOptions, token?: string | null): RequestOptions {
  refusePerCallMarket(options);
  const { params: _params, ...caller } = (options ?? {}) as TransportOptions;
  const headers = Object.fromEntries(
    Object.entries(caller.headers ?? {}).filter(([name]) => name.toLowerCase() !== "x-arky-cart-token"),
  );
  return {
    ...caller,
    headers: { ...headers, ...(token ? { "X-Arky-Cart-Token": token } : {}) },
  };
}

export function cartOffersQuery(input: FindStorefrontCartOffersParams): FindStorefrontCartOffersParams {
  const party =
    "company_id" in input && !("company_location_id" in input)
      ? { company_id: requireId(input.company_id, "company") }
      : "company_location_id" in input && !("company_id" in input)
        ? { company_location_id: requireId(input.company_location_id, "company location") }
        : null;
  if (!party) throw new TypeError("Cart offers are listed for one company or one company location");
  if (input.limit !== undefined && (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 100)) {
    throw new TypeError("The cart offer page size must be an integer from 1 to 100");
  }
  return {
    ...party,
    ...(input.limit !== undefined ? { limit: input.limit } : {}),
    ...(input.cursor !== undefined && input.cursor !== null ? { cursor: input.cursor } : {}),
  };
}

export function storefrontCartProduct(item: CartProductLineItemInput): CartProductLineItemInput {
  requireId(item.id, "cart line");
  return {
    id: item.id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    price: copyPackagePriceRef(item.price),
    ...(item.form_submission_id !== undefined ? { form_submission_id: item.form_submission_id } : {}),
  };
}

export function storefrontCartBooking(item: CartBookingLineItemInput): CartBookingLineItemInput {
  requireId(item.id, "cart line");
  return {
    id: item.id,
    booking_offering_id: item.booking_offering_id,
    requested_interval: { from: item.requested_interval.from, to: item.requested_interval.to },
    capacity_units: item.capacity_units,
    price: copyPackagePriceRef(item.price),
    ...(item.form_submission_id !== undefined ? { form_submission_id: item.form_submission_id } : {}),
  };
}

export function storefrontCartPackage(item: CartPackageLineItemInput): CartPackageLineItemInput {
  requireId(item.id, "cart line");
  return {
    id: item.id,
    package_id: item.package_id,
    quantity: item.quantity,
    choices: item.choices.map(({ package_item_id, variant_id }) => ({ package_item_id, variant_id })),
    start: item.start,
    price: copyPackagePriceRef(item.price),
    ...(item.deliveries !== undefined ? { deliveries: item.deliveries } : {}),
  };
}

export function storefrontCartLineItems(items: readonly CartLineItemInput[]): CartLineItemInput[] {
  return items.map((item) => {
    switch (item.type) {
      case "product":
        return { type: "product", ...storefrontCartProduct(item) };
      case "booking":
        return { type: "booking", ...storefrontCartBooking(item) };
      case "package":
        return { type: "package", ...storefrontCartPackage(item) };
      default:
        throw new TypeError("A cart line must be a product, a booking or a package");
    }
  });
}

export function storefrontCartUpdateBody(
  input: StorefrontUpdateCartParams,
): Omit<StorefrontUpdateCartParams, "id" | "token"> {
  return {
    expected_updated_at: input.expected_updated_at,
    ...(input.buyer !== undefined ? { buyer: input.buyer } : {}),
    ...(input.package_id !== undefined ? { package_id: input.package_id } : {}),
    ...(input.market_id !== undefined ? { market_id: input.market_id } : {}),
    ...(input.blocks !== undefined ? { blocks: input.blocks } : {}),
    ...(input.line_items !== undefined ? { line_items: storefrontCartLineItems(input.line_items) } : {}),
    ...(input.delivery_groups !== undefined ? { delivery_groups: input.delivery_groups } : {}),
    ...(input.billing_address !== undefined ? { billing_address: input.billing_address } : {}),
    ...(input.promotion_codes !== undefined ? { promotion_codes: input.promotion_codes } : {}),
  };
}
