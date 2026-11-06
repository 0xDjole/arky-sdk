import { epochMilliseconds } from "arky-sdk";
import type {
  CartQuote,
  LineMoney,
  OrderBookingSnapshot,
  OrderLinePrice,
  OrderProductSnapshot,
  ProductMoneyRun,
  QuoteBookingLine,
  QuotePackageLine,
  QuoteDelivery,
  QuotePackageItemLine,
  QuoteLine,
  QuoteMoney,
  QuoteProductLine,
  QuoteTotals,
  PackageDeliveryTerms,
  PackagePriceRef,
  PackageSnapshotItem,
  PackageOccurrence,
  PackageSnapshot,
  PackageStart,
  QuoteBlocker,
  QuoteTaxWait,
  QuoteBookingAvailability,
  QuoteDeliveryRental,
  UnavailableShippingRate,
  OrderDeliveryTiming,
  ProductReference,
  QuoteRentalChange,
  QuoteRentalChangeItem,
  QuoteRentalChangeEnding,
} from "arky-sdk";
import type { QuoteProductLine as PublicQuoteProductLine, CartQuote as PublicCartQuote } from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

export type CheckoutQuoteWireContracts = [
  Assert<Equal<PublicQuoteProductLine, QuoteProductLine>>,
  Assert<Equal<PublicCartQuote, CartQuote>>,
  Assert<Equal<QuoteLine["type"], "product" | "booking" | "package">>,
  Assert<RequiredField<QuoteProductLine, "line_item_id">>,
  Assert<RequiredField<QuoteBookingLine, "line_item_id">>,
  Assert<RequiredField<QuotePackageLine, "line_item_id">>,
  Assert<RequiredField<QuoteBookingLine, "capacity_units">>,
  Assert<RequiredField<QuoteBookingLine, "capacity_intervals">>,
  Assert<RequiredField<QuoteBookingLine, "reminder_offsets_minutes">>,
  Assert<Equal<QuoteProductLine["money_runs"], ProductMoneyRun[]>>,
  Assert<Equal<ProductMoneyRun["money"], LineMoney>>,
  Assert<Equal<QuoteProductLine["snapshot"], OrderProductSnapshot>>,
  Assert<Equal<QuoteBookingLine["snapshot"], OrderBookingSnapshot>>,
  Assert<Equal<OrderProductSnapshot["price"], OrderLinePrice>>,
  Assert<Equal<OrderLinePrice["type"], "listed" | "offer" | "package_allocation">>,
  Assert<Equal<Extract<OrderLinePrice, { type: "offer" }>, { type: "offer" } & PackagePriceRef>>,
  Assert<Equal<Extract<OrderLinePrice, { type: "listed" }>, { type: "listed" } & PackagePriceRef>>,
  Assert<Missing<OrderProductSnapshot, "options">>,
  Assert<Equal<keyof OrderProductSnapshot, "product_key" | "variant_sku" | "variant_blocks" | "price" | "fulfillment" | "category_ids" | "measure">>,
  Assert<Equal<keyof QuotePackageLine, "line_item_id" | "package" | "start" | "occurrence" | "items" | "deliveries" | "saves_card" | "rental_change">>,
  Assert<RequiredField<QuotePackageLine, "saves_card">>,
  Assert<Equal<QuotePackageLine["saves_card"], boolean>>,
  Assert<RequiredField<QuotePackageLine, "rental_change">>,
  Assert<Equal<QuotePackageLine["rental_change"], QuoteRentalChange | null>>,
  Assert<Equal<keyof QuoteRentalChange, "items" | "ending">>,
  Assert<Equal<QuoteRentalChange["items"], QuoteRentalChangeItem[]>>,
  Assert<Equal<QuoteRentalChange["ending"], QuoteRentalChangeEnding[]>>,
  Assert<Equal<QuoteRentalChangeItem, { package_item_id: string; rental_id: string | null; kept_quantity: number; shipped_quantity: number }>>,
  Assert<Equal<QuoteRentalChangeEnding, { rental_id: string; returned_quantity: number }>>,
  Assert<Equal<QuotePackageLine["package"], PackageSnapshot>>,
  Assert<Equal<QuotePackageLine["start"], PackageStart>>,
  Assert<Equal<QuotePackageLine["occurrence"], PackageOccurrence>>,
  Assert<Equal<QuotePackageLine["deliveries"], PackageDeliveryTerms[]>>,
  Assert<Equal<PackageSnapshot["items"], PackageSnapshotItem[]>>,
  Assert<Missing<PackageSnapshot, "plan_name" | "key" | "offering_key" | "subscription_plan_id">>,
  Assert<Equal<keyof QuoteProductLine, "line_item_id" | "product_id" | "variant_id" | "quantity" | "form_submission_id" | "price" | "snapshot" | "money_runs" | "awaiting_tax">>,
  Assert<Equal<QuoteProductLine["price"], PackagePriceRef>>,
  Assert<Equal<Extract<QuoteBlocker["type"], `package_${string}`>, "package_delivery_required" | "package_shipping_required" | "package_delivery_fee_varies" | "package_minimum_conflict" | "package_change_scheduled" | "package_change_refused" | "package_shipping_rate_unavailable">>,
  Assert<Equal<Extract<QuoteBlocker, { type: "package_minimum_conflict" }>, { type: "package_minimum_conflict"; line_item_id: string }>>,
  Assert<Equal<Extract<QuoteBlocker, { type: "package_change_scheduled" }>, { type: "package_change_scheduled"; line_item_id: string }>>,
  Assert<Equal<Extract<QuoteBlocker, { type: "package_change_refused" }>, { type: "package_change_refused"; line_item_id: string; code: string }>>,
  Assert<Equal<Extract<QuoteBlocker, { type: "payment_unavailable" }>, { type: "payment_unavailable"; code: string }>>,
  Assert<Equal<Extract<QuoteBlocker, { type: "shipping_rate_unavailable" }>, { type: "shipping_rate_unavailable"; delivery_group_id: string; shipping_method_id: string; rate_id: string; code: string }>>,
  Assert<Equal<Extract<QuoteBlocker, { type: "package_shipping_rate_unavailable" }>, { type: "package_shipping_rate_unavailable"; line_item_id: string; delivery_id: string; shipping_method_id: string; rate_id: string; code: string }>>,
  Assert<Equal<Extract<QuoteBlocker, { type: "booking_unavailable" }>, { type: "booking_unavailable"; line_item_id: string; code: string }>>,
  Assert<Equal<QuoteBlocker["type"], "units_without_delivery" | "billing_address_required" | "shipping_required" | "booking_unavailable" | "tax_unavailable" | "delivery_unavailable" | "package_delivery_required" | "package_shipping_required" | "package_delivery_fee_varies" | "package_minimum_conflict" | "package_change_scheduled" | "package_change_refused" | "payment_unavailable" | "purchase_order_number_required" | "shipping_rate_unavailable" | "package_shipping_rate_unavailable">>,
  Assert<Equal<Extract<QuoteBlocker, { type: "tax_unavailable" }>, { type: "tax_unavailable"; line_item_id: string; code: string }>>,
  Assert<Equal<Extract<QuoteBlocker, { type: "delivery_unavailable" }>, { type: "delivery_unavailable"; delivery_group_id: string; code: string }>>,
  Assert<Equal<QuoteTaxWait, "no_delivery" | "no_billing_address" | "fixed_above_price">>,
  Assert<Equal<Extract<QuoteMoney, { type: "awaiting_tax" }>["waiting_for"], QuoteTaxWait>>,
  Assert<Equal<Extract<QuoteBookingAvailability, { type: "unavailable" }>, { type: "unavailable"; code: string }>>,
  Assert<Equal<UnavailableShippingRate, { shipping_method_id: string; rate_id: string; code: string }>>,
  Assert<Equal<QuoteDelivery["unavailable"], UnavailableShippingRate[]>>,
  Assert<Equal<QuoteDelivery["timing"], OrderDeliveryTiming>>,
  Assert<Equal<keyof QuoteDeliveryRental, "cart_line_item_id" | "package_item_id">>,
  Assert<Equal<Extract<QuoteBlocker["type"], `plan_${string}`>, never>>,
  Assert<Equal<QuotePackageItemLine["type"], "get_product" | "rent_product">>,
  Assert<Equal<Extract<QuotePackageItemLine, { type: "rent_product" }>["product"], ProductReference>>,
  Assert<Equal<Extract<QuotePackageItemLine, { type: "rent_product" }>["product_id"], string>>,
  Assert<Missing<Extract<QuotePackageItemLine, { type: "get_product" }>, "product">>,
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
  snapshot: {
    service_key: "lesson",
    resource_key: "room",
    timezone: "Europe/Sarajevo",
    price: { type: "offer", package_id: "package", package_item_id: "item", price_id: "price" },
  },
  money: { type: "awaiting_tax", unit_price: 4000, discounts: [{ promotion_id: "spring", effect_id: "effect", amount: 500 }], waiting_for: "no_billing_address" },
  availability: { type: "available", spots: 3 },
};

export function bookingUnitPrice(money: QuoteMoney): number {
  return money.type === "taxed" ? money.money.unit_price : money.unit_price;
}

export const awaitingTaxUnitPrice: number = bookingUnitPrice(awaitingTaxBooking.money);

export const packageChange: QuoteRentalChange = {
  items: [
    { package_item_id: "grinder", rental_id: "grinder-rental", kept_quantity: 1, shipped_quantity: 0 },
    { package_item_id: "mill", rental_id: null, kept_quantity: 0, shipped_quantity: 1 },
  ],
  ending: [{ rental_id: "brewer-rental", returned_quantity: 1 }],
};

export function shippedUnits(line: Pick<QuotePackageLine, "rental_change">): number {
  return line.rental_change?.items.reduce((sum, item) => sum + item.shipped_quantity, 0) ?? 0;
}

export const changeShips: number = shippedUnits({ rental_change: packageChange });
export const joinShips: number = shippedUnits({ rental_change: null });
