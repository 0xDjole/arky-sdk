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
  | "order"
  | "booking";

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
  | "bookings_created"
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

export const createAnalyticsApi = (apiConfig: ApiConfig) => {
  return {
    async query(
      spec: AnalyticsQuery,
      options?: RequestOptions & { businessId?: string },
    ): Promise<AnalyticsQueryResponse> {
      const businessId = options?.businessId || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${businessId}/analytics/query`,
        spec,
        options,
      );
    },
  };
};
