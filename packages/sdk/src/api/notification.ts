export const createNotificationApi = (httpClient: any) => ({
	async getNotifications({
		previous_id,
		limit
	}: {
		previous_id?: string;
		limit: number;
	}) {
		const response = await httpClient.get(`/v1/notifications`, {
			params: {
				limit,
				previous_id
			}
		});
		return {
			items: []
		};
	},

	async updateNotifications() {
		const response = await httpClient.put(`/v1/notifications`, { seen: true });
		return false;
	}
});
