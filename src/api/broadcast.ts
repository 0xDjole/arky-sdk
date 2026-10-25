import type { ApiConfig } from "../services/clientTypes";
import type { HttpClient } from "../types/httpClient";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  Broadcast,
  BroadcastPreview,
  BroadcastUnsubscribeResponse,
  CreateBroadcastParams,
  DeleteBroadcastParams,
  FindBroadcastsParams,
  GetBroadcastParams,
  PreviewBroadcastParams,
  ScheduleBroadcastParams,
  SendBroadcastParams,
  SendBroadcastTestParams,
  UnscheduleBroadcastParams,
  UnsubscribeBroadcastParams,
  UpdateBroadcastParams,
} from "../types/broadcast";
import type { OutgoingEmail } from "../types/notification";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

export const createBroadcastApi = (apiConfig: ApiConfig) => {
  const broadcastPath = (storeId: string, id: string) => storeRecordPath(storeId, "broadcasts", id);

  return {
    find(params: FindBroadcastsParams, options?: RequestOptions): Promise<PaginatedResponse<Broadcast>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Broadcast>>(storePath(store_id, "broadcasts"), {
        ...options,
        params: query,
      });
    },

    get(params: GetBroadcastParams, options?: RequestOptions): Promise<Broadcast> {
      return apiConfig.httpClient.get<Broadcast>(broadcastPath(params.store_id, params.id), options);
    },

    create(params: CreateBroadcastParams, options?: RequestOptions): Promise<Broadcast> {
      requireId(params.id, "broadcast");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<Broadcast>(storePath(store_id, "broadcasts"), body, options);
    },

    update(params: UpdateBroadcastParams, options?: RequestOptions): Promise<Broadcast> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.put<Broadcast>(broadcastPath(store_id, id), body, options);
    },

    delete(params: DeleteBroadcastParams, options?: RequestOptions): Promise<DeletedResponse> {
      return apiConfig.httpClient.delete<DeletedResponse>(broadcastPath(params.store_id, params.id), {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },

    schedule(params: ScheduleBroadcastParams, options?: RequestOptions): Promise<Broadcast> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.post<Broadcast>(`${broadcastPath(store_id, id)}/schedule`, body, options);
    },

    unschedule(params: UnscheduleBroadcastParams, options?: RequestOptions): Promise<Broadcast> {
      return apiConfig.httpClient.post<Broadcast>(
        `${broadcastPath(params.store_id, params.id)}/unschedule`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    send(params: SendBroadcastParams, options?: RequestOptions): Promise<Broadcast> {
      return apiConfig.httpClient.post<Broadcast>(
        `${broadcastPath(params.store_id, params.id)}/send`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    preview(params: PreviewBroadcastParams, options?: RequestOptions): Promise<BroadcastPreview> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.post<BroadcastPreview>(`${broadcastPath(store_id, id)}/preview`, body, options);
    },

    test(params: SendBroadcastTestParams, options?: RequestOptions): Promise<OutgoingEmail> {
      requireId(params.outgoing_email_id, "test email");
      return apiConfig.httpClient.post<OutgoingEmail>(
        `${broadcastPath(params.store_id, params.id)}/test`,
        { id: params.outgoing_email_id, language: params.language },
        options,
      );
    },
  };
};

export const createStorefrontBroadcastApi = (httpClient: HttpClient) => ({
  unsubscribe(params: UnsubscribeBroadcastParams, options?: RequestOptions): Promise<BroadcastUnsubscribeResponse> {
    return httpClient.post<BroadcastUnsubscribeResponse>(
      "/v1/broadcasts/unsubscribe",
      new URLSearchParams({ "List-Unsubscribe": "One-Click" }),
      {
        ...options,
        headers: { ...options?.headers, "Content-Type": "application/x-www-form-urlencoded" },
        params: { token: params.token },
      },
    );
  },
});
