import type { ApiConfig } from "../index";
import type { PaginatedResponse, SocialProviderKey } from "../types";
import type { RequestOptions } from "../types/api";

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "x"
  | "tiktok"
  | "youtube"
  | "threads"
  | "pinterest"
  | "unknown";

export type { SocialProviderKey } from "../types";

export const SOCIAL_PROVIDER_KEYS = [
  "meta",
  "tiktok",
  "youtube",
  "x",
] as const satisfies readonly SocialProviderKey[];

const SOCIAL_PROVIDER_KEY_SET = new Set<string>([
  ...SOCIAL_PROVIDER_KEYS,
  "linkedin",
  "pinterest",
]);

export function isSocialProviderKey(value: unknown): value is SocialProviderKey {
  return typeof value === "string" && SOCIAL_PROVIDER_KEY_SET.has(value);
}

export function socialProviderLabel(providerKey: SocialProviderKey): string {
  switch (providerKey) {
    case "meta":
      return "Meta";
    case "linkedin":
      return "LinkedIn";
    case "tiktok":
      return "TikTok";
    case "youtube":
      return "YouTube";
    case "pinterest":
      return "Pinterest";
    case "x":
      return "X";
  }
}

export function socialProviderKeyForPlatform(
  platform: SocialPlatform,
): SocialProviderKey | null {
  if (platform === "facebook" || platform === "instagram") {
    return "meta";
  }
  return isSocialProviderKey(platform) ? platform : null;
}

export type SocialProviderAdapterStatus =
  | "available"
  | "planned"
  | "mock_only";

export type SocialProviderStrategy =
  | "unsupported"
  | "provider_api"
  | "webhook"
  | "polling"
  | "webhook_and_polling"
  | "status_webhook_and_polling";

export interface SocialProviderDocLink {
  label: string;
  url: string;
}

export interface SocialProviderOauthCapability {
  required: boolean;
  strategy: SocialProviderStrategy;
  notes: string;
}

export interface SocialProviderFeatureCapability {
  supported: boolean;
  strategy: SocialProviderStrategy;
  notes: string;
}

export interface SocialProviderWebhookCapability {
  supported: boolean;
  strategy: SocialProviderStrategy;
  events: string[];
  notes: string;
}

export interface SocialProviderCapabilities {
  provider_key: SocialProviderKey;
  display_name: string;
  platforms: SocialPlatform[];
  adapter_status: SocialProviderAdapterStatus;
  oauth: SocialProviderOauthCapability;
  publishing: SocialProviderFeatureCapability;
  comments: SocialProviderFeatureCapability;
  metrics: SocialProviderFeatureCapability;
  webhooks: SocialProviderWebhookCapability;
  polling_backfill_required: boolean;
  provider_approval_required: boolean;
  notes: string;
  docs: SocialProviderDocLink[];
}

export type SocialProviderConnectionStatus =
  | "connected"
  | "needs_reauth"
  | "disabled"
  | "disconnected"
  | "not_configured";

export type SocialChannelSource =
  | "manual"
  | "fake_provider"
  | "provider_sync"
  | "provider_backfill"
  | "unknown";

export type SocialChannelConnectionMode = "manual" | "connected" | "mock";

export interface SocialProviderConnection {
  provider_key: SocialProviderKey;
  display_name: string;
  platforms: SocialPlatform[];
  adapter_status: SocialProviderAdapterStatus;
  status: SocialProviderConnectionStatus;
  integration_id?: string | null;
  account_label?: string | null;
  scopes: string[];
  connected_at?: number | null;
  token_expires_at?: number | null;
  webhook_configured: boolean;
  polling_backfill_required: boolean;
  provider_approval_required: boolean;
}

export interface StartSocialProviderOAuthParams {
  store_id?: string;
  provider_key: SocialProviderKey;
  integration_id?: string | null;
  redirect_uri: string;
  scopes?: string[];
}

export interface CompleteSocialProviderOAuthParams {
  store_id?: string;
  provider_key: SocialProviderKey;
  code: string;
  state: string;
  redirect_uri: string;
}

export interface DisconnectSocialProviderOAuthParams {
  store_id?: string;
  provider_key: SocialProviderKey;
  integration_id?: string | null;
}

export interface SocialProviderOAuthStartResponse {
  provider_key: SocialProviderKey;
  integration_id: string;
  authorization_url: string;
  state: string;
  scopes: string[];
  expires_at: number;
  pkce_required: boolean;
}

export interface SocialProviderOAuthCompleteResponse {
  provider_key: SocialProviderKey;
  integration_id: string;
  account_label?: string | null;
  scopes: string[];
  connected_at: number;
  token_expires_at?: number | null;
}

export interface SocialProviderOAuthDisconnectResponse {
  provider_key: SocialProviderKey;
  integration_id: string;
  disconnected: boolean;
}

