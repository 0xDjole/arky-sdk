import { epochMilliseconds } from "arky-sdk";
import type {
  CartQuote,
  LineMoney,
  OrderBookingSnapshot,
  OrderLinePrice,
  OrderProductSnapshot,
  ProductMoneyRun,
  QuoteBookingLine,
  QuoteCustomerGroupLine,
  QuoteDelivery,
  QuoteEntitlementLine,
  QuoteLine,
  QuoteMoney,
  QuoteProductLine,
  QuotePurchaseAccess,
  QuoteTotals,
  CustomerGroupDeliveryTerms,
  CustomerGroupEntitlement,
  CustomerGroupOccurrence,
  CustomerGroupSnapshot,
  CustomerGroupStart,
  QuoteBlocker,
  QuoteTaxWait,
  QuoteBookingAvailability,
  QuoteDeliveryRental,
  UnavailableShippingRate,
  OrderDeliveryTiming,
  CartProductPurchase,
  ProductReference,
  QuoteRentalChange,
  QuoteRentalChangeEntitlement,
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
  Assert<Equal<QuoteLine["type"], "product" | "booking" | "customer_group">>,
  Assert<RequiredField<QuoteProductLine, "line_item_id">>,
  Assert<RequiredField<QuoteBookingLine, "line_item_id">>,
  Assert<RequiredField<QuoteCustomerGroupLine, "line_item_id">>,
  Assert<RequiredField<QuoteBookingLine, "capacity_units">>,
  Assert<RequiredField<QuoteBookingLine, "capacity_intervals">>,
  Assert<RequiredField<QuoteBookingLine, "reminder_offsets_minutes">>,
  Assert<Equal<QuoteProductLine["money_runs"], ProductMoneyRun[]>>,
  Assert<Equal<ProductMoneyRun["money"], LineMoney>>,
  Assert<Equal<QuoteProductLine["snapshot"], OrderProductSnapshot>>,
  Assert<Equal<QuoteBookingLine["snapshot"], OrderBookingSnapshot>>,
  Assert<Equal<OrderProductSnapshot["price"], OrderLinePrice>>,
  Assert<Equal<OrderLinePrice["type"], "catalog" | "purchase_access" | "offer" | "customer_group_allocation">>,
  Assert<Equal<Extract<OrderLinePrice, { type: "offer" }>, { type: "offer"; catalog_item_price_id: string; catalog_id: string }>>,
  Assert<Equal<Extract<OrderLinePrice, { type: "catalog" }>, { type: "catalog"; catalog_item_price_id: string; catalog_id: string }>>,
  Assert<Missing<OrderProductSnapshot, "options">>,
  Assert<Equal<Extract<OrderLinePrice, { type: "purchase_access" }>["customer_group_member_id"], string | null>>,
  Assert<Equal<keyof QuoteCustomerGroupLine, "line_item_id" | "group" | "start" | "occurrence" | "entitlements" | "tax_groups" | "deliveries" | "saves_card" | "rental_change">>,
  Assert<RequiredField<QuoteCustomerGroupLine, "saves_card">>,
  Assert<Equal<QuoteCustomerGroupLine["saves_card"], boolean>>,
  Assert<RequiredField<QuoteCustomerGroupLine, "rental_change">>,
  Assert<Equal<QuoteCustomerGroupLine["rental_change"], QuoteRentalChange | null>>,
  Assert<Equal<keyof QuoteRentalChange, "entitlements" | "ending">>,
  Assert<Equal<QuoteRentalChange["entitlements"], QuoteRentalChangeEntitlement[]>>,
  Assert<Equal<QuoteRentalChange["ending"], QuoteRentalChangeEnding[]>>,
  Assert<Equal<QuoteRentalChangeEntitlement, { entitlement_id: string; rental_id: string | null; kept_quantity: number; shipped_quantity: number }>>,
  Assert<Equal<QuoteRentalChangeEnding, { rental_id: string; returned_quantity: number }>>,
  Assert<Equal<QuoteCustomerGroupLine["group"], CustomerGroupSnapshot>>,
  Assert<Equal<QuoteCustomerGroupLine["start"], CustomerGroupStart>>,
  Assert<Equal<QuoteCustomerGroupLine["occurrence"], CustomerGroupOccurrence>>,
  Assert<Equal<QuoteCustomerGroupLine["deliveries"], CustomerGroupDeliveryTerms[]>>,
  Assert<Equal<CustomerGroupSnapshot["entitlements"], CustomerGroupEntitlement[]>>,
  Assert<Missing<CustomerGroupSnapshot, "plan_name" | "key" | "offering_key" | "subscription_plan_id">>,
  Assert<Equal<keyof QuotePurchaseAccess, "grant" | "customer_group_member_id" | "cart_customer_group_line_item_id" | "entitlement_id" | "catalog_id" | "starts_at" | "ends_at" | "limits">>,
  Assert<Equal<Extract<QuoteBlocker["type"], `customer_group_${string}`>, "customer_group_delivery_required" | "customer_group_shipping_required" | "customer_group_delivery_fee_varies" | "customer_group_minimum_conflict" | "customer_group_change_scheduled" | "customer_group_shipping_rate_unavailable">>,
  Assert<Equal<Extract<QuoteBlocker, { type: "customer_group_minimum_conflict" }>, { type: "customer_group_minimum_conflict"; line_item_id: string }>>,
  Assert<Equal<Extract<QuoteBlocker, { type: "customer_group_change_scheduled" }>, { type: "customer_group_change_scheduled"; line_item_id: string }>>,
  Assert<Equal<Extract<QuoteBlocker, { type: "shipping_rate_unavailable" }>, { type: "shipping_rate_unavailable"; delivery_group_id: string; shipping_method_id: string; rate_id: string; code: string }>>,
  Assert<Equal<Extract<QuoteBlocker, { type: "customer_group_shipping_rate_unavailable" }>, { type: "customer_group_shipping_rate_unavailable"; line_item_id: string; delivery_id: string; shipping_method_id: string; rate_id: string; code: string }>>,
  Assert<Equal<Extract<QuoteBlocker, { type: "booking_unavailable" }>, { type: "booking_unavailable"; line_item_id: string; code: string }>>,
  Assert<Equal<Extract<QuoteBlocker, { type: "tax_unavailable" }>, { type: "tax_unavailable"; line_item_id: string; code: string }>>,
  Assert<Equal<Extract<QuoteBlocker, { type: "delivery_unavailable" }>, { type: "delivery_unavailable"; delivery_group_id: string; code: string }>>,
  Assert<Equal<QuoteTaxWait, "no_delivery" | "no_billing_address" | "fixed_above_price">>,
  Assert<Equal<Extract<QuoteMoney, { type: "awaiting_tax" }>["waiting_for"], QuoteTaxWait>>,
  Assert<Equal<Extract<QuoteBookingAvailability, { type: "unavailable" }>, { type: "unavailable"; code: string }>>,
  Assert<Equal<UnavailableShippingRate, { shipping_method_id: string; rate_id: string; code: string }>>,
  Assert<Equal<QuoteDelivery["unavailable"], UnavailableShippingRate[]>>,
  Assert<Equal<QuoteDelivery["timing"], OrderDeliveryTiming>>,
  Assert<Equal<keyof QuoteDeliveryRental, "cart_line_item_id" | "entitlement_id">>,
  Assert<Equal<CartProductPurchase["type"], "catalog" | "existing_purchase_access" | "same_cart_purchase_access" | "assigned_purchase_access">>,
  Assert<Equal<Extract<CartProductPurchase, { type: "assigned_purchase_access" }>, { type: "assigned_purchase_access"; customer_group_member_id: string; entitlement_id: string }>>,
  Assert<Equal<Extract<CartProductPurchase, { type: "catalog" }>, { type: "catalog"; catalog_item_price_id: string }>>,
  Assert<Equal<Extract<QuoteBlocker["type"], `plan_${string}`>, never>>,
  Assert<Equal<QuoteEntitlementLine["type"], "product" | "rental" | "purchase_access">>,
  Assert<Equal<Extract<QuoteEntitlementLine, { type: "rental" }>["product"], ProductReference>>,
  Assert<Equal<Extract<QuoteEntitlementLine, { type: "rental" }>["product_id"], string>>,
  Assert<Missing<Extract<QuoteEntitlementLine, { type: "product" }>, "product">>,
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
    price: { type: "offer", catalog_item_price_id: "price", catalog_id: "catalog" },
  },
  money: { type: "awaiting_tax", unit_price: 4000, discounts: [{ promotion_id: "spring", effect_id: "effect", amount: 500 }], waiting_for: "no_billing_address" },
  availability: { type: "available", spots: 3 },
};

export function bookingUnitPrice(money: QuoteMoney): number {
  return money.type === "taxed" ? money.money.unit_price : money.unit_price;
}

export const awaitingTaxUnitPrice: number = bookingUnitPrice(awaitingTaxBooking.money);

export const packageChange: QuoteRentalChange = {
  entitlements: [
    { entitlement_id: "grinder", rental_id: "grinder-rental", kept_quantity: 1, shipped_quantity: 0 },
    { entitlement_id: "mill", rental_id: null, kept_quantity: 0, shipped_quantity: 1 },
  ],
  ending: [{ rental_id: "brewer-rental", returned_quantity: 1 }],
};

export function shippedUnits(line: Pick<QuoteCustomerGroupLine, "rental_change">): number {
  return line.rental_change?.entitlements.reduce((sum, item) => sum + item.shipped_quantity, 0) ?? 0;
}

export const changeShips: number = shippedUnits({ rental_change: packageChange });
export const joinShips: number = shippedUnits({ rental_change: null });
