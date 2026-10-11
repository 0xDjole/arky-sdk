import type { EpochMilliseconds } from "./time";
import type {
  AccountActor,
  Currency,
  Money,
  PostalAddress,
  SortDirection,
  TaxMode,
  TimeRange,
  UnitSpan,
} from "./common";
import type { Block } from "./block";
import type { ShippingDeliveryEstimate } from "./shipping";
import type { PaymentTerms } from "./company";
import type { CheckoutPaymentAction } from "./payment";
import type {
  BillingPeriod,
  CustomerGroupDeliveryTerms,
  CustomerGroupOccurrence,
  CustomerGroupSnapshot,
  CustomerGroupStart,
} from "./customerGroup";
import type {
  FulfillmentTiming,
  LineDiscount,
  LineMoney,
  OrderBookingSnapshot,
  OrderDeliveryDestination,
  OrderProductSnapshot,
  OrderPromotion,
  OrderTaxGroup,
  OrderTimeRange,
  ProductMoneyRun,
} from "./order";

export type CartBuyer =
  | { type: "customer" }
  | { type: "company"; company_id: string; purchase_order_number: string | null }
  | { type: "company_location"; company_location_id: string; purchase_order_number: string | null }
  | { type: "company_location_selection"; company_id: string; purchase_order_number: string | null };

export type CartStatus =
  | { type: "active" }
  | { type: "abandoned" }
  | { type: "converted"; order_id: string }
  | { type: "superseded"; target_cart_id: string }
  | { type: "merged"; target_cart_id: string }
  | { type: "expired" };

export type CartOrigin =
  | { type: "storefront"; customer_session_id: string }
  | { type: "reorder"; customer_session_id: string; order_id: string }
  | { type: "account"; actor: AccountActor };

export interface PurchaseAccessGrantRef {
  order_id: string;
  order_purchase_access_line_item_id: string;
}

export type CartProductPurchase =
  | { type: "catalog" }
  | { type: "existing_purchase_access"; grant: PurchaseAccessGrantRef }
  | {
      type: "same_cart_purchase_access";
      cart_customer_group_line_item_id: string;
      entitlement_id: string;
    };

export interface ManualPrice {
  money: Money;
  reason: string;
  authorized_by: AccountActor;
  allow_promotions: boolean;
}

export interface ManualPriceInput {
  allow_promotions: boolean;
  currency: Currency;
  amount: number;
  reason: string;
}

export interface CartProductLineItem {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  form_submission_id: string | null;
  price_override: ManualPrice | null;
  purchase: CartProductPurchase;
}

export type CartTimeRange = TimeRange;

export interface CartBookingLineItem {
  id: string;
  booking_offering_id: string;
  requested_interval: CartTimeRange;
  capacity_units: number;
  form_submission_id: string | null;
  price_override: ManualPrice | null;
}

export type CartDeliveryDestination =
  | { type: "delivery"; address: PostalAddress }
  | { type: "pickup"; store_location_id: string };

export interface CartShipping {
  shipping_method_id: string;
  rate_id: string;
}

export interface CartCustomerGroupDelivery {
  id: string;
  entitlement_ids: string[];
  destination: CartDeliveryDestination;
  shipping: CartShipping | null;
}

export interface CartCustomerGroupLineItem {
  id: string;
  customer_group_id: string;
  start: CustomerGroupStart;
  deliveries: CartCustomerGroupDelivery[];
  price_override: ManualPrice | null;
}

export type CartLineItem =
  | ({ type: "product" } & CartProductLineItem)
  | ({ type: "booking" } & CartBookingLineItem)
  | ({ type: "customer_group" } & CartCustomerGroupLineItem);

export type CartLineItemType = CartLineItem["type"];

export type CartPhysicalLineRef =
  | { type: "product"; line_item_id: string }
  | { type: "customer_group_entitlement"; line_item_id: string; entitlement_id: string };

export interface CartDeliveryGroupItem {
  line_item: CartPhysicalLineRef;
  quantity: number;
}

export type CartDeliveryTiming =
  | { type: "asap" }
  | { type: "window"; from: EpochMilliseconds; to: EpochMilliseconds }
  | { type: "customer_group"; delivery_index: number };

export interface CartDeliveryGroup {
  id: string;
  items: CartDeliveryGroupItem[];
  destination: CartDeliveryDestination;
  shipping: CartShipping | null;
  timing: CartDeliveryTiming;
}

