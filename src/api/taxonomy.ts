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
      const { business_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${target_business_id}/taxonomies`,
        payload,
        options
      );
    },

    async updateTaxonomy(params: UpdateTaxonomyParams, options?: RequestOptions) {
      const { business_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${target_business_id}/taxonomies/${params.id}`,
        payload,
        options
      );
    },

    async deleteTaxonomy(params: DeleteTaxonomyParams, options?: RequestOptions) {
      const target_business_id = params.business_id || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${target_business_id}/taxonomies/${params.id}`,
        options
      );
    },

    async getTaxonomy(params: GetTaxonomyParams, options?: RequestOptions) {
      const target_business_id = params.business_id || apiConfig.businessId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.key) {
        identifier = `${target_business_id}:${params.key}`;
      } else {
        throw new Error("GetTaxonomyParams requires id or key");
      }

      return apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/taxonomies/${identifier}`,
        options
      );
    },

    async getTaxonomies(params: GetTaxonomiesParams, options?: RequestOptions) {
      const { business_id, ...queryParams } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/taxonomies`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async getTaxonomyChildren(params: GetTaxonomyChildrenParams, options?: RequestOptions) {
      const { id, business_id } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/taxonomies/${id}/children`,
        options
      );
    },
  };
};
