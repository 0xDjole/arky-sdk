import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';

test('Mailbox discovery sends combined native filters and preserves nullable continuation', async (context) => {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? 'mailbox:+/=' : null }),
      { headers: { 'content-type': 'application/json' } });
  });
  const api = createAdmin({ baseUrl: 'https://mailboxes.test', storeId: 'store', market: 'market' }).notification.mailbox;
  const filters = { ids: ['first', 'second'], query: 'sender@example.com', status: 'draft',
    provider_type: 'smtp_imap', limit: 1, sort_field: 'email', sort_direction: 'asc' };
  const first = await api.find(filters);
  assert.equal(first.cursor, 'mailbox:+/=');
  assert.equal((await api.find({ ...filters, cursor: first.cursor })).cursor, null);
  for (const call of calls) {
    assert.equal(call.url.pathname, '/v1/stores/store/mailboxes');
    assert.equal(call.method, 'GET');
    assert.equal(call.body, undefined);
    assert.deepEqual(JSON.parse(call.url.searchParams.get('ids')), filters.ids);
    for (const [key, value] of Object.entries(filters).filter(([key]) => key !== 'ids')) {
      assert.equal(call.url.searchParams.get(key), String(value));
    }
  }
  assert.equal(calls[1].url.searchParams.get('cursor'), first.cursor);
});

test('Mailbox status mutations and exact reads retain the tagged backend contract', async (context) => {
  const calls = [];
  const root = { id: 'mailbox', store_id: 'store', status: { type: 'draft' } };
  context.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    return new Response(JSON.stringify(root), { headers: { 'content-type': 'application/json' } });
  });
  const api = createAdmin({ baseUrl: 'https://mailboxes.test', storeId: 'store', market: 'market' }).notification.mailbox;
  assert.deepEqual(await api.get({ id: root.id }), root);
  assert.deepEqual(await api.update({ id: root.id, status: { type: 'draft' } }), root);
  assert.equal(calls[0].url.pathname, '/v1/stores/store/mailboxes/mailbox');
  assert.equal(calls[0].method, 'GET');
  assert.equal(calls[1].method, 'PUT');
  assert.deepEqual(calls[1].body, { status: { type: 'draft' } });
});
