import {
	convertServerErrorToRequestError,
	type ServerError,
	type RequestError
} from '../utils/errors';
import { buildQueryString, type QueryParams } from '../utils/queryParams';

export interface AuthTokens {
	accessToken: string;
	refreshToken?: string;
	provider?: string;
	expiresAt?: number;
	userId?: string;
}

export interface HttpClientConfig {
	baseUrl: string;

	storageUrl?: string;

	businessId: string;

	getTokens: () => Promise<AuthTokens> | AuthTokens;

	setTokens: (tokens: AuthTokens) => void;

	autoGuest?: boolean;

	onAuthFailure: () => void;

	navigate?: (path: string) => void;

	loginFallbackPath?: string;

	notify?: (opts: { message: string; type: 'error' | 'success' }) => void;

	isAuthenticated?: () => boolean;

	logout?: () => void;

	setUserToken?: (userToken: any) => void;
}

export function createHttpClient(cfg: HttpClientConfig) {
	const refreshEndpoint = `${cfg.baseUrl}/v1/users/refresh-access-token`;

	async function request<T>(
		method: string,
		path: string,
		body?: any,
		options?: {
			successMessage?: string;
			errorMessage?: string;
			headers?: Record<string, string>;
			transformRequest?: (data: any) => any;
			params?: QueryParams;
		}
	): Promise<T> {
		if (options?.transformRequest) {
			body = options.transformRequest(body);
		}

		const headers: Record<string, string> = {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(options?.headers || {})
		};

		let { accessToken, refreshToken, provider, expiresAt } = await cfg.getTokens();

		const nowSec = Date.now() / 1000;
		if (expiresAt && nowSec > expiresAt) {
			if (refreshToken) {
				const refRes = await fetch(refreshEndpoint, {
					method: 'POST',
					headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
					body: JSON.stringify({ provider, refreshToken })
				});

				if (refRes.ok) {
					const data = await refRes.json();
					cfg.setTokens(data);
					accessToken = data.accessToken;
				} else {
					cfg.onAuthFailure();
					if (cfg.loginFallbackPath) {
						cfg.navigate?.(cfg.loginFallbackPath);
					}
					const err: any = new Error('Error refreshing token');
					err.name = 'ApiError';
					err.statusCode = 401;
					throw err;
				}
			} else {
				cfg.onAuthFailure();
				if (cfg.loginFallbackPath) {
					cfg.navigate?.(cfg.loginFallbackPath);
				}
				const err: any = new Error('No refresh token');
				err.name = 'ApiError';
				err.statusCode = 401;
				throw err;
			}
		}

		if (accessToken) {
			headers['Authorization'] = `Bearer ${accessToken}`;
		}

		const finalPath = options?.params ? path + buildQueryString(options.params) : path;

		const fetchOpts: any = { method, headers };
		if (!['GET', 'DELETE'].includes(method) && body !== undefined) {
			fetchOpts.body = JSON.stringify(body);
		}

		let res: Response;
		let data: any;

		try {
			const fullUrl = `${cfg.baseUrl}${finalPath}`;
		console.log("[SDK] Fetching:", method, fullUrl, fetchOpts);
		res = await fetch(fullUrl, fetchOpts);
			data = await res.json();
		} catch (error) {
			const err = new Error(error instanceof Error ? error.message : 'Network request failed');
			err.name = 'NetworkError';
			throw err;
		}

		if (!res.ok) {
			const serverErr: ServerError = data;
			const reqErr = convertServerErrorToRequestError(serverErr);
			if (options?.errorMessage && cfg.notify) {
				cfg.notify({ message: options.errorMessage, type: 'error' });
			}
			const err: any = new Error(serverErr.message || 'Request failed');
			err.name = 'ApiError';
			err.statusCode = serverErr.statusCode;
			err.validationErrors = reqErr.validationErrors;
			throw err;
		}

		if (options?.successMessage && cfg.notify) {
			cfg.notify({ message: options.successMessage, type: 'success' });
		}
		return data as T;
	}

	return {
		get: <T>(path: string, opts?: any) => request<T>('GET', path, undefined, opts),
		post: <T>(path: string, body: any, opts?: any) => request<T>('POST', path, body, opts),
		put: <T>(path: string, body: any, opts?: any) => request<T>('PUT', path, body, opts),
		patch: <T>(path: string, body: any, opts?: any) => request<T>('PATCH', path, body, opts),
		delete: <T>(path: string, opts?: any) => request<T>('DELETE', path, undefined, opts)
	};
}
