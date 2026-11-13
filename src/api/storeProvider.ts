import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type { StripeSetup } from "../types/payment";
import type {
  CheckResendSetupParams,
  CheckStripeSetupParams,
  ConnectArkyElevenLabsStoreProviderParams,
  ConnectArkyMonriStoreProviderParams,
  ConnectArkyResendStoreProviderParams,
  ConnectArkyStripeStoreProviderParams,
  ConnectArkyTwilioStoreProviderParams,
  ConnectElevenLabsStoreProviderParams,
  ConnectMonriStoreProviderParams,
  ConnectNetworkTwilioStoreProviderParams,
  ConnectResendStoreProviderParams,
  ConnectStripeStoreProviderParams,
  ConnectTwilioStoreProviderParams,
  DeleteStoreProviderParams,
  FindResendDomainsParams,
  FindStoreNetworkLoginsParams,
  FindStoreProviderLoginsParams,
  FindStoreProvidersParams,
  GetStoreProviderParams,
  RefreshStripeStoreProviderParams,
  ReplaceMonriMerchantKeyParams,
  ReplaceResendKeyParams,
  ReplaceStripeKeysParams,
  ReplaceTwilioAuthTokenParams,
  ResendDomain,
  ResendSetup,
  SaveStripeWebhookSecretParams,
  SetStoreProviderStatusParams,
  SetStoreSmsSenderParams,
  SetUpStoreElevenLabsAgainParams,
  StoreNetworkLogin,
  StoreProvider,
  StoreProviderLogin,
} from "../types/storeProvider";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

const collection = "store-providers";

