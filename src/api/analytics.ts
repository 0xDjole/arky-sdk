import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";

export interface AnalyticsTimeRange {
  from: number;
  to: number;
}

export type AnalyticsReportKey =
  | "business_overview"
  | "customer_funnel"
  | "outreach_overview"
  | "outreach_funnel"
  | "customer_action_by_country"
  | "top_customer_action_pages"
  | "entity_status_overview"
  | "data_health"
  | "orders_created"
  | "customers_created"
  | "form_submissions_created"
  | "carts_abandoned"
  | "campaign_messages_sent"
  | "campaign_messages_received"
  | "media_count"
  | "products_by_status"
  | "services_by_status"
  | "providers_by_status"
  | "collections_by_status"
  | "entries_by_status"
  | "customers_by_status"
  | "audiences_by_status"
  | "mailboxes_by_status"
  | "campaigns_by_status"
  | "campaign_enrollments_by_status"
  | "campaign_messages_by_status"
  | "support_conversations_by_status"
  | "workflows_by_status"
  | "promo_codes_by_status"
  | "email_templates_by_status"
  | "forms_by_status"
  | "classifications_by_status"
  | "carts_by_status"
  | "orders_by_status"
  | "order_products_by_status"
  | "recent_customer_action";

export type CustomerActionFeedCategory =
  | "orders"
  | "carts"
  | "promo_codes"
  | "submissions"
  | "customers"
  | "audiences"
  | "products"
  | "services"
  | "providers"
  | "content"
  | "workflows"
  | "customer_actions";

type AnalyticsReportWithoutOptions = Exclude<
  AnalyticsReportKey,
  | "customer_action_by_country"
  | "top_customer_action_pages"
  | "recent_customer_action"
>;

type AnalyticsFeedCursor =
  | { cursor_created_at?: never; cursor_id?: never }
  | { cursor_created_at: number; cursor_id: string };

export type AnalyticsReportRequest =
  | {
      key: AnalyticsReportWithoutOptions;
      limit?: never;
      category?: never;
      cursor_created_at?: never;
      cursor_id?: never;
    }
  | {
      key: "customer_action_by_country" | "top_customer_action_pages";
      limit?: number;
      category?: never;
      cursor_created_at?: never;
      cursor_id?: never;
    }
  | ({
      key: "recent_customer_action";
      limit?: number;
      category?: CustomerActionFeedCategory;
    } & AnalyticsFeedCursor);

export interface AnalyticsBlockRequest {
  id: string;
  time: AnalyticsTimeRange;
  reports: AnalyticsReportRequest[];
}

export type AnalyticsRequest =
  | {
      time: AnalyticsTimeRange;
      reports: AnalyticsReportRequest[];
      blocks?: never;
    }
  | {
      blocks: AnalyticsBlockRequest[];
      time?: never;
      reports?: never;
    };

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
  new_email_known_customers: number;
  new_verified_customers: number;
  buyers: number;
  orders: number;
  revenue_by_currency: RevenueByCurrencyData[];
  carts: number;
  abandoned_carts: number;
  visitor_to_known_rate: AnalyticsRateData;
  visitor_to_buyer_rate: AnalyticsRateData;
  cart_abandonment_rate: AnalyticsRateData;
}

export interface AnalyticsRateData {
  numerator: number;
  denominator: number;
  value: number | null;
}

export interface RevenueByCurrencyData {
  currency: string;
  orders: number;
  revenue: number;
  average_order_value: number | null;
}

export interface CustomerFunnelStage {
  key:
    | "visitors"
    | "new_email_known_customers"
    | "new_verified_customers"
    | "buyers"
    | string;
  label: string;
  value: number;
}

export interface CustomerFunnelData {
  stages: CustomerFunnelStage[];
  visitor_to_known_rate?: AnalyticsRateData;
  visitor_to_buyer_rate?: AnalyticsRateData;
}

