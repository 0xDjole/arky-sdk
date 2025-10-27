export const createPromoCodeApi = (httpClient: any) => ({
	async createPromoCode(promoCodeData: any) {
		return httpClient.post(`/v1/businesses/${promoCodeData.businessId}/promo-codes`, promoCodeData, {
			successMessage: 'Promo code created successfully',
			errorMessage: 'Failed to create promo code'
		});
	},

	async updatePromoCode(promoCodeData: any) {
		return httpClient.put(
			`/v1/businesses/${promoCodeData.businessId}/promo-codes/${promoCodeData.id}`,
			promoCodeData,
			{
				successMessage: 'Promo code updated successfully',
				errorMessage: 'Failed to update promo code'
			}
		);
	},

	async deletePromoCode({ id, businessId }: { id: string; businessId: string }) {
		return httpClient.delete(`/v1/businesses/${businessId}/promo-codes/${id}`, {
			successMessage: 'Promo code deleted successfully',
			errorMessage: 'Failed to delete promo code'
		});
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
	}) {
		return httpClient.put(
			`/v1/businesses/${statusData.businessId}/promo-codes/${statusData.id}/status`,
			statusData,
			{
				successMessage: 'Promo code status updated',
				errorMessage: 'Failed to update promo code status'
			}
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
	}) {
		return httpClient.post(
			`/v1/businesses/${businessId}/promo-codes/validate`,
			{ code, orderTotal, userId },
			{
				errorMessage: 'Failed to validate promo code'
			}
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
	}) {
		return httpClient.post(
			`/v1/businesses/${businessId}/promo-codes/apply`,
			{ code, orderId, userId },
			{
				successMessage: 'Promo code applied successfully',
				errorMessage: 'Failed to apply promo code'
			}
		);
	}
});
