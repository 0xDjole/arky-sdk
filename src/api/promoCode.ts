import type { ApiConfig } from '../index';
import type {
	CreatePromoCodeParams,
	UpdatePromoCodeParams,
	DeletePromoCodeParams,
	GetPromoCodeParams,
	GetPromoCodesParams,
	RequestOptions
} from '../types/api';
import type { PaginatedResponse, PromoCode } from '../types';

export const createPromoCodeApi = (apiConfig: ApiConfig) => {
	return {
		async createPromoCode(params: CreatePromoCodeParams, options?: RequestOptions): Promise<PromoCode> {
			const { store_id, ...payload } = params;
			const target_store_id = store_id || apiConfig.storeId;
			return apiConfig.httpClient.post<PromoCode>(
				`/v1/stores/${target_store_id}/promo-codes`,
				payload,
				options
			);
		},

		async updatePromoCode(params: UpdatePromoCodeParams, options?: RequestOptions): Promise<PromoCode> {
			const { store_id, ...payload } = params;
			const target_store_id = store_id || apiConfig.storeId;
			return apiConfig.httpClient.put<PromoCode>(
				`/v1/stores/${target_store_id}/promo-codes/${params.id}`,
				payload,
				options
			);
		},

		async deletePromoCode(params: DeletePromoCodeParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
			const target_store_id = params.store_id || apiConfig.storeId;
			return apiConfig.httpClient.delete<{ deleted: boolean }>(
				`/v1/stores/${target_store_id}/promo-codes/${params.id}`,
				options
			);
		},

		async getPromoCode(params: GetPromoCodeParams, options?: RequestOptions): Promise<PromoCode> {
			const target_store_id = params.store_id || apiConfig.storeId;
			return apiConfig.httpClient.get<PromoCode>(
				`/v1/stores/${target_store_id}/promo-codes/${params.id}`,
				options
			);
		},

		async getPromoCodes(params: GetPromoCodesParams, options?: RequestOptions): Promise<PaginatedResponse<PromoCode>> {
			const { store_id, ...queryParams } = params;
			const target_store_id = store_id || apiConfig.storeId;
			return apiConfig.httpClient.get<PaginatedResponse<PromoCode>>(`/v1/stores/${target_store_id}/promo-codes`, {
				...options,
				params: queryParams
			});
		}
	};
};
