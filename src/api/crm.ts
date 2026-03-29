import type { ApiConfig } from "../index";
import type {
  RequestOptions,
  CreateCustomerParams,
  UpdateCustomerParams,
  GetCustomerParams,
  FindCustomersParams,
  DeleteCustomerParams,
  MergeCustomersParams,
  Customer,
} from "../types/api";

export const createCustomerApi = (apiConfig: ApiConfig) => {
  return {
    async create(params: CreateCustomerParams, options?: RequestOptions) {
      return apiConfig.httpClient.post<Customer>(
        `/v1/businesses/${params.businessId || apiConfig.businessId}/customers`,
        params,
        options
      );
    },

    async get(params: GetCustomerParams, options?: RequestOptions) {
      return apiConfig.httpClient.get<Customer>(
        `/v1/businesses/${params.businessId || apiConfig.businessId}/customers/${params.id}`,
        options
      );
    },

    async initialize(params: { email: string; businessId?: string }, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.post<Customer>(
        `/v1/businesses/${businessId}/customers/initialize`,
        { email: params.email },
        options
      );
    },

    async find(params?: FindCustomersParams, options?: RequestOptions) {
      const businessId = params?.businessId || apiConfig.businessId;
      const queryParams: Record<string, any> = {};

      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.cursor) queryParams.cursor = params.cursor;
      if (params?.query) queryParams.query = params.query;
      if (params?.tags) queryParams.tags = params.tags.join(",");
      if (params?.sortField) queryParams.sortField = params.sortField;
      if (params?.sortDirection) queryParams.sortDirection = params.sortDirection;

      return apiConfig.httpClient.get<{ items: Customer[]; cursor?: string }>(
        `/v1/businesses/${businessId}/customers`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async update(params: UpdateCustomerParams, options?: RequestOptions) {
      const { id, businessId, ...body } = params;
      return apiConfig.httpClient.put<Customer>(
        `/v1/businesses/${businessId || apiConfig.businessId}/customers/${id}`,
        body,
        options
      );
    },

    async delete(params: DeleteCustomerParams, options?: RequestOptions) {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${params.businessId || apiConfig.businessId}/customers/${params.id}`,
        options
      );
    },

    async merge(params: MergeCustomersParams, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.post<Customer>(
        `/v1/businesses/${businessId}/customers/${params.targetId}/merge`,
        { sourceId: params.sourceId, businessId },
        options
      );
    },
  };
};
