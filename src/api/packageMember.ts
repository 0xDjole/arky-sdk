import type { ApiConfig } from "../services/clientTypes";
import type { HttpClient } from "../types/httpClient";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type { Order, StorefrontOrder } from "../types/order";
import type {
  GetStorefrontPackageByKeyParams,
  GetStorefrontPackageParams,
  GetStorefrontPackageItemsProductChoicesParams,
  GetStorefrontPackageProductChoicesParams,
  PackageItemsProductChoices,
  PackageProductChoices,
  StorefrontPackage,
} from "../types/package";
import type {
  AssignPackageMemberParams,
  CancelPackageMemberParams,
  ChangePackageMemberMinimumParams,
  ChangePackageMemberTermsParams,
  CreatePackageOfferingParams,
  DeletePackageOfferingParams,
  FindPackageMemberOrdersParams,
  FindPackageMemberPageParams,
  FindPackageMembersCurrentParams,
  FindPackageMembersParams,
  FindPackageOfferingsParams,
  GetPackageMemberMinimumParams,
  GetPackageMemberParams,
  GetPackageMemberRevisionParams,
  FindPackageMemberRevisionPurchaseOrdersParams,
  GetPackageOfferingByKeyParams,
  GetPackageOfferingParams,
  GetStorefrontPackageOfferingByKeyParams,
  GetStorefrontPackageOfferingParams,
  PackageMember,
  PackageMemberActionParams,
  PackageMemberCalendar,
  PackageMemberCalendarSelf,
  PackageMemberChange,
  PackageMemberChanges,
  PackageMemberChangeSelf,
  PackageMemberCurrent,
  PackageMemberDetail,
  PackageMemberDetailSelf,
  PackageMemberListItem,
  PackageMemberCurrentSelf,
  PackageMemberDeliveryOptions,
  PackageMemberMinimum,
  PackageMemberMinimumTransfer,
  PackageMemberProductChoices,
  PackageMemberRevision,
  PackageMemberRevisionDetail,
  PackageMemberRevisionDetailSelf,
  PackageMemberSelf,
  PackageMemberSelfListItem,
  PackageOffering,
  PausePackageMemberParams,
  RevokePackageMemberParams,
  SchedulePackageMemberEndParams,
  SelectPackageMemberPaymentMethodParams,
  SkipNextPackageMemberRenewalParams,
  StorefrontChangePackageMemberTermsParams,
  StorefrontFindPackageMemberOrdersParams,
  StorefrontFindPackageMembersParams,
  StorefrontGetPackageMemberDeliveryOptionsParams,
  StorefrontGetPackageMemberParams,
  StorefrontGetPackageMemberProductChoicesParams,
  StorefrontGetPackageMemberRevisionParams,
  StorefrontGetPackageMemberSwitchDeliveryOptionsParams,
  StorefrontPackageMemberActionParams,
  StorefrontPackageOffering,
  StorefrontPausePackageMemberParams,
  StorefrontSelectPackageMemberPaymentMethodParams,
  StorefrontSkipNextPackageMemberRenewalParams,
  StorefrontSwitchPackageMemberParams,
  StorefrontWithdrawPackageMemberRevisionParams,
  SwitchPackageMemberParams,
  TransferPackageMemberMinimumParams,
  UpdatePackageOfferingParams,
  WithdrawPackageMemberRevisionParams,
} from "../types/packageMember";
import { requireId } from "../utils/ids";
import { segment, storefrontBase, tenantPath, tenantRecordPath } from "./paths";

export const createPackageOfferingApi = (apiConfig: ApiConfig) => ({
  find(
    params: FindPackageOfferingsParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<PackageOffering>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<PackageOffering>>(
      tenantPath(tenant_id, "package-offerings"),
      { ...options, params: query },
    );
  },

  get(
    params: GetPackageOfferingParams,
    options?: RequestOptions,
  ): Promise<PackageOffering> {
    return apiConfig.httpClient.get<PackageOffering>(
      tenantRecordPath(params.tenant_id, "package-offerings", params.id),
      options,
    );
  },

  getByKey(
    params: GetPackageOfferingByKeyParams,
    options?: RequestOptions,
  ): Promise<PackageOffering> {
    return apiConfig.httpClient.get<PackageOffering>(
      tenantPath(
        params.tenant_id,
        `package-offerings/by-key/${segment(params.key)}`,
      ),
      options,
    );
  },

  create(
    params: CreatePackageOfferingParams,
    options?: RequestOptions,
  ): Promise<PackageOffering> {
    requireId(params.id, "package offering");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<PackageOffering>(
      tenantPath(tenant_id, "package-offerings"),
      body,
      options,
    );
  },

  update(
    params: UpdatePackageOfferingParams,
    options?: RequestOptions,
  ): Promise<PackageOffering> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<PackageOffering>(
      tenantRecordPath(tenant_id, "package-offerings", id),
      body,
      options,
    );
  },

  delete(
    params: DeletePackageOfferingParams,
    options?: RequestOptions,
  ): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(
      tenantRecordPath(params.tenant_id, "package-offerings", params.id),
      {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      },
    );
  },
});