export type CartOfferStatus =
  | { type: "reviewed" }
  | { type: "sent"; by: AccountActor; at: EpochMilliseconds; language: string };

export type CartOfferLine =
  | { type: "item"; line_item_id: string; base_unit_price: number; rebate_per_unit: number }
  | { type: "customer_group"; line_item_id: string; group: CustomerGroupSnapshot; rebate_per_unit: number };

export interface CartOffer {
  reviewed_by: AccountActor;
  reviewed_at: EpochMilliseconds;
  lines: CartOfferLine[];
  supersedes_cart_id: string | null;
  status: CartOfferStatus;
}

export interface Cart {
  id: string;
  store_id: string;
  customer_id: string;
  buyer: CartBuyer;
  sales_channel_id: string;
  catalog_id: string;
  status: CartStatus;
  origin: CartOrigin;
  line_items: CartLineItem[];
  delivery_groups: CartDeliveryGroup[];
  billing_address: PostalAddress | null;
  promotion_code_ids: string[];
  offer: CartOffer | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CreatedCart =
  | { type: "created"; cart: Cart; recovery_token: string }
  | { type: "existing"; cart: Cart };

export interface ReorderLeftOutLine {
  order_line_item_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
}

export interface ReorderedCart {
  cart: CreatedCart;
  left_out: ReorderLeftOutLine[];
}

export type CartCatalogChoice =
  | { type: "catalog"; catalog_id: string }
  | { type: "market_public"; market_id: string };

export interface CartProductLineItemInput {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  form_submission_id?: string | null;
  price_override?: ManualPriceInput | null;
  purchase: CartProductPurchase;
}

export interface CartBookingLineItemInput {
  id: string;
  booking_offering_id: string;
  requested_interval: CartTimeRange;
  capacity_units: number;
  form_submission_id?: string | null;
  price_override?: ManualPriceInput | null;
}

export interface CartCustomerGroupLineItemInput {
  id: string;
  customer_group_id: string;
  start: CustomerGroupStart;
  deliveries?: CartCustomerGroupDelivery[];
  price_override?: ManualPriceInput | null;
}

export type CartLineItemInput =
  | ({ type: "product" } & CartProductLineItemInput)
  | ({ type: "booking" } & CartBookingLineItemInput)
  | ({ type: "customer_group" } & CartCustomerGroupLineItemInput);

export type StorefrontCartProductLineItemInput = Omit<CartProductLineItemInput, "price_override">;

export type StorefrontCartBookingLineItemInput = Omit<CartBookingLineItemInput, "price_override">;

export type StorefrontCartCustomerGroupLineItemInput = Omit<CartCustomerGroupLineItemInput, "price_override">;

export type StorefrontCartLineItemInput =
  | ({ type: "product" } & StorefrontCartProductLineItemInput)
  | ({ type: "booking" } & StorefrontCartBookingLineItemInput)
  | ({ type: "customer_group" } & StorefrontCartCustomerGroupLineItemInput);

export interface CartCustomerGroupDeliveries {
  cart_line_item_id: string;
  deliveries: CartCustomerGroupDelivery[];
}

export interface CustomerGroupDeliveryChoice {
  id: string;
  entitlement_ids: string[];
  destination: CartDeliveryDestination;
}

export interface CustomerGroupDeliveryChoices {
  cart_line_item_id: string;
  deliveries: CustomerGroupDeliveryChoice[];
}

export interface CustomerGroupDeliveryRateOffer {
  shipping_method_id: string;
  shipping_method_key: string;
  shipping_method_blocks: Block[];
  rate_id: string;
  base_fee: number | null;
  window_amounts: (number | null)[];
}

export interface CustomerGroupDeliveryOffer {
  id: string;
  destination: OrderDeliveryDestination;
  shipping_profile_id: string;
  windows: OrderTimeRange[];
  offers: CustomerGroupDeliveryRateOffer[];
}

export interface CustomerGroupDeliveryOffers {
  cart_line_item_id: string;
  occurrence: CustomerGroupOccurrence;
  deliveries: CustomerGroupDeliveryOffer[];
}

export interface QuotePurchaseLimit {
  limit_id: string;
  period: BillingPeriod;
  max_quantity: number;
  counted_quantity: number;
  order_quantity: number;
  fits: boolean;
}

export interface QuotePurchaseAccess {
  grant: PurchaseAccessGrantRef | null;
  customer_group_member_id: string | null;
  cart_customer_group_line_item_id: string | null;
  entitlement_id: string;
  catalog_id: string;
  starts_at: EpochMilliseconds;
  ends_at: EpochMilliseconds | null;
  limits: QuotePurchaseLimit[];
}

export type QuoteTaxWait = "no_delivery" | "no_billing_address";

export interface QuoteUntaxedRun {
  span: UnitSpan;
  unit_price: number;
  discounts: LineDiscount[];
  waiting_for: QuoteTaxWait;
}

export type QuoteMoney =
  | { type: "taxed"; money: LineMoney }
  | { type: "awaiting_tax"; unit_price: number; discounts: LineDiscount[]; waiting_for: QuoteTaxWait };

export interface CartAccessProductPreview {
  line_item_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  currency: Currency;
  access: QuotePurchaseAccess;
}

export interface QuoteProductLine {
  line_item_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  form_submission_id: string | null;
  purchase: CartProductPurchase;
  purchase_access: QuotePurchaseAccess | null;
  snapshot: OrderProductSnapshot;
  money_runs: ProductMoneyRun[];
  awaiting_tax: QuoteUntaxedRun[];
}

export type QuoteBookingAvailability =
  | { type: "available"; spots: number }
  | { type: "unavailable"; reason: string };

export interface QuoteBookingLine {
  line_item_id: string;
  booking_offering_id: string;
  booking_service_id: string;
  booking_resource_id: string;
  interval: OrderTimeRange;
  capacity_intervals: OrderTimeRange[];
  capacity_units: number;
  form_submission_id: string | null;
  reminder_offsets_minutes: number[];
  snapshot: OrderBookingSnapshot;
  money: QuoteMoney;
  availability: QuoteBookingAvailability;
}

export type QuoteEntitlementLine =
  | {
      type: "product";
      entitlement_id: string;
      product_id: string;
      variant_id: string;
      quantity: number;
      snapshot: OrderProductSnapshot;
      money_runs: ProductMoneyRun[];
      awaiting_tax: QuoteUntaxedRun[];
    }
  | {
      type: "rental";
      entitlement_id: string;
      product_id: string;
      variant_id: string;
      quantity: number;
      snapshot: OrderProductSnapshot;
      money: QuoteMoney;
    }
  | { type: "purchase_access"; entitlement_id: string; money: QuoteMoney };

export interface QuoteCustomerGroupLine {
  line_item_id: string;
  group: CustomerGroupSnapshot;
  start: CustomerGroupStart;
  occurrence: CustomerGroupOccurrence;
  entitlements: QuoteEntitlementLine[];
  tax_groups: OrderTaxGroup[];
  deliveries: CustomerGroupDeliveryTerms[];
}

export type QuoteLine =
  | ({ type: "product" } & QuoteProductLine)
  | ({ type: "booking" } & QuoteBookingLine)
  | ({ type: "customer_group" } & QuoteCustomerGroupLine);

export interface QuoteDeliveryItem {
  line_item: CartPhysicalLineRef;
  units: UnitSpan[];
}

export interface QuoteDeliveryRental {
  cart_line_item_id: string;
  entitlement_id: string;
}

export interface QuoteShippingOffer {
  shipping_method_id: string;
  shipping_method_key: string;
  shipping_method_blocks: Block[];
  rate_id: string;
  amount: number;
  free_shipping_applied: boolean;
  delivery_estimate: ShippingDeliveryEstimate | null;
}

export interface QuoteDelivery {
  delivery_group_id: string;
  destination: OrderDeliveryDestination;
  shipping_profile_id: string;
  items: QuoteDeliveryItem[];
  rental_entitlements: QuoteDeliveryRental[];
  timing: FulfillmentTiming;
  offers: QuoteShippingOffer[];
  shipping: CartShipping | null;
  delivery_estimate: ShippingDeliveryEstimate | null;
  money: LineMoney | null;
}

export type QuoteBlocker =
  | { type: "units_without_delivery"; line_item: CartPhysicalLineRef; quantity: number }
  | { type: "billing_address_required" }
  | { type: "shipping_required"; delivery_group_id: string }
  | { type: "booking_unavailable"; line_item_id: string; reason: string }
  | { type: "customer_group_delivery_required"; line_item_id: string; entitlement_id: string }
  | { type: "customer_group_shipping_required"; line_item_id: string; delivery_id: string }
  | { type: "customer_group_delivery_fee_varies"; line_item_id: string; delivery_id: string }
  | { type: "purchase_order_number_required" }
  | { type: "purchase_limit_exceeded"; line_item_id: string; limit_id: string };

export interface QuoteTotals {
  subtotal: number;
  delivery: number;
  discount: number;
  tax: number;
  total: number;
}

export interface CartQuote {
  cart_id: string | null;
  store_id: string;
  customer_id: string;
  buyer: CartBuyer;
  market_id: string;
  sales_channel_id: string;
  catalog_id: string;
  currency: Currency;
  tax_mode: TaxMode;
  language: string;
  lines: QuoteLine[];
  deliveries: QuoteDelivery[];
  promotions: OrderPromotion[];
  billing_address: PostalAddress | null;
  totals: QuoteTotals;
  payment_option_ids: string[];
  suggested_payment_option_id: string | null;
  blockers: QuoteBlocker[];
  ready: boolean;
  quoted_at: EpochMilliseconds;
  presentation_digest: string;
}

export type CheckoutPaymentChoice =
  | { type: "free" }
  | {
      type: "payment_option";
      payment_option_id: string;
      return_url: string | null;
      save_payment_method: boolean;
      payment_method_terms_version: string | null;
    }
  | { type: "on_account"; payment_option_id: string };

export interface CheckoutCartInput {
  order_id: string;
  cart_id: string;
  expected_updated_at: EpochMilliseconds;
  presentation_digest: string;
  language: string;
  contact_email: string | null;
  payment: CheckoutPaymentChoice;
}

export interface StorefrontCheckoutCartInput {
  order_id: string;
  cart_id: string;
  expected_updated_at: EpochMilliseconds;
  presentation_digest: string;
  contact_email: string | null;
  payment: CheckoutPaymentChoice;
}

export interface CheckoutCartOnAccountInput {
  order_id: string;
  cart_id: string;
  expected_updated_at: EpochMilliseconds;
  presentation_digest: string;
  language: string;
  contact_email: string | null;
  payment_option_id: string;
  terms: PaymentTerms;
  reason: string;
}

export type CheckoutAcceptance =
  | {
      type: "placed";
      order_id: string;
      number: string;
      payment_id: string | null;
      payment_action: CheckoutPaymentAction;
    }
  | { type: "already_member"; customer_group_member_id: string };

export type CartStatusFilter = CartStatus["type"];

export type CartOriginFilter = CartOrigin["type"];

export interface CreateCartParams {
  store_id: string;
  id: string;
  customer_id: string;
  buyer: CartBuyer;
  sales_channel_id: string;
  catalog: CartCatalogChoice;
  line_items?: CartLineItemInput[];
  delivery_groups?: CartDeliveryGroup[];
  billing_address?: PostalAddress | null;
  promotion_codes?: string[];
}

export interface UpdateCartParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  buyer?: CartBuyer;
  sales_channel_id?: string;
  catalog?: CartCatalogChoice;
  line_items?: CartLineItemInput[];
  delivery_groups?: CartDeliveryGroup[];
  billing_address?: PostalAddress | null;
  promotion_codes?: string[];
}

