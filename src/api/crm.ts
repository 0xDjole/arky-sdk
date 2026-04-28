import type { ApiConfig } from "../index";
import type {
  RequestOptions,
  CreateCustomerParams,
  UpdateCustomerParams,
  GetCustomerParams,
  FindCustomersParams,
  MergeCustomersParams,
  Customer,
  CreateAudienceParams,
  UpdateAudienceParams,
  GetAudienceParams,
  GetAudiencesParams,
  GetAudienceSubscribersParams,
  RemoveAudienceSubscriberParams,
  AddAudienceSubscriberParams,
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

    async merge(params: MergeCustomersParams, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.post<Customer>(
        `/v1/businesses/${businessId}/customers/${params.targetId}/merge`,
        { sourceId: params.sourceId, businessId },
        options
      );
    },

    async revokeToken(params: { id: string; tokenId: string; businessId?: string }, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${businessId}/customers/${params.id}/sessions/${params.tokenId}`,
        options
      );
    },

    async revokeAllTokens(params: { id: string; businessId?: string }, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${businessId}/customers/${params.id}/sessions`,
        options
      );
    },

    
    audiences: {
      async create(params: CreateAudienceParams, options?: RequestOptions) {
        return apiConfig.httpClient.post(
          `/v1/businesses/${apiConfig.businessId}/audiences`,
          params,
          options,
        );
      },

      async update(params: UpdateAudienceParams, options?: RequestOptions) {
        return apiConfig.httpClient.put(
          `/v1/businesses/${apiConfig.businessId}/audiences/${params.id}`,
          params,
          options,
        );
      },

      async get(params: GetAudienceParams, options?: RequestOptions) {
        let identifier: string;
        if (params.id) {
          identifier = params.id;
        } else if (params.key) {
          identifier = `${apiConfig.businessId}:${params.key}`;
        } else {
          throw new Error("GetAudienceParams requires id or key");
        }
        return apiConfig.httpClient.get(
          `/v1/businesses/${apiConfig.businessId}/audiences/${identifier}`,
          options,
        );
      },

      async find(params: GetAudiencesParams, options?: RequestOptions) {
        return apiConfig.httpClient.get(
          `/v1/businesses/${apiConfig.businessId}/audiences`,
          { ...options, params },
        );
      },

      async getSubscribers(params: GetAudienceSubscribersParams, options?: RequestOptions) {
        return apiConfig.httpClient.get(
          `/v1/businesses/${apiConfig.businessId}/audiences/${params.id}/subscribers`,
          {
            ...options,
            params: { limit: params.limit, cursor: params.cursor },
          },
        );
      },

      async addSubscriber(params: AddAudienceSubscriberParams, options?: RequestOptions) {
        return apiConfig.httpClient.post(
          `/v1/businesses/${apiConfig.businessId}/audiences/${params.id}/subscribers`,
          { customerId: params.customerId },
          options,
        );
      },

      async removeSubscriber(params: RemoveAudienceSubscriberParams, options?: RequestOptions) {
        return apiConfig.httpClient.delete(
          `/v1/businesses/${apiConfig.businessId}/audiences/${params.id}/subscribers/${params.customerId}`,
          options,
        );
      },
    },
  };
};
