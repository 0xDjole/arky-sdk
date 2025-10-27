export const createRoleApi = (httpClient: any) => ({
	async createRole(roleData: any): Promise<void> {
		return httpClient.post(`/v1/roles`, roleData, {
			successMessage: 'Created successfully',
			errorMessage: 'Failed to create role'
		});
	},

	async updateRole(roleData: any) {
		return httpClient.put(`/v1/roles/${roleData.id}`, roleData, {
			successMessage: 'Updated successfully',
			errorMessage: 'Failed to update role'
		});
	},

	async deleteRole({ id }: { id: string }) {
		return httpClient.delete(`/v1/roles/${id}`, {
			successMessage: 'Deleted successfully',
			errorMessage: 'Failed to delete role'
		});
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
});
