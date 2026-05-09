import type { ApiConfig } from "../index";
import type {
  CreateProviderParams,
  CreateServiceParams,
  CreateServiceProviderParams,
  DeleteProviderParams,
  DeleteServiceParams,
  DeleteServiceProviderParams,
  FindServiceProvidersParams,
  GetProviderParams,
  GetProvidersParams,
  GetServiceParams,
  GetServicesParams,
  RequestOptions,
  UpdateProviderParams,
  UpdateServiceParams,
  UpdateServiceProviderParams,
} from "../types/api";
import type {
  PaginatedResponse,
  Provider,
  Service,
  ServiceProvider,
} from "../types";

const normalizeTaxonomyAliases = <T extends { taxonomies?: unknown; filters?: unknown }>(
  payload: T,
) => {
  const { filters, ...rest } = payload;
  return {
    ...rest,
    ...(!rest.taxonomies && filters ? { taxonomies: filters } : {}),
  };
};

export const createSchedulingApi = (apiConfig: ApiConfig) => {
  return {
    async createService(
      params: CreateServiceParams,
      options?: RequestOptions,
    ): Promise<Service> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Service>(
        `/v1/stores/${target_store_id}/services`,
        normalizeTaxonomyAliases(payload),
        options,
      );
    },

    async updateService(
      params: UpdateServiceParams,
      options?: RequestOptions,
    ): Promise<Service> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Service>(
        `/v1/stores/${target_store_id}/services/${params.id}`,
        normalizeTaxonomyAliases(payload),
        options,
      );
    },

    async deleteService(
      params: DeleteServiceParams,
      options?: RequestOptions,
    ): Promise<void> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<void>(
        `/v1/stores/${target_store_id}/services/${params.id}`,
        options,
      );
    },

    async getService(
      params: GetServiceParams,
      options?: RequestOptions,
    ): Promise<Service> {
      const store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${store_id}:${apiConfig.locale}:${params.slug}`;
      } else {
        throw new Error("GetServiceParams requires id or slug");
      }

      return apiConfig.httpClient.get<Service>(
        `/v1/stores/${store_id}/services/${identifier}`,
        options,
      );
    },

    async getServices(
      params: GetServicesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Service>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Service>>(
        `/v1/stores/${target_store_id}/services`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async createProvider(
      params: CreateProviderParams,
      options?: RequestOptions,
    ): Promise<Provider> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Provider>(
        `/v1/stores/${target_store_id}/providers`,
        normalizeTaxonomyAliases(payload),
        options,
      );
    },

    async updateProvider(
      params: UpdateProviderParams,
      options?: RequestOptions,
    ): Promise<Provider> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Provider>(
        `/v1/stores/${target_store_id}/providers/${params.id}`,
        normalizeTaxonomyAliases(payload),
        options,
      );
    },

    async deleteProvider(
      params: DeleteProviderParams,
      options?: RequestOptions,
    ): Promise<void> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<void>(
        `/v1/stores/${target_store_id}/providers/${params.id}`,
        options,
      );
    },

    async getProvider(
      params: GetProviderParams,
      options?: RequestOptions,
    ): Promise<Provider> {
      const store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${store_id}:${apiConfig.locale}:${params.slug}`;
      } else {
        throw new Error("GetProviderParams requires id or slug");
      }

      return apiConfig.httpClient.get<Provider>(
        `/v1/stores/${store_id}/providers/${identifier}`,
        options,
      );
    },

    async getProviders(
      params: GetProvidersParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Provider>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Provider>>(
        `/v1/stores/${target_store_id}/providers`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async findServiceProviders(
      params: FindServiceProvidersParams,
      options?: RequestOptions,
    ): Promise<ServiceProvider[]> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<ServiceProvider[]>(
        `/v1/stores/${target_store_id}/service-providers`,
        { ...options, params: queryParams },
      );
    },

    async createServiceProvider(
      params: CreateServiceProviderParams,
      options?: RequestOptions,
    ): Promise<ServiceProvider> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<ServiceProvider>(
        `/v1/stores/${target_store_id}/service-providers`,
        payload,
        options,
      );
    },

    async updateServiceProvider(
      params: UpdateServiceProviderParams,
      options?: RequestOptions,
    ): Promise<ServiceProvider> {
      const { store_id, id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<ServiceProvider>(
        `/v1/stores/${target_store_id}/service-providers/${id}`,
        payload,
        options,
      );
    },

    async deleteServiceProvider(
      params: DeleteServiceProviderParams,
      options?: RequestOptions,
    ): Promise<void> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<void>(
        `/v1/stores/${target_store_id}/service-providers/${params.id}`,
        options,
      );
    },
  };
};
