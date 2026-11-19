import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  AddCustomerContactParams,
  CreateCustomerParams,
  Customer,
  CustomerExport,
  CustomerInvite,
  CustomerSearchSnapshot,
  CustomerSession,
  EraseCustomerParams,
  ExportCustomerParams,
  FindCustomerInvitesParams,
  InviteCustomerContactParams,
  MergeCustomerParams,
  RemoveCustomerContactParams,
  RemoveCustomerLinkParams,
  UpdateCustomerContactParams,
  FindCustomerSessionsParams,
  FindCustomersParams,
  GetCustomerParams,
  ImportCustomersParams,
  ImportCustomersPreviewResult,
  ImportCustomersResult,
  RevokeAllCustomerSessionsParams,
  RevokeCustomerSessionParams,
  UpdateCustomerParams,
} from "../types/customer";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

export const createCustomersApi = (apiConfig: ApiConfig) => {
  const customerPath = (storeId: string, id: string) => storeRecordPath(storeId, "customers", id);

  return {
    find(params: FindCustomersParams, options?: RequestOptions): Promise<PaginatedResponse<CustomerSearchSnapshot>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerSearchSnapshot>>(storePath(store_id, "customers"), {
        ...options,
        params: query,
      });
    },

    get(params: GetCustomerParams, options?: RequestOptions): Promise<Customer> {
      return apiConfig.httpClient.get<Customer>(customerPath(params.store_id, params.id), options);
    },

    create(params: CreateCustomerParams, options?: RequestOptions): Promise<Customer> {
      requireId(params.id, "customer");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<Customer>(storePath(store_id, "customers"), body, options);
    },

    update(params: UpdateCustomerParams, options?: RequestOptions): Promise<Customer> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.patch<Customer>(customerPath(store_id, id), body, options);
    },

    erase(params: EraseCustomerParams, options?: RequestOptions): Promise<Customer> {
      return apiConfig.httpClient.post<Customer>(
        `${customerPath(params.store_id, params.id)}/erase`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    export(params: ExportCustomerParams, options?: RequestOptions): Promise<CustomerExport> {
      return apiConfig.httpClient.get<CustomerExport>(`${customerPath(params.store_id, params.id)}/export`, options);
    },

    merge(params: MergeCustomerParams, options?: RequestOptions): Promise<Customer> {
      requireId(params.target_customer_id, "customer");
      return apiConfig.httpClient.post<Customer>(`${customerPath(params.store_id, params.id)}/merge`, {
        target_customer_id: params.target_customer_id, expected_updated_at: params.expected_updated_at,
      }, options);
    },

    addContact(params: AddCustomerContactParams, options?: RequestOptions): Promise<Customer> {
      return apiConfig.httpClient.post<Customer>(`${customerPath(params.store_id, params.customer_id)}/contacts`, {
        expected_updated_at: params.expected_updated_at,
        contact: params.contact,
        sms: params.sms ?? null,
      }, options);
    },

    updateContact(params: UpdateCustomerContactParams, options?: RequestOptions): Promise<Customer> {
      const { store_id, customer_id, ...body } = params;
      return apiConfig.httpClient.put<Customer>(`${customerPath(store_id, customer_id)}/contacts`, body, options);
    },

    removeContact(params: RemoveCustomerContactParams, options?: RequestOptions): Promise<Customer> {
      return apiConfig.httpClient.post<Customer>(
        `${customerPath(params.store_id, params.customer_id)}/contacts/remove`,
        { expected_updated_at: params.expected_updated_at, address: params.address },
        options,
      );
    },

    removeLink(params: RemoveCustomerLinkParams, options?: RequestOptions): Promise<Customer> {
      if (!Number.isInteger(params.position) || params.position < 0) {
        throw new TypeError("A link's position is its index in the customer's links list");
      }
      return apiConfig.httpClient.delete<Customer>(
        `${customerPath(params.store_id, params.customer_id)}/links/${params.position}`,
        { ...options, params: { expected_updated_at: params.expected_updated_at } },
      );
    },

    findInvites(params: FindCustomerInvitesParams, options?: RequestOptions): Promise<CustomerInvite[]> {
      return apiConfig.httpClient.get<CustomerInvite[]>(`${customerPath(params.store_id, params.customer_id)}/invites`, options);
    },

    inviteContact(params: InviteCustomerContactParams, options?: RequestOptions): Promise<CustomerInvite> {
      requireId(params.id, "customer invite");
      return apiConfig.httpClient.post<CustomerInvite>(
        `${customerPath(params.store_id, params.customer_id)}/invites`,
        { id: params.id, address: params.address },
        options,
      );
    },

    import(params: ImportCustomersParams, options?: RequestOptions): Promise<ImportCustomersResult> {
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<ImportCustomersResult>(storePath(store_id, "customers/import"), body, options);
    },

    previewImport(params: ImportCustomersParams, options?: RequestOptions): Promise<ImportCustomersPreviewResult> {
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<ImportCustomersPreviewResult>(
        storePath(store_id, "customers/import/preview"),
        body,
        options,
      );
    },

    findSessions(params: FindCustomerSessionsParams, options?: RequestOptions): Promise<PaginatedResponse<CustomerSession>> {
      const { store_id, customer_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerSession>>(`${customerPath(store_id, customer_id)}/sessions`, {
        ...options,
        params: query,
      });
    },

    revokeSession(params: RevokeCustomerSessionParams, options?: RequestOptions): Promise<{ success: boolean }> {
      return apiConfig.httpClient.post<{ success: boolean }>(
        `${customerPath(params.store_id, params.customer_id)}/sessions/${segment(params.session_id)}/revoke`,
        undefined,
        options,
      );
    },

    revokeAllSessions(params: RevokeAllCustomerSessionsParams, options?: RequestOptions): Promise<{ success: boolean }> {
      return apiConfig.httpClient.post<{ success: boolean }>(
        `${customerPath(params.store_id, params.customer_id)}/sessions/revoke`,
        undefined,
        options,
      );
    },
  };
};
