import type { ApiConfig } from "../index";
import type {
  RequestOptions,
  CreateProfileParams,
  UpdateProfileParams,
  GetProfileParams,
  FindProfilesParams,
  MergeProfilesParams,
  Profile,
  ProfileDetail,
  CreateAudienceParams,
  UpdateAudienceParams,
  GetAudienceParams,
  GetAudiencesParams,
  GetAudienceSubscribersParams,
  RemoveAudienceSubscriberParams,
  AddAudienceSubscriberParams,
  AddAudienceSubscriberResponse,
  AudienceSubscriber,
  FindActivitiesParams,
  CreateProfileListParams,
  UpdateProfileListParams,
  FindProfileListsParams,
  GetProfileListParams,
  AddProfileListMemberParams,
  RemoveProfileListMemberParams,
  FindProfileListMembersParams,
  CreateProfileListImportParams,
  FindProfileListImportsParams,
  CreateMailboxParams,
  UpdateMailboxParams,
  FindMailboxesParams,
  GetMailboxParams,
  CreateOutreachCampaignParams,
  UpdateOutreachCampaignParams,
  FindOutreachCampaignsParams,
  GetOutreachCampaignParams,
  LaunchOutreachCampaignParams,
  FindOutreachEnrollmentsParams,
  FindOutreachMessagesParams,
  InjectOutreachReplyParams,
  FindOutreachRepliesParams,
  CreateSuppressionParams,
  UpdateSuppressionParams,
  FindSuppressionsParams,
  GetSuppressionParams,
} from "../types/api";
import type {
  Audience,
  Mailbox,
  OutreachCampaign,
  OutreachEnrollment,
  OutreachMessage,
  OutreachReply,
  PaginatedResponse,
  ProfileList,
  ProfileListImport,
  ProfileListMember,
  Suppression,
} from "../types";

export interface Activity {
  id: string;
  store_id: string;
  profile_id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: number;
  country_code?: string | null;
  city?: string | null;
  region?: string | null;
  timezone?: string | null;
  device_type?: string | null;
  browser?: string | null;
  os?: string | null;
  language?: string | null;
  session_idx?: number | null;
}

