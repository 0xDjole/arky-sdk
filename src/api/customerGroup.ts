import type { ApiConfig } from "../services/clientTypes";
import type { HttpClient } from "../types/httpClient";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type { Order } from "../types/order";
import type {
  AssignCustomerGroupMemberParams,
  ChangeCustomerGroupMemberPurchaseRequirementParams,
  CorrectCustomerGroupMemberTaxClassificationParams,
  CreateCustomerGroupOfferingParams,
  CreateCustomerGroupParams,
  CustomerGroup,
  CustomerGroupMember,
  CustomerGroupMemberActionParams,
  CustomerGroupMemberCalendar,
  CustomerGroupMemberCalendarSelf,
  CustomerGroupMemberChange,
  CustomerGroupMemberChangeSelf,
  CustomerGroupMemberCurrent,
  CustomerGroupMemberPurchaseAccessPage,
  CustomerGroupMemberPurchaseLimitPeriod,
  CustomerGroupMemberPurchaseRequirement,
  CustomerGroupMemberPurchaseRequirementTransfer,
  CustomerGroupMemberRevision,
  CustomerGroupMemberRevisionDetail,
  CustomerGroupMemberRevisionDetailSelf,
  CustomerGroupMemberSelf,
  CustomerGroupOffering,
  DeleteCustomerGroupOfferingParams,
  DeleteCustomerGroupParams,
  FindCustomerGroupMemberPageParams,
  FindCustomerGroupMemberPurchaseAccessParams,
  FindCustomerGroupMembersParams,
  FindCustomerGroupOfferingsParams,
  FindCustomerGroupsParams,
  FindStorefrontCustomerGroupsParams,
  GetCustomerGroupByKeyParams,
  GetCustomerGroupMemberParams,
  GetCustomerGroupMemberPurchaseRequirementParams,
  GetCustomerGroupMemberRevisionParams,
  GetCustomerGroupOfferingByKeyParams,
  GetCustomerGroupOfferingParams,
  GetCustomerGroupParams,
  GetStorefrontCustomerGroupOfferingParams,
  GetStorefrontCustomerGroupParams,
  PauseCustomerGroupMemberParams,
  RevokeCustomerGroupMemberParams,
  ScheduleCustomerGroupMemberEndParams,
  SelectCustomerGroupMemberPaymentMethodParams,
  SkipNextCustomerGroupMemberPurchaseParams,
  StorefrontCustomerGroup,
  StorefrontCustomerGroupMemberActionParams,
  StorefrontCustomerGroupOffering,
  StorefrontFindCustomerGroupMemberOrdersParams,
  StorefrontFindCustomerGroupMemberPurchaseAccessParams,
  StorefrontFindCustomerGroupMembersParams,
  StorefrontGetCustomerGroupMemberParams,
  StorefrontGetCustomerGroupMemberRevisionParams,
  StorefrontPauseCustomerGroupMemberParams,
  StorefrontSelectCustomerGroupMemberPaymentMethodParams,
  StorefrontSkipNextCustomerGroupMemberPurchaseParams,
  StorefrontSwitchCustomerGroupMemberParams,
  StorefrontWithdrawCustomerGroupMemberRevisionParams,
  SwitchCustomerGroupMemberParams,
  TransferCustomerGroupMemberPurchaseRequirementParams,
  UpdateCustomerGroupOfferingParams,
  UpdateCustomerGroupParams,
  WithdrawCustomerGroupMemberRevisionParams,
} from "../types/customerGroup";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

