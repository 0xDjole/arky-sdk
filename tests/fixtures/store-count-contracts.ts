import type { createAdmin } from "arky-sdk/admin";
import type {
  Currency,
  StoreCountBookingOutcome,
  StoreCountBreakdown,
  StoreCountBreakdownRead,
  StoreCountOtherValue,
  GetStoreCountReportParams,
  GetStoreStatusCountsParams,
  StoreCountDayType,
  StoreCountReportType,
  StoreCountSeriesRead,
  StoreCountTotal,
  StoreCountTotalRead,
  StoreStatusCount,
  StoreStatusCountSegments,
  StoreStatusCountType,
} from "arky-sdk";

type Admin = ReturnType<typeof createAdmin>;
type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Accepts<T, V> = V extends T ? true : false;
type Segment<Type extends StoreStatusCountType> = Extract<StoreStatusCount, { type: Type }>["segments"][number]["segment"];

export type StoreCountContracts = [
  Assert<Equal<StoreCountBreakdown["other_value"], StoreCountOtherValue>>,
  Assert<Equal<StoreCountOtherValue, { type: "count"; value: number } | { type: "money"; currencies: { currency: Currency; value: number }[] }>>,
  Assert<Equal<StoreStatusCountSegments["open_recurring_members_by_status"], "awaiting_activation" | "active" | "blocked" | "paused">>,
  Assert<Equal<StoreStatusCountSegments["open_rentals_by_status"], "waiting" | "active" | "ending">>,
  Assert<
    Equal<
      StoreStatusCountSegments["open_payments_by_type"],
      "stripe_checkout" | "stripe_card" | "monri_checkout" | "monri_card" | "cash_on_delivery" | "manual"
    >
  >,
  Assert<Equal<StoreStatusCountSegments["open_shipments_by_type"], "fulfillment_job" | "fulfillment">>,
  Assert<Equal<StoreStatusCountSegments["conversations_by_status"], "flow" | "waiting_for_store" | "resolved">>,
  Assert<Equal<Segment<"conversations_by_status">, StoreStatusCountSegments["conversations_by_status"]>>,
  Assert<Equal<Segment<"open_recurring_members_by_status">, StoreStatusCountSegments["open_recurring_members_by_status"]>>,
  Assert<Equal<Segment<"open_rentals_by_status">, StoreStatusCountSegments["open_rentals_by_status"]>>,
  Assert<Equal<Segment<"open_payments_by_type">, StoreStatusCountSegments["open_payments_by_type"]>>,
  Assert<Equal<Segment<"open_shipments_by_type">, StoreStatusCountSegments["open_shipments_by_type"]>>,
  Assert<Accepts<StoreCountDayType, "booked_slots_day">>,
  Assert<Equal<Extract<StoreCountReportType, `booked_slots_${string}`>, "booked_slots_day">>,
  Assert<Accepts<StoreCountTotalRead, { type: "booked_slots_day" }>>,
  Assert<Equal<Accepts<StoreCountTotalRead, { type: "booked_slots_day"; segment: string }>, false>>,
  Assert<Accepts<StoreCountSeriesRead, { type: "booked_slots_day" }>>,
  Assert<Accepts<StoreCountTotal["type"], "booked_slots_day">>,
  Assert<Equal<Accepts<StoreStatusCountType, "booked_slots_day">, false>>,
  Assert<Equal<Accepts<StoreCountReportType, "open_payments_by_type">, false>>,
  Assert<Equal<StoreCountBookingOutcome, "attended" | "no_show" | "cancelled">>,
  Assert<Accepts<StoreCountReportType, "booked_minutes_by_resource_day">>,
  Assert<Accepts<StoreCountReportType, "booking_lines_by_status_day">>,
  Assert<Accepts<StoreCountReportType, "bookings_by_sales_channel_day">>,
  Assert<Accepts<StoreCountReportType, "paid_value_by_location_day">>,
  Assert<Accepts<StoreCountReportType, "messages_sent_by_notification_day">>,
  Assert<Accepts<StoreCountTotalRead, { type: "booking_lines_by_status_day"; segment: string }>>,
  Assert<Accepts<StoreCountTotalRead, { type: "paid_value_by_location_day"; market_id: string; segment: string }>>,
  Assert<Equal<Accepts<StoreCountTotalRead, { type: "paid_value_by_location_day"; segment: string }>, false>>,
  Assert<Equal<Accepts<StoreCountTotalRead, { type: "booked_minutes_by_resource_day"; market_id: string; segment: string }>, false>>,
  Assert<Accepts<StoreCountBreakdownRead, { type: "messages_sent_by_notification_day"; limit: number }>>,
  Assert<Accepts<StoreCountBreakdownRead, { type: "paid_value_by_location_day"; market_id: string }>>,
  Assert<Equal<Accepts<StoreCountBreakdownRead, { type: "paid_value_by_location_day" }>, false>>,
  Assert<Accepts<StoreCountSeriesRead, { type: "paid_value_by_location_day"; market_id: string; segment: string }>>,
  Assert<Equal<StoreCountTotal["market_id"], string | null>>,
  Assert<Equal<StoreCountBreakdown["market_id"], string | null>>,
  Assert<Equal<Parameters<Admin["counts"]["getStatuses"]>[0], GetStoreStatusCountsParams>>,
  Assert<Equal<Parameters<Admin["counts"]["getReport"]>[0], GetStoreCountReportParams>>,
];

export const openWork: GetStoreStatusCountsParams = {
  store_id: "6d2b8f41-3a75-4c09-9e1d-7b5c2a8f0e36",
  types: [
    "open_recurring_members_by_status",
    "open_rentals_by_status",
    "open_payments_by_type",
    "open_shipments_by_type",
  ],
};

export const upcomingBookings: GetStoreCountReportParams = {
  store_id: "6d2b8f41-3a75-4c09-9e1d-7b5c2a8f0e36",
  from: "2026-10-17",
  to: "2027-10-16",
  totals: [{ type: "booked_slots_day" }],
};

export const deskReport: GetStoreCountReportParams = {
  store_id: "6d2b8f41-3a75-4c09-9e1d-7b5c2a8f0e36",
  from: "2026-10-01",
  to: "2026-10-31",
  totals: [
    { type: "booking_lines_by_status_day", segment: "no_show" },
    { type: "paid_value_by_location_day", market_id: "1c8e4a97-5d23-4f60-b9a1-3e7d5c0b2f84", segment: "3f9d2c71-6b84-4e05-a1d3-9c7e5b2a0f68" },
  ],
  breakdowns: [
    { type: "booked_minutes_by_resource_day" },
    { type: "paid_value_by_location_day", market_id: "1c8e4a97-5d23-4f60-b9a1-3e7d5c0b2f84", limit: 5 },
  ],
};