export interface SyncSocialProviderParams {
  store_id?: string;
  provider_key: SocialProviderKey;
  integration_id?: string | null;
  destination_id?: string | null;
  channel_id?: string | null;
  since?: number | null;
}

export interface SocialProviderSyncResponse {
  request_id: string;
  provider_key: SocialProviderKey;
  integration_id: string;
  destination_id?: string | null;
  channel_id?: string | null;
  since?: number | null;
  queued_at: number;
  polling_backfill_required: boolean;
}

export type SocialChannelType =
  | "profile"
  | "page"
  | "business"
  | "channel"
  | "organization"
  | "unknown";
export type SocialChannelStatus =
  | "active"
  | "paused"
  | "revoked"
  | "needs_reauth";
export type SocialPostStatus =
  | "draft"
  | "ready"
  | "scheduled"
  | "posted"
  | "archived";
export type SocialPostVariantStatus = "draft" | "ready" | "invalid";
export type SocialDeliveryStatus =
  | "scheduled"
  | "sending"
  | "posted"
  | "failed"
  | "hard_failed"
  | "cancelled";
export type SocialCommentDirection = "inbound" | "outbound" | "activity";
export type SocialCommentType =
  | "comment"
  | "comment_reply"
  | "manual_reply"
  | "generated_reply"
  | "provider_activity";
export type SocialCommentStatus =
  | "pending"
  | "sending"
  | "sent"
  | "received"
  | "failed"
  | "hidden"
  | "deleted"
  | "skipped";
export type SocialCommentWorkflowStatus =
  | "open"
  | "replied"
  | "resolved"
  | "archived";
export type SocialCommentCopySource =
  | "provider"
  | "edited"
  | "generated"
  | "template";

export interface SocialChannel {
  id: string;
  store_id: string;
  integration_id?: string | null;
  provider_key?: SocialProviderKey | null;
  source: SocialChannelSource;
  connection_mode: SocialChannelConnectionMode;
  platform: SocialPlatform;
  display_name: string;
  username?: string | null;
  avatar_url?: string | null;
  permissions: string[];
  status: SocialChannelStatus;
  metadata?: Record<string, unknown> | null;
  created_at: number;
  updated_at: number;
}

export type IntegrationDestination = SocialChannel;

export interface SocialPostVariant {
  id: string;
  platform: SocialPlatform;
  copy: string;
  hashtags: string[];
  mentions: string[];
  link_url?: string | null;
  cta?: string | null;
  media_ids: string[];
  settings?: Record<string, unknown> | null;
  status: SocialPostVariantStatus;
  created_at: number;
  updated_at: number;
}

export interface SocialPost {
  id: string;
  store_id: string;
  campaign_id?: string | null;
  title?: string | null;
  base_copy: string;
  link_url?: string | null;
  media_ids: string[];
  base_timezone: string;
  status: SocialPostStatus;
  taxonomies?: Record<string, unknown> | null;
  variants: SocialPostVariant[];
  created_at: number;
  updated_at: number;
}

export interface SocialDeliveryVariantSnapshot {
  variant_id: string;
  copy: string;
  hashtags: string[];
  mentions: string[];
  link_url?: string | null;
  cta?: string | null;
  media_ids: string[];
  settings?: Record<string, unknown> | null;
}

export interface SocialDeliveryMetrics {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  saves: number;
  video_views: number;
  followers_delta: number;
  collected_at?: number | null;
}

export interface SocialDeliveryHistoryEntry {
  id: string;
  action: string;
  at: number;
  status: SocialDeliveryStatus;
  scheduled_at?: number | null;
  attempt_count: number;
  message?: string | null;
  error_code?: string | null;
}

export interface SocialDeliveryProviderError {
  code?: string | null;
  kind?: string | null;
  message?: string | null;
  provider_code?: string | null;
  retryable?: boolean | null;
  retry_after_seconds?: number | null;
  at?: number | null;
  provider_context: Record<string, string>;
}

export interface SocialDelivery {
  id: string;
  store_id: string;
  post_id: string;
  variant_id: string;
  destination_id: string;
  channel_id: string;
  platform: SocialPlatform;
  scheduled_at: number;
  status: SocialDeliveryStatus;
  attempt_count: number;
  last_attempt_at?: number | null;
  next_retry_at?: number | null;
  last_error_code?: string | null;
  last_error_message?: string | null;
  published_url?: string | null;
  published_at?: number | null;
  latest_metrics: SocialDeliveryMetrics;
  variant_snapshot: SocialDeliveryVariantSnapshot;
  history: SocialDeliveryHistoryEntry[];
  last_provider_error?: SocialDeliveryProviderError | null;
  metadata?: Record<string, unknown> | null;
  created_at: number;
  updated_at: number;
}

