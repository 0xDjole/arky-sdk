import type { SubscriptionChange } from "../types/subscription";
import type { ChangePurchaseRequirementsParams, GetSubscriptionPurchaseRequirementParams, PurchaseRequirementChange, SubscriptionPurchaseRequirement } from "../types/purchaseRequirement";
import type { FindSubscriptionPurchaseAccessParams, SubscriptionPurchaseAccessPage, FindPurchaseLimitUsageParams, PurchaseLimitUsagePage } from "../types/purchaseAccess";
import { requireRequestId } from "../utils/requestId";
import { requireStoreId } from "../utils/storeTarget";
import { epochMilliseconds } from "../utils/time";
import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type { Order } from "../types/order";
import type {
  ControlSubscriptionParams,
  Subscription,
  SubscriptionControlResult,
  SubscriptionSelf,
  FindSubscriptionCommandsParams,
  FindSubscriptionOrdersParams,
  FindSubscriptionsParams,
  GetCurrentSubscriptionParams,
  GetSubscriptionParams,
} from "../types/subscription";
import type {
  AcceptSubscriptionCalendarChangeParams,
  AcceptSubscriptionFundingChangeParams,
  SubscriptionCalendarChangeResult,
  SubscriptionCalendarOptions,
  SubscriptionCalendarReview,
  SubscriptionFundingChangeResult,
  SubscriptionFundingReview,
  GetSubscriptionCalendarOptionsParams,
  ReviewSubscriptionCalendarChangeParams,
  ReviewSubscriptionFundingChangeParams,
  AcceptSubscriptionPlanChangeParams,
  ReviewSubscriptionPlanChangeParams,
  SubscriptionPlanChangeResult,
  SubscriptionPlanChangeReview,
  ReviewSubscriptionTaxCorrectionParams,
  AcceptSubscriptionTaxCorrectionParams,
  SubscriptionTaxCorrectionReview,
  SubscriptionTaxCorrectionResult,
  SubscriptionCardUpdateResult,
  UpdateSubscriptionCardParams,
} from "../types/subscriptionRevision";

