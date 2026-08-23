import type { ProductInventory } from "../types";

type InventoryStock = Pick<
  ProductInventory,
  "store_location_id" | "on_hand" | "reserved"
>;

export interface VariantWithInventory {
  inventory: InventoryStock[];
}

function freeToSell(level: InventoryStock): number {
  if (
    !Number.isSafeInteger(level.on_hand) ||
    level.on_hand < 0 ||
    !Number.isSafeInteger(level.reserved) ||
    level.reserved < 0 ||
    level.reserved > level.on_hand
  ) {
    throw new Error(
      `Product inventory at ${level.store_location_id} violates reserved <= on_hand`,
    );
  }
  return level.on_hand - level.reserved;
}

export function getFreeToSellStock(variant: VariantWithInventory): number {
  if (!variant?.inventory) return 0;
  return variant.inventory.reduce((sum, level) => {
    const next = sum + freeToSell(level);
    if (!Number.isSafeInteger(next)) {
      throw new Error("Product free-to-sell inventory exceeds a safe integer");
    }
    return next;
  }, 0);
}

export function getReservedStock(variant: VariantWithInventory): number {
  if (!variant?.inventory) return 0;
  return variant.inventory.reduce((sum, level) => {
    freeToSell(level);
    const next = sum + level.reserved;
    if (!Number.isSafeInteger(next)) {
      throw new Error("Product reserved inventory exceeds a safe integer");
    }
    return next;
  }, 0);
}

export function hasStock(
  variant: VariantWithInventory,
  quantity: number = 1,
): boolean {
  return getFreeToSellStock(variant) >= quantity;
}

export function getInventoryAt(
  variant: VariantWithInventory,
  storeLocationId: string,
): InventoryStock | undefined {
  return variant?.inventory?.find(
    (level) => level.store_location_id === storeLocationId,
  );
}

export function getFirstAvailableStoreLocationId(
  variant: VariantWithInventory,
  quantity: number = 1,
): string | undefined {
  const level = variant?.inventory?.find(
    (candidate) => freeToSell(candidate) >= quantity,
  );
  return level?.store_location_id;
}
