import type { EpochMilliseconds } from './time';

export type FulfillmentPartnerStatus = { type: 'active' } | { type: 'disabled' };

export interface FulfillmentPartner {
  id: string;
  store_id: string;
  key: string;
  webhook_id: string | null;
  status: FulfillmentPartnerStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface GetFulfillmentPartnerParams {
  store_id?: string;
  fulfillment_partner_id: string;
}

export interface CreateFulfillmentPartnerParams extends GetFulfillmentPartnerParams {
  key: string;
  webhook_id: string | null;
}

export interface UpdateFulfillmentPartnerParams extends CreateFulfillmentPartnerParams {
  expected_updated_at: EpochMilliseconds;
  status: FulfillmentPartnerStatus;
}

export interface FindFulfillmentPartnersParams {
  store_id?: string;
  status?: FulfillmentPartnerStatus['type'];
  limit?: number;
  cursor?: string | null;
}
