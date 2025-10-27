export const createUserApi = (httpClient: any) => ({
	async updateUser({
		name,
		phoneNumbers = [],
		addresses = [],
		apiTokens = null,
		showSuccessMessage = true
	}: {
		name: string;
		phoneNumbers?: any[];
		addresses?: any[];
		apiTokens?: any;
		showSuccessMessage?: boolean;
	}) {
		const url = `/v1/users/update`;

		const body: any = {
			name,
			phoneNumbers,
			phoneNumber: null,
			addresses,
			apiTokens
		};

		const options: any = {
			errorMessage: 'Failed to update profile'
		};

		if (showSuccessMessage) {
			options.successMessage = 'Profile updated';
		}

		const response = await httpClient.put(url, body, options);
		return response;
	},

	async setRole({ userId, roleId }: { userId: string; roleId: string }) {
		const url = `/v1/users/set-role`;

		const body = {
			userId,
			roleId
		};

		const response = await httpClient.put(url, body);
		return response;
	},

	async getPermissions({ businessId }: { businessId: string }) {
		const response = await httpClient.get(`/v1/users/get-permissions`, {
			params: { businessId }
		});

		return response || [];
	},

	async getMe() {
		const response = await httpClient.get(`/v1/users/me`);
		return response || [];
	},

	async getUsers({
		limit = 10,
		cursor = null,
		query = '',
		roleIds = [],
		businessIds = [],
		owner = ''
	}: {
		limit?: number;
		cursor?: string | null;
		query?: string;
		roleIds?: string[];
		businessIds?: string[];
		owner?: string;
	} = {}) {
		return httpClient.get(`/v1/users/search`, {
			params: {
				limit,
				owner: owner || undefined,
				businessIds: businessIds?.length ? businessIds : undefined,
				query: query || undefined,
				roleIds: roleIds?.length ? roleIds : undefined,
				cursor: cursor || undefined
			}
		});
	},

	async confirmUser({ token }: { token: string }) {
		const body = { token };
		return httpClient.put(`/v1/users/confirm`, body);
	},

	async getLoginUrl({
		provider,
		originUrl,
		redirectUrl
	}: {
		provider: string;
		originUrl: string;
		redirectUrl: string;
	}) {
		const response = await httpClient.get(`/v1/users/login/url`, {
			params: { provider, originUrl, redirectUrl }
		});

		return response;
	},

	async loginUser({ email, password }: { email: string; password: string }) {
		const result = await httpClient.post<void>(
			`/v1/users/login`,
			{
				email,
				password,
				provider: 'EMAIL'
			},
			{
				errorMessage: 'Failed to login'
			}
		);

		return result;
	},

	async oAuthLoginUser({
		code,
		provider,
		originUrl
	}: {
		code: string;
		provider: string;
		originUrl: string;
	}) {
		const result = await httpClient.post<void>(`/v1/users/login`, {
			code,
			provider,
			originUrl
		});

		return result;
	},

	async forgotPassword({ email }: { email: string }) {
		const result = await httpClient.post('/v1/users/forgot-password', {
			email
		});

		return result;
	},

	async resetForgotPassword({ token, password }: { token: string; password: string }) {
		const result = await httpClient.post('/v1/users/reset-forgot-password', {
			token,
			password
		});

		return result;
	},

	async registerUser({ email, password }: { email: string; password: string }) {
		const result = await httpClient.post<void>(
			'/v1/users/register',
			{
				email,
				password,
				provider: 'EMAIL_REGISTER'
			},
			{
				errorMessage: 'Failed to register'
			}
		);

		return result;
	}
});
