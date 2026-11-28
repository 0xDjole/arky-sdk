import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type { StripeSetup } from "../types/payment";
import type {
  CheckResendSetupParams,
  CheckStripeSetupParams,
  ConnectArkyCroatiaCisTenantProviderParams,
  ConnectArkyElevenLabsTenantProviderParams,
  ConnectArkyMonriTenantProviderParams,
  ConnectArkyOfsCloudTenantProviderParams,
  ConnectArkyResendTenantProviderParams,
  ConnectArkyStripeTenantProviderParams,
  ConnectArkyTwilioTenantProviderParams,
  ConnectCroatiaCisTenantProviderParams,
  ConnectElevenLabsTenantProviderParams,
  ConnectMonriTenantProviderParams,
  ConnectNetworkTwilioTenantProviderParams,
  ConnectOfsCloudTenantProviderParams,
  ConnectResendTenantProviderParams,
  ConnectStripeTenantProviderParams,
  ConnectTwilioTenantProviderParams,
  DeleteTenantProviderParams,
  FindResendDomainsParams,
  FindTenantNetworkLoginsParams,
  FindTenantProviderLoginsParams,
  FindTenantProvidersParams,
  GetTenantProviderParams,
  RefreshStripeTenantProviderParams,
  ReplaceCroatiaCisCertificateParams,
  ReplaceMonriMerchantKeyParams,
  ReplaceResendKeyParams,
  ReplaceStripeKeysParams,
  ReplaceTwilioAuthTokenParams,
  ResendDomain,
  ResendSetup,
  SaveStripeWebhookSecretParams,
  SetTenantProviderStatusParams,
  SetTenantSmsSenderParams,
  SetUpTenantElevenLabsAgainParams,
  TenantNetworkLogin,
  TenantProvider,
  TenantProviderLogin,
} from "../types/tenantProvider";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

const collection = "tenant-providers";

