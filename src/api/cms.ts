import type { ApiConfig } from "../index";
import type {
  CreateNodeParams,
  UpdateNodeParams,
  DeleteNodeParams,
  GetNodeParams,
  GetNodesParams,
  GetNodeChildrenParams,
  GenerateBlocksParams,
  GetVariableMetadataParams,
  RequestOptions,
} from "../types/api";
import { formatIdOrSlug } from "../utils/slug";
import {
  getBlockFromArray,
  getBlockObjectValues,
  getImageUrl,
} from "../utils/blocks";

export const createCmsApi = (apiConfig: ApiConfig) => {
  return {
    async createNode(params: CreateNodeParams, options?: RequestOptions) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/nodes`,
        params,
        options
      );
    },

    async updateNode(params: UpdateNodeParams, options?: RequestOptions) {
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/nodes/${params.id}`,
        params,
        options
      );
    },

    async deleteNode(params: DeleteNodeParams, options?: RequestOptions) {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/nodes/${params.id}`,
        options
      );
    },

    async getNode(params: GetNodeParams, options?: RequestOptions) {
      const formattedId = formatIdOrSlug(params.id, apiConfig);
      const response = await apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/nodes/${formattedId}`,
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
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/nodes`,
        {
          ...options,
          params,
        }
      );
    },

    async getNodeChildren(params: GetNodeChildrenParams, options?: RequestOptions) {
      const { id, ...queryParams } = params;
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/nodes/${id}/children`,
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

    async getVariableMetadata(params: GetVariableMetadataParams, options?: RequestOptions) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/nodes/types/${params.nodeType}/variables`,
        options
      );
    },

    /**
     * Send a node to all subscribers (schedule or immediate)
     * @param params.entryId - The node ID to send
     * @param params.subject - Email subject for this send
     * @param params.scheduledAt - Optional unix timestamp to schedule the send
     */
    async sendNode(params: { entryId: string; subject: string; scheduledAt?: number }, options?: RequestOptions) {
      const { entryId, ...body } = params;
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/nodes/${entryId}/send`,
        body,
        options
      );
    },

    /**
     * Cancel a scheduled send
     */
    async cancelSend(params: { nodeId: string; sendId: string }, options?: RequestOptions) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/nodes/${params.nodeId}/send/${params.sendId}/cancel`,
        {},
        options
      );
    },

    /**
     * Get subscribers for a node
     */
    async getSubscribers(params: { nodeId: string }, options?: RequestOptions) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/nodes/${params.nodeId}/subscribers`,
        options
      );
    },
  };
};