export interface GetCartParams {
  store_id: string;
  id: string;
}

export interface FindCartsParams {
  store_id: string;
  customer_id?: string;
  statuses?: CartStatusFilter[];
  origins?: CartOriginFilter[];
  has_offer?: boolean;
  has_items?: boolean;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface AddCartProductParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  product: CartProductLineItemInput;
}

export interface AddCartBookingParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  booking: CartBookingLineItemInput;
}

export interface AddCartCustomerGroupParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  customer_group: CartCustomerGroupLineItemInput;
}

export interface RemoveCartItemParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  line_item_id: string;
}

export interface ClearCartParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface SelectCartShippingMethodParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  shipping_method_id: string;
}

export interface SetCartFutureDeliveriesParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  customer_groups: CartCustomerGroupDeliveries[];
}

export interface QuoteCartFutureDeliveriesParams {
  store_id: string;
  id: string;
  language: string;
  customer_groups: CustomerGroupDeliveryChoices[];
}

export interface PreviewCartAccessProductParams {
  store_id: string;
  id: string;
  language: string;
  line_item_id: string;
  variant_id: string;
  quantity: number;
  purchase: CartProductPurchase;
}

export interface QuoteCartParams {
  store_id: string;
  id: string;
  language: string;
}

export interface QuotePurchaseParams {
  store_id: string;
  language: string;
  customer_id: string;
  buyer: CartBuyer;
  sales_channel_id: string;
  catalog: CartCatalogChoice;
  line_items: CartLineItemInput[];
  delivery_groups: CartDeliveryGroup[];
  billing_address: PostalAddress | null;
  promotion_codes: string[];
}

