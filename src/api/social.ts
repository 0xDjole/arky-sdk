import type { ApiConfig } from "../index";
import type { PaginatedResponse } from "../types";
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

export type SocialAccountType =
  | "profile"
  | "page"
  | "business"
  | "channel"
  | "organization"
  | "unknown";
export type SocialAccountStatus =
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
export type SocialPublicationStatus =
  | "scheduled"
  | "sending"
  | "posted"
  | "failed"
  | "hard_failed"
  | "cancelled";
export type SocialMessageDirection = "inbound" | "outbound" | "activity";
export type SocialMessageType =
  | "comment"
  | "comment_reply"
  | "manual_reply"
  | "generated_reply"
  | "provider_activity";
export type SocialMessageStatus =
  | "pending"
  | "sending"
  | "sent"
  | "received"
  | "failed"
  | "hidden"
  | "deleted"
  | "skipped";
export type SocialMessageWorkflowStatus = "open" | "replied" | "archived";
export type SocialMessageCopySource =
  | "provider"
  | "edited"
  | "generated"
  | "template";

export interface SocialAccount {
  id: string;
  store_id: string;
  integration_id?: string | null;
  platform: SocialPlatform;
  platform_account_id: string;
  account_type: SocialAccountType;
  display_name: string;
  username?: string | null;
  avatar_url?: string | null;
  permissions: string[];
  status: SocialAccountStatus;
  metadata?: Record<string, unknown> | null;
  created_at: number;
  updated_at: number;
}

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
  source_copy: string;
  goal?: string | null;
  link_url?: string | null;
  media_ids: string[];
  base_timezone: string;
  status: SocialPostStatus;
  taxonomies?: Record<string, unknown> | null;
  variants: SocialPostVariant[];
  created_at: number;
  updated_at: number;
}

export interface SocialPublicationVariantSnapshot {
  variant_id: string;
  copy: string;
  hashtags: string[];
  mentions: string[];
  link_url?: string | null;
  cta?: string | null;
  media_ids: string[];
  settings?: Record<string, unknown> | null;
}

export interface SocialPublicationMetrics {
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

export interface SocialPublication {
  id: string;
  store_id: string;
  post_id: string;
  variant_id: string;
  account_id: string;
  platform: SocialPlatform;
  scheduled_at: number;
  status: SocialPublicationStatus;
  attempt_count: number;
  last_attempt_at?: number | null;
  next_retry_at?: number | null;
  last_error_code?: string | null;
  last_error_message?: string | null;
  provider_publication_id?: string | null;
  provider_thread_id?: string | null;
  published_url?: string | null;
  published_at?: number | null;
  latest_metrics: SocialPublicationMetrics;
  variant_snapshot: SocialPublicationVariantSnapshot;
  metadata?: Record<string, unknown> | null;
  created_at: number;
  updated_at: number;
}

export interface SocialActorRef {
  provider_actor_id?: string | null;
  display_name?: string | null;
  handle?: string | null;
  avatar_url?: string | null;
  profile_url?: string | null;
  linked_profile_id?: string | null;
}

export interface SocialMessage {
  id: string;
  store_id: string;
  platform: SocialPlatform;
  account_id: string;
  publication_id: string;
  root_message_id?: string | null;
  parent_message_id?: string | null;
  provider_message_id?: string | null;
  provider_parent_message_id?: string | null;
  direction: SocialMessageDirection;
  type: SocialMessageType;
  status: SocialMessageStatus;
  workflow_status?: SocialMessageWorkflowStatus | null;
  author: SocialActorRef;
  body: string;
  attachments: string[];
  permalink?: string | null;
  in_reply_to_message_id?: string | null;
  copy_source: SocialMessageCopySource;
  error?: string | null;
  sent_at?: number | null;
  received_at?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at: number;
  updated_at: number;
}

export interface SocialPostScheduleResponse {
  post: SocialPost;
  publications: SocialPublication[];
}

export interface SocialPublicationMessagesResponse {
  publication: SocialPublication;
  messages: SocialMessage[];
}

type SocialSortDirection = "asc" | "desc";

export type FindSocialAccountsParams = {
  store_id?: string;
  query?: string;
  platform?: SocialPlatform;
  status?: SocialAccountStatus;
  sort_field?: string;
  sort_direction?: SocialSortDirection;
  limit?: number;
  cursor?: string;
};

export type CreateSocialAccountParams = Partial<SocialAccount> & {
  store_id?: string;
  platform: SocialPlatform;
  platform_account_id: string;
  account_type: SocialAccountType;
  display_name: string;
};

export type SyncSocialAccountsParams = {
  store_id?: string;
  integration_id?: string;
  platforms?: SocialPlatform[];
  allow_fake_provider?: boolean;
};

export type UpdateSocialAccountParams = Partial<SocialAccount> & {
  store_id?: string;
  id: string;
};

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
  source_copy: string;
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

export type ScheduleSocialPostParams = {
  store_id?: string;
  id: string;
  targets: Array<{
    account_id: string;
    variant_id: string;
    scheduled_at?: number;
  }>;
};

export type FindSocialPublicationsParams = {
  store_id?: string;
  query?: string;
  post_id?: string;
  account_id?: string;
  platform?: SocialPlatform;
  status?: SocialPublicationStatus;
  sort_field?: string;
  sort_direction?: SocialSortDirection;
  limit?: number;
  cursor?: string;
};

export type GetSocialEntityParams = {
  store_id?: string;
  id: string;
};

export type FindSocialMessagesParams = {
  store_id?: string;
  publication_id: string;
  limit?: number;
  after_created_at?: number;
  after_id?: string;
};

export type SearchSocialMessagesParams = {
  store_id?: string;
  query?: string;
  publication_id?: string;
  account_id?: string;
  platform?: SocialPlatform;
  status?: SocialMessageStatus;
  workflow_status?: SocialMessageWorkflowStatus;
  sort_field?: string;
  sort_direction?: SocialSortDirection;
  limit?: number;
  cursor?: string;
};

export type CreateSocialMessageParams = Partial<SocialMessage> & {
  store_id?: string;
  publication_id: string;
  body: string;
};

export type ReplySocialMessageParams = {
  store_id?: string;
  publication_id: string;
  message_id: string;
  body: string;
  attachments?: string[];
  metadata?: Record<string, unknown>;
};

export const createSocialApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;

