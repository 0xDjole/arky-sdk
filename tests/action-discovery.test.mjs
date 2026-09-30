import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';

const STORE_ID = '0f7c2d4e-5a61-4b8c-9d3e-2f1a6b7c8d90';

test('Action timeline preserves Customer scope and empty-page continuation', async context => {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? 'action:+/=' : null }),
      { headers: { 'content-type': 'application/json' } });
  });
  const api = createAdmin({ baseUrl: 'https://actions.test' }).actions;
  const first = await api.find({ store_id: STORE_ID, customer_id: 'customer', limit: 1 });
  assert.deepEqual(first, { items: [], cursor: 'action:+/=' });
  assert.deepEqual(await api.find({ store_id: STORE_ID, customer_id: 'customer', limit: 1, cursor: first.cursor }), { items: [], cursor: null });
  assert.equal(calls[1].url.searchParams.get('cursor'), first.cursor);
  for (const call of calls) {
    assert.equal(call.method, 'GET');
    assert.equal(call.body, undefined);
    assert.equal(call.url.pathname, `/v1/stores/${STORE_ID}/actions`);
    assert.equal(call.url.searchParams.get('customer_id'), 'customer');
    assert.equal(call.url.searchParams.get('limit'), '1');
    for (const field of ['store_id', 'origin', 'data', 'type', 'offset']) assert.equal(call.url.searchParams.has(field), false);
  }
});
