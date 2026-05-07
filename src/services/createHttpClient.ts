import {
	convertServerErrorToRequestError,
	type ServerError
} from '../utils/errors';
import { buildQueryString, type QueryParams } from '../utils/queryParams';

export interface AuthTokens {
	access_token: string;
	refresh_token?: string;
	access_expires_at?: number;
	account_id?: string;
}

export interface RequestSuccessContext<T = unknown> {
	data: T;
	method: string;
	url: string;
	status: number;
	request?: unknown;
	duration_ms?: number;
	request_id?: string | null;
}

export interface RequestErrorContext {
	error: unknown;
	method: string;
	url: string;
	status?: number;
	request?: unknown;
	response?: unknown;
	duration_ms?: number;
	request_id?: string | null;
	aborted?: boolean;
}

export interface RequestOptions<T = unknown> {
	headers?: Record<string, string>;
	params?: QueryParams | Record<string, any>;
	transformRequest?: (data: unknown) => unknown;
	onSuccess?: (ctx: RequestSuccessContext<T>) => void | Promise<void>;
	onError?: (ctx: RequestErrorContext) => void | Promise<void>;
}

export interface HttpClient {
	get<T>(path: string, opts?: RequestOptions<T>): Promise<T>;
	post<T>(path: string, body: unknown, opts?: RequestOptions<T>): Promise<T>;
	put<T>(path: string, body: unknown, opts?: RequestOptions<T>): Promise<T>;
	patch<T>(path: string, body: unknown, opts?: RequestOptions<T>): Promise<T>;
	delete<T>(path: string, opts?: RequestOptions<T>): Promise<T>;
}

const TOKEN_KEY = "arky_token";
const LEGACY_KEYS = ["arky_refresh", "arky_expires_at"];

export function defaultGetToken(): AuthTokens {
	if (typeof window === "undefined") return { access_token: "" };
	return {
		access_token: localStorage.getItem(TOKEN_KEY) || "",
	};
}

export function defaultSetToken(tokens: AuthTokens): void {
	if (typeof window === "undefined") return;
	if (tokens.access_token) {
		localStorage.setItem(TOKEN_KEY, tokens.access_token);
	} else {
		localStorage.removeItem(TOKEN_KEY);
	}
	LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function defaultLogout(): void {
	if (typeof window === "undefined") return;
	localStorage.removeItem(TOKEN_KEY);
	LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function defaultIsAuthenticated(): boolean {
	if (typeof window === "undefined") return false;
	const token = localStorage.getItem(TOKEN_KEY) || "";
	return token.startsWith("customer_") || token.startsWith("account_");
}

export interface HttpClientConfig {
	baseUrl: string;

	storeId: string;

	refreshPath?: string | (() => string);

	getToken?: () => Promise<AuthTokens> | AuthTokens;

	setToken?: (tokens: AuthTokens) => void;

	logout?: () => void;

	navigate?: (path: string) => void;

	loginFallbackPath?: string;

	isAuthenticated?: () => boolean;
}

type SuccessCallback<T = unknown> = (ctx: RequestSuccessContext<T>) => void | Promise<void>;

type ErrorCallback = (ctx: RequestErrorContext) => void | Promise<void>;

export function createHttpClient(cfg: HttpClientConfig): HttpClient {
	const getToken = cfg.getToken || defaultGetToken;
	const setToken = cfg.setToken || defaultSetToken;
	const logout = cfg.logout || defaultLogout;

	let refreshPromise: Promise<void> | null = null;

	function getRefreshEndpoint() {
		const refreshPath = typeof cfg.refreshPath === "function"
			? cfg.refreshPath()
			: cfg.refreshPath || '/v1/auth/refresh';
		return `${cfg.baseUrl}${refreshPath}`;
	}

	async function ensureFreshToken() {
		if (refreshPromise) {
			return refreshPromise;
		}

		refreshPromise = (async () => {
			const { refresh_token } = await getToken();
			if (!refresh_token) {
				logout();
				const err: any = new Error('No refresh token available');
				err.name = 'ApiError';
				err.statusCode = 401;
				throw err;
			}

			const refRes = await fetch(getRefreshEndpoint(), {
				method: 'POST',
				headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
				body: JSON.stringify({ refresh_token })
			});

			if (!refRes.ok) {
				logout();
				const err: any = new Error('Token refresh failed');
				err.name = 'ApiError';
				err.statusCode = 401;
				throw err;
			}

			const data = await refRes.json();
			setToken(data);
		})().finally(() => {
			refreshPromise = null;
		});

		return refreshPromise;
	}

	async function request<T>(
		method: string,
		path: string,
		body?: unknown,
		options?: RequestOptions<T> & { _retried?: boolean }
	): Promise<T> {
		if (options?.transformRequest) {
			body = options.transformRequest(body);
		}

		const headers: Record<string, string> = {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(options?.headers || {})
		};

	let { access_token, access_expires_at } = await getToken();

	const nowSec = Date.now() / 1000;
	if (access_expires_at && nowSec > access_expires_at) {
		await ensureFreshToken();
		const tokens = await getToken();
		access_token = tokens.access_token;
	}

	if (access_token) {
		headers['Authorization'] = `Bearer ${access_token}`;
	}

		const finalPath = options?.params ? path + buildQueryString(options.params as QueryParams) : path;

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

		if (res.status === 401 && !options?.['_retried']) {
			try {
				await ensureFreshToken();
				const tokens = await getToken();
				headers['Authorization'] = `Bearer ${tokens.access_token}`;
				fetchOpts.headers = headers;
				return request<T>(method, path, body, { ...options, _retried: true });
			} catch (refreshError) {
				throw refreshError;
			}
		}

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
						request_id: requestId || null,
						duration_ms: Date.now() - startedAt
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
					request_id: requestId || null,
					duration_ms: Date.now() - startedAt
				})
			).catch(() => {});
		}
		return data as T;
	}

	return {
		get: <T>(path: string, opts?: RequestOptions<T>) => request<T>('GET', path, undefined, opts),
		post: <T>(path: string, body: unknown, opts?: RequestOptions<T>) => request<T>('POST', path, body, opts),
		put: <T>(path: string, body: unknown, opts?: RequestOptions<T>) => request<T>('PUT', path, body, opts),
		patch: <T>(path: string, body: unknown, opts?: RequestOptions<T>) => request<T>('PATCH', path, body, opts),
		delete: <T>(path: string, opts?: RequestOptions<T>) => request<T>('DELETE', path, undefined, opts)
	};
}
