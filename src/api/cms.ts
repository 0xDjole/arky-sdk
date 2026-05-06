import type { ApiConfig } from "../index";
import type {
  CreateNodeParams,
  UpdateNodeParams,
  DeleteNodeParams,
  GetNodeParams,
  GetNodesParams,
  GetNodeChildrenParams,
  RequestOptions,
} from "../types/api";
import {
  getBlockFromArray,
  getBlockObjectValues,
  getImageUrl,
} from "../utils/blocks";

export const createCmsApi = (apiConfig: ApiConfig) => {
  return {
    async createNode(params: CreateNodeParams, options?: RequestOptions) {
      const { business_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${target_business_id}/nodes`,
        payload,
        options
      );
    },

    async updateNode(params: UpdateNodeParams, options?: RequestOptions) {
      const { business_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${target_business_id}/nodes/${params.id}`,
        payload,
        options
      );
    },

    async deleteNode(params: DeleteNodeParams, options?: RequestOptions) {
      const target_business_id = params.business_id || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${target_business_id}/nodes/${params.id}`,
        options
      );
    },

    async getNode(params: GetNodeParams, options?: RequestOptions) {
      const target_business_id = params.business_id || apiConfig.businessId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${target_business_id}:${apiConfig.locale}:${params.slug}`;
      } else if (params.key) {
        identifier = `${target_business_id}:${params.key}`;
      } else {
        throw new Error("GetNodeParams requires id, slug, or key");
      }

      const response = await apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/nodes/${identifier}`,
        options
      );

      return {
        ...response,
        getBlock(key: string) {
          return getBlockFromArray(response, key, apiConfig.locale);
        },
        getBlockValues(key: string) {
          return getBlockObjectValues(response, key, apiConfig.locale);
        },
        getImage(key: string) {
          const block = getBlockFromArray(response, key, apiConfig.locale);
          return getImageUrl(block, true);
        },
      };
    },

    async getNodes(params: GetNodesParams, options?: RequestOptions) {
      const { business_id, ...queryParams } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/nodes`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async getNodeChildren(params: GetNodeChildrenParams, options?: RequestOptions) {
      const { id, business_id, ...queryParams } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/nodes/${id}/children`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

  };
};