export interface SocialActorRef {
  display_name?: string | null;
  handle?: string | null;
  avatar_url?: string | null;
  profile_url?: string | null;
  linked_profile_id?: string | null;
}

export interface SocialComment {
  id: string;
  store_id: string;
  platform: SocialPlatform;
  destination_id: string;
  channel_id: string;
  delivery_id: string;
  root_comment_id?: string | null;
  parent_comment_id?: string | null;
  direction: SocialCommentDirection;
  type: SocialCommentType;
  status: SocialCommentStatus;
  workflow_status?: SocialCommentWorkflowStatus | null;
  author: SocialActorRef;
  body: string;
  attachments: string[];
  permalink?: string | null;
  in_reply_to_comment_id?: string | null;
  copy_source: SocialCommentCopySource;
  error?: string | null;
  sent_at?: number | null;
  received_at?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at: number;
  updated_at: number;
}

export interface SocialPostScheduleResponse {
  post: SocialPost;
  deliveries: SocialDelivery[];
}

export interface SocialDeliveryCreateManyResponse {
  deliveries: SocialDelivery[];
}

type BackendSocialPost = SocialPost;
type BackendSocialChannel = SocialChannel;
type BackendIntegrationDestination = IntegrationDestination;
type BackendSocialDelivery = SocialDelivery;
type BackendSocialComment = SocialComment;
type BackendSocialProviderCapabilities = SocialProviderCapabilities;
type BackendSocialProviderConnection = SocialProviderConnection;
type BackendSocialProviderOAuthStartResponse =
  SocialProviderOAuthStartResponse;
type BackendSocialProviderOAuthCompleteResponse =
  SocialProviderOAuthCompleteResponse;
type BackendSocialProviderOAuthDisconnectResponse =
  SocialProviderOAuthDisconnectResponse;
type BackendSocialProviderSyncResponse = SocialProviderSyncResponse;
type BackendSocialPostScheduleResponse = SocialPostScheduleResponse;
type BackendSocialDeliveryCreateManyResponse = SocialDeliveryCreateManyResponse;
type BackendSocialDeliveryCommentsResponse = SocialDeliveryCommentsResponse;

export interface SocialDeliveryCommentsResponse {
  delivery: SocialDelivery;
  comments: SocialComment[];
}

export interface SocialPostDetailResponse {
  post: SocialPost;
  channels: SocialChannel[];
  deliveries: SocialDelivery[];
  comments: SocialComment[];
}

export interface SocialCommentThreadResponse {
  comment: SocialComment;
  delivery: SocialDelivery;
  channel: SocialChannel;
  post?: SocialPost | null;
  comments: SocialComment[];
}

type BackendSocialPostDetailResponse = Omit<
  SocialPostDetailResponse,
  "post" | "channels" | "deliveries" | "comments"
> & {
  post: BackendSocialPost;
  channels: BackendSocialChannel[];
  deliveries: BackendSocialDelivery[];
  comments: BackendSocialComment[];
};

type BackendSocialCommentThreadResponse = Omit<
  SocialCommentThreadResponse,
  "comment" | "delivery" | "channel" | "post" | "comments"
> & {
  comment: BackendSocialComment;
  delivery: BackendSocialDelivery;
  channel: BackendSocialChannel;
  post?: BackendSocialPost | null;
  comments: BackendSocialComment[];
};

export interface SocialInsightsTopPost {
  post_id: string;
  label: string;
  deliveries: number;
  engagement: number;
  comments: number;
}

export interface SocialChannelHealth {
  channel_id: string;
  channel_name: string;
  platform: string;
  status: string;
  scheduled: number;
  posted: number;
  failed: number;
}

export interface SocialInsightsResponse {
  posts_published: number;
  engagement: number;
  total_comments: number;
  comments_needing_reply: number;
  average_response_seconds?: number | null;
  failed_deliveries: number;
  top_posts: SocialInsightsTopPost[];
  channel_health: SocialChannelHealth[];
  clickhouse_available: boolean;
}

type SocialSortDirection = "asc" | "desc";

export type FindSocialChannelsParams = {
  store_id?: string;
  query?: string;
  platform?: SocialPlatform;
  status?: SocialChannelStatus;
  sort_field?: string;
  sort_direction?: SocialSortDirection;
  limit?: number;
  cursor?: string;
};

export type FindIntegrationDestinationsParams = FindSocialChannelsParams;

export type CreateSocialChannelParams = Partial<SocialChannel> & {
  store_id?: string;
  platform: SocialPlatform;
  provider_channel_id: string;
  channel_type: SocialChannelType;
  display_name: string;
};

export type CreateIntegrationDestinationParams = CreateSocialChannelParams;

