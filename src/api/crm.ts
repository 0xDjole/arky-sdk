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
  ContactSessionRecord,
  FindContactSessionsParams,
  RevokeContactSessionParams,
  RevokeAllContactSessionsParams,
  CreateAudienceParams,
  UpdateAudienceParams,
  FindAudiencesParams,
  GetAudienceParams,
  CreateAudienceTierParams,
  UpdateAudienceTierParams,
  FindAudienceTiersParams,
  GetAudienceTierParams,
  RetryAudienceTierCatalogParams,
  AddAudienceMemberParams,
  UpdateAudienceMemberParams,
  RemoveAudienceMemberParams,
  FindAudienceMembersParams,
  RefundAudienceMemberParams,
  RefundAudienceMemberResult,
  FindAudiencePaymentsParams,
  GetAudiencePaymentParams,
  FindAudienceRefundsParams,
  GetAudienceRefundParams,
  RetryAudienceRefundParams,
  RetryAudienceSubscriptionCancellationParams,
  PreviewAudienceMemberImportParams,
  ImportAudienceMembersParams,
  ImportAudienceMembersResult,
  CreateMailboxParams,
  ConnectGoogleMailboxParams,
  GoogleMailboxConnectUrl,
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
  ManageAudienceParams,
  CreateAudiencePaymentMethodSessionParams,
  UnsubscribeAudienceParams,
  ConfirmAudienceParams,
} from "../types/api";
import type {
  Mailbox,
  Campaign,
  CampaignLaunchReadiness,
  CampaignEnrollment,
  CampaignMessage,
  CampaignEnrollmentConversationResponse,
  PaginatedResponse,
  Audience,
  AudienceTier,
  AudiencePayment,
  AudienceRefund,
  AudienceSubscriptionCancellation,
  AudienceMemberDetail,
  RemoveAudienceMemberResult,
  Action,
  Suppression,
  AudienceManagementResponse,
  AudiencePaymentMethodSessionResponse,
} from "../types";

