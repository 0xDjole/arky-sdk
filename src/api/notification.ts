import type { ApiConfig } from '../index';
import type {
	TrackEmailOpenParams,
	TriggerNotificationParams,
	RequestOptions
} from '../types/api';

export const createNotificationApi = (apiConfig: ApiConfig) => {
	return {
		async trackEmailOpen(params: TrackEmailOpenParams, options?: RequestOptions): Promise<void> {
			return apiConfig.httpClient.get<void>(
				`/v1/notifications/track/pixel/${params.tracking_pixel_id}`,
				options
			);
		},

		async trigger(params: TriggerNotificationParams, options?: RequestOptions): Promise<{ success: boolean; message: string }> {
			return apiConfig.httpClient.post<{ success: boolean; message: string }>(
				'/v1/notifications/trigger',
				params,
				options
			);
		}
	};
};