  return {
    accounts: {
      find: async (
        params?: FindSocialAccountsParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<SocialAccount>> => {
        const { store_id, ...queryParams } = params || {};
        return apiConfig.httpClient.get<PaginatedResponse<SocialAccount>>(
          `/v1/stores/${storeId(store_id)}/social/accounts`,
          { ...options, params: queryParams },
        );
      },
      create: async (
        params: CreateSocialAccountParams,
        options?: RequestOptions,
      ): Promise<SocialAccount> => {
        const { store_id, ...payload } = params;
        return apiConfig.httpClient.post<SocialAccount>(
          `/v1/stores/${storeId(store_id)}/social/accounts`,
          payload,
          options,
        );
      },
      sync: async (
        params: SyncSocialAccountsParams = {},
        options?: RequestOptions,
      ): Promise<SocialAccount[]> => {
        const { store_id, ...payload } = params;
        return apiConfig.httpClient.post<SocialAccount[]>(
          `/v1/stores/${storeId(store_id)}/social/accounts/sync`,
          payload,
          options,
        );
      },
      update: async (
        params: UpdateSocialAccountParams,
        options?: RequestOptions,
      ): Promise<SocialAccount> => {
        const { store_id, id, ...payload } = params;
        return apiConfig.httpClient.patch<SocialAccount>(
          `/v1/stores/${storeId(store_id)}/social/accounts/${id}`,
          payload,
          options,
        );
      },
    },
    posts: {
      find: async (
        params?: FindSocialPostsParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<SocialPost>> => {
        const { store_id, ...queryParams } = params || {};
        return apiConfig.httpClient.get<PaginatedResponse<SocialPost>>(
          `/v1/stores/${storeId(store_id)}/social/posts`,
          { ...options, params: queryParams },
        );
      },
      create: async (
        params: CreateSocialPostParams,
        options?: RequestOptions,
      ): Promise<SocialPost> => {
        const { store_id, ...payload } = params;
        return apiConfig.httpClient.post<SocialPost>(
          `/v1/stores/${storeId(store_id)}/social/posts`,
          payload,
          options,
        );
      },
      get: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialPost> => {
        return apiConfig.httpClient.get<SocialPost>(
          `/v1/stores/${storeId(params.store_id)}/social/posts/${params.id}`,
          options,
        );
      },
      update: async (
        params: UpdateSocialPostParams,
        options?: RequestOptions,
      ): Promise<SocialPost> => {
        const { store_id, id, ...payload } = params;
        return apiConfig.httpClient.put<SocialPost>(
          `/v1/stores/${storeId(store_id)}/social/posts/${id}`,
          payload,
          options,
        );
      },
      upsertVariant: async (
        params: UpsertSocialPostVariantParams,
        options?: RequestOptions,
      ): Promise<SocialPost> => {
        const { store_id, id, variant_id, ...payload } = params;
        if (variant_id) {
          return apiConfig.httpClient.put<SocialPost>(
            `/v1/stores/${storeId(store_id)}/social/posts/${id}/variants/${variant_id}`,
            payload,
            options,
          );
        }
        return apiConfig.httpClient.post<SocialPost>(
          `/v1/stores/${storeId(store_id)}/social/posts/${id}/variants`,
          payload,
          options,
        );
      },
      schedule: async (
        params: ScheduleSocialPostParams,
        options?: RequestOptions,
      ): Promise<SocialPostScheduleResponse> => {
        const { store_id, id, ...payload } = params;
        return apiConfig.httpClient.post<SocialPostScheduleResponse>(
          `/v1/stores/${storeId(store_id)}/social/posts/${id}/schedule`,
          payload,
          options,
        );
      },
      publishNow: async (
        params: ScheduleSocialPostParams,
        options?: RequestOptions,
      ): Promise<SocialPostScheduleResponse> => {
        const { store_id, id, ...payload } = params;
        return apiConfig.httpClient.post<SocialPostScheduleResponse>(
          `/v1/stores/${storeId(store_id)}/social/posts/${id}/publish-now`,
          payload,
          options,
        );
      },
    },
    publications: {
      find: async (
        params?: FindSocialPublicationsParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<SocialPublication>> => {
        const { store_id, ...queryParams } = params || {};
        return apiConfig.httpClient.get<PaginatedResponse<SocialPublication>>(
          `/v1/stores/${storeId(store_id)}/social/publications`,
          { ...options, params: queryParams },
        );
      },
      get: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialPublication> => {
        return apiConfig.httpClient.get<SocialPublication>(
          `/v1/stores/${storeId(params.store_id)}/social/publications/${params.id}`,
          options,
        );
      },
      publish: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialPublication> => {
        return apiConfig.httpClient.post<SocialPublication>(
          `/v1/stores/${storeId(params.store_id)}/social/publications/${params.id}/publish`,
          {},
          options,
        );
      },
      retry: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialPublication> => {
        return apiConfig.httpClient.post<SocialPublication>(
          `/v1/stores/${storeId(params.store_id)}/social/publications/${params.id}/retry`,
          {},
          options,
        );
      },
      cancel: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialPublication> => {
        return apiConfig.httpClient.post<SocialPublication>(
          `/v1/stores/${storeId(params.store_id)}/social/publications/${params.id}/cancel`,
          {},
          options,
        );
      },
    },
    messages: {
      search: async (
        params?: SearchSocialMessagesParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<SocialMessage>> => {
        const { store_id, ...queryParams } = params || {};
        return apiConfig.httpClient.get<PaginatedResponse<SocialMessage>>(
          `/v1/stores/${storeId(store_id)}/social/messages`,
          { ...options, params: queryParams },
        );
      },
      find: async (
        params: FindSocialMessagesParams,
        options?: RequestOptions,
      ): Promise<SocialPublicationMessagesResponse> => {
        const { store_id, publication_id, ...queryParams } = params;
        return apiConfig.httpClient.get<SocialPublicationMessagesResponse>(
          `/v1/stores/${storeId(store_id)}/social/publications/${publication_id}/messages`,
          { ...options, params: queryParams },
        );
      },
      create: async (
        params: CreateSocialMessageParams,
        options?: RequestOptions,
      ): Promise<SocialMessage> => {
        const { store_id, publication_id, ...payload } = params;
        return apiConfig.httpClient.post<SocialMessage>(
          `/v1/stores/${storeId(store_id)}/social/publications/${publication_id}/messages`,
          payload,
          options,
        );
      },
      reply: async (
        params: ReplySocialMessageParams,
        options?: RequestOptions,
      ): Promise<SocialMessage> => {
        const { store_id, publication_id, message_id, ...payload } = params;
        return apiConfig.httpClient.post<SocialMessage>(
          `/v1/stores/${storeId(store_id)}/social/publications/${publication_id}/messages/${message_id}/reply`,
          payload,
          options,
        );
      },
      archive: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialMessage> => {
        return apiConfig.httpClient.post<SocialMessage>(
          `/v1/stores/${storeId(params.store_id)}/social/messages/${params.id}/archive`,
          {},
          options,
        );
      },
      hide: async (
        params: GetSocialEntityParams,
        options?: RequestOptions,
      ): Promise<SocialMessage> => {
        return apiConfig.httpClient.post<SocialMessage>(
          `/v1/stores/${storeId(params.store_id)}/social/messages/${params.id}/hide`,
          {},
          options,
        );
      },
    },
  };
};
