import type { CalendarDate } from "./time";
import type { Currency } from "./common";

export interface StoreStatusCountSegments {
  products_by_status: "active" | "draft" | "archived" | "deleting";
  booking_services_by_status: "active" | "draft" | "archived" | "deleting";
  booking_resources_by_status: "active" | "draft" | "archived" | "deleting";
  collections_by_status: "active" | "draft" | "archived" | "deleting";
  entries_by_status: "active" | "draft" | "scheduled" | "archived" | "deleting";
  categories_by_status: "active" | "draft" | "archived" | "deleting";
  forms_by_status: "active" | "draft" | "closed";
  packages_by_status: "draft" | "active" | "closed" | "archived" | "deleting";
  broadcasts_by_status: "draft" | "scheduled" | "sending" | "sent";
  conversations_by_status: "flow" | "waiting_for_store" | "resolved";
  carts_by_status: "active" | "abandoned" | "converted" | "superseded" | "merged" | "expired";
  customers_by_type: "anonymous" | "verified";
  orders_by_status: "pending" | "confirmed" | "partially_cancelled" | "cancelled";
  order_product_items_by_status: "pending" | "confirmed" | "cancelled";
  open_recurring_members_by_status: "awaiting_activation" | "active" | "blocked" | "paused";
  open_rentals_by_status: "waiting" | "active" | "ending";
  open_payments_by_type: "stripe_checkout" | "stripe_card" | "monri_checkout" | "monri_card" | "cash_on_delivery" | "manual";
  open_shipments_by_type: "fulfillment_job" | "fulfillment";
}

export type StoreStatusCountType = keyof StoreStatusCountSegments;

export type StoreCountDayType =
  | "products_created_day"
  | "booking_services_created_day"
  | "form_submissions_created_day"
  | "customers_created_day"
  | "orders_placed_day"
  | "page_views_day"
  | "booked_slots_day"
  | "missed_calls_day"
  | "call_seconds_day";

export type StoreCountUniqueDayType = "unique_buyers_day" | "unique_visitors_day";

export type StoreCountSegmentedDayType =
  | "placed_value_by_market_day"
  | "refunded_value_by_market_day"
  | "page_views_by_page_day"
  | "page_views_by_country_day"
  | "page_views_by_referrer_day"
  | "calls_by_outcome_day"
  | "booked_minutes_by_resource_day"
  | "booking_lines_by_status_day"
  | "bookings_by_sales_channel_day"
  | "messages_sent_by_notification_day";

export type StoreCountMarketDayType = "paid_value_by_location_day";

export type StoreCountBookingOutcome = "attended" | "no_show" | "cancelled";

export type StoreCountReportType =
  | StoreCountDayType
  | StoreCountUniqueDayType
  | StoreCountSegmentedDayType
  | StoreCountMarketDayType;

export interface StoreCountSegment<Segment extends string = string> {
  segment: Segment;
  value: number;
}

export type StoreStatusCount = {
  [Type in StoreStatusCountType]: {
    type: Type;
    segments: StoreCountSegment<StoreStatusCountSegments[Type]>[];
  };
}[StoreStatusCountType];

export interface StoreStatusCounts {
  counts: StoreStatusCount[];
}

export interface GetStoreStatusCountsParams {
  store_id: string;
  types: StoreStatusCountType[];
}

export type StoreCountTotalRead =
  | { type: StoreCountDayType | StoreCountUniqueDayType; market_id?: never; segment?: never }
  | { type: StoreCountSegmentedDayType; market_id?: never; segment: string }
  | { type: StoreCountMarketDayType; market_id: string; segment: string };

export type StoreCountBreakdownRead =
  | { type: StoreCountSegmentedDayType; market_id?: never; limit?: number }
  | { type: StoreCountMarketDayType; market_id: string; limit?: number };

export type StoreCountSeriesRead =
  | { type: StoreCountDayType; market_id?: never; segment?: never }
  | { type: StoreCountSegmentedDayType; market_id?: never; segment: string }
  | { type: StoreCountMarketDayType; market_id: string; segment: string };

export interface GetStoreCountReportParams {
  store_id: string;
  from: CalendarDate;
  to: CalendarDate;
  totals?: StoreCountTotalRead[];
  breakdowns?: StoreCountBreakdownRead[];
  series?: StoreCountSeriesRead[];
}

export interface StoreCountTotal {
  type: StoreCountReportType;
  market_id: string | null;
  segment: string | null;
  value: number;
}

export interface StoreCountCurrencyValue {
  currency: Currency;
  value: number;
}

export type StoreCountOtherValue =
  | { type: "count"; value: number }
  | { type: "money"; currencies: StoreCountCurrencyValue[] };

export interface StoreCountBreakdown {
  type: StoreCountSegmentedDayType | StoreCountMarketDayType;
  market_id: string | null;
  segments: StoreCountSegment[];
  other_segments: number;
  other_value: StoreCountOtherValue;
}

export interface StoreCountPoint {
  day: CalendarDate;
  value: number;
}

export interface StoreCountSeries {
  type: StoreCountDayType | StoreCountSegmentedDayType | StoreCountMarketDayType;
  market_id: string | null;
  segment: string | null;
  points: StoreCountPoint[];
}

export interface StoreCountReport {
  from: CalendarDate;
  to: CalendarDate;
  totals: StoreCountTotal[];
  breakdowns: StoreCountBreakdown[];
  series: StoreCountSeries[];
}
