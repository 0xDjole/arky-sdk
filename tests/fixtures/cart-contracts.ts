import type {
  Cart, CartAudienceItem, CartStatus, PurchaseOrigin, OrderQuote, AudienceQuoteLine,
  CheckoutCartParams, CreateCartParams, UpdateCartParams, FindCartsParams,
  StorefrontUpdateCartParams, StorefrontAddCartProductParams, StorefrontCurrentCartParams,
  CartCheckoutRequest, CartPresentationChangedError,
  StorefrontClient,
} from "arky-sdk";
import type { ArkyCartCheckoutInput, ArkyCartInput } from "arky-sdk/storefront";
import type * as Public from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredNullable<T, K extends keyof T> = {} extends Pick<T, K> ? false : null extends T[K] ? true : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

export type CartContracts = [
  Assert<Equal<Cart, Public.Cart>>,
  Assert<Equal<CartStatus, Public.CartStatus>>,
  Assert<Equal<CartStatus["type"], "active" | "abandoned" | "converted" | "expired">>,
  Assert<Equal<Cart["origin"], PurchaseOrigin>>,
  Assert<Equal<Cart["audience_items"], CartAudienceItem[]>>,
  Assert<RequiredNullable<Cart, "customer_id">>,
  Assert<RequiredNullable<Cart, "company_id">>,
  Assert<RequiredNullable<Cart, "company_location_id">>,
  Assert<Equal<Cart["market_id"], string>>,
  Assert<Equal<Cart["sales_channel_id"], string>>,
  Assert<Missing<Cart, "market">>,
  Assert<Missing<Cart, "customer_session_id">>,
  Assert<Missing<Cart, "created_by_account_id">>,
  Assert<Missing<CreateCartParams, "market">>,
  Assert<Missing<UpdateCartParams, "market">>,
  Assert<Equal<FindCartsParams["statuses"], CartStatus["type"][] | undefined>>,
  Assert<Equal<FindCartsParams["origins"], PurchaseOrigin["type"][] | undefined>>,
  Assert<Equal<UpdateCartParams["company_id"], string | null | undefined>>,
  Assert<Equal<UpdateCartParams["market_id"], string | undefined>>,
  Assert<Equal<OrderQuote, Public.OrderQuote>>,
  Assert<Equal<OrderQuote["audience_lines"], AudienceQuoteLine[]>>,
  Assert<RequiredNullable<OrderQuote, "payment_provider_id">>,
  Assert<RequiredField<OrderQuote, "presentation_digest">>,
  Assert<RequiredField<CheckoutCartParams, "presentation_digest">>,
  Assert<RequiredField<CheckoutCartParams, "locale">>,
  Assert<Equal<keyof StorefrontCurrentCartParams, "company_id" | "company_location_id">>,
  Assert<Missing<StorefrontUpdateCartParams, "customer_id">>,
  Assert<Missing<StorefrontUpdateCartParams, "store_id">>,
  Assert<Missing<NonNullable<StorefrontUpdateCartParams["digital_items"]>[number], "price_override">>,
  Assert<Missing<StorefrontAddCartProductParams["product"], "price_override">>,
  Assert<Equal<CartCheckoutRequest, Public.CartCheckoutRequest>>,
  Assert<Missing<CartCheckoutRequest, "store_id">>,
  Assert<Equal<keyof ArkyCartCheckoutInput, "payment_provider_id" | "return_url" | "clear_after_checkout">>,
  Assert<Missing<ArkyCartInput, "return_url">>,
  Assert<Equal<CartPresentationChangedError["quote"], OrderQuote>>,
  Assert<Equal<Awaited<ReturnType<StorefrontClient["eshop"]["cart"]["pendingCheckout"]>>, CartCheckoutRequest | null>>,
];
