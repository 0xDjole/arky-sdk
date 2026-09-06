import type { ApiConfig } from "../services/clientTypes";
import type {
  RequestOptions,
  CreateMailboxParams,
  ConnectGoogleMailboxParams,
  GoogleMailboxConnectUrl,
  UpdateMailboxParams,
  FindMailboxesParams,
  FindMailboxSyncIssuesParams,
  GetMailboxParams,
  DisconnectMailboxParams,
  PrepareMailboxParams,
  TestMailboxParams,
  TestMailboxResult,
} from "../types/api";
import type { Mailbox, MailboxSyncIssue, PaginatedResponse } from "../types";

export const createMailboxApi = (apiConfig: ApiConfig) => ({
  async findSyncIssues(
    params: FindMailboxSyncIssuesParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<MailboxSyncIssue>> {
    const { id, store_id, limit = 50, cursor } = params;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new RangeError(
        "Mailbox sync issue limit must be an integer from 1 to 100",
      );
    }
    if (
      cursor !== undefined &&
      (typeof cursor !== "string" ||
        cursor.length === 0 ||
        new TextEncoder().encode(cursor).length > 2048)
    ) {
      throw new RangeError(
        "Mailbox sync issue cursor must contain 1 to 2048 bytes",
      );
    }
    const target_store_id = store_id || apiConfig.storeId;
    return apiConfig.httpClient.get<PaginatedResponse<MailboxSyncIssue>>(
      `/v1/stores/${target_store_id}/mailboxes/${id}/sync-issues`,
      { ...options, params: { limit, cursor } },
    );
  },

  async disconnect(
    params: DisconnectMailboxParams,
    options?: RequestOptions,
  ): Promise<Mailbox> {
    const target_store_id = params.store_id || apiConfig.storeId;
    return apiConfig.httpClient.post<Mailbox>(
      `/v1/stores/${target_store_id}/mailboxes/${params.id}/disconnect`,
      {},
      options,
    );
  },

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
