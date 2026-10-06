import { parseAnalyticsResponse, validateAnalyticsRequest } from "./analyticsContract";
import { requireStoreId } from "../utils/storeTarget";
import type { EpochMilliseconds } from "../types/time";
import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";

export interface AnalyticsTimeRange {
  from: EpochMilliseconds;
  to: EpochMilliseconds;
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
  | "customer_groups_by_status"
  | "mailboxes_by_status"
  | "campaigns_by_status"
  | "campaign_enrollments_by_status"
  | "campaign_messages_by_status"
  | "support_conversations_by_status"
  | "email_templates_by_status"
  | "forms_by_status"
  | "categories_by_status"
  | "carts_by_status"
  | "orders_by_status"
  | "order_products_by_status"
  | "recent_customer_action";

export type CustomerActionFeedCategory =
  | "orders"
  | "carts"
  | "submissions"
  | "customers"
  | "customer_groups"
  | "products"
  | "services"
  | "providers"
  | "content"
  | "customer_actions";

type AnalyticsReportWithoutOptions = Exclude<
  AnalyticsReportKey,
  | "customer_action_by_country"
  | "top_customer_action_pages"
  | "recent_customer_action"
>;

type AnalyticsFeedCursor =
  | { cursor_created_at?: never; cursor_id?: never }
  | { cursor_created_at: EpochMilliseconds; cursor_id: string };

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
}

export interface AnalyticsBreakdownItem {
  key: string;
  label: string;
  value: number;
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
    | "buyers";
  label: string;
  value: number;
}

export interface CustomerFunnelData {
  stages: CustomerFunnelStage[];
  visitor_to_known_rate: AnalyticsRateData;
  visitor_to_buyer_rate: AnalyticsRateData;
}

export interface OutreachOverviewData {
  customer_groups: number;
  active_customer_groups: number;
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
    | "customer_groups"
    | "campaigns"
    | "campaign_enrollments"
    | "campaign_messages_sent"
    | "outreach_bounces"
    | "campaign_messages_received";
  label: string;
  value: number;
}

export interface OutreachFunnelData {
  stages: OutreachFunnelStage[];
  reply_rate: AnalyticsRateData;
  bounce_rate: AnalyticsRateData;
}

export interface EntityStatusOverviewData {
  entities: Record<AnalyticsStatusEntity, AnalyticsStatusCount[]>;
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
  status: { type: AnalyticsStatus } | null;
  customer_id: string;
  category: CustomerActionFeedCategory;
  title: string;
  description: string;
  href: string | null;
  data: AnalyticsFeedFactData;
  created_at: EpochMilliseconds;
}

export interface CustomerActionFeedSummary {
  total: number;
  orders: number;
  submissions: number;
  customers: number;
  customer_groups: number;
  abandoned_carts: number;
  carts: number;
  products: number;
  services: number;
  providers: number;
  content: number;
  customer_actions: number;
  window_start: EpochMilliseconds;
}

export interface CustomerActionFeedCursor {
  created_at: EpochMilliseconds;
  id: string;
}

