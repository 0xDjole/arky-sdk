import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';

test('hook discovery carries native controls and preserves empty-page cursors', async context => {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    calls.push({ url: new URL(url), init });
    return new Response(JSON.stringify({ items: [], cursor: 'opaque:+/=' }), {
      headers: { 'content-type': 'application/json' },
    });
  });
  const store = createAdmin({ baseUrl: 'https://hooks.test', storeId: 'unused' }).store;
  for (const owner of [store.buildHook, store.webhook]) {
    const params = { store_id: 'owner', query: 'lookup', status: 'disabled', sort_field: 'updated_at', sort_direction: 'asc', limit: 1 };
    const page = await owner.list(params);
    assert.deepEqual(page, { items: [], cursor: 'opaque:+/=' });
    assert.deepEqual(await owner.list({ ...params, cursor: page.cursor }), page);
  }
  for (const [index, call] of calls.entries()) {
    assert.equal(call.init.method, 'GET');
    assert.equal(call.init.body, undefined);
    assert.equal(call.url.pathname, `/v1/stores/owner/${index < 2 ? 'build-hooks' : 'webhooks'}`);
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
  const store = createAdmin({ baseUrl: 'https://hooks.test', storeId: 'unused' }).store;
  const events = [{ type: 'entry.updated', collection_id: 'collection', key: null }, { type: 'order.created' }];
  const created = await store.webhook.create({ store_id: 'owner', url: 'https://receiver.test', events, headers: {}, secret: 'secret', status: { type: 'active' } });
  assert.deepEqual(created.events, events);
  assert.deepEqual(created.status, { type: 'active' });
  await store.webhook.update({ store_id: 'owner', id: created.id, status: { type: 'disabled' } });
  await store.buildHook.update({ store_id: 'owner', id: 'build', status: { type: 'disabled' } });
  assert.deepEqual(calls.slice(1).map(call => call.body), [{ status: { type: 'disabled' } }, { status: { type: 'disabled' } }]);
});
