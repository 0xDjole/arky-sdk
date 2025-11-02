import type { ApiConfig } from '../index';
import type {
	CreateBusinessParams,
	UpdateBusinessParams,
	DeleteBusinessParams,
	GetBusinessParams,
	GetBusinessesParams,
	GetBusinessParentsParams,
	TriggerBuildsParams,
	GetSubscriptionParams,
	GetSubscriptionPlansParams,
	UpdateSubscriptionParams,
	CancelSubscriptionParams,
	ReactivateSubscriptionParams,
	CreatePortalSessionParams,
	InviteUserParams,
	HandleInvitationParams,
	TestWebhookParams,
	GetBusinessMediaParams2,
	SetProviderScheduleParams,
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
		return apiConfig.httpClient.get(`/v1/businesses/${apiConfig.businessId}`, options);
	},

	async getBusinesses(params: GetBusinessesParams, options?: RequestOptions) {
		return apiConfig.httpClient.get(`/v1/businesses`, options);
	},

        async getBusinessParents(params: GetBusinessParentsParams, options?: RequestOptions) {
            return apiConfig.httpClient.get(`/v1/businesses/${apiConfig.businessId}/parents`, options);
        },

		async triggerBuilds(params: TriggerBuildsParams, options?: RequestOptions) {
			return apiConfig.httpClient.post(`/v1/businesses/${params.id}/trigger-builds`, {}, options);
		},

	async getSubscriptionPlans(params: GetSubscriptionPlansParams, options?: RequestOptions) {
		return apiConfig.httpClient.get('/v1/businesses/plans', options);
	},

        async getSubscription(params: GetSubscriptionParams, options?: RequestOptions) {
            return apiConfig.httpClient.get(`/v1/businesses/${apiConfig.businessId}/subscription`, options);
        },
        async updateSubscription(params: UpdateSubscriptionParams, options?: RequestOptions) {
            return apiConfig.httpClient.put(
                `/v1/businesses/${apiConfig.businessId}/subscription`,
                params,
                options
            );
        },
        async cancelSubscription(params: CancelSubscriptionParams, options?: RequestOptions) {
            return apiConfig.httpClient.delete(`/v1/businesses/${apiConfig.businessId}/subscription`, {
                ...options,
                params: { immediately: params.immediately || false }
            });
        },

        async reactivateSubscription(params: ReactivateSubscriptionParams, options?: RequestOptions) {
            return apiConfig.httpClient.post(
                `/v1/businesses/${apiConfig.businessId}/subscription/reactivate`,
                params,
                options
            );
        },
        async createPortalSession(params: CreatePortalSessionParams, options?: RequestOptions) {
            return apiConfig.httpClient.post(
                `/v1/businesses/${apiConfig.businessId}/subscription/portal`,
                params,
                options
            );
        },

        async inviteUser(params: InviteUserParams, options?: RequestOptions) {
            return apiConfig.httpClient.post(
                `/v1/businesses/${apiConfig.businessId}/invitation`,
                params,
                options
            );
        },
        async handleInvitation(params: HandleInvitationParams, options?: RequestOptions) {
            return apiConfig.httpClient.put(
                `/v1/businesses/${apiConfig.businessId}/invitation`,
                params,
                options
            );
        },

        async testWebhook(params: TestWebhookParams, options?: RequestOptions) {
            return apiConfig.httpClient.post(
                `/v1/businesses/${apiConfig.businessId}/webhooks/test`,
                params.webhook,
                options
            );
        },

	async getBusinessMedia(params: GetBusinessMediaParams2, options?: RequestOptions) {
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

	async setProviderSchedule(params: SetProviderScheduleParams, options?: RequestOptions) {
			const { id, ...payload } = params;
			return apiConfig.httpClient.put(
				`/v1/businesses/${id}/schedules`,
				payload,
				options
			);
		}
	};
};
