import type { ApiConfig } from '../index';
import type { EmailSendRequest, EmailSendResult } from '../types';
import type { TrackEmailOpenParams, RequestOptions } from '../types/api';

export const createNotificationApi = (apiConfig: ApiConfig) => {
	return {
		async trackEmailOpen(params: TrackEmailOpenParams, options?: RequestOptions): Promise<void> {
			return apiConfig.httpClient.get<void>(
				`/v1/notifications/track/pixel/${params.tracking_pixel_id}`,
				options
			);
		},

		async sendEmail(request: EmailSendRequest, options?: RequestOptions): Promise<EmailSendResult> {
			return apiConfig.httpClient.post<EmailSendResult>(
				'/v1/notifications/email',
				request,
				options
			);
		}
	};
};
