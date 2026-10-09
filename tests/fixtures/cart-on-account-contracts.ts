import type {
  CheckoutAcceptance,
  CheckoutCartOnAccountInput,
  CheckoutCartOnAccountParams,
  CheckoutPaymentChoice,
  CompanyLocation,
  CompanyLocationCommercePolicy,
  CompanyLocationPayment,
  EpochMilliseconds,
  PaymentTerms,
  SetCompanyLocationCommercePolicyParams,
  StorefrontCheckoutCartInput,
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
  Assert<Equal<SetCompanyLocationCommercePolicyParams, Public.SetCompanyLocationCommercePolicyParams>>,
  Assert<Equal<keyof CheckoutCartOnAccountParams, "store_id" | "order_id" | "cart_id" | "expected_updated_at" | "presentation_digest" | "language" | "contact_email" | "payment_option_id" | "terms" | "reason">>,
  Assert<Equal<CheckoutCartOnAccountInput, Omit<CheckoutCartOnAccountParams, "store_id">>>,
  Assert<Required<CheckoutCartOnAccountParams, "reason">>,
  Assert<Required<CheckoutCartOnAccountParams, "language">>,
  Assert<Required<CheckoutCartOnAccountParams, "order_id">>,
  Assert<Equal<CheckoutCartOnAccountParams["terms"], PaymentTerms>>,
  Assert<Equal<PaymentTerms, { type: "due_on_receipt" } | { type: "net_days"; days: number }>>,
  Assert<Equal<CheckoutCartOnAccountParams["payment_option_id"], string>>,
  Assert<Equal<Parameters<Cart["checkoutOnAccount"]>[0], CheckoutCartOnAccountParams>>,
  Assert<Equal<Awaited<ReturnType<Cart["checkoutOnAccount"]>>, CheckoutAcceptance>>,
  Assert<Missing<Cart, "retainOnAccountCheckout">>,
  Assert<Missing<Cart, "recoverCheckout">>,
  Assert<Missing<StorefrontClient["eshop"]["cart"], "checkoutOnAccount">>,
  Assert<Missing<StorefrontCheckoutCartInput, "language">>,
  Assert<Extract<CheckoutPaymentChoice, { type: "on_account" }> extends { payment_option_id: string } ? true : false>,
  Assert<Equal<keyof SetCompanyLocationCommercePolicyParams, "store_id" | "id" | "expected_updated_at" | "commerce">>,
  Assert<Required<SetCompanyLocationCommercePolicyParams, "expected_updated_at">>,
  Assert<Equal<SetCompanyLocationCommercePolicyParams["expected_updated_at"], EpochMilliseconds>>,
  Assert<Equal<SetCompanyLocationCommercePolicyParams["commerce"], CompanyLocationCommercePolicy>>,
  Assert<Equal<CompanyLocationPayment["type"], "at_checkout" | "on_account">>,
  Assert<Equal<Parameters<Location["setCommercePolicy"]>[0], SetCompanyLocationCommercePolicyParams>>,
  Assert<Equal<Awaited<ReturnType<Location["setCommercePolicy"]>>, CompanyLocation>>,
];
