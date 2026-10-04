import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';
import { MemoryStorage } from './helpers/durable-request-fixtures.mjs';

const STORE_ID = 'a4219f3b-50b1-4a78-902b-d7264ae027a9';
const SESSION_ID = '5d0c8a3e-7b21-4f64-9a1e-3c2b8d7e6f50';

test('removed Store feature APIs are absent and canonical Store code login stays Account-wide', async (t) => {
  const calls = [];
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const now = Date.now();
  globalThis.fetch = async (url, init) => {
    const path = new URL(url).pathname;
    calls.push({ path, method: init.method, body: JSON.parse(init.body) });
    if (path.endsWith('/code')) return Response.json({ session_id: SESSION_ID, verification_expires_at: now + 60000 });
    return Response.json({
      id: SESSION_ID, scope: { type: 'account' }, access_token: 'access', refresh_token: 'refresh',
      access_expires_at: now + 60000, refresh_expires_at: now + 120000, authenticated_at: now,
      created_at: now, updated_at: now,
    });
  };
  const admin = createAdmin({ baseUrl: 'https://api.example.test' });
  assert.equal('adminDomain' in admin.store, false);
  assert.equal('branding' in admin.store, false);
  const pending = await admin.account.auth.storeCode(STORE_ID, { email: 'invited@example.test' });
  const session = await admin.account.auth.storeVerify(STORE_ID, { session_id: pending.session_id, code: '123456' });
  assert.deepEqual(session.scope, { type: 'account' });
  assert.deepEqual(calls, [
    { path: `/v1/stores/${STORE_ID}/auth/code`, method: 'POST', body: { email: 'invited@example.test' } },
    { path: `/v1/stores/${STORE_ID}/auth/verify`, method: 'POST', body: { session_id: SESSION_ID, code: '123456' } },
  ]);
  for (const storeId of [undefined, 'store/one', STORE_ID.toUpperCase()]) {
    await assert.rejects(() => admin.account.auth.storeCode(storeId, { email: 'invited@example.test' }), TypeError);
  }
  assert.equal(calls.length, 2);
});

test('retained restricted Sessions keep their exact issued scope through refresh and reject missing scope', async (t) => {
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


test('API-token rejection preserves the native failure without refresh or mutation replay', async (t) => {
  const requests = [];
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const response = {
    message: 'Account API token is revoked',
    error: 'INVALID_TOKEN',
    statusCode: 401,
    validationErrors: [],
  };
  globalThis.fetch = async (url, init) => {
    requests.push({
      path: new URL(url).pathname,
      method: init.method,
      authorization: init.headers.Authorization,
      body: init.body === undefined ? null : JSON.parse(init.body),
    });
    return Response.json(response, { status: 401, headers: { 'x-request-id': 'native-auth-rejection' } });
  };
  const token = 'arky_api_native-revoked-credential';
  const admin = createAdmin({ baseUrl: 'https://api.example.test', apiToken: token });
  const payload = {
    name: 'Account-authorized Store',
    billing_email: 'owner@example.test',
    contact_email: null,
    timezone: 'Europe/Sarajevo',
    default_language: 'bs',
    supported_languages: ['bs'],
  };
  for (const operation of [
    () => admin.account.getMe({}),
    () => admin.store.create(payload),
  ]) {
    await assert.rejects(operation, (error) => {
      assert.equal(error.message, response.message);
      assert.equal(error.statusCode, 401);
      assert.equal(error.code, 'INVALID_TOKEN');
      assert.equal(error.requestId, 'native-auth-rejection');
      assert.deepEqual(error.response, response);
      return true;
    });
  }
  assert.deepEqual(requests, [
    { path: '/v1/accounts/me', method: 'GET', authorization: `Bearer ${token}`, body: null },
    { path: '/v1/stores', method: 'POST', authorization: `Bearer ${token}`, body: payload },
  ]);
});
