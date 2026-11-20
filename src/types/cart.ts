import type { OrderContactName } from "./order";
import type { EpochMilliseconds } from "./time";
import type {
  AccountActor,
  Currency,
  EmailContact,
  PostalAddress,
  SortDirection,
  TaxMode,
  TimeRange,
  UnitSpan,
} from "./common";
import type { Block } from "./block";
import type { OrderDeliveryEstimate } from "./shipping";
import type { PaymentTerms } from "./company";
import type {
  CheckoutPaymentAction,
  PaymentMethodSetupStart,
  StorefrontPaymentMethodSetupStart,
} from "./payment";
import type { PackagePriceRef } from "./package";
import type {
  PackageDeliveryTerms,
  PackageOccurrence,
  PackageProductChoice,
  PackageSelfSnapshot,
  PackageSnapshot,
  PackageStart,
} from "./packageMember";
import type {
  BookingLineSession,
  DeliveryMoney,
  LineDiscount,
  LineMoney,
  OrderBookingLineAddOnPrice,
  OrderBookingLinePrice,
  OrderDeliveryDestination,
  OrderDeliveryTiming,
  OrderProductSnapshot,
  OrderPromotion,
  ProductMoneyRun,
} from "./order";
import type { ProductReference } from "./product";
import type { DocumentItem } from "./invoice";

export type CartBuyer =
  | { type: "customer" }
  | { type: "company"; company_id: string; purchase_order_number: string | null }
  | { type: "company_location"; company_location_id: string; purchase_order_number: string | null }
  | { type: "company_location_selection"; company_id: string; purchase_order_number: string | null };

export type CartPlaceOfSale =
  | { type: "none" }
  | { type: "store_location"; store_location_id: string };

export type CartStatus =
  | { type: "active" }
  | { type: "abandoned" }
  | { type: "converted" }
  | { type: "superseded" }
  | { type: "merged"; target_cart_id: string }
  | { type: "expired" };

export type CartOrigin =
  | { type: "storefront"; customer_session_id: string }
  | { type: "reorder"; customer_session_id: string; order_id: string }
  | { type: "account"; actor: AccountActor }
  | { type: "assistant"; conversation_message_id: string };

export interface CartProductLineItem {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  form_submission_id: string | null;
  price: PackagePriceRef;
}

export type CartBookingLineResource = { type: "any" } | { type: "resource"; booking_resource_id: string };

export type CartBookingLineAddOnResource = { type: "any" } | { type: "resource"; booking_resource_id: string };

export interface CartBookingLineAddOn {
  add_on_id: string;
  booking_offering_id: string;
  resource: CartBookingLineAddOnResource;
  form_submission_id: string | null;
  add_ons: CartBookingLineAddOn[];
}

export interface CartBookingLineItem {
  id: string;
  booking_offering_id: string;
  store_location_id: string;
  resource: CartBookingLineResource;
  requested_interval: TimeRange;
  add_ons: CartBookingLineAddOn[];
  capacity_units: number;
  form_submission_id: string | null;
  price: PackagePriceRef;
  session: BookingLineSession | null;
}

export type CartDeliveryDestination =
  | { type: "delivery"; address: PostalAddress }
  | { type: "pickup"; store_location_id: string };

export interface CartShipping {
  shipping_method_id: string;
  rate_id: string;
}

export interface CartPackageDelivery {
  id: string;
  package_item_ids: string[];
  destination: CartDeliveryDestination;
  shipping: CartShipping | null;
}

export interface CartPackageLineItem {
  id: string;
  package_id: string;
  quantity: number;
  choices: PackageProductChoice[];
  start: PackageStart;
  deliveries: CartPackageDelivery[];
  price: PackagePriceRef;
}

export type CartLineItem =
  | ({ type: "product" } & CartProductLineItem)
  | ({ type: "booking" } & CartBookingLineItem)
  | ({ type: "package" } & CartPackageLineItem);

export type CartPhysicalLineRef =
  | { type: "product"; line_item_id: string }
  | { type: "package_item"; line_item_id: string; package_item_id: string };

