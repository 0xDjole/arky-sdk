import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';
import { MemoryStorage } from './helpers/durable-request-fixtures.mjs';

test('Admin domain commands use exact ownership and operation identities without provider requests', async (t) => {
  const calls = [];
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : null });
    return init.method === 'DELETE' ? new Response(null, { status: 204 }) : Response.json({ id: 'domain' });
  };
  const api = createAdmin({ baseUrl: 'https://api.example.test', storeId: 'store/one', market: 'us', apiToken: 'test' }).store.adminDomain;
  const change = { id: 'domain/one', expected_updated_at: 1790000000000 };
  await api.create({ id: change.id, hostname: 'admin.example.com' });
  await api.get({ id: change.id });
  await api.verify(change);
  await api.restart(change);
  await api.disable(change);
  await api.registerHosting({ id: change.id, operation_id: 'register-one' });
  await api.removeHosting({ id: change.id, operation_id: 'remove-one' });
  await api.retryHosting({ id: change.id, operation_id: 'retry-one', failed_operation_id: 'remove-one' });
  await api.remove(change);
  await api.resolve('admin.example.com');
  assert.deepEqual(calls.map((call) => [call.method, call.url.pathname]), [
    ['POST', '/v1/stores/store%2Fone/admin-domains'],
    ['GET', '/v1/stores/store%2Fone/admin-domains/domain%2Fone'],
    ...['verify', 'restart', 'disable', 'hosting/register', 'hosting/remove', 'hosting/retry'].map((action) => ['POST', `/v1/stores/store%2Fone/admin-domains/domain%2Fone/${action}`]),
    ['DELETE', '/v1/stores/store%2Fone/admin-domains/domain%2Fone'],
    ['GET', '/v1/admin-domains/admin.example.com'],
  ]);
  assert.deepEqual(calls[2].body, { expected_updated_at: change.expected_updated_at });
  assert.deepEqual(calls[5].body, { operation_id: 'register-one' });
  assert.deepEqual(calls[7].body, { operation_id: 'retry-one', failed_operation_id: 'remove-one' });
  assert.equal(calls[8].url.searchParams.get('expected_updated_at'), String(change.expected_updated_at));
});

test('the browser retains and exposes the exact issued Store scope through refresh and rejects missing scope', async (t) => {
  const storage = new MemoryStorage();
  for (const [key, value] of [['window', {}], ['localStorage', storage]]) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]);
  }
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const scope = { type: 'store', store_id: 'a4219f3b-50b1-4a78-902b-d7264ae027a9' };
  globalThis.fetch = async () => Response.json({ scope, access_token: 'access', refresh_token: 'refresh', access_expires_at: Date.now() + 60000 });
  const admin = createAdmin({ baseUrl: 'https://api.example.test', storeId: scope.store_id, market: 'us' });
  await admin.account.auth.storeVerify(scope.store_id, { session_id: 'pending', code: '123456' });
  assert.deepEqual(admin.session.scope, scope);
  assert.deepEqual(JSON.parse(storage.getItem('arky_admin_session:v2')).session.scope, scope);
  await admin.account.auth.refresh({ refresh_token: 'refresh' });
  assert.deepEqual(admin.session.scope, scope);
  const stored = JSON.parse(storage.getItem('arky_admin_session:v2'));
  delete stored.session.scope;
  storage.setItem('arky_admin_session:v2', JSON.stringify(stored));
  assert.equal(admin.isAuthenticated, false);
});
