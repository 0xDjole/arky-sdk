import type { InventoryLevel, FulfillmentCenter } from '../types';

export interface VariantWithInventory {
  inventory: InventoryLevel[];
}

/**
 * Get total available stock across all fulfillment centers for a variant
 */
export function getAvailableStock(variant: VariantWithInventory): number {
  if (!variant?.inventory) return 0;
  return variant.inventory.reduce((sum, inv) => sum + inv.available, 0);
}

/**
 * Get total reserved stock across all fulfillment centers for a variant
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
 * Get inventory level at a specific fulfillment center
 */
export function getInventoryAt(
  variant: VariantWithInventory,
  fulfillmentCenterId: string
): InventoryLevel | undefined {
  return variant?.inventory?.find(inv => inv.fulfillmentCenterId === fulfillmentCenterId);
}

/**
 * Get the first fulfillment center with available stock
 * Returns the fulfillmentCenterId of the first center that has stock
 */
export function getFirstAvailableFCId(
  variant: VariantWithInventory,
  quantity: number = 1
): string | undefined {
  const inv = variant?.inventory?.find(i => i.available >= quantity);
  return inv?.fulfillmentCenterId;
}
