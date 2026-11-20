import type { ApiConfig } from "../services/clientTypes";
import type { AdminRequestOptions, RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  ArchiveFiscalDeviceParams,
  CreateFiscalDeviceParams,
  CreateFiscalDeviceTokenParams,
  FindFiscalDevicesParams,
  FindFiscalDeviceTokensParams,
  FiscalDevice,
  FiscalDeviceAgentDevice,
  FiscalDeviceHeartbeat,
  FiscalDeviceHeartbeatParams,
  FiscalDeviceToken,
  GetFiscalDeviceParams,
  IssuedFiscalDeviceToken,
  ReleaseFiscalDeviceParams,
  RenameFiscalDeviceParams,
  RevokeFiscalDeviceTokenParams,
} from "../types/fiscalDevice";
import type {
  ClaimFiscalReceiptParams,
  FiscalAgentClaim,
  FiscalReceipt,
  ReportFiscalReceiptParams,
} from "../types/fiscalReceipt";
import { createHttpClient } from "../services/createHttpClient";
import { requireId } from "../utils/ids";
import { requireStoreId } from "../utils/storeTarget";
import { segment, storePath, storeRecordPath } from "./paths";

const collection = "fiscal-devices";

export const createFiscalDeviceApi = (apiConfig: ApiConfig) => {
  const devicePath = (storeId: string, id: string) => storeRecordPath(storeId, collection, id);
  const tokensPath = (storeId: string, fiscalDeviceId: string) => `${devicePath(storeId, fiscalDeviceId)}/tokens`;

  return {
    find(params: FindFiscalDevicesParams, options?: RequestOptions): Promise<PaginatedResponse<FiscalDevice>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<FiscalDevice>>(storePath(store_id, collection), {
        ...options,
        params: query,
      });
    },

    get(params: GetFiscalDeviceParams, options?: RequestOptions): Promise<FiscalDevice> {
      return apiConfig.httpClient.get<FiscalDevice>(devicePath(params.store_id, params.id), options);
    },

    create(params: CreateFiscalDeviceParams, options?: RequestOptions): Promise<FiscalDevice> {
      requireId(params.id, "fiscal device");
      return apiConfig.httpClient.post<FiscalDevice>(
        storePath(params.store_id, collection),
        { id: params.id, store_location_id: params.store_location_id, key: params.key, type: params.type },
        options,
      );
    },

    rename(params: RenameFiscalDeviceParams, options?: RequestOptions): Promise<FiscalDevice> {
      return apiConfig.httpClient.put<FiscalDevice>(
        devicePath(params.store_id, params.id),
        { expected_updated_at: params.expected_updated_at, key: params.key },
        options,
      );
    },

    archive(params: ArchiveFiscalDeviceParams, options?: RequestOptions): Promise<FiscalDevice> {
      return apiConfig.httpClient.post<FiscalDevice>(
        `${devicePath(params.store_id, params.id)}/archive`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    release(params: ReleaseFiscalDeviceParams, options?: RequestOptions): Promise<FiscalDevice> {
      return apiConfig.httpClient.post<FiscalDevice>(
        `${devicePath(params.store_id, params.id)}/release`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    token: {
      find(params: FindFiscalDeviceTokensParams, options?: RequestOptions): Promise<FiscalDeviceToken[]> {
        return apiConfig.httpClient.get<FiscalDeviceToken[]>(tokensPath(params.store_id, params.fiscal_device_id), options);
      },

      create(params: CreateFiscalDeviceTokenParams, options?: RequestOptions): Promise<IssuedFiscalDeviceToken> {
        requireId(params.id, "fiscal device token");
        return apiConfig.httpClient.post<IssuedFiscalDeviceToken>(
          tokensPath(params.store_id, params.fiscal_device_id),
          { id: params.id, name: params.name },
          options,
        );
      },

      revoke(params: RevokeFiscalDeviceTokenParams, options?: RequestOptions): Promise<FiscalDeviceToken> {
        return apiConfig.httpClient.post<FiscalDeviceToken>(
          `${tokensPath(params.store_id, params.fiscal_device_id)}/${segment(params.id)}/revoke`,
          undefined,
          options,
        );
      },
    },
  };
};

const FISCAL_DEVICE_TOKEN_PREFIX = "arky_fd_";

export interface FiscalDeviceAgentConfig {
  apiUrl: string;
  storeId: string;
  token: string;
  redirect?: RequestRedirect;
}

export const createFiscalDeviceAgent = (config: FiscalDeviceAgentConfig) => {
  const storeId = requireStoreId(config.storeId);
  if (
    typeof config.token !== "string" ||
    !config.token.startsWith(FISCAL_DEVICE_TOKEN_PREFIX) ||
    config.token.trim() !== config.token
  ) {
    throw new TypeError("A fiscal device agent needs the device token the owner created for this PC");
  }
  const token = config.token;
  const httpClient = createHttpClient({
    baseUrl: config.apiUrl.replace(/\/+$/, ""),
    authStorage: { getTokens: () => ({ access_token: token }) },
    onUnauthorized: () => false,
    redirect: config.redirect,
  });
  const agentPath = (path: string) => storePath(storeId, `fiscal-device/${path}`);

  return {
    getDevice(options?: AdminRequestOptions): Promise<FiscalDeviceAgentDevice> {
      return httpClient.get<FiscalDeviceAgentDevice>(storePath(storeId, "fiscal-device"), options);
    },

    heartbeat(params: FiscalDeviceHeartbeatParams, options?: AdminRequestOptions): Promise<FiscalDeviceHeartbeat> {
      return httpClient.post<FiscalDeviceHeartbeat>(agentPath("heartbeat"), { readiness: params.readiness }, options);
    },

    claim(params: ClaimFiscalReceiptParams, options?: AdminRequestOptions): Promise<FiscalAgentClaim> {
      return httpClient.post<FiscalAgentClaim>(
        agentPath(`receipts/${segment(params.fiscal_receipt_id)}/claim`),
        {},
        options,
      );
    },

    report(params: ReportFiscalReceiptParams, options?: AdminRequestOptions): Promise<FiscalReceipt> {
      return httpClient.post<FiscalReceipt>(
        agentPath(`receipts/${segment(params.fiscal_receipt_id)}/outcome`),
        params.outcome,
        options,
      );
    },
  };
};

export type FiscalDeviceAgent = ReturnType<typeof createFiscalDeviceAgent>;
