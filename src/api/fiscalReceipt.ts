import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CopyFiscalReceiptParams,
  CorrectFiscalReceiptParams,
  DeliverFiscalReceiptParams,
  FindFiscalReceiptsParams,
  FiscalReceiptDetail,
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
    find(params: FindFiscalReceiptsParams, options?: RequestOptions): Promise<PaginatedResponse<FiscalReceiptDetail>> {
      return apiConfig.httpClient.get<PaginatedResponse<FiscalReceiptDetail>>(storePath(params.store_id, collection), {
        ...options,
        params: {
          order_ids: params.order_ids,
          open: params.open,
          created_at_from: params.created_at_from,
          created_at_to: params.created_at_to,
          limit: params.limit,
          cursor: params.cursor,
        },
      });
    },

    get(params: GetFiscalReceiptParams, options?: RequestOptions): Promise<FiscalReceiptDetail> {
      return apiConfig.httpClient.get<FiscalReceiptDetail>(receiptPath(params.store_id, params.fiscal_receipt_id), options);
    },

    copy(params: CopyFiscalReceiptParams, options?: RequestOptions): Promise<FiscalReceiptDetail> {
      requireId(params.id, "fiscal receipt");
      return apiConfig.httpClient.post<FiscalReceiptDetail>(
        `${receiptPath(params.store_id, params.fiscal_receipt_id)}/copy`,
        { id: params.id },
        options,
      );
    },

    correct(params: CorrectFiscalReceiptParams, options?: RequestOptions): Promise<FiscalReceiptDetail[]> {
      requireId(params.id, "fiscal receipt");
      return apiConfig.httpClient.post<FiscalReceiptDetail[]>(
        `${receiptPath(params.store_id, params.fiscal_receipt_id)}/correction`,
        { id: params.id, reason: params.reason, then: params.then },
        options,
      );
    },

    settle(params: SettleFiscalReceiptParams, options?: RequestOptions): Promise<FiscalReceiptDetail> {
      return apiConfig.httpClient.post<FiscalReceiptDetail>(
        `${receiptPath(params.store_id, params.fiscal_receipt_id)}/settle`,
        { outcome: params.outcome },
        options,
      );
    },

    deliver(params: DeliverFiscalReceiptParams, options?: RequestOptions): Promise<FiscalReceiptDetail> {
      return apiConfig.httpClient.post<FiscalReceiptDetail>(
        `${receiptPath(params.store_id, params.fiscal_receipt_id)}/deliver`,
        {},
        options,
      );
    },

    issue(params: IssueFiscalReceiptsParams, options?: RequestOptions): Promise<FiscalReceiptDetail[]> {
      return apiConfig.httpClient.post<FiscalReceiptDetail[]>(
        `${storeRecordPath(params.store_id, "orders", params.order_id)}/${collection}/issue`,
        { fiscal_device_id: params.fiscal_device_id },
        options,
      );
    },
  };
};
