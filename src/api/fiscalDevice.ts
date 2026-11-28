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
import { requireTenantId } from "../utils/tenantTarget";
import { segment, tenantPath, tenantRecordPath } from "./paths";

const collection = "fiscal-devices";

export const createFiscalDeviceApi = (apiConfig: ApiConfig) => {
  const devicePath = (tenantId: string, id: string) => tenantRecordPath(tenantId, collection, id);
  const tokensPath = (tenantId: string, fiscalDeviceId: string) => `${devicePath(tenantId, fiscalDeviceId)}/tokens`;

  return {
    find(params: FindFiscalDevicesParams, options?: RequestOptions): Promise<PaginatedResponse<FiscalDevice>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<FiscalDevice>>(tenantPath(tenant_id, collection), {
        ...options,
        params: query,
      });
    },

    get(params: GetFiscalDeviceParams, options?: RequestOptions): Promise<FiscalDevice> {
      return apiConfig.httpClient.get<FiscalDevice>(devicePath(params.tenant_id, params.id), options);
    },

    create(params: CreateFiscalDeviceParams, options?: RequestOptions): Promise<FiscalDevice> {
      requireId(params.id, "fiscal device");
      return apiConfig.httpClient.post<FiscalDevice>(
        tenantPath(params.tenant_id, collection),
        { id: params.id, tenant_location_id: params.tenant_location_id, key: params.key, type: params.type },
        options,
      );
    },

    rename(params: RenameFiscalDeviceParams, options?: RequestOptions): Promise<FiscalDevice> {
      return apiConfig.httpClient.put<FiscalDevice>(
        devicePath(params.tenant_id, params.id),
        { expected_updated_at: params.expected_updated_at, key: params.key },
        options,
      );
    },

    archive(params: ArchiveFiscalDeviceParams, options?: RequestOptions): Promise<FiscalDevice> {
      return apiConfig.httpClient.post<FiscalDevice>(
        `${devicePath(params.tenant_id, params.id)}/archive`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    release(params: ReleaseFiscalDeviceParams, options?: RequestOptions): Promise<FiscalDevice> {
      return apiConfig.httpClient.post<FiscalDevice>(
        `${devicePath(params.tenant_id, params.id)}/release`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    token: {
      find(params: FindFiscalDeviceTokensParams, options?: RequestOptions): Promise<FiscalDeviceToken[]> {
        return apiConfig.httpClient.get<FiscalDeviceToken[]>(tokensPath(params.tenant_id, params.fiscal_device_id), options);
      },

      create(params: CreateFiscalDeviceTokenParams, options?: RequestOptions): Promise<IssuedFiscalDeviceToken> {
        requireId(params.id, "fiscal device token");
        return apiConfig.httpClient.post<IssuedFiscalDeviceToken>(
          tokensPath(params.tenant_id, params.fiscal_device_id),
          { id: params.id, name: params.name },
          options,
        );
      },

      revoke(params: RevokeFiscalDeviceTokenParams, options?: RequestOptions): Promise<FiscalDeviceToken> {
        return apiConfig.httpClient.post<FiscalDeviceToken>(
          `${tokensPath(params.tenant_id, params.fiscal_device_id)}/${segment(params.id)}/revoke`,
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
  tenantId: string;
  token: string;
  redirect?: RequestRedirect;
}

export const createFiscalDeviceAgent = (config: FiscalDeviceAgentConfig) => {
  const tenantId = requireTenantId(config.tenantId);
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
  const agentPath = (path: string) => tenantPath(tenantId, `fiscal-device/${path}`);

  return {
    getDevice(options?: AdminRequestOptions): Promise<FiscalDeviceAgentDevice> {
      return httpClient.get<FiscalDeviceAgentDevice>(tenantPath(tenantId, "fiscal-device"), options);
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