export const createCustomerGroupApi = (apiConfig: ApiConfig) => ({
  find(params: FindCustomerGroupsParams, options?: RequestOptions): Promise<PaginatedResponse<CustomerGroup>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<CustomerGroup>>(storePath(store_id, "customer-groups"), {
      ...options,
      params: query,
    });
  },

  get(params: GetCustomerGroupParams, options?: RequestOptions): Promise<CustomerGroup> {
    return apiConfig.httpClient.get<CustomerGroup>(storeRecordPath(params.store_id, "customer-groups", params.id), options);
  },

  getByKey(params: GetCustomerGroupByKeyParams, options?: RequestOptions): Promise<CustomerGroup> {
    return apiConfig.httpClient.get<CustomerGroup>(
      storePath(params.store_id, `customer-groups/by-key/${segment(params.key)}`),
      options,
    );
  },

  create(params: CreateCustomerGroupParams, options?: RequestOptions): Promise<CustomerGroup> {
    requireId(params.id, "customer group");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<CustomerGroup>(storePath(store_id, "customer-groups"), body, options);
  },

  update(params: UpdateCustomerGroupParams, options?: RequestOptions): Promise<CustomerGroup> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<CustomerGroup>(storeRecordPath(store_id, "customer-groups", id), body, options);
  },

  delete(params: DeleteCustomerGroupParams, options?: RequestOptions): Promise<void> {
    return apiConfig.httpClient.delete<void>(storeRecordPath(params.store_id, "customer-groups", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createCustomerGroupOfferingApi = (apiConfig: ApiConfig) => ({
  find(
    params: FindCustomerGroupOfferingsParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<CustomerGroupOffering>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<CustomerGroupOffering>>(
      storePath(store_id, "customer-group-offerings"),
      { ...options, params: query },
    );
  },

  get(params: GetCustomerGroupOfferingParams, options?: RequestOptions): Promise<CustomerGroupOffering> {
    return apiConfig.httpClient.get<CustomerGroupOffering>(
      storeRecordPath(params.store_id, "customer-group-offerings", params.id),
      options,
    );
  },

  getByKey(params: GetCustomerGroupOfferingByKeyParams, options?: RequestOptions): Promise<CustomerGroupOffering> {
    return apiConfig.httpClient.get<CustomerGroupOffering>(
      storePath(params.store_id, `customer-group-offerings/by-key/${segment(params.key)}`),
      options,
    );
  },

  create(params: CreateCustomerGroupOfferingParams, options?: RequestOptions): Promise<CustomerGroupOffering> {
    requireId(params.id, "customer group offering");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<CustomerGroupOffering>(storePath(store_id, "customer-group-offerings"), body, options);
  },

  update(params: UpdateCustomerGroupOfferingParams, options?: RequestOptions): Promise<CustomerGroupOffering> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<CustomerGroupOffering>(
      storeRecordPath(store_id, "customer-group-offerings", id),
      body,
      options,
    );
  },

  delete(params: DeleteCustomerGroupOfferingParams, options?: RequestOptions): Promise<void> {
    return apiConfig.httpClient.delete<void>(storeRecordPath(params.store_id, "customer-group-offerings", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createCustomerGroupMemberApi = (apiConfig: ApiConfig) => {
  const memberPath = (storeId: string, id: string) => storeRecordPath(storeId, "customer-group-members", id);
  const action = <T>(params: CustomerGroupMemberActionParams, verb: string, options?: RequestOptions) => {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.post<T>(`${memberPath(store_id, id)}/${verb}`, body, options);
  };

  return {
    find(
      params: FindCustomerGroupMembersParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CustomerGroupMember>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerGroupMember>>(
        storePath(store_id, "customer-group-members"),
        { ...options, params: query },
      );
    },

    get(params: GetCustomerGroupMemberParams, options?: RequestOptions): Promise<CustomerGroupMember> {
      return apiConfig.httpClient.get<CustomerGroupMember>(memberPath(params.store_id, params.id), options);
    },

    assign(params: AssignCustomerGroupMemberParams, options?: RequestOptions): Promise<CustomerGroupMember> {
      requireId(params.id, "customer group member");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<CustomerGroupMember>(storePath(store_id, "customer-group-members"), body, options);
    },

    current(params: GetCustomerGroupMemberParams, options?: RequestOptions): Promise<CustomerGroupMemberCurrent> {
      return apiConfig.httpClient.get<CustomerGroupMemberCurrent>(`${memberPath(params.store_id, params.id)}/current`, options);
    },

    revisions(
      params: FindCustomerGroupMemberPageParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CustomerGroupMemberRevision>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerGroupMemberRevision>>(`${memberPath(store_id, id)}/revisions`, {
        ...options,
        params: query,
      });
    },

    getRevision(
      params: GetCustomerGroupMemberRevisionParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupMemberRevisionDetail> {
      return apiConfig.httpClient.get<CustomerGroupMemberRevisionDetail>(
        `${memberPath(params.store_id, params.customer_group_member_id)}/revisions/${segment(params.revision_id)}`,
        options,
      );
    },

    findOrders(params: FindCustomerGroupMemberPageParams, options?: RequestOptions): Promise<PaginatedResponse<Order>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Order>>(`${memberPath(store_id, id)}/orders`, {
        ...options,
        params: query,
      });
    },

    purchaseRequirement(
      params: GetCustomerGroupMemberPurchaseRequirementParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupMemberPurchaseRequirement> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<CustomerGroupMemberPurchaseRequirement>(
        `${memberPath(store_id, id)}/purchase-requirement`,
        { ...options, params: query },
      );
    },

    purchaseLimits(
      params: FindCustomerGroupMemberPageParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CustomerGroupMemberPurchaseLimitPeriod>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerGroupMemberPurchaseLimitPeriod>>(
        `${memberPath(store_id, id)}/purchase-limits`,
        { ...options, params: query },
      );
    },

    purchaseAccess(
      params: FindCustomerGroupMemberPurchaseAccessParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupMemberPurchaseAccessPage> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<CustomerGroupMemberPurchaseAccessPage>(`${memberPath(store_id, id)}/purchase-access`, {
        ...options,
        params: query,
      });
    },

    calendar(params: GetCustomerGroupMemberParams, options?: RequestOptions): Promise<CustomerGroupMemberCalendar> {
      return apiConfig.httpClient.get<CustomerGroupMemberCalendar>(`${memberPath(params.store_id, params.id)}/calendar`, options);
    },

    cancel(params: CustomerGroupMemberActionParams, options?: RequestOptions): Promise<CustomerGroupMember> {
      return action<CustomerGroupMember>(params, "cancel", options);
    },

    scheduleEnd(params: ScheduleCustomerGroupMemberEndParams, options?: RequestOptions): Promise<CustomerGroupMember> {
      return action<CustomerGroupMember>(params, "schedule-end", options);
    },

    pause(params: PauseCustomerGroupMemberParams, options?: RequestOptions): Promise<CustomerGroupMember> {
      return action<CustomerGroupMember>(params, "pause", options);
    },

    resume(params: CustomerGroupMemberActionParams, options?: RequestOptions): Promise<CustomerGroupMember> {
      return action<CustomerGroupMember>(params, "resume", options);
    },

    skipNext(params: SkipNextCustomerGroupMemberPurchaseParams, options?: RequestOptions): Promise<CustomerGroupMember> {
      return action<CustomerGroupMember>(params, "skip-next", options);
    },

    selectPaymentMethod(
      params: SelectCustomerGroupMemberPaymentMethodParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupMember> {
      return action<CustomerGroupMember>(params, "select-payment-method", options);
    },

    reviewSwitch(params: SwitchCustomerGroupMemberParams, options?: RequestOptions): Promise<CustomerGroupMemberChange> {
      return action<CustomerGroupMemberChange>(params, "review-switch", options);
    },

    switch(params: SwitchCustomerGroupMemberParams, options?: RequestOptions): Promise<CustomerGroupMemberChange> {
      return action<CustomerGroupMemberChange>(params, "switch", options);
    },

    reviewPurchaseRequirement(
      params: ChangeCustomerGroupMemberPurchaseRequirementParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupMemberChange> {
      return action<CustomerGroupMemberChange>(params, "review-purchase-requirement", options);
    },

    changePurchaseRequirement(
      params: ChangeCustomerGroupMemberPurchaseRequirementParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupMemberChange> {
      return action<CustomerGroupMemberChange>(params, "change-purchase-requirement", options);
    },

    reviewTaxCorrection(
      params: CorrectCustomerGroupMemberTaxClassificationParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupMemberChange> {
      return action<CustomerGroupMemberChange>(params, "review-tax-correction", options);
    },

    correctTaxClassification(
      params: CorrectCustomerGroupMemberTaxClassificationParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupMemberChange> {
      return action<CustomerGroupMemberChange>(params, "correct-tax-classification", options);
    },

    withdrawRevision(
      params: WithdrawCustomerGroupMemberRevisionParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupMemberChange> {
      return action<CustomerGroupMemberChange>(params, "withdraw-revision", options);
    },

    revoke(params: RevokeCustomerGroupMemberParams, options?: RequestOptions): Promise<CustomerGroupMember> {
      return action<CustomerGroupMember>(params, "revoke", options);
    },

    transferPurchaseRequirement(
      params: TransferCustomerGroupMemberPurchaseRequirementParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupMemberPurchaseRequirementTransfer> {
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<CustomerGroupMemberPurchaseRequirementTransfer>(
        storePath(store_id, "customer-group-members/transfer-purchase-requirement"),
        body,
        options,
      );
    },
  };
};

export function createStorefrontCustomerGroupApi(httpClient: HttpClient, ensureVisitorSession: () => Promise<void>) {
  const base = "/v1/storefront";
  const memberPath = (id: string) => `${base}/customer-group-members/${segment(id)}`;
  const action = async <T>(params: StorefrontCustomerGroupMemberActionParams, verb: string, options?: RequestOptions) => {
    await ensureVisitorSession();
    const { id, ...body } = params;
    return httpClient.post<T>(`${memberPath(id)}/${verb}`, body, options);
  };

  return {
    customerGroup: {
      find(
        params: FindStorefrontCustomerGroupsParams = {},
        options?: RequestOptions,
      ): Promise<PaginatedResponse<StorefrontCustomerGroup>> {
        return httpClient.get<PaginatedResponse<StorefrontCustomerGroup>>(`${base}/customer-groups`, { ...options, params });
      },

      get(params: GetStorefrontCustomerGroupParams, options?: RequestOptions): Promise<StorefrontCustomerGroup> {
        const { identifier, ...query } = params;
        return httpClient.get<StorefrontCustomerGroup>(`${base}/customer-groups/${segment(identifier)}`, {
          ...options,
          params: query,
        });
      },
    },

    customerGroupOffering: {
      get(params: GetStorefrontCustomerGroupOfferingParams, options?: RequestOptions): Promise<StorefrontCustomerGroupOffering> {
        return httpClient.get<StorefrontCustomerGroupOffering>(
          `${base}/customer-group-offerings/${segment(params.identifier)}`,
          options,
        );
      },
    },

    customerGroupMember: {
      async find(
        params: StorefrontFindCustomerGroupMembersParams = {},
        options?: RequestOptions,
      ): Promise<PaginatedResponse<CustomerGroupMemberSelf>> {
        await ensureVisitorSession();
        return httpClient.get<PaginatedResponse<CustomerGroupMemberSelf>>(`${base}/customer-group-members`, {
          ...options,
          params,
        });
      },

      async get(params: StorefrontGetCustomerGroupMemberParams, options?: RequestOptions): Promise<CustomerGroupMemberSelf> {
        await ensureVisitorSession();
        return httpClient.get<CustomerGroupMemberSelf>(memberPath(params.id), options);
      },

      async getRevision(
        params: StorefrontGetCustomerGroupMemberRevisionParams,
        options?: RequestOptions,
      ): Promise<CustomerGroupMemberRevisionDetailSelf> {
        await ensureVisitorSession();
        return httpClient.get<CustomerGroupMemberRevisionDetailSelf>(
          `${memberPath(params.customer_group_member_id)}/revisions/${segment(params.revision_id)}`,
          options,
        );
      },

      async findOrders(
        params: StorefrontFindCustomerGroupMemberOrdersParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<Order>> {
        await ensureVisitorSession();
        const { id, ...query } = params;
        return httpClient.get<PaginatedResponse<Order>>(`${memberPath(id)}/orders`, { ...options, params: query });
      },

      async purchaseAccess(
        params: StorefrontFindCustomerGroupMemberPurchaseAccessParams,
        options?: RequestOptions,
      ): Promise<CustomerGroupMemberPurchaseAccessPage> {
        await ensureVisitorSession();
        const { id, ...query } = params;
        return httpClient.get<CustomerGroupMemberPurchaseAccessPage>(`${memberPath(id)}/purchase-access`, {
          ...options,
          params: query,
        });
      },

      async calendar(
        params: StorefrontGetCustomerGroupMemberParams,
        options?: RequestOptions,
      ): Promise<CustomerGroupMemberCalendarSelf> {
        await ensureVisitorSession();
        return httpClient.get<CustomerGroupMemberCalendarSelf>(`${memberPath(params.id)}/calendar`, options);
      },

      cancel(params: StorefrontCustomerGroupMemberActionParams, options?: RequestOptions): Promise<CustomerGroupMemberSelf> {
        return action<CustomerGroupMemberSelf>(params, "cancel", options);
      },

      pause(params: StorefrontPauseCustomerGroupMemberParams, options?: RequestOptions): Promise<CustomerGroupMemberSelf> {
        return action<CustomerGroupMemberSelf>(params, "pause", options);
      },

      resume(params: StorefrontCustomerGroupMemberActionParams, options?: RequestOptions): Promise<CustomerGroupMemberSelf> {
        return action<CustomerGroupMemberSelf>(params, "resume", options);
      },

      skipNext(
        params: StorefrontSkipNextCustomerGroupMemberPurchaseParams,
        options?: RequestOptions,
      ): Promise<CustomerGroupMemberSelf> {
        return action<CustomerGroupMemberSelf>(params, "skip-next", options);
      },

      selectPaymentMethod(
        params: StorefrontSelectCustomerGroupMemberPaymentMethodParams,
        options?: RequestOptions,
      ): Promise<CustomerGroupMemberSelf> {
        return action<CustomerGroupMemberSelf>(params, "select-payment-method", options);
      },

      reviewSwitch(
        params: StorefrontSwitchCustomerGroupMemberParams,
        options?: RequestOptions,
      ): Promise<CustomerGroupMemberChangeSelf> {
        return action<CustomerGroupMemberChangeSelf>(params, "review-switch", options);
      },

      switch(params: StorefrontSwitchCustomerGroupMemberParams, options?: RequestOptions): Promise<CustomerGroupMemberChangeSelf> {
        return action<CustomerGroupMemberChangeSelf>(params, "switch", options);
      },

      withdrawRevision(
        params: StorefrontWithdrawCustomerGroupMemberRevisionParams,
        options?: RequestOptions,
      ): Promise<CustomerGroupMemberChangeSelf> {
        return action<CustomerGroupMemberChangeSelf>(params, "withdraw-revision", options);
      },
    },
  };
}