export const createStoreProviderApi = (apiConfig: ApiConfig) => {
  const resendPath = (storeId: string, id: string, verb: string) =>
    storePath(storeId, `${collection}/resend/${segment(id)}/${verb}`);

  const stripePath = (storeId: string, id: string, verb: string) =>
    storePath(storeId, `${collection}/stripe/${segment(id)}/${verb}`);

  return {
    find(params: FindStoreProvidersParams, options?: RequestOptions): Promise<PaginatedResponse<StoreProvider>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<StoreProvider>>(storePath(store_id, collection), {
        ...options,
        params: query,
      });
    },

    findLogins(params: FindStoreProviderLoginsParams, options?: RequestOptions): Promise<PaginatedResponse<StoreProviderLogin>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<StoreProviderLogin>>(storePath(store_id, `${collection}/logins`), {
        ...options,
        params: query,
      });
    },

    findNetworkLogins(params: FindStoreNetworkLoginsParams, options?: RequestOptions): Promise<PaginatedResponse<StoreNetworkLogin>> {
      return apiConfig.httpClient.get<PaginatedResponse<StoreNetworkLogin>>(storePath(params.store_id, "network-logins"), options);
    },

    get(params: GetStoreProviderParams, options?: RequestOptions): Promise<StoreProvider> {
      return apiConfig.httpClient.get<StoreProvider>(storeRecordPath(params.store_id, collection, params.id), options);
    },

    setStatus(params: SetStoreProviderStatusParams, options?: RequestOptions): Promise<StoreProvider> {
      return apiConfig.httpClient.put<StoreProvider>(
        `${storeRecordPath(params.store_id, collection, params.id)}/status`,
        { expected_updated_at: params.expected_updated_at, status: params.status },
        options,
      );
    },

    delete(params: DeleteStoreProviderParams, options?: RequestOptions): Promise<DeletedResponse> {
      return apiConfig.httpClient.delete<DeletedResponse>(storeRecordPath(params.store_id, collection, params.id), {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },

    connectResend(params: ConnectResendStoreProviderParams, options?: RequestOptions): Promise<StoreProvider> {
      requireId(params.id, "store provider");
      return apiConfig.httpClient.post<StoreProvider>(
        storePath(params.store_id, `${collection}/resend`),
        { id: params.id, api_key: params.api_key, webhook_secret: params.webhook_secret },
        options,
      );
    },

    connectArkyResend(params: ConnectArkyResendStoreProviderParams, options?: RequestOptions): Promise<StoreProvider> {
      requireId(params.id, "store provider");
      return apiConfig.httpClient.post<StoreProvider>(
        storePath(params.store_id, "store-providers/arky-resend"),
        { id: params.id, domains: params.domains },
        options,
      );
    },

    replaceResendKey(params: ReplaceResendKeyParams, options?: RequestOptions): Promise<StoreProvider> {
      return apiConfig.httpClient.post<StoreProvider>(
        resendPath(params.store_id, params.id, "replace-key"),
        { expected_updated_at: params.expected_updated_at, api_key: params.api_key, webhook_secret: params.webhook_secret },
        options,
      );
    },

    async findResendDomains(params: FindResendDomainsParams, options?: RequestOptions): Promise<PaginatedResponse<ResendDomain>> {
      const items = await apiConfig.httpClient.get<ResendDomain[]>(resendPath(params.store_id, params.id, "domains"), options);
      return { items, cursor: null };
    },

    checkResendSetup(params: CheckResendSetupParams, options?: RequestOptions): Promise<ResendSetup> {
      return apiConfig.httpClient.get<ResendSetup>(resendPath(params.store_id, params.id, "setup"), options);
    },

    connectTwilio(params: ConnectTwilioStoreProviderParams, options?: RequestOptions): Promise<StoreProvider> {
      requireId(params.id, "store provider");
      return apiConfig.httpClient.post<StoreProvider>(
        storePath(params.store_id, `${collection}/twilio`),
        { id: params.id, account_sid: params.account_sid, auth_token: params.auth_token, sms_sender: params.sms_sender },
        options,
      );
    },

    connectNetworkTwilio(params: ConnectNetworkTwilioStoreProviderParams, options?: RequestOptions): Promise<StoreProvider> {
      requireId(params.id, "store provider");
      return apiConfig.httpClient.post<StoreProvider>(
        storePath(params.store_id, `${collection}/network-twilio`),
        { id: params.id, sms_sender: params.sms_sender },
        options,
      );
    },

    connectArkyTwilio(params: ConnectArkyTwilioStoreProviderParams, options?: RequestOptions): Promise<StoreProvider> {
      requireId(params.id, "store provider");
      return apiConfig.httpClient.post<StoreProvider>(
        storePath(params.store_id, `${collection}/arky-twilio`),
        { id: params.id, sms_sender: params.sms_sender },
        options,
      );
    },

    connectElevenLabs(params: ConnectElevenLabsStoreProviderParams, options?: RequestOptions): Promise<StoreProvider> {
      requireId(params.id, "store provider");
      return apiConfig.httpClient.post<StoreProvider>(
        storePath(params.store_id, `${collection}/elevenlabs`),
        { id: params.id, api_key: params.api_key, region: params.region },
        options,
      );
    },

    connectArkyElevenLabs(params: ConnectArkyElevenLabsStoreProviderParams, options?: RequestOptions): Promise<StoreProvider> {
      requireId(params.id, "store provider");
      return apiConfig.httpClient.post<StoreProvider>(
        storePath(params.store_id, `${collection}/arky-elevenlabs`),
        { id: params.id },
        options,
      );
    },

    setUpElevenLabsAgain(params: SetUpStoreElevenLabsAgainParams, options?: RequestOptions): Promise<StoreProvider> {
      return apiConfig.httpClient.post<StoreProvider>(
        `${storeRecordPath(params.store_id, collection, params.id)}/elevenlabs-setup`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    replaceTwilioAuthToken(params: ReplaceTwilioAuthTokenParams, options?: RequestOptions): Promise<StoreProvider> {
      return apiConfig.httpClient.post<StoreProvider>(
        storePath(params.store_id, `${collection}/twilio/${segment(params.id)}/replace-auth-token`),
        { expected_updated_at: params.expected_updated_at, auth_token: params.auth_token },
        options,
      );
    },

    setSmsSender(params: SetStoreSmsSenderParams, options?: RequestOptions): Promise<StoreProvider> {
      return apiConfig.httpClient.put<StoreProvider>(
        `${storeRecordPath(params.store_id, collection, params.id)}/sms-sender`,
        { expected_updated_at: params.expected_updated_at, sms_sender: params.sms_sender },
        options,
      );
    },

    connectStripe(params: ConnectStripeStoreProviderParams, options?: RequestOptions): Promise<StoreProvider> {
      requireId(params.id, "store provider");
      return apiConfig.httpClient.post<StoreProvider>(
        storePath(params.store_id, `${collection}/stripe`),
        { id: params.id, restricted_key: params.restricted_key, publishable_key: params.publishable_key },
        options,
      );
    },

    connectMonri(params: ConnectMonriStoreProviderParams, options?: RequestOptions): Promise<StoreProvider> {
      requireId(params.id, "store provider");
      return apiConfig.httpClient.post<StoreProvider>(
        storePath(params.store_id, `${collection}/monri`),
        {
          id: params.id,
          environment: params.environment,
          merchant_key: params.merchant_key,
          authenticity_token: params.authenticity_token,
        },
        options,
      );
    },

    connectArkyStripe(params: ConnectArkyStripeStoreProviderParams, options?: RequestOptions): Promise<StoreProvider> {
      requireId(params.id, "store provider");
      return apiConfig.httpClient.post<StoreProvider>(
        storePath(params.store_id, "store-providers/arky-stripe"),
        { id: params.id },
        options,
      );
    },

    connectArkyMonri(params: ConnectArkyMonriStoreProviderParams, options?: RequestOptions): Promise<StoreProvider> {
      requireId(params.id, "store provider");
      return apiConfig.httpClient.post<StoreProvider>(
        storePath(params.store_id, "store-providers/arky-monri"),
        { id: params.id },
        options,
      );
    },

    replaceStripeKeys(params: ReplaceStripeKeysParams, options?: RequestOptions): Promise<StoreProvider> {
      return apiConfig.httpClient.post<StoreProvider>(
        stripePath(params.store_id, params.id, "replace-keys"),
        {
          expected_updated_at: params.expected_updated_at,
          restricted_key: params.restricted_key,
          publishable_key: params.publishable_key,
        },
        options,
      );
    },

    saveStripeWebhookSecret(params: SaveStripeWebhookSecretParams, options?: RequestOptions): Promise<StoreProvider> {
      return apiConfig.httpClient.post<StoreProvider>(
        stripePath(params.store_id, params.id, "webhook-secret"),
        {
          expected_updated_at: params.expected_updated_at,
          signing_secret: params.signing_secret,
          previous_secret_expires_at: params.previous_secret_expires_at,
        },
        options,
      );
    },

    refreshStripe(params: RefreshStripeStoreProviderParams, options?: RequestOptions): Promise<StoreProvider> {
      return apiConfig.httpClient.post<StoreProvider>(
        stripePath(params.store_id, params.id, "refresh"),
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    checkStripeSetup(params: CheckStripeSetupParams, options?: RequestOptions): Promise<StripeSetup> {
      return apiConfig.httpClient.get<StripeSetup>(stripePath(params.store_id, params.id, "setup"), options);
    },

    replaceMonriMerchantKey(params: ReplaceMonriMerchantKeyParams, options?: RequestOptions): Promise<StoreProvider> {
      return apiConfig.httpClient.post<StoreProvider>(
        storePath(params.store_id, `${collection}/monri/${segment(params.id)}/replace-merchant-key`),
        { expected_updated_at: params.expected_updated_at, merchant_key: params.merchant_key },
        options,
      );
    },
  };
};
