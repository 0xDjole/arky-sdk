import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types";
import type { OrderInvoice, FindOrderInvoicesParams, GetOrderInvoiceParams } from "../types/orderInvoice";

export const createOrderInvoiceApi = (config: ApiConfig) => ({
  find(params: FindOrderInvoicesParams, options?: RequestOptions): Promise<PaginatedResponse<OrderInvoice>> {
    const { store_id, order_id, ...query } = params;
    return config.httpClient.get<PaginatedResponse<OrderInvoice>>(
      `/v1/stores/${encodeURIComponent(store_id || config.storeId)}/orders/${encodeURIComponent(order_id)}/invoices`,
      { ...options, params: query },
    );
  },
  get(params: GetOrderInvoiceParams, options?: RequestOptions): Promise<OrderInvoice> {
    return config.httpClient.get<OrderInvoice>(
      `/v1/stores/${encodeURIComponent(params.store_id || config.storeId)}/orders/${encodeURIComponent(params.order_id)}/invoices/${encodeURIComponent(params.invoice_id)}`,
      options,
    );
  },
});
