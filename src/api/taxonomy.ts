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
import type { Taxonomy, PaginatedResponse } from "../types";

export const createTaxonomyApi = (apiConfig: ApiConfig) => {
  return {
    async createTaxonomy(params: CreateTaxonomyParams, options?: RequestOptions): Promise<Taxonomy> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Taxonomy>(
        `/v1/stores/${target_store_id}/taxonomies`,
        payload,
        options
      );
    },

    async updateTaxonomy(params: UpdateTaxonomyParams, options?: RequestOptions): Promise<Taxonomy> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Taxonomy>(
        `/v1/stores/${target_store_id}/taxonomies/${params.id}`,
        payload,
        options
      );
    },

    async deleteTaxonomy(params: DeleteTaxonomyParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${target_store_id}/taxonomies/${params.id}`,
        options
      );
    },

    async getTaxonomy(params: GetTaxonomyParams, options?: RequestOptions): Promise<Taxonomy> {
      const target_store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.key) {
        identifier = `${target_store_id}:${params.key}`;
      } else {
        throw new Error("GetTaxonomyParams requires id or key");
      }

      return apiConfig.httpClient.get<Taxonomy>(
        `/v1/stores/${target_store_id}/taxonomies/${identifier}`,
        options
      );
    },

    async getTaxonomies(params: GetTaxonomiesParams, options?: RequestOptions): Promise<PaginatedResponse<Taxonomy>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Taxonomy>>(
        `/v1/stores/${target_store_id}/taxonomies`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async getTaxonomyChildren(params: GetTaxonomyChildrenParams, options?: RequestOptions): Promise<PaginatedResponse<Taxonomy>> {
      const { id, store_id } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Taxonomy>>(
        `/v1/stores/${target_store_id}/taxonomies/${id}/children`,
        options
      );
    },
  };
};
