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
  ReturnInspectionUnit,
} from "../types/return";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

export interface FindAdminRentalReturnOptionsParams {
  store_id: string;
  rental_id: string;
  limit?: number;
  cursor?: string | null;
}

export const createReturnApi = (apiConfig: ApiConfig) => {
  const returnPath = (storeId: string, id: string) => storeRecordPath(storeId, "returns", id);
  return {
    find(params: FindReturnsParams, options?: RequestOptions): Promise<PaginatedResponse<Return>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Return>>(storePath(store_id, "returns"), { ...options, params: query });
    },

    get(params: GetReturnParams, options?: RequestOptions): Promise<Return> {
      return apiConfig.httpClient.get<Return>(returnPath(params.store_id, params.return_id), options);
    },

    create(params: CreateReturnParams, options?: RequestOptions): Promise<Return> {
      requireId(params.id, "return");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<Return>(storePath(store_id, "returns"), body, options);
    },

    destinationOptions(params: GetReturnParams, options?: RequestOptions): Promise<ReturnDestinationOptions> {
      return apiConfig.httpClient.get<ReturnDestinationOptions>(
        `${returnPath(params.store_id, params.return_id)}/destination-options`,
        options,
      );
    },

    inspectionUnit(params: GetReturnInspectionUnitParams, options?: RequestOptions): Promise<ReturnInspectionUnit> {
      return apiConfig.httpClient.get<ReturnInspectionUnit>(
        `${returnPath(params.store_id, params.return_id)}/inspection-units/${segment(params.inventory_unit_id)}`,
        options,
      );
    },

    orderOptions(params: GetOrderReturnOptionsParams, options?: RequestOptions): Promise<OrderReturnOptions> {
      return apiConfig.httpClient.get<OrderReturnOptions>(
        `${storeRecordPath(params.store_id, "orders", params.order_id)}/return-options`,
        options,
      );
    },

    rentalOptions(
      params: FindAdminRentalReturnOptionsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<RentalReturnUnitOption>> {
      const { store_id, rental_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<RentalReturnUnitOption>>(
        `${storeRecordPath(store_id, "rentals", rental_id)}/return-options`,
        { ...options, params: query },
      );
    },

    execute(params: ActOnReturnParams, options?: RequestOptions): Promise<Return> {
      return apiConfig.httpClient.post<Return>(
        `${returnPath(params.store_id, params.return_id)}/execute`,
        { expected_updated_at: params.expected_updated_at, command: params.command },
        options,
      );
    },

    credit(params: CreditReturnParams, options?: RequestOptions): Promise<OrderCredit> {
      requireId(params.id, "credit");
      return apiConfig.httpClient.post<OrderCredit>(
        `${returnPath(params.store_id, params.return_id)}/credit`,
        { id: params.id, expected_updated_at: params.expected_updated_at },
        options,
      );
    },
  };
};
