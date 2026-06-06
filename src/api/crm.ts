import type { ApiConfig } from "../index";
import type {
  RequestOptions,
  CreateProfileParams,
  UpdateProfileParams,
  GetProfileParams,
  FindProfilesParams,
  MergeProfilesParams,
  ImportProfilesParams,
  ImportProfilesPreviewParams,
  ImportProfilesPreviewResult,
  ImportProfilesResult,
  Profile,
  ProfileDetail,
  FindActivitiesParams,
  CreateProfileListParams,
  UpdateProfileListParams,
  FindProfileListsParams,
  GetProfileListParams,
  AddProfileListProfileParams,
  UpdateProfileListProfileParams,
  RemoveProfileListProfileParams,
  FindProfileListProfilesParams,
  ImportProfileListPreviewParams,
  ImportProfilesIntoProfileListParams,
  ImportProfilesIntoProfileListResult,
  CreateMailboxParams,
  UpdateMailboxParams,
  FindMailboxesParams,
  GetMailboxParams,
  PrepareMailboxParams,
  TestMailboxParams,
  TestMailboxResult,
  CreateCampaignParams,
  UpdateCampaignParams,
  FindCampaignsParams,
  GetCampaignParams,
  LaunchCampaignParams,
  DuplicateCampaignParams,
  GetCampaignLaunchReadinessParams,
  ImportCampaignRecipientsParams,
  CampaignRecipientImportResult,
  GenerateOutreachPersonalizedDraftsParams,
  FindCampaignRecipientsParams,
  UpdateCampaignRecipientParams,
  UpdateCampaignRecipientDraftParams,
  GetCampaignRecipientConversationParams,
  ReplyCampaignRecipientParams,
  StopCampaignRecipientParams,
  FindCampaignMessagesParams,
  UpdateCampaignMessageParams,
  CreateSuppressionParams,
  UpdateSuppressionParams,
  FindSuppressionsParams,
  GetSuppressionParams,
} from "../types/api";
import type {
  Mailbox,
  Campaign,
  CampaignLaunchReadiness,
  CampaignRecipient,
  CampaignMessage,
  CampaignRecipientConversationResponse,
  PaginatedResponse,
  ProfileList,
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

      if (params?.ids && params.ids.length > 0) queryParams.ids = JSON.stringify(params.ids);
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

    "import": async (params: ImportProfilesParams, options?: RequestOptions): Promise<ImportProfilesResult> => {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<ImportProfilesResult>(
        `/v1/stores/${target_store_id}/profiles/import`,
        payload,
        options,
      );
    },

    previewImport: async (params: ImportProfilesPreviewParams, options?: RequestOptions): Promise<ImportProfilesPreviewResult> => {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<ImportProfilesPreviewResult>(
        `/v1/stores/${target_store_id}/profiles/import/preview`,
        payload,
        options,
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

      async importProfiles(
        params: ImportProfilesIntoProfileListParams,
        options?: RequestOptions,
      ): Promise<ImportProfilesIntoProfileListResult> {
        const { store_id, profile_list_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<ImportProfilesIntoProfileListResult>(
          `/v1/stores/${target_store_id}/profile-lists/${profile_list_id}/profiles/import`,
          payload,
          options,
        );
      },

      async previewImportProfiles(
        params: ImportProfileListPreviewParams,
        options?: RequestOptions,
      ): Promise<ImportProfilesPreviewResult> {
        const { store_id, profile_list_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<ImportProfilesPreviewResult>(
          `/v1/stores/${target_store_id}/profile-lists/${profile_list_id}/profiles/import/preview`,
          payload,
          options,
        );
      },

      members: {
        async add(params: AddProfileListProfileParams, options?: RequestOptions): Promise<ProfileListMember> {
          const { store_id, profile_list_id, profile_id, fields, lead_description } = params;
          const target_store_id = store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<ProfileListMember>(
            `/v1/stores/${target_store_id}/profile-lists/${profile_list_id}/members/${profile_id}`,
            { fields, lead_description },
            options,
          );
        },

        async update(params: UpdateProfileListProfileParams, options?: RequestOptions): Promise<ProfileListMember> {
          const { store_id, profile_list_id, profile_id, status, fields, lead_description } = params;
          const target_store_id = store_id || apiConfig.storeId;
          return apiConfig.httpClient.patch<ProfileListMember>(
            `/v1/stores/${target_store_id}/profile-lists/${profile_list_id}/members/${profile_id}`,
            { status, fields, lead_description },
            options,
          );
        },

        async remove(params: RemoveProfileListProfileParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
          const target_store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.delete<{ deleted: boolean }>(
            `/v1/stores/${target_store_id}/profile-lists/${params.profile_list_id}/members/${params.profile_id}`,
            options,
          );
        },

        async find(params: FindProfileListProfilesParams, options?: RequestOptions): Promise<PaginatedResponse<ProfileListMember>> {
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
      profiles: {
        async add(params: AddProfileListProfileParams, options?: RequestOptions): Promise<ProfileListMember> {
          const { store_id, profile_list_id, profile_id, fields, lead_description } = params;
          const target_store_id = store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<ProfileListMember>(
            `/v1/stores/${target_store_id}/profile-lists/${profile_list_id}/members/${profile_id}`,
            { fields, lead_description },
            options,
          );
        },
        async update(params: UpdateProfileListProfileParams, options?: RequestOptions): Promise<ProfileListMember> {
          const { store_id, profile_list_id, profile_id, status, fields, lead_description } = params;
          const target_store_id = store_id || apiConfig.storeId;
          return apiConfig.httpClient.patch<ProfileListMember>(
            `/v1/stores/${target_store_id}/profile-lists/${profile_list_id}/members/${profile_id}`,
            { status, fields, lead_description },
            options,
          );
        },
        async remove(params: RemoveProfileListProfileParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
          const target_store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.delete<{ deleted: boolean }>(
            `/v1/stores/${target_store_id}/profile-lists/${params.profile_list_id}/members/${params.profile_id}`,
            options,
          );
        },
        async find(params: FindProfileListProfilesParams, options?: RequestOptions): Promise<PaginatedResponse<ProfileListMember>> {
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

      async test(params: TestMailboxParams, options?: RequestOptions): Promise<TestMailboxResult> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<TestMailboxResult>(
          `/v1/stores/${target_store_id}/mailboxes/${params.id}/test`,
          {},
          options,
        );
      },

      async prepare(params: PrepareMailboxParams, options?: RequestOptions): Promise<Mailbox> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<Mailbox>(
          `/v1/stores/${target_store_id}/mailboxes/${params.id}/prepare`,
          {},
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

    campaign: {
      async create(params: CreateCampaignParams, options?: RequestOptions): Promise<Campaign> {
        const { store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<Campaign>(
          `/v1/stores/${target_store_id}/campaigns`,
          payload,
          options,
        );
      },

      async update(params: UpdateCampaignParams, options?: RequestOptions): Promise<Campaign> {
        const { id, store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.put<Campaign>(
          `/v1/stores/${target_store_id}/campaigns/${id}`,
          payload,
          options,
        );
      },

      async get(params: GetCampaignParams, options?: RequestOptions): Promise<Campaign> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<Campaign>(
          `/v1/stores/${target_store_id}/campaigns/${params.id}`,
          options,
        );
      },

      async find(params?: FindCampaignsParams, options?: RequestOptions): Promise<PaginatedResponse<Campaign>> {
        const { store_id, ...queryParams } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<Campaign>>(
          `/v1/stores/${target_store_id}/campaigns`,
          { ...options, params: queryParams },
        );
      },

      async launch(params: LaunchCampaignParams, options?: RequestOptions): Promise<Campaign> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<Campaign>(
          `/v1/stores/${target_store_id}/campaigns/${params.id}/launch`,
          {},
          options,
        );
      },

      async duplicate(params: DuplicateCampaignParams, options?: RequestOptions): Promise<Campaign> {
        const { id, store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<Campaign>(
          `/v1/stores/${target_store_id}/campaigns/${id}/duplicate`,
          payload,
          options,
        );
      },

      async launchReadiness(
        params: GetCampaignLaunchReadinessParams,
        options?: RequestOptions,
      ): Promise<CampaignLaunchReadiness> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<CampaignLaunchReadiness>(
          `/v1/stores/${target_store_id}/campaigns/${params.id}/launch-readiness`,
          options,
        );
      },

      async importRecipients(
        params: ImportCampaignRecipientsParams,
        options?: RequestOptions,
      ): Promise<CampaignRecipientImportResult> {
        const { id, store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<CampaignRecipientImportResult>(
          `/v1/stores/${target_store_id}/campaigns/${id}/recipients/import`,
          payload,
          options,
        );
      },

      async generatePersonalizedDrafts(params: GenerateOutreachPersonalizedDraftsParams, options?: RequestOptions): Promise<Campaign> {
        const { id, store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<Campaign>(
          `/v1/stores/${target_store_id}/campaigns/${id}/personalized-drafts`,
          payload,
          options,
        );
      },
    },

    campaignRecipient: {
      async find(params?: FindCampaignRecipientsParams, options?: RequestOptions): Promise<PaginatedResponse<CampaignRecipient>> {
        const { store_id, ...queryParams } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<CampaignRecipient>>(
          `/v1/stores/${target_store_id}/campaign-recipients`,
          { ...options, params: queryParams },
        );
      },

      async get(params: GetCampaignRecipientConversationParams, options?: RequestOptions): Promise<CampaignRecipientConversationResponse> {
        const { store_id, id, ...queryParams } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<CampaignRecipientConversationResponse>(
          `/v1/stores/${target_store_id}/campaign-recipients/${id}`,
          { ...options, params: { ...queryParams, store_id: target_store_id } },
        );
      },

      async update(params: UpdateCampaignRecipientParams, options?: RequestOptions): Promise<CampaignRecipient> {
        const { store_id, id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.put<CampaignRecipient>(
          `/v1/stores/${target_store_id}/campaign-recipients/${id}`,
          payload,
          options,
        );
      },

      async updateDraft(params: UpdateCampaignRecipientDraftParams, options?: RequestOptions): Promise<CampaignRecipient> {
        const { store_id, id, draft_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.put<CampaignRecipient>(
          `/v1/stores/${target_store_id}/campaign-recipients/${id}/drafts/${draft_id}`,
          payload,
          options,
        );
      },

      async reply(params: ReplyCampaignRecipientParams, options?: RequestOptions): Promise<CampaignRecipientConversationResponse> {
        const { store_id, id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<CampaignRecipientConversationResponse>(
          `/v1/stores/${target_store_id}/campaign-recipients/${id}/reply`,
          payload,
          options,
        );
      },

      async stop(params: StopCampaignRecipientParams, options?: RequestOptions): Promise<CampaignRecipientConversationResponse> {
        const { store_id, id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<CampaignRecipientConversationResponse>(
          `/v1/stores/${target_store_id}/campaign-recipients/${id}/stop`,
          payload,
          options,
        );
      },
    },

    campaignMessage: {
      async find(params?: FindCampaignMessagesParams, options?: RequestOptions): Promise<PaginatedResponse<CampaignMessage>> {
        const { store_id, ...queryParams } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<CampaignMessage>>(
          `/v1/stores/${target_store_id}/campaign-messages`,
          { ...options, params: queryParams },
        );
      },

      async update(params: UpdateCampaignMessageParams, options?: RequestOptions): Promise<CampaignMessage> {
        const { id, store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.put<CampaignMessage>(
          `/v1/stores/${target_store_id}/campaign-messages/${id}`,
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

    activity: createActivityAdminApi(apiConfig),
  };
};