export type SyncSocialChannelsParams = {
  store_id?: string;
  integration_id?: string;
  platforms?: SocialPlatform[];
};

export type SyncIntegrationDestinationsParams = SyncSocialChannelsParams;

export type UpdateSocialChannelParams = Partial<SocialChannel> & {
  store_id?: string;
  id: string;
};

export type UpdateIntegrationDestinationParams = UpdateSocialChannelParams;

export type FindSocialPostsParams = {
  store_id?: string;
  query?: string;
  status?: SocialPostStatus;
  sort_field?: string;
  sort_direction?: SocialSortDirection;
  limit?: number;
  cursor?: string;
};

export type CreateSocialPostParams = Partial<SocialPost> & {
  store_id?: string;
  base_copy: string;
  variants?: SocialPostVariant[];
};

export type UpdateSocialPostParams = Partial<SocialPost> & {
  store_id?: string;
  id: string;
};

export type UpsertSocialPostVariantParams = {
  store_id?: string;
  id: string;
  variant_id?: string;
  variant: SocialPostVariant;
};

export type SocialPostTargetParams = {
  channel_id: string;
  variant_id: string;
  scheduled_at?: number;
};

export type ScheduleSocialPostParams = {
  store_id?: string;
  id: string;
  targets: SocialPostTargetParams[];
};

export type RescheduleSocialDeliveryTargetParams = {
  delivery_id: string;
  scheduled_at: number;
};

export type RescheduleSocialPostParams = {
  store_id?: string;
  id: string;
  scheduled_at?: number;
  targets?: RescheduleSocialDeliveryTargetParams[];
};

export type FindSocialDeliveriesParams = {
  store_id?: string;
  query?: string;
  post_id?: string;
  destination_id?: string;
  channel_id?: string;
  platform?: SocialPlatform;
  status?: SocialDeliveryStatus;
  sort_field?: string;
  sort_direction?: SocialSortDirection;
  limit?: number;
  cursor?: string;
};

