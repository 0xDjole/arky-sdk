import type { ApiConfig } from '../services/clientTypes';
import type { RequestOptions } from '../types/api';
import type { PaginatedResponse } from '../types';
import type { FulfillmentPartner, CreateFulfillmentPartnerParams, UpdateFulfillmentPartnerParams, GetFulfillmentPartnerParams, FindFulfillmentPartnersParams } from '../types/fulfillmentPartner';

export const createFulfillmentPartnerApi = (config: ApiConfig) => {
  const path = (storeId?: string) => `/v1/stores/${encodeURIComponent(storeId || config.storeId)}/fulfillment-partners`;
  return {
    create(params: CreateFulfillmentPartnerParams, options?: RequestOptions): Promise<FulfillmentPartner> {
      const { store_id, ...body } = params;
      return config.httpClient.post<FulfillmentPartner>(path(store_id), body, options);
    },
    update(params: UpdateFulfillmentPartnerParams, options?: RequestOptions): Promise<FulfillmentPartner> {
      const { store_id, fulfillment_partner_id, ...body } = params;
      return config.httpClient.put<FulfillmentPartner>(`${path(store_id)}/${encodeURIComponent(fulfillment_partner_id)}`, body, options);
    },
    get(params: GetFulfillmentPartnerParams, options?: RequestOptions): Promise<FulfillmentPartner> {
      return config.httpClient.get<FulfillmentPartner>(`${path(params.store_id)}/${encodeURIComponent(params.fulfillment_partner_id)}`, options);
    },
    find(params: FindFulfillmentPartnersParams = {}, options?: RequestOptions): Promise<PaginatedResponse<FulfillmentPartner>> {
      const { store_id, ...query } = params;
      return config.httpClient.get<PaginatedResponse<FulfillmentPartner>>(path(store_id), { ...options, params: query });
    },
  };
};
