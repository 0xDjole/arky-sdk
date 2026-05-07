import type { ApiConfig } from '../index';
import type { RequestOptions } from '../types/api';

// TODO: type as IntegrationService once exported from types/index.ts
type IntegrationService = unknown;

export const createPlatformApi = (apiConfig: ApiConfig) => {
	return {
		async getCurrencies(options?: RequestOptions): Promise<string[]> {
			return apiConfig.httpClient.get<string[]>('/v1/platform/currencies', options);
		},
		async getIntegrationServices(options?: RequestOptions): Promise<IntegrationService[]> {
			return apiConfig.httpClient.get<IntegrationService[]>('/v1/platform/integration-services', options);
		},
		async getWebhookEvents(options?: RequestOptions): Promise<{ data: string[] }> {
			return apiConfig.httpClient.get<{ data: string[] }>('/v1/platform/events', options);
		},
	};
};
