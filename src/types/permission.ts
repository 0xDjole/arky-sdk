import type { EpochMilliseconds } from "./time";

export type PermissionAction = "read" | "write";

export type PermissionIdFilter = { type: "ids"; ids: string[] };

export type PermissionIds = { type: "all" } | { type: "filtered"; filters: PermissionIdFilter[] };

export type PermissionUserFilter =
  | { type: "ids"; user_ids: string[] }
  | { type: "booked_on_resources"; booking_resource_ids: string[] }
  | { type: "booked_on_services"; booking_service_ids: string[] }
  | { type: "booked_at_locations"; tenant_location_ids: string[] }
  | { type: "in_packages"; package_ids: string[] }
  | { type: "in_companies"; company_ids: string[] }
  | { type: "in_categories"; category_ids: string[] };

export type PermissionUsers = { type: "all" } | { type: "filtered"; filters: PermissionUserFilter[] };

export type PermissionFilterOperation =
  | "equals"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal";

export type PermissionFieldFilter =
  | { type: "text"; key: string; values: string[] }
  | { type: "number"; key: string; operation: PermissionFilterOperation; value: number }
  | { type: "boolean"; key: string; value: boolean };

export type PermissionEntries = { type: "all" } | { type: "filtered"; filters: PermissionFieldFilter[] };

export type PermissionBookingFilter =
  | { type: "on_resources"; booking_resource_ids: string[] }
  | { type: "at_locations"; tenant_location_ids: string[] };

export type PermissionBookings = { type: "all" } | { type: "filtered"; filters: PermissionBookingFilter[] };

export type PermissionBookingResourceFilter =
  | { type: "ids"; booking_resource_ids: string[] }
  | { type: "at_locations"; tenant_location_ids: string[] };

export type PermissionBookingResources =
  | { type: "all" }
  | { type: "filtered"; filters: PermissionBookingResourceFilter[] };

export type PlatformPermissionType = { type: "platform_admin" };

export type NetworkPermissionType =
  | { type: "network_admin"; network_id: string }
  | { type: "network_logins"; network_id: string }
  | { type: "network_tenants"; network_id: string; action: PermissionAction }
  | { type: "network_plans"; network_id: string; action: PermissionAction };

export type NetworkPermissionTypeName = NetworkPermissionType["type"];

export type CompanyPermissionType =
  | { type: "company_admin"; tenant_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_write"; tenant_id: string; company_id: string }
  | { type: "company_addresses_write"; tenant_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_members_write"; tenant_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_payment_methods_write"; tenant_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_place_orders"; tenant_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_join_packages"; tenant_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_digital_products_read"; tenant_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_own_orders_read"; tenant_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_all_orders_read"; tenant_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_own_packages_read"; tenant_id: string; company_id: string; locations: PermissionIds }
  | {
      type: "company_all_packages";
      tenant_id: string;
      company_id: string;
      action: PermissionAction;
      locations: PermissionIds;
    };

export type CompanyPermissionTypeName = CompanyPermissionType["type"];

export type TenantPermissionType =
  | { type: "tenant_admin"; tenant_id: string }
  | { type: "tenant_packages"; tenant_id: string }
  | { type: "tenant_marketing"; tenant_id: string }
  | { type: "tenant_support"; tenant_id: string }
  | { type: "tenant_email"; tenant_id: string }
  | { type: "tenant_analytics"; tenant_id: string }
  | { type: "tenant_orders"; tenant_id: string; action: PermissionAction }
  | { type: "tenant_payments"; tenant_id: string; action: PermissionAction }
  | { type: "tenant_layouts"; tenant_id: string; action: PermissionAction }
  | { type: "tenant_fulfillment"; tenant_id: string; locations: PermissionIds }
  | { type: "tenant_inventory"; tenant_id: string; locations: PermissionIds }
  | { type: "tenant_bookings"; tenant_id: string; action: PermissionAction; bookings: PermissionBookings }
  | {
      type: "tenant_booking_resources";
      tenant_id: string;
      action: PermissionAction;
      resources: PermissionBookingResources;
    }
  | { type: "tenant_booking_services"; tenant_id: string; action: PermissionAction; services: PermissionIds }
  | {
      type: "tenant_public_collections";
      tenant_id: string;
      action: PermissionAction;
      collections: PermissionIds;
      entries: PermissionEntries;
    }
  | {
      type: "tenant_private_collections";
      tenant_id: string;
      action: PermissionAction;
      collections: PermissionIds;
      entries: PermissionEntries;
    }
  | {
      type: "tenant_user_collections";
      tenant_id: string;
      action: PermissionAction;
      collections: PermissionIds;
      entries: PermissionEntries;
      users: PermissionUsers;
    }
  | {
      type: "tenant_private_forms";
      tenant_id: string;
      action: PermissionAction;
      forms: PermissionIds;
      users: PermissionUsers;
    }
  | { type: "tenant_users"; tenant_id: string; action: PermissionAction; users: PermissionUsers }
  | { type: "tenant_conversations"; tenant_id: string; action: PermissionAction; users: PermissionUsers }
  | { type: "tenant_calls"; tenant_id: string; phone_numbers: PermissionIds; users: PermissionUsers }
  | { type: "tenant_users_deny"; tenant_id: string; filter: PermissionUserFilter };

export type TenantPermissionTypeName = TenantPermissionType["type"];

export type UserPermissionType = {
  type: "user_own_entries";
  tenant_id: string;
  collection_id: string;
  entries: PermissionEntries;
};

export type PermissionType =
  | PlatformPermissionType
  | NetworkPermissionType
  | CompanyPermissionType
  | TenantPermissionType
  | UserPermissionType;

export interface TenantRolePermission {
  id: string;
  role_id: string;
  type: TenantPermissionType;
  created_at: EpochMilliseconds;
}

export interface UserRolePermission {
  id: string;
  role_id: string;
  type: UserPermissionType;
  created_at: EpochMilliseconds;
}

export interface NetworkRolePermission {
  id: string;
  role_id: string;
  type: NetworkPermissionType;
  created_at: EpochMilliseconds;
}

export interface CompanyRolePermission {
  id: string;
  role_id: string;
  type: CompanyPermissionType;
  created_at: EpochMilliseconds;
}
