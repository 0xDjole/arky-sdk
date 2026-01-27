import type { ApiConfig } from '../index';
import type { RequestOptions } from '../types/api';

export interface PlatformConfig {
	stripePublicKey: string;
	stripeConnectClientId: string;
}

let cachedConfig: PlatformConfig | null = null;

export const createPlatformApi = (apiConfig: ApiConfig) => {
	return {
		async getConfig(options?: RequestOptions): Promise<PlatformConfig> {
			if (cachedConfig) return cachedConfig;
			const config = await apiConfig.httpClient.get('/v1/platform/config', options);
			cachedConfig = config;
			return config;
		},

		getConfigCache(): PlatformConfig | null {
			return cachedConfig;
		},

		async getCurrencies(options?: RequestOptions): Promise<string[]> {
			return apiConfig.httpClient.get('/v1/platform/currencies', options);
		},
	};
};
