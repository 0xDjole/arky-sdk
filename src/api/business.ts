import type { ApiConfig } from '../index';

export const createBusinessApi = (apiConfig: ApiConfig) => {
	const { httpClient } = apiConfig;

	return {
		async createBusiness(businessData: any, options?: any): Promise<any> {
		return httpClient.post(`/v1/businesses`, businessData, options);
	},

	async updateBusiness(businessData: any, options?: any) {
		return httpClient.put(`/v1/businesses/${businessData.id}`, businessData, options);
	},

	async deleteBusiness({ id }: { id: string }, options?: any) {
		return httpClient.delete(`/v1/businesses/${id}`, options);
	},

	async getBusiness({ id }: { id: string }) {
		return httpClient.get(`/v1/businesses/${id}`);
	},

	async getBusinesses() {
		return httpClient.get(`/v1/businesses`);
	},

	async getBusinessParents({ businessId }: { businessId: string }) {
		return httpClient.get(`/v1/businesses/${businessId}/parents`);
	},

	async triggerBuilds({ id }: { id: string }, options?: any) {
		return httpClient.post(`/v1/businesses/${id}/trigger-builds`, {}, options);
	},

	async getSubscriptionPlans() {
		return httpClient.get('/v1/businesses/plans');
	},

	async getSubscription({ businessId }: { businessId: string }) {
		return httpClient.get(`/v1/businesses/${businessId}/subscription`);
	},

	async createSubscription({
		businessId,
		planId,
		successUrl,
		cancelUrl
	}: {
		businessId: string;
		planId: string;
		successUrl: string;
		cancelUrl: string;
	}, options?: any) {
		return httpClient.post(
			`/v1/businesses/${businessId}/subscription`,
			{
				businessId,
				planId,
				successUrl,
				cancelUrl
			},
			options
		);
	},

	async updateSubscription({
		businessId,
		planId,
		successUrl,
		cancelUrl
	}: {
		businessId: string;
		planId: string;
		successUrl: string;
		cancelUrl: string;
	}, options?: any) {
		return httpClient.put(
			`/v1/businesses/${businessId}/subscription`,
			{
				businessId,
				planId,
				successUrl,
				cancelUrl
			},
			options
		);
	},

	async cancelSubscription({
		businessId,
		immediately = false
	}: {
		businessId: string;
		immediately?: boolean;
	}, options?: any) {
		return httpClient.delete(`/v1/businesses/${businessId}/subscription`, {
			params: { immediately },
			...options
		});
	},

	async reactivateSubscription({ businessId }: { businessId: string }, options?: any) {
		return httpClient.post(
			`/v1/businesses/${businessId}/subscription/reactivate`,
			{
				businessId
			},
			options
		);
	},

	async createPortalSession({
		businessId,
		returnUrl
	}: {
		businessId: string;
		returnUrl: string;
	}, options?: any) {
		return httpClient.post(
			`/v1/businesses/${businessId}/subscription/portal`,
			{
				businessId,
				returnUrl
			},
			options
		);
	},

	async inviteUser({
		businessId,
		email,
		roleIds = null
	}: {
		businessId: string;
		email: string;
		roleIds?: string[] | null;
	}, options?: any) {
		return httpClient.post(
			`/v1/businesses/${businessId}/invitation`,
			{ email, roleIds },
			options
		);
	},

	async handleInvitation({
		businessId,
		token,
		action
	}: {
		businessId: string;
		token: string;
		action: string;
	}) {
		return httpClient.put(`/v1/businesses/${businessId}/invitation`, { token, action });
	},

	async testWebhook({ businessId, webhook }: { businessId: string; webhook: any }, options?: any) {
		return httpClient.post(`/v1/businesses/${businessId}/webhooks/test`, webhook, options);
	}
	};
};
