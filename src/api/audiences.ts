import type { ApiConfig } from "../services/clientTypes";
import type {
  AudienceReferenceParams,
  ConfirmAudienceParams,
  CreateAudienceBillingPortalSessionParams,
  CreateAudienceParams,
  CustomerAudienceMembershipReferenceParams,
  FindAudienceDisputesParams,
  FindAudienceMembershipsParams,
  FindAudienceRefundsParams,
  FindAudiencesParams,
  FindCustomerAudienceMembershipsParams,
  GetAudienceDisputeParams,
  GetAudienceMembershipParams,
  GetAudienceParams,
  GetAudienceRefundParams,
  ImportAudienceMembershipsParams,
  EnrollAudienceMembershipParams,
  PatchAudienceParams,
  PreviewAudienceMembershipImportParams,
  ReplaceAudienceMembershipInsightParams,
  RequestAudienceRefundParams,
  RequestOptions,
  UnsubscribeAudienceParams,
} from "../types/api";
import type {
  Audience,
  AudienceBillingPortalSession,
  AudienceDispute,
  AudienceMembership,
  AudienceMembershipBilling,
  AudienceRefund,
  CustomerAudienceMembership,
  PaginatedResponse,
} from "../types";

function storeId(apiConfig: ApiConfig, explicit?: string): string | undefined {
  return explicit || apiConfig.storeId;
}

function audiencePath(
  apiConfig: ApiConfig,
  explicitStoreId: string | undefined,
  audienceId?: string,
): string {
  const base = `/v1/stores/${storeId(apiConfig, explicitStoreId)}/audiences`;
  return audienceId ? `${base}/${audienceId}` : base;
}

function membershipPath(
  apiConfig: ApiConfig,
  params: AudienceReferenceParams,
  membershipId?: string,
): string {
  const base = `${audiencePath(apiConfig, params.store_id, params.audience_id)}/memberships`;
  return membershipId ? `${base}/${membershipId}` : base;
}

