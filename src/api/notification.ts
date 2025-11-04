import type { ApiConfig } from '../index';
import type {
	TrackEmailOpenParams,
	GetDeliveryStatsParams,
	RequestOptions
} from '../types/api';

export const createNotificationApi = (apiConfig: ApiConfig) => {
	return {
		async trackEmailOpen(params: TrackEmailOpenParams, options?: RequestOptions) {
			return apiConfig.httpClient.get(
				`/v1/notifications/track/email/${params.trackingPixelId}`,
				options
			);
		},

		async getDeliveryStats(params: GetDeliveryStatsParams, options?: RequestOptions) {
			return apiConfig.httpClient.get(
				`/v1/notifications/track/stats/${apiConfig.businessId}`,
				options
			);
		}
	};
};
