import type { ApiConfig } from '../index';
import type { RequestOptions } from '../types/api';

export const createPlatformApi = (apiConfig: ApiConfig) => {
	return {
		async getCurrencies(options?: RequestOptions): Promise<string[]> {
			return apiConfig.httpClient.get('/v1/platform/currencies', options);
		},
		async getIntegrationCatalogue(options?: RequestOptions): Promise<any[]> {
			return apiConfig.httpClient.get('/v1/platform/integration-catalogue', options);
		},
	};
};
