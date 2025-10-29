import type { ApiConfig } from '../index';
import type {
	GetNotificationsParams,
	TrackEmailOpenParams,
	GetDeliveryStatsParams,
	RequestOptions
} from '../types/api';

export const createNotificationApi = (apiConfig: ApiConfig) => {
	return {
		async getNotifications(params: GetNotificationsParams, options?: RequestOptions) {
			return apiConfig.httpClient.get(`/v1/notifications`, {
				...options,
				params: {
					limit: params.limit,
					previous_id: params.previous_id
				}
			});
		},

	async updateNotifications(params: {}, options?: RequestOptions) {
		const _params = params;
		return apiConfig.httpClient.put(`/v1/notifications`, { seen: true }, options);
	},

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
