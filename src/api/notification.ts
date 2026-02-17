import type { ApiConfig } from '../index';
import type {
	TrackEmailOpenParams,
	TriggerNotificationParams,
	RequestOptions
} from '../types/api';

export const createNotificationApi = (apiConfig: ApiConfig) => {
	return {
		async trackEmailOpen(params: TrackEmailOpenParams, options?: RequestOptions) {
			return apiConfig.httpClient.get(
				`/v1/notifications/track/pixel/${params.trackingPixelId}`,
				options
			);
		},

		async trigger(params: TriggerNotificationParams, options?: RequestOptions) {
			return apiConfig.httpClient.post(
				'/v1/notifications/trigger',
				params,
				options
			);
		}
	};
};
