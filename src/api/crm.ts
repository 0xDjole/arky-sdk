import type { ApiConfig } from "../index";
import type {
  RequestOptions,
  CreateContactParams,
  UpdateContactParams,
  GetContactParams,
  FindContactsParams,
  FindActionsParams,
  MergeContactsParams,
  ImportContactsParams,
  ImportContactsPreviewParams,
  ImportContactsPreviewResult,
  ImportContactsResult,
  Contact,
  ContactDetail,
  CreateContactListParams,
  UpdateContactListParams,
  FindContactListsParams,
  GetContactListParams,
  AddContactListContactParams,
  UpdateContactListContactParams,
  RemoveContactListContactParams,
  FindContactListContactsParams,
  ImportContactListPreviewParams,
  ImportContactsIntoContactListParams,
  ImportContactsIntoContactListResult,
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
  ImportCampaignEnrollmentsParams,
  CampaignEnrollmentImportResult,
  GenerateOutreachPersonalizedDraftsParams,
  FindCampaignEnrollmentsParams,
  UpdateCampaignEnrollmentParams,
  UpdateCampaignEnrollmentDraftParams,
  UpdateCampaignEnrollmentStepExecutionParams,
  GetCampaignEnrollmentConversationParams,
  ReplyCampaignEnrollmentParams,
  StopCampaignEnrollmentParams,
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
  CampaignEnrollment,
  CampaignMessage,
  CampaignEnrollmentConversationResponse,
  PaginatedResponse,
  ContactList,
  ContactListMember,
  Action,
  Suppression,
} from "../types";

export interface TimelineParams {
  contact_id: string;
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export const createActionAdminApi = (apiConfig: ApiConfig) => ({
  async timeline(params: TimelineParams, options?: RequestOptions): Promise<{ items: Action[]; cursor: string | null }> {
    const store_id = params.store_id || apiConfig.storeId;
    const queryParams: Record<string, unknown> = { contact_id: params.contact_id };
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;
    return apiConfig.httpClient.get<{ items: Action[]; cursor: string | null }>(
      `/v1/stores/${store_id}/contacts/${params.contact_id}/actions`,
      { ...options, params: queryParams },
    );
  },

  async find(params: FindActionsParams, options?: RequestOptions): Promise<{ items: Action[]; cursor: string | null }> {
    const store_id = params.store_id || apiConfig.storeId;
    const queryParams: Record<string, unknown> = {};
    if (params.query) queryParams.query = params.query;
    if (params.contact_id) queryParams.contact_id = params.contact_id;
    if (params.types && params.types.length > 0) queryParams.types = params.types;
    if (params.from !== undefined) queryParams.from = params.from;
    if (params.to !== undefined) queryParams.to = params.to;
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;
    return apiConfig.httpClient.get<{ items: Action[]; cursor: string | null }>(
      `/v1/stores/${store_id}/actions`,
      { ...options, params: queryParams }
    );
  },
});

export const createContactApi = (apiConfig: ApiConfig) => {
  return {
    async create(params: CreateContactParams, options?: RequestOptions): Promise<Contact> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Contact>(
        `/v1/stores/${store_id || apiConfig.storeId}/contacts`,
        payload,
        options
      );
    },

    async get(params: GetContactParams, options?: RequestOptions): Promise<ContactDetail> {
      return apiConfig.httpClient.get<ContactDetail>(
        `/v1/stores/${params.store_id || apiConfig.storeId}/contacts/${params.id}`,
        options
      );
    },

    async find(params?: FindContactsParams, options?: RequestOptions): Promise<{ items: Contact[]; cursor?: string }> {
      const store_id = params?.store_id || apiConfig.storeId;
      const queryParams: Record<string, unknown> = {};

      if (params?.ids && params.ids.length > 0) queryParams.ids = JSON.stringify(params.ids);
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.cursor) queryParams.cursor = params.cursor;
      if (params?.query) queryParams.query = params.query;
      if (params?.taxonomy_query) queryParams.taxonomy_query = params.taxonomy_query;
      if (params?.status) queryParams.status = params.status;
      if (params?.has_action !== undefined) queryParams.has_action = params.has_action;
      if (params?.has_cart !== undefined) queryParams.has_cart = params.has_cart;
      if (params?.sort_field) queryParams.sort_field = params.sort_field;
      if (params?.sort_direction) queryParams.sort_direction = params.sort_direction;

      return apiConfig.httpClient.get<{ items: Contact[]; cursor?: string }>(
        `/v1/stores/${store_id}/contacts`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async findActions(
      params?: FindActionsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Action>> {
      const { store_id, ...queryParams } = params || {};
      return apiConfig.httpClient.get<PaginatedResponse<Action>>(
        `/v1/stores/${store_id || apiConfig.storeId}/actions`,
        {
          ...options,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        },
      );
    },

    async update(params: UpdateContactParams, options?: RequestOptions): Promise<Contact> {
      const { id, store_id, ...body } = params;
      return apiConfig.httpClient.put<Contact>(
        `/v1/stores/${store_id || apiConfig.storeId}/contacts/${id}`,
        body,
        options
      );
    },

    async merge(params: MergeContactsParams, options?: RequestOptions): Promise<Contact> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Contact>(
        `/v1/stores/${store_id}/contacts/${params.target_id}/merge`,
        { source_id: params.source_id, store_id },
        options
      );
    },

    "import": async (params: ImportContactsParams, options?: RequestOptions): Promise<ImportContactsResult> => {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<ImportContactsResult>(
        `/v1/stores/${target_store_id}/contacts/import`,
        payload,
        options,
      );
    },

    previewImport: async (params: ImportContactsPreviewParams, options?: RequestOptions): Promise<ImportContactsPreviewResult> => {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<ImportContactsPreviewResult>(
        `/v1/stores/${target_store_id}/contacts/import/preview`,
        payload,
        options,
      );
    },

    async revokeToken(params: { id: string; token_id: string; store_id?: string }, options?: RequestOptions): Promise<{ deleted: boolean }> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${store_id}/contacts/${params.id}/sessions/${params.token_id}`,
        options
      );
    },

    async revokeAllTokens(params: { id: string; store_id?: string }, options?: RequestOptions): Promise<{ deleted: boolean }> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${store_id}/contacts/${params.id}/sessions`,
        options
      );
    },

