import assert from 'node:assert/strict';
import test from 'node:test';

import { createAdmin } from '../dist/admin.js';
import { createStorefront } from '../dist/storefront.js';

const baseUrl = 'https://api.example.test';
const defaultStoreId = 'store-contract';
const operationId = '018f477d-1cae-7c12-bf12-123456789abc';

function jsonResponse(body) {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
}

function admin() {
	return createAdmin({
		baseUrl,
		storeId: defaultStoreId,
		apiToken: 'contract-token'
	});
}

async function captureFetch(responseBody, request) {
	const calls = [];
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url, init = {}) => {
		calls.push({
			url: String(url),
			method: init.method,
			body: init.body === undefined ? undefined : JSON.parse(init.body)
		});
		return jsonResponse(responseBody);
	};

	try {
		return { calls, result: await request() };
	} finally {
		globalThis.fetch = originalFetch;
	}
}

test('subscription checkout sends the stable operation and explicit duplicate-risk decision', async () => {
	const response = {
		operation_id: operationId,
		status: 'processing',
		error: null,
		checkout_url: 'https://checkout.stripe.test/session',
		subscription: null
	};
	const { calls, result } = await captureFetch(response, () =>
		admin().store.subscription.subscribe({
			store_id: 'store-subscription',
			operation_id: operationId,
			accept_duplicate_risk: false,
			plan_id: 'pro',
			action: 'select_plan',
			success_url: 'https://merchant.test/success',
			cancel_url: 'https://merchant.test/cancel'
		})
	);

	assert.deepEqual(calls, [
		{
			url: `${baseUrl}/v1/stores/store-subscription/subscribe`,
			method: 'PUT',
			body: {
				operation_id: operationId,
				accept_duplicate_risk: false,
				plan_id: 'pro',
				action: 'select_plan',
				success_url: 'https://merchant.test/success',
				cancel_url: 'https://merchant.test/cancel'
			}
		}
	]);
	assert.deepEqual(result, response);
});

