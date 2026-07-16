import type { OrderCheckoutItemInput } from "../types/api";

export function sanitizePublicCheckoutItems(
  items: OrderCheckoutItemInput[],
): OrderCheckoutItemInput[] {
  return items.map((item) => {
    if (item.type === "product") {
      return {
        type: "product",
        ...(item.id ? { id: item.id } : {}),
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
      };
    }
    return {
      type: "service",
      ...(item.id ? { id: item.id } : {}),
      service_id: item.service_id,
      provider_id: item.provider_id,
      slots: item.slots,
      ...(item.forms ? { forms: item.forms } : {}),
    };
  });
}
