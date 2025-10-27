import type { ApiConfig } from '../index';

export const createUserApi = (apiConfig: ApiConfig) => {
	const { httpClient, setTokens } = apiConfig;

	return {
		async updateUser({
		name,
		phoneNumbers = [],
		addresses = [],
		apiTokens = null
	}: {
		name: string;
		phoneNumbers?: any[];
		addresses?: any[];
		apiTokens?: any;
	}, options?: any) {
		const url = `/v1/users/update`;

		const body: any = {
			name,
			phoneNumbers,
			phoneNumber: null,
			addresses,
			apiTokens
		};

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

	async loginUser({ email, password }: { email: string; password: string }, options?: any) {
		const result = await httpClient.post(
			`/v1/users/login`,
			{
				email,
				password,
				provider: 'EMAIL'
			},
			options
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
		const result = await httpClient.post(`/v1/users/login`, {
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

	async registerUser({ email, password }: { email: string; password: string }, options?: any) {
		const result = await httpClient.post(
			'/v1/users/register',
			{
				email,
				password,
				provider: 'EMAIL_REGISTER'
			},
			options
		);

		return result;
	},

	async getGuestToken({ existingToken }: { existingToken?: string }, options?: any): Promise<string> {
		if (existingToken) {
			return existingToken;
		}

		try {
			const result = await httpClient.post('/v1/users/login', {
				provider: 'GUEST'
			}, options);
			const token = result.accessToken || result.token || '';
			if (token) {
				setTokens(result);
			}
			return token;
		} catch (error) {
			console.error('Failed to get guest token:', error);
			return '';
		}
	},

	async updateProfilePhone({ phoneNumber }: { phoneNumber: string }, options?: any) {
		return httpClient.put('/v1/users/update', {
			phoneNumber,
			phoneNumbers: [],
			addresses: []
		}, options);
	},

	async verifyPhoneCode({ phoneNumber, code }: { phoneNumber: string; code: string }, options?: any) {
		return httpClient.put('/v1/users/confirm/phone-number', {
			phoneNumber,
			code
		}, options);
	}
	};
};