export type CreateSocialDeliveryParams = {
  store_id?: string;
  integration_id?: string | null;
  destination_id?: string | null;
  platform?: SocialPlatform | null;
  variant_id?: string | null;
  scheduled_at?: number | null;
  publish_now?: boolean;
  copy: string;
  hashtags?: string[];
  mentions?: string[];
  link_url?: string | null;
  cta?: string | null;
  media_ids?: string[];
  settings?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

export type CreateSocialDeliveriesParams = {
  store_id?: string;
  deliveries: CreateSocialDeliveryParams[];
};

export type GetSocialEntityParams = {
  store_id?: string;
  id: string;
};

export type FindSocialDeliveryCommentsParams = {
  store_id?: string;
  delivery_id: string;
  limit?: number;
  after_created_at?: number;
  after_id?: string;
};

export type SearchSocialCommentsParams = {
  store_id?: string;
  query?: string;
  delivery_id?: string;
  destination_id?: string;
  channel_id?: string;
  platform?: SocialPlatform;
  status?: SocialCommentStatus;
  workflow_status?: SocialCommentWorkflowStatus;
  sort_field?: string;
  sort_direction?: SocialSortDirection;
  limit?: number;
  cursor?: string;
};

export type CreateSocialCommentParams = Omit<Partial<SocialComment>, "author"> & {
  store_id?: string;
  delivery_id: string;
  body: string;
  provider_comment_id?: string | null;
  provider_parent_comment_id?: string | null;
  author?: SocialActorRef & { provider_actor_id?: string | null };
};

export type ReplySocialCommentParams = {
  store_id?: string;
  id: string;
  body: string;
  attachments?: string[];
  metadata?: Record<string, unknown>;
};

export const createSocialApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;
  const mapPage = <TBackend, TPublic>(
    page: PaginatedResponse<TBackend>,
    mapper: (item: TBackend) => TPublic,
  ): PaginatedResponse<TPublic> => ({
    ...page,
    items: (page.items || []).map(mapper),
    data: page.data?.map(mapper),
  });
  const mapChannel = (channel: BackendSocialChannel): SocialChannel => {
    return channel;
  };
  const mapDestination = (
    destination: BackendIntegrationDestination,
  ): IntegrationDestination => {
    return destination;
  };
  const channelPayload = (channel: Partial<SocialChannel>) => {
    return channel;
  };
  const destinationPayload = (
    destination: Partial<IntegrationDestination>,
  ) => {
    return destination;
  };
  const mapPost = (post: BackendSocialPost): SocialPost => {
    return post;
  };
  const postPayload = (post: Partial<SocialPost>) => {
    return post;
  };
  const mapDelivery = (delivery: BackendSocialDelivery): SocialDelivery => {
    return {
      ...delivery,
      destination_id: delivery.destination_id || delivery.channel_id,
    };
  };
  const mapComment = (comment: BackendSocialComment): SocialComment => {
    return {
      ...comment,
      destination_id: comment.destination_id || comment.channel_id,
    };
  };
  const commentPayload = (comment: Partial<SocialComment>) => {
    return comment;
  };
  const mapPostDetail = (
    response: BackendSocialPostDetailResponse,
  ): SocialPostDetailResponse => ({
    post: mapPost(response.post),
    channels: response.channels.map(mapChannel),
    deliveries: response.deliveries.map(mapDelivery),
    comments: response.comments.map(mapComment),
  });
  const mapCommentThread = (
    response: BackendSocialCommentThreadResponse,
  ): SocialCommentThreadResponse => ({
    comment: mapComment(response.comment),
    delivery: mapDelivery(response.delivery),
    channel: mapChannel(response.channel),
    post: response.post ? mapPost(response.post) : null,
    comments: response.comments.map(mapComment),
  });
  const schedulePayload = (targets: SocialPostTargetParams[]) => ({
    targets,
  });
  const withDeliveries = (
    response: BackendSocialPostScheduleResponse,
  ): SocialPostScheduleResponse => ({
    post: mapPost(response.post),
    deliveries: response.deliveries.map(mapDelivery),
  });
  const withCreatedDeliveries = (
    response: BackendSocialDeliveryCreateManyResponse,
  ): SocialDeliveryCreateManyResponse => ({
    deliveries: response.deliveries.map(mapDelivery),
  });
  const withDeliveryComments = (
    response: BackendSocialDeliveryCommentsResponse,
  ): SocialDeliveryCommentsResponse => ({
    delivery: mapDelivery(response.delivery),
    comments: response.comments.map(mapComment),
  });

  return {
    providers: {
      list: async (
        params?: { store_id?: string },
        options?: RequestOptions,
      ): Promise<SocialProviderCapabilities[]> => {
        return apiConfig.httpClient.get<BackendSocialProviderCapabilities[]>(
          `/v1/stores/${storeId(params?.store_id)}/social/providers`,
          options,
        );
      },
      connections: async (
        params?: { store_id?: string },
        options?: RequestOptions,
      ): Promise<SocialProviderConnection[]> => {
        return apiConfig.httpClient.get<BackendSocialProviderConnection[]>(
          `/v1/stores/${storeId(params?.store_id)}/social/providers/connections`,
          options,
        );
      },
      oauthStart: async (
        params: StartSocialProviderOAuthParams,
        options?: RequestOptions,
      ): Promise<SocialProviderOAuthStartResponse> => {
        const { store_id, provider_key, ...payload } = params;
        return apiConfig.httpClient.post<BackendSocialProviderOAuthStartResponse>(
          `/v1/stores/${storeId(store_id)}/social/providers/${provider_key}/oauth/start`,
          payload,
          options,
        );
      },
      oauthCallback: async (
        params: CompleteSocialProviderOAuthParams,
        options?: RequestOptions,
      ): Promise<SocialProviderOAuthCompleteResponse> => {
        const { store_id, provider_key, ...payload } = params;
        return apiConfig.httpClient.post<BackendSocialProviderOAuthCompleteResponse>(
          `/v1/stores/${storeId(store_id)}/social/providers/${provider_key}/oauth/callback`,
          payload,
          options,
        );
      },
      oauthDisconnect: async (
        params: DisconnectSocialProviderOAuthParams,
        options?: RequestOptions,
      ): Promise<SocialProviderOAuthDisconnectResponse> => {
        const { store_id, provider_key, ...payload } = params;
        return apiConfig.httpClient.post<BackendSocialProviderOAuthDisconnectResponse>(
          `/v1/stores/${storeId(store_id)}/social/providers/${provider_key}/oauth/disconnect`,
          payload,
          options,
        );
      },
      sync: async (
        params: SyncSocialProviderParams,
        options?: RequestOptions,
      ): Promise<SocialProviderSyncResponse> => {
        const { store_id, provider_key, ...payload } = params;
        return apiConfig.httpClient.post<BackendSocialProviderSyncResponse>(
          `/v1/stores/${storeId(store_id)}/social/providers/${provider_key}/sync`,
          payload,
          options,
        );
      },
    },
    destinations: {
      find: async (
        params?: FindIntegrationDestinationsParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<IntegrationDestination>> => {
        const { store_id, ...queryParams } = params || {};
        const response = await apiConfig.httpClient.get<
          PaginatedResponse<BackendIntegrationDestination>
        >(
          `/v1/stores/${storeId(store_id)}/social/destinations`,
          { ...options, params: queryParams },
        );
        return mapPage(response, mapDestination);
      },
      create: async (
        params: CreateIntegrationDestinationParams,
        options?: RequestOptions,
      ): Promise<IntegrationDestination> => {
        const { store_id, ...payload } = params;
        const response =
          await apiConfig.httpClient.post<BackendIntegrationDestination>(
            `/v1/stores/${storeId(store_id)}/social/destinations`,
            destinationPayload(payload),
            options,
          );
        return mapDestination(response);
      },
      get: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<IntegrationDestination> => {
        const response =
          await apiConfig.httpClient.get<BackendIntegrationDestination>(
            `/v1/stores/${storeId(params.store_id)}/social/destinations/${params.id}`,
            options,
          );
        return mapDestination(response);
      },
      refresh: async (
        params: SyncIntegrationDestinationsParams = {},
        options?: RequestOptions,
      ): Promise<IntegrationDestination[]> => {
        const { store_id, ...payload } = params;
        const response =
          await apiConfig.httpClient.post<BackendIntegrationDestination[]>(
            `/v1/stores/${storeId(store_id)}/social/destinations/refresh`,
            payload,
            options,
          );
        return response.map(mapDestination);
      },
      update: async (
        params: UpdateIntegrationDestinationParams,
        options?: RequestOptions,
      ): Promise<IntegrationDestination> => {
        const { store_id, id, ...payload } = params;
        const response =
          await apiConfig.httpClient.patch<BackendIntegrationDestination>(
            `/v1/stores/${storeId(store_id)}/social/destinations/${id}`,
            destinationPayload(payload),
            options,
          );
        return mapDestination(response);
      },
    },
    channels: {
      find: async (
        params?: FindSocialChannelsParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<SocialChannel>> => {
        const { store_id, ...queryParams } = params || {};
        const response = await apiConfig.httpClient.get<
          PaginatedResponse<BackendSocialChannel>
        >(
          `/v1/stores/${storeId(store_id)}/social/channels`,
          { ...options, params: queryParams },
        );
        return mapPage(response, mapChannel);
      },
      create: async (
        params: CreateSocialChannelParams,
        options?: RequestOptions,
      ): Promise<SocialChannel> => {
        const { store_id, ...payload } = params;
        const response = await apiConfig.httpClient.post<BackendSocialChannel>(
          `/v1/stores/${storeId(store_id)}/social/channels`,
          channelPayload(payload),
          options,
        );
        return mapChannel(response);
      },
      get: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialChannel> => {
        const response = await apiConfig.httpClient.get<BackendSocialChannel>(
          `/v1/stores/${storeId(params.store_id)}/social/channels/${params.id}`,
          options,
        );
        return mapChannel(response);
      },
      refresh: async (
        params: SyncSocialChannelsParams = {},
        options?: RequestOptions,
      ): Promise<SocialChannel[]> => {
        const { store_id, ...payload } = params;
        const response = await apiConfig.httpClient.post<BackendSocialChannel[]>(
          `/v1/stores/${storeId(store_id)}/social/channels/refresh`,
          payload,
          options,
        );
        return response.map(mapChannel);
      },
      update: async (
        params: UpdateSocialChannelParams,
        options?: RequestOptions,
      ): Promise<SocialChannel> => {
        const { store_id, id, ...payload } = params;
        const response = await apiConfig.httpClient.patch<BackendSocialChannel>(
          `/v1/stores/${storeId(store_id)}/social/channels/${id}`,
          channelPayload(payload),
          options,
        );
        return mapChannel(response);
      },
    },
    planner: {
      list: async (
        params?: FindSocialPostsParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<SocialPost>> => {
        const { store_id, ...queryParams } = params || {};
        const response = await apiConfig.httpClient.get<
          PaginatedResponse<BackendSocialPost>
        >(
          `/v1/stores/${storeId(store_id)}/social/planner`,
          { ...options, params: queryParams },
        );
        return mapPage(response, mapPost);
      },
    },
    deliveries: {
      createMany: async (
        params: CreateSocialDeliveriesParams,
        options?: RequestOptions,
      ): Promise<SocialDeliveryCreateManyResponse> => {
        const { store_id, deliveries } = params;
        const response =
          await apiConfig.httpClient.post<BackendSocialDeliveryCreateManyResponse>(
            `/v1/stores/${storeId(store_id)}/social/deliveries/create`,
            {
              deliveries: deliveries.map((delivery) => ({
                ...delivery,
                store_id: storeId(delivery.store_id || store_id),
                hashtags: delivery.hashtags || [],
                mentions: delivery.mentions || [],
                media_ids: delivery.media_ids || [],
                publish_now: delivery.publish_now || false,
              })),
            },
            options,
          );
        return withCreatedDeliveries(response);
      },
      find: async (
        params?: FindSocialDeliveriesParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<SocialDelivery>> => {
        const { store_id, destination_id, channel_id, ...queryParams } =
          params || {};
        const response = await apiConfig.httpClient.get<
          PaginatedResponse<BackendSocialDelivery>
        >(
          `/v1/stores/${storeId(store_id)}/social/deliveries`,
          {
            ...options,
            params: {
              ...queryParams,
              destination_id: destination_id || channel_id,
            },
          },
        );
        return mapPage(response, mapDelivery);
      },
      get: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialDelivery> => {
        const response = await apiConfig.httpClient.get<BackendSocialDelivery>(
          `/v1/stores/${storeId(params.store_id)}/social/deliveries/${params.id}`,
          options,
        );
        return mapDelivery(response);
      },
      publish: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialDelivery> => {
        const response = await apiConfig.httpClient.post<BackendSocialDelivery>(
          `/v1/stores/${storeId(params.store_id)}/social/deliveries/${params.id}/publish`,
          {},
          options,
        );
        return mapDelivery(response);
      },
      retry: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialDelivery> => {
        const response = await apiConfig.httpClient.post<BackendSocialDelivery>(
          `/v1/stores/${storeId(params.store_id)}/social/deliveries/${params.id}/retry`,
          {},
          options,
        );
        return mapDelivery(response);
      },
      refreshMetrics: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialDelivery> => {
        const response = await apiConfig.httpClient.post<BackendSocialDelivery>(
          `/v1/stores/${storeId(params.store_id)}/social/deliveries/${params.id}/refresh-metrics`,
          {},
          options,
        );
        return mapDelivery(response);
      },
      syncComments: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialDeliveryCommentsResponse> => {
        const response =
          await apiConfig.httpClient.post<BackendSocialDeliveryCommentsResponse>(
          `/v1/stores/${storeId(params.store_id)}/social/deliveries/${params.id}/sync-comments`,
          {},
          options,
        );
        return withDeliveryComments(response);
      },
      cancel: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialDelivery> => {
        const response = await apiConfig.httpClient.post<BackendSocialDelivery>(
          `/v1/stores/${storeId(params.store_id)}/social/deliveries/${params.id}/cancel`,
          {},
          options,
        );
        return mapDelivery(response);
      },
    },
    community: {
      list: async (
        params?: SearchSocialCommentsParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<SocialComment>> => {
        const {
          store_id,
          delivery_id,
          destination_id,
          channel_id,
          ...queryParams
        } = params || {};
        const response = await apiConfig.httpClient.get<
          PaginatedResponse<BackendSocialComment>
        >(
          `/v1/stores/${storeId(store_id)}/social/community`,
          {
            ...options,
            params: {
              ...queryParams,
              delivery_id,
              destination_id: destination_id || channel_id,
            },
          },
        );
        return mapPage(response, mapComment);
      },
      create: async (
        params: CreateSocialCommentParams,
        options?: RequestOptions,
      ): Promise<SocialComment> => {
        const { store_id, ...payload } = params;
        const response = await apiConfig.httpClient.post<BackendSocialComment>(
          `/v1/stores/${storeId(store_id)}/social/community/comments`,
          commentPayload(payload),
          options,
        );
        return mapComment(response);
      },
      get: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialCommentThreadResponse> => {
        const response =
          await apiConfig.httpClient.get<BackendSocialCommentThreadResponse>(
          `/v1/stores/${storeId(params.store_id)}/social/community/comments/${params.id}`,
          options,
        );
        return mapCommentThread(response);
      },
      reply: async (
        params: ReplySocialCommentParams,
        options?: RequestOptions,
      ): Promise<SocialComment> => {
        const { store_id, id, ...payload } = params;
        const response = await apiConfig.httpClient.post<BackendSocialComment>(
          `/v1/stores/${storeId(store_id)}/social/community/comments/${id}/reply`,
          payload,
          options,
        );
        return mapComment(response);
      },
      archive: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialComment> => {
        const response = await apiConfig.httpClient.post<BackendSocialComment>(
          `/v1/stores/${storeId(params.store_id)}/social/community/comments/${params.id}/archive`,
          {},
          options,
        );
        return mapComment(response);
      },
      hide: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialComment> => {
        const response = await apiConfig.httpClient.post<BackendSocialComment>(
          `/v1/stores/${storeId(params.store_id)}/social/community/comments/${params.id}/hide`,
          {},
          options,
        );
        return mapComment(response);
      },
      resolve: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialComment> => {
        const response = await apiConfig.httpClient.post<BackendSocialComment>(
          `/v1/stores/${storeId(params.store_id)}/social/community/comments/${params.id}/resolve`,
          {},
          options,
        );
        return mapComment(response);
      },
    },
    insights: {
      get: async (
        params?: FindSocialPostsParams,
        options?: RequestOptions,
      ): Promise<SocialInsightsResponse> => {
        const { store_id, ...queryParams } = params || {};
        return apiConfig.httpClient.get<SocialInsightsResponse>(
          `/v1/stores/${storeId(store_id)}/social/insights`,
          { ...options, params: queryParams },
        );
      },
    },
    posts: {
      find: async (
        params?: FindSocialPostsParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<SocialPost>> => {
        const { store_id, ...queryParams } = params || {};
        const response = await apiConfig.httpClient.get<
          PaginatedResponse<BackendSocialPost>
        >(
          `/v1/stores/${storeId(store_id)}/social/posts`,
          { ...options, params: queryParams },
        );
        return mapPage(response, mapPost);
      },
      create: async (
        params: CreateSocialPostParams,
        options?: RequestOptions,
      ): Promise<SocialPost> => {
        const { store_id, ...payload } = params;
        const response = await apiConfig.httpClient.post<BackendSocialPost>(
          `/v1/stores/${storeId(store_id)}/social/posts`,
          postPayload(payload),
          options,
        );
        return mapPost(response);
      },
      createDraft: async (
        params: CreateSocialPostParams,
        options?: RequestOptions,
      ): Promise<SocialPost> => {
        const { store_id, ...payload } = params;
        const response = await apiConfig.httpClient.post<BackendSocialPost>(
          `/v1/stores/${storeId(store_id)}/social/posts`,
          { ...postPayload(payload), status: payload.status || "draft" },
          options,
        );
        return mapPost(response);
      },
      get: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialPost> => {
        const response = await apiConfig.httpClient.get<BackendSocialPost>(
          `/v1/stores/${storeId(params.store_id)}/social/posts/${params.id}`,
          options,
        );
        return mapPost(response);
      },
      getDetail: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialPostDetailResponse> => {
        const response =
          await apiConfig.httpClient.get<BackendSocialPostDetailResponse>(
          `/v1/stores/${storeId(params.store_id)}/social/posts/${params.id}/detail`,
          options,
        );
        return mapPostDetail(response);
      },
      update: async (
        params: UpdateSocialPostParams,
        options?: RequestOptions,
      ): Promise<SocialPost> => {
        const { store_id, id, ...payload } = params;
        const response = await apiConfig.httpClient.put<BackendSocialPost>(
          `/v1/stores/${storeId(store_id)}/social/posts/${id}`,
          postPayload(payload),
          options,
        );
        return mapPost(response);
      },
      upsertVariant: async (
        params: UpsertSocialPostVariantParams,
        options?: RequestOptions,
      ): Promise<SocialPost> => {
        const { store_id, id, variant_id, ...payload } = params;
        if (variant_id) {
          const response = await apiConfig.httpClient.put<BackendSocialPost>(
            `/v1/stores/${storeId(store_id)}/social/posts/${id}/variants/${variant_id}`,
            payload,
            options,
          );
          return mapPost(response);
        }
        const response = await apiConfig.httpClient.post<BackendSocialPost>(
          `/v1/stores/${storeId(store_id)}/social/posts/${id}/variants`,
          payload,
          options,
        );
        return mapPost(response);
      },
      schedule: async (
        params: ScheduleSocialPostParams,
        options?: RequestOptions,
      ): Promise<SocialPostScheduleResponse> => {
        const { store_id, id, targets } = params;
        const response =
          await apiConfig.httpClient.post<BackendSocialPostScheduleResponse>(
            `/v1/stores/${storeId(store_id)}/social/posts/${id}/schedule`,
            schedulePayload(targets),
            options,
          );
        return withDeliveries(response);
      },
      sendNow: async (
        params: ScheduleSocialPostParams,
        options?: RequestOptions,
      ): Promise<SocialPostScheduleResponse> => {
        const { store_id, id, targets } = params;
        const response =
          await apiConfig.httpClient.post<BackendSocialPostScheduleResponse>(
            `/v1/stores/${storeId(store_id)}/social/posts/${id}/send-now`,
            schedulePayload(targets),
            options,
        );
        return withDeliveries(response);
      },
      reschedule: async (
        params: RescheduleSocialPostParams,
        options?: RequestOptions,
      ): Promise<SocialPostScheduleResponse> => {
        const { store_id, id, ...payload } = params;
        const response =
          await apiConfig.httpClient.post<BackendSocialPostScheduleResponse>(
            `/v1/stores/${storeId(store_id)}/social/posts/${id}/reschedule`,
            payload,
            options,
          );
        return withDeliveries(response);
      },
      archive: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialPost> => {
        const response = await apiConfig.httpClient.post<BackendSocialPost>(
          `/v1/stores/${storeId(params.store_id)}/social/posts/${params.id}/archive`,
          {},
          options,
        );
        return mapPost(response);
      },
    },
  };
};
