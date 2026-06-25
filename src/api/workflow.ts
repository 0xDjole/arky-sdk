import type { ApiConfig } from '../index';
import type {
	CreateWorkflowParams,
	UpdateWorkflowParams,
	DeleteWorkflowParams,
	GetWorkflowParams,
	GetWorkflowsParams,
	TriggerWorkflowParams,
	GetWorkflowExecutionsParams,
	GetWorkflowExecutionParams,
	ConnectGoogleDriveWorkflowAccountParams,
	GetGoogleDriveWorkflowAccountConnectUrlParams,
	GetWorkflowAccountsParams,
	DeleteWorkflowAccountParams,
	RequestOptions
} from '../types/api';
import type {
	Workflow,
	WorkflowAccount,
	WorkflowAccountConnectUrl,
	WorkflowExecution,
	PaginatedResponse
} from '../types';

export const createWorkflowApi = (apiConfig: ApiConfig) => {
	return {
		async createWorkflow(params: CreateWorkflowParams, options?: RequestOptions): Promise<Workflow> {
			const { store_id, ...payload } = params;
			const target_store_id = store_id || apiConfig.storeId;
			return apiConfig.httpClient.post<Workflow>(
				`/v1/stores/${target_store_id}/workflows`,
				{ ...payload, store_id: target_store_id },
				options
			);
		},

		async updateWorkflow(params: UpdateWorkflowParams, options?: RequestOptions): Promise<Workflow> {
			const { store_id, id, ...payload } = params;
			const target_store_id = store_id || apiConfig.storeId;
			return apiConfig.httpClient.put<Workflow>(
				`/v1/stores/${target_store_id}/workflows/${id}`,
				payload,
				options
			);
		},

		async deleteWorkflow(params: DeleteWorkflowParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
			const store_id = params.store_id || apiConfig.storeId;
			return apiConfig.httpClient.delete<{ deleted: boolean }>(
				`/v1/stores/${store_id}/workflows/${params.id}`,
				options
			);
		},

		async getWorkflow(params: GetWorkflowParams, options?: RequestOptions): Promise<Workflow> {
			const store_id = params.store_id || apiConfig.storeId;
			return apiConfig.httpClient.get<Workflow>(
				`/v1/stores/${store_id}/workflows/${params.id}`,
				options
			);
		},

		async getWorkflows(params?: GetWorkflowsParams, options?: RequestOptions): Promise<PaginatedResponse<Workflow>> {
			const store_id = params?.store_id || apiConfig.storeId;

			const { store_id: _, ...queryParams } = params || {};
			return apiConfig.httpClient.get<PaginatedResponse<Workflow>>(`/v1/stores/${store_id}/workflows`, {
				...options,
				params: Object.keys(queryParams).length > 0 ? queryParams : undefined
			});
		},

		async triggerWorkflow(params: TriggerWorkflowParams, options?: RequestOptions): Promise<WorkflowExecution> {
			const { secret, ...payload } = params;
			return apiConfig.httpClient.post<WorkflowExecution>(`/v1/workflows/trigger/${secret}`, payload, options);
		},

		async getWorkflowExecutions(params: GetWorkflowExecutionsParams, options?: RequestOptions): Promise<PaginatedResponse<WorkflowExecution>> {
			const store_id = params.store_id || apiConfig.storeId;
			const { store_id: _, workflow_id, ...queryParams } = params;
			return apiConfig.httpClient.get<PaginatedResponse<WorkflowExecution>>(
				`/v1/stores/${store_id}/workflows/${workflow_id}/executions`,
				{
					...options,
					params: Object.keys(queryParams).length > 0 ? queryParams : undefined
				}
			);
		},

		async getWorkflowExecution(params: GetWorkflowExecutionParams, options?: RequestOptions): Promise<WorkflowExecution> {
			const store_id = params.store_id || apiConfig.storeId;
			return apiConfig.httpClient.get<WorkflowExecution>(
				`/v1/stores/${store_id}/workflows/${params.workflow_id}/executions/${params.execution_id}`,
				options
			);
		},

		async getWorkflowAccounts(params?: GetWorkflowAccountsParams, options?: RequestOptions): Promise<WorkflowAccount[]> {
			const store_id = params?.store_id || apiConfig.storeId;
			return apiConfig.httpClient.get<WorkflowAccount[]>(`/v1/stores/${store_id}/workflow-accounts`, options);
		},

		async getGoogleDriveWorkflowAccountConnectUrl(params: GetGoogleDriveWorkflowAccountConnectUrlParams, options?: RequestOptions): Promise<WorkflowAccountConnectUrl> {
			const { store_id, ...payload } = params;
			const target_store_id = store_id || apiConfig.storeId;
			return apiConfig.httpClient.post<WorkflowAccountConnectUrl>(
				`/v1/stores/${target_store_id}/workflow-accounts/google-drive/connect-url`,
				{ ...payload, store_id: target_store_id },
				options
			);
		},

		async connectGoogleDriveWorkflowAccount(params: ConnectGoogleDriveWorkflowAccountParams, options?: RequestOptions): Promise<WorkflowAccount> {
			const { store_id, ...payload } = params;
			const target_store_id = store_id || apiConfig.storeId;
			return apiConfig.httpClient.post<WorkflowAccount>(
				`/v1/stores/${target_store_id}/workflow-accounts/google-drive/connect`,
				{ ...payload, store_id: target_store_id },
				options
			);
		},

		async deleteWorkflowAccount(params: DeleteWorkflowAccountParams, options?: RequestOptions): Promise<boolean> {
			const store_id = params.store_id || apiConfig.storeId;
			return apiConfig.httpClient.delete<boolean>(
				`/v1/stores/${store_id}/workflow-accounts/${params.id}`,
				options
			);
		}
	};
};