export const createAudiencesApi = (apiConfig: ApiConfig) => ({
  async create(
    params: CreateAudienceParams,
    options?: RequestOptions,
  ): Promise<Audience> {
    const { store_id, ...payload } = params;
    return apiConfig.httpClient.post<Audience>(
      audiencePath(apiConfig, store_id),
      payload,
      options,
    );
  },

  async find(
    params: FindAudiencesParams = {},
    options?: RequestOptions,
  ): Promise<PaginatedResponse<Audience>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Audience>>(
      audiencePath(apiConfig, store_id),
      { ...options, params: query },
    );
  },

  async get(
    params: GetAudienceParams,
    options?: RequestOptions,
  ): Promise<Audience> {
    return apiConfig.httpClient.get<Audience>(
      audiencePath(apiConfig, params.store_id, params.audience_id),
      options,
    );
  },

  async patch(
    params: PatchAudienceParams,
    options?: RequestOptions,
  ): Promise<Audience> {
    const { store_id, audience_id, ...payload } = params;
    return apiConfig.httpClient.patch<Audience>(
      audiencePath(apiConfig, store_id, audience_id),
      payload,
      options,
    );
  },

  async activate(
    params: AudienceReferenceParams,
    options?: RequestOptions,
  ): Promise<Audience> {
    return apiConfig.httpClient.post<Audience>(
      `${audiencePath(apiConfig, params.store_id, params.audience_id)}/activate`,
      {},
      options,
    );
  },

  async close(
    params: AudienceReferenceParams,
    options?: RequestOptions,
  ): Promise<Audience> {
    return apiConfig.httpClient.post<Audience>(
      `${audiencePath(apiConfig, params.store_id, params.audience_id)}/close`,
      {},
      options,
    );
  },

  async reopen(
    params: AudienceReferenceParams,
    options?: RequestOptions,
  ): Promise<Audience> {
    return apiConfig.httpClient.post<Audience>(
      `${audiencePath(apiConfig, params.store_id, params.audience_id)}/reopen`,
      {},
      options,
    );
  },

  async archive(
    params: AudienceReferenceParams,
    options?: RequestOptions,
  ): Promise<Audience> {
    return apiConfig.httpClient.post<Audience>(
      `${audiencePath(apiConfig, params.store_id, params.audience_id)}/archive`,
      {},
      options,
    );
  },

  memberships: {
    async find(
      params: FindAudienceMembershipsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<AudienceMembership>> {
      const { store_id, audience_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<AudienceMembership>>(
        membershipPath(apiConfig, { store_id, audience_id }),
        { ...options, params: query },
      );
    },

    async get(
      params: GetAudienceMembershipParams,
      options?: RequestOptions,
    ): Promise<AudienceMembership> {
      return apiConfig.httpClient.get<AudienceMembership>(
        membershipPath(apiConfig, params, params.membership_id),
        options,
      );
    },

    async enroll(
      params: EnrollAudienceMembershipParams,
      options?: RequestOptions,
    ): Promise<AudienceMembership> {
      const { store_id, audience_id, ...payload } = params;
      return apiConfig.httpClient.post<AudienceMembership>(
        membershipPath(apiConfig, { store_id, audience_id }),
        payload,
        options,
      );
    },

    async previewImport(
      params: PreviewAudienceMembershipImportParams,
      options?: RequestOptions,
    ): Promise<import("../types/api").AudienceMembershipImportRow[]> {
      const { store_id, audience_id, ...payload } = params;
      return apiConfig.httpClient.post<
        import("../types/api").AudienceMembershipImportRow[]
      >(
        `${membershipPath(apiConfig, { store_id, audience_id })}/import/preview`,
        payload,
        options,
      );
    },

    async import(
      params: ImportAudienceMembershipsParams,
      options?: RequestOptions,
    ): Promise<AudienceMembership[]> {
      const { store_id, audience_id, ...payload } = params;
      return apiConfig.httpClient.post<AudienceMembership[]>(
        `${membershipPath(apiConfig, { store_id, audience_id })}/import`,
        payload,
        options,
      );
    },

    async end(
      params: GetAudienceMembershipParams,
      options?: RequestOptions,
    ): Promise<AudienceMembership> {
      return apiConfig.httpClient.post<AudienceMembership>(
        `${membershipPath(apiConfig, params, params.membership_id)}/end`,
        {},
        options,
      );
    },

    async replaceInsight(
      params: ReplaceAudienceMembershipInsightParams,
      options?: RequestOptions,
    ): Promise<AudienceMembership> {
      const { insight } = params;
      return apiConfig.httpClient.put<AudienceMembership>(
        `${membershipPath(apiConfig, params, params.membership_id)}/insight`,
        { insight },
        options,
      );
    },

    async listBilling(
      params: GetAudienceMembershipParams,
      options?: RequestOptions,
    ): Promise<AudienceMembershipBilling> {
      return apiConfig.httpClient.get<AudienceMembershipBilling>(
        `${membershipPath(apiConfig, params, params.membership_id)}/billing`,
        options,
      );
    },

    refunds: {
      async find(
        params: FindAudienceRefundsParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<AudienceRefund>> {
        const { store_id, audience_id, membership_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<AudienceRefund>>(
          `${membershipPath(
            apiConfig,
            { store_id, audience_id },
            membership_id,
          )}/refunds`,
          { ...options, params: query },
        );
      },

      async request(
        params: RequestAudienceRefundParams,
        options?: RequestOptions,
      ): Promise<AudienceRefund> {
        const { store_id, audience_id, membership_id, ...payload } = params;
        return apiConfig.httpClient.post<AudienceRefund>(
          `${membershipPath(
            apiConfig,
            { store_id, audience_id },
            membership_id,
          )}/refunds`,
          payload,
          options,
        );
      },

      async get(
        params: GetAudienceRefundParams,
        options?: RequestOptions,
      ): Promise<AudienceRefund> {
        return apiConfig.httpClient.get<AudienceRefund>(
          `${membershipPath(apiConfig, params, params.membership_id)}/refunds/${params.refund_id}`,
          options,
        );
      },
    },

    disputes: {
      async find(
        params: FindAudienceDisputesParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<AudienceDispute>> {
        const { store_id, audience_id, membership_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<AudienceDispute>>(
          `${membershipPath(
            apiConfig,
            { store_id, audience_id },
            membership_id,
          )}/disputes`,
          { ...options, params: query },
        );
      },

      async get(
        params: GetAudienceDisputeParams,
        options?: RequestOptions,
      ): Promise<AudienceDispute> {
        return apiConfig.httpClient.get<AudienceDispute>(
          `${membershipPath(apiConfig, params, params.membership_id)}/disputes/${params.dispute_id}`,
          options,
        );
      },
    },
  },

  customer: {
    async find(
      params: FindCustomerAudienceMembershipsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CustomerAudienceMembership>> {
      return apiConfig.httpClient.get<
        PaginatedResponse<CustomerAudienceMembership>
      >("/v1/customer/audience-memberships", { ...options, params });
    },

    async get(
      params: CustomerAudienceMembershipReferenceParams,
      options?: RequestOptions,
    ): Promise<CustomerAudienceMembership> {
      return apiConfig.httpClient.get<CustomerAudienceMembership>(
        `/v1/customer/audience-memberships/${params.membership_id}`,
        options,
      );
    },

    async resendConfirmation(
      params: CustomerAudienceMembershipReferenceParams,
      options?: RequestOptions,
    ): Promise<CustomerAudienceMembership> {
      return apiConfig.httpClient.post<CustomerAudienceMembership>(
        `/v1/customer/audience-memberships/${params.membership_id}/confirmation/resend`,
        {},
        options,
      );
    },

    async resubscribe(
      params: CustomerAudienceMembershipReferenceParams,
      options?: RequestOptions,
    ): Promise<CustomerAudienceMembership> {
      return apiConfig.httpClient.post<CustomerAudienceMembership>(
        `/v1/customer/audience-memberships/${params.membership_id}/resubscribe`,
        {},
        options,
      );
    },

    async leave(
      params: CustomerAudienceMembershipReferenceParams,
      options?: RequestOptions,
    ): Promise<CustomerAudienceMembership> {
      return apiConfig.httpClient.post<CustomerAudienceMembership>(
        `/v1/customer/audience-memberships/${params.membership_id}/leave`,
        {},
        options,
      );
    },

    async cancelRenewal(
      params: CustomerAudienceMembershipReferenceParams,
      options?: RequestOptions,
    ): Promise<CustomerAudienceMembership> {
      return apiConfig.httpClient.post<CustomerAudienceMembership>(
        `/v1/customer/audience-memberships/${params.membership_id}/renewal/cancel`,
        {},
        options,
      );
    },

    async createBillingPortal(
      params: CreateAudienceBillingPortalSessionParams,
      options?: RequestOptions,
    ): Promise<AudienceBillingPortalSession> {
      const { membership_id, ...payload } = params;
      return apiConfig.httpClient.post<AudienceBillingPortalSession>(
        `/v1/customer/audience-memberships/${membership_id}/billing-portal`,
        payload,
        options,
      );
    },

    async confirm(
      params: ConfirmAudienceParams,
      options?: RequestOptions,
    ): Promise<CustomerAudienceMembership> {
      return apiConfig.httpClient.post<CustomerAudienceMembership>(
        "/v1/customer/audience-memberships/confirm",
        params,
        options,
      );
    },

    async unsubscribe(
      params: UnsubscribeAudienceParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      return apiConfig.httpClient.post<boolean>(
        "/v1/customer/audience-memberships/unsubscribe",
        params,
        options,
      );
    },
  },
});
