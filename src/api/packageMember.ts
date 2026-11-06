import type { ApiConfig } from "../services/clientTypes";
import type { HttpClient } from "../types/httpClient";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type { Order, StorefrontOrder } from "../types/order";
import type {
  GetStorefrontPackageByKeyParams,
  GetStorefrontPackageParams,
  GetStorefrontPackageProductChoicesParams,
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
  FindPackageMemberPageParams,
  FindPackageMembersParams,
  FindPackageOfferingsParams,
  GetPackageMemberMinimumParams,
  GetPackageMemberParams,
  GetPackageMemberRevisionParams,
  GetPackageOfferingByKeyParams,
  GetPackageOfferingParams,
  GetStorefrontPackageOfferingByKeyParams,
  GetStorefrontPackageOfferingParams,
  PackageMember,
  PackageMemberActionParams,
  PackageMemberCalendar,
  PackageMemberCalendarSelf,
  PackageMemberChange,
  PackageMemberChangeSelf,
  PackageMemberCurrent,
  PackageMemberCurrentSelf,
  PackageMemberDeliveryOptions,
  PackageMemberMinimum,
  PackageMemberMinimumTransfer,
  PackageMemberProductChoices,
  PackageMemberRevision,
  PackageMemberRevisionDetail,
  PackageMemberRevisionDetailSelf,
  PackageMemberSelf,
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
import { segment, storefrontBase, storePath, storeRecordPath } from "./paths";

export const createPackageOfferingApi = (apiConfig: ApiConfig) => ({
  find(
    params: FindPackageOfferingsParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<PackageOffering>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<PackageOffering>>(
      storePath(store_id, "package-offerings"),
      { ...options, params: query },
    );
  },

  get(
    params: GetPackageOfferingParams,
    options?: RequestOptions,
  ): Promise<PackageOffering> {
    return apiConfig.httpClient.get<PackageOffering>(
      storeRecordPath(params.store_id, "package-offerings", params.id),
      options,
    );
  },

  getByKey(
    params: GetPackageOfferingByKeyParams,
    options?: RequestOptions,
  ): Promise<PackageOffering> {
    return apiConfig.httpClient.get<PackageOffering>(
      storePath(
        params.store_id,
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
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<PackageOffering>(
      storePath(store_id, "package-offerings"),
      body,
      options,
    );
  },

  update(
    params: UpdatePackageOfferingParams,
    options?: RequestOptions,
  ): Promise<PackageOffering> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<PackageOffering>(
      storeRecordPath(store_id, "package-offerings", id),
      body,
      options,
    );
  },

  delete(
    params: DeletePackageOfferingParams,
    options?: RequestOptions,
  ): Promise<void> {
    return apiConfig.httpClient.delete<void>(
      storeRecordPath(params.store_id, "package-offerings", params.id),
      {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      },
    );
  },
});

export const createPackageMemberApi = (apiConfig: ApiConfig) => {
  const memberPath = (storeId: string, id: string) =>
    storeRecordPath(storeId, "package-members", id);
  const action = <T>(
    params: PackageMemberActionParams,
    verb: string,
    options?: RequestOptions,
  ) => {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.post<T>(
      `${memberPath(store_id, id)}/${verb}`,
      body,
      options,
    );
  };

  return {
    find(
      params: FindPackageMembersParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PackageMember>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<PackageMember>>(
        storePath(store_id, "package-members"),
        { ...options, params: query },
      );
    },

    get(
      params: GetPackageMemberParams,
      options?: RequestOptions,
    ): Promise<PackageMember> {
      return apiConfig.httpClient.get<PackageMember>(
        memberPath(params.store_id, params.id),
        options,
      );
    },

    assign(
      params: AssignPackageMemberParams,
      options?: RequestOptions,
    ): Promise<PackageMember> {
      requireId(params.id, "package member");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<PackageMember>(
        storePath(store_id, "package-members"),
        body,
        options,
      );
    },

    getCurrent(
      params: GetPackageMemberParams,
      options?: RequestOptions,
    ): Promise<PackageMemberCurrent> {
      return apiConfig.httpClient.get<PackageMemberCurrent>(
        `${memberPath(params.store_id, params.id)}/current`,
        options,
      );
    },

    findRevisions(
      params: FindPackageMemberPageParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PackageMemberRevision>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<
        PaginatedResponse<PackageMemberRevision>
      >(`${memberPath(store_id, id)}/revisions`, {
        ...options,
        params: query,
      });
    },

    getRevision(
      params: GetPackageMemberRevisionParams,
      options?: RequestOptions,
    ): Promise<PackageMemberRevisionDetail> {
      return apiConfig.httpClient.get<PackageMemberRevisionDetail>(
        `${memberPath(params.store_id, params.package_member_id)}/revisions/${segment(params.revision_id)}`,
        options,
      );
    },

    findOrders(
      params: FindPackageMemberPageParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Order>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Order>>(
        `${memberPath(store_id, id)}/orders`,
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
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PackageMemberMinimum>(
        `${memberPath(store_id, id)}/minimum`,
        { ...options, params: query },
      );
    },

    getCalendar(
      params: GetPackageMemberParams,
      options?: RequestOptions,
    ): Promise<PackageMemberCalendar> {
      return apiConfig.httpClient.get<PackageMemberCalendar>(
        `${memberPath(params.store_id, params.id)}/calendar`,
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
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<PackageMemberMinimumTransfer>(
        storePath(
          store_id,
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
      ): Promise<PaginatedResponse<PackageMemberSelf>> {
        await ensureVisitorSession();
        return httpClient.get<PaginatedResponse<PackageMemberSelf>>(
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
      ): Promise<PackageMemberSelf> {
        await ensureVisitorSession();
        return httpClient.get<PackageMemberSelf>(
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
