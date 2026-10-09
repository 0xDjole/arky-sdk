import type {
  Account,
  AddStoreMemberParams,
  ChangeStoreMemberStatusParams,
  FindOwnStoreMembershipsParams,
  GetOwnStoreMembershipParams,
  LocationReach,
  PaginatedResponse,
  Store,
  StoreAccess,
  StoreMembership,
  StoreMembershipStatus,
  StoreMembershipWithStoreName,
  StorePermission,
  StoreRole,
  TransferStoreOwnershipParams,
  UpdateStoreMemberRolesParams,
} from "arky-sdk";
import type { createAdmin } from "arky-sdk/admin";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Admin = ReturnType<typeof createAdmin>;

export type MembershipDiscoveryContracts = [
  Assert<Equal<ReturnType<Admin["store"]["member"]["getOwn"]>, Promise<StoreMembershipWithStoreName | null>>>,
  Assert<Equal<ReturnType<Admin["store"]["member"]["findOwn"]>, Promise<PaginatedResponse<StoreMembershipWithStoreName>>>>,
  Assert<Equal<NonNullable<Parameters<Admin["store"]["member"]["getOwn"]>[0]>, GetOwnStoreMembershipParams>>,
  Assert<Equal<NonNullable<Parameters<Admin["store"]["member"]["findOwn"]>[0]>, FindOwnStoreMembershipsParams>>,
  Assert<Equal<Parameters<Admin["store"]["member"]["updateRoles"]>[0], UpdateStoreMemberRolesParams>>,
  Assert<Equal<ReturnType<Admin["store"]["member"]["updateRoles"]>, Promise<StoreMembership>>>,
  Assert<Equal<Parameters<Admin["store"]["member"]["add"]>[0], AddStoreMemberParams>>,
  Assert<Equal<StoreMembership["role_ids"], string[]>>,
  Assert<Missing<StoreMembership, "access" | "store_name" | "role" | "invitation_delivery_id" | "invitation_email_status">>,
  Assert<Equal<StoreMembershipWithStoreName["access"], StoreAccess>>,
  Assert<Equal<StoreAccess["permissions"], StorePermission[]>>,
  Assert<Equal<StoreMembershipWithStoreName["store_name"], string>>,
  Assert<RequiredField<AddStoreMemberParams, "role_ids">>,
  Assert<Missing<AddStoreMemberParams, "access" | "role">>,
  Assert<Equal<StorePermission["type"], "admin" | "catalog" | "orders" | "customers" | "fulfillment" | "inventory" | "marketing" | "content" | "support" | "email" | "analytics">>,
  Assert<Equal<Extract<StorePermission, { type: "fulfillment" }>["locations"], LocationReach>>,
  Assert<Equal<Extract<StorePermission, { type: "inventory" }>["locations"], LocationReach>>,
  Assert<Missing<Extract<StorePermission, { type: "orders" }>, "locations">>,
  Assert<Equal<LocationReach, { type: "everywhere" } | { type: "only"; store_location_ids: string[] }>>,
  Assert<Missing<StoreRole, "status">>,
  Assert<Equal<keyof Admin["store"]["role"], "create" | "update" | "get" | "find" | "delete">>,
  Assert<Equal<Parameters<Admin["store"]["member"]["transferOwnership"]>[0], TransferStoreOwnershipParams>>,
  Assert<Equal<ReturnType<Admin["store"]["member"]["transferOwnership"]>, Promise<Store>>>,
  Assert<Equal<Parameters<Admin["store"]["member"]["changeStatus"]>[0], ChangeStoreMemberStatusParams>>,
  Assert<Equal<ReturnType<Admin["store"]["member"]["changeStatus"]>, Promise<StoreMembership>>>,
  Assert<Equal<ChangeStoreMemberStatusParams["status"], StoreMembershipStatus>>,
  Assert<Equal<StoreMembershipStatus, { type: "invited" } | { type: "active" } | { type: "disabled" }>>,
  Assert<Equal<Store["owner_account_id"], string>>,
  Assert<Missing<Admin["store"], "buildHook">>,
  Assert<Equal<Account["status"], { type: "active" } | { type: "deleting" }>>,
];
