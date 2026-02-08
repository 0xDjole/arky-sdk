import type { ApiConfig } from "../index";
import type {
  CreateNodeParams,
  UpdateNodeParams,
  DeleteNodeParams,
  GetNodeParams,
  GetNodesParams,
  GetNodeChildrenParams,
  GenerateBlocksParams,
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
      const { businessId, ...payload } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${targetBusinessId}/nodes`,
        payload,
        options
      );
    },

    async updateNode(params: UpdateNodeParams, options?: RequestOptions) {
      const { businessId, ...payload } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${targetBusinessId}/nodes/${params.id}`,
        payload,
        options
      );
    },

    async deleteNode(params: DeleteNodeParams, options?: RequestOptions) {
      const targetBusinessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${targetBusinessId}/nodes/${params.id}`,
        options
      );
    },

    async getNode(params: GetNodeParams, options?: RequestOptions) {
      const targetBusinessId = params.businessId || apiConfig.businessId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${targetBusinessId}:${apiConfig.locale}:${params.slug}`;
      } else if (params.key) {
        identifier = `${targetBusinessId}:${params.key}`;
      } else {
        throw new Error("GetNodeParams requires id, slug, or key");
      }

      const response = await apiConfig.httpClient.get(
        `/v1/businesses/${targetBusinessId}/nodes/${identifier}`,
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
      const { businessId, ...queryParams } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${targetBusinessId}/nodes`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async getNodeChildren(params: GetNodeChildrenParams, options?: RequestOptions) {
      const { id, businessId, ...queryParams } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${targetBusinessId}/nodes/${id}/children`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async generateBlocks(params: GenerateBlocksParams, options?: RequestOptions) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/nodes/blocks/generate`,
        params,
        options
      );
    },

  };
};