export const createSubscriptionApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId: string) =>
    `/v1/stores/${encodeURIComponent(requireStoreId(storeId))}/subscriptions`;
  return {
    purchaseRequirement(
      params: GetSubscriptionPurchaseRequirementParams,
      options?: RequestOptions,
    ): Promise<SubscriptionPurchaseRequirement> {
      const { store_id, id, at } = params;
      return apiConfig.httpClient.get<SubscriptionPurchaseRequirement>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/purchase-requirement`,
        { ...options, params: at === undefined ? {} : { at: epochMilliseconds(at) } },
      );
    },
    changePurchaseRequirements(
      params: ChangePurchaseRequirementsParams,
      options?: RequestOptions,
    ): Promise<PurchaseRequirementChange[]> {
      for (const change of params.changes) requireRequestId(change.request_id);
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<PurchaseRequirementChange[]>(
        `${basePath(store_id)}/purchase-requirements`,
        payload,
        options,
      );
    },
    taxCorrectionReview(
      params: ReviewSubscriptionTaxCorrectionParams,
      options?: RequestOptions,
    ): Promise<SubscriptionTaxCorrectionReview> {
      requireRequestId(params.request_id);
      const { store_id, request_id, request } = params;
      return apiConfig.httpClient.post<SubscriptionTaxCorrectionReview>(
        `${basePath(store_id)}/tax-correction/review`,
        { request_id, request },
        options,
      );
    },
    taxCorrectionAccept(
      params: AcceptSubscriptionTaxCorrectionParams,
      options?: RequestOptions,
    ): Promise<SubscriptionTaxCorrectionResult> {
      requireRequestId(params.request_id);
      const { store_id, request_id, request, timeline_digest } = params;
      return apiConfig.httpClient.post<SubscriptionTaxCorrectionResult>(
        `${basePath(store_id)}/tax-correction/accept`,
        { request_id, request, timeline_digest },
        options,
      );
    },
    purchaseLimitUsage(
      params: FindPurchaseLimitUsageParams,
      options?: RequestOptions,
    ): Promise<PurchaseLimitUsagePage> {
      const { store_id, id, counter_id, ...query } = params;
      return apiConfig.httpClient.get<PurchaseLimitUsagePage>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/purchase-limits/${encodeURIComponent(counter_id)}/usage`,
        { ...options, params: query },
      );
    },
    purchaseAccess(
      params: FindSubscriptionPurchaseAccessParams,
      options?: RequestOptions,
    ): Promise<SubscriptionPurchaseAccessPage> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<SubscriptionPurchaseAccessPage>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/purchase-access`,
        { ...options, params: query },
      );
    },
    get(
      params: GetSubscriptionParams,
      options?: RequestOptions,
    ): Promise<Subscription> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<Subscription>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindSubscriptionsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Subscription>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Subscription>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    current(
      params: GetCurrentSubscriptionParams,
      options?: RequestOptions,
    ): Promise<SubscriptionSelf> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<SubscriptionSelf>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/current`,
        options,
      );
    },
    findOrders(
      params: FindSubscriptionOrdersParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Order>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Order>>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/orders`,
        { ...options, params: query },
      );
    },
    findCommands(
      params: FindSubscriptionCommandsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SubscriptionChange>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<SubscriptionChange>>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/commands`,
        { ...options, params: query },
      );
    },
    control(
      params: ControlSubscriptionParams,
      options?: RequestOptions,
    ): Promise<SubscriptionControlResult> {
      requireRequestId(params.request_id);
      const { store_id, request_id, request } = params;
      return apiConfig.httpClient.post<SubscriptionControlResult>(
        `${basePath(store_id)}/commands`,
        { request_id, request },
        options,
      );
    },
    calendarOptions(
      params: GetSubscriptionCalendarOptionsParams,
      options?: RequestOptions,
    ): Promise<SubscriptionCalendarOptions> {
      requireRequestId(params.request_id);
      const { store_id, request_id, subscription_id } = params;
      return apiConfig.httpClient.post<SubscriptionCalendarOptions>(
        `${basePath(store_id)}/calendar/options`,
        { request_id, subscription_id },
        options,
      );
    },
    calendarReview(
      params: ReviewSubscriptionCalendarChangeParams,
      options?: RequestOptions,
    ): Promise<SubscriptionCalendarReview> {
      requireRequestId(params.request_id);
      const { store_id, request_id, request } = params;
      return apiConfig.httpClient.post<SubscriptionCalendarReview>(
        `${basePath(store_id)}/calendar/review`,
        { request_id, request },
        options,
      );
    },
    calendarAccept(
      params: AcceptSubscriptionCalendarChangeParams,
      options?: RequestOptions,
    ): Promise<SubscriptionCalendarChangeResult> {
      requireRequestId(params.request_id);
      const { store_id, request_id, request, timeline_digest } = params;
      return apiConfig.httpClient.post<SubscriptionCalendarChangeResult>(
        `${basePath(store_id)}/calendar/accept`,
        { request_id, request, timeline_digest },
        options,
      );
    },
    fundingReview(
      params: ReviewSubscriptionFundingChangeParams,
      options?: RequestOptions,
    ): Promise<SubscriptionFundingReview> {
      requireRequestId(params.request_id);
      const { store_id, request_id, request } = params;
      return apiConfig.httpClient.post<SubscriptionFundingReview>(
        `${basePath(store_id)}/funding/review`,
        { request_id, request },
        options,
      );
    },
    planReview(
      params: ReviewSubscriptionPlanChangeParams,
      options?: RequestOptions,
    ): Promise<SubscriptionPlanChangeReview> {
      requireRequestId(params.request_id);
      const { store_id, request_id, request } = params;
      return apiConfig.httpClient.post<SubscriptionPlanChangeReview>(
        `${basePath(store_id)}/plan/review`,
        { request_id, request },
        options,
      );
    },
    planAccept(
      params: AcceptSubscriptionPlanChangeParams,
      options?: RequestOptions,
    ): Promise<SubscriptionPlanChangeResult> {
      requireRequestId(params.request_id);
      const { store_id, request_id, request, timeline_digest } = params;
      return apiConfig.httpClient.post<SubscriptionPlanChangeResult>(
        `${basePath(store_id)}/plan/accept`,
        { request_id, request, timeline_digest },
        options,
      );
    },
    fundingAccept(
      params: AcceptSubscriptionFundingChangeParams,
      options?: RequestOptions,
    ): Promise<SubscriptionFundingChangeResult> {
      requireRequestId(params.request_id);
      const { store_id, request_id, request, timeline_digest } = params;
      return apiConfig.httpClient.post<SubscriptionFundingChangeResult>(
        `${basePath(store_id)}/funding/accept`,
        { request_id, request, timeline_digest },
        options,
      );
    },
    updateCard(
      params: UpdateSubscriptionCardParams,
      options?: RequestOptions,
    ): Promise<SubscriptionCardUpdateResult> {
      requireRequestId(params.request_id);
      const { store_id, request_id, request } = params;
      return apiConfig.httpClient.post<SubscriptionCardUpdateResult>(
        `${basePath(store_id)}/card`,
        { request_id, request },
        options,
      );
    },
  };
};
