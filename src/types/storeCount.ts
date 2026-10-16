import type { CalendarDate } from "./time";

export interface StoreStatusCountSegments {
  products_by_status: "active" | "draft" | "archived" | "deleting";
  booking_services_by_status: "active" | "draft" | "archived" | "deleting";
  booking_resources_by_status: "active" | "draft" | "archived" | "deleting";
  collections_by_status: "active" | "draft" | "archived" | "deleting";
  entries_by_status: "active" | "draft" | "scheduled" | "archived" | "deleting";
  categories_by_status: "active" | "draft" | "archived" | "deleting";
  forms_by_status: "active" | "draft" | "closed";
  customer_groups_by_status: "draft" | "active" | "closed" | "archived";
  broadcasts_by_status: "draft" | "scheduled" | "sending" | "sent";
  conversations_by_status: "flow" | "team" | "resolved";
  carts_by_status: "active" | "abandoned" | "converted" | "superseded" | "merged" | "expired";
  customers_by_type: "anonymous" | "verified";
  orders_by_status: "pending" | "confirmed" | "partially_cancelled" | "cancelled";
  order_product_items_by_status: "pending" | "confirmed" | "cancelled";
}

export type StoreStatusCountType = keyof StoreStatusCountSegments;

export type StoreCountDayType =
  | "new_products_day"
  | "new_booking_services_day"
  | "new_form_submissions_day"
  | "new_customers_day"
  | "new_orders_day"
  | "page_views_day";

export type StoreCountUniqueDayType = "unique_buyers_day" | "unique_visitors_day";

export type StoreCountSegmentedDayType =
  | "placed_value_by_market_day"
  | "refunded_value_by_market_day"
  | "page_views_by_page_day"
  | "page_views_by_country_day"
  | "page_views_by_referrer_day";

export type StoreCountReportType = StoreCountDayType | StoreCountUniqueDayType | StoreCountSegmentedDayType;

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

export interface FindStoreStatusCountsParams {
  store_id: string;
  types: StoreStatusCountType[];
}

export type StoreCountTotalRead =
  | { type: StoreCountDayType | StoreCountUniqueDayType; segment?: never }
  | { type: StoreCountSegmentedDayType; segment: string };

export interface StoreCountBreakdownRead {
  type: StoreCountSegmentedDayType;
  limit?: number;
}

export type StoreCountSeriesRead =
  | { type: StoreCountDayType; segment?: never }
  | { type: StoreCountSegmentedDayType; segment: string };

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
  segment: string | null;
  value: number;
}

export interface StoreCountBreakdown {
  type: StoreCountSegmentedDayType;
  segments: StoreCountSegment[];
  other_segments: number;
  other_value: number;
}

export interface StoreCountPoint {
  day: CalendarDate;
  value: number;
}

export interface StoreCountSeries {
  type: StoreCountDayType | StoreCountSegmentedDayType;
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
