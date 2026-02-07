import type { InventoryLevel, Location } from '../types';

export interface VariantWithInventory {
  inventory: InventoryLevel[];
}

/**
 * Get total available stock across all locations for a variant
 */
export function getAvailableStock(variant: VariantWithInventory): number {
  if (!variant?.inventory) return 0;
  return variant.inventory.reduce((sum, inv) => sum + inv.available, 0);
}

/**
 * Get total reserved stock across all locations for a variant
 */
export function getReservedStock(variant: VariantWithInventory): number {
  if (!variant?.inventory) return 0;
  return variant.inventory.reduce((sum, inv) => sum + inv.reserved, 0);
}

/**
 * Check if variant has any available stock
 */
export function hasStock(variant: VariantWithInventory, quantity: number = 1): boolean {
  return getAvailableStock(variant) >= quantity;
}

/**
 * Get inventory level at a specific location
 */
export function getInventoryAt(
  variant: VariantWithInventory,
  locationId: string
): InventoryLevel | undefined {
  return variant?.inventory?.find(inv => inv.locationId === locationId);
}

/**
 * Get the first location with available stock
 * Returns the locationId of the first location that has stock
 */
export function getFirstAvailableFCId(
  variant: VariantWithInventory,
  quantity: number = 1
): string | undefined {
  const inv = variant?.inventory?.find(i => i.available >= quantity);
  return inv?.locationId;
}
