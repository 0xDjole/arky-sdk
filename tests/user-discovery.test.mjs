import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';

const TENANT_ID = '9c2e5b74-1f38-4a6d-8b05-3e7f0a9d6c12';

test('User discovery retains combined predicates, native ordering and empty-page continuation', async context => {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? 'user:+/=' : null }),
      { headers: { 'content-type': 'application/json' } });
  });
  const api = createAdmin({ apiUrl: 'https://users.test', accountToken: 'arky_at_ttttttttttttttttttttttttttttttttttttttttttA' }).users;
  const filters = { query: 'buyer', status: 'active', has_cart: false, has_user_action: true,
    email_type: 'verified', limit: 1, sort_field: 'updated_at', sort_direction: 'asc',
    category_query: [{ category_id: 'category', query: [{ type: 'select', key: 'size', option_keys: ['large'] }] }] };
  const first = await api.find({ tenant_id: TENANT_ID, ...filters });
  assert.deepEqual(first, { items: [], cursor: 'user:+/=' });
  assert.deepEqual(await api.find({ tenant_id: TENANT_ID, ...filters, cursor: first.cursor }), { items: [], cursor: null });
  assert.equal(calls[1].url.searchParams.get('cursor'), first.cursor);
  for (const call of calls) {
    assert.equal(call.url.pathname, `/v1/tenants/${TENANT_ID}/users`);
    assert.equal(call.url.searchParams.has('tenant_id'), false);
    assert.equal(call.method, 'GET');
    assert.equal(call.body, undefined);
    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) assert.deepEqual(JSON.parse(call.url.searchParams.get(key)), value);
      else assert.equal(call.url.searchParams.get(key), String(value));
    }
  }
});

test('User exact-ID batches preserve request order without adding discovery controls', async context => {
  let request;
  const response = { items: [{ user: { id: 'second' }, has_cart: false, has_user_action: false }, { user: { id: 'first' }, has_cart: true, has_user_action: false }], cursor: null };
  context.mock.method(globalThis, 'fetch', async url => {
    request = new URL(url);
    return new Response(JSON.stringify(response), { headers: { 'content-type': 'application/json' } });
  });
  const api = createAdmin({ apiUrl: 'https://users.test', accountToken: 'arky_at_ttttttttttttttttttttttttttttttttttttttttttA' }).users;
  assert.deepEqual(await api.find({ tenant_id: TENANT_ID, ids: ['second', 'first'] }), response);
  assert.equal(request.pathname, `/v1/tenants/${TENANT_ID}/users`);
  assert.deepEqual(JSON.parse(request.searchParams.get('ids')), ['second', 'first']);
  for (const field of ['tenant_id', 'query', 'sort_field', 'limit', 'cursor']) assert.equal(request.searchParams.has(field), false);
});

test('A user list row names each contact with its state and phone SMS choice, and whether the user is linked', async context => {
  const contacts = [
    { status: 'unconfirmed', address: { type: 'phone', number: '+38761111111', sms: 'on' } },
    { status: 'confirmed', address: { type: 'phone', number: '+38761222222', sms: 'off' } },
    { status: 'confirmed', address: { type: 'email', email: 'ana@example.test' } },
  ];
  const response = {
    items: [{ user: { id: 'patient' }, contacts, linked: true, has_cart: false, has_user_action: false, has_order: false, latest_order_contact: null }],
    cursor: null,
  };
  context.mock.method(globalThis, 'fetch', async () =>
    new Response(JSON.stringify(response), { headers: { 'content-type': 'application/json' } }));
  const api = createAdmin({ apiUrl: 'https://users.test', accountToken: 'arky_at_ttttttttttttttttttttttttttttttttttttttttttA' }).users;
  const page = await api.find({ tenant_id: TENANT_ID });
  assert.deepEqual(page.items[0].contacts, contacts);
  assert.equal(page.items[0].linked, true);
  assert.equal('logins' in page.items[0], false);
  assert.deepEqual(page.items[0].contacts.map((contact) => contact.address.type === 'phone' ? contact.address.sms : null), ['on', 'off', null]);
});