export interface CartDeliveryGroupItem {
  line_item: CartPhysicalLineRef;
  quantity: number;
}

export type CartDeliveryTiming =
  | { type: "asap" }
  | { type: "window"; from: EpochMilliseconds; to: EpochMilliseconds }
  | { type: "package"; delivery_index: number };

export interface CartDeliveryGroup {
  id: string;
  items: CartDeliveryGroupItem[];
  destination: CartDeliveryDestination;
  shipping: CartShipping | null;
  timing: CartDeliveryTiming;
}

export type CartOfferStatus =
  | { type: "reviewed" }
  | {
      type: "sent";
      by: AccountActor;
      at: EpochMilliseconds;
      expires_at: EpochMilliseconds | null;
      note: string | null;
    };

export type CartOfferLine =
  | { type: "item"; line_item_id: string; base_unit_price: number; rebate_per_unit: number }
  | { type: "package"; line_item_id: string; package: PackageSnapshot; rebate_per_unit: number };

export interface CartOffer {
  contact: EmailContact;
  reviewed_by: AccountActor;
  reviewed_at: EpochMilliseconds;
  lines: CartOfferLine[];
  supersedes_cart_id: string | null;
  status: CartOfferStatus;
}

export interface Cart {
  id: string;
  blocks: Block[];
  store_id: string;
  customer_id: string;
  buyer: CartBuyer;
  sales_channel_id: string;
  package_id: string;
  market_id: string;
  place_of_sale: CartPlaceOfSale;
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
  variant_id: string;
  quantity: number;
}

export interface ReorderedCart {
  cart: CreatedCart;
  left_out: ReorderLeftOutLine[];
}

export type StorefrontCartOrigin =
  | { type: "storefront" }
  | { type: "reorder"; order_id: string }
  | { type: "account" }
  | { type: "assistant" };

export type StorefrontPackageStart =
  | { type: "on_acceptance" }
  | { type: "scheduled"; starts_at: EpochMilliseconds }
  | { type: "switch"; package_member_id: string }
  | {
      type: "amend";
      package_member_id: string;
      expected_updated_at: EpochMilliseconds;
    };

export interface StorefrontCartPackageLineItem {
  id: string;
  package_id: string;
  quantity: number;
  choices: PackageProductChoice[];
  start: StorefrontPackageStart;
  deliveries: CartPackageDelivery[];
  price: PackagePriceRef;
}

export type StorefrontCartLineItem =
  | ({ type: "product" } & CartProductLineItem)
  | ({ type: "booking" } & CartBookingLineItem)
  | ({ type: "package" } & StorefrontCartPackageLineItem);

export type StorefrontCartOfferStatus =
  | { type: "reviewed" }
  | {
      type: "sent";
      at: EpochMilliseconds;
      expires_at: EpochMilliseconds | null;
      note: string | null;
    };

export type StorefrontCartOfferLine =
  | { type: "item"; line_item_id: string; base_unit_price: number; rebate_per_unit: number }
  | { type: "package"; line_item_id: string; package: PackageSelfSnapshot; rebate_per_unit: number };

export interface StorefrontCartOffer {
  contact: EmailContact;
  reviewed_at: EpochMilliseconds;
  lines: StorefrontCartOfferLine[];
  supersedes_cart_id: string | null;
  status: StorefrontCartOfferStatus;
}

