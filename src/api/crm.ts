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

export interface Activity {
  business_id: string;
  customer_id: string;
  type: string;
  payload: Record<string, any>;
  created_at: number;
  country_code?: string | null;
  city?: string | null;
  region?: string | null;
  timezone?: string | null;
  device_type?: string | null;
  browser?: string | null;
  os?: string | null;
  language?: string | null;
  session_idx?: number | null;
}

export interface TimelineParams {
  customer_id: string;
  businessId?: string;
  limit?: number;
  cursor?: string;
}

export const createActivityAdminApi = (apiConfig: ApiConfig) => ({
  async timeline(params: TimelineParams, options?: RequestOptions) {
    const businessId = params.businessId || apiConfig.businessId;
    const queryParams: Record<string, any> = { customer_id: params.customer_id };
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;
    return apiConfig.httpClient.get(
      `/v1/businesses/${businessId}/activities/timeline`,
      { ...options, params: queryParams },
    ) as Promise<{ items: Activity[]; cursor: string | null }>;
  },
});

export const createCustomerApi = (apiConfig: ApiConfig) => {
  return {
    async create(params: CreateCustomerParams, options?: RequestOptions): Promise<Customer> {
      return apiConfig.httpClient.post(
        `/v1/businesses/${params.businessId || apiConfig.businessId}/customers`,
        params,
        options
      );
    },

    async get(params: GetCustomerParams, options?: RequestOptions): Promise<Customer> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${params.businessId || apiConfig.businessId}/customers/${params.id}`,
        options
      );
    },

    async find(params?: FindCustomersParams, options?: RequestOptions): Promise<{ items: Customer[]; cursor?: string }> {
      const businessId = params?.businessId || apiConfig.businessId;
      const queryParams: Record<string, any> = {};

      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.cursor) queryParams.cursor = params.cursor;
      if (params?.query) queryParams.query = params.query;
      if (params?.sort_field) queryParams.sort_field = params.sort_field;
      if (params?.sort_direction) queryParams.sort_direction = params.sort_direction;

      return apiConfig.httpClient.get(
        `/v1/businesses/${businessId}/customers`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async update(params: UpdateCustomerParams, options?: RequestOptions): Promise<Customer> {
      const { id, businessId, ...body } = params;
      return apiConfig.httpClient.put(
        `/v1/businesses/${businessId || apiConfig.businessId}/customers/${id}`,
        body,
        options
      );
    },

    async merge(params: MergeCustomersParams, options?: RequestOptions): Promise<Customer> {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${businessId}/customers/${params.target_id}/merge`,
        { source_id: params.source_id, businessId },
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
          { customer_id: params.customer_id },
          options,
        );
      },

      async removeSubscriber(params: RemoveAudienceSubscriberParams, options?: RequestOptions) {
        return apiConfig.httpClient.delete(
          `/v1/businesses/${apiConfig.businessId}/audiences/${params.id}/subscribers/${params.customer_id}`,
          options,
        );
      },
    },

    activity: createActivityAdminApi(apiConfig),
  };
};
