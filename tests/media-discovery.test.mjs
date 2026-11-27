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
  const filters = { query: 'invoice', ids: ['media-a', 'media-b'], type: 'pdf', visibility: 'private', limit: 1,
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
  const api = createStorefront({ storeId: "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19", salesChannelId: "e5a8c2d7-3b91-4f06-9d4e-1c7b6a0f3e28" }, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl: 'https://media.test' });
  assert.deepEqual(await api.media.find({ ids: ['second', 'first'] }), roots);
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
  const api = createStorefront({ storeId: "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19", salesChannelId: "e5a8c2d7-3b91-4f06-9d4e-1c7b6a0f3e28" }, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl: 'https://media.test' });
  const ids = Array.from({ length: 205 }, (_, index) => `media-${index}`);
  assert.deepEqual(await api.media.find({ ids }), ids.map((id) => ({ id })));
  assert.deepEqual(asked.map((batch) => batch.length), [100, 100, 5]);
  assert.deepEqual(asked.flat(), ids);
});

test('Storefront media.find refuses an answer that is not a list or names a file it did not ask for', async context => {
  const answers = [{ items: [{ id: 'asked' }] }, [{ id: 'asked' }, { id: 'other' }]];
  context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(answers.shift()), { headers: { 'content-type': 'application/json' } }));
  const api = createStorefront({ storeId: "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19", salesChannelId: "e5a8c2d7-3b91-4f06-9d4e-1c7b6a0f3e28" }, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl: 'https://media.test' });
  await assert.rejects(api.media.find({ ids: ['asked'] }), { code: 'answer_mismatch', message: 'The media read did not answer a list' });
  await assert.rejects(api.media.find({ ids: ['asked'] }), { code: 'answer_mismatch', message: 'The media read answered a file it was not asked for' });
});

test('A spoken prompt is made under the app-picked media id with its login and voice, and voices are listed for one login', async context => {
  const calls = [];
  const media = { id: '6c1e9a47-2b58-4f03-8d6a-1e7c3b9f5a20', store_id: STORE_ID };
  const voices = { items: [{ voice_id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', preview_url: null, languages: ['bs', 'en'] }], cursor: 'voices:+/=' };
  context.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const call = { url: new URL(url), method: init.method ?? 'GET', body: init.body ? JSON.parse(init.body) : null };
    calls.push(call);
    return new Response(JSON.stringify(call.method === 'POST' ? media : voices), { headers: { 'content-type': 'application/json' } });
  });
  const api = createAdmin({ apiUrl: 'https://media.test', accountToken: 'arky_at_ttttttttttttttttttttttttttttttttttttttttttA' }).media;
  const storeProviderId = '2d7f4b19-8c35-4a60-9e12-5b3d7f1a9c46';
  const networkProviderId = '9a3c5e71-4b28-4d06-8f1a-2c7e9b5d3f60';
  const prompt = { media_id: media.id, text: 'Dobar dan, ovdje ordinacija.', language: 'bs', login: { type: 'store', store_provider_id: storeProviderId }, voice: { type: 'eleven_labs', voice_id: 'JBFqnCBsd6RMkjVDRZzb' } };
  assert.deepEqual(await api.speak({ store_id: STORE_ID, ...prompt }), media);
  assert.deepEqual(await api.findVoices({ store_id: STORE_ID, store_provider_id: storeProviderId }), voices);
  assert.deepEqual(await api.findVoices({ store_id: STORE_ID, network_provider_id: networkProviderId, limit: 10, cursor: voices.cursor }), voices);
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, Object.fromEntries(url.searchParams), body]), [
    ['POST', `/v1/stores/${STORE_ID}/spoken-prompts`, {}, prompt],
    ['GET', `/v1/stores/${STORE_ID}/voices`, { store_provider_id: storeProviderId }, null],
    ['GET', `/v1/stores/${STORE_ID}/voices`, { network_provider_id: networkProviderId, limit: '10', cursor: voices.cursor }, null],
  ]);
  await assert.rejects(async () => api.speak({ store_id: STORE_ID, ...prompt, media_id: 'greeting' }), TypeError);
  await assert.rejects(async () => api.speak({ store_id: 'shop', ...prompt }), TypeError);
  assert.equal(calls.length, 3);
});
