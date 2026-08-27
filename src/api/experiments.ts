import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";

export type ExperimentStatus =
  | { type: "draft" }
  | { type: "running"; started_at: number }
  | { type: "paused"; started_at: number; paused_at: number }
  | { type: "completed"; started_at: number; completed_at: number };

export type ExperimentStatusFilter = ExperimentStatus["type"];

export interface ExperimentVariant {
  key: string;
  allocation_bps: number;
}

export interface Experiment {
  id: string;
  store_id: string;
  key: string;
  status: ExperimentStatus;
  goal_action_key: string;
  attribution_window_days: number;
  variants: ExperimentVariant[];
  created_at: number;
  updated_at: number;
}

export interface CreateExperimentParams {
  store_id?: string;
  key: string;
  goal_action_key: string;
  attribution_window_days: number;
  variants: ExperimentVariant[];
}

export interface ReplaceDraftExperimentParams {
  store_id?: string;
  experiment_id: string;
  key: string;
  goal_action_key: string;
  attribution_window_days: number;
  variants: ExperimentVariant[];
}

export interface ExperimentLifecycleParams {
  store_id?: string;
  experiment_id: string;
}

export type GetExperimentParams = ExperimentLifecycleParams;

export interface FindExperimentsParams {
  store_id?: string;
  status?: ExperimentStatusFilter;
  limit?: number;
  cursor?: string;
}

export interface ExperimentVariantResult {
  variant_key: string;
  allocation_bps: number;
  eligible_assignments: number;
  converted_assignments: number;
  observed_conversion_rate: number | null;
  excluded_conflicting_customers: number;
  highest_observed: boolean;
}

export interface ExperimentResults {
  experiment: Experiment;
  variants: ExperimentVariantResult[];
  freshness_at: number;
  maturing: boolean;
}

export const createExperimentsApi = (apiConfig: ApiConfig) => {
  const base = (storeId = apiConfig.storeId) =>
    `/v1/stores/${storeId}/experiments`;

  const lifecycle = (
    action: "start" | "pause" | "resume" | "complete",
    params: ExperimentLifecycleParams,
    options?: RequestOptions,
  ): Promise<Experiment> =>
    apiConfig.httpClient.post<Experiment>(
      `${base(params.store_id)}/${params.experiment_id}/${action}`,
      undefined,
      options,
    );

  return {
    create(
      params: CreateExperimentParams,
      options?: RequestOptions,
    ): Promise<Experiment> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Experiment>(
        base(store_id),
        payload,
        options,
      );
    },

    replaceDraft(
      params: ReplaceDraftExperimentParams,
      options?: RequestOptions,
    ): Promise<Experiment> {
      const { store_id, experiment_id, ...payload } = params;
      return apiConfig.httpClient.put<Experiment>(
        `${base(store_id)}/${experiment_id}`,
        payload,
        options,
      );
    },

    deleteDraft(
      params: ExperimentLifecycleParams,
      options?: RequestOptions,
    ): Promise<void> {
      return apiConfig.httpClient.delete<void>(
        `${base(params.store_id)}/${params.experiment_id}`,
        options,
      );
    },

    start: (params: ExperimentLifecycleParams, options?: RequestOptions) =>
      lifecycle("start", params, options),
    pause: (params: ExperimentLifecycleParams, options?: RequestOptions) =>
      lifecycle("pause", params, options),
    resume: (params: ExperimentLifecycleParams, options?: RequestOptions) =>
      lifecycle("resume", params, options),
    complete: (params: ExperimentLifecycleParams, options?: RequestOptions) =>
      lifecycle("complete", params, options),

    get(
      params: GetExperimentParams,
      options?: RequestOptions,
    ): Promise<Experiment> {
      return apiConfig.httpClient.get<Experiment>(
        `${base(params.store_id)}/${params.experiment_id}`,
        options,
      );
    },

    find(
      params: FindExperimentsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Experiment>> {
      const { store_id, ...queryParams } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Experiment>>(
        base(store_id),
        {
          ...options,
          params: queryParams,
        },
      );
    },

    results(
      params: GetExperimentParams,
      options?: RequestOptions,
    ): Promise<ExperimentResults> {
      return apiConfig.httpClient.get<ExperimentResults>(
        `${base(params.store_id)}/${params.experiment_id}/results`,
        options,
      );
    },
  };
};
