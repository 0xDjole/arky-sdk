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
      const { businessId, ...payload } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${targetBusinessId}/taxonomies`,
        payload,
        options
      );
    },

    async updateTaxonomy(params: UpdateTaxonomyParams, options?: RequestOptions) {
      const { businessId, ...payload } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${targetBusinessId}/taxonomies/${params.id}`,
        payload,
        options
      );
    },

    async deleteTaxonomy(params: DeleteTaxonomyParams, options?: RequestOptions) {
      const targetBusinessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${targetBusinessId}/taxonomies/${params.id}`,
        options
      );
    },

    async getTaxonomy(params: GetTaxonomyParams, options?: RequestOptions) {
      const targetBusinessId = params.businessId || apiConfig.businessId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.key) {
        identifier = `${targetBusinessId}:${params.key}`;
      } else {
        throw new Error("GetTaxonomyParams requires id or key");
      }

      return apiConfig.httpClient.get(
        `/v1/businesses/${targetBusinessId}/taxonomies/${identifier}`,
        options
      );
    },

    async getTaxonomies(params: GetTaxonomiesParams, options?: RequestOptions) {
      const { businessId, ...queryParams } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${targetBusinessId}/taxonomies`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async getTaxonomyChildren(params: GetTaxonomyChildrenParams, options?: RequestOptions) {
      const { id, businessId } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${targetBusinessId}/taxonomies/${id}/children`,
        options
      );
    },
  };
};
