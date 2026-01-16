import {
	convertServerErrorToRequestError,
	type ServerError
} from '../utils/errors';
import { buildQueryString, type QueryParams } from '../utils/queryParams';

export interface AuthTokens {
	accessToken: string;
	refreshToken?: string;
	expiresAt?: number;
	accountId?: string;
	isGuest?: boolean;
}

export interface HttpClientConfig {
	baseUrl: string;

	businessId: string;

	getToken: () => Promise<AuthTokens> | AuthTokens;

	setToken: (tokens: AuthTokens) => void;

	autoGuest?: boolean;

	logout: () => void;

	navigate?: (path: string) => void;

	loginFallbackPath?: string;

	isAuthenticated?: () => boolean;
}

type SuccessCallback<T = any> = (ctx: {
	data: T;
	method: string;
	url: string;
	status: number;
	request?: any;
	durationMs?: number;
	requestId?: string | null;
}) => void | Promise<void>;

type ErrorCallback = (ctx: {
	error: any;
	method: string;
	url: string;
	status?: number;
	request?: any;
	response?: any;
	durationMs?: number;
	requestId?: string | null;
	aborted?: boolean;
}) => void | Promise<void>;

export function createHttpClient(cfg: HttpClientConfig) {
	const refreshEndpoint = `${cfg.baseUrl}/v1/auth/refresh`;
	let refreshPromise: Promise<void> | null = null;

	async function ensureFreshToken() {
		if (refreshPromise) {
			return refreshPromise;
		}

		refreshPromise = (async () => {
			const { refreshToken } = await cfg.getToken();
			if (!refreshToken) {
				cfg.logout();
				const err: any = new Error('No refresh token available');
				err.name = 'ApiError';
				err.statusCode = 401;
				throw err;
			}

			const refRes = await fetch(refreshEndpoint, {
				method: 'POST',
				headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
				body: JSON.stringify({ refreshToken })
			});

			if (!refRes.ok) {
				cfg.logout();
				const err: any = new Error('Token refresh failed');
				err.name = 'ApiError';
				err.statusCode = 401;
				throw err;
			}

			const data = await refRes.json();
			cfg.setToken(data);
		})().finally(() => {
			refreshPromise = null;
		});

		return refreshPromise;
	}

	async function request<T>(
		method: string,
		path: string,
		body?: any,
		options?: {
			onSuccess?: SuccessCallback<T>;
			onError?: ErrorCallback;
			headers?: Record<string, string>;
			transformRequest?: (data: any) => any;
			params?: QueryParams;
			_retried?: boolean;
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

	let { accessToken, expiresAt } = await cfg.getToken();

	const nowSec = Date.now() / 1000;
	if (expiresAt && nowSec > expiresAt) {
		await ensureFreshToken();
		const tokens = await cfg.getToken();
		accessToken = tokens.accessToken;
	}

	if (accessToken) {
		headers['Authorization'] = `Bearer ${accessToken}`;
	}

		const finalPath = options?.params ? path + buildQueryString(options.params) : path;

		const fetchOpts: any = { method, headers };
		if (!['GET', 'DELETE'].includes(method) && body !== undefined) {
			fetchOpts.body = JSON.stringify(body);
		}

		const fullUrl = `${cfg.baseUrl}${finalPath}`;
		let res: Response;
		let data: any;
		const startedAt = Date.now();

		try {
			res = await fetch(fullUrl, fetchOpts);
		} catch (error) {
			const err: any = new Error(error instanceof Error ? error.message : 'Network request failed');
			err.name = 'NetworkError';
			err.method = method;
			err.url = fullUrl;
if (options?.onError && method !== 'GET') {
				Promise.resolve(
					options.onError({ error: err, method, url: fullUrl, aborted: false })
				).catch(() => {});
			}
			throw err;
		}

		// Handle 401: refresh and retry once
		if (res.status === 401 && !options?.['_retried']) {
			try {
				await ensureFreshToken();
				const tokens = await cfg.getToken();
				headers['Authorization'] = `Bearer ${tokens.accessToken}`;
				fetchOpts.headers = headers;
				return request<T>(method, path, body, { ...options, _retried: true });
			} catch (refreshError) {
				// Fall through to normal error handling
			}
		}

		// Safe JSON parsing: handle 204, empty body, non-JSON
		try {
			const contentLength = res.headers.get('content-length');
			const contentType = res.headers.get('content-type');
			if (res.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
				data = {};
			} else {
				data = await res.json();
			}
		} catch (error) {
			const err: any = new Error('Failed to parse response');
			err.name = 'ParseError';
			err.method = method;
			err.url = fullUrl;
			err.status = res.status;
if (options?.onError && method !== 'GET') {
				Promise.resolve(
					options.onError({ error: err, method, url: fullUrl, status: res.status })
				).catch(() => {});
			}
			throw err;
		}

		if (!res.ok) {
			const serverErr: ServerError = data;
			const reqErr = convertServerErrorToRequestError(serverErr);
			const err: any = new Error(serverErr.message || 'Request failed');
			err.name = 'ApiError';
			err.statusCode = serverErr.statusCode || res.status;
			err.validationErrors = reqErr.validationErrors;
			err.method = method;
			err.url = fullUrl;
			const requestId = res.headers.get('x-request-id') || res.headers.get('request-id');
			if (requestId) err.requestId = requestId;
if (options?.onError && method !== 'GET') {
				Promise.resolve(
					options.onError({
						error: err,
						method,
						url: fullUrl,
						status: res.status,
						response: serverErr,
						requestId: requestId || null,
						durationMs: Date.now() - startedAt
					})
				).catch(() => {});
			}
			throw err;
		}

if (options?.onSuccess && method !== 'GET') {
			const requestId = res.headers.get('x-request-id') || res.headers.get('request-id');
			Promise.resolve(
				options.onSuccess({
					data: data as T,
					method,
					url: fullUrl,
					status: res.status,
					requestId: requestId || null,
					durationMs: Date.now() - startedAt
				})
			).catch(() => {});
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
