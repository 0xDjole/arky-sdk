import type { createAdmin } from "arky-sdk/admin";
import type {
  Currency,
  TenantCountBookingOutcome,
  TenantCountBreakdown,
  TenantCountBreakdownRead,
  TenantCountOtherValue,
  GetTenantCountReportParams,
  GetTenantStatusCountsParams,
  TenantCountDayType,
  TenantCountReportType,
  TenantCountSegmentedDayType,
  TenantCountSeriesRead,
  TenantCountTotal,
  TenantCountTotalRead,
  TenantStatusCount,
  TenantStatusCountSegments,
  TenantStatusCountType,
} from "arky-sdk";

type Admin = ReturnType<typeof createAdmin>;
type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Accepts<T, V> = V extends T ? true : false;
type Segment<Type extends TenantStatusCountType> = Extract<TenantStatusCount, { type: Type }>["segments"][number]["segment"];

export type TenantCountContracts = [
  Assert<Equal<TenantCountBreakdown["other_value"], TenantCountOtherValue>>,
  Assert<Equal<TenantCountOtherValue, { type: "count"; value: number } | { type: "money"; currencies: { currency: Currency; value: number }[] }>>,
  Assert<Equal<TenantStatusCountSegments["open_recurring_members_by_status"], "awaiting_activation" | "active" | "blocked" | "paused">>,
  Assert<Equal<TenantStatusCountSegments["open_rentals_by_status"], "waiting" | "active" | "ending">>,
  Assert<
    Equal<
      TenantStatusCountSegments["open_payments_by_type"],
      "stripe_checkout" | "stripe_card" | "monri_checkout" | "monri_card" | "recorded"
    >
  >,
  Assert<Equal<TenantStatusCountSegments["users_by_link"], "anonymous" | "linked">>,
  Assert<Equal<TenantStatusCountSegments["open_shipments_by_type"], "fulfillment_job" | "fulfillment">>,
  Assert<Equal<TenantStatusCountSegments["conversations_by_status"], "flow" | "waiting_for_tenant" | "resolved">>,
  Assert<Equal<Segment<"conversations_by_status">, TenantStatusCountSegments["conversations_by_status"]>>,
  Assert<Equal<Segment<"open_recurring_members_by_status">, TenantStatusCountSegments["open_recurring_members_by_status"]>>,
  Assert<Equal<Segment<"open_rentals_by_status">, TenantStatusCountSegments["open_rentals_by_status"]>>,
  Assert<Equal<Segment<"open_payments_by_type">, TenantStatusCountSegments["open_payments_by_type"]>>,
  Assert<Equal<Segment<"open_shipments_by_type">, TenantStatusCountSegments["open_shipments_by_type"]>>,
  Assert<Accepts<TenantCountDayType, "booked_slots_day">>,
  Assert<Equal<Extract<TenantCountReportType, `booked_slots_${string}`>, "booked_slots_day">>,
  Assert<Accepts<TenantCountTotalRead, { type: "booked_slots_day" }>>,
  Assert<Equal<Accepts<TenantCountTotalRead, { type: "booked_slots_day"; segment: string }>, false>>,
  Assert<Accepts<TenantCountSeriesRead, { type: "booked_slots_day" }>>,
  Assert<Accepts<TenantCountTotal["type"], "booked_slots_day">>,
  Assert<Equal<Accepts<TenantStatusCountType, "booked_slots_day">, false>>,
  Assert<Equal<Accepts<TenantCountReportType, "open_payments_by_type">, false>>,
  Assert<Equal<TenantCountBookingOutcome, "attended" | "no_show" | "cancelled">>,
  Assert<Accepts<TenantCountReportType, "booked_minutes_by_resource_day">>,
  Assert<Accepts<TenantCountReportType, "booking_lines_by_status_day">>,
  Assert<Accepts<TenantCountReportType, "bookings_by_sales_channel_day">>,
  Assert<Accepts<TenantCountReportType, "paid_value_by_location_day">>,
  Assert<Accepts<TenantCountReportType, "messages_sent_by_notification_day">>,
  Assert<Accepts<TenantCountTotalRead, { type: "booking_lines_by_status_day"; segment: string }>>,
  Assert<Accepts<TenantCountTotalRead, { type: "paid_value_by_location_day"; market_id: string; segment: string }>>,
  Assert<Equal<Accepts<TenantCountTotalRead, { type: "paid_value_by_location_day"; segment: string }>, false>>,
  Assert<Equal<Accepts<TenantCountTotalRead, { type: "booked_minutes_by_resource_day"; market_id: string; segment: string }>, false>>,
  Assert<Accepts<TenantCountBreakdownRead, { type: "messages_sent_by_notification_day"; limit: number }>>,
  Assert<Accepts<TenantCountBreakdownRead, { type: "paid_value_by_location_day"; market_id: string }>>,
  Assert<Equal<Accepts<TenantCountBreakdownRead, { type: "paid_value_by_location_day" }>, false>>,
  Assert<Accepts<TenantCountSeriesRead, { type: "paid_value_by_location_day"; market_id: string; segment: string }>>,
  Assert<Accepts<TenantCountTotalRead, { type: "booking_lines_by_location_status_day"; tenant_location_id: string; segment: string }>>,
  Assert<Equal<Accepts<TenantCountTotalRead, { type: "booking_lines_by_location_status_day"; segment: string }>, false>>,
  Assert<Accepts<TenantCountBreakdownRead, { type: "bookings_by_location_sales_channel_day"; tenant_location_id: string; limit: number }>>,
  Assert<Equal<Accepts<TenantCountBreakdownRead, { type: "booking_lines_by_status_day"; tenant_location_id: string }>, false>>,
  Assert<Equal<TenantCountTotal["tenant_location_id"], string | null>>,
  Assert<Equal<TenantCountBreakdown["tenant_location_id"], string | null>>,
  Assert<Equal<Accepts<TenantStatusCountSegments["users_by_link"], "verified">, false>>,
  Assert<Equal<TenantCountTotal["market_id"], string | null>>,
  Assert<Equal<TenantCountBreakdown["market_id"], string | null>>,
  Assert<Equal<Parameters<Admin["counts"]["getStatuses"]>[0], GetTenantStatusCountsParams>>,
  Assert<Equal<Parameters<Admin["counts"]["getReport"]>[0], GetTenantCountReportParams>>,
  Assert<Accepts<TenantCountTotalRead, { type: "booking_lines_by_resource_status_day"; booking_resource_id: string; segment: string }>>,
  Assert<Equal<Accepts<TenantCountTotalRead, { type: "booking_lines_by_resource_status_day"; segment: string }>, false>>,
  Assert<Accepts<TenantCountBreakdownRead, { type: "booking_lines_by_resource_status_day"; booking_resource_id: string }>>,
  Assert<Equal<Accepts<TenantCountBreakdownRead, { type: "booking_lines_by_status_day"; booking_resource_id: string }>, false>>,
  Assert<Accepts<TenantCountTotalRead, { type: "booked_minutes_by_location_resource_day"; tenant_location_id: string; segment: string }>>,
  Assert<Accepts<TenantCountTotalRead, { type: "paid_value_by_method_day"; market_id: string; segment: string }>>,
  Assert<Accepts<TenantCountBreakdownRead, { type: "payments_by_cashier_day"; limit: number }>>,
  Assert<Accepts<TenantCountReportType, "sales_by_package_day">>,
  Assert<Accepts<TenantCountSegmentedDayType, "booking_lines_by_start_hour_day">>,
  Assert<Accepts<TenantCountSeriesRead, { type: "booking_lines_by_start_hour_day"; segment: "9" }>>,
  Assert<Equal<Accepts<TenantCountSeriesRead, { type: "booking_lines_by_start_hour_day"; market_id: string; segment: "9" }>, false>>,
  Assert<Equal<Accepts<TenantCountReportType, "booking_lines_by_start_hour_month">, false>>,
  Assert<Accepts<TenantCountReportType, "receivables_by_market_due_day">>,
  Assert<Accepts<TenantCountReportType, "invoices_issued_by_location_day">>,
  Assert<Accepts<TenantCountReportType, "invoiced_value_by_service_day">>,
  Assert<Accepts<TenantCountReportType, "paid_value_by_resource_day">>,
  Assert<Equal<Accepts<TenantCountReportType, "sales_by_package_month">, false>>,
  Assert<Equal<TenantCountTotal["booking_resource_id"], string | null>>,
  Assert<Equal<TenantCountBreakdown["booking_resource_id"], string | null>>,
];

export const openWork: GetTenantStatusCountsParams = {
  tenant_id: "6d2b8f41-3a75-4c09-9e1d-7b5c2a8f0e36",
  types: [
    "open_recurring_members_by_status",
    "open_rentals_by_status",
    "open_payments_by_type",
    "open_shipments_by_type",
  ],
};

export const upcomingBookings: GetTenantCountReportParams = {
  tenant_id: "6d2b8f41-3a75-4c09-9e1d-7b5c2a8f0e36",
  from: "2026-10-17",
  to: "2027-10-16",
  totals: [{ type: "booked_slots_day" }],
};

export const deskReport: GetTenantCountReportParams = {
  tenant_id: "6d2b8f41-3a75-4c09-9e1d-7b5c2a8f0e36",
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
