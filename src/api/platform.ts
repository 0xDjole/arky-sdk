import type { ApiConfig } from '../index';
import type { RequestOptions } from '../types/api';

export interface IntegrationOperation {
	name: string;
	value: string;
	description?: string;
	method: 'get' | 'post' | 'put' | 'patch' | 'delete';
	url: string;
	body?: Record<string, unknown> | string;
	headers?: Record<string, string>;
}

export interface IntegrationResource {
	name: string;
	value: string;
	operations: IntegrationOperation[];
}

export interface IntegrationService {
	id: string;
	name: string;
	description: string;
	icon: string;
	color: string;
	category:
		| 'ai'
		| 'communication'
		| 'email'
		| 'productivity'
		| 'payments'
		| 'crm'
		| 'ecommerce'
		| 'developer'
		| 'storage'
		| 'analytics'
		| 'deploy'
		| 'core';
	configurationRequired: boolean;
	website?: string;
	docsUrl?: string;
	urlPatterns: string[];
	resources: IntegrationResource[];
	triggers?: Array<{
		name: string;
		value: string;
		description: string;
		webhookType: 'incoming' | 'polling';
	}>;
}

export type WorkflowTool = IntegrationService;

export const createPlatformApi = (apiConfig: ApiConfig) => {
	return {
		async getCurrencies(options?: RequestOptions): Promise<string[]> {
			return apiConfig.httpClient.get<string[]>('/v1/platform/currencies', options);
		},
		async getIntegrationServices(options?: RequestOptions): Promise<IntegrationService[]> {
			return apiConfig.httpClient.get<IntegrationService[]>('/v1/platform/integration-services', options);
		},
		async getWorkflowTools(options?: RequestOptions): Promise<WorkflowTool[]> {
			return apiConfig.httpClient.get<WorkflowTool[]>('/v1/platform/workflow-tools', options);
		},
		async getWebhookEvents(options?: RequestOptions): Promise<{ data: string[] }> {
			return apiConfig.httpClient.get<{ data: string[] }>('/v1/platform/events', options);
		},
		data: {
			async scan(params: { key: string; limit?: number }, options?: RequestOptions): Promise<{ value: Array<{ key: string; value: unknown }> }> {
				return apiConfig.httpClient.get<{ value: Array<{ key: string; value: unknown }> }>('/v1/platform/data', {
					...options,
					params: { key: params.key, limit: params.limit ?? 200 },
				});
			},
			async put(params: { key: string; value: unknown; oldKey?: string }, options?: RequestOptions): Promise<{ ok: boolean }> {
				return apiConfig.httpClient.post<{ ok: boolean }>('/v1/platform/data', params, options);
			},
			async delete(params: { key: string }, options?: RequestOptions): Promise<{ ok: boolean }> {
				return apiConfig.httpClient.delete<{ ok: boolean }>('/v1/platform/data', {
					...options,
					params: { key: params.key },
				});
			},
		},
		async runScript(
			params: { name: string; value?: string; username?: string; password?: string },
			options?: RequestOptions,
		): Promise<{ success: boolean; message: string }> {
			return apiConfig.httpClient.post<{ success: boolean; message: string }>('/v1/platform/scripts', params, options);
		},
	};
};
