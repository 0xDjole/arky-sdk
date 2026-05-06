import type { ApiConfig } from '../index';
import type {
	CreatePromoCodeParams,
	UpdatePromoCodeParams,
	DeletePromoCodeParams,
	GetPromoCodeParams,
	GetPromoCodesParams,
	RequestOptions
} from '../types/api';

export const createPromoCodeApi = (apiConfig: ApiConfig) => {
	return {
		async createPromoCode(params: CreatePromoCodeParams, options?: RequestOptions) {
			const { business_id, ...payload } = params;
			const target_business_id = business_id || apiConfig.businessId;
			return apiConfig.httpClient.post(
				`/v1/businesses/${target_business_id}/promo-codes`,
				payload,
				options
			);
		},

		async updatePromoCode(params: UpdatePromoCodeParams, options?: RequestOptions) {
			const { business_id, ...payload } = params;
			const target_business_id = business_id || apiConfig.businessId;
			return apiConfig.httpClient.put(
				`/v1/businesses/${target_business_id}/promo-codes/${params.id}`,
				payload,
				options
			);
		},

		async deletePromoCode(params: DeletePromoCodeParams, options?: RequestOptions) {
			const target_business_id = params.business_id || apiConfig.businessId;
			return apiConfig.httpClient.delete(
				`/v1/businesses/${target_business_id}/promo-codes/${params.id}`,
				options
			);
		},

		async getPromoCode(params: GetPromoCodeParams, options?: RequestOptions) {
			const target_business_id = params.business_id || apiConfig.businessId;
			return apiConfig.httpClient.get(
				`/v1/businesses/${target_business_id}/promo-codes/${params.id}`,
				options
			);
		},

		async getPromoCodes(params: GetPromoCodesParams, options?: RequestOptions) {
			const { business_id, ...queryParams } = params;
			const target_business_id = business_id || apiConfig.businessId;
			return apiConfig.httpClient.get(`/v1/businesses/${target_business_id}/promo-codes`, {
				...options,
				params: queryParams
			});
		}
	};
};
