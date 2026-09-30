import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';

const STORE_ID = 'e7b39c05-4a18-4d62-9f3e-8c1a5b2d7f90';

test('hook discovery carries native controls and preserves empty-page cursors', async context => {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    calls.push({ url: new URL(url), init });
    return new Response(JSON.stringify({ items: [], cursor: 'opaque:+/=' }), {
      headers: { 'content-type': 'application/json' },
    });
  });
  const store = createAdmin({ baseUrl: 'https://hooks.test' }).store;
  for (const owner of [store.buildHook, store.webhook]) {
    const params = { store_id: STORE_ID, query: 'lookup', status: 'disabled', sort_field: 'updated_at', sort_direction: 'asc', limit: 1 };
    const page = await owner.list(params);
    assert.deepEqual(page, { items: [], cursor: 'opaque:+/=' });
    assert.deepEqual(await owner.list({ ...params, cursor: page.cursor }), page);
  }
  for (const [index, call] of calls.entries()) {
    assert.equal(call.init.method, 'GET');
    assert.equal(call.init.body, undefined);
    assert.equal(call.url.pathname, `/v1/stores/${STORE_ID}/${index < 2 ? 'build-hooks' : 'webhooks'}`);
    assert.deepEqual(Object.fromEntries(call.url.searchParams), {
      query: 'lookup', status: 'disabled', sort_field: 'updated_at', sort_direction: 'asc', limit: '1',
      ...(index % 2 ? { cursor: 'opaque:+/=' } : {}),
    });
  }
});

test('hook writes preserve tagged statuses and type-tagged scoped subscriptions', async context => {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const body = JSON.parse(init.body);
    calls.push({ url: new URL(url), body });
    return new Response(JSON.stringify({ id: 'hook', ...body }), { headers: { 'content-type': 'application/json' } });
  });
  const store = createAdmin({ baseUrl: 'https://hooks.test' }).store;
  const events = [{ type: 'entry.updated', collection_id: 'collection', key: null }, { type: 'order.created' }];
  const created = await store.webhook.create({ store_id: STORE_ID, url: 'https://receiver.test', events, headers: {}, secret: 'secret', status: { type: 'active' } });
  assert.deepEqual(created.events, events);
  assert.deepEqual(created.status, { type: 'active' });
  await store.webhook.update({ store_id: STORE_ID, id: created.id, status: { type: 'disabled' } });
  await store.buildHook.update({ store_id: STORE_ID, id: 'build', status: { type: 'disabled' } });
  assert.deepEqual(calls.slice(1).map(call => call.body), [{ status: { type: 'disabled' } }, { status: { type: 'disabled' } }]);
  assert.deepEqual(calls.map(call => call.url.pathname), [`/v1/stores/${STORE_ID}/webhooks`, `/v1/stores/${STORE_ID}/webhooks/hook`, `/v1/stores/${STORE_ID}/build-hooks/build`]);
  assert.equal('store_id' in calls[0].body, false);
});
