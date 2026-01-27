import type { ApiConfig } from '../index';
import type { RequestOptions } from '../types/api';
import type { CurrencyInfo } from '../utils/currency';

export interface PlatformConfig {
	stripePublicKey: string;
	stripeConnectClientId: string;
	currencies?: CurrencyInfo[];
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
	};
};
