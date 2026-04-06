import type { InventoryLevel, Location } from '../types';

export interface VariantWithInventory {
  inventory: InventoryLevel[];
}


export function getAvailableStock(variant: VariantWithInventory): number {
  if (!variant?.inventory) return 0;
  return variant.inventory.reduce((sum, inv) => sum + inv.available, 0);
}


export function getReservedStock(variant: VariantWithInventory): number {
  if (!variant?.inventory) return 0;
  return variant.inventory.reduce((sum, inv) => sum + inv.reserved, 0);
}


export function hasStock(variant: VariantWithInventory, quantity: number = 1): boolean {
  return getAvailableStock(variant) >= quantity;
}


export function getInventoryAt(
  variant: VariantWithInventory,
  locationId: string
): InventoryLevel | undefined {
  return variant?.inventory?.find(inv => inv.locationId === locationId);
}


export function getFirstAvailableFCId(
  variant: VariantWithInventory,
  quantity: number = 1
): string | undefined {
  const inv = variant?.inventory?.find(i => i.available >= quantity);
  return inv?.locationId;
}
