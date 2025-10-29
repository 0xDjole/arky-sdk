import type { ApiConfig } from '../index';
import type {
	CreatePromoCodeParams,
	UpdatePromoCodeParams,
	DeletePromoCodeParams,
	GetPromoCodeParams,
	GetPromoCodesParams,
	GetPromoCodeByCodeParams,
	UpdatePromoCodeStatusParams,
	ValidatePromoCodeParams,
	ApplyPromoCodeParams,
	RequestOptions
} from '../types/api';

export const createPromoCodeApi = (apiConfig: ApiConfig) => {
	return {
		async createPromoCode(params: CreatePromoCodeParams, options?: RequestOptions) {
			return apiConfig.httpClient.post(
				`/v1/businesses/${apiConfig.businessId}/promo-codes`,
				params,
				options
			);
		},

		async updatePromoCode(params: UpdatePromoCodeParams, options?: RequestOptions) {
			return apiConfig.httpClient.put(
				`/v1/businesses/${apiConfig.businessId}/promo-codes/${params.id}`,
				params,
				options
			);
		},

		async deletePromoCode(params: DeletePromoCodeParams, options?: RequestOptions) {
			return apiConfig.httpClient.delete(
				`/v1/businesses/${apiConfig.businessId}/promo-codes/${params.id}`,
				options
			);
		},

		async getPromoCode(params: GetPromoCodeParams, options?: RequestOptions) {
			return apiConfig.httpClient.get(
				`/v1/businesses/${apiConfig.businessId}/promo-codes/${params.id}`,
				options
			);
		},

	async getPromoCodes(params: GetPromoCodesParams, options?: RequestOptions) {
		const { statuses, ...restParams } = params;
		return apiConfig.httpClient.get(`/v1/businesses/${apiConfig.businessId}/promo-codes`, {
			...options,
			params: {
				...restParams,
				statuses: statuses && statuses.length > 0 ? statuses : undefined
			}
		});
	}
	};
};
