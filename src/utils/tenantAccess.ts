import type { PermissionIds, TenantPermissionType, TenantPermissionTypeName } from "../types/permission";
import type { TenantAccess, TenantRoleAccess } from "../types/tenantRole";

const notHeldByAdmin: readonly TenantPermissionTypeName[] = [
  "tenant_private_collections",
  "tenant_user_collections",
  "tenant_private_forms",
  "tenant_calls",
  "tenant_users_deny",
];

const needsSecondFactor: readonly TenantPermissionTypeName[] = [
  "tenant_private_collections",
  "tenant_user_collections",
  "tenant_private_forms",
];

function heldPermissions(access: TenantAccess): TenantPermissionType[] {
  return access.roles.flatMap((role) => role.permissions);
}

function isTenantWide(permission: TenantPermissionType): boolean {
  switch (permission.type) {
    case "tenant_admin":
    case "tenant_packages":
    case "tenant_marketing":
    case "tenant_support":
    case "tenant_email":
    case "tenant_analytics":
    case "tenant_orders":
    case "tenant_payments":
    case "tenant_layouts":
      return true;
    case "tenant_fulfillment":
    case "tenant_inventory":
      return permission.locations.type === "all";
    case "tenant_bookings":
      return permission.bookings.type === "all";
    case "tenant_booking_resources":
      return permission.resources.type === "all";
    case "tenant_booking_services":
      return permission.services.type === "all";
    case "tenant_public_collections":
    case "tenant_private_collections":
      return permission.collections.type === "all" && permission.entries.type === "all";
    case "tenant_user_collections":
      return (
        permission.collections.type === "all" &&
        permission.entries.type === "all" &&
        permission.users.type === "all"
      );
    case "tenant_private_forms":
      return permission.forms.type === "all" && permission.users.type === "all";
    case "tenant_users":
    case "tenant_conversations":
      return permission.users.type === "all";
    case "tenant_calls":
      return permission.phone_numbers.type === "all" && permission.users.type === "all";
    case "tenant_users_deny":
      return false;
  }
}

function writes(permission: TenantPermissionType): boolean {
  return !("action" in permission) || permission.action === "write";
}

function heldByAdmin(access: TenantAccess, type: TenantPermissionTypeName): boolean {
  return !notHeldByAdmin.includes(type) && tenantAccessIsAdmin(access);
}

function locationChoices(access: TenantAccess, type: "tenant_fulfillment" | "tenant_inventory"): PermissionIds[] {
  return heldPermissions(access).flatMap((permission) =>
    (permission.type === "tenant_fulfillment" || permission.type === "tenant_inventory") && permission.type === type
      ? [permission.locations]
      : [],
  );
}

function coversLocation(locations: PermissionIds, tenantLocationId: string): boolean {
  return locations.type === "all" || locations.filters.every((filter) => filter.ids.includes(tenantLocationId));
}

export function tenantAccessIsAdmin(access: TenantAccess | null | undefined): boolean {
  if (!access) return false;
  return access.owner || heldPermissions(access).some((permission) => permission.type === "tenant_admin");
}

export function tenantAccessHolds(access: TenantAccess | null | undefined, type: TenantPermissionTypeName): boolean {
  if (!access) return false;
  return heldByAdmin(access, type) || heldPermissions(access).some((permission) => permission.type === type);
}

export function tenantAccessReads(
  access: TenantAccess | null | undefined,
  type: Exclude<TenantPermissionTypeName, "tenant_users_deny">,
): boolean {
  if (!access) return false;
  return (
    heldByAdmin(access, type) ||
    heldPermissions(access).some((permission) => permission.type === type && isTenantWide(permission))
  );
}

export function tenantAccessPermits(
  access: TenantAccess | null | undefined,
  type: Exclude<TenantPermissionTypeName, "tenant_users_deny">,
): boolean {
  if (!access) return false;
  return (
    heldByAdmin(access, type) ||
    heldPermissions(access).some(
      (permission) => permission.type === type && isTenantWide(permission) && writes(permission),
    )
  );
}

export function tenantAccessCovers(
  access: TenantAccess | null | undefined,
  type: "tenant_fulfillment" | "tenant_inventory",
  tenantLocationId: string,
): boolean {
  if (!access) return false;
  if (tenantAccessIsAdmin(access)) return true;
  return locationChoices(access, type).some((locations) => coversLocation(locations, tenantLocationId));
}

export function tenantAccessLocations(
  access: TenantAccess | null | undefined,
  type: "tenant_fulfillment" | "tenant_inventory",
): PermissionIds | null {
  if (!access) return null;
  if (tenantAccessIsAdmin(access)) return { type: "all" };
  const choices = locationChoices(access, type);
  if (choices.length === 0) return null;
  if (choices.some((locations) => locations.type === "all")) return { type: "all" };
  const ids = choices.flatMap((locations) =>
    locations.type === "filtered" ? locations.filters.flatMap((filter) => filter.ids) : [],
  );
  return { type: "filtered", filters: [{ type: "ids", ids: [...new Set(ids)].sort() }] };
}

export function tenantAccessWithheld(access: TenantAccess | null | undefined): TenantAccess {
  const roles: TenantRoleAccess[] = [];
  for (const item of access?.withheld ?? []) {
    const role = roles.find((entry) => entry.role_id === item.role_id);
    if (role) role.permissions.push(item.permission);
    else roles.push({ role_id: item.role_id, permissions: [item.permission] });
  }
  return { owner: false, roles, withheld: [] };
}

export function tenantPermissionNeedsSecondFactor(type: TenantPermissionTypeName): boolean {
  return needsSecondFactor.includes(type);
}