export interface CustomerActionFeedData {
  items: CustomerActionFeedItem[];
  summary: CustomerActionFeedSummary;
  next_cursor: CustomerActionFeedCursor | null;
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
  | "customer_groups_by_status"
  | "mailboxes_by_status"
  | "campaigns_by_status"
  | "campaign_enrollments_by_status"
  | "campaign_messages_by_status"
  | "support_conversations_by_status"
  | "email_templates_by_status"
  | "forms_by_status"
  | "categories_by_status"
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

export type AnalyticsReport =
  | { key: "business_overview"; scope: "period"; data: BusinessOverviewData }
  | { key: "customer_funnel"; scope: "period"; data: CustomerFunnelData }
  | { key: "outreach_overview"; scope: "mixed"; data: OutreachOverviewData }
  | { key: "outreach_funnel"; scope: "mixed"; data: OutreachFunnelData }
  | { key: "customer_action_by_country"; scope: "period"; data: AnalyticsDimensionBreakdownData }
  | { key: "top_customer_action_pages"; scope: "period"; data: AnalyticsDimensionBreakdownData }
  | { key: "entity_status_overview"; scope: "current_snapshot"; data: EntityStatusOverviewData }
  | { key: "data_health"; scope: "mixed"; data: DataHealthData }
  | { key: "orders_created"; scope: "period"; data: AnalyticsMetricData }
  | { key: "customers_created"; scope: "period"; data: AnalyticsMetricData }
  | { key: "form_submissions_created"; scope: "period"; data: AnalyticsMetricData }
  | { key: "carts_abandoned"; scope: "period"; data: AnalyticsMetricData }
  | { key: "campaign_messages_sent"; scope: "period"; data: AnalyticsMetricData }
  | { key: "campaign_messages_received"; scope: "period"; data: AnalyticsMetricData }
  | { key: "media_count"; scope: "current_snapshot"; data: AnalyticsMetricData }
  | { key: "products_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "services_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "providers_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "collections_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "entries_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "customers_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "customer_groups_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "mailboxes_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "campaigns_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "campaign_enrollments_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "campaign_messages_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "support_conversations_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "email_templates_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "forms_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "categories_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "carts_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "orders_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "order_products_by_status"; scope: "current_snapshot"; data: AnalyticsStatusBreakdownData }
  | { key: "recent_customer_action"; scope: "period"; data: CustomerActionFeedData }
;

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
      options: RequestOptions & { store_id: string },
    ): Promise<AnalyticsResponse> {
      const store_id = requireStoreId(options?.store_id);
      const submitted = structuredClone(request);
      validateAnalyticsRequest(submitted);
      const response = await apiConfig.httpClient.post<unknown>(
        `/v1/stores/${requireStoreId(store_id)}/analytics`,
        submitted,
        options,
      );
      return parseAnalyticsResponse(response, submitted, store_id);
    },
  };
};

export type AnalyticsStatus = "active" | "draft" | "archived" | "deleting" | "closed" | "pending" | "confirmed" | "partially_cancelled" | "cancelled" | "abandoned" | "converted" | "merged" | "expired" | "paused" | "completed" | "replied" | "stopped" | "sent" | "received" | "bounced" | "submitted" | "requested" | "processing" | "rejected" | "failed" | "unknown" | "ai_mode" | "escalated" | "resolved";
export type AnalyticsStatusEntity = "product" | "booking_service" | "booking_resource" | "collection" | "entry" | "customer" | "customer_group" | "mailbox" | "campaign" | "campaign_enrollment" | "campaign_message" | "support_conversation" | "email_template" | "form" | "category" | "cart" | "order" | "order_product_item";
export interface AnalyticsStatusCount extends AnalyticsBreakdownItem { key: AnalyticsStatus }
export interface AnalyticsStatusBreakdownData { items: AnalyticsStatusCount[] }
export interface AnalyticsDimensionCount extends AnalyticsBreakdownItem { unique_profiles: number; unique_visitors: number }
export interface AnalyticsDimensionBreakdownData { items: AnalyticsDimensionCount[] }
export type AnalyticsCustomValue = null | boolean | number | string | AnalyticsCustomValue[] | { [key: string]: AnalyticsCustomValue };
export type AnalyticsFeedFactData =
  | { store_id: string; entity_id: string; customer_id: string; customer_session_id: string | null; key: string; data: Record<string, AnalyticsCustomValue>; country_code: string; device_type: string }
  | { store_id: string; entity_id: string; email: string; email_verified: boolean; status: AnalyticsStatus }
  | { store_id: string; entity_id: string; source_customer_id: string; target_customer_id: string; consolidated_at: EpochMilliseconds }
  | { store_id: string; entity_id: string; customer_id: string; customer_session_id: string | null; number: string; status: AnalyticsStatus; payment: { currency: string; total: number } }
  | { store_id: string; entity_id: string; customer_id: string | null; customer_session_id: string | null; status: AnalyticsStatus }
  | { store_id: string; entity_id: string; key: string; status: AnalyticsStatus }
  | { store_id: string; entity_id: string; collection_id: string; key: string; status: AnalyticsStatus }
  | { store_id: string; entity_id: string; form_id: string; customer_id: string; customer_session_id: string | null }
  | { store_id: string; entity_id: string };
