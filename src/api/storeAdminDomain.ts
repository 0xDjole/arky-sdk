import type { ApiConfig } from '../services/clientTypes';
import type { PaginatedResponse } from '../types';
import type { RequestOptions } from '../types/api';
import type { StoreBrandingPresentation } from '../types/storeBranding';
import type {
  StoreAdminDomain, StoreAdminDomainConnection, AdminDomainOperation,
  GetStoreAdminDomainParams, FindStoreAdminDomainsParams, CreateStoreAdminDomainParams,
  ChangeStoreAdminDomainParams, RequestAdminDomainHostingParams, RetryAdminDomainHostingParams,
} from '../types/storeAdminDomain';

export const createStoreAdminDomainApi = (config: ApiConfig) => {
  const base = (storeId?: string) => `/v1/stores/${encodeURIComponent(storeId ?? config.storeId)}/admin-domains`;
  const change = (action: 'verify' | 'restart' | 'disable', params: ChangeStoreAdminDomainParams, options?: RequestOptions): Promise<StoreAdminDomain> => {
    const { store_id, id, ...body } = params;
    return config.httpClient.post<StoreAdminDomain>(`${base(store_id)}/${encodeURIComponent(id)}/${action}`, body, options);
  };
  const hosting = (action: 'register' | 'remove' | 'retry', params: RequestAdminDomainHostingParams | RetryAdminDomainHostingParams, options?: RequestOptions): Promise<AdminDomainOperation> => {
    const { store_id, id, ...body } = params;
    return config.httpClient.post<AdminDomainOperation>(`${base(store_id)}/${encodeURIComponent(id)}/hosting/${action}`, body, options);
  };
  return {
    resolve(hostname: string, options?: RequestOptions): Promise<StoreBrandingPresentation> {
      return config.httpClient.get<StoreBrandingPresentation>(`/v1/admin-domains/${encodeURIComponent(hostname)}`, options);
    },
    find(params: FindStoreAdminDomainsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StoreAdminDomain>> {
      const { store_id, ...query } = params;
      return config.httpClient.get<PaginatedResponse<StoreAdminDomain>>(base(store_id), { ...options, params: query });
    },
    get(params: GetStoreAdminDomainParams, options?: RequestOptions): Promise<StoreAdminDomainConnection> {
      return config.httpClient.get<StoreAdminDomainConnection>(`${base(params.store_id)}/${encodeURIComponent(params.id)}`, options);
    },
    create(params: CreateStoreAdminDomainParams, options?: RequestOptions): Promise<StoreAdminDomain> {
      const { store_id, ...body } = params;
      return config.httpClient.post<StoreAdminDomain>(base(store_id), body, options);
    },
    verify(params: ChangeStoreAdminDomainParams, options?: RequestOptions): Promise<StoreAdminDomain> { return change('verify', params, options); },
    restart(params: ChangeStoreAdminDomainParams, options?: RequestOptions): Promise<StoreAdminDomain> { return change('restart', params, options); },
    disable(params: ChangeStoreAdminDomainParams, options?: RequestOptions): Promise<StoreAdminDomain> { return change('disable', params, options); },
    remove(params: ChangeStoreAdminDomainParams, options?: RequestOptions): Promise<void> {
      const { store_id, id, ...body } = params;
      return config.httpClient.delete<void>(`${base(store_id)}/${encodeURIComponent(id)}`, { ...options, params: body });
    },
    registerHosting(params: RequestAdminDomainHostingParams, options?: RequestOptions): Promise<AdminDomainOperation> { return hosting('register', params, options); },
    removeHosting(params: RequestAdminDomainHostingParams, options?: RequestOptions): Promise<AdminDomainOperation> { return hosting('remove', params, options); },
    retryHosting(params: RetryAdminDomainHostingParams, options?: RequestOptions): Promise<AdminDomainOperation> { return hosting('retry', params, options); },
  };
};
