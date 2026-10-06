import { requireRequestId } from "../utils/requestId";
import { requireStoreId } from "../utils/storeTarget";
import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  Automation,
  AutomationRun,
  ChangeAutomationStatusParams,
  CreateAutomationParams,
  DeleteAutomationParams,
  FindAutomationRunsParams,
  FindAutomationsParams,
  GetAutomationParams,
  GetAutomationRunParams,
  ResendReceiptParams,
  UpdateAutomationParams,
} from "../types/automation";
import type { MessageDelivery } from "../types/messageDelivery";

export const createAutomationApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId: string) =>
    `/v1/stores/${encodeURIComponent(requireStoreId(storeId))}/automations`;
  const runPath = (storeId: string) =>
    `/v1/stores/${encodeURIComponent(requireStoreId(storeId))}/automation-runs`;

  return {
    create(params: CreateAutomationParams, options?: RequestOptions): Promise<Automation> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Automation>(basePath(store_id), payload, options);
    },
    update(params: UpdateAutomationParams, options?: RequestOptions): Promise<Automation> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<Automation>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(params: GetAutomationParams, options?: RequestOptions): Promise<Automation> {
      return apiConfig.httpClient.get<Automation>(
        `${basePath(params.store_id)}/${encodeURIComponent(params.id)}`,
        options,
      );
    },
    find(
      params: FindAutomationsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Automation>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Automation>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    delete(params: DeleteAutomationParams, options?: RequestOptions): Promise<boolean> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<boolean>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
    activate(params: ChangeAutomationStatusParams, options?: RequestOptions): Promise<Automation> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.post<Automation>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/activate`,
        { expected_updated_at },
        options,
      );
    },
    pause(params: ChangeAutomationStatusParams, options?: RequestOptions): Promise<Automation> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.post<Automation>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/pause`,
        { expected_updated_at },
        options,
      );
    },
    resendReceipt(params: ResendReceiptParams, options?: RequestOptions): Promise<MessageDelivery> {
      requireRequestId(params.request_id);
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<MessageDelivery>(
        `${basePath(store_id)}/receipt-resends`,
        payload,
        options,
      );
    },
    run: {
      find(
        params: FindAutomationRunsParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<AutomationRun>> {
        const { store_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<AutomationRun>>(runPath(store_id), {
          ...options,
          params: query,
        });
      },
      get(params: GetAutomationRunParams, options?: RequestOptions): Promise<AutomationRun> {
        return apiConfig.httpClient.get<AutomationRun>(
          `${runPath(params.store_id)}/${encodeURIComponent(params.id)}`,
          options,
        );
      },
    },
  };
};
