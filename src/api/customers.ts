import type { ApiConfig } from "../services/clientTypes";
import type {
  RequestOptions,
  CreateCustomerParams,
  UpdateCustomerParams,
  GetCustomerParams,
  ArchiveCustomerParams,
  FindCustomersParams,
  ImportCustomersParams,
  ImportCustomersPreviewParams,
  ImportCustomersPreviewResult,
  ImportCustomersResult,
  FindCustomerSessionsParams,
  RevokeCustomerSessionParams,
  RevokeAllCustomerSessionsParams,
} from "../types/api";
import type {
  Customer,
  CustomerSessionRecord,
  PaginatedResponse,
} from "../types";

export const createCustomersApi = (apiConfig: ApiConfig) => ({
  async create(
    params: CreateCustomerParams,
    options?: RequestOptions,
  ): Promise<Customer> {
    const { store_id, ...payload } = params;
    return apiConfig.httpClient.post<Customer>(
      `/v1/stores/${store_id || apiConfig.storeId}/customers`,
      payload,
      options,
    );
  },

  async get(
    params: GetCustomerParams,
    options?: RequestOptions,
  ): Promise<Customer> {
    return apiConfig.httpClient.get<Customer>(
      `/v1/stores/${params.store_id || apiConfig.storeId}/customers/${params.id}`,
      options,
    );
  },

  async find(
    params?: FindCustomersParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<Customer>> {
    const store_id = params?.store_id || apiConfig.storeId;
    const queryParams: Record<string, unknown> = {};

    if (params?.ids && params.ids.length > 0)
      queryParams.ids = JSON.stringify(params.ids);
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.cursor) queryParams.cursor = params.cursor;
    if (params?.query) queryParams.query = params.query;
    if (params?.classification_query)
      queryParams.classification_query = params.classification_query;
    if (params?.status) queryParams.status = params.status;
    if (params?.has_verified_email !== undefined)
      queryParams.has_verified_email = params.has_verified_email;
    if (params?.has_activity !== undefined)
      queryParams.has_activity = params.has_activity;
    if (params?.has_cart !== undefined)
      queryParams.has_cart = params.has_cart;
    if (params?.sort_field) queryParams.sort_field = params.sort_field;
    if (params?.sort_direction)
      queryParams.sort_direction = params.sort_direction;

    return apiConfig.httpClient.get<PaginatedResponse<Customer>>(
      `/v1/stores/${store_id}/customers`,
      {
        ...options,
        params: queryParams,
      },
    );
  },

  async update(
    params: UpdateCustomerParams,
    options?: RequestOptions,
  ): Promise<Customer> {
    const { id, store_id, ...body } = params;
    return apiConfig.httpClient.patch<Customer>(
      `/v1/stores/${store_id || apiConfig.storeId}/customers/${id}`,
      body,
      options,
    );
  },

  async archive(
    params: ArchiveCustomerParams,
    options?: RequestOptions,
  ): Promise<Customer> {
    const store_id = params.store_id || apiConfig.storeId;
    return apiConfig.httpClient.post<Customer>(
      `/v1/stores/${store_id}/customers/${params.id}/archive`,
      {},
      options,
    );
  },

  import: async (
    params: ImportCustomersParams,
    options?: RequestOptions,
  ): Promise<ImportCustomersResult> => {
    const { store_id, ...payload } = params;
    const target_store_id = store_id || apiConfig.storeId;
    return apiConfig.httpClient.post<ImportCustomersResult>(
      `/v1/stores/${target_store_id}/customers/import`,
      payload,
      options,
    );
  },

  previewImport: async (
    params: ImportCustomersPreviewParams,
    options?: RequestOptions,
  ): Promise<ImportCustomersPreviewResult> => {
    const { store_id, ...payload } = params;
    const target_store_id = store_id || apiConfig.storeId;
    return apiConfig.httpClient.post<ImportCustomersPreviewResult>(
      `/v1/stores/${target_store_id}/customers/import/preview`,
      payload,
      options,
    );
  },

  async findSessions(
    params: FindCustomerSessionsParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<CustomerSessionRecord>> {
    const store_id = params.store_id || apiConfig.storeId;
    const queryParams: Record<string, unknown> = {};
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;
    return apiConfig.httpClient.get<PaginatedResponse<CustomerSessionRecord>>(
      `/v1/stores/${store_id}/customers/${params.customer_id}/sessions`,
      { ...options, params: queryParams },
    );
  },

  async revokeSession(
    params: RevokeCustomerSessionParams,
    options?: RequestOptions,
  ): Promise<{ success: boolean }> {
    const store_id = params.store_id || apiConfig.storeId;
    return apiConfig.httpClient.post<{ success: boolean }>(
      `/v1/stores/${store_id}/customers/${params.customer_id}/sessions/${params.session_id}/revoke`,
      {},
      options,
    );
  },

  async revokeAllSessions(
    params: RevokeAllCustomerSessionsParams,
    options?: RequestOptions,
  ): Promise<{ success: boolean }> {
    const store_id = params.store_id || apiConfig.storeId;
    return apiConfig.httpClient.post<{ success: boolean }>(
      `/v1/stores/${store_id}/customers/${params.customer_id}/sessions/revoke`,
      {},
      options,
    );
  },
});
