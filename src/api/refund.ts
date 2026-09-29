import { requireStoreId } from "../utils/storeTarget";
import { snapshotMonriRefundReview, snapshotMonriRefundEvidenceQuery, validateMonriRefundReview, validateMonriRefundEvidencePage } from "../services/refundReview";
import type { ApiConfig } from "../services/clientTypes";
import { validateRefundResponse, validateRecordedRefundMoney, validateRefundMoneyOwner } from "../services/refund";
import type { PaginatedResponse } from "../types";
import type { PaymentRefund, RecordedRefundMoney, RecordRefundMoneyParams, CancelLocalRefundParams } from "../types/refund";
import type { ReviewMonriRefundParams, FindMonriRefundReviewEvidenceParams, MonriRefundReviewEvidencePage } from "../types/refund";
import type {
  CreateRefundParams,
  CreateRefundResponse,
  FindRefundsParams,
  GetRefundParams,
  RequestOptions,
} from "../types/api";

export const createRefundApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id: string) => requireStoreId(store_id);
  return {
    async reviewMonri(params: ReviewMonriRefundParams, options?: RequestOptions): Promise<RecordedRefundMoney> {
      const input = snapshotMonriRefundReview(params);
      const { store_id, refund_id, ...payload } = input;
      const response = await apiConfig.httpClient.post<RecordedRefundMoney>(
        `/v1/stores/${store_id}/refunds/${refund_id}/review-monri`, payload, options,
      );
      return validateMonriRefundReview(response, input);
    },
    async findMonriReviewEvidence(params: FindMonriRefundReviewEvidenceParams, options?: RequestOptions): Promise<MonriRefundReviewEvidencePage> {
      const input = snapshotMonriRefundEvidenceQuery(params);
      const { store_id, refund_id, ...query } = input;
      const response = await apiConfig.httpClient.get<MonriRefundReviewEvidencePage>(
        `/v1/stores/${store_id}/refunds/${refund_id}/review-evidence`, { ...options, params: query },
      );
      return validateMonriRefundEvidencePage(response, input);
    },
    async create(
      params: CreateRefundParams,
      options?: RequestOptions,
    ): Promise<CreateRefundResponse> {
      const { store_id, ...payload } = params;
      const result = await apiConfig.httpClient.post<CreateRefundResponse>(
        `/v1/stores/${requireStoreId(storeId(store_id))}/refunds`, payload, options,
      );
      return validateRefundResponse(result, params.refund_id, params.money);
    },
    async recordMoney(
      params: RecordRefundMoneyParams,
      options?: RequestOptions,
    ): Promise<RecordedRefundMoney> {
      const { store_id, id, ...payload } = params;
      const result = await apiConfig.httpClient.post<RecordedRefundMoney>(
        `/v1/stores/${requireStoreId(storeId(store_id))}/refunds/${id}/money`, payload, options,
      );
      return validateRecordedRefundMoney(result, params, storeId(store_id));
    },
    async cancelLocal(
      params: CancelLocalRefundParams,
      options?: RequestOptions,
    ): Promise<RecordedRefundMoney> {
      const { store_id, id, ...payload } = params;
      const result = await apiConfig.httpClient.post<RecordedRefundMoney>(
        `/v1/stores/${requireStoreId(storeId(store_id))}/refunds/${id}/cancel-local`, payload, options,
      );
      validateRefundMoneyOwner(result, id, storeId(store_id));
      if (!["manual", "cash_on_delivery"].includes(result.refund.provider.type) || result.refund.status.type !== "cancelled" || result.money.refund_pending.amount !== 0) {
        throw new Error("Local refund cancellation did not confirm a cancelled remainder");
      }
      return result;
    },
    async get(params: GetRefundParams, options?: RequestOptions): Promise<PaymentRefund> {
      return apiConfig.httpClient.get<PaymentRefund>(
        `/v1/stores/${requireStoreId(storeId(params.store_id))}/refunds/${params.id}`, options,
      );
    },
    async find(
      params: FindRefundsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PaymentRefund>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<PaymentRefund>>(
        `/v1/stores/${requireStoreId(storeId(store_id))}/refunds`, { ...options, params: query },
      );
    },
  };
};
