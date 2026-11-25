import type {
  LocationReach,
  StoreAccess,
  StorePermission,
  StorePermissionType,
} from "../types/storeRole";

function permissionReach(permission: StorePermission): LocationReach {
  return permission.type === "fulfillment" || permission.type === "inventory"
    ? permission.locations
    : { type: "all" };
}

function unionReach(left: LocationReach, right: LocationReach): LocationReach {
  if (left.type === "all" || right.type === "all") return { type: "all" };
  return {
    type: "ids",
    store_location_ids: [...new Set([...left.store_location_ids, ...right.store_location_ids])].sort(),
  };
}

function isLocationBound(permission: StorePermission): boolean {
  return permission.type === "fulfillment" || permission.type === "inventory";
}

const notHeldByAdmin: readonly StorePermissionType[] = [
  "private_collections",
  "customer_entries",
  "private_forms",
  "calls",
];

export function storePermissionReach(
  access: StoreAccess | null | undefined,
  permission: StorePermissionType,
): LocationReach | null {
  if (!access) return null;
  if (!notHeldByAdmin.includes(permission) && access.permissions.some((item) => item.type === "admin")) {
    return { type: "all" };
  }
  return access.permissions
    .filter((item) => item.type === permission)
    .map(permissionReach)
    .reduce<LocationReach | null>((current, reach) => (current ? unionReach(current, reach) : reach), null);
}

export function hasStorePermission(
  access: StoreAccess | null | undefined,
  permission: StorePermissionType,
  storeLocationId?: string,
): boolean {
  const reach = storePermissionReach(access, permission);
  if (!reach) return false;
  if (reach.type === "all") return true;
  return storeLocationId !== undefined && reach.store_location_ids.includes(storeLocationId);
}

export function storeLocationReadReach(access: StoreAccess | null | undefined): LocationReach {
  if (!access) return { type: "ids", store_location_ids: [] };
  const reach = (["fulfillment", "inventory"] as const)
    .map((permission) => storePermissionReach(access, permission))
    .reduce<LocationReach | null>(
      (current, next) => (next ? (current ? unionReach(current, next) : next) : current),
      null,
    );
  return reach && access.permissions.every(isLocationBound) ? reach : { type: "all" };
}
