import type { ApiConfig } from "../index";
import type {
  CreateTaxonomyParams,
  UpdateTaxonomyParams,
  DeleteTaxonomyParams,
  GetTaxonomyParams,
  GetTaxonomiesParams,
  GetTaxonomyChildrenParams,
  RequestOptions,
} from "../types/api";

export const createTaxonomyApi = (apiConfig: ApiConfig) => {
  return {
    async createTaxonomy(params: CreateTaxonomyParams, options?: RequestOptions) {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post(
        `/v1/stores/${target_store_id}/taxonomies`,
        payload,
        options
      );
    },

    async updateTaxonomy(params: UpdateTaxonomyParams, options?: RequestOptions) {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put(
        `/v1/stores/${target_store_id}/taxonomies/${params.id}`,
        payload,
        options
      );
    },

    async deleteTaxonomy(params: DeleteTaxonomyParams, options?: RequestOptions) {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete(
        `/v1/stores/${target_store_id}/taxonomies/${params.id}`,
        options
      );
    },

    async getTaxonomy(params: GetTaxonomyParams, options?: RequestOptions) {
      const target_store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.key) {
        identifier = `${target_store_id}:${params.key}`;
      } else {
        throw new Error("GetTaxonomyParams requires id or key");
      }

      return apiConfig.httpClient.get(
        `/v1/stores/${target_store_id}/taxonomies/${identifier}`,
        options
      );
    },

    async getTaxonomies(params: GetTaxonomiesParams, options?: RequestOptions) {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get(
        `/v1/stores/${target_store_id}/taxonomies`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async getTaxonomyChildren(params: GetTaxonomyChildrenParams, options?: RequestOptions) {
      const { id, store_id } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get(
        `/v1/stores/${target_store_id}/taxonomies/${id}/children`,
        options
      );
    },
  };
};
