import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type { OrderCredit } from "../types/orderCredit";
import type {
  ActOnReturnParams,
  CreateReturnParams,
  CreditReturnParams,
  FindReturnsParams,
  GetOrderReturnOptionsParams,
  GetReturnInspectionUnitParams,
  GetReturnParams,
  OrderReturnOptions,
  RentalReturnUnitOption,
  Return,
  ReturnDestinationOptions,
  ReturnDetail,
  ReturnInspectionUnit,
  ReturnListItem,
} from "../types/return";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

export interface FindAdminRentalReturnOptionsParams {
  tenant_id: string;
  rental_id: string;
  limit?: number;
  cursor?: string | null;
}

export const createReturnApi = (apiConfig: ApiConfig) => {
  const returnPath = (tenantId: string, id: string) => tenantRecordPath(tenantId, "returns", id);
  return {
    find(params: FindReturnsParams, options?: RequestOptions): Promise<PaginatedResponse<ReturnListItem>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<ReturnListItem>>(tenantPath(tenant_id, "returns"), { ...options, params: query });
    },

    get(params: GetReturnParams, options?: RequestOptions): Promise<ReturnDetail> {
      return apiConfig.httpClient.get<ReturnDetail>(returnPath(params.tenant_id, params.return_id), options);
    },

    create(params: CreateReturnParams, options?: RequestOptions): Promise<Return> {
      requireId(params.id, "return");
      const { tenant_id, ...body } = params;
      return apiConfig.httpClient.post<Return>(tenantPath(tenant_id, "returns"), body, options);
    },

    getDestinationOptions(params: GetReturnParams, options?: RequestOptions): Promise<ReturnDestinationOptions> {
      return apiConfig.httpClient.get<ReturnDestinationOptions>(
        `${returnPath(params.tenant_id, params.return_id)}/destination-options`,
        options,
      );
    },

    getInspectionUnit(params: GetReturnInspectionUnitParams, options?: RequestOptions): Promise<ReturnInspectionUnit> {
      return apiConfig.httpClient.get<ReturnInspectionUnit>(
        `${returnPath(params.tenant_id, params.return_id)}/inspection-units/${segment(params.inventory_unit_id)}`,
        options,
      );
    },

    getOrderOptions(params: GetOrderReturnOptionsParams, options?: RequestOptions): Promise<OrderReturnOptions> {
      return apiConfig.httpClient.get<OrderReturnOptions>(
        `${tenantRecordPath(params.tenant_id, "orders", params.order_id)}/return-options`,
        options,
      );
    },

    findRentalOptions(
      params: FindAdminRentalReturnOptionsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<RentalReturnUnitOption>> {
      const { tenant_id, rental_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<RentalReturnUnitOption>>(
        `${tenantRecordPath(tenant_id, "rentals", rental_id)}/return-options`,
        { ...options, params: query },
      );
    },

    execute(params: ActOnReturnParams, options?: RequestOptions): Promise<Return> {
      const command = params.command;
      if ((command.type === "approve" || command.type === "decline") && typeof command.notify_user !== "boolean") {
        throw new TypeError("A return approval or decline requires an explicit user email choice");
      }
      if (command.type === "dispose") requireId(command.action_id, "action");
      return apiConfig.httpClient.post<Return>(
        `${returnPath(params.tenant_id, params.return_id)}/execute`,
        { expected_updated_at: params.expected_updated_at, command: params.command },
        options,
      );
    },

    credit(params: CreditReturnParams, options?: RequestOptions): Promise<OrderCredit> {
      requireId(params.id, "credit");
      return apiConfig.httpClient.post<OrderCredit>(
        `${returnPath(params.tenant_id, params.return_id)}/credit`,
        { id: params.id, expected_updated_at: params.expected_updated_at },
        options,
      );
    },
  };
};