export interface TimelineParams {
  contact_id: string;
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export const createActionAdminApi = (apiConfig: ApiConfig) => ({
  async timeline(
    params: TimelineParams,
    options?: RequestOptions,
  ): Promise<{ items: Action[]; cursor: string | null }> {
    const store_id = params.store_id || apiConfig.storeId;
    const queryParams: Record<string, unknown> = {
      contact_id: params.contact_id,
    };
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;
    return apiConfig.httpClient.get<{ items: Action[]; cursor: string | null }>(
      `/v1/stores/${store_id}/contacts/${params.contact_id}/actions`,
      { ...options, params: queryParams },
    );
  },

  async find(
    params: FindActionsParams,
    options?: RequestOptions,
  ): Promise<{ items: Action[]; cursor: string | null }> {
    const store_id = params.store_id || apiConfig.storeId;
    const queryParams: Record<string, unknown> = {};
    if (params.contact_id) queryParams.contact_id = params.contact_id;
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;
    return apiConfig.httpClient.get<{ items: Action[]; cursor: string | null }>(
      `/v1/stores/${store_id}/actions`,
      { ...options, params: queryParams },
    );
  },
});

export const createContactApi = (apiConfig: ApiConfig) => {
  return {
    async create(
      params: CreateContactParams,
      options?: RequestOptions,
    ): Promise<Contact> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Contact>(
        `/v1/stores/${store_id || apiConfig.storeId}/contacts`,
        payload,
        options,
      );
    },

    async get(
      params: GetContactParams,
      options?: RequestOptions,
    ): Promise<Contact> {
      return apiConfig.httpClient.get<Contact>(
        `/v1/stores/${params.store_id || apiConfig.storeId}/contacts/${params.id}`,
        options,
      );
    },

    async find(
      params?: FindContactsParams,
      options?: RequestOptions,
    ): Promise<{ items: Contact[]; cursor?: string }> {
      const store_id = params?.store_id || apiConfig.storeId;
      const queryParams: Record<string, unknown> = {};

      if (params?.ids && params.ids.length > 0)
        queryParams.ids = JSON.stringify(params.ids);
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.cursor) queryParams.cursor = params.cursor;
      if (params?.query) queryParams.query = params.query;
      if (params?.taxonomy_query)
        queryParams.taxonomy_query = params.taxonomy_query;
      if (params?.status) queryParams.status = params.status;
      if (params?.has_action !== undefined)
        queryParams.has_action = params.has_action;
      if (params?.has_cart !== undefined)
        queryParams.has_cart = params.has_cart;
      if (params?.sort_field) queryParams.sort_field = params.sort_field;
      if (params?.sort_direction)
        queryParams.sort_direction = params.sort_direction;

      return apiConfig.httpClient.get<{ items: Contact[]; cursor?: string }>(
        `/v1/stores/${store_id}/contacts`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async update(
      params: UpdateContactParams,
      options?: RequestOptions,
    ): Promise<Contact> {
      const { id, store_id, ...body } = params;
      return apiConfig.httpClient.put<Contact>(
        `/v1/stores/${store_id || apiConfig.storeId}/contacts/${id}`,
        body,
        options,
      );
    },

    async merge(
      params: MergeContactsParams,
      options?: RequestOptions,
    ): Promise<Contact> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Contact>(
        `/v1/stores/${store_id}/contacts/${params.target_id}/merge`,
        { source_id: params.source_id, store_id },
        options,
      );
    },

    import: async (
      params: ImportContactsParams,
      options?: RequestOptions,
    ): Promise<ImportContactsResult> => {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<ImportContactsResult>(
        `/v1/stores/${target_store_id}/contacts/import`,
        payload,
        options,
      );
    },

    previewImport: async (
      params: ImportContactsPreviewParams,
      options?: RequestOptions,
    ): Promise<ImportContactsPreviewResult> => {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<ImportContactsPreviewResult>(
        `/v1/stores/${target_store_id}/contacts/import/preview`,
        payload,
        options,
      );
    },

    async findSessions(
      params: FindContactSessionsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<ContactSessionRecord>> {
      const store_id = params.store_id || apiConfig.storeId;
      const queryParams: Record<string, unknown> = {};
      if (params.limit !== undefined) queryParams.limit = params.limit;
      if (params.cursor) queryParams.cursor = params.cursor;
      return apiConfig.httpClient.get<PaginatedResponse<ContactSessionRecord>>(
        `/v1/stores/${store_id}/contacts/${params.contact_id}/sessions`,
        { ...options, params: queryParams },
      );
    },

    async revokeSession(
      params: RevokeContactSessionParams,
      options?: RequestOptions,
    ): Promise<{ success: boolean }> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<{ success: boolean }>(
        `/v1/stores/${store_id}/contacts/${params.contact_id}/sessions/${params.session_id}`,
        options,
      );
    },

    async revokeAllSessions(
      params: RevokeAllContactSessionsParams,
      options?: RequestOptions,
    ): Promise<{ success: boolean }> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<{ success: boolean }>(
        `/v1/stores/${store_id}/contacts/${params.contact_id}/sessions`,
        options,
      );
    },

