import type { ApiConfig } from "../index";
import type { RequestOptions } from "../types/api";

export type EntityKind =
  | "product"
  | "service"
  | "provider"
  | "node"
  | "customer"
  | "audience"
  | "agent"
  | "workflow"
  | "promo_code"
  | "email_template"
  | "form"
  | "taxonomy"
  | "media"
  | "order";

export type Granularity =
  | "hour"
  | "day"
  | "week"
  | "month"
  | { minutes: 5 | 10 | 15 | 30 };

export type Measure =
  | "count"
  | "uniq_customers"
  | "orders_created"
  | "new_customers"
  | "form_submissions"
  | { entity_state: { entity: EntityKind; status: string } };

export type Dimension =
  | "country_code"
  | "city"
  | "device_type"
  | "browser"
  | "os"
  | "language"
  | "activity_type"
  | "entity"
  | "entity_status"
  | "order_item_status"
  | { time_bucket: { granularity: Granularity } };

export type FilterField =
  | "type"
  | "country_code"
  | "device_type"
  | "browser"
  | "os"
  | "language"
  | "entity"
  | "action"
  | "customer_id";

export type FilterOp = "eq" | "neq" | "in" | "not_in" | "contains";

export interface Filter {
  field: FilterField;
  op: FilterOp;
  values: string[];
}

export type TimeUnit = "hour" | "day" | "week" | "month";

export type TimeRange =
  | { from: number; unit: TimeUnit; to?: number }
  | { from: number; to: number };

export interface OrderBy {
  field: string;
  dir: "asc" | "desc";
}

export interface AnalyticsQuery {
  measures: Measure[];
  dimensions?: Dimension[];
  filters?: Filter[];
  time_range: TimeRange;
  granularity?: Granularity;
  order_by?: OrderBy[];
  limit?: number;
}

export interface AnalyticsRow {
  [key: string]: string | number | null;
}

export interface AnalyticsQueryResponse {
  rows: AnalyticsRow[];
  meta: {
    row_count: number;
    execution_ms: number;
  };
}

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

export interface ActivityFeedQuery {
  limit?: number;
  since?: number;
  cursor_created_at?: number;
  cursor_id?: string;
  category?: ActivityFeedCategory;
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
  booking_count: number;
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

export interface ActivityFeedResponse {
  items: ActivityFeedItem[];
  summary: ActivityFeedSummary;
  next_cursor?: ActivityFeedCursor | null;
  meta: {
    row_count: number;
    execution_ms: number;
  };
}

export const createAnalyticsApi = (apiConfig: ApiConfig) => {
  return {
    async query(
      spec: AnalyticsQuery,
      options?: RequestOptions & { store_id?: string },
    ): Promise<AnalyticsQueryResponse> {
      const store_id = options?.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<AnalyticsQueryResponse>(
        `/v1/stores/${store_id}/analytics/query`,
        spec,
        options,
      );
    },

    async activityFeed(
      query: ActivityFeedQuery = {},
      options?: RequestOptions & { store_id?: string },
    ): Promise<ActivityFeedResponse> {
      const store_id = options?.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<ActivityFeedResponse>(
        `/v1/stores/${store_id}/analytics/activity-feed`,
        { ...options, params: query },
      );
    },
  };
};
