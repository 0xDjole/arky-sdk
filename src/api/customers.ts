import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  ArchiveCustomerParams,
  CreateCustomerParams,
  Customer,
  CustomerSearchSnapshot,
  CustomerSession,
  EraseCustomerParams,
  FindCustomerSessionsParams,
  FindCustomersParams,
  GetCustomerParams,
  ImportCustomersParams,
  ImportCustomersPreviewResult,
  ImportCustomersResult,
  MergeCustomerParams,
  ResolveOrReserveCustomerEmailParams,
  RevokeAllCustomerSessionsParams,
  RevokeCustomerSessionParams,
  UpdateCustomerParams,
} from "../types/customer";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

export const createCustomersApi = (apiConfig: ApiConfig) => {
  const customerPath = (storeId: string, id: string) => storeRecordPath(storeId, "customers", id);

  return {
    find(params: FindCustomersParams, options?: RequestOptions): Promise<PaginatedResponse<CustomerSearchSnapshot>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerSearchSnapshot>>(storePath(store_id, "customers"), {
        ...options,
        params: query,
      });
    },

    get(params: GetCustomerParams, options?: RequestOptions): Promise<Customer> {
      return apiConfig.httpClient.get<Customer>(customerPath(params.store_id, params.id), options);
    },

    create(params: CreateCustomerParams, options?: RequestOptions): Promise<Customer> {
      requireId(params.id, "customer");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<Customer>(storePath(store_id, "customers"), body, options);
    },

    update(params: UpdateCustomerParams, options?: RequestOptions): Promise<Customer> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.patch<Customer>(customerPath(store_id, id), body, options);
    },

    archive(params: ArchiveCustomerParams, options?: RequestOptions): Promise<Customer> {
      return apiConfig.httpClient.post<Customer>(
        `${customerPath(params.store_id, params.id)}/archive`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    erase(params: EraseCustomerParams, options?: RequestOptions): Promise<Customer> {
      return apiConfig.httpClient.post<Customer>(
        `${customerPath(params.store_id, params.id)}/erase`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    merge(params: MergeCustomerParams, options?: RequestOptions): Promise<Customer> {
      requireId(params.target_customer_id, "customer");
      return apiConfig.httpClient.post<Customer>(
        `${customerPath(params.store_id, params.id)}/merge`,
        { target_customer_id: params.target_customer_id, expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    resolveOrReserveEmail(params: ResolveOrReserveCustomerEmailParams, options?: RequestOptions): Promise<Customer> {
      requireId(params.customer_id, "customer");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<Customer>(storePath(store_id, "customers/resolve-or-reserve"), body, options);
    },

    import(params: ImportCustomersParams, options?: RequestOptions): Promise<ImportCustomersResult> {
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<ImportCustomersResult>(storePath(store_id, "customers/import"), body, options);
    },

    previewImport(params: ImportCustomersParams, options?: RequestOptions): Promise<ImportCustomersPreviewResult> {
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<ImportCustomersPreviewResult>(
        storePath(store_id, "customers/import/preview"),
        body,
        options,
      );
    },

    findSessions(params: FindCustomerSessionsParams, options?: RequestOptions): Promise<PaginatedResponse<CustomerSession>> {
      const { store_id, customer_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerSession>>(`${customerPath(store_id, customer_id)}/sessions`, {
        ...options,
        params: query,
      });
    },

    revokeSession(params: RevokeCustomerSessionParams, options?: RequestOptions): Promise<{ success: boolean }> {
      return apiConfig.httpClient.post<{ success: boolean }>(
        `${customerPath(params.store_id, params.customer_id)}/sessions/${segment(params.session_id)}/revoke`,
        undefined,
        options,
      );
    },

    revokeAllSessions(params: RevokeAllCustomerSessionsParams, options?: RequestOptions): Promise<{ success: boolean }> {
      return apiConfig.httpClient.post<{ success: boolean }>(
        `${customerPath(params.store_id, params.customer_id)}/sessions/revoke`,
        undefined,
        options,
      );
    },
  };
};
