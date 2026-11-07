import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';
import { createStorefront } from '../dist/storefront.js';
import { fixedIdFactories } from './helpers/arky-fixtures.mjs';

const STORE_ID = '3f8b6d21-c7a4-4e09-9d15-7b2e0a4c6f18';

test('Media discovery preserves combined filters, ordering and empty-page continuation', async context => {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? 'media:+/=' : null }),
      { headers: { 'content-type': 'application/json' } });
  });
  const api = createAdmin({ apiUrl: 'https://media.test', accountToken: 'arky_at_ttttttttttttttttttttttttttttttttttttttttttA' }).media;
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
  const api = createStorefront(`arky_pk_${'m'.repeat(42)}A`, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl: 'https://media.test' });
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
  const api = createStorefront(`arky_pk_${'m'.repeat(42)}A`, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl: 'https://media.test' });
  const ids = Array.from({ length: 205 }, (_, index) => `media-${index}`);
  assert.deepEqual(await api.media.find({ ids }), { items: ids.map((id) => ({ id })), cursor: null });
  assert.deepEqual(asked.map((batch) => batch.length), [100, 100, 5]);
  assert.deepEqual(asked.flat(), ids);
});

test('Storefront media.find refuses an answer that is not a list or names a file it did not ask for', async context => {
  const answers = [{ items: [{ id: 'asked' }] }, [{ id: 'asked' }, { id: 'other' }]];
  context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(answers.shift()), { headers: { 'content-type': 'application/json' } }));
  const api = createStorefront(`arky_pk_${'m'.repeat(42)}A`, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl: 'https://media.test' });
  await assert.rejects(api.media.find({ ids: ['asked'] }), { code: 'answer_mismatch', message: 'The media read did not answer a list' });
  await assert.rejects(api.media.find({ ids: ['asked'] }), { code: 'answer_mismatch', message: 'The media read answered a file it was not asked for' });
});
