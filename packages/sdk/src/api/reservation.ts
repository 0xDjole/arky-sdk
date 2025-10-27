import type { ApiConfig } from '../index';

export const createReservationApi = (apiConfig: ApiConfig) => {
	const { httpClient, businessId } = apiConfig;

	return {
		async getQuote(params: {
		market: string;
		currency: string;
		userId: string;
		parts: any[];
		paymentMethod?: string;
		promoCode?: string;
	}, options?: any) {
		const lines = params.parts.map((part) => ({
			type: 'SERVICE',
			serviceId: part.serviceId,
			quantity: 1
		}));

		const payload = {
			businessId,
			market: params.market,
			currency: params.currency,
			userId: params.userId,
			paymentMethod: params.paymentMethod || 'CASH',
			lines,
			promoCode: params.promoCode || undefined,
			shippingMethodId: null
		};

		return httpClient.post(`/v1/payments/quote`, payload, options);
	},

	async getAvailableSlots(params: {
		serviceId: string;
		from: number;
		to: number;
		limit?: number;
		providerId?: string | null;
	}, options?: any) {
		const response = await httpClient.get(
			`/v1/businesses/${businessId}/services/${params.serviceId}/available-slots`,
			{
				params: {
					from: params.from,
					to: params.to,
					limit: params.limit || 1000,
					providerId: params.providerId
				},
				...options
			}
		);

		return response.items || [];
	},

	async getProviders(params: {
		serviceId: string;
		limit?: number;
	}, options?: any) {
		const response = await httpClient.get(`/v1/businesses/${businessId}/providers`, {
			params: {
				serviceId: params.serviceId,
				limit: params.limit || 50
			},
			...options
		});

		return response.items || [];
	},

	async getGuestToken(options?: any) {
		const response = await httpClient.post(`/v1/users/login`, {
			provider: 'GUEST'
		}, options);

		return {
			token: response.accessToken
		};
	},

	async updateProfilePhone(params: { phoneNumber: string }, options?: any) {
		return httpClient.put(`/v1/users/update`, {
			phoneNumber: params.phoneNumber,
			phoneNumbers: [],
			addresses: []
		}, options);
	},

	async verifyPhoneCode(params: { phoneNumber: string; code: string }, options?: any) {
		return httpClient.put(`/v1/users/confirm/phone-number`, {
			phoneNumber: params.phoneNumber,
			code: params.code
		}, options);
	},

	async checkout(params: {
		parts: any[];
		paymentMethod?: string;
		blocks?: any[];
		market?: string;
		promoCode?: string;
	}, options?: any) {
		const payload: any = {
			businessId,
			blocks: params.blocks || [],
			market: params.market || 'US',
			parts: params.parts.map((p) => ({
				serviceId: p.serviceId,
				from: p.from,
				to: p.to,
				blocks: p.blocks,
				reservationMethod: p.reservationMethod,
				providerId: p.providerId
			}))
		};

		if (params.paymentMethod !== undefined) {
			payload.paymentMethod = params.paymentMethod;
		}

		if (params.promoCode) {
			payload.promoCode = params.promoCode;
		}

		return httpClient.post(`/v1/reservations/checkout`, payload, options);
	}
	};
};
