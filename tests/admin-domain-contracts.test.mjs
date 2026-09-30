import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';
import { MemoryStorage } from './helpers/durable-request-fixtures.mjs';

const STORE_ID = 'a4219f3b-50b1-4a78-902b-d7264ae027a9';
const SESSION_ID = '5d0c8a3e-7b21-4f64-9a1e-3c2b8d7e6f50';

test('Admin domain commands use exact ownership and operation identities without provider requests', async (t) => {
  const calls = [];
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : null });
    return init.method === 'DELETE' ? new Response(null, { status: 204 }) : Response.json({ id: 'domain' });
  };
  const api = createAdmin({ baseUrl: 'https://api.example.test', market: 'us', apiToken: 'test' }).store.adminDomain;
  const change = { store_id: STORE_ID, id: 'domain/one', expected_updated_at: 1790000000000 };
  await api.create({ store_id: STORE_ID, id: change.id, hostname: 'admin.example.com' });
  await api.get({ store_id: STORE_ID, id: change.id });
  await api.verify(change);
  await api.restart(change);
  await api.disable(change);
  await api.registerHosting({ store_id: STORE_ID, id: change.id, operation_id: 'register-one' });
  await api.removeHosting({ store_id: STORE_ID, id: change.id, operation_id: 'remove-one' });
  await api.retryHosting({ store_id: STORE_ID, id: change.id, operation_id: 'retry-one', failed_operation_id: 'remove-one' });
  await api.remove(change);
  await api.resolve('admin.example.com');
  assert.deepEqual(calls.map((call) => [call.method, call.url.pathname]), [
    ['POST', `/v1/stores/${STORE_ID}/admin-domains`],
    ['GET', `/v1/stores/${STORE_ID}/admin-domains/domain%2Fone`],
    ...['verify', 'restart', 'disable', 'hosting/register', 'hosting/remove', 'hosting/retry'].map((action) => ['POST', `/v1/stores/${STORE_ID}/admin-domains/domain%2Fone/${action}`]),
    ['DELETE', `/v1/stores/${STORE_ID}/admin-domains/domain%2Fone`],
    ['GET', '/v1/admin-domains/admin.example.com'],
  ]);
  assert.deepEqual(calls[0].body, { id: change.id, hostname: 'admin.example.com' });
  assert.deepEqual(calls[2].body, { expected_updated_at: change.expected_updated_at });
  assert.deepEqual(calls[5].body, { operation_id: 'register-one' });
  assert.deepEqual(calls[7].body, { operation_id: 'retry-one', failed_operation_id: 'remove-one' });
  assert.equal(calls[8].url.searchParams.get('expected_updated_at'), String(change.expected_updated_at));
  assert.equal(calls[8].url.searchParams.has('store_id'), false);
  for (const store_id of [undefined, 'store/one', STORE_ID.toUpperCase()]) {
    await assert.rejects(async () => api.get({ store_id, id: change.id }), { name: 'TypeError', message: 'A Store target must be an explicit canonical UUID-v4' });
    await assert.rejects(async () => api.verify({ ...change, store_id }), TypeError);
  }
  assert.equal(calls.length, 10);
});

test('the browser retains and exposes the exact issued Store scope through refresh and rejects missing scope', async (t) => {
  const storage = new MemoryStorage();
  for (const [key, value] of [['window', new EventTarget()], ['localStorage', storage]]) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]);
  }
  window.localStorage = storage;
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const scope = { type: 'store', store_id: STORE_ID };
  const now = Date.now();
  const requests = [];
  let issued = 0;
  globalThis.fetch = async (url, init) => {
    requests.push({ url: new URL(url), body: JSON.parse(init.body) });
    issued += 1;
    return Response.json({
      id: SESSION_ID, scope, access_token: `access-${issued}`, refresh_token: `refresh-${issued}`,
      access_expires_at: now + 60000, refresh_expires_at: now + 120000, authenticated_at: now,
      created_at: now, updated_at: now,
    });
  };
  const storageKey = 'arky_admin_session:https://api.example.test';
  const admin = createAdmin({ baseUrl: 'https://api.example.test', market: 'us' });
  await admin.account.auth.storeVerify(STORE_ID, { session_id: 'pending', code: '123456' });
  assert.deepEqual(admin.session, { id: SESSION_ID, email: undefined, scope });
  assert.deepEqual(JSON.parse(storage.getItem(storageKey)).scope, scope);
  assert.equal(JSON.parse(storage.getItem(storageKey)).id, SESSION_ID);
  await admin.account.auth.refresh({ refresh_token: 'refresh-1' });
  assert.deepEqual(requests.map(({ url }) => url.pathname), [`/v1/stores/${STORE_ID}/auth/verify`, '/v1/auth/refresh']);
  assert.deepEqual(requests[1].body, { refresh_token: 'refresh-1' });
  assert.deepEqual(admin.session.scope, scope);
  const stored = JSON.parse(storage.getItem(storageKey));
  assert.equal(stored.id, SESSION_ID);
  assert.equal(stored.access_token, 'access-2');
  assert.equal(stored.refresh_token, 'refresh-2');
  delete stored.scope;
  storage.setItem(storageKey, JSON.stringify(stored));
  assert.equal(admin.isAuthenticated, false);
  assert.equal(admin.session, null);
});
