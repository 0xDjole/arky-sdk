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
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post(
        `/v1/stores/${target_store_id}/nodes`,
        payload,
        options
      );
    },

    async updateNode(params: UpdateNodeParams, options?: RequestOptions) {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put(
        `/v1/stores/${target_store_id}/nodes/${params.id}`,
        payload,
        options
      );
    },

    async deleteNode(params: DeleteNodeParams, options?: RequestOptions) {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete(
        `/v1/stores/${target_store_id}/nodes/${params.id}`,
        options
      );
    },

    async getNode(params: GetNodeParams, options?: RequestOptions) {
      const target_store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${target_store_id}:${apiConfig.locale}:${params.slug}`;
      } else if (params.key) {
        identifier = `${target_store_id}:${params.key}`;
      } else {
        throw new Error("GetNodeParams requires id, slug, or key");
      }

      const response = await apiConfig.httpClient.get(
        `/v1/stores/${target_store_id}/nodes/${identifier}`,
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
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get(
        `/v1/stores/${target_store_id}/nodes`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async getNodeChildren(params: GetNodeChildrenParams, options?: RequestOptions) {
      const { id, store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get(
        `/v1/stores/${target_store_id}/nodes/${id}/children`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

  };
};
