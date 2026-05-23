import type { ApiConfig } from "../index";
import type { RequestOptions } from "../types/api";

export interface AnalyticsTimeRange {
  from: number;
  to: number;
}

export type AnalyticsReportKey =
  | "business_overview"
  | "customer_funnel"
  | "activity_by_country"
  | "top_activity_pages"
  | "entity_status_overview"
  | "data_health"
  | "orders_created"
  | "customers_created"
  | "form_submissions_created"
  | "carts_abandoned"
  | "media_count"
  | "products_by_status"
  | "services_by_status"
  | "providers_by_status"
  | "nodes_by_status"
  | "customers_by_status"
  | "audiences_by_status"
  | "agents_by_status"
  | "workflows_by_status"
  | "promo_codes_by_status"
  | "email_templates_by_status"
  | "forms_by_status"
  | "taxonomies_by_status"
  | "carts_by_status"
  | "orders_by_status"
  | "order_items_by_status"
  | "recent_activity";

export type ActivityFeedCategory =
  | "orders"
  | "carts"
  | "promo_codes"
  | "submissions"
  | "customers"
  | "audiences"
  | "products"
  | "services"
  | "providers"
  | "cms"
  | "workflows"
  | "agents"
  | "activities";

export interface AnalyticsReportRequest {
  key: AnalyticsReportKey;
  limit?: number;
  category?: ActivityFeedCategory;
  cursor_created_at?: number;
  cursor_id?: string;
}

export interface AnalyticsRequest {
  time?: AnalyticsTimeRange;
  reports?: AnalyticsReportRequest[];
  blocks?: AnalyticsBlockRequest[];
}

export interface AnalyticsBlockRequest {
  id: string;
  time: AnalyticsTimeRange;
  reports: AnalyticsReportRequest[];
}

export interface AnalyticsMetricData {
  value: number;
  execution_ms?: number;
}

export interface AnalyticsBreakdownItem {
  key: string;
  label: string;
  value: number;
  unique_customers?: number;
  unique_visitors?: number;
}

export interface AnalyticsBreakdownData {
  items: AnalyticsBreakdownItem[];
}

export interface BusinessOverviewData {
  visitors: number;
  new_visitors: number;
  known_customers: number;
  new_known_customers: number;
  email_known_customers: number;
  verified_customers: number;
  new_verified_customers: number;
  buyers: number;
  orders: number;
  revenue: number;
  revenue_by_currency: RevenueByCurrencyData[];
  average_order_value: number;
  carts: number;
  abandoned_carts: number;
  visitor_to_known_rate: number;
  visitor_to_buyer_rate: number;
  cart_abandonment_rate: number;
}

export interface RevenueByCurrencyData {
  currency: string;
  orders: number;
  revenue: number;
  average_order_value: number;
}

export interface CustomerFunnelStage {
  key:
    | "visitors"
    | "email_known_customers"
    | "verified_customers"
    | "buyers"
    | string;
  label: string;
  value: number;
}

export interface CustomerFunnelData {
  stages: CustomerFunnelStage[];
  visitor_to_known_rate?: number;
  visitor_to_buyer_rate?: number;
}

export interface EntityStatusOverviewData {
  entities: Record<string, AnalyticsBreakdownItem[]>;
}

export interface DataHealthData {
  anonymous_customers: number;
  known_customers: number;
  duplicate_emails: number;
  unknown_country_events: number;
  unknown_device_events: number;
}

export interface ActivityFeedItem {
  id: string;
  entity: string;
  entity_id: string;
  action: string;
  event_type: string;
  status: string;
  customer_id: string;
  category: string;
  title: string;
  description: string;
  href?: string | null;
  data: unknown;
  payload: unknown;
  created_at: number;
}

export interface ActivityFeedSummary {
  total: number;
  orders: number;
  submissions: number;
  customers: number;
  audiences: number;
  abandoned_carts: number;
  carts: number;
  promo_codes: number;
  products: number;
  services: number;
  providers: number;
  cms: number;
  workflows: number;
  agents: number;
  activities: number;
  window_start: number;
}

export interface ActivityFeedCursor {
  created_at: number;
  id: string;
}

export interface ActivityFeedData {
  items: ActivityFeedItem[];
  summary: ActivityFeedSummary;
  next_cursor?: ActivityFeedCursor | null;
  meta: {
    row_count: number;
    execution_ms: number;
  };
}

export type AnalyticsMetricReportKey =
  | "orders_created"
  | "customers_created"
  | "form_submissions_created"
  | "carts_abandoned"
  | "media_count";

export type AnalyticsBreakdownReportKey =
  | "activity_by_country"
  | "top_activity_pages"
  | "products_by_status"
  | "services_by_status"
  | "providers_by_status"
  | "nodes_by_status"
  | "customers_by_status"
  | "audiences_by_status"
  | "agents_by_status"
  | "workflows_by_status"
  | "promo_codes_by_status"
  | "email_templates_by_status"
  | "forms_by_status"
  | "taxonomies_by_status"
  | "carts_by_status"
  | "orders_by_status"
  | "order_items_by_status";

export type AnalyticsActivityReportKey = "recent_activity";

export type AnalyticsCompositeReportKey =
  | "business_overview"
  | "customer_funnel"
  | "entity_status_overview"
  | "data_health";

export type AnalyticsReport =
  | { key: AnalyticsMetricReportKey; data: AnalyticsMetricData }
  | { key: AnalyticsBreakdownReportKey; data: AnalyticsBreakdownData }
  | { key: "business_overview"; data: BusinessOverviewData }
  | { key: "customer_funnel"; data: CustomerFunnelData }
  | { key: "entity_status_overview"; data: EntityStatusOverviewData }
  | { key: "data_health"; data: DataHealthData }
  | { key: AnalyticsActivityReportKey; data: ActivityFeedData };

export interface AnalyticsBlockResponse {
  id: string;
  time: AnalyticsTimeRange;
  reports: AnalyticsReport[];
}

export interface AnalyticsResponse {
  time?: AnalyticsTimeRange;
  reports?: AnalyticsReport[];
  blocks?: AnalyticsBlockResponse[];
}

export const createAnalyticsApi = (apiConfig: ApiConfig) => {
  return {
    async get(
      request: AnalyticsRequest,
      options?: RequestOptions & { store_id?: string },
    ): Promise<AnalyticsResponse> {
      const store_id = options?.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<AnalyticsResponse>(
        `/v1/stores/${store_id}/analytics`,
        request,
        options,
      );
    },
  };
};
