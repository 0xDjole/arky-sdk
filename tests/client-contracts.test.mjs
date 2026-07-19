import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createAdmin } from '../dist/admin.js';
import { SDK_VERSION } from '../dist/index.js';
import { createStorefront, initialize } from '../dist/storefront.js';

const baseUrl = 'https://api.example.test';
const storeId = 'store-client-contract';

function jsonResponse(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

function productItem() {
	return {
		id: 'line-client-contract',
		product_id: 'product-client-contract',
		variant_id: 'variant-client-contract',
		product_name: 'Client contract product',
		product_slug: 'client-contract-product',
		variant_attributes: {},
		requires_shipping: false,
		price: { amount: 1250, currency: 'USD', market: 'us' },
		quantity: 1,
		added_at: 1,
	};
}

function productCatalog(prices) {
	return {
		id: 'product-client-contract',
		store_id: storeId,
		key: 'client-contract-product',
		slug: { en: 'client-contract-product' },
		blocks: [],
		taxonomies: [],
		variants: [
			{
				id: 'variant-client-contract',
				sku: 'CLIENT-CONTRACT',
				prices,
				inventory: [],
				attributes: [],
				requires_shipping: false,
				digital_delivery_policy: 'manual',
				digital_assets: [],
			},
		],
		status: 'active',
		created_at: 1,
		updated_at: 1,
	};
}

function cartSnapshot() {
	return {
		id: 'cart-client-contract',
		store_id: storeId,
		contact_id: 'contact-client-contract',
		token: 'cart-token',
		status: 'active',
		origin: 'storefront',
		market: 'us',
		items: [],
		shipping_address: null,
		billing_address: null,
		forms: [],
		promo_code: null,
		payment_method_key: 'cash',
		shipping_method_id: null,
		quote_snapshot: {
			charge_amount: 1250,
			total: 1250,
			money: { total: 1250, currency: 'USD', payment_method_key: 'cash' },
		},
		converted_order_id: null,
		item_count: 1,
		last_action_at: 1,
		created_at: 1,
		updated_at: 1,
	};
}

function checkoutResult() {
	return {
		order_id: 'order-client-contract',
		number: '1001',
		payment_action: { type: 'none' },
		payment: {
			status: { status: 'captured', at: 1, amount: 1250 },
			amount: 1250,
			currency: 'USD',
			paid: 1250,
			method_type: 'cash',
		},
	};
}

function checkoutStore() {
	const store = initialize({ baseUrl, storeId, market: 'us', locale: 'en' });
	store.eshop.cart.cart.set(cartSnapshot());
	store.eshop.cart.product_items.set([productItem()]);
	return store;
}

test('admin verification sends only the challenge identifier and code', async () => {
	const admin = createAdmin({ baseUrl, storeId, market: 'us' });
	const calls = [];
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url, init = {}) => {
		calls.push({
			url: String(url),
			method: init.method,
			body: JSON.parse(String(init.body)),
		});
		return jsonResponse({
			id: 'session-client-contract',
			access_token: 'access-client-contract',
			refresh_token: 'refresh-client-contract',
			access_expires_at: 1000,
			refresh_expires_at: 2000,
			created_at: 1,
			is_verified: true,
		});
	};

	try {
		await admin.account.auth.verify({
			challenge_id: 'challenge-client-contract',
			code: '123456',
		});
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.deepEqual(calls, [
		{
			url: `${baseUrl}/v1/auth/verify`,
			method: 'POST',
			body: {
				challenge_id: 'challenge-client-contract',
				code: '123456',
			},
		},
	]);
});

test('storefront collection lookup encodes a key as the server composite identifier', async () => {
	const storefront = createStorefront({ baseUrl, storeId, market: 'us' });
	const originalFetch = globalThis.fetch;
	let requestedUrl = '';
	globalThis.fetch = async (url) => {
		requestedUrl = String(url);
		return jsonResponse({ id: 'collection-contract', key: 'articles' });
	};

	try {
		await storefront.cms.collection.get({ key: 'articles' });
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.equal(
		requestedUrl,
		`${baseUrl}/v1/storefront/${storeId}/collections/${storeId}:articles`,
	);
});

async function cartProductForPrices(prices, marketCurrency) {
	const store = initialize({ baseUrl, storeId, market: 'us', locale: 'en' });
	store.session.set({
		market: {
			key: 'us',
			currency: marketCurrency,
			payment_methods: [],
		},
		store: {},
	});
	const emptyCart = cartSnapshot();
	emptyCart.items = [];
	emptyCart.quote_snapshot = null;
	emptyCart.item_count = 0;
	store.eshop.cart.cart.set(emptyCart);

	const product = productCatalog(prices);
	const responseCart = {
		...emptyCart,
		items: [
			{
				type: 'product',
				id: 'line-client-contract',
				product_id: product.id,
				variant_id: product.variants[0].id,
				quantity: 1,
			},
		],
		item_count: 1,
	};
	const originalFetch = globalThis.fetch;
	let productFetches = 0;
	globalThis.fetch = async (url) => {
		const requestUrl = String(url);
		if (requestUrl.endsWith('/carts/cart-client-contract/items')) {
			return jsonResponse(responseCart);
		}
		if (requestUrl.includes('/products/product-client-contract')) {
			productFetches += 1;
			return jsonResponse(product);
		}
		throw new Error(`Unexpected price contract request: ${requestUrl}`);
	};

	try {
		await store.eshop.cart.addProduct(product, product.variants[0], 1);
		assert.equal(productFetches, 0, 'adding a known product must not fetch it again');
		return store.eshop.cart.product_items.get();
	} finally {
		globalThis.fetch = originalFetch;
	}
}

test('storefront identify returns the verification challenge without exposing its session token', async () => {
	const storefront = createStorefront({ baseUrl, storeId, market: 'us' });
	const contact = {
		id: 'contact-client-contract',
		store_id: storeId,
		email: 'contact@example.test',
		verified: false,
		status: 'active',
		channels: [],
		promo_usage: [],
		taxonomies: [],
		created_at: 1,
		updated_at: 1,
	};
	const store = { id: storeId };
	const challenge = {
		challenge_id: 'challenge-client-contract',
		expires_at: 1000,
	};
	const calls = [];
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url, init = {}) => {
		calls.push({ url: String(url), body: JSON.parse(String(init.body)) });
		if (String(url).endsWith('/account/code')) {
			return jsonResponse({
				contact,
				token: null,
				store,
				market: null,
				verification_challenge: challenge,
			});
		}
		if (String(url).endsWith('/account/verify')) {
			return jsonResponse({
				contact: { ...contact, verified: true },
				token: {
					id: 'session-client-contract',
					token: 'private-contact-token',
					status: 'active',
					created_at: 2,
					expires_at: 1000,
				},
			});
		}
		throw new Error(`Unexpected storefront auth contract request: ${url}`);
	};

	try {
		const result = await storefront.identify({
			email: contact.email,
			verify: true,
		});
		assert.deepEqual(result, {
			contact,
			store,
			market: null,
			verification_challenge: challenge,
		});
		assert.equal('token' in result, false);
		await storefront.verify({
			challenge_id: challenge.challenge_id,
			code: '123456',
		});
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.deepEqual(calls, [
		{
			url: `${baseUrl}/v1/storefront/${storeId}/account/code`,
			body: {
				store_id: storeId,
				market: 'us',
				email: contact.email,
			},
		},
		{
			url: `${baseUrl}/v1/storefront/${storeId}/account/verify`,
			body: {
				store_id: storeId,
				challenge_id: challenge.challenge_id,
				code: '123456',
			},
		},
	]);
});

test('storefront serializes anonymous and email identification', async () => {
	const storefront = createStorefront({ baseUrl, storeId, market: 'us' });
	const store = { id: storeId };
	const anonymousContact = {
		id: 'contact-anonymous-race',
		store_id: storeId,
		email: null,
		verified: false,
		status: 'active',
		channels: [],
		promo_usage: [],
		taxonomies: [],
		created_at: 1,
		updated_at: 1,
	};
	const emailContact = {
		...anonymousContact,
		id: 'contact-email-race',
		email: 'race@example.test',
		updated_at: 2,
	};
	const issued = (id, token) => ({
		id,
		token,
		status: 'active',
		created_at: 1,
		expires_at: 1000,
	});
	const response = (contact, token) =>
		jsonResponse({
			contact,
			token,
			store,
			market: null,
			verification_challenge: null,
		});

	let releaseAnonymous;
	const anonymousResponse = new Promise((resolve) => {
		releaseAnonymous = resolve;
	});
	let markAnonymousStarted;
	const anonymousStarted = new Promise((resolve) => {
		markAnonymousStarted = resolve;
	});
	const calls = [];
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url, init = {}) => {
		calls.push({
			url: String(url),
			body: JSON.parse(String(init.body)),
			authorization: new Headers(init.headers).get('authorization'),
		});
		if (calls.length === 1) {
			markAnonymousStarted();
			return anonymousResponse;
		}
		return response(emailContact, issued('session-email-race', 'email-token'));
	};

	try {
		const anonymous = storefront.identify();
		const email = storefront.identify({ email: emailContact.email, market: 'eu' });
		await anonymousStarted;
		await new Promise((resolve) => setImmediate(resolve));
		assert.equal(calls.length, 1, 'email identification waits for the anonymous session');

		releaseAnonymous(
			response(anonymousContact, issued('session-anonymous-race', 'anonymous-token')),
		);
		await anonymous;
		await email;
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.equal(calls.length, 2);
	assert.equal(calls[0].body.market, 'us');
	assert.equal(calls[1].url, `${baseUrl}/v1/storefront/${storeId}/account/identify`);
	assert.equal(calls[1].body.email, emailContact.email);
	assert.equal(calls[1].body.market, 'eu');
	assert.equal(calls[1].authorization, 'Bearer anonymous-token');
	assert.equal(storefront.session.contact.id, emailContact.id);
});

test('storefront sessions are isolated by API origin and store', async () => {
	const values = new Map();
	const sessionStorage = {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, value),
		removeItem: (key) => values.delete(key),
	};
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url, init = {}) => {
		const match = String(url).match(/\/v1\/storefront\/([^/]+)\/account\/identify$/);
		if (!match) throw new Error(`Unexpected scoped-session request: ${url}`);
		const scopedStoreId = match[1];
		const body = JSON.parse(String(init.body));
		return jsonResponse({
			contact: {
				id: `contact-${scopedStoreId}`,
				store_id: scopedStoreId,
				email: body.email,
				verified: true,
				status: 'active',
				channels: [],
				promo_usage: [],
				taxonomies: [],
				created_at: 1,
				updated_at: 1,
			},
			token: {
				id: `session-${scopedStoreId}`,
				token: `token-${scopedStoreId}`,
				status: 'active',
				created_at: 1,
				expires_at: 1000,
			},
			store: { id: scopedStoreId },
			market: null,
			verification_challenge: null,
		});
	};

	try {
		const storeA = createStorefront({ baseUrl, storeId: 'store-a', sessionStorage });
		const storeB = createStorefront({ baseUrl, storeId: 'store-b', sessionStorage });
		await storeA.identify({ email: 'a@example.test' });
		await storeB.identify({ email: 'b@example.test' });

		assert.equal(storeA.session.contact.id, 'contact-store-a');
		assert.equal(storeB.session.contact.id, 'contact-store-b');
		assert.equal(values.size, 2);

		const scopedStoreB = storeA.forStore('store-b');
		assert.equal(storeA.session.contact.id, 'contact-store-a');
		assert.equal(scopedStoreB.session.contact.id, 'contact-store-b');
		const otherOrigin = createStorefront({
			baseUrl: 'https://other.example.test',
			storeId: 'store-a',
			sessionStorage,
		});
		assert.equal(otherOrigin.session, null);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test('booking lines retain independent IDs, slots, and form values', () => {
	const store = initialize({ baseUrl, storeId, market: 'us', locale: 'en' });
	const firstForm = store.eshop.cart.createFormEntry('booking-form', [
		{ id: 'field-name', key: 'name', type: 'text', value: 'First booking' },
	]);
	const secondForm = store.eshop.cart.createFormEntry('booking-form', [
		{ id: 'field-name', key: 'name', type: 'text', value: 'Second booking' },
	]);
	const lines = store.eshop.cart.buildServiceItems([
		{
			id: 'booking-one',
			service_id: 'service-contract',
			provider_id: 'provider-contract',
			slots: [
				{ from: 200, to: 250 },
				{ from: 100, to: 150 },
			],
			forms: [firstForm],
		},
		{
			id: 'booking-two',
			service_id: 'service-contract',
			provider_id: 'provider-contract',
			slots: [{ from: 300, to: 350 }],
			forms: [secondForm],
		},
	]);

	assert.equal(lines.length, 2);
	assert.deepEqual(lines.map((line) => line.id), ['booking-one', 'booking-two']);
	assert.deepEqual(lines[0].slots, [
		{ from: 100, to: 150 },
		{ from: 200, to: 250 },
	]);
	assert.equal(lines[0].forms[0].fields[0].value, 'First booking');
	assert.equal(lines[1].forms[0].fields[0].value, 'Second booking');
});

test('storefront checkout returns the direct OrderCheckoutResult', async () => {
	const store = checkoutStore();
	const expected = checkoutResult();
	const calls = [];
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url, init = {}) => {
		calls.push({ url: String(url), method: init.method });
		if (String(url).endsWith('/carts/cart-client-contract')) {
			return jsonResponse(cartSnapshot());
		}
		if (String(url).endsWith('/carts/cart-client-contract/checkout')) {
			return jsonResponse(expected);
		}
		throw new Error(`Unexpected client contract request: ${url}`);
	};

	try {
		const result = await store.eshop.cart.checkout({ payment_method_key: 'cash' });
		assert.deepEqual(result, expected);
		assert.deepEqual(Object.keys(result).sort(), ['number', 'order_id', 'payment', 'payment_action']);
		assert.equal('ok' in result, false);
		assert.equal('val' in result, false);
		assert.equal('data' in result, false);
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.deepEqual(calls, [
		{
			url: `${baseUrl}/v1/storefront/${storeId}/carts/cart-client-contract`,
			method: 'PUT',
		},
		{
			url: `${baseUrl}/v1/storefront/${storeId}/carts/cart-client-contract/checkout`,
			method: 'POST',
		},
	]);
});

test('storefront checkout throws before HTTP when the cart is empty', async () => {
	const store = initialize({ baseUrl, storeId, market: 'us', locale: 'en' });
	let fetchCalls = 0;
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => {
		fetchCalls += 1;
		throw new Error('fetch must not run');
	};

	try {
		await assert.rejects(store.eshop.cart.checkout(), (error) => {
			assert.equal(error instanceof Error, true);
			assert.equal(error.message, 'Cart is empty');
			return true;
		});
	} finally {
		globalThis.fetch = originalFetch;
	}
	assert.equal(fetchCalls, 0);
});

test('storefront checkout preserves the typed API error instead of returning a wrapper', async () => {
	const store = checkoutStore();
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url) => {
		if (String(url).endsWith('/carts/cart-client-contract')) {
			return jsonResponse(cartSnapshot());
		}
		if (String(url).endsWith('/carts/cart-client-contract/checkout')) {
			return jsonResponse(
				{
					message: 'Checkout rejected',
					statusCode: 422,
					validationErrors: [{ field: 'payment_method_key', error: 'unsupported' }],
				},
				422,
			);
		}
		throw new Error(`Unexpected client contract request: ${url}`);
	};

	try {
		await assert.rejects(store.eshop.cart.checkout({ payment_method_key: 'cash' }), (error) => {
			assert.equal(error instanceof Error, true);
			assert.equal(error.name, 'ApiError');
			assert.equal(error.message, 'Checkout rejected');
			assert.equal(error.statusCode, 422);
			assert.deepEqual(error.validationErrors, [{ field: 'payment_method_key', error: 'unsupported' }]);
			assert.equal('ok' in error, false);
			assert.equal('val' in error, false);
			return true;
		});
		assert.equal(store.eshop.cart.status.get().error, 'Checkout rejected');
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test('zero-total card checkout skips Stripe while preserving authoritative order money', async () => {
	const store = initialize({ baseUrl, storeId, market: 'us', locale: 'en' });
	const freeCart = {
		...cartSnapshot(),
		payment_method_key: 'credit_card',
		quote_snapshot: {
			...cartSnapshot().quote_snapshot,
			charge_amount: 0,
			total: 0,
			money: {
				...cartSnapshot().quote_snapshot.money,
				total: 0,
				currency: 'EUR',
				payment_method_key: 'credit_card',
			},
		},
	};
	store.eshop.cart.cart.set(freeCart);
	store.eshop.cart.product_items.set([
		{
			...productItem(),
			price: { amount: 0, currency: 'EUR', market: 'us' },
		},
	]);
	const response = {
		order_id: 'order-free-contract',
		number: 'FREE-1',
		payment_action: { type: 'none' },
		payment: {
			status: { status: 'captured', at: 1, amount: 0 },
			amount: 0,
			currency: 'EUR',
			paid: 0,
			method_type: 'credit_card',
		},
	};
	const checkoutBodies = [];
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url, init = {}) => {
		if (String(url).endsWith('/carts/cart-client-contract')) {
			return jsonResponse(freeCart);
		}
		if (String(url).endsWith('/carts/cart-client-contract/checkout')) {
			checkoutBodies.push(JSON.parse(init.body));
			return jsonResponse(response);
		}
		throw new Error(`Unexpected free checkout request: ${url}`);
	};

	try {
		assert.deepEqual(
			await store.eshop.cart.checkout({
				payment_method_key: 'credit_card',
				clear_after_checkout: false,
			}),
			response,
		);
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.deepEqual(checkoutBodies, [
		{
			id: 'cart-client-contract',
			store_id: storeId,
			payment_method_key: 'credit_card',
		},
	]);
	assert.equal(store.eshop.cart.last_order.get().total, 0);
	assert.equal(store.eshop.cart.last_order.get().currency, 'EUR');
});

test('card checkout rejects invalid minor-unit charge evidence before the provider step', async (t) => {
	for (const chargeAmount of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
		await t.test(String(chargeAmount), async () => {
			const store = checkoutStore();
			const invalidCart = {
				...cartSnapshot(),
				payment_method_key: 'credit_card',
				quote_snapshot: {
					...cartSnapshot().quote_snapshot,
					charge_amount: chargeAmount,
					money: {
						...cartSnapshot().quote_snapshot.money,
						payment_method_key: 'credit_card',
					},
				},
			};
			store.eshop.cart.cart.set(invalidCart);
			let checkoutCalls = 0;
			const originalFetch = globalThis.fetch;
			globalThis.fetch = async (url) => {
				if (String(url).endsWith('/carts/cart-client-contract')) {
					return jsonResponse(invalidCart);
				}
				checkoutCalls += 1;
				throw new Error(`Provider checkout must not run: ${url}`);
			};

			try {
				await assert.rejects(
					store.eshop.cart.checkout({ payment_method_key: 'credit_card' }),
					/non-negative integer charge amount in minor units/,
				);
			} finally {
				globalThis.fetch = originalFetch;
			}
			assert.equal(checkoutCalls, 0);
		});
	}
});

test('Stripe mounting requires an amount/currency pair and trusts the current quote first', async () => {
	const store = checkoutStore();
	const mount = (options) =>
		store.eshop.cart.payment.mountStripe('#payment-contract', {
			publishableKey: 'pk_test_contract',
			...options,
		});

	await assert.rejects(mount({ amount: 1250 }), /amount and currency must be supplied together/);
	await assert.rejects(mount({ currency: 'USD' }), /amount and currency must be supplied together/);
	await assert.rejects(mount({ amount: 0, currency: 'USD' }), /positive minor-unit payment amount/);
	await assert.rejects(mount({ amount: 1250, currency: 'US' }), /three-letter payment currency/);

	store.eshop.cart.quote_result.set({
		...cartSnapshot().quote_snapshot,
		charge_amount: 1.5,
		money: { ...cartSnapshot().quote_snapshot.money, currency: 'EUR' },
	});
	await assert.rejects(mount({}), /positive minor-unit payment amount/);

	store.eshop.cart.quote_result.set({
		...cartSnapshot().quote_snapshot,
		charge_amount: 1250,
		money: { ...cartSnapshot().quote_snapshot.money, currency: 'EURO' },
	});
	await assert.rejects(mount({}), /three-letter payment currency/);
});

test('paginated SDK methods return the canonical items and cursor page directly', async () => {
	const page = {
		items: [{ id: 'product-1', key: 'product-1', variants: [] }],
		cursor: 'cursor-2',
	};
	const arky = createAdmin({ baseUrl, storeId, apiToken: 'contract-token' });
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => jsonResponse(page);

	try {
		const result = await arky.eshop.product.find({ limit: 1 });
		assert.deepEqual(result, page);
		assert.deepEqual(Object.keys(result).sort(), ['cursor', 'items']);
		assert.equal('data' in result, false);
		assert.equal('meta' in result, false);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test('storefront money helpers distinguish an exact zero price from a missing market price', () => {
	const storefront = createStorefront({ baseUrl, storeId, market: 'ita' });
	const prices = [
		{ market: 'other', amount: 999, currency: 'USD' },
		{ market: 'ita', amount: 1234, currency: 'EUR' },
	];

	assert.equal(storefront.utils.getPriceAmount(prices), 1234);
	assert.notEqual(storefront.utils.formatPrice(prices), '');
	storefront.setMarket('missing');
	assert.equal(storefront.utils.getPriceAmount(prices), null);
	assert.equal(storefront.utils.formatPrice(prices), '');
	assert.equal(storefront.utils.getPriceAmount([{ market: 'missing', amount: 0, currency: 'EUR' }]), 0);
	assert.notEqual(storefront.utils.formatPrice([{ market: 'missing', amount: 0, currency: 'EUR' }]), '');
	assert.equal(storefront.utils.getPriceAmount([{ market: 'missing', amount: 1.5, currency: 'EUR' }]), null);
	assert.equal(storefront.utils.formatPrice([{ market: 'missing', amount: 1.5, currency: 'EUR' }]), '');
	assert.throws(() => storefront.utils.formatMinor(1.5, 'EUR'), /safe integer/);

	const store = initialize({ baseUrl, storeId, market: 'ita', locale: 'en' });
	store.session.set({
		market: { key: 'ita', currency: 'EUR', payment_methods: [] },
		store: {},
	});
	const provider = {
		provider_id: 'provider-contract',
		service_id: 'service-contract',
		prices: [{ market: 'other', amount: 999, currency: 'USD' }],
		forms: [],
	};
	store.eshop.service.state.set({
		...store.eshop.service.state.get(),
		service: { id: 'service-contract' },
		serviceProviders: [provider],
	});
	assert.equal(store.eshop.service.getServicePrice(), '');
	provider.prices = [{ market: 'ita', amount: 0, currency: 'EUR' }];
	store.eshop.service.state.setKey('serviceProviders', [provider]);
	assert.notEqual(store.eshop.service.getServicePrice(), '');
});

test('cart product pricing follows the authoritative session market and server price-selection rules', async (t) => {
	await t.test('the middle authorized minimum wins even when the base and last prices are cheaper choices', async () => {
		const items = await cartProductForPrices(
			[
				{ market: 'other', amount: 1, currency: 'USD' },
				{ market: 'us', amount: 100, currency: 'EUR' },
				{
					market: 'us',
					amount: 900,
					currency: 'EUR',
					contact_list_id: 'list-one',
				},
				{
					market: 'us',
					amount: 700,
					currency: 'EUR',
					contact_list_id: 'list-two',
				},
				{
					market: 'us',
					amount: 800,
					currency: 'EUR',
					contact_list_id: 'list-three',
				},
			],
			'EUR',
		);
		assert.equal(items.length, 1);
		assert.deepEqual(items[0].price, {
			market: 'us',
			amount: 700,
			currency: 'EUR',
			contact_list_id: 'list-two',
		});
	});

	await t.test('one exact base price may be zero', async () => {
		const items = await cartProductForPrices([{ market: 'us', amount: 0, currency: 'eur' }], 'EUR');
		assert.equal(items.length, 1);
		assert.equal(items[0].price.amount, 0);
		assert.equal(items[0].price.currency, 'eur');
	});

	for (const contract of [
		{
			name: 'missing exact market',
			prices: [{ market: 'other', amount: 500, currency: 'EUR' }],
			currency: 'EUR',
		},
		{
			name: 'duplicate base prices',
			prices: [
				{ market: 'us', amount: 500, currency: 'EUR' },
				{ market: 'us', amount: 600, currency: 'EUR' },
			],
			currency: 'EUR',
		},
		{
			name: 'missing authoritative market currency',
			prices: [{ market: 'us', amount: 500, currency: 'EUR' }],
			currency: null,
		},
		{
			name: 'currency different from the session market',
			prices: [{ market: 'us', amount: 500, currency: 'USD' }],
			currency: 'EUR',
		},
		{
			name: 'fractional minor units',
			prices: [{ market: 'us', amount: 1.5, currency: 'EUR' }],
			currency: 'EUR',
		},
		{
			name: 'negative minor units',
			prices: [{ market: 'us', amount: -1, currency: 'EUR' }],
			currency: 'EUR',
		},
		{
			name: 'unsafe minor units',
			prices: [{ market: 'us', amount: Number.MAX_SAFE_INTEGER + 1, currency: 'EUR' }],
			currency: 'EUR',
		},
	]) {
		await t.test(contract.name, async () => {
			assert.deepEqual(await cartProductForPrices(contract.prices, contract.currency), []);
		});
	}
});

test('SDK_VERSION equals the package version', async () => {
	const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
	assert.equal(SDK_VERSION, packageJson.version);
});
