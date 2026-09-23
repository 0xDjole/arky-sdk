import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';
import { createStorefront } from '../dist/storefront.js';

test('Media discovery preserves combined filters, ordering and empty-page continuation', async context => {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? 'media:+/=' : null }),
      { headers: { 'content-type': 'application/json' } });
  });
  const api = createAdmin({ baseUrl: 'https://media.test', storeId: 'store' }).media;
  const filters = { query: 'invoice', ids: ['media-a', 'media-b'], mime_type: 'application', limit: 1,
    sort_field: 'original_file_name', sort_direction: 'asc' };
  const first = await api.find(filters);
  assert.deepEqual(first, { items: [], cursor: 'media:+/=' });
  assert.deepEqual(await api.find({ ...filters, cursor: first.cursor }), { items: [], cursor: null });
  assert.equal(calls[1].url.searchParams.get('cursor'), first.cursor);
  for (const call of calls) {
    assert.equal(call.url.pathname, '/v1/stores/store/media');
    assert.equal(call.method, 'GET');
    assert.equal(call.body, undefined);
    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) assert.deepEqual(JSON.parse(call.url.searchParams.get(key)), value);
      else assert.equal(call.url.searchParams.get(key), String(value));
    }
  }
});

test('Storefront Media reference batches remain exact and preserve request order', async context => {
  const calls = [];
  const roots = [{ id: 'second' }, { id: 'first' }];
  context.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method });
    return new Response(JSON.stringify(roots), { headers: { 'content-type': 'application/json' } });
  });
  const api = createStorefront(`arky_pk_${'m'.repeat(42)}A`, { apiUrl: 'https://media.test' });
  assert.deepEqual(await api.media.findByIds({ ids: ['second', 'first'] }), roots);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.pathname, '/v1/storefront/media');
  assert.equal(calls[0].method, 'GET');
  assert.deepEqual(JSON.parse(calls[0].url.searchParams.get('ids')), ['second', 'first']);
  for (const field of ['query', 'cursor', 'sort_field', 'store_id']) assert.equal(calls[0].url.searchParams.has(field), false);
});
