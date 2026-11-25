import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type { Store } from "../types/store";
import type {
  AttachOutsideInvoiceParams,
  ConfirmInvoiceCounterParams,
  CreateOutsideCreditNoteParams,
  CreateStoreSellerParams,
  DeleteOutsideCreditNoteParams,
  DeleteStoreSellerParams,
  DetachOutsideInvoiceParams,
  FindInvoiceCountersParams,
  FindInvoicesParams,
  FindUnissuedInvoicesParams,
  UnissuedInvoice,
  GetInvoiceParams,
  GetStoreSellerParams,
  Invoice,
  InvoiceCounter,
  IssueInvoiceParams,
  ReissuedInvoice,
  ReissueInvoiceParams,
  SetStoreInvoicingParams,
  StoreSeller,
  UpdateStoreSellerParams,
} from "../types/invoice";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

const collection = "invoices";

export const createInvoiceApi = (apiConfig: ApiConfig) => {
  const invoicePath = (storeId: string, invoiceId: string) => storeRecordPath(storeId, collection, invoiceId);

  return {
    find(params: FindInvoicesParams, options?: RequestOptions): Promise<PaginatedResponse<Invoice>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Invoice>>(storePath(store_id, collection), {
        ...options,
        params: query,
      });
    },

    findUnissued(params: FindUnissuedInvoicesParams, options?: RequestOptions): Promise<PaginatedResponse<UnissuedInvoice>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<UnissuedInvoice>>(`${storePath(store_id, collection)}/unissued`, {
        ...options,
        params: query,
      });
    },

    get(params: GetInvoiceParams, options?: RequestOptions): Promise<Invoice> {
      return apiConfig.httpClient.get<Invoice>(invoicePath(params.store_id, params.invoice_id), options);
    },

    issue(params: IssueInvoiceParams, options?: RequestOptions): Promise<Invoice> {
      return apiConfig.httpClient.post<Invoice>(
        storePath(params.store_id, collection),
        { order_id: params.order_id, buyer: params.buyer, memo: params.memo },
        options,
      );
    },

    reissue(params: ReissueInvoiceParams, options?: RequestOptions): Promise<ReissuedInvoice> {
      requireId(params.reversal_id, "reversal");
      requireId(params.new_invoice_id, "invoice");
      return apiConfig.httpClient.post<ReissuedInvoice>(
        `${invoicePath(params.store_id, params.invoice_id)}/reissue`,
        {
          expected_updated_at: params.expected_updated_at,
          reversal_id: params.reversal_id,
          new_invoice_id: params.new_invoice_id,
          reason: params.reason,
          buyer: params.buyer,
          memo: params.memo,
          void_credit_ids: params.void_credit_ids,
        },
        options,
      );
    },

    attachOutside(params: AttachOutsideInvoiceParams, options?: RequestOptions): Promise<Invoice> {
      return apiConfig.httpClient.post<Invoice>(
        `${storePath(params.store_id, collection)}/outside`,
        { order_id: params.order_id, number: params.number, document: params.document },
        options,
      );
    },

    detachOutside(params: DetachOutsideInvoiceParams, options?: RequestOptions): Promise<Invoice | null> {
      return apiConfig.httpClient.post<Invoice | null>(
        `${invoicePath(params.store_id, params.invoice_id)}/detach`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    createOutsideCreditNote(params: CreateOutsideCreditNoteParams, options?: RequestOptions): Promise<Invoice> {
      requireId(params.id, "credit note");
      return apiConfig.httpClient.post<Invoice>(
        `${invoicePath(params.store_id, params.invoice_id)}/credit-notes`,
        { id: params.id, order_credit_id: params.order_credit_id, number: params.number, document: params.document },
        options,
      );
    },

    deleteOutsideCreditNote(params: DeleteOutsideCreditNoteParams, options?: RequestOptions): Promise<DeletedResponse> {
      return apiConfig.httpClient.delete<DeletedResponse>(invoicePath(params.store_id, params.invoice_id), {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },
  };
};

export const createStoreSellerApi = (apiConfig: ApiConfig) => ({
  get(params: GetStoreSellerParams, options?: RequestOptions): Promise<StoreSeller> {
    return apiConfig.httpClient.get<StoreSeller>(storePath(params.store_id, "seller"), options);
  },

  create(params: CreateStoreSellerParams, options?: RequestOptions): Promise<StoreSeller> {
    requireId(params.id, "seller");
    return apiConfig.httpClient.post<StoreSeller>(
      storePath(params.store_id, "seller"),
      {
        id: params.id,
        name: params.name,
        address: params.address,
        tax: params.tax,
        bank_account: params.bank_account,
        invoice_footer: params.invoice_footer,
      },
      options,
    );
  },

  update(params: UpdateStoreSellerParams, options?: RequestOptions): Promise<StoreSeller> {
    return apiConfig.httpClient.put<StoreSeller>(
      storePath(params.store_id, "seller"),
      {
        expected_updated_at: params.expected_updated_at,
        name: params.name,
        address: params.address,
        tax: params.tax,
        bank_account: params.bank_account,
        invoice_footer: params.invoice_footer,
      },
      options,
    );
  },

  delete(params: DeleteStoreSellerParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(storePath(params.store_id, "seller"), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createStoreInvoicingApi = (apiConfig: ApiConfig) => ({
  set(params: SetStoreInvoicingParams, options?: RequestOptions): Promise<Store> {
    return apiConfig.httpClient.put<Store>(
      storePath(params.store_id, "invoicing"),
      { expected_updated_at: params.expected_updated_at, invoicing: params.invoicing },
      options,
    );
  },
});

export const createInvoiceCounterApi = (apiConfig: ApiConfig) => ({
  find(params: FindInvoiceCountersParams, options?: RequestOptions): Promise<PaginatedResponse<InvoiceCounter>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<InvoiceCounter>>(storePath(store_id, "invoice-counters"), {
      ...options,
      params: query,
    });
  },

  confirm(params: ConfirmInvoiceCounterParams, options?: RequestOptions): Promise<InvoiceCounter> {
    return apiConfig.httpClient.post<InvoiceCounter>(
      `${storeRecordPath(params.store_id, "invoice-counters", params.invoice_counter_id)}/confirm`,
      { expected_updated_at: params.expected_updated_at, next_number: params.next_number },
      options,
    );
  },
});