export interface CreateCartOfferParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  language: string;
  presentation_digest: string;
  supersedes_cart_id: string | null;
}

export interface SendCartOfferParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  language: string;
}

export interface WithdrawCartOfferParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CheckoutCartParams extends CheckoutCartInput {
  store_id: string;
}

export interface CheckoutCartOnAccountParams extends CheckoutCartOnAccountInput {
  store_id: string;
}

export interface GetOrderPaymentActionParams {
  store_id: string;
  order_id: string;
}

export interface StorefrontCartTarget {
  id: string;
  token?: string | null;
}

export interface StorefrontCreateCartParams {
  id: string;
  buyer: CartBuyer;
  catalog_id: string | null;
}

export interface StorefrontCurrentCartParams {
  buyer?: CartBuyer;
  catalog_id?: string | null;
}

export type StorefrontGetCartParams = StorefrontCartTarget;

export interface StorefrontUpdateCartParams extends StorefrontCartTarget {
  expected_updated_at: EpochMilliseconds;
  buyer?: CartBuyer;
  catalog?: CartCatalogChoice;
  line_items?: StorefrontCartLineItemInput[];
  delivery_groups?: CartDeliveryGroup[];
  billing_address?: PostalAddress | null;
  promotion_codes?: string[];
}

export interface StorefrontAddCartProductParams extends StorefrontCartTarget {
  expected_updated_at: EpochMilliseconds;
  product: StorefrontCartProductLineItemInput;
}

