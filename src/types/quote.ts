import type { SubscriptionSubject } from "./subscription";
import type {
  Block,
  LineMoneySnapshot,
  OrderBookingSnapshot,
  OrderDigitalSnapshot,
  OrderMoney,
  OrderProductSnapshot,
  TimeRange,
} from "./index";
import type {
  AcceptedDeliveryPricing,
  OrderDeliveryDestinationSnapshot,
  OrderInvoicePolicy,
  UnitSpan,
  SellerSnapshot,
} from "./orderContract";
import type {
  SubscriptionAcceptedTerms,
  SubscriptionPurchaseOccurrence,
  PurchaseQuoteContext,
} from "./commerce";
import type {
  CartDeliveryRentalAssignment,
  CartDeliveryUnitAssignment,
} from "./api";
import type { EpochMilliseconds } from "./time";
import type { AppliedPriceSnapshot } from "./commerce";
import type { ProductMoneyTotals } from "./orderMoney";
import type { PaymentTerms } from "./paymentTerms";

export interface CheckoutProductSnapshot extends Omit<
  OrderProductSnapshot,
  "price"
> {
  price: AppliedPriceSnapshot;
}

export type CheckoutBookingSnapshot = OrderBookingSnapshot;

export interface CheckoutDigitalSnapshot extends Omit<
  OrderDigitalSnapshot,
  "price"
> {
  price: AppliedPriceSnapshot;
}

export interface QuotedProductMoneyRun {
  span: UnitSpan;
  delivery_group_id: string | null;
  per_unit: LineMoneySnapshot;
}

export type BookingQuoteLineAvailability =
  | { type: "available"; spots: number }
  | { type: "unavailable"; reason: string };

export interface ProductQuoteLine {
  line_item_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  money: ProductMoneyTotals;
  money_runs: QuotedProductMoneyRun[];
  snapshot: CheckoutProductSnapshot;
}

export interface BookingQuoteLine {
  line_item_id: string;
  booking_offering_id: string;
  booking_service_id: string;
  booking_resource_id: string;
  interval: TimeRange;
  capacity_intervals: TimeRange[];
  reminder_offsets_minutes: number[];
  capacity_units: number;
  money: LineMoneySnapshot;
  snapshot: CheckoutBookingSnapshot;
  availability: BookingQuoteLineAvailability;
}

export interface DigitalProductQuoteLine {
  line_item_id: string;
  digital_product_id: string;
  beneficiary_customer_id: string;
  money: LineMoneySnapshot;
  snapshot: CheckoutDigitalSnapshot;
}

export type SubscriptionEntitlementOrderQuoteLine =
  | {
      type: "product";
      entitlement_id: string;
      quantity: number;
      money: ProductMoneyTotals;
      money_runs: QuotedProductMoneyRun[];
    }
  | { type: "digital_product"; entitlement_id: string; money: LineMoneySnapshot }
  | { type: "rental"; entitlement_id: string; quantity: number; money: LineMoneySnapshot };

export interface SubscriptionOrderQuoteLine {
  line_item_id: string;
  subject: SubscriptionSubject;
  starts_at: EpochMilliseconds;
  terms: SubscriptionAcceptedTerms;
  occurrence: SubscriptionPurchaseOccurrence;
  money: LineMoneySnapshot;
  entitlement_lines: SubscriptionEntitlementOrderQuoteLine[];
}

export interface OrderQuote {
  context: PurchaseQuoteContext;
  seller: SellerSnapshot;
  invoice_policy: OrderInvoicePolicy;
  timezone: string;
  payment_terms: PaymentTerms | null;
  purchase_order_number: string | null;
  locale: string | null;
  presentation_digest: string;
  delivery_quote_version: string;
  product_lines: ProductQuoteLine[];
  booking_lines: BookingQuoteLine[];
  digital_lines: DigitalProductQuoteLine[];
  subscription_lines: SubscriptionOrderQuoteLine[];
  delivery_groups: QuotedDeliveryGroup[];
  payment_provider_id: string | null;
  payment_provider_ids: string[];
  money: OrderMoney | null;
}

export interface ShippingDeliveryEstimate {
  min_business_days: number;
  max_business_days: number;
}

export type QuotedDeliveryPricing = { type: "calculated"; pricing: AcceptedDeliveryPricing };

export interface QuotedShippingOffer {
  shipping_rate_id: string;
  shipping_method_id: string;
  shipping_method_key: string;
  content: Block[];
  tax_category_id: string | null;
  delivery_estimate: ShippingDeliveryEstimate | null;
  pricing: QuotedDeliveryPricing;
}

export interface QuotedDeliveryGroup {
  cart_delivery_group_id: string;
  shipping_profile_id: string;
  shipping_profile_key: string;
  selected_market_zone_id: string;
  destination: OrderDeliveryDestinationSnapshot;
  units: CartDeliveryUnitAssignment[];
  rental_items: CartDeliveryRentalAssignment[];
  selected_shipping_rate_id: string | null;
  offers: QuotedShippingOffer[];
  money: LineMoneySnapshot | null;
}
