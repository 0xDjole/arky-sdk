import type { ApiConfig } from '../index';
import type {
	CreateWorkflowParams,
	UpdateWorkflowParams,
	DeleteWorkflowParams,
	GetWorkflowParams,
	GetWorkflowsParams,
	TriggerWorkflowParams,
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
			// Don't pass businessId in query params since it's in the URL path
			const { businessId: _, ...queryParams } = params || {};
			return apiConfig.httpClient.get(`/v1/businesses/${businessId}/workflows`, {
				...options,
				params: Object.keys(queryParams).length > 0 ? queryParams : undefined
			});
		},

		/**
		 * Trigger a workflow execution via webhook
		 * No authentication required - the secret in the URL validates the request
		 */
		async triggerWorkflow(params: TriggerWorkflowParams, options?: RequestOptions) {
			const { secret, ...input } = params;
			return apiConfig.httpClient.post(`/v1/workflows/trigger/${secret}`, input, options);
		}
	};
};
