import type { ApiConfig } from "../index";
import type { RequestOptions } from "../types/api";

export interface AnalyticsTimeRange {
  from: number;
  to: number;
}

export type AnalyticsReportKey =
  | "business_overview"
  | "profile_funnel"
  | "outreach_overview"
  | "outreach_funnel"
  | "activity_by_country"
  | "top_activity_pages"
  | "entity_status_overview"
  | "data_health"
  | "orders_created"
  | "profiles_created"
  | "form_submissions_created"
  | "carts_abandoned"
  | "campaign_messages_sent"
  | "campaign_messages_received"
  | "suppressions_created"
  | "media_count"
  | "products_by_status"
  | "services_by_status"
  | "providers_by_status"
  | "collections_by_status"
  | "entries_by_status"
  | "profiles_by_status"
  | "profile_lists_by_status"
  | "mailboxes_by_status"
  | "campaigns_by_status"
  | "campaign_enrollments_by_status"
  | "campaign_messages_by_status"
  | "support_conversations_by_status"
  | "lead_research_runs_by_status"
  | "social_channels_by_status"
  | "social_posts_by_status"
  | "social_deliveries_by_status"
  | "social_comments_by_workflow_status"
  | "suppressions_by_status"

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
  | "profiles"
  | "profile_lists"
  | "products"
  | "services"
  | "providers"
  | "cms"
  | "workflows"
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
  unique_profiles?: number;
  unique_visitors?: number;
}

export interface AnalyticsBreakdownData {
  items: AnalyticsBreakdownItem[];
}

export interface BusinessOverviewData {
  visitors: number;
  new_visitors: number;
  known_profiles: number;
  new_known_profiles: number;
  email_known_profiles: number;
  verified_profiles: number;
  new_verified_profiles: number;
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

export interface ProfileFunnelStage {
  key:
    | "visitors"
    | "email_known_profiles"
    | "verified_profiles"
    | "buyers"
    | string;
  label: string;
  value: number;
}

export interface ProfileFunnelData {
  stages: ProfileFunnelStage[];
  visitor_to_known_rate?: number;
  visitor_to_buyer_rate?: number;
}

export interface OutreachOverviewData {
  profile_lists: number;
  active_profile_lists: number;
  mailboxes: number;
  active_mailboxes: number;
  campaigns: number;
  active_campaigns: number;
  campaign_enrollments: number;
  new_campaign_enrollments: number;
  active_campaign_enrollments: number;
  completed_campaign_enrollments: number;
  replied_campaign_enrollments: number;
  suppressed_campaign_enrollments: number;
  failed_campaign_enrollments: number;
  campaign_messages_sent: number;
  outreach_bounces: number;
  campaign_messages_received: number;
  suppressions: number;
  active_suppressions: number;
  new_suppressions: number;
  reply_rate: number;
  bounce_rate: number;
  suppression_rate: number;
}

export interface OutreachFunnelStage {
  key:
    | "profile_lists"
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
  reply_rate?: number;
  bounce_rate?: number;
  suppression_rate?: number;
}

export interface EntityStatusOverviewData {
  entities: Record<string, AnalyticsBreakdownItem[]>;
}

export interface DataHealthData {
  anonymous_profiles: number;
  known_profiles: number;
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
  profile_id: string;
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
  profiles: number;
  profile_lists: number;
  abandoned_carts: number;
  carts: number;
  promo_codes: number;
  products: number;
  services: number;
  providers: number;
  cms: number;
  workflows: number;
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
  | "profiles_created"
  | "form_submissions_created"
  | "carts_abandoned"
  | "campaign_messages_sent"
  | "campaign_messages_received"
  | "suppressions_created"
  | "media_count";

export type AnalyticsBreakdownReportKey =
  | "activity_by_country"
  | "top_activity_pages"
  | "products_by_status"
  | "services_by_status"
  | "providers_by_status"
  | "collections_by_status"
  | "entries_by_status"
  | "profiles_by_status"
  | "profile_lists_by_status"
  | "mailboxes_by_status"
  | "campaigns_by_status"
  | "campaign_enrollments_by_status"
  | "campaign_messages_by_status"
  | "support_conversations_by_status"
  | "lead_research_runs_by_status"
  | "social_channels_by_status"
  | "social_posts_by_status"
  | "social_deliveries_by_status"
  | "social_comments_by_workflow_status"
  | "suppressions_by_status"

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
  | "profile_funnel"
  | "outreach_overview"
  | "outreach_funnel"
  | "entity_status_overview"
  | "data_health";

export type AnalyticsReport =
  | { key: AnalyticsMetricReportKey; data: AnalyticsMetricData }
  | { key: AnalyticsBreakdownReportKey; data: AnalyticsBreakdownData }
  | { key: "business_overview"; data: BusinessOverviewData }
  | { key: "profile_funnel"; data: ProfileFunnelData }
  | { key: "outreach_overview"; data: OutreachOverviewData }
  | { key: "outreach_funnel"; data: OutreachFunnelData }
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
