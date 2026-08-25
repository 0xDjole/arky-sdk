import type { ApiConfig } from "../services/clientTypes";
import type {
  RequestOptions,
  CreateMailboxParams,
  ConnectGoogleMailboxParams,
  GoogleMailboxConnectUrl,
  UpdateMailboxParams,
  FindMailboxesParams,
  GetMailboxParams,
  PrepareMailboxParams,
  TestMailboxParams,
  TestMailboxResult,
} from "../types/api";
import type { Mailbox, PaginatedResponse } from "../types";

export const createMailboxApi = (apiConfig: ApiConfig) => ({
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
});
