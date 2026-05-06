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
	RequestOptions
} from '../types/api';

export const createWorkflowApi = (apiConfig: ApiConfig) => {
	return {
		async createWorkflow(params: CreateWorkflowParams, options?: RequestOptions) {
			const { store_id, ...payload } = params;
			const target_store_id = store_id || apiConfig.storeId;
			return apiConfig.httpClient.post(
				`/v1/stores/${target_store_id}/workflows`,
				{ ...payload, store_id: target_store_id },
				options
			);
		},

		async updateWorkflow(params: UpdateWorkflowParams, options?: RequestOptions) {
			const { store_id, id, ...payload } = params;
			const target_store_id = store_id || apiConfig.storeId;
			return apiConfig.httpClient.put(
				`/v1/stores/${target_store_id}/workflows/${id}`,
				payload,
				options
			);
		},

		async deleteWorkflow(params: DeleteWorkflowParams, options?: RequestOptions) {
			const store_id = params.store_id || apiConfig.storeId;
			return apiConfig.httpClient.delete(
				`/v1/stores/${store_id}/workflows/${params.id}`,
				options
			);
		},

		async getWorkflow(params: GetWorkflowParams, options?: RequestOptions) {
			const store_id = params.store_id || apiConfig.storeId;
			return apiConfig.httpClient.get(
				`/v1/stores/${store_id}/workflows/${params.id}`,
				options
			);
		},

		async getWorkflows(params?: GetWorkflowsParams, options?: RequestOptions) {
			const store_id = params?.store_id || apiConfig.storeId;
			
			const { store_id: _, ...queryParams } = params || {};
			return apiConfig.httpClient.get(`/v1/stores/${store_id}/workflows`, {
				...options,
				params: Object.keys(queryParams).length > 0 ? queryParams : undefined
			});
		},

		async triggerWorkflow(params: TriggerWorkflowParams, options?: RequestOptions) {
			const { secret, ...payload } = params;
			return apiConfig.httpClient.post(`/v1/workflows/trigger/${secret}`, payload, options);
		},

		async getWorkflowExecutions(params: GetWorkflowExecutionsParams, options?: RequestOptions) {
			const store_id = params.store_id || apiConfig.storeId;
			const { store_id: _, workflow_id, ...queryParams } = params;
			return apiConfig.httpClient.get(
				`/v1/stores/${store_id}/workflows/${workflow_id}/executions`,
				{
					...options,
					params: Object.keys(queryParams).length > 0 ? queryParams : undefined
				}
			);
		},

		async getWorkflowExecution(params: GetWorkflowExecutionParams, options?: RequestOptions) {
			const store_id = params.store_id || apiConfig.storeId;
			return apiConfig.httpClient.get(
				`/v1/stores/${store_id}/workflows/${params.workflow_id}/executions/${params.execution_id}`,
				options
			);
		}
	};
};
