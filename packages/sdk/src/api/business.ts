export const createBusinessApi = (httpClient: any) => ({
	async createBusiness(businessData: any): Promise<any> {
		return httpClient.post(`/v1/businesses`, businessData, {
			errorMessage: 'Failed to create business'
		});
	},

	async updateBusiness(businessData: any) {
		return httpClient.put(`/v1/businesses/${businessData.id}`, businessData, {
			successMessage: 'Updated successfully',
			errorMessage: 'Failed to update business'
		});
	},

	async deleteBusiness({ id }: { id: string }) {
		return httpClient.delete(`/v1/businesses/${id}`, {
			successMessage: 'Deleted successfully',
			errorMessage: 'Failed to delete business'
		});
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

	async triggerBuilds({ id }: { id: string }) {
		return httpClient.post(`/v1/businesses/${id}/trigger-builds`, {}, {
			successMessage: 'Build hooks triggered successfully',
			errorMessage: 'Failed to trigger builds'
		});
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
	}) {
		return httpClient.post(
			`/v1/businesses/${businessId}/subscription`,
			{
				businessId,
				planId,
				successUrl,
				cancelUrl
			},
			{
				successMessage: 'Redirecting to checkout...',
				errorMessage: 'Failed to start subscription process'
			}
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
	}) {
		return httpClient.put(
			`/v1/businesses/${businessId}/subscription`,
			{
				businessId,
				planId,
				successUrl,
				cancelUrl
			},
			{
				errorMessage: 'Failed to update subscription'
			}
		);
	},

	async cancelSubscription({
		businessId,
		immediately = false
	}: {
		businessId: string;
		immediately?: boolean;
	}) {
		return httpClient.delete(`/v1/businesses/${businessId}/subscription`, {
			params: { immediately },
			successMessage: immediately
				? 'Subscription canceled'
				: 'Subscription will cancel at period end',
			errorMessage: 'Failed to cancel subscription'
		});
	},

	async reactivateSubscription({ businessId }: { businessId: string }) {
		return httpClient.post(
			`/v1/businesses/${businessId}/subscription/reactivate`,
			{
				businessId
			},
			{
				successMessage: 'Subscription reactivated successfully',
				errorMessage: 'Failed to reactivate subscription'
			}
		);
	},

	async createPortalSession({
		businessId,
		returnUrl
	}: {
		businessId: string;
		returnUrl: string;
	}) {
		return httpClient.post(
			`/v1/businesses/${businessId}/subscription/portal`,
			{
				businessId,
				returnUrl
			},
			{
				successMessage: 'Redirecting to billing portal...',
				errorMessage: 'Failed to access billing portal'
			}
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
	}) {
		return httpClient.post(
			`/v1/businesses/${businessId}/invitation`,
			{ email, roleIds },
			{
				successMessage: 'Invitation sent successfully',
				errorMessage: 'Failed to send invitation'
			}
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

	async testWebhook({ businessId, webhook }: { businessId: string; webhook: any }) {
		return httpClient.post(`/v1/businesses/${businessId}/webhooks/test`, webhook, {
			successMessage: 'Webhook test triggered successfully',
			errorMessage: 'Failed to test webhook'
		});
	}
});
