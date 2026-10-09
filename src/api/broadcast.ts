import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  Broadcast,
  BroadcastPreview,
  CreateBroadcastParams,
  DeleteBroadcastParams,
  FindBroadcastsParams,
  GetBroadcastParams,
  PreviewBroadcastParams,
  ScheduleBroadcastParams,
  SendBroadcastParams,
  SendBroadcastTestParams,
  UnscheduleBroadcastParams,
  UpdateBroadcastParams,
} from "../types/broadcast";
import type { Notification } from "../types/notification";
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

    test(params: SendBroadcastTestParams, options?: RequestOptions): Promise<Notification> {
      requireId(params.notification_id, "test email");
      return apiConfig.httpClient.post<Notification>(
        `${broadcastPath(params.store_id, params.id)}/test`,
        { id: params.notification_id, language: params.language },
        options,
      );
    },
  };
};
