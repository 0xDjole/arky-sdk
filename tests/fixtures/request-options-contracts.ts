import type {
  AdminRequestOptions,
  CustomerSearchSnapshot,
  FindCustomersParams,
  PaginatedResponse,
  RequestOptions,
  StorefrontRequestOptions,
} from "arky-sdk";
import type { AdminClient, AdminSession, AuthStateListener } from "arky-sdk/admin";
import type { StorefrontClient } from "arky-sdk/storefront";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

export type RequestOptionContracts = [
  Assert<Equal<keyof AdminRequestOptions, "headers" | "signal" | "onSuccess" | "onError">>,
  Assert<Missing<AdminRequestOptions, "locale" | "market" | "order_token">>,
  Assert<Equal<keyof StorefrontRequestOptions, "headers" | "signal" | "onSuccess" | "onError" | "order_token" | "locale" | "market">>,
  Assert<Equal<StorefrontRequestOptions, RequestOptions>>,
  Assert<Equal<Parameters<AdminClient["customers"]["find"]>[1], AdminRequestOptions | undefined>>,
  Assert<Equal<Parameters<AdminClient["eshop"]["order"]["notes"]["create"]>[1], AdminRequestOptions | undefined>>,
  Assert<Equal<Parameters<AdminClient["account"]["getMe"]>[0], AdminRequestOptions | undefined>>,
  Assert<Equal<Parameters<AdminClient["store"]["country"]["find"]>[0], AdminRequestOptions | undefined>>,
  Assert<Equal<Parameters<AdminClient["customers"]["find"]>[0], FindCustomersParams>>,
  Assert<Equal<ReturnType<AdminClient["customers"]["find"]>, Promise<PaginatedResponse<CustomerSearchSnapshot>>>>,
  Assert<Equal<Parameters<AdminClient["onAuthStateChanged"]>[0], AuthStateListener<AdminSession>>>,
  Assert<Equal<AdminClient["session"], AdminSession | null>>,
  Assert<Equal<Parameters<StorefrontClient["eshop"]["order"]["get"]>[1], RequestOptions | undefined>>,
  Assert<Equal<Parameters<StorefrontClient["store"]["country"]["find"]>[0], RequestOptions | undefined>>,
  Assert<Equal<Parameters<StorefrontClient["customer"]["getMe"]>[0], RequestOptions | undefined>>,
];
