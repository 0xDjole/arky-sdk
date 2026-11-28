import type { CalendarDate } from "./time";
import type { Currency } from "./common";

export interface TenantStatusCountSegments {
  products_by_status: "active" | "draft" | "archived" | "deleting";
  booking_services_by_status: "active" | "draft" | "archived" | "deleting";
  booking_resources_by_status: "active" | "draft" | "archived" | "deleting";
  collections_by_status: "active" | "draft" | "archived" | "deleting";
  entries_by_status: "active" | "draft" | "scheduled" | "archived" | "deleting";
  categories_by_status: "active" | "draft" | "archived" | "deleting";
  forms_by_status: "active" | "draft" | "closed";
  packages_by_status: "draft" | "active" | "closed" | "archived" | "deleting";
  broadcasts_by_status: "draft" | "scheduled" | "sending" | "sent";
  conversations_by_status: "flow" | "waiting_for_tenant" | "resolved";
  carts_by_status: "active" | "abandoned" | "converted" | "superseded" | "merged" | "expired";
  users_by_link: "anonymous" | "linked";
  orders_by_status: "pending" | "confirmed" | "partially_cancelled" | "cancelled";
  order_product_items_by_status: "pending" | "confirmed" | "cancelled";
  open_recurring_members_by_status: "awaiting_activation" | "active" | "blocked" | "paused";
  open_rentals_by_status: "waiting" | "active" | "ending";
  open_payments_by_type: "stripe_checkout" | "stripe_card" | "monri_checkout" | "monri_card" | "recorded";
  open_shipments_by_type: "fulfillment_job" | "fulfillment";
}

export type TenantStatusCountType = keyof TenantStatusCountSegments;

export type TenantCountDayType =
  | "products_created_day"
  | "booking_services_created_day"
  | "form_submissions_created_day"
  | "users_created_day"
  | "orders_placed_day"
  | "page_views_day"
  | "booked_slots_day"
  | "missed_calls_day"
  | "call_seconds_day";

export type TenantCountUniqueDayType = "unique_buyers_day" | "unique_visitors_day";

export type TenantCountSegmentedDayType =
  | "placed_value_by_market_day"
  | "refunded_value_by_market_day"
  | "page_views_by_page_day"
  | "page_views_by_country_day"
  | "page_views_by_referrer_day"
  | "calls_by_outcome_day"
  | "booked_minutes_by_resource_day"
  | "booking_lines_by_status_day"
  | "bookings_by_sales_channel_day"
  | "messages_sent_by_notification_day"
  | "booking_lines_by_resource_day"
  | "booking_lines_by_start_hour_day"
  | "invoices_issued_by_location_day"
  | "payments_by_method_day"
  | "payments_by_cashier_day"
  | "receivables_by_market_due_day"
  | "sales_by_package_day";

export type TenantCountMarketDayType =
  | "paid_value_by_location_day"
  | "invoiced_value_by_location_day"
  | "invoiced_value_by_service_day"
  | "paid_value_by_resource_day"
  | "paid_value_by_method_day"
  | "paid_value_by_cashier_day";

export type TenantCountLocationDayType =
  | "booking_lines_by_location_status_day"
  | "bookings_by_location_sales_channel_day"
  | "booked_minutes_by_location_resource_day";

export type TenantCountResourceDayType = "booking_lines_by_resource_status_day";

export type TenantCountBookingOutcome = "attended" | "no_show" | "cancelled";

export type TenantCountReportType =
  | TenantCountDayType
  | TenantCountUniqueDayType
  | TenantCountSegmentedDayType
  | TenantCountMarketDayType
  | TenantCountLocationDayType
  | TenantCountResourceDayType;

export interface TenantCountSegment<Segment extends string = string> {
  segment: Segment;
  value: number;
}

export type TenantStatusCount = {
  [Type in TenantStatusCountType]: {
    type: Type;
    segments: TenantCountSegment<TenantStatusCountSegments[Type]>[];
  };
}[TenantStatusCountType];

