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
  | "promoCode"
  | "emailTemplate"
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
  | "uniqCustomers"
  | "ordersCreated"
  | "bookingsCreated"
  | "newCustomers"
  | "formSubmissions"
  | { entityState: { entity: EntityKind; status: string } };

export type Dimension =
  | "countryCode"
  | "city"
  | "deviceType"
  | "browser"
  | "os"
  | "language"
  | "activityType"
  | "entity"
  | "entityStatus"
  | { timeBucket: { granularity: Granularity } };

export type FilterField =
  | "type"
  | "countryCode"
  | "deviceType"
  | "browser"
  | "os"
  | "language"
  | "entity"
  | "action"
  | "customerId";

export type FilterOp = "eq" | "neq" | "in" | "notIn" | "contains";

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
  timeRange: TimeRange;
  granularity?: Granularity;
  orderBy?: OrderBy[];
  limit?: number;
}

export interface AnalyticsRow {
  [key: string]: string | number | null;
}

export interface AnalyticsQueryResponse {
  rows: AnalyticsRow[];
  meta: {
    rowCount: number;
    executionMs: number;
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
