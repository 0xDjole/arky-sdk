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
	store.cart.cart.set(cartSnapshot());
	store.cart.product_items.set([productItem()]);
	return store;
}

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
	store.cart.cart.set(emptyCart);

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
	globalThis.fetch = async (url) => {
		const requestUrl = String(url);
		if (requestUrl.endsWith('/carts/cart-client-contract/items')) {
			return jsonResponse(responseCart);
		}
		if (requestUrl.includes('/products/product-client-contract')) {
			return jsonResponse(product);
		}
		throw new Error(`Unexpected price contract request: ${requestUrl}`);
	};

	try {
		await store.cart.addProduct(product, product.variants[0], 1);
		return store.cart.product_items.get();
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
		if (String(url).endsWith('/account/identify')) {
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
			url: `${baseUrl}/v1/storefront/${storeId}/account/identify`,
			body: {
				store_id: storeId,
				market: 'us',
				email: contact.email,
				verify: true,
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
		const result = await store.cart.checkout({ payment_method_key: 'cash' });
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
		await assert.rejects(store.cart.checkout(), (error) => {
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
		await assert.rejects(store.cart.checkout({ payment_method_key: 'cash' }), (error) => {
			assert.equal(error.name, 'ApiError');
			assert.equal(error.message, 'Checkout rejected');
			assert.equal(error.statusCode, 422);
			assert.deepEqual(error.validationErrors, [{ field: 'payment_method_key', error: 'unsupported' }]);
			assert.equal('ok' in error, false);
			assert.equal('val' in error, false);
			return true;
		});
		assert.equal(store.cart.status.get().error, 'Checkout rejected');
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
	store.cart.cart.set(freeCart);
	store.cart.product_items.set([
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
			await store.cart.checkout({
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
	assert.equal(store.cart.last_order.get().total, 0);
	assert.equal(store.cart.last_order.get().currency, 'EUR');
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
			store.cart.cart.set(invalidCart);
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
					store.cart.checkout({ payment_method_key: 'credit_card' }),
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
		store.cart.payment.mountStripe('#payment-contract', {
			publishableKey: 'pk_test_contract',
			...options,
		});

	await assert.rejects(mount({ amount: 1250 }), /amount and currency must be supplied together/);
	await assert.rejects(mount({ currency: 'USD' }), /amount and currency must be supplied together/);
	await assert.rejects(mount({ amount: 0, currency: 'USD' }), /positive minor-unit payment amount/);
	await assert.rejects(mount({ amount: 1250, currency: 'US' }), /three-letter payment currency/);

	store.cart.quote_result.set({
		...cartSnapshot().quote_snapshot,
		charge_amount: 1.5,
		money: { ...cartSnapshot().quote_snapshot.money, currency: 'EUR' },
	});
	await assert.rejects(mount({}), /positive minor-unit payment amount/);

	store.cart.quote_result.set({
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
	const provider = {
		provider_id: 'provider-contract',
		prices: [{ market: 'other', amount: 999, currency: 'USD' }],
	};
	store.eshop.service.state.setKey('service', { providers: [provider] });
	assert.equal(store.eshop.service.getServicePrice(), '');
	provider.prices = [{ market: 'ita', amount: 0, currency: 'EUR' }];
	store.eshop.service.state.setKey('service', { providers: [provider] });
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
