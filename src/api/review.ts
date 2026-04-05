import type { ApiConfig } from "../index";
import type {
  RequestOptions,
  Review,
  CreateReviewParams,
  UpdateReviewParams,
  GetReviewParams,
  FindReviewsParams,
  DeleteReviewParams,
} from "../types/api";

export const createReviewApi = (apiConfig: ApiConfig) => {
  return {
    async create(params: CreateReviewParams, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.post<Review>(
        `/v1/businesses/${businessId}/reviews`,
        {
          businessId,
          target: params.target,
          ...(params.parentId && { parentId: params.parentId }),
          ...(params.rating !== undefined && { rating: params.rating }),
          ...(params.blocks && { blocks: params.blocks }),
          ...(params.customerId && { customerId: params.customerId }),
        },
        options
      );
    },

    async get(params: GetReviewParams, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.get<Review>(
        `/v1/businesses/${businessId}/reviews/${params.id}`,
        options
      );
    },

    async find(params?: FindReviewsParams, options?: RequestOptions) {
      const businessId = params?.businessId || apiConfig.businessId;
      const queryParams: Record<string, any> = {};

      if (params?.target) queryParams.target = JSON.stringify(params.target);
      if (params?.customerId) queryParams.customerId = params.customerId;
      if (params?.reviewType) queryParams.reviewType = params.reviewType;
      if (params?.status) queryParams.status = params.status;
      if (params?.query) queryParams.query = params.query;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.cursor) queryParams.cursor = params.cursor;
      if (params?.sortField) queryParams.sortField = params.sortField;
      if (params?.sortDirection) queryParams.sortDirection = params.sortDirection;

      return apiConfig.httpClient.get<{ items: Review[]; cursor?: string }>(
        `/v1/businesses/${businessId}/reviews`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async update(params: UpdateReviewParams, options?: RequestOptions) {
      const { id, businessId, ...body } = params;
      return apiConfig.httpClient.put<Review>(
        `/v1/businesses/${businessId || apiConfig.businessId}/reviews/${id}`,
        body,
        options
      );
    },

    async delete(params: DeleteReviewParams, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${businessId}/reviews/${params.id}`,
        options
      );
    },
  };
};
