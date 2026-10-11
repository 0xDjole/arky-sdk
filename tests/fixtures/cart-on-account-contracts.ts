import type {
  CheckoutAcceptance,
  CheckoutCartOnAccountInput,
  CheckoutCartOnAccountParams,
  CheckoutPaymentChoice,
  Company,
  CompanyLocation,
  CompanyPaymentPolicy,
  CompanyPurchasingPolicy,
  EpochMilliseconds,
  PaymentTerms,
  SetCompanyPurchasingParams,
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
type Companies = Admin["companies"];
type Location = Admin["companies"]["location"];

export type OnAccountContracts = [
  Assert<Equal<CheckoutCartOnAccountParams, Public.CheckoutCartOnAccountParams>>,
  Assert<Equal<SetCompanyPurchasingParams, Public.SetCompanyPurchasingParams>>,
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
  Assert<Equal<keyof SetCompanyPurchasingParams, "store_id" | "id" | "expected_updated_at" | "purchasing">>,
  Assert<Required<SetCompanyPurchasingParams, "expected_updated_at">>,
  Assert<Equal<SetCompanyPurchasingParams["expected_updated_at"], EpochMilliseconds>>,
  Assert<Equal<SetCompanyPurchasingParams["purchasing"], CompanyPurchasingPolicy>>,
  Assert<Equal<keyof CompanyPurchasingPolicy, "payment" | "allowed_payment_option_ids" | "purchase_order_number_required">>,
  Assert<Equal<CompanyPurchasingPolicy["allowed_payment_option_ids"], string[]>>,
  Assert<Equal<CompanyPaymentPolicy["type"], "standard_checkout" | "on_account">>,
  Assert<Equal<Extract<CompanyPaymentPolicy, { type: "on_account" }>["terms"], PaymentTerms>>,
  Assert<Equal<Parameters<Location["setPurchasing"]>[0], SetCompanyPurchasingParams>>,
  Assert<Equal<Awaited<ReturnType<Location["setPurchasing"]>>, CompanyLocation>>,
  Assert<Equal<Parameters<Companies["setPurchasing"]>[0], SetCompanyPurchasingParams>>,
  Assert<Equal<Awaited<ReturnType<Companies["setPurchasing"]>>, Company>>,
  Assert<Equal<Company["purchasing"], CompanyPurchasingPolicy>>,
  Assert<Equal<CompanyLocation["purchasing"], CompanyPurchasingPolicy>>,
  Assert<Missing<CompanyLocation, "commerce">>,
  Assert<Missing<Location, "setCommercePolicy">>,
  Assert<Missing<Companies, "minimumProgress">>,
];
