import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';
import { createStorefront } from '../dist/storefront.js';
import { storefrontSessionStorage } from './helpers/storefront-session-storage.mjs';

for (const scope of ['admin', 'storefront']) {
  test(`${scope} Order discovery preserves combined filters, chosen ordering and empty-page continuation`, async context => {
    const calls = [];
    context.mock.method(globalThis, 'fetch', async (url, init = {}) => {
      calls.push({ url: new URL(url), method: init.method, body: init.body, headers: new Headers(init.headers) });
      return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? 'order:+/=' : null }),
        { headers: { 'content-type': 'application/json' } });
    });
    const token = `customer_visitor_${'c'.repeat(64)}`;
    const api = scope === 'admin'
      ? createAdmin({ baseUrl: 'https://orders.test', storeId: 'store' }).eshop.order
      : createStorefront(`arky_pk_${'c'.repeat(43)}`, { apiUrl: 'https://orders.test',
        sessionStorage: storefrontSessionStorage(JSON.stringify({ version: 2,
          customer: { id: 'customer', status: { type: 'active' }, created_at: 1, updated_at: 1 },
          session: { id: 'session', customer_id: 'customer', type: 'visitor', token, status: { type: 'active' }, expires_at: 10_000 } })) }).eshop.order;
    const filters = { customer_id: 'customer', customer_group_subscription_id: 'subscription', query: 'ORD-2026',
      statuses: ['confirmed'], product_statuses: ['confirmed'], booking_statuses: ['completed'],
      product_ids: ['product'], booking_service_ids: ['service'], booking_resource_ids: ['resource'],
      from: 0, to: 20, created_at_from: 0, created_at_to: 30, limit: 1, sort_field: 'price', sort_direction: 'asc' };
    const first = await api.find(filters);
    assert.deepEqual(first, { items: [], cursor: 'order:+/=' });
    assert.deepEqual(await api.find({ ...filters, cursor: first.cursor }), { items: [], cursor: null });
    assert.equal(calls[1].url.searchParams.get('cursor'), first.cursor);
    for (const call of calls) {
      assert.equal(call.url.pathname, scope === 'admin' ? '/v1/stores/store/orders' : '/v1/storefront/orders');
      assert.equal(call.method, 'GET');
      assert.equal(call.body, undefined);
      for (const [key, value] of Object.entries(filters)) {
        if (Array.isArray(value)) assert.deepEqual(JSON.parse(call.url.searchParams.get(key)), value);
        else assert.equal(call.url.searchParams.get(key), String(value));
      }
      if (scope === 'storefront') assert.equal(call.headers.get('authorization'), `Bearer ${token}`);
    }
  });
}