    audience: {
      customer: {
        async manage(
          params: ManageAudienceParams,
          options?: RequestOptions,
        ): Promise<AudienceManagementResponse> {
          return apiConfig.httpClient.post<AudienceManagementResponse>(
            "/v1/customer/audiences/manage",
            params,
            options,
          );
        },

        async createPaymentMethodSession(
          params: CreateAudiencePaymentMethodSessionParams,
          options?: RequestOptions,
        ): Promise<AudiencePaymentMethodSessionResponse> {
          return apiConfig.httpClient.post<AudiencePaymentMethodSessionResponse>(
            "/v1/customer/audiences/payment-method",
            params,
            options,
          );
        },

        async cancelSubscription(
          params: ManageAudienceParams,
          options?: RequestOptions,
        ): Promise<{ success: boolean }> {
          return apiConfig.httpClient.post<{ success: boolean }>(
            "/v1/customer/audiences/subscription/cancel",
            params,
            options,
          );
        },

        async unsubscribe(
          params: UnsubscribeAudienceParams,
          options?: RequestOptions,
        ): Promise<{ success: boolean }> {
          return apiConfig.httpClient.post<{ success: boolean }>(
            "/v1/customer/audiences/unsubscribe",
            params,
            options,
          );
        },

        async confirm(
          params: ConfirmAudienceParams,
          options?: RequestOptions,
        ): Promise<{ success: boolean }> {
          return apiConfig.httpClient.post<{ success: boolean }>(
            "/v1/customer/audiences/confirm",
            params,
            options,
          );
        },
      },

      async create(
        params: CreateAudienceParams,
        options?: RequestOptions,
      ): Promise<Audience> {
        const { store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<Audience>(
          `/v1/stores/${target_store_id}/audiences`,
          payload,
          options,
        );
      },

      async update(
        params: UpdateAudienceParams,
        options?: RequestOptions,
      ): Promise<Audience> {
        const { id, store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.put<Audience>(
          `/v1/stores/${target_store_id}/audiences/${id}`,
          payload,
          options,
        );
      },

      async get(
        params: GetAudienceParams,
        options?: RequestOptions,
      ): Promise<Audience> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<Audience>(
          `/v1/stores/${target_store_id}/audiences/${params.id}`,
          options,
        );
      },

      async find(
        params?: FindAudiencesParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<Audience>> {
        const { store_id, ...queryParams } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<Audience>>(
          `/v1/stores/${target_store_id}/audiences`,
          { ...options, params: queryParams },
        );
      },

      tiers: {
        async create(
          params: CreateAudienceTierParams,
          options?: RequestOptions,
        ): Promise<AudienceTier> {
          const { store_id, audience_id, ...payload } = params;
          const target_store_id = store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<AudienceTier>(
            `/v1/stores/${target_store_id}/audiences/${audience_id}/tiers`,
            payload,
            options,
          );
        },

        async update(
          params: UpdateAudienceTierParams,
          options?: RequestOptions,
        ): Promise<AudienceTier> {
          const { id, store_id, audience_id, ...payload } = params;
          const target_store_id = store_id || apiConfig.storeId;
          return apiConfig.httpClient.put<AudienceTier>(
            `/v1/stores/${target_store_id}/audiences/${audience_id}/tiers/${id}`,
            payload,
            options,
          );
        },

        async get(
          params: GetAudienceTierParams,
          options?: RequestOptions,
        ): Promise<AudienceTier> {
          const target_store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.get<AudienceTier>(
            `/v1/stores/${target_store_id}/audiences/${params.audience_id}/tiers/${params.id}`,
            options,
          );
        },

        async find(
          params: FindAudienceTiersParams,
          options?: RequestOptions,
        ): Promise<PaginatedResponse<AudienceTier>> {
          const { store_id, audience_id, ...queryParams } = params;
          const target_store_id = store_id || apiConfig.storeId;
          return apiConfig.httpClient.get<PaginatedResponse<AudienceTier>>(
            `/v1/stores/${target_store_id}/audiences/${audience_id}/tiers`,
            { ...options, params: queryParams },
          );
        },

        async retryCatalog(
          params: RetryAudienceTierCatalogParams,
          options?: RequestOptions,
        ): Promise<AudienceTier> {
          const target_store_id = params.store_id || apiConfig.storeId;
          const path =
            `/v1/stores/${target_store_id}/audiences/${params.audience_id}` +
            `/tiers/${params.tier_id}`;
          return apiConfig.httpClient.post<AudienceTier>(
            `${path}/catalog/retry`,
            { price_id: params.price_id },
            options,
          );
        },
      },

      async importMembers(
        params: ImportAudienceMembersParams,
        options?: RequestOptions,
      ): Promise<ImportAudienceMembersResult> {
        const { store_id, audience_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<ImportAudienceMembersResult>(
          `/v1/stores/${target_store_id}/audiences/${audience_id}/members/import`,
          payload,
          options,
        );
      },

      async previewMemberImport(
        params: PreviewAudienceMemberImportParams,
        options?: RequestOptions,
      ): Promise<ImportContactsPreviewResult> {
        const { store_id, audience_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<ImportContactsPreviewResult>(
          `/v1/stores/${target_store_id}/audiences/${audience_id}/members/import/preview`,
          payload,
          options,
        );
      },

      members: {
        async add(
          params: AddAudienceMemberParams,
          options?: RequestOptions,
        ): Promise<AudienceMemberDetail> {
          const {
            store_id,
            audience_id,
            contact_id,
            fields,
            lead_description,
          } = params;
          const target_store_id = store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<AudienceMemberDetail>(
            `/v1/stores/${target_store_id}/audiences/${audience_id}/members`,
            { contact_id, fields, lead_description },
            options,
          );
        },

        async update(
          params: UpdateAudienceMemberParams,
          options?: RequestOptions,
        ): Promise<AudienceMemberDetail> {
          const {
            store_id,
            audience_id,
            member_id,
            enrollment_status,
            fields,
            lead_description,
          } = params;
          const target_store_id = store_id || apiConfig.storeId;
          return apiConfig.httpClient.patch<AudienceMemberDetail>(
            `/v1/stores/${target_store_id}/audiences/${audience_id}/members/${member_id}`,
            { enrollment_status, fields, lead_description },
            options,
          );
        },

        async remove(
          params: RemoveAudienceMemberParams,
          options?: RequestOptions,
        ): Promise<RemoveAudienceMemberResult> {
          const target_store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.delete<RemoveAudienceMemberResult>(
            `/v1/stores/${target_store_id}/audiences/${params.audience_id}/members/${params.member_id}`,
            options,
          );
        },

        async find(
          params: FindAudienceMembersParams = {},
          options?: RequestOptions,
        ): Promise<PaginatedResponse<AudienceMemberDetail>> {
          const { store_id, audience_id, ...queryParams } = params;
          const target_store_id = store_id || apiConfig.storeId;
          const path = audience_id
            ? `/v1/stores/${target_store_id}/audiences/${audience_id}/members`
            : `/v1/stores/${target_store_id}/audiences/members`;
          return apiConfig.httpClient.get<PaginatedResponse<AudienceMemberDetail>>(
            path,
            { ...options, params: queryParams },
          );
        },
        async refund(
          params: RefundAudienceMemberParams,
          options?: RequestOptions,
        ): Promise<RefundAudienceMemberResult> {
          const { store_id, audience_id, member_id, payment_id, ...payload } =
            params;
          const target_store_id = store_id || apiConfig.storeId;
          const response =
            await apiConfig.httpClient.post<RefundAudienceMemberResult>(
              `/v1/stores/${target_store_id}/audiences/${audience_id}/members/${member_id}/payments/${payment_id}/refunds`,
              payload,
              options,
            );
          if (response.refund_id !== params.refund_id) {
            throw new Error(
              "Audience refund response did not match the requested refund_id",
            );
          }
          return response;
        },

        payments: {
          async find(
            params: FindAudiencePaymentsParams,
            options?: RequestOptions,
          ): Promise<PaginatedResponse<AudiencePayment>> {
            const { store_id, audience_id, member_id, ...queryParams } =
              params;
            const target_store_id = store_id || apiConfig.storeId;
            return apiConfig.httpClient.get<
              PaginatedResponse<AudiencePayment>
            >(
              `/v1/stores/${target_store_id}/audiences/${audience_id}/members/${member_id}/payments`,
              { ...options, params: queryParams },
            );
          },

          async get(
            params: GetAudiencePaymentParams,
            options?: RequestOptions,
          ): Promise<AudiencePayment> {
            const target_store_id = params.store_id || apiConfig.storeId;
            return apiConfig.httpClient.get<AudiencePayment>(
              `/v1/stores/${target_store_id}/audiences/${params.audience_id}/members/${params.member_id}/payments/${params.id}`,
              options,
            );
          },
        },

        refunds: {
          async find(
            params: FindAudienceRefundsParams,
            options?: RequestOptions,
          ): Promise<PaginatedResponse<AudienceRefund>> {
            const { store_id, audience_id, member_id, ...queryParams } =
              params;
            const target_store_id = store_id || apiConfig.storeId;
            return apiConfig.httpClient.get<
              PaginatedResponse<AudienceRefund>
            >(
              `/v1/stores/${target_store_id}/audiences/${audience_id}/members/${member_id}/refunds`,
              { ...options, params: queryParams },
            );
          },

          async get(
            params: GetAudienceRefundParams,
            options?: RequestOptions,
          ): Promise<AudienceRefund> {
            const target_store_id = params.store_id || apiConfig.storeId;
            return apiConfig.httpClient.get<AudienceRefund>(
              `/v1/stores/${target_store_id}/audiences/${params.audience_id}/members/${params.member_id}/refunds/${params.id}`,
              options,
            );
          },

          async retry(
            params: RetryAudienceRefundParams,
            options?: RequestOptions,
          ): Promise<AudienceRefund> {
            const target_store_id = params.store_id || apiConfig.storeId;
            const path =
              `/v1/stores/${target_store_id}/audiences/${params.audience_id}` +
              `/members/${params.member_id}/refunds/${params.id}`;
            return apiConfig.httpClient.post<AudienceRefund>(
              `${path}/retry`,
              {},
              options,
            );
          },
        },

        subscription: {
          cancellation: {
            async retry(
              params: RetryAudienceSubscriptionCancellationParams,
              options?: RequestOptions,
            ): Promise<AudienceSubscriptionCancellation> {
              const target_store_id = params.store_id || apiConfig.storeId;
              const path =
                `/v1/stores/${target_store_id}/audiences/${params.audience_id}` +
                `/members/${params.member_id}/subscription/cancellation/retry`;
              return apiConfig.httpClient.post<AudienceSubscriptionCancellation>(
                path,
                { id: params.id },
                options,
              );
            },
          },
        },
      },
    },

    mailbox: {
      async connectGoogle(
        params: ConnectGoogleMailboxParams,
        options?: RequestOptions,
      ): Promise<GoogleMailboxConnectUrl> {
        const { store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<GoogleMailboxConnectUrl>(
          `/v1/stores/${target_store_id}/mailboxes/google/connect-url`,
          payload,
          options,
        );
      },

      async create(
        params: CreateMailboxParams,
        options?: RequestOptions,
      ): Promise<Mailbox> {
        const { store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<Mailbox>(
          `/v1/stores/${target_store_id}/mailboxes`,
          payload,
          options,
        );
      },

      async update(
        params: UpdateMailboxParams,
        options?: RequestOptions,
      ): Promise<Mailbox> {
        const { id, store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.put<Mailbox>(
          `/v1/stores/${target_store_id}/mailboxes/${id}`,
          payload,
          options,
        );
      },

      async get(
        params: GetMailboxParams,
        options?: RequestOptions,
      ): Promise<Mailbox> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<Mailbox>(
          `/v1/stores/${target_store_id}/mailboxes/${params.id}`,
          options,
        );
      },

      async test(
        params: TestMailboxParams,
        options?: RequestOptions,
      ): Promise<TestMailboxResult> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<TestMailboxResult>(
          `/v1/stores/${target_store_id}/mailboxes/${params.id}/test`,
          {},
          options,
        );
      },

      async prepare(
        params: PrepareMailboxParams,
        options?: RequestOptions,
      ): Promise<Mailbox> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<Mailbox>(
          `/v1/stores/${target_store_id}/mailboxes/${params.id}/prepare`,
          {},
          options,
        );
      },

      async find(
        params?: FindMailboxesParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<Mailbox>> {
        const { store_id, ...queryParams } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<Mailbox>>(
          `/v1/stores/${target_store_id}/mailboxes`,
          { ...options, params: queryParams },
        );
      },
    },

    campaign: {
      async create(
        params: CreateCampaignParams,
        options?: RequestOptions,
      ): Promise<Campaign> {
        const { store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<Campaign>(
          `/v1/stores/${target_store_id}/campaigns`,
          payload,
          options,
        );
      },

      async update(
        params: UpdateCampaignParams,
        options?: RequestOptions,
      ): Promise<Campaign> {
        const { id, store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.put<Campaign>(
          `/v1/stores/${target_store_id}/campaigns/${id}`,
          payload,
          options,
        );
      },

      async get(
        params: GetCampaignParams,
        options?: RequestOptions,
      ): Promise<Campaign> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<Campaign>(
          `/v1/stores/${target_store_id}/campaigns/${params.id}`,
          options,
        );
      },

      async find(
        params?: FindCampaignsParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<Campaign>> {
        const { store_id, ...queryParams } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<Campaign>>(
          `/v1/stores/${target_store_id}/campaigns`,
          { ...options, params: queryParams },
        );
      },

      async launch(
        params: LaunchCampaignParams,
        options?: RequestOptions,
      ): Promise<Campaign> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<Campaign>(
          `/v1/stores/${target_store_id}/campaigns/${params.id}/launch`,
          {},
          options,
        );
      },

      async duplicate(
        params: DuplicateCampaignParams,
        options?: RequestOptions,
      ): Promise<Campaign> {
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

      async generatePersonalizedDrafts(
        params: GenerateOutreachPersonalizedDraftsParams,
        options?: RequestOptions,
      ): Promise<Campaign> {
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
      async find(
        params?: FindCampaignEnrollmentsParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<CampaignEnrollment>> {
        const { store_id, ...queryParams } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<CampaignEnrollment>>(
          `/v1/stores/${target_store_id}/campaign-enrollments`,
          { ...options, params: queryParams },
        );
      },

      async get(
        params: GetCampaignEnrollmentConversationParams,
        options?: RequestOptions,
      ): Promise<CampaignEnrollmentConversationResponse> {
        const { store_id, id, ...queryParams } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<CampaignEnrollmentConversationResponse>(
          `/v1/stores/${target_store_id}/campaign-enrollments/${id}`,
          { ...options, params: { ...queryParams, store_id: target_store_id } },
        );
      },

      async update(
        params: UpdateCampaignEnrollmentParams,
        options?: RequestOptions,
      ): Promise<CampaignEnrollment> {
        const { store_id, id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.put<CampaignEnrollment>(
          `/v1/stores/${target_store_id}/campaign-enrollments/${id}`,
          payload,
          options,
        );
      },

      async updateDraft(
        params: UpdateCampaignEnrollmentDraftParams,
        options?: RequestOptions,
      ): Promise<CampaignEnrollment> {
        const { store_id, id, draft_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.put<CampaignEnrollment>(
          `/v1/stores/${target_store_id}/campaign-enrollments/${id}/drafts/${draft_id}`,
          payload,
          options,
        );
      },

      async updateStepExecution(
        params: UpdateCampaignEnrollmentStepExecutionParams,
        options?: RequestOptions,
      ): Promise<CampaignEnrollmentConversationResponse> {
        const { store_id, id, execution_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<CampaignEnrollmentConversationResponse>(
          `/v1/stores/${target_store_id}/campaign-enrollments/${id}/step-executions/${execution_id}`,
          payload,
          options,
        );
      },

      async reply(
        params: ReplyCampaignEnrollmentParams,
        options?: RequestOptions,
      ): Promise<CampaignEnrollmentConversationResponse> {
        const { store_id, id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<CampaignEnrollmentConversationResponse>(
          `/v1/stores/${target_store_id}/campaign-enrollments/${id}/reply`,
          payload,
          options,
        );
      },

      async stop(
        params: StopCampaignEnrollmentParams,
        options?: RequestOptions,
      ): Promise<CampaignEnrollmentConversationResponse> {
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
      async find(
        params?: FindCampaignMessagesParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<CampaignMessage>> {
        const { store_id, ...queryParams } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<CampaignMessage>>(
          `/v1/stores/${target_store_id}/campaign-messages`,
          { ...options, params: queryParams },
        );
      },

      async update(
        params: UpdateCampaignMessageParams,
        options?: RequestOptions,
      ): Promise<CampaignMessage> {
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
      async create(
        params: CreateSuppressionParams,
        options?: RequestOptions,
      ): Promise<Suppression> {
        const { store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<Suppression>(
          `/v1/stores/${target_store_id}/suppressions`,
          payload,
          options,
        );
      },

      async update(
        params: UpdateSuppressionParams,
        options?: RequestOptions,
      ): Promise<Suppression> {
        const { id, store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.put<Suppression>(
          `/v1/stores/${target_store_id}/suppressions/${id}`,
          payload,
          options,
        );
      },

      async get(
        params: GetSuppressionParams,
        options?: RequestOptions,
      ): Promise<Suppression> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<Suppression>(
          `/v1/stores/${target_store_id}/suppressions/${params.id}`,
          options,
        );
      },

      async find(
        params?: FindSuppressionsParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<Suppression>> {
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
