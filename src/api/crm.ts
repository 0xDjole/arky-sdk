import type { ApiConfig } from "../index";
import type {
  RequestOptions,
  CreateCustomerParams,
  UpdateCustomerParams,
  GetCustomerParams,
  FindCustomersParams,
  MergeCustomersParams,
  Customer,
  CustomerDetail,
  CreateAudienceParams,
  UpdateAudienceParams,
  GetAudienceParams,
  GetAudiencesParams,
  GetAudienceSubscribersParams,
  RemoveAudienceSubscriberParams,
  AddAudienceSubscriberParams,
  AddAudienceSubscriberResponse,
  AudienceSubscriber,
  FindActivitiesParams,
} from "../types/api";
import type { Audience, PaginatedResponse } from "../types";

export interface Activity {
  id: string;
  store_id: string;
  customer_id: string;
  type: string;
  payload: Record<string, unknown>;
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
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export const createActivityAdminApi = (apiConfig: ApiConfig) => ({
  async timeline(params: TimelineParams, options?: RequestOptions): Promise<{ items: Activity[]; cursor: string | null }> {
    const store_id = params.store_id || apiConfig.storeId;
    const queryParams: Record<string, unknown> = { customer_id: params.customer_id };
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;
    return apiConfig.httpClient.get<{ items: Activity[]; cursor: string | null }>(
      `/v1/stores/${store_id}/activities/timeline`,
      { ...options, params: queryParams },
    );
  },

  async find(params: FindActivitiesParams, options?: RequestOptions): Promise<{ items: Activity[]; cursor: string | null }> {
    const store_id = params.store_id || apiConfig.storeId;
    const queryParams: Record<string, unknown> = {};
    if (params.customer_id) queryParams.customer_id = params.customer_id;
    if (params.types && params.types.length > 0) queryParams.types = params.types;
    if (params.from !== undefined) queryParams.from = params.from;
    if (params.to !== undefined) queryParams.to = params.to;
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;
    return apiConfig.httpClient.get<{ items: Activity[]; cursor: string | null }>(
      `/v1/stores/${store_id}/activities`,
      { ...options, params: queryParams }
    );
  },
});

export const createCustomerApi = (apiConfig: ApiConfig) => {
  return {
    async create(params: CreateCustomerParams, options?: RequestOptions): Promise<Customer> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Customer>(
        `/v1/stores/${store_id || apiConfig.storeId}/customers`,
        payload,
        options
      );
    },

    async get(params: GetCustomerParams, options?: RequestOptions): Promise<CustomerDetail> {
      return apiConfig.httpClient.get<CustomerDetail>(
        `/v1/stores/${params.store_id || apiConfig.storeId}/customers/${params.id}`,
        options
      );
    },

    async find(params?: FindCustomersParams, options?: RequestOptions): Promise<{ items: Customer[]; cursor?: string }> {
      const store_id = params?.store_id || apiConfig.storeId;
      const queryParams: Record<string, unknown> = {};

      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.cursor) queryParams.cursor = params.cursor;
      if (params?.query) queryParams.query = params.query;
      if (params?.taxonomy_query) queryParams.taxonomy_query = params.taxonomy_query;
      if (params?.status) queryParams.status = params.status;
      if (params?.has_activity !== undefined) queryParams.has_activity = params.has_activity;
      if (params?.has_cart !== undefined) queryParams.has_cart = params.has_cart;
      if (params?.sort_field) queryParams.sort_field = params.sort_field;
      if (params?.sort_direction) queryParams.sort_direction = params.sort_direction;

      return apiConfig.httpClient.get<{ items: Customer[]; cursor?: string }>(
        `/v1/stores/${store_id}/customers`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async update(params: UpdateCustomerParams, options?: RequestOptions): Promise<Customer> {
      const { id, store_id, ...body } = params;
      return apiConfig.httpClient.put<Customer>(
        `/v1/stores/${store_id || apiConfig.storeId}/customers/${id}`,
        body,
        options
      );
    },

    async merge(params: MergeCustomersParams, options?: RequestOptions): Promise<Customer> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Customer>(
        `/v1/stores/${store_id}/customers/${params.target_id}/merge`,
        { source_id: params.source_id, store_id },
        options
      );
    },

    async revokeToken(params: { id: string; token_id: string; store_id?: string }, options?: RequestOptions): Promise<{ deleted: boolean }> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${store_id}/customers/${params.id}/sessions/${params.token_id}`,
        options
      );
    },

    async revokeAllTokens(params: { id: string; store_id?: string }, options?: RequestOptions): Promise<{ deleted: boolean }> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${store_id}/customers/${params.id}/sessions`,
        options
      );
    },


    audiences: {
      async create(params: CreateAudienceParams, options?: RequestOptions): Promise<Audience> {
        return apiConfig.httpClient.post<Audience>(
          `/v1/stores/${apiConfig.storeId}/audiences`,
          params,
          options,
        );
      },

      async update(params: UpdateAudienceParams, options?: RequestOptions): Promise<Audience> {
        return apiConfig.httpClient.put<Audience>(
          `/v1/stores/${apiConfig.storeId}/audiences/${params.id}`,
          params,
          options,
        );
      },

      async get(params: GetAudienceParams, options?: RequestOptions): Promise<Audience> {
        let identifier: string;
        if (params.id) {
          identifier = params.id;
        } else if (params.key) {
          identifier = `${apiConfig.storeId}:${params.key}`;
        } else {
          throw new Error("GetAudienceParams requires id or key");
        }
        return apiConfig.httpClient.get<Audience>(
          `/v1/stores/${apiConfig.storeId}/audiences/${identifier}`,
          options,
        );
      },

      async find(params: GetAudiencesParams, options?: RequestOptions): Promise<PaginatedResponse<Audience>> {
        return apiConfig.httpClient.get<PaginatedResponse<Audience>>(
          `/v1/stores/${apiConfig.storeId}/audiences`,
          { ...options, params },
        );
      },

      async getSubscribers(params: GetAudienceSubscribersParams, options?: RequestOptions): Promise<{ items: AudienceSubscriber[]; cursor?: string | null }> {
        return apiConfig.httpClient.get<{ items: AudienceSubscriber[]; cursor?: string | null }>(
          `/v1/stores/${apiConfig.storeId}/audiences/${params.id}/subscribers`,
          {
            ...options,
            params: { limit: params.limit, cursor: params.cursor },
          },
        );
      },

      async addSubscriber(params: AddAudienceSubscriberParams, options?: RequestOptions): Promise<AddAudienceSubscriberResponse> {
        return apiConfig.httpClient.post<AddAudienceSubscriberResponse>(
          `/v1/stores/${apiConfig.storeId}/audiences/${params.id}/subscribers`,
          { customer_id: params.customer_id },
          options,
        );
      },

      async removeSubscriber(params: RemoveAudienceSubscriberParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
        return apiConfig.httpClient.delete<{ deleted: boolean }>(
          `/v1/stores/${apiConfig.storeId}/audiences/${params.id}/subscribers/${params.customer_id}`,
          options,
        );
      },
    },

    activity: createActivityAdminApi(apiConfig),
  };
};
