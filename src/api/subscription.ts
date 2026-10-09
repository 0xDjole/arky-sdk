import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type { Order } from "../types/order";
import type {
  ChangeSubscriptionCalendarParams,
  ChangeSubscriptionPaymentMethodParams,
  ChangeSubscriptionPlanParams,
  ChangeSubscriptionPurchaseRequirementParams,
  ControlSubscriptionParams,
  CorrectSubscriptionTaxClassificationParams,
  CreateSubscriptionOfferingParams,
  CreateSubscriptionPlanParams,
  DeleteSubscriptionOfferingParams,
  DeleteSubscriptionPlanParams,
  FindSubscriptionOfferingsParams,
  FindSubscriptionOrdersParams,
  FindSubscriptionPlansParams,
  FindSubscriptionPurchaseAccessParams,
  FindSubscriptionPurchaseLimitsParams,
  FindSubscriptionRevisionsParams,
  FindSubscriptionsParams,
  GetSubscriptionCalendarOptionsParams,
  GetSubscriptionOfferingByKeyParams,
  GetSubscriptionOfferingParams,
  GetSubscriptionParams,
  GetSubscriptionPlanParams,
  GetSubscriptionPurchaseRequirementParams,
  GetSubscriptionRevisionParams,
  Subscription,
  SubscriptionCalendarOptions,
  SubscriptionChangeResult,
  SubscriptionCurrent,
  SubscriptionOffering,
  SubscriptionPlan,
  SubscriptionPurchaseAccessPage,
  SubscriptionPurchaseLimitPeriod,
  SubscriptionPurchaseRequirement,
  SubscriptionPurchaseRequirementTransfer,
  SubscriptionRevision,
  SubscriptionRevisionDetail,
  TransferSubscriptionPurchaseRequirementParams,
  UpdateSubscriptionOfferingParams,
  UpdateSubscriptionPlanParams,
} from "../types/subscription";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