test('subscription checkout rejects server evidence for another operation', async () => {
	const arky = admin();
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () =>
		jsonResponse({
			operation_id: '018f477d-1cae-7c12-bf12-000000000000',
			status: 'succeeded',
			error: null,
			checkout_url: null,
			subscription: null
		});

	try {
		await assert.rejects(
			arky.store.subscription.subscribe({
				store_id: 'store-subscription',
				operation_id: operationId,
				accept_duplicate_risk: false,
				plan_id: 'pro',
				action: 'select_plan',
				success_url: 'https://merchant.test/success',
				cancel_url: 'https://merchant.test/cancel'
			}),
			/response did not match the requested operation_id/
		);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test('storefront support keeps the capability token in one forced header for the current store', async () => {
	const supportToken = 'a'.repeat(64);
	const storefront = createStorefront({
		baseUrl,
		storeId: 'store-before-switch'
	});
	storefront.setStoreId('store-after-switch');
	const calls = [];
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url, init = {}) => {
		calls.push({
			url: String(url),
			method: init.method,
			headers: init.headers,
			body: init.body === undefined ? undefined : JSON.parse(init.body)
		});
		if (calls.length === 1) {
			return jsonResponse({
				conversation: { id: 'conversation-contract', status: 'active' },
				messages: [],
				support_token: supportToken
			});
		}
		return jsonResponse({
			conversation: { id: 'conversation-contract', status: 'active' },
			messages: []
		});
	};

	try {
		const started = await storefront.support.startConversation({ agent_key: 'default' });
		assert.equal(started.support_token, supportToken);
		await storefront.support.sendMessage(
			{
				conversation_id: 'conversation-contract',
				support_token: supportToken,
				operation_id: operationId,
				input: { type: 'text', content: 'Help' }
			},
			{
				headers: {
					'x-arky-support-token': 'caller-must-not-override',
					'X-Test-Header': 'preserved'
				}
			}
		);
		await storefront.support.getConversation(
			{
				conversation_id: 'conversation-contract',
				support_token: supportToken,
				message_limit: 25
			},
			{ headers: { 'X-Arky-Support-Token': 'caller-must-not-override' } }
		);
		await assert.rejects(
			storefront.support.getConversation({
				conversation_id: 'conversation-contract',
				support_token: supportToken.toUpperCase()
			}),
			/lowercase hexadecimal token/
		);
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.equal(calls.length, 3, 'invalid support credentials must execute no HTTP request');
	assert.deepEqual(calls[0].body, {
		agent_key: 'default',
		store_id: 'store-after-switch'
	});
	assert.equal(
		calls[0].url,
		`${baseUrl}/v1/storefront/store-after-switch/support/conversations`
	);
	assert.equal(
		Object.keys(calls[0].headers).some(
			(name) => name.toLowerCase() === 'x-arky-support-token'
		),
		false
	);
	assert.equal('support_token' in calls[1].body, false);
	assert.deepEqual(calls[1].body, {
		conversation_id: 'conversation-contract',
		operation_id: operationId,
		input: { type: 'text', content: 'Help' },
		store_id: 'store-after-switch'
	});
	assert.equal(calls[1].url.includes(supportToken), false);
	assert.equal(calls[2].url.includes(supportToken), false);
	assert.equal(calls[2].url.includes('store_id=store-after-switch'), true);
	assert.equal(calls[2].body, undefined);

	for (const call of calls.slice(1)) {
		const supportHeaders = Object.entries(call.headers).filter(
			([name]) => name.toLowerCase() === 'x-arky-support-token'
		);
		assert.deepEqual(supportHeaders, [['X-Arky-Support-Token', supportToken]]);
	}
	assert.equal(calls[1].headers['X-Test-Header'], 'preserved');
});

test('provider-effect APIs send one operation identity and return direct server evidence', async (t) => {
	const send = {
		type: 'contact_store_notification',
		data: {
			store_id: defaultStoreId,
			mailbox_id: 'mailbox-contract',
			template_id: 'template-contract',
			recipients: ['owner@example.test']
		}
	};
	const cases = [
		{
			name: 'webhook delivery',
			response: {
				operation_id: operationId,
				status: 'unknown',
				provider_status_code: null,
				error: 'Provider outcome is unknown'
			},
			request: (arky) =>
				arky.store.webhook.test({ operation_id: operationId, webhook_id: 'webhook-contract' }),
			expected: {
				url: `${baseUrl}/v1/stores/${defaultStoreId}/webhooks/test`,
				method: 'POST',
				body: { operation_id: operationId, webhook_id: 'webhook-contract' }
			}
		},
		{
			name: 'email delivery',
			response: { sent: 1, messages: [] },
			request: (arky) => arky.notification.email.send({ operation_id: operationId, send }),
			expected: {
				url: `${baseUrl}/v1/notifications/email`,
				method: 'POST',
				body: { operation_id: operationId, send }
			}
		},
		{
			name: 'order refund',
			response: { refund_id: operationId, amount: 1250, status: 'requested' },
			request: (arky) =>
				arky.eshop.order.processRefund({
					id: 'order-refund-contract',
					amount: 1250,
					operation_id: operationId
				}),
			expected: {
				url: `${baseUrl}/v1/stores/${defaultStoreId}/orders/order-refund-contract/refund`,
				method: 'POST',
				body: { amount: 1250, operation_id: operationId }
			}
		},
		{
			name: 'contact-list membership refund',
			response: { refund_id: operationId, amount: 500, status: 'requested' },
			request: (arky) =>
				arky.crm.contactList.memberships.refund({
					store_id: defaultStoreId,
					contact_list_id: 'list-refund-contract',
					membership_id: 'membership-refund-contract',
					amount: 500,
					operation_id: operationId
				}),
			expected: {
				url: `${baseUrl}/v1/stores/${defaultStoreId}/contact-lists/list-refund-contract/memberships/membership-refund-contract/refund`,
				method: 'POST',
				body: { amount: 500, operation_id: operationId }
			}
		},
		{
			name: 'shipping-label purchase',
			response: {
				operation_id: operationId,
				shipment_id: 'shipment-contract',
				tracking_number: null,
				tracking_url: null,
				label_url: null
			},
			request: (arky) =>
				arky.eshop.order.ship({
					order_id: 'order-shipping-contract',
					operation_id: operationId,
					rate_id: 'signed-rate-quote',
					carrier: 'USPS',
					service: 'usps_priority',
					location_id: 'location-contract',
					fulfillment_order_id: null,
					lines: [
						{
							order_item_id: 'item-contract',
							fulfillment_order_line_id: null,
							quantity: 2
						}
					]
				}),
			expected: {
				url: `${baseUrl}/v1/stores/${defaultStoreId}/orders/order-shipping-contract/ship`,
				method: 'POST',
				body: {
					operation_id: operationId,
					rate_id: 'signed-rate-quote',
					carrier: 'USPS',
					service: 'usps_priority',
					location_id: 'location-contract',
					fulfillment_order_id: null,
					lines: [
						{
							order_item_id: 'item-contract',
							fulfillment_order_line_id: null,
							quantity: 2
						}
					]
				}
			}
		}
	];

	for (const contract of cases) {
		await t.test(contract.name, async () => {
			const { calls, result } = await captureFetch(contract.response, () =>
				contract.request(admin())
			);
			assert.deepEqual(calls, [contract.expected]);
			assert.deepEqual(result, contract.response);
			assert.equal('ok' in result, false);
			assert.equal('val' in result, false);
		});
	}
});

test('money and shipping clients reject evidence for any other operation', async (t) => {
	const otherOperationId = '018f477d-1cae-7c12-bf12-000000000000';
	const cases = [
		{
			name: 'order refund',
			response: { refund_id: otherOperationId, amount: 1250, status: 'succeeded' },
			request: (arky) =>
				arky.eshop.order.processRefund({
					id: 'order-refund-contract',
					amount: 1250,
					operation_id: operationId
				}),
			error: /Refund response did not match the requested operation_id/
		},
		{
			name: 'contact-list membership refund',
			response: { refund_id: otherOperationId, amount: 500, status: 'succeeded' },
			request: (arky) =>
				arky.crm.contactList.memberships.refund({
					store_id: defaultStoreId,
					contact_list_id: 'list-refund-contract',
					membership_id: 'membership-refund-contract',
					amount: 500,
					operation_id: operationId
				}),
			error: /Membership refund response did not match the requested operation_id/
		},
		{
			name: 'shipping-label purchase',
			response: { operation_id: otherOperationId, shipment_id: 'shipment-contract' },
			request: (arky) =>
				arky.eshop.order.ship({
					order_id: 'order-shipping-contract',
					operation_id: operationId,
					rate_id: 'signed-rate-quote',
					carrier: 'USPS',
					service: 'usps_priority',
					location_id: 'location-contract',
					fulfillment_order_id: null,
					lines: [
						{
							order_item_id: 'item-contract',
							fulfillment_order_line_id: null,
							quantity: 1
						}
					]
				}),
			error: /Shipping response did not match the requested operation_id/
		}
	];

	for (const contract of cases) {
		await t.test(contract.name, async () => {
			const originalFetch = globalThis.fetch;
			globalThis.fetch = async () => jsonResponse(contract.response);
			try {
				await assert.rejects(contract.request(admin()), contract.error);
			} finally {
				globalThis.fetch = originalFetch;
			}
		});
	}
});

test('order reads preserve operation and shipping lifecycle evidence directly', async () => {
	const response = {
		id: 'order-evidence-contract',
		payment: {
			transactions: [{ id: 'transaction-contract', source_operation_id: operationId }]
		},
		shipments: [
			{
				id: 'shipment-contract',
				shipping_label_purchase: {
					id: 'purchase-contract',
					recovery_epoch: 'recovery-epoch-contract',
					operation_id: operationId,
					request_fingerprint: 'request-fingerprint-contract',
					status: 'unknown',
					adjustments: [],
					error: { type: 'unknown_outcome', message: 'Ambiguous provider result', at: 1 }
				}
			}
		]
	};
	const { result } = await captureFetch(response, () =>
		admin().eshop.order.get({ id: response.id })
	);

	assert.deepEqual(result, response);
	assert.equal(result.payment.transactions[0].source_operation_id, operationId);
	assert.equal(result.shipments[0].shipping_label_purchase.operation_id, operationId);
});

test('workflow and platform methods preserve snake_case wire DTOs and direct responses', async () => {
	const workflowTools = [
		{
			id: 'arky',
			name: 'Arky',
			description: 'Arky operations',
			icon: 'arky',
			color: '#000000',
			category: 'core',
			configuration_required: false,
			docs_url: 'https://arky.io/docs',
			url_patterns: ['^https://api\\.arky\\.io/'],
			resources: [],
			triggers: [
				{
					name: 'Order created',
					value: 'order.created',
					description: 'An order was created',
					webhook_type: 'incoming'
				}
			]
		}
	];
	const { calls, result } = await captureFetch(workflowTools, () =>
		admin().platform.getWorkflowTools()
	);

	assert.deepEqual(calls, [
		{
			url: `${baseUrl}/v1/platform/workflow-tools`,
			method: 'GET',
			body: undefined
		}
	]);
	assert.deepEqual(result, workflowTools);
	assert.equal('configurationRequired' in result[0], false);
	assert.equal('docsUrl' in result[0], false);
	assert.equal('urlPatterns' in result[0], false);
	assert.equal('webhookType' in result[0].triggers[0], false);
});

test('workflow trigger keeps arbitrary object data while the path secret wins', async () => {
	const response = {
		id: 'execution-trigger-contract',
		input: {
			type: 'webhook',
			payload: { order: { id: 'order-contract' }, tags: ['one', 'two'] }
		}
	};
	const { calls, result } = await captureFetch(response, () =>
		admin().automation.workflow.trigger({
			secret: 'path-secret-contract',
			order: { id: 'order-contract' },
			tags: ['one', 'two']
		})
	);

	assert.deepEqual(calls, [
		{
			url: `${baseUrl}/v1/workflows/trigger/path-secret-contract`,
			method: 'POST',
			body: { order: { id: 'order-contract' }, tags: ['one', 'two'] }
		}
	]);
	assert.deepEqual(result, response);
	assert.equal('secret' in calls[0].body, false);
});
