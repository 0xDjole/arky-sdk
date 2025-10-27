import type { ApiConfig } from '../index';

export const createEshopApi = (apiConfig: ApiConfig) => {
	const { httpClient, businessId, getTokens } = apiConfig;

	return {
		async getProducts(params?: {
		categoryIds?: string[] | null;
		status?: string;
		limit?: number;
		cursor?: string | null;
	}, options?: any) {
		return httpClient.get(`/v1/businesses/${encodeURIComponent(businessId)}/products`, {
			params: {
				categoryIds: params?.categoryIds && params.categoryIds.length > 0 ? params.categoryIds : undefined,
				status: params?.status || 'ACTIVE',
				limit: params?.limit || 20,
				cursor: params?.cursor
			},
			...options
		});
	},

	async getProductBySlug(slug: string, options?: any) {
		return httpClient.get(
			`/v1/businesses/${encodeURIComponent(businessId)}/products/slug/${encodeURIComponent(businessId)}/${encodeURIComponent(slug)}`,
			options
		);
	},

	async getQuote(params: {
		items: { productId: string; variantId: string; quantity: number }[];
		market: string;
		currency: string;
		userId?: string;
		paymentMethod: string;
		shippingMethodId?: string;
		promoCode?: string;
	}, options?: any) {
		let userId = params.userId;
		if (!userId) {
			const tokens = await getTokens();
			userId = tokens.userId || tokens.accessToken;
		}

		const lines = params.items.map(item => ({
			type: 'PRODUCT_VARIANT',
			productId: item.productId,
			variantId: item.variantId,
			quantity: item.quantity
		}));

		const payload: any = {
			businessId,
			market: params.market,
			currency: params.currency,
			userId: userId,
			paymentMethod: params.paymentMethod,
			lines: lines,
			...(params.shippingMethodId && { shippingMethodId: params.shippingMethodId }),
			...(params.promoCode && { promoCode: params.promoCode })
		};

		return httpClient.post(`/v1/payments/quote`, payload, options);
	},

	async checkout(params: {
		items: { productId: string; variantId: string; quantity: number }[];
		paymentMethod: string;
		blocks?: any[];
		market: string;
		shippingMethodId: string;
		promoCode?: string;
	}, options?: any) {
		const payload: any = {
			businessId,
			market: params.market,
			paymentMethod: params.paymentMethod,
			shippingMethodId: params.shippingMethodId,
			items: params.items,
			blocks: params.blocks || [],
			...(params.promoCode && { promoCode: params.promoCode })
		};

		return httpClient.post(`/v1/businesses/${businessId}/orders/checkout`, payload, options);
	}
	};
};
