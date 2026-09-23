import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';

test('Customer discovery retains combined predicates, native ordering and empty-page continuation', async context => {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? 'customer:+/=' : null }),
      { headers: { 'content-type': 'application/json' } });
  });
  const api = createAdmin({ baseUrl: 'https://customers.test', storeId: 'store' }).customers;
  const filters = { query: 'buyer', status: 'active', has_cart: false, has_customer_action: true,
    has_verified_email: true, limit: 1, sort_field: 'email', sort_direction: 'asc',
    classification_query: [{ classification_id: 'classification', query: [] }] };
  const first = await api.find(filters);
  assert.deepEqual(first, { items: [], cursor: 'customer:+/=' });
  assert.deepEqual(await api.find({ ...filters, cursor: first.cursor }), { items: [], cursor: null });
  assert.equal(calls[1].url.searchParams.get('cursor'), first.cursor);
  for (const call of calls) {
    assert.equal(call.url.pathname, '/v1/stores/store/customers');
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
  const response = { items: [{ id: 'second' }, { id: 'first' }], cursor: null };
  context.mock.method(globalThis, 'fetch', async url => {
    request = new URL(url);
    return new Response(JSON.stringify(response), { headers: { 'content-type': 'application/json' } });
  });
  const api = createAdmin({ baseUrl: 'https://customers.test', storeId: 'store' }).customers;
  assert.deepEqual(await api.find({ ids: ['second', 'first'] }), response);
  assert.deepEqual(JSON.parse(request.searchParams.get('ids')), ['second', 'first']);
  for (const field of ['query', 'sort_field', 'limit', 'cursor']) assert.equal(request.searchParams.has(field), false);
});
