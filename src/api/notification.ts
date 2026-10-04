import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  Notification,
  NotificationDelivery,
  NotificationPreview,
  PreviewNotificationParams,
  StopNotificationDeliveryParams,
  GetNotificationParams,
  GetNotificationDeliveryParams,
  FindNotificationsParams,
  FindNotificationDeliveriesParams,
  SaveNotificationParams,
} from "../types/notification";
import { requireStoreId } from "../utils/storeTarget";

export const createNotificationApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId: string) =>
    `/v1/stores/${encodeURIComponent(requireStoreId(storeId))}`;
  return {
    save(params: SaveNotificationParams, options?: RequestOptions): Promise<Notification> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<Notification>(
        `${basePath(store_id)}/notifications/${encodeURIComponent(id)}`, payload, options,
      );
    },
    get(params: GetNotificationParams, options?: RequestOptions): Promise<Notification> {
      return apiConfig.httpClient.get<Notification>(
        `${basePath(params.store_id)}/notifications/${encodeURIComponent(params.id)}`, options,
      );
    },
    find(params: FindNotificationsParams, options?: RequestOptions): Promise<PaginatedResponse<Notification>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Notification>>(
        `${basePath(store_id)}/notifications`, { ...options, params: query },
      );
    },
    preview(params: PreviewNotificationParams, options?: RequestOptions): Promise<NotificationPreview> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.post<NotificationPreview>(
        `${basePath(store_id)}/notifications/${encodeURIComponent(id)}/preview`, payload, options,
      );
    },
    delivery: {
      stop(params: StopNotificationDeliveryParams, options?: RequestOptions): Promise<NotificationDelivery> {
        const { store_id, id, expected_updated_at } = params;
        return apiConfig.httpClient.post<NotificationDelivery>(
          `${basePath(store_id)}/notification-deliveries/${encodeURIComponent(id)}/stop`, { expected_updated_at }, options,
        );
      },
      get(params: GetNotificationDeliveryParams, options?: RequestOptions): Promise<NotificationDelivery> {
        return apiConfig.httpClient.get<NotificationDelivery>(
          `${basePath(params.store_id)}/notification-deliveries/${encodeURIComponent(params.id)}`, options,
        );
      },
      find(params: FindNotificationDeliveriesParams, options?: RequestOptions): Promise<PaginatedResponse<NotificationDelivery>> {
        const { store_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<NotificationDelivery>>(
          `${basePath(store_id)}/notification-deliveries`, { ...options, params: query },
        );
      },
    },
  };
};
