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
  AuthToken,
} from "../types/api";

export const createCustomerApi = (apiConfig: ApiConfig) => {
  return {
    // Auth methods
    async requestCode(params: { email: string; businessId?: string }, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${businessId}/customers/auth/code`,
        { email: params.email },
        options
      );
    },

    async verify(params: { email: string; code: string; businessId?: string }, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${businessId}/customers/auth/verify`,
        { email: params.email, code: params.code },
        options
      );
    },

    async refreshToken(params: { refreshToken: string; businessId?: string }, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${businessId}/customers/auth/refresh`,
        { refreshToken: params.refreshToken },
        options
      );
    },

    async getMe(options?: RequestOptions) {
      return apiConfig.httpClient.get<Customer>(
        `/v1/businesses/${apiConfig.businessId}/customers/me`,
        options
      );
    },

    // CRUD methods
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

    async initialize(params?: { businessId?: string }, options?: RequestOptions) {
      const businessId = params?.businessId || apiConfig.businessId;
      return apiConfig.httpClient.post<AuthToken>(
        `/v1/businesses/${businessId}/customers/initialize`,
        { businessId },
        options
      );
    },

    async find(params?: FindCustomersParams, options?: RequestOptions) {
      const businessId = params?.businessId || apiConfig.businessId;
      const queryParams: Record<string, any> = {};

      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.cursor) queryParams.cursor = params.cursor;
      if (params?.query) queryParams.query = params.query;
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
