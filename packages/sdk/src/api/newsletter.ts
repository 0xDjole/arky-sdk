export const createNewsletterApi = (httpClient: any, businessId: string) => ({
	async find(options?: any) {
		const response = await httpClient.get(`/v1/newsletters`, {
			params: { businessId },
			...options
		});

		return {
			data: response.items || [],
			meta: {
				total: response.items?.length || 0,
				page: 1,
				per_page: response.items?.length || 0
			}
		};
	},

	async get(params: { id: string }, options?: any) {
		return httpClient.get(`/v1/newsletters/${params.id}`, options);
	},

	async subscribe(params: {
		newsletterId: string;
		email: string;
		customerId?: string;
		payment?: any;
	}, options?: any) {
		return httpClient.post(`/v1/newsletters/${params.newsletterId}/subscribe`, {
			newsletterId: params.newsletterId,
			email: params.email,
			market: 'US',
			...(params.customerId && { customerId: params.customerId }),
			...(params.payment && { payment: params.payment })
		}, options);
	}
});