export interface OutreachOverviewData {
  audiences: number;
  active_audiences: number;
  mailboxes: number;
  active_mailboxes: number;
  campaigns: number;
  active_campaigns: number;
  campaign_enrollments: number;
  new_campaign_enrollments: number;
  active_campaign_enrollments: number;
  completed_campaign_enrollments: number;
  replied_campaign_enrollments: number;
  campaign_messages_sent: number;
  outreach_bounces: number;
  campaign_messages_received: number;
  reply_rate: AnalyticsRateData;
  bounce_rate: AnalyticsRateData;
}

export interface OutreachFunnelStage {
  key:
    | "audiences"
    | "campaigns"
    | "campaign_enrollments"
    | "campaign_messages_sent"
    | "outreach_bounces"
    | "campaign_messages_received"
    | string;
  label: string;
  value: number;
}

export interface OutreachFunnelData {
  stages: OutreachFunnelStage[];
  reply_rate?: AnalyticsRateData;
  bounce_rate?: AnalyticsRateData;
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

export interface CustomerActionFeedItem {
  id: string;
  entity: string;
  entity_id: string;
  action: string;
  event_type: string;
  status: string;
  customer_id: string;
  category: CustomerActionFeedCategory;
  title: string;
  description: string;
  href?: string | null;
  data: unknown;
  payload: unknown;
  created_at: number;
}

export interface CustomerActionFeedSummary {
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
  content: number;
  workflows: number;
  customer_actions: number;
  window_start: number;
}

export interface CustomerActionFeedCursor {
  created_at: number;
  id: string;
}

export interface CustomerActionFeedData {
  items: CustomerActionFeedItem[];
  summary: CustomerActionFeedSummary;
  next_cursor?: CustomerActionFeedCursor | null;
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
  | "campaign_messages_sent"
  | "campaign_messages_received"
  | "media_count";

export type AnalyticsBreakdownReportKey =
  | "customer_action_by_country"
  | "top_customer_action_pages"
  | "products_by_status"
  | "services_by_status"
  | "providers_by_status"
  | "collections_by_status"
  | "entries_by_status"
  | "customers_by_status"
  | "audiences_by_status"
  | "mailboxes_by_status"
  | "campaigns_by_status"
  | "campaign_enrollments_by_status"
  | "campaign_messages_by_status"
  | "support_conversations_by_status"
  | "workflows_by_status"
  | "promo_codes_by_status"
  | "email_templates_by_status"
  | "forms_by_status"
  | "classifications_by_status"
  | "carts_by_status"
  | "orders_by_status"
  | "order_products_by_status";

export type AnalyticsCustomerActionReportKey = "recent_customer_action";

export type AnalyticsCompositeReportKey =
  | "business_overview"
  | "customer_funnel"
  | "outreach_overview"
  | "outreach_funnel"
  | "entity_status_overview"
  | "data_health";

export type AnalyticsReportScope = "period" | "current_snapshot" | "mixed";

type AnalyticsReportData =
  | { key: AnalyticsMetricReportKey; data: AnalyticsMetricData }
  | { key: AnalyticsBreakdownReportKey; data: AnalyticsBreakdownData }
  | { key: "business_overview"; data: BusinessOverviewData }
  | { key: "customer_funnel"; data: CustomerFunnelData }
  | { key: "outreach_overview"; data: OutreachOverviewData }
  | { key: "outreach_funnel"; data: OutreachFunnelData }
  | { key: "entity_status_overview"; data: EntityStatusOverviewData }
  | { key: "data_health"; data: DataHealthData }
  | {
      key: AnalyticsCustomerActionReportKey;
      data: CustomerActionFeedData;
    };

export type AnalyticsReport = AnalyticsReportData & {
  scope: AnalyticsReportScope;
};

export interface AnalyticsBlockResponse {
  id: string;
  time: AnalyticsTimeRange;
  reports: AnalyticsReport[];
}

export type AnalyticsResponse =
  | {
      time: AnalyticsTimeRange;
      reports: AnalyticsReport[];
      blocks?: never;
    }
  | {
      blocks: AnalyticsBlockResponse[];
      time?: never;
      reports?: never;
    };

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
