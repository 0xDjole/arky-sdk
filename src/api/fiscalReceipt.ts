import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CopyFiscalReceiptParams,
  CorrectFiscalReceiptParams,
  FindFiscalReceiptsParams,
  FiscalReceipt,
  GetFiscalReceiptParams,
  IssueFiscalReceiptsParams,
  SettleFiscalReceiptParams,
} from "../types/fiscalReceipt";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

const collection = "fiscal-receipts";

export const createFiscalReceiptApi = (apiConfig: ApiConfig) => {
  const receiptPath = (storeId: string, fiscalReceiptId: string) =>
    storeRecordPath(storeId, collection, fiscalReceiptId);

  return {
    find(params: FindFiscalReceiptsParams, options?: RequestOptions): Promise<PaginatedResponse<FiscalReceipt>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<FiscalReceipt>>(storePath(store_id, collection), {
        ...options,
        params: query,
      });
    },

    get(params: GetFiscalReceiptParams, options?: RequestOptions): Promise<FiscalReceipt> {
      return apiConfig.httpClient.get<FiscalReceipt>(receiptPath(params.store_id, params.fiscal_receipt_id), options);
    },

    copy(params: CopyFiscalReceiptParams, options?: RequestOptions): Promise<FiscalReceipt> {
      requireId(params.id, "fiscal receipt");
      return apiConfig.httpClient.post<FiscalReceipt>(
        `${receiptPath(params.store_id, params.fiscal_receipt_id)}/copy`,
        { id: params.id },
        options,
      );
    },

    correct(params: CorrectFiscalReceiptParams, options?: RequestOptions): Promise<FiscalReceipt[]> {
      requireId(params.id, "fiscal receipt");
      return apiConfig.httpClient.post<FiscalReceipt[]>(
        `${receiptPath(params.store_id, params.fiscal_receipt_id)}/correction`,
        { id: params.id, reason: params.reason, then: params.then },
        options,
      );
    },

    settle(params: SettleFiscalReceiptParams, options?: RequestOptions): Promise<FiscalReceipt> {
      return apiConfig.httpClient.post<FiscalReceipt>(
        `${receiptPath(params.store_id, params.fiscal_receipt_id)}/settle`,
        { outcome: params.outcome },
        options,
      );
    },

    issue(params: IssueFiscalReceiptsParams, options?: RequestOptions): Promise<FiscalReceipt[]> {
      return apiConfig.httpClient.post<FiscalReceipt[]>(
        `${storeRecordPath(params.store_id, "orders", params.order_id)}/${collection}/issue`,
        { fiscal_device_id: params.fiscal_device_id },
        options,
      );
    },
  };
};
