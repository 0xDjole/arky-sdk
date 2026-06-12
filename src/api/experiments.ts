import type { ApiConfig } from "../index";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";

export type ExperimentStatus = "draft" | "running" | "paused" | "completed";

export interface ExperimentVariant {
  key: string;
  weight: number;
}

export interface Experiment {
  id: string;
  store_id: string;
  key: string;
  status: ExperimentStatus;
  version: number;
  goal_activity_key: string;
  variants: ExperimentVariant[];
  created_at: number;
  updated_at: number;
}

export interface CreateExperimentParams {
  store_id?: string;
  key: string;
  goal_activity_key: string;
  variants: ExperimentVariant[];
  status?: ExperimentStatus;
}

export interface UpdateExperimentParams {
  store_id?: string;
  key: string;
  goal_activity_key?: string;
  variants?: ExperimentVariant[];
  status?: ExperimentStatus;
}

export interface GetExperimentParams {
  store_id?: string;
  key: string;
}

export interface FindExperimentsParams {
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export interface ExperimentVariantResult {
  variant_key: string;
  weight: number;
  shown: number;
  wins: number;
  conversion_rate: number;
}

export interface ExperimentResults {
  experiment: Experiment;
  variants: ExperimentVariantResult[];
  winning_variant_key?: string | null;
}

export const createExperimentsApi = (apiConfig: ApiConfig) => {
  const base = (storeId = apiConfig.storeId) => `/v1/stores/${storeId}/experiments`;

  return {
    create(params: CreateExperimentParams, options?: RequestOptions): Promise<Experiment> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Experiment>(base(store_id), payload, options);
    },

    update(params: UpdateExperimentParams, options?: RequestOptions): Promise<Experiment> {
      const { store_id, key, ...payload } = params;
      return apiConfig.httpClient.put<Experiment>(`${base(store_id)}/${key}`, payload, options);
    },

    get(params: GetExperimentParams, options?: RequestOptions): Promise<Experiment> {
      return apiConfig.httpClient.get<Experiment>(`${base(params.store_id)}/${params.key}`, options);
    },

    find(params: FindExperimentsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Experiment>> {
      const { store_id, ...queryParams } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Experiment>>(base(store_id), {
        ...options,
        params: queryParams,
      });
    },

    results(params: GetExperimentParams, options?: RequestOptions): Promise<ExperimentResults> {
      return apiConfig.httpClient.get<ExperimentResults>(
        `${base(params.store_id)}/${params.key}/results`,
        options,
      );
    },
  };
};
