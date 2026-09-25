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
    throw new DurableRequestStorageError("Cart Checkout requires its exact reviewed Cart versions and line/delivery bindings");
  };
  if (!fields(value, ["carts", "lines", "delivery_groups"]) ||
    !Array.isArray(value.carts) || value.carts.length === 0 || value.carts.length > 100 ||
    !Array.isArray(value.lines) || value.lines.length === 0 || value.lines.length > 10000 ||
    !Array.isArray(value.delivery_groups) || value.delivery_groups.length > 100) return fail();
  const carts = new Set<string>();
  for (const cart of value.carts) {
    if (!fields(cart, ["cart_id", "version"]) || !identity(cart.cart_id) ||
      typeof cart.version !== "string" || !cart.version.length || cart.version.length > 512 ||
      cart.version.trim() !== cart.version || carts.has(cart.cart_id)) return fail();
    carts.add(cart.cart_id);
  }
  const covered = new Set<string>();
  const sourceLines = new Set<string>();
  const targetLines = new Set<string>();
  for (const line of value.lines) {
    if (!fields(line, ["cart_id", "cart_line_item", "cart_units", "order_line_item", "order_units"]) ||
      typeof line.cart_id !== "string" || !carts.has(line.cart_id) ||
      !reference(line.cart_line_item) || !reference(line.order_line_item) ||
      line.cart_line_item.type !== line.order_line_item.type || !units(line.cart_units) || !units(line.order_units) ||
      line.cart_units.quantity !== line.order_units.quantity ||
      (line.cart_line_item.type !== "product" && line.cart_units.quantity !== 1)) return fail();
    const source = `${line.cart_id}:${line.cart_line_item.line_item_id}`;
    if (sourceLines.has(source) || targetLines.has(line.order_line_item.line_item_id)) return fail();
    sourceLines.add(source);
    targetLines.add(line.order_line_item.line_item_id);
    covered.add(line.cart_id);
  }
  if (covered.size !== carts.size) return fail();
  const sourceGroups = new Set<string>();
  const targetGroups = new Set<string>();
  for (const group of value.delivery_groups) {
    if (!fields(group, ["cart_id", "cart_delivery_group_id", "delivery_group_id"]) ||
      typeof group.cart_id !== "string" || !carts.has(group.cart_id) ||
      !identity(group.cart_delivery_group_id) || !identity(group.delivery_group_id)) return fail();
    const source = `${group.cart_id}:${group.cart_delivery_group_id}`;
    if (sourceGroups.has(source) || targetGroups.has(group.delivery_group_id)) return fail();
    sourceGroups.add(source);
    targetGroups.add(group.delivery_group_id);
  }
  const serialized = JSON.stringify(value);
  if (new TextEncoder().encode(serialized).length > 4 * 1024 * 1024) return fail();
  return JSON.parse(serialized) as CheckoutQuoteSources;
}
