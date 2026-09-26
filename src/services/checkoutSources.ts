import type { CheckoutQuoteSources } from "../types/checkout";
import { DurableRequestStorageError } from "../utils/durableRequest";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const families = new Set(["product", "booking", "digital_product", "subscription_plan"]);

function fields(value: unknown, keys: string[]): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function identity(value: unknown): value is string {
  return typeof value === "string" && uuid.test(value);
}

function reference(value: unknown): value is { type: string; line_item_id: string } {
  return fields(value, ["type", "line_item_id"]) && typeof value.type === "string" &&
    families.has(value.type) && identity(value.line_item_id);
}

function units(value: unknown): value is { first_unit: number; quantity: number } {
  return fields(value, ["first_unit", "quantity"]) && value.first_unit === 0 &&
    typeof value.quantity === "number" && Number.isInteger(value.quantity) &&
    value.quantity > 0 && value.quantity <= 0xffffffff;
}

export function checkoutQuoteSources(value: unknown): CheckoutQuoteSources {
  const fail = (): never => {
    throw new DurableRequestStorageError("Cart Checkout requires its exact reviewed Cart version and converted lines");
  };
  if (!fields(value, ["cart", "converted_lines"]) ||
    !fields(value.cart, ["cart_id", "version"]) || !identity(value.cart.cart_id) ||
    typeof value.cart.version !== "string" || !value.cart.version.length || value.cart.version.length > 512 ||
    value.cart.version.trim() !== value.cart.version ||
    !Array.isArray(value.converted_lines) || value.converted_lines.length === 0 || value.converted_lines.length > 10000) return fail();
  const lines = new Set<string>();
  for (const line of value.converted_lines) {
    if (!fields(line, ["cart_line_item", "cart_units", "order_line_item", "order_units"]) ||
      !reference(line.cart_line_item) || !reference(line.order_line_item) ||
      line.cart_line_item.type !== line.order_line_item.type ||
      line.cart_line_item.line_item_id !== line.order_line_item.line_item_id ||
      !units(line.cart_units) || !units(line.order_units) ||
      line.cart_units.quantity !== line.order_units.quantity ||
      (line.cart_line_item.type !== "product" && line.cart_units.quantity !== 1) ||
      lines.has(line.cart_line_item.line_item_id)) return fail();
    lines.add(line.cart_line_item.line_item_id);
  }
  const serialized = JSON.stringify(value);
  if (new TextEncoder().encode(serialized).length > 4 * 1024 * 1024) return fail();
  return JSON.parse(serialized) as CheckoutQuoteSources;
}
