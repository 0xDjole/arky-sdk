import type { ApiConfig } from "../index";
import type {
  CreateAudienceParams,
  UpdateAudienceParams,
  GetAudienceParams,
  GetAudiencesParams,
  SubscribeAudienceParams,
  GetAudienceSubscribersParams,
  RemoveAudienceSubscriberParams,
  AddAudienceSubscriberParams,
  RequestOptions,
} from "../types/api";

export const createAudienceApi = (apiConfig: ApiConfig) => {
  return {
    async createAudience(params: CreateAudienceParams, options?: RequestOptions) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/audiences`,
        params,
        options,
      );
    },

    async updateAudience(params: UpdateAudienceParams, options?: RequestOptions) {
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/audiences/${params.id}`,
        params,
        options,
      );
    },

    async deleteAudience(params: { id: string }, options?: RequestOptions) {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/audiences/${params.id}`,
        options,
      );
    },

    async getAudience(params: GetAudienceParams, options?: RequestOptions) {
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

    async getAudiences(params: GetAudiencesParams, options?: RequestOptions) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/audiences`,
        { ...options, params },
      );
    },

    async subscribe(params: SubscribeAudienceParams, options?: RequestOptions) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/audiences/${params.id}/subscribe`,
        {
          priceId: params.priceId,
          successUrl: params.successUrl,
          cancelUrl: params.cancelUrl,
        },
        options,
      );
    },

    async checkAccess(params: { id: string }, options?: RequestOptions) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/audiences/${params.id}/access`,
        options,
      );
    },

    async getSubscribers(params: GetAudienceSubscribersParams, options?: RequestOptions) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/audiences/${params.id}/subscribers`,
        {
          ...options,
          params: {
            limit: params.limit,
            cursor: params.cursor,
          },
        },
      );
    },

    async addSubscriber(params: AddAudienceSubscriberParams, options?: RequestOptions) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/audiences/${params.id}/subscribers`,
        { email: params.email },
        options,
      );
    },

    async removeSubscriber(params: RemoveAudienceSubscriberParams, options?: RequestOptions) {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/audiences/${params.id}/subscribers/${params.accountId}`,
        options,
      );
    },
  };
};
