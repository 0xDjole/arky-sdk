import type { PermissionIds, StorePermissionType, StorePermissionTypeName } from "../types/permission";
import type { StoreAccess, StoreRoleAccess } from "../types/storeRole";

const notHeldByAdmin: readonly StorePermissionTypeName[] = [
  "store_private_collections",
  "store_customer_collections",
  "store_private_forms",
  "store_calls",
  "store_customers_deny",
];

const needsSecondFactor: readonly StorePermissionTypeName[] = [
  "store_private_collections",
  "store_customer_collections",
  "store_private_forms",
];

function heldPermissions(access: StoreAccess): StorePermissionType[] {
  return access.roles.flatMap((role) => role.permissions);
}

function isStoreWide(permission: StorePermissionType): boolean {
  switch (permission.type) {
    case "store_admin":
    case "store_packages":
    case "store_marketing":
    case "store_support":
    case "store_email":
    case "store_analytics":
    case "store_orders":
    case "store_payments":
    case "store_layouts":
      return true;
    case "store_fulfillment":
    case "store_inventory":
      return permission.locations.type === "all";
    case "store_bookings":
      return permission.bookings.type === "all";
    case "store_booking_resources":
      return permission.resources.type === "all";
    case "store_booking_services":
      return permission.services.type === "all";
    case "store_public_collections":
    case "store_private_collections":
      return permission.collections.type === "all" && permission.entries.type === "all";
    case "store_customer_collections":
      return (
        permission.collections.type === "all" &&
        permission.entries.type === "all" &&
        permission.customers.type === "all"
      );
    case "store_private_forms":
      return permission.forms.type === "all" && permission.customers.type === "all";
    case "store_customers":
    case "store_conversations":
      return permission.customers.type === "all";
    case "store_calls":
      return permission.phone_numbers.type === "all" && permission.customers.type === "all";
    case "store_customers_deny":
      return false;
  }
}

function writes(permission: StorePermissionType): boolean {
  return !("action" in permission) || permission.action === "write";
}

function heldByAdmin(access: StoreAccess, type: StorePermissionTypeName): boolean {
  return !notHeldByAdmin.includes(type) && storeAccessIsAdmin(access);
}

function locationChoices(access: StoreAccess, type: "store_fulfillment" | "store_inventory"): PermissionIds[] {
  return heldPermissions(access).flatMap((permission) =>
    (permission.type === "store_fulfillment" || permission.type === "store_inventory") && permission.type === type
      ? [permission.locations]
      : [],
  );
}

function coversLocation(locations: PermissionIds, storeLocationId: string): boolean {
  return locations.type === "all" || locations.filters.every((filter) => filter.ids.includes(storeLocationId));
}

export function storeAccessIsAdmin(access: StoreAccess | null | undefined): boolean {
  if (!access) return false;
  return access.owner || heldPermissions(access).some((permission) => permission.type === "store_admin");
}

export function storeAccessHolds(access: StoreAccess | null | undefined, type: StorePermissionTypeName): boolean {
  if (!access) return false;
  return heldByAdmin(access, type) || heldPermissions(access).some((permission) => permission.type === type);
}

export function storeAccessReads(
  access: StoreAccess | null | undefined,
  type: Exclude<StorePermissionTypeName, "store_customers_deny">,
): boolean {
  if (!access) return false;
  return (
    heldByAdmin(access, type) ||
    heldPermissions(access).some((permission) => permission.type === type && isStoreWide(permission))
  );
}

export function storeAccessPermits(
  access: StoreAccess | null | undefined,
  type: Exclude<StorePermissionTypeName, "store_customers_deny">,
): boolean {
  if (!access) return false;
  return (
    heldByAdmin(access, type) ||
    heldPermissions(access).some(
      (permission) => permission.type === type && isStoreWide(permission) && writes(permission),
    )
  );
}

export function storeAccessCovers(
  access: StoreAccess | null | undefined,
  type: "store_fulfillment" | "store_inventory",
  storeLocationId: string,
): boolean {
  if (!access) return false;
  if (storeAccessIsAdmin(access)) return true;
  return locationChoices(access, type).some((locations) => coversLocation(locations, storeLocationId));
}

export function storeAccessLocations(
  access: StoreAccess | null | undefined,
  type: "store_fulfillment" | "store_inventory",
): PermissionIds | null {
  if (!access) return null;
  if (storeAccessIsAdmin(access)) return { type: "all" };
  const choices = locationChoices(access, type);
  if (choices.length === 0) return null;
  if (choices.some((locations) => locations.type === "all")) return { type: "all" };
  const ids = choices.flatMap((locations) =>
    locations.type === "filtered" ? locations.filters.flatMap((filter) => filter.ids) : [],
  );
  return { type: "filtered", filters: [{ type: "ids", ids: [...new Set(ids)].sort() }] };
}

export function storeAccessWithheld(access: StoreAccess | null | undefined): StoreAccess {
  const roles: StoreRoleAccess[] = [];
  for (const item of access?.withheld ?? []) {
    const role = roles.find((entry) => entry.role_id === item.role_id);
    if (role) role.permissions.push(item.permission);
    else roles.push({ role_id: item.role_id, permissions: [item.permission] });
  }
  return { owner: false, roles, withheld: [] };
}

export function storePermissionNeedsSecondFactor(type: StorePermissionTypeName): boolean {
  return needsSecondFactor.includes(type);
}
