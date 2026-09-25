import type {
  AcceptedProductMoneyRun,
  AppliedPriceSnapshot,
  BookingQuoteLine,
  CheckoutBookingSnapshot,
  CheckoutDigitalSnapshot,
  CheckoutProductSnapshot,
  SubscriptionEntitlementOrderQuoteLine,
  SubscriptionOrderQuoteLine,
  SubscriptionPlanSnapshot,
  DigitalProductQuoteLine,
  LineMoneySnapshot,
  OrderBookingItem,
  OrderDeliveryGroup,
  AcceptedDeliveryPricing,
  AcceptedDeliveryPricingSource,
  AcceptedDeliveryCalculation,
  QuotedDeliveryPricing,
  EventAction,
  OrderDigitalItem,
  OrderDigitalSnapshot,
  OrderItemStatus,
  OrderLinePrice,
  OrderProductItem,
  OrderProductSnapshot,
  OrderQuote,
  PaymentTerms,
  ProductMoneyTotals,
  ProductQuoteLine,
  QuotedProductMoneyRun,
  TaxLine,
} from "arky-sdk";
import type {
  ProductQuoteLine as PublicProductQuoteLine,
  AcceptedProductMoneyRun as PublicAcceptedProductMoneyRun,
  CheckoutProductSnapshot as PublicCheckoutProductSnapshot,
} from "arky-sdk/types";

type True<T extends true> = T;
type False<T extends false> = T;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

