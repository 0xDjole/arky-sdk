import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateExperimentParams,
  DeleteExperimentParams,
  Experiment,
  ExperimentActionParams,
  ExperimentResults,
  FindExperimentsParams,
  GetExperimentParams,
  UpdateExperimentParams,
} from "../types/experiment";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

export const createExperimentsApi = (apiConfig: ApiConfig) => {
  const experimentPath = (storeId: string, id: string) => storeRecordPath(storeId, "experiments", id);
  const action = (verb: string, params: ExperimentActionParams, options?: RequestOptions) =>
    apiConfig.httpClient.post<Experiment>(
      `${experimentPath(params.store_id, params.id)}/${verb}`,
      { expected_updated_at: params.expected_updated_at },
      options,
    );

  return {
    find(params: FindExperimentsParams, options?: RequestOptions): Promise<PaginatedResponse<Experiment>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Experiment>>(storePath(store_id, "experiments"), {
        ...options,
        params: query,
      });
    },

    get(params: GetExperimentParams, options?: RequestOptions): Promise<Experiment> {
      return apiConfig.httpClient.get<Experiment>(experimentPath(params.store_id, params.id), options);
    },

    results(params: GetExperimentParams, options?: RequestOptions): Promise<ExperimentResults> {
      return apiConfig.httpClient.get<ExperimentResults>(`${experimentPath(params.store_id, params.id)}/results`, options);
    },

    create(params: CreateExperimentParams, options?: RequestOptions): Promise<Experiment> {
      requireId(params.id, "experiment");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<Experiment>(storePath(store_id, "experiments"), body, options);
    },

    update(params: UpdateExperimentParams, options?: RequestOptions): Promise<Experiment> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.put<Experiment>(experimentPath(store_id, id), body, options);
    },

    delete(params: DeleteExperimentParams, options?: RequestOptions): Promise<void> {
      return apiConfig.httpClient.delete<void>(experimentPath(params.store_id, params.id), {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },

    start(params: ExperimentActionParams, options?: RequestOptions): Promise<Experiment> {
      return action("start", params, options);
    },

    pause(params: ExperimentActionParams, options?: RequestOptions): Promise<Experiment> {
      return action("pause", params, options);
    },

    resume(params: ExperimentActionParams, options?: RequestOptions): Promise<Experiment> {
      return action("resume", params, options);
    },

    complete(params: ExperimentActionParams, options?: RequestOptions): Promise<Experiment> {
      return action("complete", params, options);
    },
  };
};
