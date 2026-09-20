import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  TaxRule,
  CreateTaxRuleParams,
  UpdateTaxRuleParams,
  GetTaxRuleParams,
  FindTaxRulesParams,
  DeleteTaxRuleParams,
} from "../types/tax";

export const createTaxRuleApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/tax-rules`;

  return {
    create(params: CreateTaxRuleParams, options?: RequestOptions): Promise<TaxRule> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<TaxRule>(basePath(store_id), payload, options);
    },
    update(params: UpdateTaxRuleParams, options?: RequestOptions): Promise<TaxRule> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<TaxRule>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(params: GetTaxRuleParams, options?: RequestOptions): Promise<TaxRule> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<TaxRule>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindTaxRulesParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<TaxRule>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<TaxRule>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    delete(params: DeleteTaxRuleParams, options?: RequestOptions): Promise<TaxRule | void> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<TaxRule | void>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
