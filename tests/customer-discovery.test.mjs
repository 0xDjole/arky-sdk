import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';

const STORE_ID = '9c2e5b74-1f38-4a6d-8b05-3e7f0a9d6c12';

test('Customer discovery retains combined predicates, native ordering and empty-page continuation', async context => {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? 'customer:+/=' : null }),
      { headers: { 'content-type': 'application/json' } });
  });
  const api = createAdmin({ baseUrl: 'https://customers.test', apiToken: 'arky_api_customers' }).customers;
  const filters = { query: 'buyer', status: 'active', has_cart: false, has_customer_action: true,
    email_type: 'verified', limit: 1, sort_field: 'updated_at', sort_direction: 'asc',
    category_query: [{ category_id: 'category', query: [{ type: 'select', key: 'size', option_keys: ['large'] }] }] };
  const first = await api.find({ store_id: STORE_ID, ...filters });
  assert.deepEqual(first, { items: [], cursor: 'customer:+/=' });
  assert.deepEqual(await api.find({ store_id: STORE_ID, ...filters, cursor: first.cursor }), { items: [], cursor: null });
  assert.equal(calls[1].url.searchParams.get('cursor'), first.cursor);
  for (const call of calls) {
    assert.equal(call.url.pathname, `/v1/stores/${STORE_ID}/customers`);
    assert.equal(call.url.searchParams.has('store_id'), false);
    assert.equal(call.method, 'GET');
    assert.equal(call.body, undefined);
    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) assert.deepEqual(JSON.parse(call.url.searchParams.get(key)), value);
      else assert.equal(call.url.searchParams.get(key), String(value));
    }
  }
});

test('Customer exact-ID batches preserve request order without adding discovery controls', async context => {
  let request;
  const response = { items: [{ customer: { id: 'second' }, has_cart: false, has_customer_action: false }, { customer: { id: 'first' }, has_cart: true, has_customer_action: false }], cursor: null };
  context.mock.method(globalThis, 'fetch', async url => {
    request = new URL(url);
    return new Response(JSON.stringify(response), { headers: { 'content-type': 'application/json' } });
  });
  const api = createAdmin({ baseUrl: 'https://customers.test', apiToken: 'arky_api_customers' }).customers;
  assert.deepEqual(await api.find({ store_id: STORE_ID, ids: ['second', 'first'] }), response);
  assert.equal(request.pathname, `/v1/stores/${STORE_ID}/customers`);
  assert.deepEqual(JSON.parse(request.searchParams.get('ids')), ['second', 'first']);
  for (const field of ['store_id', 'query', 'sort_field', 'limit', 'cursor']) assert.equal(request.searchParams.has(field), false);
});
