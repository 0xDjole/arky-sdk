import type { EpochMilliseconds } from "./time";

export type PermissionAction = "read" | "write";

export type PermissionIdFilter = { type: "ids"; ids: string[] };

export type PermissionIds = { type: "all" } | { type: "filtered"; filters: PermissionIdFilter[] };

export type PermissionCustomerFilter =
  | { type: "ids"; customer_ids: string[] }
  | { type: "booked_on_resources"; booking_resource_ids: string[] }
  | { type: "booked_on_services"; booking_service_ids: string[] }
  | { type: "booked_at_locations"; store_location_ids: string[] }
  | { type: "in_packages"; package_ids: string[] }
  | { type: "in_companies"; company_ids: string[] }
  | { type: "in_categories"; category_ids: string[] };

export type PermissionCustomers = { type: "all" } | { type: "filtered"; filters: PermissionCustomerFilter[] };

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
  | { type: "at_locations"; store_location_ids: string[] };

export type PermissionBookings = { type: "all" } | { type: "filtered"; filters: PermissionBookingFilter[] };

export type PermissionBookingResourceFilter =
  | { type: "ids"; booking_resource_ids: string[] }
  | { type: "at_locations"; store_location_ids: string[] };

export type PermissionBookingResources =
  | { type: "all" }
  | { type: "filtered"; filters: PermissionBookingResourceFilter[] };

export type PlatformPermissionType = { type: "platform_admin" };

export type NetworkPermissionType =
  | { type: "network_admin"; network_id: string }
  | { type: "network_logins"; network_id: string }
  | { type: "network_stores"; network_id: string; action: PermissionAction }
  | { type: "network_plans"; network_id: string; action: PermissionAction };

export type NetworkPermissionTypeName = NetworkPermissionType["type"];

export type CompanyPermissionType =
  | { type: "company_admin"; store_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_write"; store_id: string; company_id: string }
  | { type: "company_addresses_write"; store_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_members_write"; store_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_payment_methods_write"; store_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_place_orders"; store_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_join_packages"; store_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_digital_products_read"; store_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_own_orders_read"; store_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_all_orders_read"; store_id: string; company_id: string; locations: PermissionIds }
  | { type: "company_own_packages_read"; store_id: string; company_id: string; locations: PermissionIds }
  | {
      type: "company_all_packages";
      store_id: string;
      company_id: string;
      action: PermissionAction;
      locations: PermissionIds;
    };

export type CompanyPermissionTypeName = CompanyPermissionType["type"];

export type StorePermissionType =
  | { type: "store_admin"; store_id: string }
  | { type: "store_packages"; store_id: string }
  | { type: "store_marketing"; store_id: string }
  | { type: "store_support"; store_id: string }
  | { type: "store_email"; store_id: string }
  | { type: "store_analytics"; store_id: string }
  | { type: "store_orders"; store_id: string; action: PermissionAction }
  | { type: "store_payments"; store_id: string; action: PermissionAction }
  | { type: "store_layouts"; store_id: string; action: PermissionAction }
  | { type: "store_fulfillment"; store_id: string; locations: PermissionIds }
  | { type: "store_inventory"; store_id: string; locations: PermissionIds }
  | { type: "store_bookings"; store_id: string; action: PermissionAction; bookings: PermissionBookings }
  | {
      type: "store_booking_resources";
      store_id: string;
      action: PermissionAction;
      resources: PermissionBookingResources;
    }
  | { type: "store_booking_services"; store_id: string; action: PermissionAction; services: PermissionIds }
  | {
      type: "store_public_collections";
      store_id: string;
      action: PermissionAction;
      collections: PermissionIds;
      entries: PermissionEntries;
    }
  | {
      type: "store_private_collections";
      store_id: string;
      action: PermissionAction;
      collections: PermissionIds;
      entries: PermissionEntries;
    }
  | {
      type: "store_customer_collections";
      store_id: string;
      action: PermissionAction;
      collections: PermissionIds;
      entries: PermissionEntries;
      customers: PermissionCustomers;
    }
  | {
      type: "store_private_forms";
      store_id: string;
      action: PermissionAction;
      forms: PermissionIds;
      customers: PermissionCustomers;
    }
  | { type: "store_customers"; store_id: string; action: PermissionAction; customers: PermissionCustomers }
  | { type: "store_conversations"; store_id: string; action: PermissionAction; customers: PermissionCustomers }
  | { type: "store_calls"; store_id: string; phone_numbers: PermissionIds; customers: PermissionCustomers }
  | { type: "store_customers_deny"; store_id: string; filter: PermissionCustomerFilter };

export type StorePermissionTypeName = StorePermissionType["type"];

export type CustomerPermissionType = {
  type: "customer_own_entries";
  store_id: string;
  collection_id: string;
  entries: PermissionEntries;
};

export type PermissionType =
  | PlatformPermissionType
  | NetworkPermissionType
  | CompanyPermissionType
  | StorePermissionType
  | CustomerPermissionType;

export interface StoreRolePermission {
  id: string;
  role_id: string;
  type: StorePermissionType;
  created_at: EpochMilliseconds;
}

export interface CustomerRolePermission {
  id: string;
  role_id: string;
  type: CustomerPermissionType;
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
