import type { ApiConfig } from '../index';

export const createAnalyticsApi = (apiConfig: ApiConfig) => {
	const { httpClient } = apiConfig;

	return {
		async getAnalytics(businessId: string, params: any = {}) {
		return httpClient.get(`/v1/analytics/${businessId}`, {
			params: {
				metrics: params.metrics || undefined,
				period: params.period || undefined,
				start_date: params.start_date || undefined,
				end_date: params.end_date || undefined,
				interval: params.interval || undefined
			}
		});
	},

	async getAnalyticsHealth(businessId: string) {
		return httpClient.get(`/v1/analytics/${businessId}/health`);
	}
	};
};
