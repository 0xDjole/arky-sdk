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
			const businessId = params.businessId || apiConfig.businessId;
			return apiConfig.httpClient.post(
				`/v1/businesses/${businessId}/workflows`,
				{ ...params, businessId },
				options
			);
		},

		async updateWorkflow(params: UpdateWorkflowParams, options?: RequestOptions) {
			return apiConfig.httpClient.put(
				`/v1/businesses/${apiConfig.businessId}/workflows/${params.id}`,
				params,
				options
			);
		},

		async deleteWorkflow(params: DeleteWorkflowParams, options?: RequestOptions) {
			return apiConfig.httpClient.delete(
				`/v1/businesses/${apiConfig.businessId}/workflows/${params.id}`,
				options
			);
		},

		async getWorkflow(params: GetWorkflowParams, options?: RequestOptions) {
			return apiConfig.httpClient.get(
				`/v1/businesses/${apiConfig.businessId}/workflows/${params.id}`,
				options
			);
		},

		async getWorkflows(params?: GetWorkflowsParams, options?: RequestOptions) {
			const businessId = params?.businessId || apiConfig.businessId;
			
			const { businessId: _, ...queryParams } = params || {};
			return apiConfig.httpClient.get(`/v1/businesses/${businessId}/workflows`, {
				...options,
				params: Object.keys(queryParams).length > 0 ? queryParams : undefined
			});
		},

		async triggerWorkflow(params: TriggerWorkflowParams, options?: RequestOptions) {
			const { secret, ...payload } = params;
			return apiConfig.httpClient.post(`/v1/workflows/trigger/${secret}`, payload, options);
		},

		async getWorkflowExecutions(params: GetWorkflowExecutionsParams, options?: RequestOptions) {
			const businessId = params.businessId || apiConfig.businessId;
			const { businessId: _, workflowId, ...queryParams } = params;
			return apiConfig.httpClient.get(
				`/v1/businesses/${businessId}/workflows/${workflowId}/executions`,
				{
					...options,
					params: Object.keys(queryParams).length > 0 ? queryParams : undefined
				}
			);
		},

		async getWorkflowExecution(params: GetWorkflowExecutionParams, options?: RequestOptions) {
			const businessId = params.businessId || apiConfig.businessId;
			return apiConfig.httpClient.get(
				`/v1/businesses/${businessId}/workflows/${params.workflowId}/executions/${params.executionId}`,
				options
			);
		}
	};
};
