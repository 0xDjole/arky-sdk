import { requireStoreId } from "../utils/storeTarget";
import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  Note,
  FindOrderNotesParams,
  CreateOrderNoteParams,
  UpdateOrderNoteParams,
  DeleteOrderNoteParams,
  FindCustomerNotesParams,
  CreateCustomerNoteParams,
  UpdateCustomerNoteParams,
  DeleteCustomerNoteParams,
  FindCompanyNotesParams,
  CreateCompanyNoteParams,
  UpdateCompanyNoteParams,
  DeleteCompanyNoteParams,
} from "../types/note";
import type { EpochMilliseconds } from "../types/time";

export interface RecordNoteApi<FindParams, CreateParams, UpdateParams, DeleteParams> {
  find(params: FindParams, options?: RequestOptions): Promise<PaginatedResponse<Note>>;
  create(params: CreateParams, options?: RequestOptions): Promise<Note>;
  update(params: UpdateParams, options?: RequestOptions): Promise<Note>;
  delete(params: DeleteParams, options?: RequestOptions): Promise<Note>;
}

function recordNotes<Target extends { store_id: string }>(
  apiConfig: ApiConfig,
  notesPath: (target: Target) => string,
) {
  return {
    find(
      params: Target & { limit?: number; cursor?: string },
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Note>> {
      return apiConfig.httpClient.get<PaginatedResponse<Note>>(notesPath(params), {
        ...options,
        params: { limit: params.limit, cursor: params.cursor },
      });
    },
    create(params: Target & { id: string; body: string }, options?: RequestOptions): Promise<Note> {
      return apiConfig.httpClient.post<Note>(
        notesPath(params),
        { id: params.id, body: params.body },
        options,
      );
    },
    update(
      params: Target & { id: string; expected_updated_at: EpochMilliseconds; body: string },
      options?: RequestOptions,
    ): Promise<Note> {
      return apiConfig.httpClient.put<Note>(
        `${notesPath(params)}/${encodeURIComponent(params.id)}`,
        { expected_updated_at: params.expected_updated_at, body: params.body },
        options,
      );
    },
    delete(
      params: Target & { id: string; expected_updated_at: EpochMilliseconds },
      options?: RequestOptions,
    ): Promise<Note> {
      return apiConfig.httpClient.delete<Note>(
        `${notesPath(params)}/${encodeURIComponent(params.id)}`,
        { ...options, params: { expected_updated_at: params.expected_updated_at } },
      );
    },
  };
}

export const createOrderNoteApi = (
  apiConfig: ApiConfig,
): RecordNoteApi<FindOrderNotesParams, CreateOrderNoteParams, UpdateOrderNoteParams, DeleteOrderNoteParams> =>
  recordNotes<{ store_id: string; order_id: string }>(
    apiConfig,
    ({ store_id, order_id }) =>
      `/v1/stores/${requireStoreId(store_id)}/orders/${encodeURIComponent(order_id)}/notes`,
  );

export const createCustomerNoteApi = (
  apiConfig: ApiConfig,
): RecordNoteApi<FindCustomerNotesParams, CreateCustomerNoteParams, UpdateCustomerNoteParams, DeleteCustomerNoteParams> =>
  recordNotes<{ store_id: string; customer_id: string }>(
    apiConfig,
    ({ store_id, customer_id }) =>
      `/v1/stores/${requireStoreId(store_id)}/customers/${encodeURIComponent(customer_id)}/notes`,
  );

export const createCompanyNoteApi = (
  apiConfig: ApiConfig,
): RecordNoteApi<FindCompanyNotesParams, CreateCompanyNoteParams, UpdateCompanyNoteParams, DeleteCompanyNoteParams> =>
  recordNotes<{ store_id: string; company_id: string }>(
    apiConfig,
    ({ store_id, company_id }) =>
      `/v1/stores/${requireStoreId(store_id)}/companies/${encodeURIComponent(company_id)}/notes`,
  );
