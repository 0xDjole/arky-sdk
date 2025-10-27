import { getGlobalConfig } from '../config';
import type { Newsletter, PaginatedResponse, Payment } from '../types';

export interface NewsletterFindPayload {
	business_id: string;
}

export interface NewsletterResponse {
	data: Newsletter[];
	meta?: {
		total: number;
		page: number;
		per_page: number;
	};
}

export interface NewsletterSubscribePayload {
	newsletterId: string;
	email: string;
	customerId?: string;
	payment?: Payment; // NEW: For paid newsletter subscriptions
}

export const newsletterApi = {
	async find(payload: NewsletterFindPayload): Promise<PaginatedResponse<Newsletter>> {
		const config = getGlobalConfig();
		const params = new URLSearchParams({
			businessId: payload.business_id,
		});

		const url = `${config.apiUrl}/v1/newsletters?${params.toString()}`;

		const response = await fetch(url);
		
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const backendResponse = await response.json();
		
		// Backend returns {items: [], cursor: null}, we need {data: [], meta: {...}}
		return {
			data: backendResponse.items || [],
			meta: {
				total: backendResponse.items?.length || 0,
				page: 1,
				per_page: backendResponse.items?.length || 0,
			}
		};
	},

	async get(id: string): Promise<Newsletter> {
		const config = getGlobalConfig();
		const url = `${config.apiUrl}/v1/newsletters/${id}`;

		const response = await fetch(url);
		
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	},


	async subscribe(payload: NewsletterSubscribePayload) {
		try {
			const config = getGlobalConfig();
			const url = `${config.apiUrl}/v1/newsletters/${payload.newsletterId}/subscribe`;

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					newsletterId: payload.newsletterId,
					email: payload.email,
					market: "US", // Backend resolves currency from market
					...(payload.customerId && { customerId: payload.customerId }),
					...(payload.payment && { payment: payload.payment }),
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return {
				success: true,
				data,
			};
		} catch (error) {
			console.error('Newsletter subscription error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to subscribe to newsletter',
			};
		}
	},
};