import type { ApiConfig } from '../index';

export const createRoleApi = (apiConfig: ApiConfig) => {
	const { httpClient } = apiConfig;

	return {
		async createRole(roleData: any, options?: any): Promise<void> {
		return httpClient.post(`/v1/roles`, roleData, options);
	},

	async updateRole(roleData: any, options?: any) {
		return httpClient.put(`/v1/roles/${roleData.id}`, roleData, options);
	},

	async deleteRole({ id }: { id: string }, options?: any) {
		return httpClient.delete(`/v1/roles/${id}`, options);
	},

	async getRole({ id }: { id: string }) {
		return httpClient.get(`/v1/roles/${id}`);
	},

	async getRoles({
		businessId,
		action = 'READ'
	}: {
		businessId?: string;
		action?: string;
	} = {}) {
		return httpClient.get(`/v1/roles`, {
			params: {
				businessId: businessId || undefined,
				action: action || undefined
			}
		});
	},

	async getRoleParents({ roleId }: { roleId: string }) {
		return httpClient.get(`/v1/roles/${roleId}/parents`);
	},

	async getInvoice({
		roleId,
		from,
		to,
		language
	}: {
		roleId: string;
		from: string;
		to: string;
		language: string;
	}) {
		return httpClient.get(`/v1/roles/${roleId}/generate-invoice`, {
			params: { from, to, language }
		});
	}
	};
};
