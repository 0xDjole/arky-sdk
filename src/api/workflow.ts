import type { ApiConfig } from "../services/clientTypes";
import type {
  CreateWorkflowParams,
  UpdateWorkflowParams,
  DeleteWorkflowParams,
  GetWorkflowParams,
  GetWorkflowDefinitionParams,
  GetWorkflowTriggerParams,
  GetWorkflowsParams,
  TriggerWorkflowParams,
  InvokeWorkflowTriggerParams,
  GetWorkflowExecutionsParams,
  GetWorkflowExecutionParams,
  GetWorkflowExternalOperationsParams,
  GetWorkflowExternalOperationParams,
  GetWorkflowConnectionConnectUrlParams,
  GetWorkflowConnectionsParams,
  DeleteWorkflowConnectionParams,
  RequestOptions,
  ReplaceWorkflowDefinitionParams,
} from "../types/api";
import type {
  Workflow,
  WorkflowDefinition,
  WorkflowTrigger,
  WorkflowConnection,
  WorkflowConnectionConnectUrl,
  WorkflowExecution,
  WorkflowExecutionDefinition,
  WorkflowExecutionInputCapture,
  WorkflowExecutionResults,
  WorkflowExternalOperation,
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

    async getWorkflowDefinition(
      params: GetWorkflowDefinitionParams,
      options?: RequestOptions,
    ): Promise<WorkflowDefinition> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<WorkflowDefinition>(
        `/v1/stores/${store_id}/workflows/${params.workflow_id}/definition`,
        options,
      );
    },

    async getWorkflowTrigger(
      params: GetWorkflowTriggerParams,
      options?: RequestOptions,
    ): Promise<WorkflowTrigger> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<WorkflowTrigger>(
        `/v1/stores/${store_id}/workflows/${params.workflow_id}/trigger`,
        options,
      );
    },

    async rotateWorkflowTrigger(
      params: GetWorkflowTriggerParams,
      options?: RequestOptions,
    ): Promise<WorkflowTrigger> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<WorkflowTrigger>(
        `/v1/stores/${store_id}/workflows/${params.workflow_id}/trigger`,
        {},
        options,
      );
    },

    async replaceWorkflowDefinition(
      params: ReplaceWorkflowDefinitionParams,
      options?: RequestOptions,
    ): Promise<WorkflowDefinition> {
      const { store_id, workflow_id, ...definition } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<WorkflowDefinition>(
        `/v1/stores/${target_store_id}/workflows/${workflow_id}/definition`,
        definition,
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

    async invokeWorkflowTrigger(
      params: InvokeWorkflowTriggerParams,
      options?: RequestOptions,
    ): Promise<WorkflowExecution> {
      return apiConfig.httpClient.post<WorkflowExecution>(
        params.trigger_url,
        params.payload,
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

    async getWorkflowExecutionDefinition(
      params: GetWorkflowExecutionParams,
      options?: RequestOptions,
    ): Promise<WorkflowExecutionDefinition> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<WorkflowExecutionDefinition>(
        `/v1/stores/${store_id}/workflows/${params.workflow_id}/executions/${params.execution_id}/definition`,
        options,
      );
    },

    async getWorkflowExecutionInput(
      params: GetWorkflowExecutionParams,
      options?: RequestOptions,
    ): Promise<WorkflowExecutionInputCapture> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<WorkflowExecutionInputCapture>(
        `/v1/stores/${store_id}/workflows/${params.workflow_id}/executions/${params.execution_id}/input`,
        options,
      );
    },

    async getWorkflowExecutionResults(
      params: GetWorkflowExecutionParams,
      options?: RequestOptions,
    ): Promise<WorkflowExecutionResults> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<WorkflowExecutionResults>(
        `/v1/stores/${store_id}/workflows/${params.workflow_id}/executions/${params.execution_id}/results`,
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
