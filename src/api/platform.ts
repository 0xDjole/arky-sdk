import type { ApiConfig } from '../index';
import type { RequestOptions } from '../types/api';

export interface PlatformConfig {
	stripePublicKey: string;
	stripeConnectClientId: string;
}

export const createPlatformApi = (apiConfig: ApiConfig) => {
	return {
		async getConfig(options?: RequestOptions): Promise<PlatformConfig> {
			return apiConfig.httpClient.get('/v1/platform/config', options);
		}
	};
};
