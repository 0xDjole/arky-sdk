import type { ApiConfig } from "../services/clientTypes";
import type {
  CreateWorkflowParams,
  UpdateWorkflowParams,
  DeleteWorkflowParams,
  GetWorkflowParams,
  GetWorkflowsParams,
  RegenerateWorkflowWebhookUrlParams,
  InvokeWorkflowWebhookParams,
  GetWorkflowExecutionsParams,
  GetWorkflowExecutionParams,
  GetWorkflowExternalOperationsParams,
  GetWorkflowExternalOperationParams,
  GetWorkflowConnectionConnectUrlParams,
  GetWorkflowConnectionsParams,
  DeleteWorkflowConnectionParams,
  RequestOptions,
} from "../types/api";
import type {
  Workflow,
  WorkflowListItem,
  WorkflowConnection,
  WorkflowConnectionConnectUrl,
  WorkflowExecution,
  WorkflowExecutionListItem,
  WorkflowExecutionStarted,
  WorkflowExternalOperation,
  WorkflowWebhookUrl,
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

    async regenerateWorkflowWebhookUrl(
      params: RegenerateWorkflowWebhookUrlParams,
      options?: RequestOptions,
    ): Promise<WorkflowWebhookUrl> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<WorkflowWebhookUrl>(
        `/v1/stores/${store_id}/workflows/${params.workflow_id}/regenerate-webhook-url`,
        {},
        options,
      );
    },

    async getWorkflows(
      params?: GetWorkflowsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<WorkflowListItem>> {
      const store_id = params?.store_id || apiConfig.storeId;

      const { store_id: _, ...queryParams } = params || {};
      return apiConfig.httpClient.get<PaginatedResponse<WorkflowListItem>>(
        `/v1/stores/${store_id}/workflows`,
        {
          ...options,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        },
      );
    },

    async invokeWorkflowWebhook(
      params: InvokeWorkflowWebhookParams,
      options?: RequestOptions,
    ): Promise<WorkflowExecutionStarted> {
      return apiConfig.httpClient.post<WorkflowExecutionStarted>(
        params.webhook_url,
        params.payload,
        options,
      );
    },

    async getWorkflowExecutions(
      params: GetWorkflowExecutionsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<WorkflowExecutionListItem>> {
      const store_id = params.store_id || apiConfig.storeId;
      const { store_id: _, workflow_id, ...queryParams } = params;
      return apiConfig.httpClient.get<
        PaginatedResponse<WorkflowExecutionListItem>
      >(
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

    async getWorkflowExternalOperations(
      params: GetWorkflowExternalOperationsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<WorkflowExternalOperation>> {
      const store_id = params.store_id || apiConfig.storeId;
      const { store_id: _, workflow_id, execution_id, ...queryParams } = params;
      return apiConfig.httpClient.get<
        PaginatedResponse<WorkflowExternalOperation>
      >(
        `/v1/stores/${store_id}/workflows/${workflow_id}/executions/${execution_id}/external-operations`,
        {
          ...options,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        },
      );
    },

    async getWorkflowExternalOperation(
      params: GetWorkflowExternalOperationParams,
      options?: RequestOptions,
    ): Promise<WorkflowExternalOperation> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<WorkflowExternalOperation>(
        `/v1/stores/${store_id}/workflows/${params.workflow_id}/executions/${params.execution_id}/external-operations/${params.operation_id}`,
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
