import type { ApiConfig } from "../index";
import type { RequestOptions } from "../types/api";

export interface AnalyticsTimeRange {
  from: number;
  to: number;
}

export type AnalyticsReportKey =
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
  | "activity_by_country"
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
}

export interface AnalyticsBreakdownData {
  items: AnalyticsBreakdownItem[];
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
  | "activity_by_country";

export type AnalyticsActivityReportKey = "recent_activity";

export type AnalyticsReport =
  | { key: AnalyticsMetricReportKey; data: AnalyticsMetricData }
  | { key: AnalyticsBreakdownReportKey; data: AnalyticsBreakdownData }
  | { key: AnalyticsActivityReportKey; data: ActivityFeedData };

export interface AnalyticsBlockResponse {
  id: string;
  time: AnalyticsTimeRange;
  reports: AnalyticsReport[];
}

export interface AnalyticsResponse {
  time?: AnalyticsTimeRange;
  reports: AnalyticsReport[];
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
