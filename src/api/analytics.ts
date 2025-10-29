import type { ApiConfig } from '../index';
import type {
	GetAnalyticsParams,
	GetAnalyticsHealthParams,
	SetupAnalyticsParams,
	RequestOptions
} from '../types/api';

export const createAnalyticsApi = (apiConfig: ApiConfig) => {
	return {
		async getAnalytics(params: GetAnalyticsParams, options?: RequestOptions) {
			return apiConfig.httpClient.get(`/v1/analytics/${apiConfig.businessId}`, {
				...options,
				params: params
			});
		},

		async getAnalyticsHealth(params: GetAnalyticsHealthParams, options?: RequestOptions) {
			return apiConfig.httpClient.get(`/v1/analytics/${apiConfig.businessId}/health`, options);
		},

		async setupAnalytics(params: SetupAnalyticsParams, options?: RequestOptions) {
			return apiConfig.httpClient.post(`/v1/analytics/admin/setup`, params, options);
		}
	};
};
