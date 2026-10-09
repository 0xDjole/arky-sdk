import { epochMilliseconds } from "arky-sdk";
import type {
  CartQuote,
  LineMoney,
  OrderBookingSnapshot,
  OrderLinePrice,
  OrderProductSnapshot,
  ProductMoneyRun,
  QuoteBookingLine,
  QuoteDelivery,
  QuoteEntitlementLine,
  QuoteLine,
  QuoteMoney,
  QuotePlanLine,
  QuoteProductLine,
  QuoteTotals,
  SubscriptionPlanSnapshot,
  SubscriptionPlanEntitlement,
} from "arky-sdk";
import type { QuoteProductLine as PublicQuoteProductLine, CartQuote as PublicCartQuote } from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

export type CheckoutQuoteWireContracts = [
  Assert<Equal<PublicQuoteProductLine, QuoteProductLine>>,
  Assert<Equal<PublicCartQuote, CartQuote>>,
  Assert<Equal<QuoteLine["type"], "product" | "booking" | "subscription_plan">>,
  Assert<RequiredField<QuoteProductLine, "line_item_id">>,
  Assert<RequiredField<QuoteBookingLine, "line_item_id">>,
  Assert<RequiredField<QuotePlanLine, "line_item_id">>,
  Assert<RequiredField<QuoteBookingLine, "capacity_units">>,
  Assert<RequiredField<QuoteBookingLine, "capacity_intervals">>,
  Assert<RequiredField<QuoteBookingLine, "reminder_offsets_minutes">>,
  Assert<Equal<QuoteProductLine["money_runs"], ProductMoneyRun[]>>,
  Assert<Equal<ProductMoneyRun["money"], LineMoney>>,
  Assert<Equal<QuoteProductLine["snapshot"], OrderProductSnapshot>>,
  Assert<Equal<QuoteBookingLine["snapshot"], OrderBookingSnapshot>>,
  Assert<Equal<OrderProductSnapshot["price"], OrderLinePrice>>,
  Assert<Equal<OrderLinePrice["type"], "catalog" | "purchase_access" | "manual" | "offer" | "subscription_allocation">>,
  Assert<Equal<QuotePlanLine["plan"], SubscriptionPlanSnapshot>>,
  Assert<Equal<SubscriptionPlanSnapshot["entitlements"], SubscriptionPlanEntitlement[]>>,
  Assert<Missing<SubscriptionPlanSnapshot, "plan_name" | "key" | "offering_key">>,
  Assert<Equal<QuoteEntitlementLine["type"], "product" | "rental" | "purchase_access">>,
  Assert<Equal<keyof QuoteTotals, "subtotal" | "delivery" | "discount" | "tax" | "total">>,
  Assert<Equal<CartQuote["totals"], QuoteTotals>>,
  Assert<Equal<CartQuote["deliveries"], QuoteDelivery[]>>,
  Assert<Equal<CartQuote["presentation_digest"], string>>,
  Assert<Equal<CartQuote["language"], string>>,
  Assert<Equal<CartQuote["suggested_payment_option_id"], string | null>>,
  Assert<Missing<CartQuote, "payment_terms" | "quote_token" | "expires_at">>,
  Assert<Missing<QuoteProductLine, "per_unit" | "unit_price">>,
];

const from = epochMilliseconds(1_800_000_000_000);
const to = epochMilliseconds(1_800_003_600_000);

export const awaitingTaxBooking: QuoteBookingLine = {
  line_item_id: "booking-line",
  booking_offering_id: "offering",
  booking_service_id: "service",
  booking_resource_id: "resource",
  interval: { from, to },
  capacity_intervals: [{ from, to }],
  capacity_units: 1,
  form_submission_id: null,
  reminder_offsets_minutes: [60],
  snapshot: { service_key: "lesson", resource_key: "room", timezone: "Europe/Sarajevo", price: { type: "offer" } },
  money: { type: "awaiting_tax", unit_price: 4000, discounts: [{ promotion_id: "spring", effect_id: "effect", amount: 500 }], waiting_for: "no_billing_address" },
  availability: { type: "available", spots: 3 },
};

export function bookingUnitPrice(money: QuoteMoney): number {
  return money.type === "taxed" ? money.money.unit_price : money.unit_price;
}

export const awaitingTaxUnitPrice: number = bookingUnitPrice(awaitingTaxBooking.money);
