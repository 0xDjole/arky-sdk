export const createEshopApi = (httpClient: any, businessId: string) => ({
	async getProducts(params?: {
		categoryIds?: string[] | null;
		status?: string;
		limit?: number;
		cursor?: string | null;
	}, options?: any) {
		const response = await httpClient.get(`/v1/businesses/${encodeURIComponent(businessId)}/products`, {
			params: {
				categoryIds: params?.categoryIds && params.categoryIds.length > 0 ? params.categoryIds : undefined,
				status: params?.status || 'ACTIVE',
				limit: params?.limit || 20,
				cursor: params?.cursor
			},
			...options
		});

		return {
			items: response.items || [],
			cursor: response.cursor,
			total: response.total || 0
		};
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
		userId: string;
		paymentMethod: string;
		shippingMethodId?: string;
		promoCode?: string;
	}, options?: any) {
		const lines = params.items.map((item) => ({
			type: 'PRODUCT_VARIANT',
			productId: item.productId,
			variantId: item.variantId,
			quantity: item.quantity
		}));

		const payload: any = {
			businessId,
			market: params.market,
			currency: params.currency,
			userId: params.userId,
			paymentMethod: params.paymentMethod,
			lines,
			...(params.shippingMethodId && { shippingMethodId: params.shippingMethodId }),
			...(params.promoCode && { promoCode: params.promoCode })
		};

		return httpClient.post(`/v1/payments/quote`, payload, options);
	},

	async checkout(params: {
		token?: string;
		items: { productId: string; variantId: string; quantity: number }[];
		paymentMethod: string;
		blocks?: any[];
		market: string;
		shippingMethodId: string;
		promoCode?: string;
	}, options?: any) {
		const lines = params.items.map((item) => ({
			type: 'PRODUCT_VARIANT',
			productId: item.productId,
			variantId: item.variantId,
			quantity: item.quantity
		}));

		const payload: any = {
			businessId,
			market: params.market,
			paymentMethod: params.paymentMethod,
			shippingMethodId: params.shippingMethodId,
			lines,
			blocks: params.blocks || [],
			...(params.promoCode && { promoCode: params.promoCode })
		};

		if (params.token) {
			payload.token = params.token;
		}

		return httpClient.post(`/v1/orders`, payload, options);
	}
});