export interface TimelineParams {
  profile_id: string;
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export const createActivityAdminApi = (apiConfig: ApiConfig) => ({
  async timeline(params: TimelineParams, options?: RequestOptions): Promise<{ items: Activity[]; cursor: string | null }> {
    const store_id = params.store_id || apiConfig.storeId;
    const queryParams: Record<string, unknown> = { profile_id: params.profile_id };
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;
    return apiConfig.httpClient.get<{ items: Activity[]; cursor: string | null }>(
      `/v1/stores/${store_id}/activities/timeline`,
      { ...options, params: queryParams },
    );
  },

  async find(params: FindActivitiesParams, options?: RequestOptions): Promise<{ items: Activity[]; cursor: string | null }> {
    const store_id = params.store_id || apiConfig.storeId;
    const queryParams: Record<string, unknown> = {};
    if (params.profile_id) queryParams.profile_id = params.profile_id;
    if (params.types && params.types.length > 0) queryParams.types = params.types;
    if (params.from !== undefined) queryParams.from = params.from;
    if (params.to !== undefined) queryParams.to = params.to;
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;
    return apiConfig.httpClient.get<{ items: Activity[]; cursor: string | null }>(
      `/v1/stores/${store_id}/activities`,
      { ...options, params: queryParams }
    );
  },
});

export const createProfileApi = (apiConfig: ApiConfig) => {
  return {
    async create(params: CreateProfileParams, options?: RequestOptions): Promise<Profile> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Profile>(
        `/v1/stores/${store_id || apiConfig.storeId}/profiles`,
        payload,
        options
      );
    },

    async get(params: GetProfileParams, options?: RequestOptions): Promise<ProfileDetail> {
      return apiConfig.httpClient.get<ProfileDetail>(
        `/v1/stores/${params.store_id || apiConfig.storeId}/profiles/${params.id}`,
        options
      );
    },

    async find(params?: FindProfilesParams, options?: RequestOptions): Promise<{ items: Profile[]; cursor?: string }> {
      const store_id = params?.store_id || apiConfig.storeId;
      const queryParams: Record<string, unknown> = {};

      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.cursor) queryParams.cursor = params.cursor;
      if (params?.query) queryParams.query = params.query;
      if (params?.taxonomy_query) queryParams.taxonomy_query = params.taxonomy_query;
      if (params?.status) queryParams.status = params.status;
      if (params?.has_activity !== undefined) queryParams.has_activity = params.has_activity;
      if (params?.has_cart !== undefined) queryParams.has_cart = params.has_cart;
      if (params?.sort_field) queryParams.sort_field = params.sort_field;
      if (params?.sort_direction) queryParams.sort_direction = params.sort_direction;

      return apiConfig.httpClient.get<{ items: Profile[]; cursor?: string }>(
        `/v1/stores/${store_id}/profiles`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async update(params: UpdateProfileParams, options?: RequestOptions): Promise<Profile> {
      const { id, store_id, ...body } = params;
      return apiConfig.httpClient.put<Profile>(
        `/v1/stores/${store_id || apiConfig.storeId}/profiles/${id}`,
        body,
        options
      );
    },

    async merge(params: MergeProfilesParams, options?: RequestOptions): Promise<Profile> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Profile>(
        `/v1/stores/${store_id}/profiles/${params.target_id}/merge`,
        { source_id: params.source_id, store_id },
        options
      );
    },

    async revokeToken(params: { id: string; token_id: string; store_id?: string }, options?: RequestOptions): Promise<{ deleted: boolean }> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${store_id}/profiles/${params.id}/sessions/${params.token_id}`,
        options
      );
    },

    async revokeAllTokens(params: { id: string; store_id?: string }, options?: RequestOptions): Promise<{ deleted: boolean }> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${store_id}/profiles/${params.id}/sessions`,
        options
      );
    },

    profileList: {
      async create(params: CreateProfileListParams, options?: RequestOptions): Promise<ProfileList> {
        const { store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<ProfileList>(
          `/v1/stores/${target_store_id}/profile-lists`,
          payload,
          options,
        );
      },

      async update(params: UpdateProfileListParams, options?: RequestOptions): Promise<ProfileList> {
        const { id, store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.put<ProfileList>(
          `/v1/stores/${target_store_id}/profile-lists/${id}`,
          payload,
          options,
        );
      },

      async get(params: GetProfileListParams, options?: RequestOptions): Promise<ProfileList> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<ProfileList>(
          `/v1/stores/${target_store_id}/profile-lists/${params.id}`,
          options,
        );
      },

      async find(params?: FindProfileListsParams, options?: RequestOptions): Promise<PaginatedResponse<ProfileList>> {
        const { store_id, ...queryParams } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<ProfileList>>(
          `/v1/stores/${target_store_id}/profile-lists`,
          { ...options, params: queryParams },
        );
      },
    },

    profileListMember: {
      async add(params: AddProfileListMemberParams, options?: RequestOptions): Promise<ProfileListMember> {
        const { store_id, profile_list_id, profile_id, fields } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<ProfileListMember>(
          `/v1/stores/${target_store_id}/profile-lists/${profile_list_id}/members/${profile_id}`,
          { fields },
          options,
        );
      },

      async remove(params: RemoveProfileListMemberParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.delete<{ deleted: boolean }>(
          `/v1/stores/${target_store_id}/profile-lists/${params.profile_list_id}/members/${params.profile_id}`,
          options,
        );
      },

      async find(params: FindProfileListMembersParams, options?: RequestOptions): Promise<PaginatedResponse<ProfileListMember>> {
        const { store_id, profile_list_id, ...queryParams } = params;
        const target_store_id = store_id || apiConfig.storeId;
        const path = profile_list_id
          ? `/v1/stores/${target_store_id}/profile-lists/${profile_list_id}/members`
          : `/v1/stores/${target_store_id}/profile-list-members`;
        return apiConfig.httpClient.get<PaginatedResponse<ProfileListMember>>(
          path,
          { ...options, params: queryParams },
        );
      },
    },

    profileListImport: {
      async create(params: CreateProfileListImportParams, options?: RequestOptions): Promise<ProfileListImport> {
        const { store_id, profile_list_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<ProfileListImport>(
          `/v1/stores/${target_store_id}/profile-lists/${profile_list_id}/imports`,
          payload,
          options,
        );
      },

      async find(params: FindProfileListImportsParams, options?: RequestOptions): Promise<PaginatedResponse<ProfileListImport>> {
        const { store_id, profile_list_id, ...queryParams } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<ProfileListImport>>(
          `/v1/stores/${target_store_id}/profile-lists/${profile_list_id}/imports`,
          { ...options, params: queryParams },
        );
      },
    },

    mailbox: {
      async create(params: CreateMailboxParams, options?: RequestOptions): Promise<Mailbox> {
        const { store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<Mailbox>(
          `/v1/stores/${target_store_id}/mailboxes`,
          payload,
          options,
        );
      },

      async update(params: UpdateMailboxParams, options?: RequestOptions): Promise<Mailbox> {
        const { id, store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.put<Mailbox>(
          `/v1/stores/${target_store_id}/mailboxes/${id}`,
          payload,
          options,
        );
      },

      async get(params: GetMailboxParams, options?: RequestOptions): Promise<Mailbox> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<Mailbox>(
          `/v1/stores/${target_store_id}/mailboxes/${params.id}`,
          options,
        );
      },

      async find(params?: FindMailboxesParams, options?: RequestOptions): Promise<PaginatedResponse<Mailbox>> {
        const { store_id, ...queryParams } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<Mailbox>>(
          `/v1/stores/${target_store_id}/mailboxes`,
          { ...options, params: queryParams },
        );
      },
    },

    outreachCampaign: {
      async create(params: CreateOutreachCampaignParams, options?: RequestOptions): Promise<OutreachCampaign> {
        const { store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<OutreachCampaign>(
          `/v1/stores/${target_store_id}/outreach-campaigns`,
          payload,
          options,
        );
      },

      async update(params: UpdateOutreachCampaignParams, options?: RequestOptions): Promise<OutreachCampaign> {
        const { id, store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.put<OutreachCampaign>(
          `/v1/stores/${target_store_id}/outreach-campaigns/${id}`,
          payload,
          options,
        );
      },

      async get(params: GetOutreachCampaignParams, options?: RequestOptions): Promise<OutreachCampaign> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<OutreachCampaign>(
          `/v1/stores/${target_store_id}/outreach-campaigns/${params.id}`,
          options,
        );
      },

      async find(params?: FindOutreachCampaignsParams, options?: RequestOptions): Promise<PaginatedResponse<OutreachCampaign>> {
        const { store_id, ...queryParams } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<OutreachCampaign>>(
          `/v1/stores/${target_store_id}/outreach-campaigns`,
          { ...options, params: queryParams },
        );
      },

      async launch(params: LaunchOutreachCampaignParams, options?: RequestOptions): Promise<OutreachCampaign> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<OutreachCampaign>(
          `/v1/stores/${target_store_id}/outreach-campaigns/${params.id}/launch`,
          {},
          options,
        );
      },
    },

    outreachEnrollment: {
      async find(params?: FindOutreachEnrollmentsParams, options?: RequestOptions): Promise<PaginatedResponse<OutreachEnrollment>> {
        const { store_id, ...queryParams } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<OutreachEnrollment>>(
          `/v1/stores/${target_store_id}/outreach-enrollments`,
          { ...options, params: queryParams },
        );
      },
    },

    outreachMessage: {
      async find(params?: FindOutreachMessagesParams, options?: RequestOptions): Promise<PaginatedResponse<OutreachMessage>> {
        const { store_id, ...queryParams } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<OutreachMessage>>(
          `/v1/stores/${target_store_id}/outreach-messages`,
          { ...options, params: queryParams },
        );
      },
    },

    outreachReply: {
      async find(params?: FindOutreachRepliesParams, options?: RequestOptions): Promise<PaginatedResponse<OutreachReply>> {
        const { store_id, ...queryParams } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<OutreachReply>>(
          `/v1/stores/${target_store_id}/outreach-replies`,
          { ...options, params: queryParams },
        );
      },

      async inject(params: InjectOutreachReplyParams, options?: RequestOptions): Promise<OutreachReply> {
        const { store_id, outreach_message_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<OutreachReply>(
          `/v1/stores/${target_store_id}/outreach-messages/${outreach_message_id}/replies`,
          payload,
          options,
        );
      },
    },

    suppression: {
      async create(params: CreateSuppressionParams, options?: RequestOptions): Promise<Suppression> {
        const { store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<Suppression>(
          `/v1/stores/${target_store_id}/suppressions`,
          payload,
          options,
        );
      },

      async update(params: UpdateSuppressionParams, options?: RequestOptions): Promise<Suppression> {
        const { id, store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.put<Suppression>(
          `/v1/stores/${target_store_id}/suppressions/${id}`,
          payload,
          options,
        );
      },

      async get(params: GetSuppressionParams, options?: RequestOptions): Promise<Suppression> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<Suppression>(
          `/v1/stores/${target_store_id}/suppressions/${params.id}`,
          options,
        );
      },

      async find(params?: FindSuppressionsParams, options?: RequestOptions): Promise<PaginatedResponse<Suppression>> {
        const { store_id, ...queryParams } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<Suppression>>(
          `/v1/stores/${target_store_id}/suppressions`,
          { ...options, params: queryParams },
        );
      },
    },

    audiences: {
      async create(params: CreateAudienceParams, options?: RequestOptions): Promise<Audience> {
        return apiConfig.httpClient.post<Audience>(
          `/v1/stores/${apiConfig.storeId}/audiences`,
          params,
          options,
        );
      },

      async update(params: UpdateAudienceParams, options?: RequestOptions): Promise<Audience> {
        return apiConfig.httpClient.put<Audience>(
          `/v1/stores/${apiConfig.storeId}/audiences/${params.id}`,
          params,
          options,
        );
      },

      async get(params: GetAudienceParams, options?: RequestOptions): Promise<Audience> {
        let identifier: string;
        if (params.id) {
          identifier = params.id;
        } else if (params.key) {
          identifier = `${apiConfig.storeId}:${params.key}`;
        } else {
          throw new Error("GetAudienceParams requires id or key");
        }
        return apiConfig.httpClient.get<Audience>(
          `/v1/stores/${apiConfig.storeId}/audiences/${identifier}`,
          options,
        );
      },

      async find(params: GetAudiencesParams, options?: RequestOptions): Promise<PaginatedResponse<Audience>> {
        return apiConfig.httpClient.get<PaginatedResponse<Audience>>(
          `/v1/stores/${apiConfig.storeId}/audiences`,
          { ...options, params },
        );
      },

      async getSubscribers(params: GetAudienceSubscribersParams, options?: RequestOptions): Promise<{ items: AudienceSubscriber[]; cursor?: string | null }> {
        return apiConfig.httpClient.get<{ items: AudienceSubscriber[]; cursor?: string | null }>(
          `/v1/stores/${apiConfig.storeId}/audiences/${params.id}/subscribers`,
          {
            ...options,
            params: { limit: params.limit, cursor: params.cursor },
          },
        );
      },

      async addSubscriber(params: AddAudienceSubscriberParams, options?: RequestOptions): Promise<AddAudienceSubscriberResponse> {
        return apiConfig.httpClient.post<AddAudienceSubscriberResponse>(
          `/v1/stores/${apiConfig.storeId}/audiences/${params.id}/subscribers`,
          { profile_id: params.profile_id },
          options,
        );
      },

      async removeSubscriber(params: RemoveAudienceSubscriberParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
        return apiConfig.httpClient.delete<{ deleted: boolean }>(
          `/v1/stores/${apiConfig.storeId}/audiences/${params.id}/subscribers/${params.profile_id}`,
          options,
        );
      },
    },

    activity: createActivityAdminApi(apiConfig),
  };
};
