import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';
import { createStorefront } from '../dist/storefront.js';

const STORE_ID = '3f8b6d21-c7a4-4e09-9d15-7b2e0a4c6f18';

test('Media discovery preserves combined filters, ordering and empty-page continuation', async context => {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? 'media:+/=' : null }),
      { headers: { 'content-type': 'application/json' } });
  });
  const api = createAdmin({ apiUrl: 'https://media.test', secretKey: 'arky_api_media' }).media;
  const filters = { query: 'invoice', ids: ['media-a', 'media-b'], type: 'document', limit: 1,
    sort_field: 'file_name', sort_direction: 'asc' };
  const first = await api.find({ store_id: STORE_ID, ...filters });
  assert.deepEqual(first, { items: [], cursor: 'media:+/=' });
  assert.deepEqual(await api.find({ store_id: STORE_ID, ...filters, cursor: first.cursor }), { items: [], cursor: null });
  assert.equal(calls[1].url.searchParams.get('cursor'), first.cursor);
  for (const call of calls) {
    assert.equal(call.url.pathname, `/v1/stores/${STORE_ID}/media`);
    assert.equal(call.url.searchParams.has('store_id'), false);
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
  const api = createStorefront(`arky_pk_${'m'.repeat(42)}A`, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl: 'https://media.test' });
  assert.deepEqual(await api.media.find({ ids: ['second', 'first'] }), { items: roots, cursor: null });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.pathname, '/v1/storefront/media');
  assert.equal(calls[0].method, 'GET');
  assert.deepEqual(JSON.parse(calls[0].url.searchParams.get('ids')), ['second', 'first']);
  for (const field of ['query', 'cursor', 'sort_field', 'store_id']) assert.equal(calls[0].url.searchParams.has(field), false);
});

test('Storefront media.find takes any number of ids and reads them 100 at a time', async context => {
  const asked = [];
  context.mock.method(globalThis, 'fetch', async (url) => {
    const ids = JSON.parse(new URL(url).searchParams.get('ids'));
    asked.push(ids);
    return new Response(JSON.stringify(ids.map((id) => ({ id }))), { headers: { 'content-type': 'application/json' } });
  });
  const api = createStorefront(`arky_pk_${'m'.repeat(42)}A`, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl: 'https://media.test' });
  const ids = Array.from({ length: 205 }, (_, index) => `media-${index}`);
  assert.deepEqual(await api.media.find({ ids }), { items: ids.map((id) => ({ id })), cursor: null });
  assert.deepEqual(asked.map((batch) => batch.length), [100, 100, 5]);
  assert.deepEqual(asked.flat(), ids);
});
