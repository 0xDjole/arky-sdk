import type { ApiConfig } from "../index";
import type { RequestOptions } from "../types/api";

export function createEventsApi(apiConfig: ApiConfig) {
  return {
    async getWebhookEvents(options?: RequestOptions): Promise<{ data: string[] }> {
      return apiConfig.httpClient.get(`/v1/platform/events`, options);
    },
  };
}