export const createSubscriptionOfferingApi = (apiConfig: ApiConfig) => ({
  find(params: FindSubscriptionOfferingsParams, options?: RequestOptions): Promise<PaginatedResponse<SubscriptionOffering>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<SubscriptionOffering>>(
      storePath(store_id, "subscription-offerings"),
      { ...options, params: query },
    );
  },

  get(params: GetSubscriptionOfferingParams, options?: RequestOptions): Promise<SubscriptionOffering> {
    return apiConfig.httpClient.get<SubscriptionOffering>(
      storeRecordPath(params.store_id, "subscription-offerings", params.id),
      options,
    );
  },

  getByKey(params: GetSubscriptionOfferingByKeyParams, options?: RequestOptions): Promise<SubscriptionOffering> {
    return apiConfig.httpClient.get<SubscriptionOffering>(
      storePath(params.store_id, `subscription-offerings/by-key/${segment(params.key)}`),
      options,
    );
  },

  create(params: CreateSubscriptionOfferingParams, options?: RequestOptions): Promise<SubscriptionOffering> {
    requireId(params.id, "subscription offering");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<SubscriptionOffering>(storePath(store_id, "subscription-offerings"), body, options);
  },

  update(params: UpdateSubscriptionOfferingParams, options?: RequestOptions): Promise<SubscriptionOffering> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<SubscriptionOffering>(
      storeRecordPath(store_id, "subscription-offerings", id),
      body,
      options,
    );
  },

  delete(params: DeleteSubscriptionOfferingParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(
      storeRecordPath(params.store_id, "subscription-offerings", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});

export const createSubscriptionPlanApi = (apiConfig: ApiConfig) => ({
  find(params: FindSubscriptionPlansParams, options?: RequestOptions): Promise<PaginatedResponse<SubscriptionPlan>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<SubscriptionPlan>>(storePath(store_id, "subscription-plans"), {
      ...options,
      params: query,
    });
  },

  get(params: GetSubscriptionPlanParams, options?: RequestOptions): Promise<SubscriptionPlan> {
    return apiConfig.httpClient.get<SubscriptionPlan>(
      storeRecordPath(params.store_id, "subscription-plans", params.id),
      options,
    );
  },

  create(params: CreateSubscriptionPlanParams, options?: RequestOptions): Promise<SubscriptionPlan> {
    requireId(params.id, "subscription plan");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<SubscriptionPlan>(storePath(store_id, "subscription-plans"), body, options);
  },

  update(params: UpdateSubscriptionPlanParams, options?: RequestOptions): Promise<SubscriptionPlan> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<SubscriptionPlan>(storeRecordPath(store_id, "subscription-plans", id), body, options);
  },

  delete(params: DeleteSubscriptionPlanParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(
      storeRecordPath(params.store_id, "subscription-plans", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});

export const createSubscriptionApi = (apiConfig: ApiConfig) => {
  const subscriptionPath = (storeId: string, id: string) => storeRecordPath(storeId, "subscriptions", id);
  const change = <T>(storeId: string, path: string, body: object, options?: RequestOptions) =>
    apiConfig.httpClient.post<T>(storePath(storeId, `subscriptions/${path}`), body, options);

  return {
    find(params: FindSubscriptionsParams, options?: RequestOptions): Promise<PaginatedResponse<Subscription>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Subscription>>(storePath(store_id, "subscriptions"), {
        ...options,
        params: query,
      });
    },

    get(params: GetSubscriptionParams, options?: RequestOptions): Promise<Subscription> {
      return apiConfig.httpClient.get<Subscription>(subscriptionPath(params.store_id, params.id), options);
    },

    current(params: GetSubscriptionParams, options?: RequestOptions): Promise<SubscriptionCurrent> {
      return apiConfig.httpClient.get<SubscriptionCurrent>(`${subscriptionPath(params.store_id, params.id)}/current`, options);
    },

    revisions(params: FindSubscriptionRevisionsParams, options?: RequestOptions): Promise<PaginatedResponse<SubscriptionRevision>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<SubscriptionRevision>>(`${subscriptionPath(store_id, id)}/revisions`, {
        ...options,
        params: query,
      });
    },

    getRevision(params: GetSubscriptionRevisionParams, options?: RequestOptions): Promise<SubscriptionRevisionDetail> {
      return apiConfig.httpClient.get<SubscriptionRevisionDetail>(
        `${subscriptionPath(params.store_id, params.subscription_id)}/revisions/${segment(params.revision_id)}`,
        options,
      );
    },

    findOrders(params: FindSubscriptionOrdersParams, options?: RequestOptions): Promise<PaginatedResponse<Order>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Order>>(`${subscriptionPath(store_id, id)}/orders`, {
        ...options,
        params: query,
      });
    },

    purchaseRequirement(
      params: GetSubscriptionPurchaseRequirementParams,
      options?: RequestOptions,
    ): Promise<SubscriptionPurchaseRequirement> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<SubscriptionPurchaseRequirement>(
        `${subscriptionPath(store_id, id)}/purchase-requirement`,
        { ...options, params: query },
      );
    },

    purchaseLimits(
      params: FindSubscriptionPurchaseLimitsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SubscriptionPurchaseLimitPeriod>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<SubscriptionPurchaseLimitPeriod>>(
        `${subscriptionPath(store_id, id)}/purchase-limits`,
        { ...options, params: query },
      );
    },

    purchaseAccess(
      params: FindSubscriptionPurchaseAccessParams,
      options?: RequestOptions,
    ): Promise<SubscriptionPurchaseAccessPage> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<SubscriptionPurchaseAccessPage>(`${subscriptionPath(store_id, id)}/purchase-access`, {
        ...options,
        params: query,
      });
    },

    control(params: ControlSubscriptionParams, options?: RequestOptions): Promise<Subscription> {
      const { store_id, ...body } = params;
      return change<Subscription>(store_id, "commands", body, options);
    },

    calendarOptions(params: GetSubscriptionCalendarOptionsParams, options?: RequestOptions): Promise<SubscriptionCalendarOptions> {
      return change<SubscriptionCalendarOptions>(params.store_id, "calendar/options", { subscription_id: params.id }, options);
    },

    reviewPaymentMethodChange(params: ChangeSubscriptionPaymentMethodParams, options?: RequestOptions): Promise<SubscriptionChangeResult> {
      const { store_id, ...body } = params;
      return change<SubscriptionChangeResult>(store_id, "funding/review", body, options);
    },

    changePaymentMethod(params: ChangeSubscriptionPaymentMethodParams, options?: RequestOptions): Promise<SubscriptionChangeResult> {
      const { store_id, ...body } = params;
      return change<SubscriptionChangeResult>(store_id, "funding/accept", body, options);
    },

    reviewCalendarChange(params: ChangeSubscriptionCalendarParams, options?: RequestOptions): Promise<SubscriptionChangeResult> {
      const { store_id, ...body } = params;
      return change<SubscriptionChangeResult>(store_id, "calendar/review", body, options);
    },

    changeCalendar(params: ChangeSubscriptionCalendarParams, options?: RequestOptions): Promise<SubscriptionChangeResult> {
      const { store_id, ...body } = params;
      return change<SubscriptionChangeResult>(store_id, "calendar/accept", body, options);
    },

    reviewPlanChange(params: ChangeSubscriptionPlanParams, options?: RequestOptions): Promise<SubscriptionChangeResult> {
      const { store_id, ...body } = params;
      return change<SubscriptionChangeResult>(store_id, "plan/review", body, options);
    },

    changePlan(params: ChangeSubscriptionPlanParams, options?: RequestOptions): Promise<SubscriptionChangeResult> {
      const { store_id, ...body } = params;
      return change<SubscriptionChangeResult>(store_id, "plan/accept", body, options);
    },

    reviewTaxCorrection(
      params: CorrectSubscriptionTaxClassificationParams,
      options?: RequestOptions,
    ): Promise<SubscriptionChangeResult> {
      const { store_id, ...body } = params;
      return change<SubscriptionChangeResult>(store_id, "tax-correction/review", body, options);
    },

    correctTaxClassification(
      params: CorrectSubscriptionTaxClassificationParams,
      options?: RequestOptions,
    ): Promise<SubscriptionChangeResult> {
      const { store_id, ...body } = params;
      return change<SubscriptionChangeResult>(store_id, "tax-correction/accept", body, options);
    },

    reviewPurchaseRequirementChange(
      params: ChangeSubscriptionPurchaseRequirementParams,
      options?: RequestOptions,
    ): Promise<SubscriptionChangeResult> {
      const { store_id, ...body } = params;
      return change<SubscriptionChangeResult>(store_id, "purchase-requirement/review", body, options);
    },

    changePurchaseRequirement(
      params: ChangeSubscriptionPurchaseRequirementParams,
      options?: RequestOptions,
    ): Promise<SubscriptionChangeResult> {
      const { store_id, ...body } = params;
      return change<SubscriptionChangeResult>(store_id, "purchase-requirement/accept", body, options);
    },

    transferPurchaseRequirement(
      params: TransferSubscriptionPurchaseRequirementParams,
      options?: RequestOptions,
    ): Promise<SubscriptionPurchaseRequirementTransfer> {
      const { store_id, ...body } = params;
      return change<SubscriptionPurchaseRequirementTransfer>(store_id, "purchase-requirement/transfer", body, options);
    },
  };
};
