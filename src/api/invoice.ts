import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type { CreateInvoiceParams, DeleteInvoiceParams, FindInvoicesParams, Invoice } from "../types/invoice";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

export const createInvoiceApi = (apiConfig: ApiConfig) => {
  const orderInvoicesPath = (storeId: string, orderId: string) => `${storeRecordPath(storeId, "orders", orderId)}/invoices`;

  return {
    find(params: FindInvoicesParams, options?: RequestOptions): Promise<PaginatedResponse<Invoice>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Invoice>>(storePath(store_id, "invoices"), {
        ...options,
        params: query,
      });
    },

    create(params: CreateInvoiceParams, options?: RequestOptions): Promise<Invoice> {
      requireId(params.id, "invoice");
      const { store_id, order_id, ...body } = params;
      return apiConfig.httpClient.post<Invoice>(orderInvoicesPath(store_id, order_id), body, options);
    },

    delete(params: DeleteInvoiceParams, options?: RequestOptions): Promise<DeletedResponse> {
      return apiConfig.httpClient.delete<DeletedResponse>(
        `${orderInvoicesPath(params.store_id, params.order_id)}/${segment(params.invoice_id)}`,
        { ...options, params: { expected_updated_at: params.expected_updated_at } },
      );
    },
  };
};
