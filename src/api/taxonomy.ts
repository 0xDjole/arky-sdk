import type { ApiConfig } from "../index";
import type { TaxonomyScope, Taxonomy, Block, StatusEvent } from "../types";

export interface GetTaxonomiesParams {
  scope?: TaxonomyScope;
  parentId?: string;
  ids?: string[];
}

export interface GetTaxonomyParams {
  id: string;
}

export interface CreateTaxonomyParams {
  key: string;
  scope: TaxonomyScope;
  blocks?: Block[];
  parentId?: string;
}

export interface UpdateTaxonomyParams {
  id: string;
  key: string;
  scope: TaxonomyScope;
  blocks?: Block[];
  parentId?: string;
  hasChildren?: boolean;
  statuses: StatusEvent[];
}

export interface DeleteTaxonomyParams {
  id: string;
}

export interface GetTaxonomyChildrenParams {
  id: string;
}

export interface RequestOptions {
  headers?: Record<string, string>;
}

export const createTaxonomyApi = (apiConfig: ApiConfig) => {
  return {
    async getTaxonomies(params?: GetTaxonomiesParams, options?: RequestOptions): Promise<{ items: Taxonomy[]; cursor?: string }> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/taxonomies`,
        {
          ...options,
          params,
        }
      );
    },

    async getTaxonomy(params: GetTaxonomyParams, options?: RequestOptions): Promise<Taxonomy> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/taxonomies/${params.id}`,
        options
      );
    },

    async createTaxonomy(params: CreateTaxonomyParams, options?: RequestOptions): Promise<Taxonomy> {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/taxonomies`,
        params,
        options
      );
    },

    async updateTaxonomy(params: UpdateTaxonomyParams, options?: RequestOptions): Promise<Taxonomy> {
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/taxonomies/${params.id}`,
        params,
        options
      );
    },

    async deleteTaxonomy(params: DeleteTaxonomyParams, options?: RequestOptions): Promise<boolean> {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/taxonomies/${params.id}`,
        options
      );
    },

    async getTaxonomyChildren(params: GetTaxonomyChildrenParams, options?: RequestOptions): Promise<Taxonomy[]> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/taxonomies/${params.id}/children`,
        options
      );
    },

    async getRootTaxonomies(scope: TaxonomyScope, options?: RequestOptions): Promise<Taxonomy[]> {
      const result = await apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/taxonomies`,
        {
          ...options,
          params: { scope, root: true },
        }
      );
      return result.items || [];
    },
  };
};
