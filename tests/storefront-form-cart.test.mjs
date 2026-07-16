import assert from 'node:assert/strict';
import test from 'node:test';

import { initialize } from '../dist/storefront.js';

const baseUrl = 'https://api.example.test';
const storeId = 'store-form-contract';

function jsonResponse(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

function contact(store, email = null) {
	return {
		id: `contact-${store}`,
		store_id: store,
		email,
		verified: Boolean(email),
		status: 'active',
		channels: [],
		promo_usage: [],
		taxonomies: [],
		created_at: 1,
		updated_at: 1,
	};
}

function market(key = 'us') {
	return {
		key,
		currency: 'usd',
		payment_methods: [],
		zones: [],
	};
}

function identifyResponse(store, email = null) {
	return {
		contact: contact(store, email),
		token: {
			id: `session-${store}`,
			token: `token-${store}`,
			status: 'active',
			created_at: 1,
			expires_at: 10_000,
		},
		store: { id: store },
		market: market(),
		verification_challenge: null,
	};
}

test('storefront contact email identification normalizes before identifying', async () => {
	const store = initialize({ baseUrl, storeId, market: 'us', locale: 'en' });
	store.session.set(identifyResponse(storeId));
	let body = null;
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url, init = {}) => {
		if (!String(url).endsWith('/account/identify')) {
			throw new Error(`Unexpected contact identity request: ${url}`);
		}
		body = JSON.parse(String(init.body));
		return jsonResponse(identifyResponse(storeId, body.email));
	};

	try {
		const result = await store.identifyContactEmailIfMissing('  Person@Example.COM  ');
		assert.equal(result.contact.email, 'person@example.com');
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.equal(body.email, 'person@example.com');
});

test('storefront contact email identification reuses only the exact current email', async () => {
	const store = initialize({ baseUrl, storeId, market: 'us', locale: 'en' });
	const current = identifyResponse(storeId, 'person@example.com');
	store.session.set(current);
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url) => {
		throw new Error(`Exact current email should not identify again: ${url}`);
	};

	try {
		const result = await store.identifyContactEmailIfMissing(' Person@Example.com ');
		assert.equal(result, current);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test('storefront contact email identification replaces a different current email', async () => {
	const store = initialize({ baseUrl, storeId, market: 'us', locale: 'en' });
	store.session.set(identifyResponse(storeId, 'old@example.com'));
	const originalFetch = globalThis.fetch;
	let identifyCalls = 0;
	globalThis.fetch = async (url, init = {}) => {
		if (!String(url).endsWith('/account/identify')) {
			throw new Error(`Unexpected contact identity request: ${url}`);
		}
		identifyCalls += 1;
		const body = JSON.parse(String(init.body));
		return jsonResponse(identifyResponse(storeId, body.email));
	};

	try {
		const result = await store.identifyContactEmailIfMissing('new@example.com');
		assert.equal(result.contact.email, 'new@example.com');
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.equal(identifyCalls, 1);
});

test('storefront contact email identification rejects blank email', async () => {
	const store = initialize({ baseUrl, storeId, market: 'us', locale: 'en' });
	store.session.set(identifyResponse(storeId, 'current@example.com'));
	await assert.rejects(
		store.identifyContactEmailIfMissing(' \t '),
		/Contact email is required/,
	);
});

function form(store = storeId, key = 'contact-form') {
	return {
		id: `form-${store}`,
		store_id: store,
		key,
		schema: [
			{ id: `name-${store}`, key: 'name', type: 'text', required: true },
			{ id: `age-${store}`, key: 'age', type: 'number', required: true, min: 18, max: 120 },
			{ id: `member-${store}`, key: 'member', type: 'boolean', required: true },
			{ id: `date-${store}`, key: 'date', type: 'date', required: true },
			{ id: `location-${store}`, key: 'location', type: 'geo_location', required: true },
			{ id: `channels-${store}`, key: 'channels', type: 'select', required: true, options: ['email', 'phone'] },
		],
		status: 'active',
		created_at: 1,
		updated_at: 1,
	};
}

function emptyCart(store = storeId) {
	return {
		id: `cart-${store}`,
		store_id: store,
		contact_id: `contact-${store}`,
		token: 'cart-token',
		status: 'active',
		origin: 'storefront',
		market: 'us',
		items: [],
		shipping_address: null,
		billing_address: null,
		forms: [],
		promo_code: null,
		payment_method_key: null,
		shipping_method_id: null,
		quote_snapshot: null,
		converted_order_id: null,
		item_count: 0,
		last_action_at: 1,
		created_at: 1,
		updated_at: 1,
	};
}

function productItem() {
	return {
		id: 'line-form-contract',
		product_id: 'product-form-contract',
		variant_id: 'variant-form-contract',
		product_name: 'Form contract product',
		product_slug: 'form-contract-product',
		variant_attributes: {},
		requires_shipping: true,
		price: { amount: 1000, currency: 'usd', market: 'us' },
		quantity: 1,
		added_at: 1,
	};
}

test('submitByKey refetches the schema and submits exact typed fields after identifying', async () => {
	const store = initialize({ baseUrl, storeId, market: 'us', locale: 'en' });
	const calls = [];
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url, init = {}) => {
		const method = init.method || 'GET';
		const body = init.body ? JSON.parse(String(init.body)) : null;
		calls.push({
			url: String(url),
			method,
			body,
			authorization: new Headers(init.headers).get('authorization'),
		});
		if (String(url).endsWith(`/forms/${storeId}:contact-form`)) return jsonResponse(form());
		if (String(url).endsWith('/account/identify')) return jsonResponse(identifyResponse(storeId));
		if (String(url).endsWith(`/forms/form-${storeId}/submissions`)) {
			return jsonResponse({ id: 'submission-contract', form_id: `form-${storeId}`, store_id: storeId, fields: body.fields });
		}
		throw new Error(`Unexpected form contract request: ${method} ${url}`);
	};

	try {
		await store.cms.form.submitByKey({
			key: 'contact-form',
			values: {
				name: 'Jane',
				age: 32,
				member: false,
				date: 1_725_000_000,
				location: { coordinates: { lat: 43.8563, lon: 18.4131 }, label: 'Sarajevo' },
				channels: ['email'],
			},
		});
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.deepEqual(calls.map(({ method, url }) => [method, url]), [
		['GET', `${baseUrl}/v1/storefront/${storeId}/forms/${storeId}:contact-form`],
		['POST', `${baseUrl}/v1/storefront/${storeId}/account/identify`],
		['POST', `${baseUrl}/v1/storefront/${storeId}/forms/form-${storeId}/submissions`],
	]);
	assert.equal(calls[0].authorization, null);
	assert.equal(calls[2].authorization, `Bearer token-${storeId}`);
	assert.deepEqual(calls[2].body, {
		form_id: `form-${storeId}`,
		store_id: storeId,
		fields: [
			{ id: `name-${storeId}`, key: 'name', type: 'text', value: 'Jane' },
			{ id: `age-${storeId}`, key: 'age', type: 'number', value: 32 },
			{ id: `member-${storeId}`, key: 'member', type: 'boolean', value: false },
			{ id: `date-${storeId}`, key: 'date', type: 'date', value: 1_725_000_000 },
			{
				id: `location-${storeId}`,
				key: 'location',
				type: 'geo_location',
				value: { coordinates: { lat: 43.8563, lon: 18.4131 }, label: 'Sarajevo' },
			},
			{ id: `channels-${storeId}`, key: 'channels', type: 'select', value: ['email'] },
		],
	});
});

test('submitByKey rejects unknown, missing, wrong, and malformed optional values before auth or submit', async () => {
	const store = initialize({ baseUrl, storeId, market: 'us', locale: 'en' });
	const validationForm = {
		...form(),
		schema: [
			{ id: 'field-name', key: 'name', type: 'text', required: true },
			{ id: 'field-location', key: 'location', type: 'geo_location', required: false },
		],
	};
	const calls = [];
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url, init = {}) => {
		calls.push({ url: String(url), method: init.method || 'GET' });
		if ((init.method || 'GET') === 'GET') return jsonResponse(validationForm);
		throw new Error(`Validation must not issue ${init.method} ${url}`);
	};

	try {
		await assert.rejects(
			store.cms.form.submitByKey({ key: 'contact-form', values: { name: 'Jane', extra: 'nope' } }),
			/not defined by the form schema/,
		);
		await assert.rejects(
			store.cms.form.submitByKey({ key: 'contact-form', values: {} }),
			/required value is missing/,
		);
		await assert.rejects(
			store.cms.form.submitByKey({ key: 'contact-form', values: { name: 42 } }),
			/expected text/,
		);
		await assert.rejects(
			store.cms.form.submitByKey({
				key: 'contact-form',
				values: { name: 'Jane', location: { coordinates: { lat: 999, lon: 18 } } },
			}),
			/expected valid coordinates/,
		);
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.equal(calls.length, 4);
	assert.equal(calls.every((call) => call.method === 'GET'), true);
});

test('submitByKey ignores a stale cached schema and uses the latest server field identity', async () => {
	const store = initialize({ baseUrl, storeId, market: 'us', locale: 'en' });
	let formReads = 0;
	let submittedBody = null;
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url, init = {}) => {
		if (String(url).endsWith(`/forms/${storeId}:contact-form`) && (init.method || 'GET') === 'GET') {
			formReads += 1;
			return jsonResponse({
				...form(),
				schema: [
					{
						id: formReads === 1 ? 'field-stale' : 'field-current',
						key: 'name',
						type: 'text',
						required: true,
					},
				],
			});
		}
		if (String(url).endsWith('/account/identify')) return jsonResponse(identifyResponse(storeId));
		if (String(url).endsWith(`/forms/form-${storeId}/submissions`)) {
			submittedBody = JSON.parse(String(init.body));
			return jsonResponse({ id: 'submission-current', form_id: `form-${storeId}`, store_id: storeId, fields: submittedBody.fields });
		}
		throw new Error(`Unexpected stale-schema request: ${init.method || 'GET'} ${url}`);
	};

	try {
		await store.cms.form.get({ key: 'contact-form' });
		await store.cms.form.submitByKey({ key: 'contact-form', values: { name: 'Current' } });
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.equal(formReads, 2);
	assert.equal(submittedBody.fields[0].id, 'field-current');
});

test('cross-store form get, identity, cache, and submission stay on one immutable scope', async () => {
	const values = new Map();
	const sessionStorage = {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, value),
		removeItem: (key) => values.delete(key),
	};
	const storeAId = 'store-a';
	const storeBId = 'store-b';
	const store = initialize({ baseUrl, storeId: storeAId, market: 'us', locale: 'en', sessionStorage });
	const calls = [];
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url, init = {}) => {
		const target = String(url).match(/\/v1\/storefront\/([^/]+)/)?.[1];
		const authorization = new Headers(init.headers).get('authorization');
		const body = init.body ? JSON.parse(String(init.body)) : null;
		calls.push({ url: String(url), method: init.method || 'GET', target, authorization, body });
		if (String(url).endsWith('/account/identify')) return jsonResponse(identifyResponse(target, body.email || null));
		if (String(url).includes('/forms/') && (init.method || 'GET') === 'GET') {
			return jsonResponse({
				...form(target),
				schema: [{ id: `name-${target}`, key: 'name', type: 'text', required: true }],
			});
		}
		if (String(url).endsWith(`/forms/form-${storeBId}/submissions`)) {
			return jsonResponse({ id: 'submission-b', form_id: `form-${storeBId}`, store_id: storeBId, fields: body.fields });
		}
		throw new Error(`Unexpected scoped form request: ${init.method || 'GET'} ${url}`);
	};

	try {
		await store.identify({ email: 'a@example.test' });
		await store.cms.form.get({ key: 'contact-form', store_id: storeAId });
		await store.cms.form.get({ key: 'contact-form', store_id: storeBId });
		await store.cms.form.submitByKey({
			key: 'contact-form',
			store_id: storeBId,
			values: { name: 'Store B visitor' },
		});

		const scopeB = store.forStore(storeBId);
		assert.equal(store.forStore(storeBId), scopeB);
		assert.notEqual(scopeB, store);
		assert.equal(store.getStoreId(), storeAId);
		assert.equal(scopeB.getStoreId(), storeBId);
		assert.equal(store.session.get().contact.store_id, storeAId);
		assert.equal(scopeB.session.get().contact.store_id, storeBId);
	} finally {
		globalThis.fetch = originalFetch;
	}

	const formState = store.cms.state.get().forms;
	assert.equal(formState[`${storeAId}:key:contact-form`].id, `form-${storeAId}`);
	assert.equal(formState[`${storeBId}:key:contact-form`].id, `form-${storeBId}`);
	const bCalls = calls.filter((call) => call.target === storeBId);
	assert.deepEqual(bCalls.map((call) => call.method), ['GET', 'GET', 'POST', 'POST']);
	assert.equal(bCalls.some((call) => call.authorization === `Bearer token-${storeAId}`), false);
	assert.equal(bCalls.at(-1).authorization, `Bearer token-${storeBId}`);
	assert.equal(bCalls.at(-1).body.fields[0].id, `name-${storeBId}`);
});

test('raw form submit keeps explicit fields but still establishes a storefront session', async () => {
	const store = initialize({ baseUrl, storeId, market: 'us', locale: 'en' });
	const fields = [{ id: 'field-raw', key: 'name', type: 'text', value: 'Raw value' }];
	const calls = [];
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url, init = {}) => {
		const body = init.body ? JSON.parse(String(init.body)) : null;
		calls.push({ url: String(url), body });
		if (String(url).endsWith('/account/identify')) return jsonResponse(identifyResponse(storeId));
		if (String(url).endsWith('/forms/form-raw/submissions')) {
			return jsonResponse({ id: 'submission-raw', form_id: 'form-raw', store_id: storeId, fields: body.fields });
		}
		throw new Error(`Unexpected raw form request: ${url}`);
	};

	try {
		await store.cms.form.submit({ form_id: 'form-raw', fields });
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.deepEqual(calls.map((call) => call.url), [
		`${baseUrl}/v1/storefront/${storeId}/account/identify`,
		`${baseUrl}/v1/storefront/${storeId}/forms/form-raw/submissions`,
	]);
	assert.deepEqual(calls[1].body.fields, fields);
});

test('cart refresh preserves explicit address null and maps nullable selections to blank clears', async () => {
	const store = initialize({ baseUrl, storeId, market: 'us', locale: 'en' });
	const current = {
		...emptyCart(),
		promo_code: 'SAVE',
		payment_method_key: 'cash',
		shipping_method_id: 'shipping-old',
	};
	store.eshop.cart.cart.set(current);
	store.eshop.cart.product_items.set([productItem()]);
	store.eshop.cart.promo_code.set('SAVE');
	store.eshop.cart.status.setKey('selected_shipping_method_id', 'shipping-old');
	let updateBody = null;
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url, init = {}) => {
		if (String(url).endsWith(`/carts/cart-${storeId}`) && init.method === 'PUT') {
			updateBody = JSON.parse(String(init.body));
			return jsonResponse({
				...emptyCart(),
				shipping_address: null,
				billing_address: null,
				promo_code: null,
				payment_method_key: null,
				shipping_method_id: null,
			});
		}
		throw new Error(`Unexpected cart-clear request: ${init.method} ${url}`);
	};

	try {
		await store.eshop.cart.refresh({
			shipping_address: null,
			billing_address: null,
			promo_code: null,
			payment_method_key: null,
			shipping_method_id: null,
		});
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.equal(updateBody.shipping_address, null);
	assert.equal(updateBody.billing_address, null);
	assert.equal(updateBody.promo_code, '');
	assert.equal(updateBody.payment_method_key, '');
	assert.equal(updateBody.shipping_method_id, '');
	assert.equal(store.eshop.cart.promo_code.get(), null);
	assert.equal(store.eshop.cart.status.get().selected_shipping_method_id, null);
});

test('a failed promo clear leaves the last canonical promo state intact', async () => {
	const store = initialize({ baseUrl, storeId, market: 'us', locale: 'en' });
	store.eshop.cart.cart.set({ ...emptyCart(), promo_code: 'SAVE' });
	store.eshop.cart.product_items.set([productItem()]);
	store.eshop.cart.promo_code.set('SAVE');
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => jsonResponse({ message: 'Update failed', statusCode: 500 }, 500);

	try {
		await assert.rejects(store.eshop.cart.removePromoCode(), /Update failed/);
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.equal(store.eshop.cart.promo_code.get(), 'SAVE');
});

const bookingServiceId = 'service-booking';

function bookingService() {
	return {
		id: bookingServiceId,
		key: 'booking',
		slug: { en: 'booking' },
		store_id: storeId,
		blocks: [],
		taxonomies: [],
		status: 'active',
		created_at: 1,
		updated_at: 1,
	};
}

function bookingProvider(id) {
	return {
		id,
		key: id,
		slug: { en: id },
		store_id: storeId,
		blocks: [],
		taxonomies: [],
		status: 'active',
		created_at: 1,
		updated_at: 1,
	};
}

function bookingRelationship(providerId, formIds = [], prices = [{ amount: 1000, currency: 'usd', market: 'us' }]) {
	return {
		id: `relationship-${providerId}`,
		service_id: bookingServiceId,
		provider_id: providerId,
		store_id: storeId,
		working_days: [],
		specific_dates: [],
		prices,
		durations: [{ duration: 3600, is_pause: false }],
		slot_interval: 3600,
		forms: formIds.map((formId) => ({ form_id: formId, fields: [] })),
		reminders: [],
		min_advance: 0,
		max_advance: 0,
		created_at: 1,
		updated_at: 1,
	};
}

function bookingForm(id, fieldKey = 'notes') {
	return {
		id,
		store_id: storeId,
		key: id,
		schema: [{ id: `field-${id}`, key: fieldKey, type: 'text', required: true }],
		status: 'active',
		created_at: 1,
		updated_at: 1,
	};
}

function bookingSlot(providerId, from = 100, to = 200) {
	return {
		id: `slot-${providerId}-${from}`,
		serviceId: bookingServiceId,
		providerId,
		from,
		to,
		timeText: `${from}-${to}`,
		dateText: 'Jan 1',
	};
}

async function withBookingApi({ relationships, forms = {} }, callback) {
	const store = initialize({ baseUrl, storeId, market: 'us', locale: 'en' });
	store.session.set(identifyResponse(storeId));
	store.eshop.cart.cart.set(emptyCart());
	const calls = [];
	const updates = [];
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url, init = {}) => {
		const method = init.method || 'GET';
		const parsed = new URL(String(url));
		const body = init.body ? JSON.parse(String(init.body)) : null;
		calls.push({ method, url: String(url), path: parsed.pathname, body });

		if (parsed.pathname.endsWith('/services/availability')) {
			return jsonResponse({ from: 0, to: 0, providers: [] });
		}
		if (parsed.pathname.endsWith(`/services/${bookingServiceId}`)) return jsonResponse(bookingService());
		if (parsed.pathname.endsWith('/service-providers')) return jsonResponse(relationships);
		if (parsed.pathname.includes('/providers/')) {
			return jsonResponse(bookingProvider(decodeURIComponent(parsed.pathname.split('/').at(-1))));
		}
		if (parsed.pathname.includes('/forms/')) {
			const formId = decodeURIComponent(parsed.pathname.split('/').at(-1));
			const value = forms[formId];
			return value
				? jsonResponse(value)
				: jsonResponse({ message: `Configured form ${formId} was not found`, statusCode: 404 }, 404);
		}
		if (parsed.pathname.endsWith(`/carts/cart-${storeId}`) && method === 'PUT') {
			updates.push(body);
			return jsonResponse(emptyCart());
		}
		throw new Error(`Unexpected booking request: ${method} ${url}`);
	};

	try {
		await callback({ store, calls, updates });
	} finally {
		globalThis.fetch = originalFetch;
	}
}

test('booking loads and submits exact configured non-order forms in relation order', async () => {
	const relationship = bookingRelationship('provider-a', ['form-intake', 'form-consent']);
	await withBookingApi(
		{
			relationships: [relationship],
			forms: {
				'form-intake': bookingForm('form-intake'),
				'form-consent': bookingForm('form-consent', 'consent'),
			},
		},
		async ({ store, calls, updates }) => {
			await store.eshop.service.select(bookingService());
			assert.deepEqual(store.eshop.service.form_groups.get().map((group) => group.form.id), [
				'form-intake',
				'form-consent',
			]);
			store.eshop.service.form_blocks.get()[0].value = 'Exact configured value';
			store.eshop.service.form_blocks.get()[1].value = 'Accepted';
			store.eshop.service.selectTimeSlot(bookingSlot('provider-a'));
			await store.eshop.service.addToCart();

			const formReads = calls.filter((call) => call.method === 'GET' && call.path.includes('/forms/'));
			assert.deepEqual(formReads.map((call) => call.path.split('/').at(-1)), ['form-intake', 'form-consent']);
			assert.equal(calls.some((call) => call.url.includes('order-form')), false);
			assert.deepEqual(updates[0].items[0].forms, [
				{
					form_id: 'form-intake',
					fields: [{ id: 'field-form-intake', key: 'notes', type: 'text', value: 'Exact configured value' }],
				},
				{
					form_id: 'form-consent',
					fields: [{ id: 'field-form-consent', key: 'consent', type: 'text', value: 'Accepted' }],
				},
			]);
			assert.deepEqual(store.eshop.service.form_blocks.get().map((block) => block.value), ['', '']);
		},
	);
});

test('provider B selects provider B forms and the lowest visible market price', async () => {
	const providerAPrices = [{ amount: 1500, currency: 'usd', market: 'us' }];
	const providerBPrices = [
		{ amount: 1200, currency: 'usd', market: 'us' },
		{ amount: 800, currency: 'usd', market: 'us', contact_list_id: 'list-standard' },
		{ amount: 700, currency: 'usd', market: 'us', contact_list_id: 'list-vip' },
	];
	await withBookingApi(
		{
			relationships: [
				bookingRelationship('provider-a', ['form-a'], providerAPrices),
				bookingRelationship('provider-b', ['form-b'], providerBPrices),
			],
			forms: { 'form-a': bookingForm('form-a'), 'form-b': bookingForm('form-b') },
		},
		async ({ store }) => {
			await store.eshop.service.select(bookingService());
			assert.deepEqual(store.eshop.service.form_groups.get(), []);
			store.eshop.service.selectTimeSlot(bookingSlot('provider-a'));
			assert.equal(store.eshop.service.getServicePrice(), store.client.utils.formatPrice(providerAPrices));
			store.eshop.service.selectTimeSlot(bookingSlot('provider-b'));

			assert.equal(store.eshop.service.form_state.get().provider_id, 'provider-b');
			assert.deepEqual(store.eshop.service.form_groups.get().map((group) => group.form.id), ['form-b']);
			assert.equal(
				store.eshop.service.getServicePrice(),
				store.client.utils.formatPrice([{ amount: 700, currency: 'usd', market: 'us', contact_list_id: 'list-vip' }]),
			);
		},
	);
});

test('a provider with zero configured forms performs no form GET and submits an empty form list', async () => {
	await withBookingApi(
		{ relationships: [bookingRelationship('provider-a')] },
		async ({ store, calls, updates }) => {
			await store.eshop.service.select(bookingService());
			assert.equal(calls.some((call) => call.method === 'GET' && call.path.includes('/forms/')), false);
			assert.deepEqual(store.eshop.service.form_groups.get(), []);
			store.eshop.service.selectTimeSlot(bookingSlot('provider-a'));
			await store.eshop.service.addToCart();
			assert.deepEqual(updates[0].items[0].forms, []);
		},
	);
});

test('switching providers recreates form state without leaking prior values', async () => {
	await withBookingApi(
		{
			relationships: [
				bookingRelationship('provider-a', ['form-a']),
				bookingRelationship('provider-b', ['form-b']),
			],
			forms: { 'form-a': bookingForm('form-a'), 'form-b': bookingForm('form-b') },
		},
		async ({ store }) => {
			await store.eshop.service.select(bookingService());
			store.eshop.service.selectTimeSlot(bookingSlot('provider-a'));
			store.eshop.service.form_blocks.get()[0].value = 'Provider A private value';

			store.eshop.service.selectTimeSlot(bookingSlot('provider-b', 200, 300));
			assert.equal(store.eshop.service.form_blocks.get()[0].value, '');
			store.eshop.service.form_blocks.get()[0].value = 'Provider B private value';

			store.eshop.service.selectTimeSlot(bookingSlot('provider-a', 300, 400));
			assert.equal(store.eshop.service.form_blocks.get()[0].value, '');
		},
	);
});

test('a missing configured schema fails service selection before any cart update', async () => {
	await withBookingApi(
		{ relationships: [bookingRelationship('provider-a', ['form-missing'])] },
		async ({ store, updates }) => {
			await assert.rejects(store.eshop.service.select(bookingService()), /Configured form form-missing was not found/);
			assert.deepEqual(updates, []);
			assert.match(store.eshop.service.form_state.get().error, /Configured form form-missing was not found/);
			assert.equal(store.eshop.service.state.get().service, null);
		},
	);
});

test('two adjacent same-provider slots submit one ordered form set and gapped slots are rejected', async () => {
	await withBookingApi(
		{ relationships: [bookingRelationship('provider-a', ['form-intake'])], forms: { 'form-intake': bookingForm('form-intake') } },
		async ({ store, updates }) => {
			await store.eshop.service.select(bookingService());
			store.eshop.service.form_blocks.get()[0].value = 'One answer for both slots';
			const first = bookingSlot('provider-a', 100, 200);
			const second = bookingSlot('provider-a', 200, 300);
			assert.throws(
				() => store.eshop.service.serviceItemsFromSlots([first, bookingSlot('provider-a', 250, 350)]),
				/adjacent slots/,
			);
			await store.eshop.service.addToCart([second, first]);

			assert.deepEqual(updates[0].items[0].slots, [{ from: 100, to: 200 }, { from: 200, to: 300 }]);
			assert.equal(updates[0].items[0].forms.length, 1);
			assert.equal(updates[0].items[0].forms[0].fields[0].value, 'One answer for both slots');
		},
	);
});
