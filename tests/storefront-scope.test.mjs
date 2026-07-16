import assert from 'node:assert/strict';
import test from 'node:test';

import { createStorefront } from '../dist/storefront.js';

const baseUrl = 'https://api.example.test';

function jsonResponse(body) {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'content-type': 'application/json' },
	});
}

test('forStore derives an isolated immutable storefront client', async () => {
	const sessions = new Map();
	const sessionStorage = {
		getItem: (key) => sessions.get(key) ?? null,
		setItem: (key, value) => sessions.set(key, value),
		removeItem: (key) => sessions.delete(key),
	};
	const calls = [];
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url, init = {}) => {
		const requestUrl = String(url);
		const storeId = requestUrl.includes('/store-b/') ? 'store-b' : 'store-a';
		calls.push({
			url: requestUrl,
			authorization: init.headers?.Authorization,
		});

		if (requestUrl.endsWith('/account/identify')) {
			return jsonResponse({
				contact: { id: `contact-${storeId}` },
				store: { id: storeId },
				market: null,
				token: { token: `token-${storeId}` },
				verification_challenge: null,
			});
		}
		if (requestUrl.endsWith('/account/me')) {
			return jsonResponse({ id: `contact-${storeId}` });
		}
		return jsonResponse({ success: true });
	};

	try {
		const storeA = createStorefront({
			baseUrl,
			storeId: 'store-a',
			market: 'default-market',
			locale: 'en',
			sessionStorage,
		});
		storeA.setMarket('current-market');
		storeA.setLocale('bs');
		const storeB = storeA.forStore('store-b');

		assert.equal(storeA.getStoreId(), 'store-a');
		assert.equal(storeB.getStoreId(), 'store-b');
		assert.equal('setStoreId' in storeA, false);
		assert.equal(storeB.getMarket(), 'current-market');
		assert.equal(storeB.getLocale(), 'bs');

		storeB.setMarket('store-b-market');
		storeB.setLocale('de');
		assert.equal(storeA.getMarket(), 'current-market');
		assert.equal(storeA.getLocale(), 'bs');

		await storeA.identify({ email: 'a@example.test' });
		await storeB.identify({ email: 'b@example.test' });
		const storeBIdentify = calls.find((call) =>
			call.url.endsWith('/store-b/account/identify'),
		);
		assert.equal(storeBIdentify?.authorization, undefined);
		assert.equal(storeA.session?.contact.id, 'contact-store-a');
		assert.equal(storeB.session?.contact.id, 'contact-store-b');
		assert.equal(sessions.size, 2);

		await storeA.me();
		await storeB.me();
		assert.equal(calls.at(-2)?.authorization, 'Bearer token-store-a');
		assert.equal(calls.at(-1)?.authorization, 'Bearer token-store-b');

		await storeB.logout();
		assert.equal(storeB.session, null);
		assert.equal(storeB.isAuthenticated, false);
		assert.equal(storeA.session?.contact.id, 'contact-store-a');
		assert.equal(storeA.isAuthenticated, true);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test('persistent session removal is authoritative across same-store clients', async () => {
	const sessions = new Map();
	const sessionStorage = {
		getItem: (key) => sessions.get(key) ?? null,
		setItem: (key, value) => sessions.set(key, value),
		removeItem: (key) => sessions.delete(key),
	};
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url) => {
		if (String(url).endsWith('/account/identify')) {
			return jsonResponse({
				contact: { id: 'contact-store-a' },
				store: { id: 'store-a' },
				market: null,
				token: { token: 'token-store-a' },
				verification_challenge: null,
			});
		}
		if (String(url).endsWith('/account/logout')) return jsonResponse({ success: true });
		throw new Error(`Unexpected session request: ${url}`);
	};

	try {
		const first = createStorefront({ baseUrl, storeId: 'store-a', sessionStorage });
		const second = first.forStore('store-a');
		await first.identify();
		await second.identify();
		assert.equal(second.isAuthenticated, true);

		await first.logout();
		assert.equal(first.session, null);
		assert.equal(second.session, null);
		assert.equal(second.isAuthenticated, false);
	} finally {
		globalThis.fetch = originalFetch;
	}
});