export interface TenantStatusCounts {
  counts: TenantStatusCount[];
}

export interface GetTenantStatusCountsParams {
  tenant_id: string;
  types: TenantStatusCountType[];
}

export type TenantCountTotalRead =
  | { type: TenantCountDayType | TenantCountUniqueDayType; market_id?: never; tenant_location_id?: never; booking_resource_id?: never; segment?: never }
  | { type: TenantCountSegmentedDayType; market_id?: never; tenant_location_id?: never; booking_resource_id?: never; segment: string }
  | { type: TenantCountMarketDayType; market_id: string; tenant_location_id?: never; booking_resource_id?: never; segment: string }
  | { type: TenantCountLocationDayType; market_id?: never; tenant_location_id: string; booking_resource_id?: never; segment: string }
  | { type: TenantCountResourceDayType; market_id?: never; tenant_location_id?: never; booking_resource_id: string; segment: string };

export type TenantCountBreakdownRead =
  | { type: TenantCountSegmentedDayType; market_id?: never; tenant_location_id?: never; booking_resource_id?: never; limit?: number }
  | { type: TenantCountMarketDayType; market_id: string; tenant_location_id?: never; booking_resource_id?: never; limit?: number }
  | { type: TenantCountLocationDayType; market_id?: never; tenant_location_id: string; booking_resource_id?: never; limit?: number }
  | { type: TenantCountResourceDayType; market_id?: never; tenant_location_id?: never; booking_resource_id: string; limit?: number };

export type TenantCountSeriesRead =
  | { type: TenantCountDayType; market_id?: never; tenant_location_id?: never; booking_resource_id?: never; segment?: never }
  | { type: TenantCountSegmentedDayType; market_id?: never; tenant_location_id?: never; booking_resource_id?: never; segment: string }
  | { type: TenantCountMarketDayType; market_id: string; tenant_location_id?: never; booking_resource_id?: never; segment: string }
  | { type: TenantCountLocationDayType; market_id?: never; tenant_location_id: string; booking_resource_id?: never; segment: string }
  | { type: TenantCountResourceDayType; market_id?: never; tenant_location_id?: never; booking_resource_id: string; segment: string };

export interface GetTenantCountReportParams {
  tenant_id: string;
  from: CalendarDate;
  to: CalendarDate;
  totals?: TenantCountTotalRead[];
  breakdowns?: TenantCountBreakdownRead[];
  series?: TenantCountSeriesRead[];
}

export interface TenantCountTotal {
  type: TenantCountReportType;
  market_id: string | null;
  tenant_location_id: string | null;
  booking_resource_id: string | null;
  segment: string | null;
  value: number;
}

export interface TenantCountCurrencyValue {
  currency: Currency;
  value: number;
}

export type TenantCountOtherValue =
  | { type: "count"; value: number }
  | { type: "money"; currencies: TenantCountCurrencyValue[] };

export interface TenantCountBreakdown {
  type: TenantCountSegmentedDayType | TenantCountMarketDayType | TenantCountLocationDayType | TenantCountResourceDayType;
  market_id: string | null;
  tenant_location_id: string | null;
  booking_resource_id: string | null;
  segments: TenantCountSegment[];
  other_segments: number;
  other_value: TenantCountOtherValue;
}

export interface TenantCountPoint {
  day: CalendarDate;
  value: number;
}

export interface TenantCountSeries {
  type: TenantCountDayType | TenantCountSegmentedDayType | TenantCountMarketDayType | TenantCountLocationDayType | TenantCountResourceDayType;
  market_id: string | null;
  tenant_location_id: string | null;
  booking_resource_id: string | null;
  segment: string | null;
  points: TenantCountPoint[];
}

export interface TenantCountReport {
  from: CalendarDate;
  to: CalendarDate;
  totals: TenantCountTotal[];
  breakdowns: TenantCountBreakdown[];
  series: TenantCountSeries[];
}
