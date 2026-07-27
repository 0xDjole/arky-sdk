import type { ApiConfig } from '../index';
import type {
	EmailDelivery,
	EmailSendRequest,
	EmailSendResult,
	GetEmailDeliveryParams,
	RetryEmailDeliveryParams
} from '../types';
import type { RequestOptions } from '../types/api';
import {
	pollScheduledResult,
	prepareScheduledMutation,
	scheduledObservationOptions
} from '../utils/scheduledResult';

export const createNotificationApi = (apiConfig: ApiConfig) => {
	return {
		async sendEmail(request: EmailSendRequest, options?: RequestOptions): Promise<EmailSendResult> {
			const mutation = prepareScheduledMutation(request, options);
			const requested = await apiConfig.httpClient.post<EmailSendResult>(
				'/v1/notifications/email',
				mutation.body,
				mutation.options
			);
			if (
				!requested.deliveries.some(
					(delivery) => delivery.status === 'pending' || delivery.status === 'sending'
				)
			) {
				return requested;
			}

			return pollScheduledResult(
				requested,
				(observationSignal) =>
					apiConfig.httpClient.post<EmailSendResult>(
						'/v1/notifications/email',
						mutation.body,
						scheduledObservationOptions(options, observationSignal)
					),
				(current) =>
					current.deliveries.some(
						(delivery) => delivery.status === 'pending' || delivery.status === 'sending'
					),
				options?.signal
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
			const path = `/v1/notifications/email-deliveries/${params.delivery_id}`;
			const requested = await apiConfig.httpClient.post<EmailDelivery>(
				`/v1/notifications/email-deliveries/${params.delivery_id}/retry`,
				{ revision: params.revision },
				options
			);
			if (requested.status !== 'pending' && requested.status !== 'sending') {
				return requested;
			}
			return pollScheduledResult(
				requested,
				(observationSignal) =>
					apiConfig.httpClient.get<EmailDelivery>(
						path,
						scheduledObservationOptions(options, observationSignal)
					),
				(delivery) => delivery.status === 'pending' || delivery.status === 'sending',
				options?.signal
			);
		}
	};
};
