import type {
  CartOnAccountCheckoutRequest,
  CheckoutCartOnAccountParams,
  CheckoutQuoteSources,
  CompanyLocation,
  CompanyLocationCommercePolicy,
  EpochMilliseconds,
  OrderCheckoutResult,
  SetCompanyLocationCommercePolicyParams,
  StorefrontClient,
} from "arky-sdk";
import type { createAdmin } from "arky-sdk/admin";
import type * as Public from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Required<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Admin = ReturnType<typeof createAdmin>;
type Cart = Admin["eshop"]["cart"];
type Location = Admin["companies"]["location"];

export type OnAccountContracts = [
  Assert<Equal<CheckoutCartOnAccountParams, Public.CheckoutCartOnAccountParams>>,
  Assert<Equal<CartOnAccountCheckoutRequest, Public.CartOnAccountCheckoutRequest>>,
  Assert<Equal<SetCompanyLocationCommercePolicyParams, Public.SetCompanyLocationCommercePolicyParams>>,
  Assert<Equal<keyof CheckoutCartOnAccountParams, "id" | "store_id" | "request_id" | "locale" | "presentation_digest" | "sources" | "payment_option_id" | "reason">>,
  Assert<Required<CheckoutCartOnAccountParams, "reason">>,
  Assert<Required<CheckoutCartOnAccountParams, "locale">>,
  Assert<Equal<CheckoutCartOnAccountParams["sources"], CheckoutQuoteSources>>,
  Assert<Equal<CheckoutCartOnAccountParams["payment_option_id"], string | undefined>>,
  Assert<Equal<CartOnAccountCheckoutRequest, Omit<CheckoutCartOnAccountParams, "store_id">>>,
  Assert<Equal<Parameters<Cart["checkoutOnAccount"]>[0], CheckoutCartOnAccountParams>>,
  Assert<Equal<Awaited<ReturnType<Cart["checkoutOnAccount"]>>, OrderCheckoutResult>>,
  Assert<Equal<Awaited<ReturnType<Cart["retainOnAccountCheckout"]>>, CartOnAccountCheckoutRequest>>,
  Assert<Equal<Awaited<ReturnType<Cart["pendingOnAccountCheckout"]>>, CartOnAccountCheckoutRequest | null>>,
  Assert<Equal<Awaited<ReturnType<Cart["recoverOnAccountCheckout"]>>, OrderCheckoutResult | null>>,
  Assert<Missing<StorefrontClient["eshop"]["cart"], "checkoutOnAccount">>,
  Assert<Missing<StorefrontClient["eshop"]["cart"], "retainOnAccountCheckout">>,
  Assert<Missing<StorefrontClient["eshop"]["cart"], "recoverOnAccountCheckout">>,
  Assert<Equal<keyof SetCompanyLocationCommercePolicyParams, "store_id" | "id" | "expected_updated_at" | "commerce">>,
  Assert<Required<SetCompanyLocationCommercePolicyParams, "expected_updated_at">>,
  Assert<Equal<SetCompanyLocationCommercePolicyParams["expected_updated_at"], EpochMilliseconds>>,
  Assert<Equal<SetCompanyLocationCommercePolicyParams["commerce"], CompanyLocationCommercePolicy>>,
  Assert<Equal<Parameters<Location["setCommercePolicy"]>[0], SetCompanyLocationCommercePolicyParams>>,
  Assert<Equal<Awaited<ReturnType<Location["setCommercePolicy"]>>, CompanyLocation>>,
];
