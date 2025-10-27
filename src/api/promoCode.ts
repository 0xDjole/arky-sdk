import type { ApiConfig } from '../index';

export const createPromoCodeApi = (apiConfig: ApiConfig) => {
	const { httpClient } = apiConfig;

	return {
		async createPromoCode(promoCodeData: any, options?: any) {
		return httpClient.post(`/v1/businesses/${promoCodeData.businessId}/promo-codes`, promoCodeData, options);
	},

	async updatePromoCode(promoCodeData: any, options?: any) {
		return httpClient.put(
			`/v1/businesses/${promoCodeData.businessId}/promo-codes/${promoCodeData.id}`,
			promoCodeData,
			options
		);
	},

	async deletePromoCode({ id, businessId }: { id: string; businessId: string }, options?: any) {
		return httpClient.delete(`/v1/businesses/${businessId}/promo-codes/${id}`, options);
	},

	async getPromoCode({ id, businessId }: { id: string; businessId: string }) {
		return httpClient.get(`/v1/businesses/${businessId}/promo-codes/${id}`);
	},

	async getPromoCodes(filters: any) {
		const { businessId, ...params } = filters;
		return httpClient.get(`/v1/businesses/${businessId}/promo-codes`, {
			params: {
				statuses: params.statuses && params.statuses.length > 0 ? params.statuses : undefined,
				query: params.query,
				limit: params.limit,
				cursor: params.cursor,
				sortField: params.sortField,
				sortDirection: params.sortDirection,
				createdAtFrom: params.createdAtFrom,
				createdAtTo: params.createdAtTo,
				startsAtFrom: params.startsAtFrom,
				startsAtTo: params.startsAtTo,
				expiresAtFrom: params.expiresAtFrom,
				expiresAtTo: params.expiresAtTo
			}
		});
	},

	async getPromoCodeByCode({ businessId, code }: { businessId: string; code: string }) {
		return httpClient.get(`/v1/businesses/${businessId}/promo-codes/code/${code}`);
	},

	async updatePromoCodeStatus(statusData: {
		id: string;
		businessId: string;
		status: string;
		reason?: string;
	}, options?: any) {
		return httpClient.put(
			`/v1/businesses/${statusData.businessId}/promo-codes/${statusData.id}/status`,
			statusData,
			options
		);
	},

	async validatePromoCode({
		businessId,
		code,
		orderTotal,
		userId
	}: {
		businessId: string;
		code: string;
		orderTotal?: number;
		userId?: string;
	}, options?: any) {
		return httpClient.post(
			`/v1/businesses/${businessId}/promo-codes/validate`,
			{ code, orderTotal, userId },
			options
		);
	},

	async applyPromoCode({
		businessId,
		code,
		orderId,
		userId
	}: {
		businessId: string;
		code: string;
		orderId: string;
		userId: string;
	}, options?: any) {
		return httpClient.post(
			`/v1/businesses/${businessId}/promo-codes/apply`,
			{ code, orderId, userId },
			options
		);
	}
	};
};
