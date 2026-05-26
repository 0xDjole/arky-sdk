import type { ApiConfig } from "../index";
import type {
  CreateLeadGenerationRunParams,
  CancelLeadGenerationRunParams,
  FindLeadGenerationLeadsParams,
  FindLeadGenerationRunsParams,
  GetLeadGenerationRunParams,
  ImportLeadGenerationLeadsParams,
  RequestOptions,
  StartLeadGenerationRunParams,
  UpdateLeadGenerationLeadParams,
  ValidateLeadEmailParams,
} from "../types/api";
import type {
  ImportLeadGenerationLeadsResult,
  LeadEmailValidationResult,
  LeadGenerationLead,
  LeadGenerationRun,
  PaginatedResponse,
} from "../types";

export const createLeadGenerationApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;
  const runId = (params: { run_id?: string; id?: string }) => {
    const id = params.run_id || params.id;
    if (!id) throw new Error("Lead generation run id is required");
    return id;
  };

  return {
    async createRun(params: CreateLeadGenerationRunParams, options?: RequestOptions): Promise<LeadGenerationRun> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<LeadGenerationRun>(
        `/v1/stores/${storeId(store_id)}/lead-generation/runs`,
        payload,
        options,
      );
    },

    async findRuns(params?: FindLeadGenerationRunsParams, options?: RequestOptions): Promise<PaginatedResponse<LeadGenerationRun>> {
      const { store_id, ...queryParams } = params || {};
      return apiConfig.httpClient.get<PaginatedResponse<LeadGenerationRun>>(
        `/v1/stores/${storeId(store_id)}/lead-generation/runs`,
        { ...options, params: queryParams },
      );
    },

    async getRun(params: GetLeadGenerationRunParams, options?: RequestOptions): Promise<LeadGenerationRun> {
      return apiConfig.httpClient.get<LeadGenerationRun>(
        `/v1/stores/${storeId(params.store_id)}/lead-generation/runs/${params.id}`,
        options,
      );
    },

    async startRun(params: StartLeadGenerationRunParams, options?: RequestOptions): Promise<LeadGenerationRun> {
      return apiConfig.httpClient.post<LeadGenerationRun>(
        `/v1/stores/${storeId(params.store_id)}/lead-generation/runs/${params.id}/start`,
        {},
        options,
      );
    },

    async cancelRun(params: CancelLeadGenerationRunParams, options?: RequestOptions): Promise<LeadGenerationRun> {
      return apiConfig.httpClient.post<LeadGenerationRun>(
        `/v1/stores/${storeId(params.store_id)}/lead-generation/runs/${params.id}/cancel`,
        {},
        options,
      );
    },

    async findLeads(params: FindLeadGenerationLeadsParams, options?: RequestOptions): Promise<PaginatedResponse<LeadGenerationLead>> {
      const id = runId(params);
      const { store_id, run_id: _run_id, id: _legacy_id, ...queryParams } = params;
      return apiConfig.httpClient.get<PaginatedResponse<LeadGenerationLead>>(
        `/v1/stores/${storeId(store_id)}/lead-generation/runs/${id}/leads`,
        { ...options, params: queryParams },
      );
    },

    async updateLead(params: UpdateLeadGenerationLeadParams, options?: RequestOptions): Promise<LeadGenerationLead> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<LeadGenerationLead>(
        `/v1/stores/${storeId(store_id)}/lead-generation/leads/${id}`,
        payload,
        options,
      );
    },

    async importLeads(params: ImportLeadGenerationLeadsParams, options?: RequestOptions): Promise<ImportLeadGenerationLeadsResult> {
      const id = runId(params);
      const { store_id, run_id: _run_id, id: _legacy_id, ...payload } = params;
      return apiConfig.httpClient.post<ImportLeadGenerationLeadsResult>(
        `/v1/stores/${storeId(store_id)}/lead-generation/runs/${id}/import`,
        payload,
        options,
      );
    },

    async validateEmail(params: ValidateLeadEmailParams, options?: RequestOptions): Promise<LeadEmailValidationResult> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<LeadEmailValidationResult>(
        `/v1/stores/${storeId(store_id)}/lead-generation/validate-email`,
        payload,
        options,
      );
    },
  };
};
