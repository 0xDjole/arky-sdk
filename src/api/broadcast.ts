import type { ApiConfig } from "../services/clientTypes";
import type { HttpClient } from "../types/httpClient";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  Broadcast,
  BroadcastPreview,
  BroadcastSummary,
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
import type { OutgoingMessage } from "../types/notification";
import { requireId } from "../utils/ids";
import { tenantPath, tenantRecordPath } from "./paths";

export const createBroadcastApi = (apiConfig: ApiConfig) => {
  const broadcastPath = (tenantId: string, id: string) => tenantRecordPath(tenantId, "broadcasts", id);

  return {
    find(params: FindBroadcastsParams, options?: RequestOptions): Promise<PaginatedResponse<BroadcastSummary>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<BroadcastSummary>>(tenantPath(tenant_id, "broadcasts"), {
        ...options,
        params: query,
      });
    },

    get(params: GetBroadcastParams, options?: RequestOptions): Promise<Broadcast> {
      return apiConfig.httpClient.get<Broadcast>(broadcastPath(params.tenant_id, params.id), options);
    },

    create(params: CreateBroadcastParams, options?: RequestOptions): Promise<Broadcast> {
      requireId(params.id, "broadcast");
      const { tenant_id, ...body } = params;
      return apiConfig.httpClient.post<Broadcast>(tenantPath(tenant_id, "broadcasts"), body, options);
    },

    update(params: UpdateBroadcastParams, options?: RequestOptions): Promise<Broadcast> {
      const { tenant_id, id, ...body } = params;
      return apiConfig.httpClient.put<Broadcast>(broadcastPath(tenant_id, id), body, options);
    },

    delete(params: DeleteBroadcastParams, options?: RequestOptions): Promise<DeletedResponse> {
      return apiConfig.httpClient.delete<DeletedResponse>(broadcastPath(params.tenant_id, params.id), {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },

    schedule(params: ScheduleBroadcastParams, options?: RequestOptions): Promise<Broadcast> {
      const { tenant_id, id, ...body } = params;
      return apiConfig.httpClient.post<Broadcast>(`${broadcastPath(tenant_id, id)}/schedule`, body, options);
    },

    unschedule(params: UnscheduleBroadcastParams, options?: RequestOptions): Promise<Broadcast> {
      return apiConfig.httpClient.post<Broadcast>(
        `${broadcastPath(params.tenant_id, params.id)}/unschedule`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    send(params: SendBroadcastParams, options?: RequestOptions): Promise<Broadcast> {
      return apiConfig.httpClient.post<Broadcast>(
        `${broadcastPath(params.tenant_id, params.id)}/send`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    preview(params: PreviewBroadcastParams, options?: RequestOptions): Promise<BroadcastPreview> {
      const { tenant_id, id, ...body } = params;
      return apiConfig.httpClient.post<BroadcastPreview>(`${broadcastPath(tenant_id, id)}/preview`, body, options);
    },

    test(params: SendBroadcastTestParams, options?: RequestOptions): Promise<OutgoingMessage> {
      requireId(params.outgoing_message_id, "test email");
      return apiConfig.httpClient.post<OutgoingMessage>(
        `${broadcastPath(params.tenant_id, params.id)}/test`,
        { id: params.outgoing_message_id, language: params.language },
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
