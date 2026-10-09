import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  CreateWebhookParams,
  DeleteWebhookParams,
  FindWebhooksParams,
  TestWebhookParams,
  UpdateWebhookParams,
  Webhook,
} from "../types/webhook";
import type { Notification } from "../types/notification";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

export const createWebhookApi = (apiConfig: ApiConfig) => ({
  list(params: FindWebhooksParams, options?: RequestOptions): Promise<PaginatedResponse<Webhook>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Webhook>>(storePath(store_id, "webhooks"), { ...options, params: query });
  },

  create(params: CreateWebhookParams, options?: RequestOptions): Promise<Webhook> {
    requireId(params.id, "webhook");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<Webhook>(storePath(store_id, "webhooks"), body, options);
  },

  update(params: UpdateWebhookParams, options?: RequestOptions): Promise<Webhook> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<Webhook>(storeRecordPath(store_id, "webhooks", id), body, options);
  },

  delete(params: DeleteWebhookParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(storeRecordPath(params.store_id, "webhooks", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },

  test(params: TestWebhookParams, options?: RequestOptions): Promise<Notification> {
    requireId(params.id, "test post");
    return apiConfig.httpClient.post<Notification>(
      storePath(params.store_id, "webhooks/test"),
      { id: params.id, webhook_id: params.webhook_id },
      options,
    );
  },
});
