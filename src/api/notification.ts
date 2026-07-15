import type { ApiConfig } from '../index';
import type {
	EmailDelivery,
	EmailSendRequest,
	EmailSendResult,
	GetEmailDeliveryParams,
	RetryEmailDeliveryParams
} from '../types';
import type { RequestOptions } from '../types/api';

export const createNotificationApi = (apiConfig: ApiConfig) => {
	return {
		async sendEmail(request: EmailSendRequest, options?: RequestOptions): Promise<EmailSendResult> {
			return apiConfig.httpClient.post<EmailSendResult>(
				'/v1/notifications/email',
				request,
				options
			);
		},

		async getEmailDelivery(
			params: GetEmailDeliveryParams,
			options?: RequestOptions
		): Promise<EmailDelivery> {
			return apiConfig.httpClient.get<EmailDelivery>(
				`/v1/notifications/email-deliveries/${params.delivery_id}`,
				options
			);
		},

		async retryEmailDelivery(
			params: RetryEmailDeliveryParams,
			options?: RequestOptions
		): Promise<EmailDelivery> {
			return apiConfig.httpClient.post<EmailDelivery>(
				`/v1/notifications/email-deliveries/${params.delivery_id}/retry`,
				{ revision: params.revision },
				options
			);
		}
	};
};