export interface StorefrontCart {
  id: string;
  blocks: Block[];
  store_id: string;
  customer_id: string;
  buyer: CartBuyer;
  sales_channel_id: string;
  package_id: string;
  market_id: string;
  place_of_sale: CartPlaceOfSale;
  status: CartStatus;
  origin: StorefrontCartOrigin;
  line_items: StorefrontCartLineItem[];
  delivery_groups: CartDeliveryGroup[];
  billing_address: PostalAddress | null;
  promotion_code_ids: string[];
  offer: StorefrontCartOffer | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StorefrontCreatedCart =
  | { type: "created"; cart: StorefrontCart; recovery_token: string }
  | { type: "existing"; cart: StorefrontCart };

export interface StorefrontReorderedCart {
  cart: StorefrontCreatedCart;
  left_out: ReorderLeftOutLine[];
}

export interface CartProductLineItemInput {
  id: string;
  variant_id: string;
  quantity: number;
  form_submission_id?: string | null;
  price: PackagePriceRef;
}

export interface CartBookingLineAddOnInput {
  add_on_id: string;
  resource: CartBookingLineAddOnResource;
  form_submission_id?: string | null;
  add_ons: CartBookingLineAddOnInput[];
}

export interface CartBookingLineItemInput {
  id: string;
  booking_offering_id: string;
  store_location_id: string;
  resource: CartBookingLineResource;
  requested_interval: TimeRange;
  add_ons: CartBookingLineAddOnInput[];
  capacity_units: number;
  form_submission_id?: string | null;
  price: PackagePriceRef;
  session?: BookingLineSession | null;
}

export interface CartPackageLineItemInput {
  id: string;
  package_id: string;
  quantity: number;
  choices: PackageProductChoice[];
  start: PackageStart;
  deliveries?: CartPackageDelivery[];
  price: PackagePriceRef;
}

export type CartLineItemInput =
  | ({ type: "product" } & CartProductLineItemInput)
  | ({ type: "booking" } & CartBookingLineItemInput)
  | ({ type: "package" } & CartPackageLineItemInput);

export interface CartPackageDeliveries {
  cart_line_item_id: string;
  deliveries: CartPackageDelivery[];
}

export interface PackageDeliveryChoice {
  id: string;
  package_item_ids: string[];
  destination: CartDeliveryDestination;
}

export interface PackageDeliveryChoices {
  cart_line_item_id: string;
  deliveries: PackageDeliveryChoice[];
}

export interface PackageDeliveryRateOffer {
  shipping_method_id: string;
  shipping_method_key: string;
  shipping_method_blocks: Block[];
  rate_id: string;
  base_fee: number | null;
  window_amounts: (number | null)[];
}

export interface PackageDeliveryOffer {
  id: string;
  destination: OrderDeliveryDestination;
  shipping_profile_id: string;
  windows: TimeRange[];
  offers: PackageDeliveryRateOffer[];
}

export interface PackageDeliveryOffers {
  cart_line_item_id: string;
  occurrence: PackageOccurrence;
  deliveries: PackageDeliveryOffer[];
}

export type QuoteTaxWait = "no_delivery" | "no_billing_address" | "fixed_above_price";

export interface QuoteUntaxedRun {
  span: UnitSpan;
  unit_price: number;
  discounts: LineDiscount[];
  waiting_for: QuoteTaxWait;
}

export type QuoteMoney =
  | { type: "taxed"; money: LineMoney }
  | { type: "awaiting_tax"; unit_price: number; discounts: LineDiscount[]; waiting_for: QuoteTaxWait };

export interface QuoteLineTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export interface QuoteShippingChoice {
  shipping_method_id: string;
  amount: number;
}

export interface QuoteProductLine {
  line_item_id: string;
  product_id: string;
  product: ProductReference;
  variant_id: string;
  shipping_profile_id: string | null;
  quantity: number;
  form_submission_id: string | null;
  price: PackagePriceRef;
  compare_at: number | null;
  snapshot: OrderProductSnapshot;
  money_runs: ProductMoneyRun[];
  awaiting_tax: QuoteUntaxedRun[];
  totals: QuoteLineTotals;
}

export interface QuoteBookingPlanAddOn {
  add_on_id: string;
  booking_offering_id: string;
  booking_service_id: string;
  booking_resource_id: string;
  service_key: string;
  resource_key: string;
  interval: TimeRange;
  capacity_intervals: TimeRange[];
  add_ons: QuoteBookingPlanAddOn[];
}

export interface QuoteBookingPlan {
  booking_resource_id: string;
  resource_key: string;
  timezone: string;
  interval: TimeRange;
  total_interval: TimeRange;
  capacity_intervals: TimeRange[];
  add_ons: QuoteBookingPlanAddOn[];
}

export type QuoteBookingAvailability =
  | { type: "available"; spots: number; plan: QuoteBookingPlan }
  | { type: "history"; plan: QuoteBookingPlan }
  | { type: "unavailable"; code: string };

export interface QuoteBookingAddOn {
  add_on_id: string;
  booking_offering_id: string;
  resource: CartBookingLineAddOnResource;
  form_submission_id: string | null;
  price: OrderBookingLineAddOnPrice;
  add_ons: QuoteBookingAddOn[];
}

export interface QuoteBookingLine {
  line_item_id: string;
  booking_offering_id: string;
  booking_service_id: string;
  store_location_id: string;
  resource: CartBookingLineResource;
  requested_interval: TimeRange;
  add_ons: QuoteBookingAddOn[];
  capacity_units: number;
  form_submission_id: string | null;
  service_key: string;
  price: OrderBookingLinePrice;
  document_item: DocumentItem;
  money: QuoteMoney;
  totals: QuoteLineTotals;
  availability: QuoteBookingAvailability;
  session: BookingLineSession | null;
}

export type QuotePackageItemLine =
  | {
      type: "get_product";
      package_item_id: string;
      product_id: string;
      variant_id: string;
      quantity: number;
      snapshot: OrderProductSnapshot;
      money_runs: ProductMoneyRun[];
      awaiting_tax: QuoteUntaxedRun[];
      totals: QuoteLineTotals;
    }
  | {
      type: "rent_product";
      package_item_id: string;
      product_id: string;
      product: ProductReference;
      variant_id: string;
      quantity: number;
      snapshot: OrderProductSnapshot;
      money: QuoteMoney;
      totals: QuoteLineTotals;
    };

export interface QuoteRentalChangeItem {
  package_item_id: string;
  rental_id: string | null;
  kept_quantity: number;
  shipped_quantity: number;
}

export interface QuoteRentalChangeEnding {
  rental_id: string;
  returned_quantity: number;
}

export interface QuoteRentalChange {
  items: QuoteRentalChangeItem[];
  ending: QuoteRentalChangeEnding[];
}

export interface QuotePackageLine {
  line_item_id: string;
  package: PackageSnapshot;
  start: PackageStart;
  occurrence: PackageOccurrence;
  items: QuotePackageItemLine[];
  totals: QuoteLineTotals;
  deliveries: PackageDeliveryTerms[];
  saves_card: boolean;
  rental_change: QuoteRentalChange | null;
}

export type QuoteLine =
  | ({ type: "product" } & QuoteProductLine)
  | ({ type: "booking" } & QuoteBookingLine)
  | ({ type: "package" } & QuotePackageLine);

export interface QuoteDeliveryItem {
  line_item: CartPhysicalLineRef;
  units: UnitSpan[];
}

export interface QuoteDeliveryRental {
  cart_line_item_id: string;
  package_item_id: string;
}

export interface QuoteShippingOffer {
  shipping_method_id: string;
  shipping_method_key: string;
  shipping_method_blocks: Block[];
  rate_id: string;
  amount: number;
  free_shipping_applied: boolean;
  delivery_estimate: OrderDeliveryEstimate | null;
}

export interface UnavailableShippingRate {
  shipping_method_id: string;
  rate_id: string;
  code: string;
}

export interface QuoteDelivery {
  delivery_group_id: string;
  destination: OrderDeliveryDestination;
  shipping_profile_id: string;
  items: QuoteDeliveryItem[];
  rental_items: QuoteDeliveryRental[];
  timing: OrderDeliveryTiming;
  offers: QuoteShippingOffer[];
  unavailable: UnavailableShippingRate[];
  shipping: CartShipping | null;
  delivery_estimate: OrderDeliveryEstimate | null;
  money: DeliveryMoney | null;
  totals: QuoteLineTotals | null;
}

export type QuoteBlocker =
  | { type: "units_without_delivery"; line_item: CartPhysicalLineRef; quantity: number }
  | { type: "billing_address_required" }
  | { type: "shipping_required"; delivery_group_id: string }
  | { type: "booking_unavailable"; line_item_id: string; code: string }
  | { type: "booking_session"; line_item_id: string; code: string }
  | { type: "tax_unavailable"; line_item_id: string; code: string }
  | { type: "delivery_unavailable"; delivery_group_id: string; code: string }
  | { type: "package_delivery_required"; line_item_id: string; package_item_id: string }
  | { type: "package_shipping_required"; line_item_id: string; delivery_id: string }
  | { type: "package_delivery_fee_varies"; line_item_id: string; delivery_id: string }
  | { type: "package_minimum_conflict"; line_item_id: string }
  | { type: "package_change_scheduled"; line_item_id: string }
  | { type: "package_change_refused"; line_item_id: string; code: string }
  | { type: "payment_unavailable"; code: string }
  | { type: "purchase_order_number_required" }
  | {
      type: "shipping_rate_unavailable";
      delivery_group_id: string;
      shipping_method_id: string;
      rate_id: string;
      code: string;
    }
  | {
      type: "package_shipping_rate_unavailable";
      line_item_id: string;
      delivery_id: string;
      shipping_method_id: string;
      rate_id: string;
      code: string;
    }
  | { type: "place_of_sale_required" }
  | { type: "place_of_sale_not_active"; store_location_id: string }
  | { type: "place_of_sale_jurisdiction"; line_item_id: string }
  | { type: "delivery_place_of_sale_jurisdiction"; delivery_group_id: string }
  | { type: "document_unavailable"; line_item_id: string; code: string }
  | { type: "package_document_unavailable"; line_item_id: string; package_item_id: string; code: string }
  | { type: "delivery_document_unavailable"; delivery_group_id: string; code: string }
  | { type: "documents_unavailable"; code: string }
  | { type: "fiscal_buyer_tax_id_required" };

export interface QuoteTotals {
  subtotal: number;
  delivery: number;
  discount: number;
  tax: number;
  total: number;
}

export type QuotePromotionCodeState = "applied" | "stopped" | "not_applied";

export interface QuotePromotionCode {
  promotion_code_id: string;
  code: string;
  promotion_id: string;
  state: QuotePromotionCodeState;
}

export interface CartQuote {
  cart_id: string | null;
  store_id: string;
  customer_id: string;
  buyer: CartBuyer;
  market_id: string;
  place_of_sale: CartPlaceOfSale;
  sales_channel_id: string;
  package_id: string;
  currency: Currency;
  tax_mode: TaxMode;
  language: string;
  lines: QuoteLine[];
  deliveries: QuoteDelivery[];
  shipping_choices: QuoteShippingChoice[];
  promotions: OrderPromotion[];
  promotion_codes: QuotePromotionCode[];
  billing_address: PostalAddress | null;
  totals: QuoteTotals;
  payment_option_ids: string[];
  suggested_payment_option_id: string | null;
  blockers: QuoteBlocker[];
  ready: boolean;
  quoted_at: EpochMilliseconds;
  presentation_digest: string;
}

export interface StorefrontQuotePackageLine {
  line_item_id: string;
  package: PackageSelfSnapshot;
  start: StorefrontPackageStart;
  occurrence: PackageOccurrence;
  items: QuotePackageItemLine[];
  totals: QuoteLineTotals;
  deliveries: PackageDeliveryTerms[];
  saves_card: boolean;
  rental_change: QuoteRentalChange | null;
}

export type StorefrontQuoteLine =
  | ({ type: "product" } & QuoteProductLine)
  | ({ type: "booking" } & QuoteBookingLine)
  | ({ type: "package" } & StorefrontQuotePackageLine);

export interface StorefrontCartQuote {
  cart_id: string | null;
  store_id: string;
  customer_id: string;
  buyer: CartBuyer;
  market_id: string;
  place_of_sale: CartPlaceOfSale;
  sales_channel_id: string;
  package_id: string;
  currency: Currency;
  tax_mode: TaxMode;
  language: string;
  lines: StorefrontQuoteLine[];
  deliveries: QuoteDelivery[];
  shipping_choices: QuoteShippingChoice[];
  promotions: OrderPromotion[];
  promotion_codes: QuotePromotionCode[];
  billing_address: PostalAddress | null;
  totals: QuoteTotals;
  payment_option_ids: string[];
  suggested_payment_option_id: string | null;
  blockers: QuoteBlocker[];
  ready: boolean;
  quoted_at: EpochMilliseconds;
  presentation_digest: string;
}

export type CheckoutSavePaymentMethod = { type: "dont_save" } | { type: "save"; terms: string };

export type CheckoutPaymentChoice =
  | { type: "free" }
  | {
      type: "payment_option";
      payment_option_id: string;
      return_url: string | null;
      save_payment_method: CheckoutSavePaymentMethod;
    }
  | { type: "on_account"; payment_option_id: string };

export interface CheckoutCartInput {
  order_token: string;
  order_id: string;
  cart_id: string;
  expected_updated_at: EpochMilliseconds;
  presentation_digest: string;
  language: string;
  contact_email: EmailContact | null;
  contact_name?: OrderContactName | null;
  payment: CheckoutPaymentChoice;
}

export interface StorefrontCheckoutCartInput {
  order_token: string;
  order_id: string;
  cart_id: string;
  expected_updated_at: EpochMilliseconds;
  presentation_digest: string;
  contact_email: EmailContact | null;
  contact_name?: OrderContactName | null;
  payment: CheckoutPaymentChoice;
}

export interface CheckoutCartOnAccountInput {
  order_token: string;
  order_id: string;
  cart_id: string;
  expected_updated_at: EpochMilliseconds;
  presentation_digest: string;
  language: string;
  contact_email: EmailContact | null;
  contact_name?: OrderContactName | null;
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
      payment_method_id: string | null;
      payment_method_setup: PaymentMethodSetupStart | null;
    }
  | { type: "already_member"; package_member_id: string };

export type StorefrontCheckoutAcceptance =
  | {
      type: "placed";
      order_id: string;
      number: string;
      payment_id: string | null;
      payment_action: CheckoutPaymentAction;
      payment_method_id: string | null;
      payment_method_setup: StorefrontPaymentMethodSetupStart | null;
    }
  | { type: "already_member"; package_member_id: string };

export type CartStatusFilter = CartStatus["type"];

export type CartOriginFilter = CartOrigin["type"];

export interface CreateCartParams {
  store_id: string;
  id: string;
  customer_id: string;
  buyer: CartBuyer;
  sales_channel_id: string;
  package_id: string;
  market_id: string;
  place_of_sale?: CartPlaceOfSale;
  blocks?: Block[];
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
  package_id?: string;
  market_id?: string;
  place_of_sale?: CartPlaceOfSale;
  blocks?: Block[];
  line_items?: CartLineItemInput[];
  delivery_groups?: CartDeliveryGroup[];
  billing_address?: PostalAddress | null;
  promotion_codes?: string[];
}

export interface GetCartParams {
  store_id: string;
  id: string;
}

export interface GetCartOrderParams {
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

export interface AddCartPackageParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  package: CartPackageLineItemInput;
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
  packages: CartPackageDeliveries[];
}

export interface QuoteCartFutureDeliveriesParams {
  store_id: string;
  id: string;
  language: string;
  packages: PackageDeliveryChoices[];
}

export interface QuoteCartParams {
  contact_email?: string;
  store_id: string;
  id: string;
  language: string;
}

export interface QuotePurchaseParams {
  contact_email?: string;
  store_id: string;
  language: string;
  customer_id: string;
  buyer: CartBuyer;
  sales_channel_id: string;
  package_id: string;
  market_id: string;
  place_of_sale?: CartPlaceOfSale;
  line_items: CartLineItemInput[];
  delivery_groups: CartDeliveryGroup[];
  billing_address: PostalAddress | null;
  promotion_codes: string[];
}

export interface CreateCartOfferParams {
  store_id: string;
  id: string;
  contact: EmailContact;
  expected_updated_at: EpochMilliseconds;
  language: string;
  presentation_digest: string;
  supersedes_cart_id: string | null;
}

export interface QuoteCartOfferParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  language: string;
}

