import type { ApiConfig } from "../services/clientTypes";
import type {
  RequestOptions,
  CreateAudienceParams,
  UpdateAudienceParams,
  FindAudiencesParams,
  GetAudienceParams,
  CreateAudienceTierParams,
  UpdateAudienceTierParams,
  FindAudienceTiersParams,
  GetAudienceTierParams,
  AddAudienceMemberParams,
  UpdateAudienceMemberParams,
  RemoveAudienceMemberParams,
  FindAudienceMembersParams,
  FindAudienceLeadsParams,
  RefundAudienceMemberParams,
  RefundAudienceMemberResult,
  FindAudiencePaymentsParams,
  GetAudiencePaymentParams,
  FindAudienceDisputesParams,
  GetAudienceDisputeParams,
  FindAudienceRefundsParams,
  GetAudienceRefundParams,
  RetryAudienceRefundParams,
  GetAudienceSubscriptionParams,
  PreviewAudienceMemberImportParams,
  ImportAudienceMembersParams,
  ImportAudienceMembersPreviewResult,
  ImportAudienceMembersResult,
  ManageAudienceParams,
  CreateAudiencePaymentMethodSessionParams,
  UnsubscribeAudienceParams,
  ConfirmAudienceParams,
} from "../types/api";
import type {
  PaginatedResponse,
  Audience,
  AudienceTier,
  AudiencePayment,
  AudienceDispute,
  AudienceRefund,
  AudienceSubscription,
  AudienceMember,
  AudienceLead,
  RemoveAudienceMemberResult,
  AudienceManagementResponse,
  AudiencePaymentMethodSessionResponse,
} from "../types";

export const createAudienceApi = (apiConfig: ApiConfig) => ({
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

    async getSubscription(
      params: ManageAudienceParams,
      options?: RequestOptions,
    ): Promise<AudienceSubscription> {
      return apiConfig.httpClient.post<AudienceSubscription>(
        "/v1/customer/audiences/subscription",
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
  ): Promise<ImportAudienceMembersPreviewResult> {
    const { store_id, audience_id, ...payload } = params;
    const target_store_id = store_id || apiConfig.storeId;
    return apiConfig.httpClient.post<ImportAudienceMembersPreviewResult>(
      `/v1/stores/${target_store_id}/audiences/${audience_id}/members/import/preview`,
      payload,
      options,
    );
  },

  leads: {
    async find(
      params: FindAudienceLeadsParams,
      options?: RequestOptions,
    ): Promise<AudienceLead[]> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<AudienceLead[]>(
        `/v1/stores/${target_store_id}/audiences/leads`,
        {
          ...options,
          params: { member_ids: JSON.stringify(params.member_ids) },
        },
      );
    },
  },

  members: {
    async add(
      params: AddAudienceMemberParams,
      options?: RequestOptions,
    ): Promise<AudienceMember> {
      const {
        store_id,
        audience_id,
        customer_id,
        fields,
        lead_description,
      } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<AudienceMember>(
        `/v1/stores/${target_store_id}/audiences/${audience_id}/members`,
        { customer_id, fields, lead_description },
        options,
      );
    },

    async update(
      params: UpdateAudienceMemberParams,
      options?: RequestOptions,
    ): Promise<AudienceMember> {
      const {
        store_id,
        audience_id,
        member_id,
        enrollment_status,
        fields,
        lead_description,
      } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.patch<AudienceMember>(
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
    ): Promise<PaginatedResponse<AudienceMember>> {
      const { store_id, audience_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      const path = audience_id
        ? `/v1/stores/${target_store_id}/audiences/${audience_id}/members`
        : `/v1/stores/${target_store_id}/audiences/members`;
      return apiConfig.httpClient.get<PaginatedResponse<AudienceMember>>(
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
        const { store_id, audience_id, member_id, ...queryParams } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<AudiencePayment>>(
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

    disputes: {
      async find(
        params: FindAudienceDisputesParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<AudienceDispute>> {
        const { store_id, audience_id, member_id, ...queryParams } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<AudienceDispute>>(
          `/v1/stores/${target_store_id}/audiences/${audience_id}/members/${member_id}/disputes`,
          { ...options, params: queryParams },
        );
      },

      async get(
        params: GetAudienceDisputeParams,
        options?: RequestOptions,
      ): Promise<AudienceDispute> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<AudienceDispute>(
          `/v1/stores/${target_store_id}/audiences/${params.audience_id}/members/${params.member_id}/disputes/${params.id}`,
          options,
        );
      },
    },

    refunds: {
      async find(
        params: FindAudienceRefundsParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<AudienceRefund>> {
        const { store_id, audience_id, member_id, ...queryParams } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<PaginatedResponse<AudienceRefund>>(
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
      async get(
        params: GetAudienceSubscriptionParams,
        options?: RequestOptions,
      ): Promise<AudienceSubscription> {
        const target_store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<AudienceSubscription>(
          `/v1/stores/${target_store_id}/audiences/${params.audience_id}/members/${params.member_id}/subscription`,
          options,
        );
      },
    },
  },
});
