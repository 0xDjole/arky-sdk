import type { ApiConfig } from '../index';

export const createNotificationApi = (apiConfig: ApiConfig) => {
	const { httpClient } = apiConfig;

	return {
		async getNotifications({
			previous_id,
			limit
		}: {
			previous_id?: string;
			limit: number;
		}) {
			return httpClient.get(`/v1/notifications`, {
				params: {
					limit,
					previous_id
				}
			});
		},

		async updateNotifications() {
			return httpClient.put(`/v1/notifications`, { seen: true });
		}
	};
};