export interface SendCartOfferParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  expires_at: EpochMilliseconds | null;
  note: string | null;
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

export interface StorefrontCartTarget {
  id: string;
  token?: string | null;
}

export interface StorefrontCreateCartParams {
  id: string;
  buyer: CartBuyer;
  package_id: string;
  place_of_sale?: CartPlaceOfSale;
}

export interface StorefrontCurrentCartParams {
  buyer?: CartBuyer;
  package_id: string;
}

export type StorefrontGetCartParams = StorefrontCartTarget;

export interface StorefrontGetCartOrderParams {
  id: string;
}

export interface StorefrontUpdateCartParams extends StorefrontCartTarget {
  expected_updated_at: EpochMilliseconds;
  buyer?: CartBuyer;
  package_id?: string;
  market_id?: string;
  place_of_sale?: CartPlaceOfSale;
  blocks?: Block[];
  line_items?: CartLineItemInput[];
  delivery_groups?: CartDeliveryGroup[];
  billing_address?: PostalAddress | null;
  promotion_codes?: string[];
}

export interface StorefrontAddCartProductParams extends StorefrontCartTarget {
  expected_updated_at: EpochMilliseconds;
  product: CartProductLineItemInput;
}

export interface StorefrontAddCartBookingParams extends StorefrontCartTarget {
  expected_updated_at: EpochMilliseconds;
  booking: CartBookingLineItemInput;
}

