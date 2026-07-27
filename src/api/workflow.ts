import type { ApiConfig } from "../index";
import type {
  CreateWorkflowParams,
  UpdateWorkflowParams,
  DeleteWorkflowParams,
  GetWorkflowParams,
  GetWorkflowsParams,
  TriggerWorkflowParams,
  GetWorkflowExecutionsParams,
  GetWorkflowExecutionParams,
  GetWorkflowEffectsParams,
  GetWorkflowEffectParams,
  GetWorkflowConnectionConnectUrlParams,
  GetWorkflowConnectionOAuthAttemptParams,
  GetWorkflowConnectionsParams,
  DeleteWorkflowConnectionParams,
  RequestOptions,
} from "../types/api";
import type {
  Workflow,
  WorkflowConnection,
  WorkflowConnectionConnectUrl,
  WorkflowConnectionOAuthAttempt,
  WorkflowExecution,
  WorkflowEffect,
  PaginatedResponse,
} from "../types";

export const createWorkflowApi = (apiConfig: ApiConfig) => {
  return {
    async createWorkflow(
      params: CreateWorkflowParams,
      options?: RequestOptions,
    ): Promise<Workflow> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Workflow>(
        `/v1/stores/${target_store_id}/workflows`,
        { ...payload, store_id: target_store_id },
        options,
      );
    },

    async updateWorkflow(
      params: UpdateWorkflowParams,
      options?: RequestOptions,
    ): Promise<Workflow> {
      const { store_id, id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Workflow>(
        `/v1/stores/${target_store_id}/workflows/${id}`,
        payload,
        options,
      );
    },

    async deleteWorkflow(
      params: DeleteWorkflowParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${store_id}/workflows/${params.id}`,
        options,
      );
    },

    async getWorkflow(
      params: GetWorkflowParams,
      options?: RequestOptions,
    ): Promise<Workflow> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<Workflow>(
        `/v1/stores/${store_id}/workflows/${params.id}`,
        options,
      );
    },

    async getWorkflows(
      params?: GetWorkflowsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Workflow>> {
      const store_id = params?.store_id || apiConfig.storeId;

      const { store_id: _, ...queryParams } = params || {};
      return apiConfig.httpClient.get<PaginatedResponse<Workflow>>(
        `/v1/stores/${store_id}/workflows`,
        {
          ...options,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        },
      );
    },

    async triggerWorkflow(
      params: TriggerWorkflowParams,
      options?: RequestOptions,
    ): Promise<WorkflowExecution> {
      const { secret, ...payload } = params;
      return apiConfig.httpClient.post<WorkflowExecution>(
        `/v1/workflows/trigger/${secret}`,
        payload,
        options,
      );
    },

    async getWorkflowExecutions(
      params: GetWorkflowExecutionsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<WorkflowExecution>> {
      const store_id = params.store_id || apiConfig.storeId;
      const { store_id: _, workflow_id, ...queryParams } = params;
      return apiConfig.httpClient.get<PaginatedResponse<WorkflowExecution>>(
        `/v1/stores/${store_id}/workflows/${workflow_id}/executions`,
        {
          ...options,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        },
      );
    },

    async getWorkflowExecution(
      params: GetWorkflowExecutionParams,
      options?: RequestOptions,
    ): Promise<WorkflowExecution> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<WorkflowExecution>(
        `/v1/stores/${store_id}/workflows/${params.workflow_id}/executions/${params.execution_id}`,
        options,
      );
    },

    async getWorkflowEffects(
      params: GetWorkflowEffectsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<WorkflowEffect>> {
      const store_id = params.store_id || apiConfig.storeId;
      const { store_id: _, workflow_id, execution_id, ...queryParams } = params;
      return apiConfig.httpClient.get<PaginatedResponse<WorkflowEffect>>(
        `/v1/stores/${store_id}/workflows/${workflow_id}/executions/${execution_id}/effects`,
        {
          ...options,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        },
      );
    },

    async getWorkflowEffect(
      params: GetWorkflowEffectParams,
      options?: RequestOptions,
    ): Promise<WorkflowEffect> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<WorkflowEffect>(
        `/v1/stores/${store_id}/workflows/${params.workflow_id}/executions/${params.execution_id}/effects/${params.effect_id}`,
        options,
      );
    },

    async getWorkflowConnections(
      params?: GetWorkflowConnectionsParams,
      options?: RequestOptions,
    ): Promise<WorkflowConnection[]> {
      const store_id = params?.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<WorkflowConnection[]>(
        `/v1/stores/${store_id}/workflow-connections`,
        options,
      );
    },

    async getWorkflowConnectionConnectUrl(
      params: GetWorkflowConnectionConnectUrlParams,
      options?: RequestOptions,
    ): Promise<WorkflowConnectionConnectUrl> {
      const { store_id, type, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<WorkflowConnectionConnectUrl>(
        `/v1/stores/${target_store_id}/workflow-connections/connect-url`,
        { ...payload, type, store_id: target_store_id },
        options,
      );
    },

    async getWorkflowConnectionOAuthAttempt(
      params: GetWorkflowConnectionOAuthAttemptParams,
      options?: RequestOptions,
    ): Promise<WorkflowConnectionOAuthAttempt> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<WorkflowConnectionOAuthAttempt>(
        `/v1/stores/${store_id}/workflow-connections/oauth/attempts/${params.attempt_id}`,
        options,
      );
    },

    async deleteWorkflowConnection(
      params: DeleteWorkflowConnectionParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${store_id}/workflow-connections/${params.id}`,
        options,
      );
    },
  };
};