export const createPackageMemberApi = (apiConfig: ApiConfig) => {
  const memberPath = (tenantId: string, id: string) =>
    tenantRecordPath(tenantId, "package-members", id);
  const action = <T>(
    params: PackageMemberActionParams,
    verb: string,
    options?: RequestOptions,
  ) => {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.post<T>(
      `${memberPath(tenant_id, id)}/${verb}`,
      body,
      options,
    );
  };

  return {
    find(
      params: FindPackageMembersParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PackageMemberListItem>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<PackageMemberListItem>>(
        tenantPath(tenant_id, "package-members"),
        { ...options, params: query },
      );
    },

    findCurrent(
      params: FindPackageMembersCurrentParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PackageMemberCurrent>> {
      return apiConfig.httpClient.get<PaginatedResponse<PackageMemberCurrent>>(
        tenantPath(params.tenant_id, "package-members/current"),
        { ...options, params: { ids: params.ids } },
      );
    },

    get(
      params: GetPackageMemberParams,
      options?: RequestOptions,
    ): Promise<PackageMemberDetail> {
      return apiConfig.httpClient.get<PackageMemberDetail>(
        memberPath(params.tenant_id, params.id),
        options,
      );
    },

    assign(
      params: AssignPackageMemberParams,
      options?: RequestOptions,
    ): Promise<PackageMember> {
      requireId(params.id, "package member");
      const { tenant_id, ...body } = params;
      return apiConfig.httpClient.post<PackageMember>(
        tenantPath(tenant_id, "package-members"),
        body,
        options,
      );
    },

    getCurrent(
      params: GetPackageMemberParams,
      options?: RequestOptions,
    ): Promise<PackageMemberCurrent> {
      return apiConfig.httpClient.get<PackageMemberCurrent>(
        `${memberPath(params.tenant_id, params.id)}/current`,
        options,
      );
    },

    findRevisions(
      params: FindPackageMemberPageParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PackageMemberRevision>> {
      const { tenant_id, id, ...query } = params;
      return apiConfig.httpClient.get<
        PaginatedResponse<PackageMemberRevision>
      >(`${memberPath(tenant_id, id)}/revisions`, {
        ...options,
        params: query,
      });
    },

    getRevision(
      params: GetPackageMemberRevisionParams,
      options?: RequestOptions,
    ): Promise<PackageMemberRevisionDetail> {
      return apiConfig.httpClient.get<PackageMemberRevisionDetail>(
        `${memberPath(params.tenant_id, params.package_member_id)}/revisions/${segment(params.revision_id)}`,
        options,
      );
    },

    findRevisionPurchaseOrders(
      params: FindPackageMemberRevisionPurchaseOrdersParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Order>> {
      const { tenant_id, package_member_id, revision_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Order>>(
        `${memberPath(tenant_id, package_member_id)}/revisions/${segment(revision_id)}/purchase-orders`,
        { ...options, params: query },
      );
    },

    findOrders(
      params: FindPackageMemberOrdersParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Order>> {
      const { tenant_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Order>>(
        `${memberPath(tenant_id, id)}/orders`,
        {
          ...options,
          params: query,
        },
      );
    },

    getMinimum(
      params: GetPackageMemberMinimumParams,
      options?: RequestOptions,
    ): Promise<PackageMemberMinimum> {
      const { tenant_id, id, ...query } = params;
      return apiConfig.httpClient.get<PackageMemberMinimum>(
        `${memberPath(tenant_id, id)}/minimum`,
        { ...options, params: query },
      );
    },

    getCalendar(
      params: GetPackageMemberParams,
      options?: RequestOptions,
    ): Promise<PackageMemberCalendar> {
      return apiConfig.httpClient.get<PackageMemberCalendar>(
        `${memberPath(params.tenant_id, params.id)}/calendar`,
        options,
      );
    },

    getChanges(
      params: GetPackageMemberParams,
      options?: RequestOptions,
    ): Promise<PackageMemberChanges> {
      return apiConfig.httpClient.get<PackageMemberChanges>(
        `${memberPath(params.tenant_id, params.id)}/changes`,
        options,
      );
    },

    cancel(
      params: CancelPackageMemberParams,
      options?: RequestOptions,
    ): Promise<PackageMember> {
      return action<PackageMember>(params, "cancel", options);
    },

    scheduleEnd(
      params: SchedulePackageMemberEndParams,
      options?: RequestOptions,
    ): Promise<PackageMember> {
      return action<PackageMember>(params, "schedule-end", options);
    },

    pause(
      params: PausePackageMemberParams,
      options?: RequestOptions,
    ): Promise<PackageMember> {
      return action<PackageMember>(params, "pause", options);
    },

    resume(
      params: PackageMemberActionParams,
      options?: RequestOptions,
    ): Promise<PackageMember> {
      return action<PackageMember>(params, "resume", options);
    },

    skipNext(
      params: SkipNextPackageMemberRenewalParams,
      options?: RequestOptions,
    ): Promise<PackageMember> {
      return action<PackageMember>(params, "skip-next", options);
    },

    selectPaymentMethod(
      params: SelectPackageMemberPaymentMethodParams,
      options?: RequestOptions,
    ): Promise<PackageMember> {
      return action<PackageMember>(
        params,
        "select-payment-method",
        options,
      );
    },

    reviewSwitch(
      params: SwitchPackageMemberParams,
      options?: RequestOptions,
    ): Promise<PackageMemberChange> {
      return action<PackageMemberChange>(
        params,
        "review-switch",
        options,
      );
    },

    switch(
      params: SwitchPackageMemberParams,
      options?: RequestOptions,
    ): Promise<PackageMemberChange> {
      return action<PackageMemberChange>(params, "switch", options);
    },

    reviewMinimum(
      params: ChangePackageMemberMinimumParams,
      options?: RequestOptions,
    ): Promise<PackageMemberChange> {
      return action<PackageMemberChange>(
        params,
        "review-minimum",
        options,
      );
    },

    changeMinimum(
      params: ChangePackageMemberMinimumParams,
      options?: RequestOptions,
    ): Promise<PackageMemberChange> {
      return action<PackageMemberChange>(
        params,
        "change-minimum",
        options,
      );
    },

    reviewTerms(
      params: ChangePackageMemberTermsParams,
      options?: RequestOptions,
    ): Promise<PackageMemberChange> {
      return action<PackageMemberChange>(params, "review-terms", options);
    },

    changeTerms(
      params: ChangePackageMemberTermsParams,
      options?: RequestOptions,
    ): Promise<PackageMemberChange> {
      return action<PackageMemberChange>(params, "change-terms", options);
    },

    withdrawRevision(
      params: WithdrawPackageMemberRevisionParams,
      options?: RequestOptions,
    ): Promise<PackageMemberChange> {
      return action<PackageMemberChange>(
        params,
        "withdraw-revision",
        options,
      );
    },

    revoke(
      params: RevokePackageMemberParams,
      options?: RequestOptions,
    ): Promise<PackageMember> {
      return action<PackageMember>(params, "revoke", options);
    },

    transferMinimum(
      params: TransferPackageMemberMinimumParams,
      options?: RequestOptions,
    ): Promise<PackageMemberMinimumTransfer> {
      const { tenant_id, ...body } = params;
      return apiConfig.httpClient.post<PackageMemberMinimumTransfer>(
        tenantPath(
          tenant_id,
          "package-members/transfer-minimum",
        ),
        body,
        options,
      );
    },
  };
};

export function createStorefrontPackageApi(
  httpClient: HttpClient,
  ensureVisitorSession: () => Promise<void>,
) {
  const memberPath = (id: string) =>
    `${storefrontBase}/package-members/${segment(id)}`;
  const action = async <T>(
    params: StorefrontPackageMemberActionParams,
    verb: string,
    options?: RequestOptions,
  ) => {
    await ensureVisitorSession();
    const { id, ...body } = params;
    return httpClient.post<T>(`${memberPath(id)}/${verb}`, body, options);
  };

  return {
    package: {
      get(
        params: GetStorefrontPackageParams,
        options?: RequestOptions,
      ): Promise<StorefrontPackage> {
        const { id, ...query } = params;
        return httpClient.get<StorefrontPackage>(
          `${storefrontBase}/packages/${segment(id)}`,
          {
            ...options,
            params: query,
          },
        );
      },

      getByKey(
        params: GetStorefrontPackageByKeyParams,
        options?: RequestOptions,
      ): Promise<StorefrontPackage> {
        const { key, ...query } = params;
        return httpClient.get<StorefrontPackage>(
          `${storefrontBase}/packages/${segment(key)}`,
          {
            ...options,
            params: query,
          },
        );
      },

      getItemsProductChoices(
        params: GetStorefrontPackageItemsProductChoicesParams,
        options?: RequestOptions,
      ): Promise<PackageItemsProductChoices> {
        const identifier = "id" in params ? params.id : params.key;
        if (!identifier) throw new TypeError("Product choices name their package by id or by key");
        const query = {
          package_id: params.package_id,
          company_id: params.company_id,
          company_location_id: params.company_location_id,
          quantity: params.quantity,
        };
        return httpClient.get<PackageItemsProductChoices>(
          `${storefrontBase}/packages/${segment(identifier)}/product-choices`,
          { ...options, params: query },
        );
      },

      getProductChoices(
        params: GetStorefrontPackageProductChoicesParams,
        options?: RequestOptions,
      ): Promise<PackageProductChoices> {
        const identifier = "id" in params ? params.id : params.key;
        if (!identifier) throw new TypeError("Product choices name their package by id or by key");
        const query = {
          package_id: params.package_id,
          company_id: params.company_id,
          company_location_id: params.company_location_id,
          quantity: params.quantity,
        };
        return httpClient.get<PackageProductChoices>(
          `${storefrontBase}/packages/${segment(identifier)}/product-choices/${segment(params.package_item_id)}`,
          { ...options, params: query },
        );
      },
    },

    packageOffering: {
      get(
        params: GetStorefrontPackageOfferingParams,
        options?: RequestOptions,
      ): Promise<StorefrontPackageOffering> {
        const { id, ...query } = params;
        return httpClient.get<StorefrontPackageOffering>(
          `${storefrontBase}/package-offerings/${segment(id)}`,
          { ...options, params: query },
        );
      },

      getByKey(
        params: GetStorefrontPackageOfferingByKeyParams,
        options?: RequestOptions,
      ): Promise<StorefrontPackageOffering> {
        const { key, ...query } = params;
        return httpClient.get<StorefrontPackageOffering>(
          `${storefrontBase}/package-offerings/${segment(key)}`,
          { ...options, params: query },
        );
      },
    },

    packageMember: {
      async find(
        params: StorefrontFindPackageMembersParams = {},
        options?: RequestOptions,
      ): Promise<PaginatedResponse<PackageMemberSelfListItem>> {
        await ensureVisitorSession();
        return httpClient.get<PaginatedResponse<PackageMemberSelfListItem>>(
          `${storefrontBase}/package-members`,
          {
            ...options,
            params,
          },
        );
      },

      async get(
        params: StorefrontGetPackageMemberParams,
        options?: RequestOptions,
      ): Promise<PackageMemberDetailSelf> {
        await ensureVisitorSession();
        return httpClient.get<PackageMemberDetailSelf>(
          memberPath(params.id),
          options,
        );
      },

      async getCurrent(
        params: StorefrontGetPackageMemberParams,
        options?: RequestOptions,
      ): Promise<PackageMemberCurrentSelf> {
        await ensureVisitorSession();
        return httpClient.get<PackageMemberCurrentSelf>(
          `${memberPath(params.id)}/current`,
          options,
        );
      },

      async getProductChoices(
        params: StorefrontGetPackageMemberProductChoicesParams,
        options?: RequestOptions,
      ): Promise<PackageMemberProductChoices> {
        await ensureVisitorSession();
        const { id, package_item_id, ...query } = params;
        return httpClient.get<PackageMemberProductChoices>(
          `${memberPath(id)}/product-choices/${segment(package_item_id)}`,
          { ...options, params: query },
        );
      },

      async getRevision(
        params: StorefrontGetPackageMemberRevisionParams,
        options?: RequestOptions,
      ): Promise<PackageMemberRevisionDetailSelf> {
        await ensureVisitorSession();
        return httpClient.get<PackageMemberRevisionDetailSelf>(
          `${memberPath(params.package_member_id)}/revisions/${segment(params.revision_id)}`,
          options,
        );
      },

      async findOrders(
        params: StorefrontFindPackageMemberOrdersParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<StorefrontOrder>> {
        await ensureVisitorSession();
        const { id, ...query } = params;
        return httpClient.get<PaginatedResponse<StorefrontOrder>>(
          `${memberPath(id)}/orders`,
          { ...options, params: query },
        );
      },

      async getCalendar(
        params: StorefrontGetPackageMemberParams,
        options?: RequestOptions,
      ): Promise<PackageMemberCalendarSelf> {
        await ensureVisitorSession();
        return httpClient.get<PackageMemberCalendarSelf>(
          `${memberPath(params.id)}/calendar`,
          options,
        );
      },

      cancel(
        params: StorefrontPackageMemberActionParams,
        options?: RequestOptions,
      ): Promise<PackageMemberSelf> {
        return action<PackageMemberSelf>(params, "cancel", options);
      },

      pause(
        params: StorefrontPausePackageMemberParams,
        options?: RequestOptions,
      ): Promise<PackageMemberSelf> {
        return action<PackageMemberSelf>(params, "pause", options);
      },

      resume(
        params: StorefrontPackageMemberActionParams,
        options?: RequestOptions,
      ): Promise<PackageMemberSelf> {
        return action<PackageMemberSelf>(params, "resume", options);
      },

      skipNext(
        params: StorefrontSkipNextPackageMemberRenewalParams,
        options?: RequestOptions,
      ): Promise<PackageMemberSelf> {
        return action<PackageMemberSelf>(params, "skip-next", options);
      },

      selectPaymentMethod(
        params: StorefrontSelectPackageMemberPaymentMethodParams,
        options?: RequestOptions,
      ): Promise<PackageMemberSelf> {
        return action<PackageMemberSelf>(
          params,
          "select-payment-method",
          options,
        );
      },

      reviewSwitch(
        params: StorefrontSwitchPackageMemberParams,
        options?: RequestOptions,
      ): Promise<PackageMemberChangeSelf> {
        return action<PackageMemberChangeSelf>(
          params,
          "review-switch",
          options,
        );
      },

      switch(
        params: StorefrontSwitchPackageMemberParams,
        options?: RequestOptions,
      ): Promise<PackageMemberChangeSelf> {
        return action<PackageMemberChangeSelf>(params, "switch", options);
      },

      async getDeliveryOptions(
        params: StorefrontGetPackageMemberDeliveryOptionsParams,
        options?: RequestOptions,
      ): Promise<PackageMemberDeliveryOptions> {
        await ensureVisitorSession();
        const { id, delivery_id, ...body } = params;
        return httpClient.post<PackageMemberDeliveryOptions>(
          `${memberPath(id)}/delivery-options/${segment(delivery_id)}`,
          body,
          options,
        );
      },

      async getSwitchDeliveryOptions(
        params: StorefrontGetPackageMemberSwitchDeliveryOptionsParams,
        options?: RequestOptions,
      ): Promise<PackageMemberDeliveryOptions> {
        await ensureVisitorSession();
        const { id, delivery_id, ...body } = params;
        return httpClient.post<PackageMemberDeliveryOptions>(
          `${memberPath(id)}/switch-delivery-options/${segment(delivery_id)}`,
          body,
          options,
        );
      },

      reviewTerms(
        params: StorefrontChangePackageMemberTermsParams,
        options?: RequestOptions,
      ): Promise<PackageMemberChangeSelf> {
        return action<PackageMemberChangeSelf>(
          params,
          "review-terms",
          options,
        );
      },

      changeTerms(
        params: StorefrontChangePackageMemberTermsParams,
        options?: RequestOptions,
      ): Promise<PackageMemberChangeSelf> {
        return action<PackageMemberChangeSelf>(
          params,
          "change-terms",
          options,
        );
      },

      withdrawRevision(
        params: StorefrontWithdrawPackageMemberRevisionParams,
        options?: RequestOptions,
      ): Promise<PackageMemberChangeSelf> {
        return action<PackageMemberChangeSelf>(
          params,
          "withdraw-revision",
          options,
        );
      },
    },
  };
}