export interface StorefrontAddCartPackageParams extends StorefrontCartTarget {
  expected_updated_at: EpochMilliseconds;
  package: CartPackageLineItemInput;
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
  packages: CartPackageDeliveries[];
}

export interface StorefrontQuoteCartFutureDeliveriesParams extends StorefrontCartTarget {
  packages: PackageDeliveryChoices[];
}

export type StorefrontQuoteCartParams = StorefrontCartTarget & { contact_email?: string };

export interface StorefrontCheckoutCartParams extends StorefrontCheckoutCartInput {
  token?: string | null;
  scope?: StorefrontCurrentCartParams;
}

export interface StorefrontKeptCheckoutParams {
  scope?: StorefrontCurrentCartParams;
}

export interface StorefrontReorderParams {
  id: string;
  order_id: string;
  buyer: CartBuyer;
  package_id: string;
  place_of_sale?: CartPlaceOfSale;
}

export type FindStorefrontCartOffersParams = (
  | { company_id: string; company_location_id?: never }
  | { company_id?: never; company_location_id: string }
) & {
  limit?: number;
  cursor?: string | null;
};

export function cartProductItems(
  cart: { line_items: readonly (CartLineItem | StorefrontCartLineItem)[] } | null,
): CartProductLineItem[] {
  return (cart?.line_items ?? [])
    .filter(
      (item): item is CartLineItem & { type: "product" } => item.type === "product",
    )
    .map(({ type: _type, ...item }) => item);
}

export function cartBookingItems(
  cart: { line_items: readonly (CartLineItem | StorefrontCartLineItem)[] } | null,
): CartBookingLineItem[] {
  return (cart?.line_items ?? [])
    .filter(
      (item): item is CartLineItem & { type: "booking" } => item.type === "booking",
    )
    .map(({ type: _type, ...item }) => item);
}

export function cartPackageItems<L extends CartLineItem | StorefrontCartLineItem>(
  cart: { line_items: readonly L[] } | null,
): Omit<Extract<L, { type: "package" }>, "type">[] {
  return (cart?.line_items ?? [])
    .filter((item): item is Extract<L, { type: "package" }> => item.type === "package")
    .map(({ type: _type, ...item }) => item);
}