export type CheckoutQuoteWireContracts = [
  True<RequiredField<SubscriptionPlanSnapshot, "offering_key">>,
  True<RequiredField<SubscriptionPlanSnapshot, "plan_key">>,
  True<RequiredField<SubscriptionPlanSnapshot, "entitlements">>,
  False<"plan_name" extends keyof SubscriptionPlanSnapshot ? true : false>,
  False<"key" extends keyof SubscriptionPlanSnapshot ? true : false>,
  True<Same<PublicProductQuoteLine, ProductQuoteLine>>,
  True<Same<PublicAcceptedProductMoneyRun, AcceptedProductMoneyRun>>,
  True<Same<PublicCheckoutProductSnapshot, CheckoutProductSnapshot>>,
  True<RequiredField<ProductQuoteLine, "line_item_id">>,
  True<RequiredField<BookingQuoteLine, "line_item_id">>,
  True<RequiredField<DigitalProductQuoteLine, "line_item_id">>,
  True<RequiredField<DigitalProductQuoteLine, "beneficiary_customer_id">>,
  True<RequiredField<BookingQuoteLine, "capacity_units">>,
  True<RequiredField<BookingQuoteLine, "capacity_intervals">>,
  True<RequiredField<BookingQuoteLine, "reminder_offsets_minutes">>,
  True<Same<ProductQuoteLine["money"], ProductMoneyTotals>>,
  True<Same<ProductQuoteLine["money_runs"], QuotedProductMoneyRun[]>>,
  True<Same<QuotedProductMoneyRun["per_unit"], LineMoneySnapshot>>,
  False<"unit_price" extends keyof ProductMoneyTotals ? true : false>,
  False<"id" extends keyof QuotedProductMoneyRun ? true : false>,
  True<RequiredField<AcceptedProductMoneyRun, "id">>,
  True<Same<CheckoutProductSnapshot["price"], AppliedPriceSnapshot>>,
  True<Same<CheckoutDigitalSnapshot["price"], AppliedPriceSnapshot>>,
  True<Same<CheckoutBookingSnapshot["price"], AppliedPriceSnapshot>>,
  True<Same<OrderProductSnapshot["price"], OrderLinePrice>>,
  True<Same<OrderDigitalSnapshot["price"], OrderLinePrice>>,
  True<Same<OrderQuote["payment_terms"], PaymentTerms | null>>,
  True<
    Same<
      SubscriptionOrderQuoteLine["entitlement_lines"],
      SubscriptionEntitlementOrderQuoteLine[]
    >
  >,
  True<
    Same<
      Extract<SubscriptionEntitlementOrderQuoteLine, { type: "product" }>["money"],
      ProductMoneyTotals
    >
  >,
  True<RequiredField<OrderProductSnapshot, "source_product_id">>,
  True<RequiredField<OrderProductSnapshot, "source_variant_id">>,
  True<RequiredField<OrderDigitalSnapshot, "source_digital_product_id">>,
  True<null extends OrderProductItem["product_id"] ? true : false>,
  True<null extends OrderProductItem["variant_id"] ? true : false>,
  True<null extends OrderBookingItem["booking_offering_id"] ? true : false>,
  True<null extends OrderBookingItem["booking_resource_id"] ? true : false>,
  True<null extends OrderDigitalItem["digital_product_id"] ? true : false>,
  True<
    null extends Extract<OrderItemStatus, { type: "pending" }>["expires_at"]
      ? true
      : false
  >,
  False<"completed" extends OrderBookingItem["status"]["type"] ? true : false>,
  False<"reminders" extends keyof OrderBookingItem ? true : false>,
  False<"inventory_allocations" extends keyof OrderProductItem ? true : false>,
  True<RequiredField<OrderProductItem, "location_allocations">>,
  True<RequiredField<OrderProductItem, "money_runs">>,
  True<RequiredField<OrderDigitalItem, "access">>,
  True<RequiredField<LineMoneySnapshot, "tax_assessment">>,
  True<RequiredField<LineMoneySnapshot, "duty_lines">>,
  False<"taxable_base" extends keyof LineMoneySnapshot ? true : false>,
  True<RequiredField<TaxLine, "taxable_base">>,
  True<RequiredField<TaxLine, "source">>,
  False<"rate_bps" extends keyof TaxLine ? true : false>,
  True<RequiredField<OrderDeliveryGroup, "money">>,
  True<RequiredField<OrderDeliveryGroup, "content">>,
  True<Same<OrderDeliveryGroup["accepted_pricing"], AcceptedDeliveryPricing>>,
  True<Same<Extract<QuotedDeliveryPricing, { type: "calculated" }>["pricing"], AcceptedDeliveryPricing>>,
  True<Same<keyof AcceptedDeliveryPricing, "source_shipping_method_id" | "source_shipping_profile_id" | "selected_market_zone_id" | "source" | "policy_digest" | "customer_subtotal" | "accepted_at" | "rounding_version">>,
  True<Same<AcceptedDeliveryPricing["source"], AcceptedDeliveryPricingSource>>,
  True<Same<AcceptedDeliveryPricingSource["type"], "shipping_rate" | "subscription_terms">>,
  True<Same<keyof Extract<AcceptedDeliveryPricingSource, { type: "shipping_rate" }>, "type" | "source_shipping_rate_id" | "merchandise_basis" | "weight_grams" | "calculation" | "free_above_subtotal">>,
  True<Same<Extract<AcceptedDeliveryPricingSource, { type: "shipping_rate" }>["calculation"], AcceptedDeliveryCalculation>>,
  True<Same<Extract<AcceptedDeliveryPricingSource, { type: "shipping_rate" }>["weight_grams"], number | null>>,
  True<RequiredField<Extract<AcceptedDeliveryPricingSource, { type: "shipping_rate" }>, "free_above_subtotal">>,
  True<Same<keyof Extract<AcceptedDeliveryPricingSource, { type: "subscription_terms" }>, "type" | "order_subscription_line_item_id" | "delivery_terms_id">>,
  False<"merchandise_basis" extends keyof AcceptedDeliveryPricing ? true : false>,
  False<"calculation" extends keyof AcceptedDeliveryPricing ? true : false>,
  False<"source_shipping_rate_id" extends keyof AcceptedDeliveryPricing ? true : false>,
  True<[Extract<EventAction, { action: "subscription_renewal_due" }>] extends [never] ? false : true>,
  True<[Extract<EventAction, { action: "subscription_renewal_collection_due" }>] extends [never] ? false : true>,
];

declare const line: ProductQuoteLine;
const unitBasis: number = line.money_runs[0].per_unit.unit_price;
const lineTotal: number = line.money.total;
// @ts-expect-error A Product's allocated unit runs cannot be replaced by a rounded line price.
line.money.unit_price;
// @ts-expect-error Accepted digital content is a retained bundle contract, not live asset IDs.
declare const assets: OrderDigitalSnapshot["asset_ids"];
void [unitBasis, lineTotal];