export const createTenantProviderApi = (apiConfig: ApiConfig) => {
  const resendPath = (tenantId: string, id: string, verb: string) =>
    tenantPath(tenantId, `${collection}/resend/${segment(id)}/${verb}`);

  const stripePath = (tenantId: string, id: string, verb: string) =>
    tenantPath(tenantId, `${collection}/stripe/${segment(id)}/${verb}`);

  return {
    find(params: FindTenantProvidersParams, options?: RequestOptions): Promise<PaginatedResponse<TenantProvider>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<TenantProvider>>(tenantPath(tenant_id, collection), {
        ...options,
        params: query,
      });
    },

    findLogins(params: FindTenantProviderLoginsParams, options?: RequestOptions): Promise<PaginatedResponse<TenantProviderLogin>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<TenantProviderLogin>>(tenantPath(tenant_id, `${collection}/logins`), {
        ...options,
        params: query,
      });
    },

    findNetworkLogins(params: FindTenantNetworkLoginsParams, options?: RequestOptions): Promise<PaginatedResponse<TenantNetworkLogin>> {
      return apiConfig.httpClient.get<PaginatedResponse<TenantNetworkLogin>>(tenantPath(params.tenant_id, "network-logins"), options);
    },

    get(params: GetTenantProviderParams, options?: RequestOptions): Promise<TenantProvider> {
      return apiConfig.httpClient.get<TenantProvider>(tenantRecordPath(params.tenant_id, collection, params.id), options);
    },

    setStatus(params: SetTenantProviderStatusParams, options?: RequestOptions): Promise<TenantProvider> {
      return apiConfig.httpClient.put<TenantProvider>(
        `${tenantRecordPath(params.tenant_id, collection, params.id)}/status`,
        { expected_updated_at: params.expected_updated_at, status: params.status },
        options,
      );
    },

    delete(params: DeleteTenantProviderParams, options?: RequestOptions): Promise<DeletedResponse> {
      return apiConfig.httpClient.delete<DeletedResponse>(tenantRecordPath(params.tenant_id, collection, params.id), {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },

    connectResend(params: ConnectResendTenantProviderParams, options?: RequestOptions): Promise<TenantProvider> {
      requireId(params.id, "tenant provider");
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, `${collection}/resend`),
        { id: params.id, api_key: params.api_key, webhook_secret: params.webhook_secret },
        options,
      );
    },

    connectArkyResend(params: ConnectArkyResendTenantProviderParams, options?: RequestOptions): Promise<TenantProvider> {
      requireId(params.id, "tenant provider");
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, "tenant-providers/arky-resend"),
        { id: params.id, domains: params.domains },
        options,
      );
    },

    replaceResendKey(params: ReplaceResendKeyParams, options?: RequestOptions): Promise<TenantProvider> {
      return apiConfig.httpClient.post<TenantProvider>(
        resendPath(params.tenant_id, params.id, "replace-key"),
        { expected_updated_at: params.expected_updated_at, api_key: params.api_key, webhook_secret: params.webhook_secret },
        options,
      );
    },

    findResendDomains(params: FindResendDomainsParams, options?: RequestOptions): Promise<ResendDomain[]> {
      return apiConfig.httpClient.get<ResendDomain[]>(resendPath(params.tenant_id, params.id, "domains"), options);
    },

    checkResendSetup(params: CheckResendSetupParams, options?: RequestOptions): Promise<ResendSetup> {
      return apiConfig.httpClient.get<ResendSetup>(resendPath(params.tenant_id, params.id, "setup"), options);
    },

    connectTwilio(params: ConnectTwilioTenantProviderParams, options?: RequestOptions): Promise<TenantProvider> {
      requireId(params.id, "tenant provider");
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, `${collection}/twilio`),
        { id: params.id, account_sid: params.account_sid, auth_token: params.auth_token, sms_sender: params.sms_sender },
        options,
      );
    },

    connectNetworkTwilio(params: ConnectNetworkTwilioTenantProviderParams, options?: RequestOptions): Promise<TenantProvider> {
      requireId(params.id, "tenant provider");
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, `${collection}/network-twilio`),
        { id: params.id, sms_sender: params.sms_sender },
        options,
      );
    },

    connectArkyTwilio(params: ConnectArkyTwilioTenantProviderParams, options?: RequestOptions): Promise<TenantProvider> {
      requireId(params.id, "tenant provider");
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, `${collection}/arky-twilio`),
        { id: params.id, sms_sender: params.sms_sender },
        options,
      );
    },

    connectElevenLabs(params: ConnectElevenLabsTenantProviderParams, options?: RequestOptions): Promise<TenantProvider> {
      requireId(params.id, "tenant provider");
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, `${collection}/elevenlabs`),
        { id: params.id, api_key: params.api_key, region: params.region },
        options,
      );
    },

    connectArkyElevenLabs(params: ConnectArkyElevenLabsTenantProviderParams, options?: RequestOptions): Promise<TenantProvider> {
      requireId(params.id, "tenant provider");
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, `${collection}/arky-elevenlabs`),
        { id: params.id },
        options,
      );
    },

    setUpElevenLabsAgain(params: SetUpTenantElevenLabsAgainParams, options?: RequestOptions): Promise<TenantProvider> {
      return apiConfig.httpClient.post<TenantProvider>(
        `${tenantRecordPath(params.tenant_id, collection, params.id)}/elevenlabs-setup`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    replaceTwilioAuthToken(params: ReplaceTwilioAuthTokenParams, options?: RequestOptions): Promise<TenantProvider> {
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, `${collection}/twilio/${segment(params.id)}/replace-auth-token`),
        { expected_updated_at: params.expected_updated_at, auth_token: params.auth_token },
        options,
      );
    },

    setSmsSender(params: SetTenantSmsSenderParams, options?: RequestOptions): Promise<TenantProvider> {
      return apiConfig.httpClient.put<TenantProvider>(
        `${tenantRecordPath(params.tenant_id, collection, params.id)}/sms-sender`,
        { expected_updated_at: params.expected_updated_at, sms_sender: params.sms_sender },
        options,
      );
    },

    connectStripe(params: ConnectStripeTenantProviderParams, options?: RequestOptions): Promise<TenantProvider> {
      requireId(params.id, "tenant provider");
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, `${collection}/stripe`),
        { id: params.id, restricted_key: params.restricted_key, publishable_key: params.publishable_key },
        options,
      );
    },

    connectMonri(params: ConnectMonriTenantProviderParams, options?: RequestOptions): Promise<TenantProvider> {
      requireId(params.id, "tenant provider");
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, `${collection}/monri`),
        {
          id: params.id,
          environment: params.environment,
          merchant_key: params.merchant_key,
          authenticity_token: params.authenticity_token,
        },
        options,
      );
    },

    connectArkyStripe(params: ConnectArkyStripeTenantProviderParams, options?: RequestOptions): Promise<TenantProvider> {
      requireId(params.id, "tenant provider");
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, "tenant-providers/arky-stripe"),
        { id: params.id },
        options,
      );
    },

    connectArkyMonri(params: ConnectArkyMonriTenantProviderParams, options?: RequestOptions): Promise<TenantProvider> {
      requireId(params.id, "tenant provider");
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, "tenant-providers/arky-monri"),
        { id: params.id },
        options,
      );
    },

    replaceStripeKeys(params: ReplaceStripeKeysParams, options?: RequestOptions): Promise<TenantProvider> {
      return apiConfig.httpClient.post<TenantProvider>(
        stripePath(params.tenant_id, params.id, "replace-keys"),
        {
          expected_updated_at: params.expected_updated_at,
          restricted_key: params.restricted_key,
          publishable_key: params.publishable_key,
        },
        options,
      );
    },

    saveStripeWebhookSecret(params: SaveStripeWebhookSecretParams, options?: RequestOptions): Promise<TenantProvider> {
      return apiConfig.httpClient.post<TenantProvider>(
        stripePath(params.tenant_id, params.id, "webhook-secret"),
        {
          expected_updated_at: params.expected_updated_at,
          signing_secret: params.signing_secret,
          previous_secret_expires_at: params.previous_secret_expires_at,
        },
        options,
      );
    },

    refreshStripe(params: RefreshStripeTenantProviderParams, options?: RequestOptions): Promise<TenantProvider> {
      return apiConfig.httpClient.post<TenantProvider>(
        stripePath(params.tenant_id, params.id, "refresh"),
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    checkStripeSetup(params: CheckStripeSetupParams, options?: RequestOptions): Promise<StripeSetup> {
      return apiConfig.httpClient.get<StripeSetup>(stripePath(params.tenant_id, params.id, "setup"), options);
    },

    replaceMonriMerchantKey(params: ReplaceMonriMerchantKeyParams, options?: RequestOptions): Promise<TenantProvider> {
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, `${collection}/monri/${segment(params.id)}/replace-merchant-key`),
        { expected_updated_at: params.expected_updated_at, merchant_key: params.merchant_key },
        options,
      );
    },

    connectCroatiaCis(params: ConnectCroatiaCisTenantProviderParams, options?: RequestOptions): Promise<TenantProvider> {
      requireId(params.id, "tenant provider");
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, `${collection}/croatia-cis`),
        { id: params.id, certificate_p12: params.certificate_p12, password: params.password },
        options,
      );
    },

    replaceCroatiaCisCertificate(params: ReplaceCroatiaCisCertificateParams, options?: RequestOptions): Promise<TenantProvider> {
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, `${collection}/croatia-cis/${segment(params.id)}/replace-certificate`),
        {
          expected_updated_at: params.expected_updated_at,
          certificate_p12: params.certificate_p12,
          password: params.password,
        },
        options,
      );
    },

    connectArkyCroatiaCis(params: ConnectArkyCroatiaCisTenantProviderParams, options?: RequestOptions): Promise<TenantProvider> {
      requireId(params.id, "tenant provider");
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, `${collection}/arky-croatia-cis`),
        { id: params.id },
        options,
      );
    },

    connectOfsCloud(params: ConnectOfsCloudTenantProviderParams, options?: RequestOptions): Promise<TenantProvider> {
      requireId(params.id, "tenant provider");
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, `${collection}/ofs-cloud`),
        { id: params.id, api_key: params.api_key },
        options,
      );
    },

    connectArkyOfsCloud(params: ConnectArkyOfsCloudTenantProviderParams, options?: RequestOptions): Promise<TenantProvider> {
      requireId(params.id, "tenant provider");
      return apiConfig.httpClient.post<TenantProvider>(
        tenantPath(params.tenant_id, `${collection}/arky-ofs-cloud`),
        { id: params.id },
        options,
      );
    },
  };
};
