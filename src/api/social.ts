import type { ApiConfig } from "../services/clientTypes";
import type {
  CancelSocialPostParams,
  ConnectSocialConnectionParams,
  CreateSocialMessageParams,
  CreateSocialPostParams,
  DisconnectSocialConnectionParams,
  FindSocialConnectionsParams,
  FindSocialMessagesParams,
  FindSocialPostsParams,
  GetSocialPostParams,
  RequestOptions,
  SyncSocialMessagesParams,
} from "../types/api";
import type {
  PaginatedResponse,
  SocialConnectResult,
  SocialConnection,
  SocialMessage,
  SocialMessageSyncResult,
  SocialPost,
} from "../types";

export const createSocialApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;

  const connections = {
    async find(
      params?: FindSocialConnectionsParams,
      options?: RequestOptions,
    ): Promise<SocialConnection[]> {
      return apiConfig.httpClient.get<SocialConnection[]>(
        `/v1/stores/${storeId(params?.store_id)}/social/connections`,
        options,
      );
    },

    async connect(
      params: ConnectSocialConnectionParams,
      options?: RequestOptions,
    ): Promise<SocialConnectResult> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<SocialConnectResult>(
        `/v1/stores/${storeId(store_id)}/social/connections/connect`,
        payload,
        options,
      );
    },

    async disconnect(
      params: DisconnectSocialConnectionParams,
      options?: RequestOptions,
    ): Promise<SocialConnection> {
      const { store_id, connection_id } = params;
      return apiConfig.httpClient.post<SocialConnection>(
        `/v1/stores/${storeId(store_id)}/social/connections/${connection_id}/disconnect`,
        {},
        options,
      );
    },
  };

  const messages = {
    async find(
      params: FindSocialMessagesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SocialMessage>> {
      const { store_id, post_id, ...queryParams } = params;
      return apiConfig.httpClient.get<PaginatedResponse<SocialMessage>>(
        `/v1/stores/${storeId(store_id)}/social/posts/${post_id}/messages`,
        { ...options, params: queryParams },
      );
    },

    async create(
      params: CreateSocialMessageParams,
      options?: RequestOptions,
    ): Promise<SocialMessage> {
      const { store_id, post_id, ...payload } = params;
      return apiConfig.httpClient.post<SocialMessage>(
        `/v1/stores/${storeId(store_id)}/social/posts/${post_id}/messages`,
        payload,
        options,
      );
    },

    async sync(
      params: SyncSocialMessagesParams,
      options?: RequestOptions,
    ): Promise<SocialMessageSyncResult> {
      const { store_id, post_id, ...payload } = params;
      return apiConfig.httpClient.post<SocialMessageSyncResult>(
        `/v1/stores/${storeId(store_id)}/social/posts/${post_id}/messages/sync`,
        payload,
        options,
      );
    },
  };

  const posts = {
    async find(
      params?: FindSocialPostsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SocialPost>> {
      const { store_id, ...queryParams } = params || {};
      return apiConfig.httpClient.get<PaginatedResponse<SocialPost>>(
        `/v1/stores/${storeId(store_id)}/social/posts`,
        { ...options, params: queryParams },
      );
    },

    async create(
      params: CreateSocialPostParams,
      options?: RequestOptions,
    ): Promise<SocialPost> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<SocialPost>(
        `/v1/stores/${storeId(store_id)}/social/posts`,
        payload,
        options,
      );
    },

    async get(
      params: GetSocialPostParams,
      options?: RequestOptions,
    ): Promise<SocialPost> {
      return apiConfig.httpClient.get<SocialPost>(
        `/v1/stores/${storeId(params.store_id)}/social/posts/${params.post_id}`,
        options,
      );
    },

    async cancel(
      params: CancelSocialPostParams,
      options?: RequestOptions,
    ): Promise<SocialPost> {
      return apiConfig.httpClient.post<SocialPost>(
        `/v1/stores/${storeId(params.store_id)}/social/posts/${params.post_id}/cancel`,
        {},
        options,
      );
    },

    messages,
  };

  return { connections, posts };
};
