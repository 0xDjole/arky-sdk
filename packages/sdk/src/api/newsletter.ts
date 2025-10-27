import type { ApiConfig } from '../index';

export const createNewsletterApi = (apiConfig: ApiConfig) => {
	const { httpClient, businessId } = apiConfig;

	return {
		async find(options?: any) {
			return httpClient.get(`/v1/newsletters`, {
				params: { businessId },
				...options
			});
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
	};
};
