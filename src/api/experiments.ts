import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
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
import { tenantPath, tenantRecordPath } from "./paths";

export const createExperimentsApi = (apiConfig: ApiConfig) => {
  const experimentPath = (tenantId: string, id: string) => tenantRecordPath(tenantId, "experiments", id);
  const action = (verb: string, params: ExperimentActionParams, options?: RequestOptions) =>
    apiConfig.httpClient.post<Experiment>(
      `${experimentPath(params.tenant_id, params.id)}/${verb}`,
      { expected_updated_at: params.expected_updated_at },
      options,
    );

  return {
    find(params: FindExperimentsParams, options?: RequestOptions): Promise<PaginatedResponse<Experiment>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Experiment>>(tenantPath(tenant_id, "experiments"), {
        ...options,
        params: query,
      });
    },

    get(params: GetExperimentParams, options?: RequestOptions): Promise<Experiment> {
      return apiConfig.httpClient.get<Experiment>(experimentPath(params.tenant_id, params.id), options);
    },

    getResults(params: GetExperimentParams, options?: RequestOptions): Promise<ExperimentResults> {
      return apiConfig.httpClient.get<ExperimentResults>(`${experimentPath(params.tenant_id, params.id)}/results`, options);
    },

    create(params: CreateExperimentParams, options?: RequestOptions): Promise<Experiment> {
      requireId(params.id, "experiment");
      const { tenant_id, ...body } = params;
      return apiConfig.httpClient.post<Experiment>(tenantPath(tenant_id, "experiments"), body, options);
    },

    update(params: UpdateExperimentParams, options?: RequestOptions): Promise<Experiment> {
      const { tenant_id, id, ...body } = params;
      return apiConfig.httpClient.put<Experiment>(experimentPath(tenant_id, id), body, options);
    },

    delete(params: DeleteExperimentParams, options?: RequestOptions): Promise<DeletedResponse> {
      return apiConfig.httpClient.delete<DeletedResponse>(experimentPath(params.tenant_id, params.id), {
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
