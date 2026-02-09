import type { ApiConfig } from "../index";
import type { GetEventsParams, UpdateEventParams, RequestOptions } from "../types/api";

export function createEventsApi(apiConfig: ApiConfig) {
  return {
    async getEvents(params: GetEventsParams, options?: RequestOptions) {
      return apiConfig.httpClient.get(`/v1/events`, {
        ...options,
        params: {
          entity: params.entity,
          limit: params.limit,
          cursor: params.cursor,
        },
      });
    },

    async updateEvent(params: UpdateEventParams, options?: RequestOptions) {
      return apiConfig.httpClient.put(
        `/v1/events/${params.eventId}`,
        {
          eventId: params.eventId,
          event: params.event,
        },
        options
      );
    },

    async getWebhookEvents(options?: RequestOptions): Promise<{ data: string[] }> {
      return apiConfig.httpClient.get(`/v1/platform/events/metadata`, options);
    },
  };
}