export interface StorefrontAddCartBookingParams extends StorefrontCartTarget {
  expected_updated_at: EpochMilliseconds;
  booking: StorefrontCartBookingLineItemInput;
}

export interface StorefrontAddCartCustomerGroupParams extends StorefrontCartTarget {
  expected_updated_at: EpochMilliseconds;
  customer_group: StorefrontCartCustomerGroupLineItemInput;
}

export interface StorefrontRemoveCartItemParams extends StorefrontCartTarget {
  expected_updated_at: EpochMilliseconds;
  line_item_id: string;
}

export interface StorefrontClearCartParams extends StorefrontCartTarget {
  expected_updated_at: EpochMilliseconds;
}

export interface StorefrontSelectCartShippingMethodParams extends StorefrontCartTarget {
  expected_updated_at: EpochMilliseconds;
  shipping_method_id: string;
}

export interface StorefrontSetCartFutureDeliveriesParams extends StorefrontCartTarget {
  expected_updated_at: EpochMilliseconds;
  customer_groups: CartCustomerGroupDeliveries[];
}

export interface StorefrontQuoteCartFutureDeliveriesParams extends StorefrontCartTarget {
  customer_groups: CustomerGroupDeliveryChoices[];
}

export interface StorefrontPreviewCartAccessProductParams extends StorefrontCartTarget {
  line_item_id: string;
  variant_id: string;
  quantity: number;
  purchase: CartProductPurchase;
}

export type StorefrontQuoteCartParams = StorefrontCartTarget;

export interface StorefrontCheckoutCartParams extends StorefrontCheckoutCartInput {
  token?: string | null;
}

export interface StorefrontReorderParams {
  id: string;
  order_id: string;
  buyer: CartBuyer;
}

export type FindStorefrontCartOffersParams = (
  | { company_id: string; company_location_id?: never }
  | { company_id?: never; company_location_id: string }
) & {
  limit?: number;
  cursor?: string | null;
};

export function cartProductItems(cart: Pick<Cart, "line_items"> | null): CartProductLineItem[] {
  return (cart?.line_items ?? [])
    .filter((item): item is CartLineItem & { type: "product" } => item.type === "product")
    .map(({ type: _type, ...item }) => item);
}

export function cartBookingItems(cart: Pick<Cart, "line_items"> | null): CartBookingLineItem[] {
  return (cart?.line_items ?? [])
    .filter((item): item is CartLineItem & { type: "booking" } => item.type === "booking")
    .map(({ type: _type, ...item }) => item);
}

export function cartCustomerGroupItems(cart: Pick<Cart, "line_items"> | null): CartCustomerGroupLineItem[] {
  return (cart?.line_items ?? [])
    .filter((item): item is CartLineItem & { type: "customer_group" } => item.type === "customer_group")
    .map(({ type: _type, ...item }) => item);
}
