import type { ApiConfig } from '../index';
import type {
	GetAnalyticsParams,
	RequestOptions
} from '../types/api';

export const createAnalyticsApi = (apiConfig: ApiConfig) => {
	return {
		async getAnalytics(params: GetAnalyticsParams, options?: RequestOptions) {
			return apiConfig.httpClient.get(`/v1/analytics/${apiConfig.businessId}`, {
				...options,
				params: params
			});
		}
	};
};
