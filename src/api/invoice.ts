import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type { Tenant } from "../types/tenant";
import type {
  AttachOutsideInvoiceParams,
  ConfirmInvoiceCounterParams,
  CreateOutsideCreditNoteParams,
  CreateTenantSellerParams,
  DeleteOutsideCreditNoteParams,
  DeleteTenantSellerParams,
  DetachOutsideInvoiceParams,
  FindInvoiceCountersParams,
  FindInvoicesParams,
  FindUnissuedInvoicesParams,
  UnissuedInvoice,
  GetInvoiceParams,
  GetTenantSellerParams,
  Invoice,
  InvoiceCounter,
  IssueInvoiceParams,
  ReissuedInvoice,
  ReissueInvoiceParams,
  SetTenantInvoicingParams,
  TenantSeller,
  UpdateTenantSellerParams,
} from "../types/invoice";
import { requireId } from "../utils/ids";
import { tenantPath, tenantRecordPath } from "./paths";

const collection = "invoices";

export const createInvoiceApi = (apiConfig: ApiConfig) => {
  const invoicePath = (tenantId: string, invoiceId: string) => tenantRecordPath(tenantId, collection, invoiceId);

  return {
    find(params: FindInvoicesParams, options?: RequestOptions): Promise<PaginatedResponse<Invoice>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Invoice>>(tenantPath(tenant_id, collection), {
        ...options,
        params: query,
      });
    },

    findUnissued(params: FindUnissuedInvoicesParams, options?: RequestOptions): Promise<PaginatedResponse<UnissuedInvoice>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<UnissuedInvoice>>(`${tenantPath(tenant_id, collection)}/unissued`, {
        ...options,
        params: query,
      });
    },

    get(params: GetInvoiceParams, options?: RequestOptions): Promise<Invoice> {
      return apiConfig.httpClient.get<Invoice>(invoicePath(params.tenant_id, params.invoice_id), options);
    },

    issue(params: IssueInvoiceParams, options?: RequestOptions): Promise<Invoice> {
      return apiConfig.httpClient.post<Invoice>(
        tenantPath(params.tenant_id, collection),
        { order_id: params.order_id, buyer: params.buyer, memo: params.memo },
        options,
      );
    },

    reissue(params: ReissueInvoiceParams, options?: RequestOptions): Promise<ReissuedInvoice> {
      requireId(params.reversal_id, "reversal");
      requireId(params.new_invoice_id, "invoice");
      return apiConfig.httpClient.post<ReissuedInvoice>(
        `${invoicePath(params.tenant_id, params.invoice_id)}/reissue`,
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
        `${tenantPath(params.tenant_id, collection)}/outside`,
        { order_id: params.order_id, number: params.number, document: params.document },
        options,
      );
    },

    detachOutside(params: DetachOutsideInvoiceParams, options?: RequestOptions): Promise<Invoice | null> {
      return apiConfig.httpClient.post<Invoice | null>(
        `${invoicePath(params.tenant_id, params.invoice_id)}/detach`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    createOutsideCreditNote(params: CreateOutsideCreditNoteParams, options?: RequestOptions): Promise<Invoice> {
      requireId(params.id, "credit note");
      return apiConfig.httpClient.post<Invoice>(
        `${invoicePath(params.tenant_id, params.invoice_id)}/credit-notes`,
        { id: params.id, order_credit_id: params.order_credit_id, number: params.number, document: params.document },
        options,
      );
    },

    deleteOutsideCreditNote(params: DeleteOutsideCreditNoteParams, options?: RequestOptions): Promise<DeletedResponse> {
      return apiConfig.httpClient.delete<DeletedResponse>(invoicePath(params.tenant_id, params.invoice_id), {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },
  };
};

export const createTenantSellerApi = (apiConfig: ApiConfig) => ({
  get(params: GetTenantSellerParams, options?: RequestOptions): Promise<TenantSeller> {
    return apiConfig.httpClient.get<TenantSeller>(tenantPath(params.tenant_id, "seller"), options);
  },

  create(params: CreateTenantSellerParams, options?: RequestOptions): Promise<TenantSeller> {
    requireId(params.id, "seller");
    return apiConfig.httpClient.post<TenantSeller>(
      tenantPath(params.tenant_id, "seller"),
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

  update(params: UpdateTenantSellerParams, options?: RequestOptions): Promise<TenantSeller> {
    return apiConfig.httpClient.put<TenantSeller>(
      tenantPath(params.tenant_id, "seller"),
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

  delete(params: DeleteTenantSellerParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(tenantPath(params.tenant_id, "seller"), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createTenantInvoicingApi = (apiConfig: ApiConfig) => ({
  set(params: SetTenantInvoicingParams, options?: RequestOptions): Promise<Tenant> {
    return apiConfig.httpClient.put<Tenant>(
      tenantPath(params.tenant_id, "invoicing"),
      { expected_updated_at: params.expected_updated_at, invoicing: params.invoicing },
      options,
    );
  },
});

export const createInvoiceCounterApi = (apiConfig: ApiConfig) => ({
  find(params: FindInvoiceCountersParams, options?: RequestOptions): Promise<PaginatedResponse<InvoiceCounter>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<InvoiceCounter>>(tenantPath(tenant_id, "invoice-counters"), {
      ...options,
      params: query,
    });
  },

  confirm(params: ConfirmInvoiceCounterParams, options?: RequestOptions): Promise<InvoiceCounter> {
    return apiConfig.httpClient.post<InvoiceCounter>(
      `${tenantRecordPath(params.tenant_id, "invoice-counters", params.invoice_counter_id)}/confirm`,
      { expected_updated_at: params.expected_updated_at, next_number: params.next_number },
      options,
    );
  },
});
