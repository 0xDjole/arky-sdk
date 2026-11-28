import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  AllowTenantEmailSendingParams,
  CreateTenantCardSetupParams,
  TenantCardSetup,
  TenantSubscriptionPayment,
  TenantRead,
  TenantPlanCharge,
  ReportTenantPlanPaymentParams,
  FindTenantPlanChargesParams,
  SetTenantSubscriptionCardParams,
  CancelTenantSubscriptionParams,
  GrantTenantPlanParams,
  FindTestTenantsParams,
  FindTestTenantsByLiveTenantsParams,
  WipeTenantParams,
  CreateTenantParams,
  EndTenantGrantParams,
  GetTenantUsageParams,
  GetTenantPlanParams,
  GetTenantAgreementParams,
  FindTenantsParams,
  GetTenantParams,
  GetTenantSubscriptionParams,
  PauseTenantEmailSendingParams,
  RequestTenantDeletionParams,
  ResumeTenantParams,
  SuspendTenantParams,
  ChangeTenantPlanParams,
  Tenant,
  TenantPlanSummary,
  TenantSubscription,
  TenantUsageSummary,
  UpdateTenantParams,
  NameTenantDefaultLocationParams,
} from "../types/tenant";
import type {
  AcceptTenantInviteParams,
  ChangeTenantMemberStatusParams,
  FindOwnTenantMembershipsParams,
  FindTenantMemberDirectoryParams,
  FindTenantMembersParams,
  GetOwnTenantMembershipParams,
  InviteTenantMemberParams,
  ResendTenantInviteParams,
  FindTenantMemberSessionsParams,
  RemoveTenantMemberParams,
  RevokeTenantMemberSessionParams,
  TenantMember,
  TenantMemberProfile,
  TenantMembership,
  TenantMembershipWithTenantName,
  UpdateTenantMemberRolesParams,
} from "../types/tenantRole";
import type { AccountSession } from "../types/account";
import type { TenantAgreement } from "../types/network";
import { requireTenantId } from "../utils/tenantTarget";
import { requireId } from "../utils/ids";
import { segment, tenantPath } from "./paths";

