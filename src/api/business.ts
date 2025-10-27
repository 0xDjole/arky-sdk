import type { ApiConfig } from '../index';
import type {
	CreateBusinessParams,
	UpdateBusinessParams,
	DeleteBusinessParams,
	GetBusinessParams,
	GetBusinessParentsParams,
	TriggerBuildsParams,
	GetSubscriptionParams,
	CreateSubscriptionParams,
	UpdateSubscriptionParams,
	CancelSubscriptionParams,
	ReactivateSubscriptionParams,
	CreatePortalSessionParams,
	InviteUserParams,
	HandleInvitationParams,
	TestWebhookParams,
	RequestOptions
} from '../types/api';

export const createBusinessApi = (apiConfig: ApiConfig) => {
	return {
		async createBusiness(params: CreateBusinessParams, options?: RequestOptions) {
			return apiConfig.httpClient.post(`/v1/businesses`, params, options);
		},

		async updateBusiness(params: UpdateBusinessParams, options?: RequestOptions) {
			return apiConfig.httpClient.put(`/v1/businesses/${params.id}`, params, options);
		},

		async deleteBusiness(params: DeleteBusinessParams, options?: RequestOptions) {
			return apiConfig.httpClient.delete(`/v1/businesses/${params.id}`, options);
		},

		async getBusiness(params: GetBusinessParams, options?: RequestOptions) {
			return apiConfig.httpClient.get(`/v1/businesses/${params.id}`, options);
		},

		async getBusinesses(options?: RequestOptions) {
			return apiConfig.httpClient.get(`/v1/businesses`, options);
		},

		async getBusinessParents(params: GetBusinessParentsParams, options?: RequestOptions) {
			return apiConfig.httpClient.get(`/v1/businesses/${params.businessId}/parents`, options);
		},

		async triggerBuilds(params: TriggerBuildsParams, options?: RequestOptions) {
			return apiConfig.httpClient.post(`/v1/businesses/${params.id}/trigger-builds`, {}, options);
		},

		async getSubscriptionPlans(options?: RequestOptions) {
			return apiConfig.httpClient.get('/v1/businesses/plans', options);
		},

		async getSubscription(params: GetSubscriptionParams, options?: RequestOptions) {
			return apiConfig.httpClient.get(`/v1/businesses/${params.businessId}/subscription`, options);
		},

		async createSubscription(params: CreateSubscriptionParams, options?: RequestOptions) {
			return apiConfig.httpClient.post(
				`/v1/businesses/${params.businessId}/subscription`,
				params,
				options
			);
		},

		async updateSubscription(params: UpdateSubscriptionParams, options?: RequestOptions) {
			return apiConfig.httpClient.put(
				`/v1/businesses/${params.businessId}/subscription`,
				params,
				options
			);
		},

		async cancelSubscription(params: CancelSubscriptionParams, options?: RequestOptions) {
			return apiConfig.httpClient.delete(`/v1/businesses/${params.businessId}/subscription`, {
				...options,
				params: { immediately: params.immediately || false }
			});
		},

		async reactivateSubscription(params: ReactivateSubscriptionParams, options?: RequestOptions) {
			return apiConfig.httpClient.post(
				`/v1/businesses/${params.businessId}/subscription/reactivate`,
				params,
				options
			);
		},

		async createPortalSession(params: CreatePortalSessionParams, options?: RequestOptions) {
			return apiConfig.httpClient.post(
				`/v1/businesses/${params.businessId}/subscription/portal`,
				params,
				options
			);
		},

		async inviteUser(params: InviteUserParams, options?: RequestOptions) {
			const { businessId, ...payload } = params;
			return apiConfig.httpClient.post(
				`/v1/businesses/${businessId}/invitation`,
				payload,
				options
			);
		},

		async handleInvitation(params: HandleInvitationParams, options?: RequestOptions) {
			const { businessId, ...payload } = params;
			return apiConfig.httpClient.put(
				`/v1/businesses/${businessId}/invitation`,
				payload,
				options
			);
		},

		async testWebhook(params: TestWebhookParams, options?: RequestOptions) {
			return apiConfig.httpClient.post(
				`/v1/businesses/${params.businessId}/webhooks/test`,
				params.webhook,
				options
			);
		},

		async getBusinessMedia(params: { id: string; cursor?: string | null; limit?: number }, options?: RequestOptions) {
			return apiConfig.httpClient.get(
				`/v1/businesses/${params.id}/media`,
				{
					...options,
					params: {
						cursor: params.cursor,
						limit: params.limit || 20
					}
				}
			);
		},

		async setProviderSchedule(params: { id: string; workingTime: any; serviceIds: string[]; providerIds: string[] }, options?: RequestOptions) {
			const { id, ...payload } = params;
			return apiConfig.httpClient.put(
				`/v1/businesses/${id}/schedules`,
				payload,
				options
			);
		}
	};
};
