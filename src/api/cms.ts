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
import type { Node, PaginatedResponse } from "../types";
import {
  getBlockFromArray,
  getBlockObjectValues,
  getImageUrl,
} from "../utils/blocks";

export const createCmsApi = (apiConfig: ApiConfig) => {
  return {
    async createNode(params: CreateNodeParams, options?: RequestOptions): Promise<Node> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Node>(
        `/v1/stores/${target_store_id}/nodes`,
        payload,
        options
      );
    },

    async updateNode(params: UpdateNodeParams, options?: RequestOptions): Promise<Node> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Node>(
        `/v1/stores/${target_store_id}/nodes/${params.id}`,
        payload,
        options
      );
    },

    async deleteNode(params: DeleteNodeParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
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

      const response = await apiConfig.httpClient.get<Node>(
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

    async getNodes(params: GetNodesParams, options?: RequestOptions): Promise<PaginatedResponse<Node>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Node>>(
        `/v1/stores/${target_store_id}/nodes`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async getNodeChildren(params: GetNodeChildrenParams, options?: RequestOptions): Promise<PaginatedResponse<Node>> {
      const { id, store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Node>>(
        `/v1/stores/${target_store_id}/nodes/${id}/children`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

  };
};
