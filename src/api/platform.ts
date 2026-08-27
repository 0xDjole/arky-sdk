import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from '../types/api';

export interface EventScopeField {
	field: string;
	label: string;
	placeholder: string;
}

export interface EventMetadata {
	event: string;
	scopes: EventScopeField[];
}

export const createPlatformApi = (apiConfig: ApiConfig) => {
	return {
		async getCurrencies(options?: RequestOptions): Promise<string[]> {
			return apiConfig.httpClient.get<string[]>('/v1/platform/currencies', options);
		},
		async getWebhookEvents(options?: RequestOptions): Promise<EventMetadata[]> {
			return apiConfig.httpClient.get<EventMetadata[]>('/v1/platform/events', options);
		},
	};
};