export const createTenantApi = (apiConfig: ApiConfig) => ({
  create(params: CreateTenantParams, options?: RequestOptions): Promise<Tenant> {
    requireId(params.id, "tenant");
    return apiConfig.httpClient.post<Tenant>("/v1/tenants", params, options);
  },

  update(params: UpdateTenantParams, options?: RequestOptions): Promise<Tenant> {
    const { id, ...body } = params;
    return apiConfig.httpClient.put<Tenant>(`/v1/tenants/${requireTenantId(id)}`, body, options);
  },

  get(params: GetTenantParams, options?: RequestOptions): Promise<TenantRead> {
    return apiConfig.httpClient.get<TenantRead>(`/v1/tenants/${requireTenantId(params.id)}`, options);
  },

  nameDefaultLocation(params: NameTenantDefaultLocationParams, options?: RequestOptions): Promise<Tenant> {
    return apiConfig.httpClient.put<Tenant>(
      `/v1/tenants/${requireTenantId(params.id)}/default-location`,
      {
        tenant_location_id: requireId(params.tenant_location_id, "tenant location"),
        expected_updated_at: params.expected_updated_at,
      },
      options,
    );
  },

  find(params: FindTenantsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Tenant>> {
    return apiConfig.httpClient.get<PaginatedResponse<Tenant>>("/v1/tenants", { ...options, params });
  },

  pauseEmailSending(params: PauseTenantEmailSendingParams, options?: RequestOptions): Promise<Tenant> {
    return apiConfig.httpClient.post<Tenant>(
      tenantPath(params.tenant_id, "pause-email-sending"),
      { expected_updated_at: params.expected_updated_at, reason: params.reason },
      options,
    );
  },

  allowEmailSending(params: AllowTenantEmailSendingParams, options?: RequestOptions): Promise<Tenant> {
    return apiConfig.httpClient.post<Tenant>(
      tenantPath(params.tenant_id, "allow-email-sending"),
      { expected_updated_at: params.expected_updated_at },
      options,
    );
  },

  suspend(params: SuspendTenantParams, options?: RequestOptions): Promise<Tenant> {
    return apiConfig.httpClient.post<Tenant>(
      tenantPath(params.tenant_id, "suspend"),
      { expected_updated_at: params.expected_updated_at, reason: params.reason },
      options,
    );
  },

  resume(params: ResumeTenantParams, options?: RequestOptions): Promise<Tenant> {
    return apiConfig.httpClient.post<Tenant>(
      tenantPath(params.tenant_id, "resume"),
      { expected_updated_at: params.expected_updated_at },
      options,
    );
  },

  requestDeletion(params: RequestTenantDeletionParams, options?: RequestOptions): Promise<Tenant> {
    return apiConfig.httpClient.post<Tenant>(
      `/v1/tenants/${requireTenantId(params.id)}/deletion`,
      { confirmation: params.confirmation, expected_updated_at: params.expected_updated_at },
      options,
    );
  },

  subscription: {
    get(params: GetTenantSubscriptionParams, options?: RequestOptions): Promise<TenantSubscription> {
      return apiConfig.httpClient.get<TenantSubscription>(tenantPath(params.tenant_id, "subscription"), options);
    },

    changePlan(params: ChangeTenantPlanParams, options?: RequestOptions): Promise<TenantSubscription> {
      const { tenant_id, ...body } = params;
      return apiConfig.httpClient.put<TenantSubscription>(tenantPath(tenant_id, "subscription/plan"), body, options);
    },
    createCardSetup(params: CreateTenantCardSetupParams, options?: RequestOptions): Promise<TenantCardSetup> {
      return apiConfig.httpClient.post<TenantCardSetup>(`/v1/networks/${segment(requireId(params.network_id, "network"))}/card-setups`,
        { id: requireId(params.id, "card setup"), tenant_id: requireTenantId(params.tenant_id) }, options);
    },
    setCard(params: SetTenantSubscriptionCardParams, options?: RequestOptions): Promise<TenantSubscription> {
      const { tenant_id, ...body } = params;
      return apiConfig.httpClient.put<TenantSubscription>(tenantPath(tenant_id, "subscription/card"), body, options);
    },
    pendingPayment(params: GetTenantSubscriptionParams, options?: RequestOptions): Promise<TenantSubscriptionPayment> {
      return apiConfig.httpClient.get<TenantSubscriptionPayment>(tenantPath(params.tenant_id, "subscription/payment"), options);
    },
    reportPayment(params: ReportTenantPlanPaymentParams, options?: RequestOptions): Promise<TenantPlanCharge> {
      return apiConfig.httpClient.post<TenantPlanCharge>(
        tenantPath(params.tenant_id, "subscription/payment/report"),
        { payment_intent_id: params.payment_intent_id },
        options,
      );
    },
    findCharges(params: FindTenantPlanChargesParams, options?: RequestOptions): Promise<PaginatedResponse<TenantPlanCharge>> {
      return apiConfig.httpClient.get<PaginatedResponse<TenantPlanCharge>>(tenantPath(params.tenant_id, "subscription/charges"), {
        ...options,
        params: { limit: params.limit, cursor: params.cursor },
      });
    },
    cancel(params: CancelTenantSubscriptionParams, options?: RequestOptions): Promise<TenantSubscription> {
      const { tenant_id, ...body } = params;
      return apiConfig.httpClient.post<TenantSubscription>(tenantPath(tenant_id, "subscription/cancel"), body, options);
    },
    grant(params: GrantTenantPlanParams, options?: RequestOptions): Promise<TenantSubscription> {
      const { tenant_id, ...body } = params;
      return apiConfig.httpClient.post<TenantSubscription>(tenantPath(tenant_id, "subscription/grant"), body, options);
    },
    endGrant(params: EndTenantGrantParams, options?: RequestOptions): Promise<TenantSubscription> {
      const { tenant_id, ...body } = params;
      return apiConfig.httpClient.post<TenantSubscription>(tenantPath(tenant_id, "subscription/end-grant"), body, options);
    },
  },

  testTenants: {
    find(params: FindTestTenantsParams, options?: RequestOptions): Promise<PaginatedResponse<Tenant>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Tenant>>(tenantPath(tenant_id, "test-tenants"), { ...options, params: query });
    },

    findByLiveTenants(params: FindTestTenantsByLiveTenantsParams, options?: RequestOptions): Promise<PaginatedResponse<Tenant>> {
      return apiConfig.httpClient.get<PaginatedResponse<Tenant>>("/v1/tenants/test-tenants", {
        ...options,
        params: { live_tenant_ids: params.live_tenant_ids, limit: params.limit, cursor: params.cursor },
      });
    },
  },
  wipe(params: WipeTenantParams, options?: RequestOptions): Promise<Tenant> {
    const { id, ...body } = params;
    return apiConfig.httpClient.post<Tenant>(tenantPath(id, "wipe"), body, options);
  },

  usage: {
    get(params: GetTenantUsageParams, options?: RequestOptions): Promise<TenantUsageSummary> {
      return apiConfig.httpClient.get<TenantUsageSummary>(tenantPath(params.tenant_id, "usage"), options);
    },
  },

  plan: {
    get(params: GetTenantPlanParams, options?: RequestOptions): Promise<TenantPlanSummary> {
      return apiConfig.httpClient.get<TenantPlanSummary>(tenantPath(params.tenant_id, "plan"), options);
    },
  },

  agreement: {
    get(params: GetTenantAgreementParams, options?: RequestOptions): Promise<TenantAgreement> {
      return apiConfig.httpClient.get<TenantAgreement>(tenantPath(params.tenant_id, "agreement"), options);
    },
  },

  member: {
    invite(params: InviteTenantMemberParams, options?: RequestOptions): Promise<TenantMembership> {
      return apiConfig.httpClient.post<TenantMembership>(
        tenantPath(params.tenant_id, "invitation"),
        { id: requireId(params.id, "membership"), contact: params.contact, role_ids: params.role_ids },
        options,
      );
    },

    resendInvite(params: ResendTenantInviteParams, options?: RequestOptions): Promise<boolean> {
      return apiConfig.httpClient.post<boolean>(
        tenantPath(params.tenant_id, `members/${segment(requireId(params.id, "membership"))}/invitation`),
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    find(params: FindTenantMembersParams, options?: RequestOptions): Promise<PaginatedResponse<TenantMember>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<TenantMember>>(tenantPath(tenant_id, "members"), {
        ...options,
        params: query,
      });
    },

    findDirectory(
      params: FindTenantMemberDirectoryParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<TenantMemberProfile>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<TenantMemberProfile>>(tenantPath(tenant_id, "members/directory"), {
        ...options,
        params: query,
      });
    },

    findOwn(
      params: FindOwnTenantMembershipsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<TenantMembershipWithTenantName>> {
      return apiConfig.httpClient.get<PaginatedResponse<TenantMembershipWithTenantName>>("/v1/tenants/memberships", {
        ...options,
        params,
      });
    },

    getOwn(params: GetOwnTenantMembershipParams, options?: RequestOptions): Promise<TenantMembershipWithTenantName | null> {
      return apiConfig.httpClient.get<TenantMembershipWithTenantName | null>(tenantPath(params.tenant_id, "membership"), options);
    },

    acceptInvite(params: AcceptTenantInviteParams, options?: RequestOptions): Promise<TenantMembership> {
      const { tenant_id, ...body } = params;
      return apiConfig.httpClient.post<TenantMembership>(tenantPath(tenant_id, "membership/accept"), body, options);
    },

    remove(params: RemoveTenantMemberParams, options?: RequestOptions): Promise<true> {
      return apiConfig.httpClient.delete<true>(
        tenantPath(params.tenant_id, `members/${segment(requireId(params.id, "membership"))}`),
        {
          ...options,
          params: { expected_updated_at: params.expected_updated_at },
        },
      );
    },

    updateRoles(params: UpdateTenantMemberRolesParams, options?: RequestOptions): Promise<TenantMembership> {
      return apiConfig.httpClient.put<TenantMembership>(
        tenantPath(params.tenant_id, `members/${segment(requireId(params.id, "membership"))}/roles`),
        { expected_updated_at: params.expected_updated_at, role_ids: params.role_ids },
        options,
      );
    },

    changeStatus(params: ChangeTenantMemberStatusParams, options?: RequestOptions): Promise<TenantMembership> {
      return apiConfig.httpClient.put<TenantMembership>(
        tenantPath(params.tenant_id, `members/${segment(requireId(params.id, "membership"))}/status`),
        { expected_updated_at: params.expected_updated_at, status: params.status },
        options,
      );
    },

    findSessions(
      params: FindTenantMemberSessionsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<AccountSession>> {
      const { tenant_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<AccountSession>>(
        tenantPath(tenant_id, `members/${segment(requireId(id, "membership"))}/sessions`),
        { ...options, params: query },
      );
    },

    revokeSession(params: RevokeTenantMemberSessionParams, options?: RequestOptions): Promise<AccountSession> {
      return apiConfig.httpClient.delete<AccountSession>(
        tenantPath(
          params.tenant_id,
          `members/${segment(requireId(params.id, "membership"))}/sessions/${segment(requireId(params.session_id, "session"))}`,
        ),
        options,
      );
    },
  },
});