    contactList: {
      async create(params: CreateContactListParams, options?: RequestOptions): Promise<ContactList> {
        const { store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<ContactList>(
          `/v1/stores/${target_store_id}/contact-lists`,
          payload,
          options,
        );
      },

      async update(params: UpdateContactListParams, options?: RequestOptions): Promise<ContactList> {
        const { id, store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.put<ContactList>(
          `/v1/stores/${target_store_id}/contact-lists/${id}`,
          payload,
          options,
        );
      },

      async get(params: GetContactListParams, options?: RequestOptions): Promise<ContactList> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<ContactList>(
          `/v1/stores/${target_store_id}/contact-lists/${params.id}`,
          options,
        );
      },

      async find(params?: FindContactListsParams, options?: RequestOptions): Promise<PaginatedResponse<ContactList>> {
        const { store_id, ...queryParams } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<ContactList>>(
          `/v1/stores/${target_store_id}/contact-lists`,
          { ...options, params: queryParams },
        );
      },

      async importContacts(
        params: ImportContactsIntoContactListParams,
        options?: RequestOptions,
      ): Promise<ImportContactsIntoContactListResult> {
        const { store_id, contact_list_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<ImportContactsIntoContactListResult>(
          `/v1/stores/${target_store_id}/contact-lists/${contact_list_id}/contacts/import`,
          payload,
          options,
        );
      },

      async previewImportContacts(
        params: ImportContactListPreviewParams,
        options?: RequestOptions,
      ): Promise<ImportContactsPreviewResult> {
        const { store_id, contact_list_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<ImportContactsPreviewResult>(
          `/v1/stores/${target_store_id}/contact-lists/${contact_list_id}/contacts/import/preview`,
          payload,
          options,
        );
      },

      members: {
        async add(params: AddContactListContactParams, options?: RequestOptions): Promise<ContactListMember> {
          const { store_id, contact_list_id, contact_id, fields, lead_description } = params;
          const target_store_id = store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<ContactListMember>(
            `/v1/stores/${target_store_id}/contact-lists/${contact_list_id}/members/${contact_id}`,
            { fields, lead_description },
            options,
          );
        },

        async update(params: UpdateContactListContactParams, options?: RequestOptions): Promise<ContactListMember> {
          const { store_id, contact_list_id, contact_id, status, fields, lead_description } = params;
          const target_store_id = store_id || apiConfig.storeId;
          return apiConfig.httpClient.patch<ContactListMember>(
            `/v1/stores/${target_store_id}/contact-lists/${contact_list_id}/members/${contact_id}`,
            { status, fields, lead_description },
            options,
          );
        },

        async remove(params: RemoveContactListContactParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
          const target_store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.delete<{ deleted: boolean }>(
            `/v1/stores/${target_store_id}/contact-lists/${params.contact_list_id}/members/${params.contact_id}`,
            options,
          );
        },

        async find(params: FindContactListContactsParams, options?: RequestOptions): Promise<PaginatedResponse<ContactListMember>> {
          const { store_id, contact_list_id, ...queryParams } = params;
          const target_store_id = store_id || apiConfig.storeId;
          const path = contact_list_id
            ? `/v1/stores/${target_store_id}/contact-lists/${contact_list_id}/members`
            : `/v1/stores/${target_store_id}/contact-list-members`;
          return apiConfig.httpClient.get<PaginatedResponse<ContactListMember>>(
            path,
            { ...options, params: queryParams },
          );
        },
      },
      contacts: {
        async add(params: AddContactListContactParams, options?: RequestOptions): Promise<ContactListMember> {
          const { store_id, contact_list_id, contact_id, fields, lead_description } = params;
          const target_store_id = store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<ContactListMember>(
            `/v1/stores/${target_store_id}/contact-lists/${contact_list_id}/members/${contact_id}`,
            { fields, lead_description },
            options,
          );
        },
        async update(params: UpdateContactListContactParams, options?: RequestOptions): Promise<ContactListMember> {
          const { store_id, contact_list_id, contact_id, status, fields, lead_description } = params;
          const target_store_id = store_id || apiConfig.storeId;
          return apiConfig.httpClient.patch<ContactListMember>(
            `/v1/stores/${target_store_id}/contact-lists/${contact_list_id}/members/${contact_id}`,
            { status, fields, lead_description },
            options,
          );
        },
        async remove(params: RemoveContactListContactParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
          const target_store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.delete<{ deleted: boolean }>(
            `/v1/stores/${target_store_id}/contact-lists/${params.contact_list_id}/members/${params.contact_id}`,
            options,
          );
        },
        async find(params: FindContactListContactsParams, options?: RequestOptions): Promise<PaginatedResponse<ContactListMember>> {
          const { store_id, contact_list_id, ...queryParams } = params;
          const target_store_id = store_id || apiConfig.storeId;
          const path = contact_list_id
            ? `/v1/stores/${target_store_id}/contact-lists/${contact_list_id}/members`
            : `/v1/stores/${target_store_id}/contact-list-members`;
          return apiConfig.httpClient.get<PaginatedResponse<ContactListMember>>(
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

      async importEnrollments(
        params: ImportCampaignEnrollmentsParams,
        options?: RequestOptions,
      ): Promise<CampaignEnrollmentImportResult> {
        const { id, store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<CampaignEnrollmentImportResult>(
          `/v1/stores/${target_store_id}/campaigns/${id}/enrollments/import`,
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

    campaignEnrollment: {
      async find(params?: FindCampaignEnrollmentsParams, options?: RequestOptions): Promise<PaginatedResponse<CampaignEnrollment>> {
        const { store_id, ...queryParams } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<CampaignEnrollment>>(
          `/v1/stores/${target_store_id}/campaign-enrollments`,
          { ...options, params: queryParams },
        );
      },

      async get(params: GetCampaignEnrollmentConversationParams, options?: RequestOptions): Promise<CampaignEnrollmentConversationResponse> {
        const { store_id, id, ...queryParams } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<CampaignEnrollmentConversationResponse>(
          `/v1/stores/${target_store_id}/campaign-enrollments/${id}`,
          { ...options, params: { ...queryParams, store_id: target_store_id } },
        );
      },

      async update(params: UpdateCampaignEnrollmentParams, options?: RequestOptions): Promise<CampaignEnrollment> {
        const { store_id, id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.put<CampaignEnrollment>(
          `/v1/stores/${target_store_id}/campaign-enrollments/${id}`,
          payload,
          options,
        );
      },

      async updateDraft(params: UpdateCampaignEnrollmentDraftParams, options?: RequestOptions): Promise<CampaignEnrollment> {
        const { store_id, id, draft_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.put<CampaignEnrollment>(
          `/v1/stores/${target_store_id}/campaign-enrollments/${id}/drafts/${draft_id}`,
          payload,
          options,
        );
      },

      async updateStepExecution(params: UpdateCampaignEnrollmentStepExecutionParams, options?: RequestOptions): Promise<CampaignEnrollmentConversationResponse> {
        const { store_id, id, execution_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<CampaignEnrollmentConversationResponse>(
          `/v1/stores/${target_store_id}/campaign-enrollments/${id}/step-executions/${execution_id}`,
          payload,
          options,
        );
      },

      async reply(params: ReplyCampaignEnrollmentParams, options?: RequestOptions): Promise<CampaignEnrollmentConversationResponse> {
        const { store_id, id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<CampaignEnrollmentConversationResponse>(
          `/v1/stores/${target_store_id}/campaign-enrollments/${id}/reply`,
          payload,
          options,
        );
      },

      async stop(params: StopCampaignEnrollmentParams, options?: RequestOptions): Promise<CampaignEnrollmentConversationResponse> {
        const { store_id, id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<CampaignEnrollmentConversationResponse>(
          `/v1/stores/${target_store_id}/campaign-enrollments/${id}/stop`,
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

    action: createActionAdminApi(apiConfig),
  };
};
