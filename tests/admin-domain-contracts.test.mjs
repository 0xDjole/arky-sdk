import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';
import { MemoryStorage } from './helpers/durable-request-fixtures.mjs';

const STORE_ID = 'a4219f3b-50b1-4a78-902b-d7264ae027a9';
const SESSION_ID = '5d0c8a3e-7b21-4f64-9a1e-3c2b8d7e6f50';
const OTHER_SESSION_ID = '0b8e4d27-5f13-4a69-9c2e-7d1a6f3b8e40';

function issued(now, issuedCount, id = SESSION_ID) {
  return {
    id, access_token: `access-${issuedCount}`, refresh_token: `refresh-${issuedCount}`,
    access_expires_at: now + 60000, refresh_expires_at: now + 120000, authenticated_at: now,
    created_at: now, updated_at: now,
  };
}

test('removed Store feature APIs are absent and Store code login names its Store explicitly', async (t) => {
  const calls = [];
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const now = Date.now();
  globalThis.fetch = async (url, init) => {
    const path = new URL(url).pathname;
    calls.push({ path, method: init.method, body: JSON.parse(init.body) });
    if (path.endsWith('/code')) return Response.json({ session_id: SESSION_ID, verification_expires_at: now + 60000 });
    return Response.json(issued(now, 1));
  };
  const admin = createAdmin({ apiUrl: 'https://api.example.test' });
  for (const removed of ['adminDomain', 'branding', 'commerce', 'customerWorkspace', 'marketZone', 'marketPaymentOption', 'paymentTerms']) {
    assert.equal(removed in admin.store, false, removed);
  }
  const pending = await admin.account.auth.requestCode({ session_id: SESSION_ID, email: 'invited@example.test', store_id: STORE_ID, language: 'en' });
  const session = await admin.account.auth.verify({ session_id: pending.session_id, code: '123456', store_id: STORE_ID });
  assert.equal('scope' in session, false);
  assert.deepEqual(admin.session, { id: SESSION_ID, email: 'invited@example.test' });
  assert.deepEqual(calls, [
    { path: `/v1/stores/${STORE_ID}/auth/code`, method: 'POST', body: { session_id: SESSION_ID, email: 'invited@example.test', language: 'en' } },
    { path: `/v1/stores/${STORE_ID}/auth/verify`, method: 'POST', body: { session_id: SESSION_ID, code: '123456' } },
  ]);
  for (const storeId of ['', 'store/one', STORE_ID.toUpperCase()]) {
    await assert.rejects(() => admin.account.auth.requestCode({ session_id: SESSION_ID, email: 'invited@example.test', store_id: storeId, language: 'en' }), TypeError);
  }
  assert.equal(calls.length, 2);
});

test('retained Sessions keep their exact credentials through refresh and a malformed record reads as signed out', async (t) => {
  const storage = new MemoryStorage();
  for (const [key, value] of [['window', new EventTarget()], ['localStorage', storage]]) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]);
  }
  window.localStorage = storage;
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const now = Date.now();
  const requests = [];
  let issuedCount = 0;
  let sessionId = SESSION_ID;
  globalThis.fetch = async (url, init) => {
    requests.push({ url: new URL(url), body: JSON.parse(init.body) });
    issuedCount += 1;
    return Response.json(issued(now, issuedCount, sessionId));
  };
  const storageKey = 'arky_admin_session:https://api.example.test';
  const admin = createAdmin({ apiUrl: 'https://api.example.test' });
  await admin.account.auth.verify({ session_id: 'pending', code: '123456', store_id: STORE_ID });
  assert.deepEqual(admin.session, { id: SESSION_ID, email: undefined });
  assert.deepEqual(JSON.parse(storage.getItem(storageKey)), {
    id: SESSION_ID, access_token: 'access-1', refresh_token: 'refresh-1', access_expires_at: now + 60000,
  });
  const rotated = await admin.account.auth.refresh({ refresh_token: 'refresh-1' });
  assert.equal(rotated.access_token, 'access-2');
  assert.deepEqual(requests.map(({ url }) => url.pathname), [`/v1/stores/${STORE_ID}/auth/verify`, '/v1/auth/refresh']);
  assert.deepEqual(requests[1].body, { refresh_token: 'refresh-1' });
  const stored = JSON.parse(storage.getItem(storageKey));
  assert.equal(stored.id, SESSION_ID);
  assert.equal(stored.access_token, 'access-2');
  assert.equal(stored.refresh_token, 'refresh-2');
  sessionId = OTHER_SESSION_ID;
  await assert.rejects(admin.account.auth.refresh({ refresh_token: 'refresh-2' }), { name: 'ArkyError', code: 'answer_mismatch' });
  assert.equal(JSON.parse(storage.getItem(storageKey)).access_token, 'access-2');
  await assert.rejects(admin.account.auth.refresh({ refresh_token: 'refresh-unknown' }), /Account session changed/);
  delete stored.refresh_token;
  storage.setItem(storageKey, JSON.stringify(stored));
  assert.equal(admin.isAuthenticated, false);
  assert.equal(admin.session, null);
});

test('rejected Account refresh clears retained credentials and notifies consumers while temporary failures remain retryable', async (t) => {
  const storage = new MemoryStorage();
  const browser = Object.assign(new EventTarget(), { localStorage: storage });
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser });
  t.after(() => descriptor ? Object.defineProperty(globalThis, 'window', descriptor) : delete globalThis.window);
  const storageKey = 'arky_admin_session:https://api.example.test';
  const retained = JSON.stringify({
    id: SESSION_ID, access_token: 'expired-access', refresh_token: 'rejected-refresh',
    access_expires_at: Date.now() - 60_000, email: 'operator@example.test',
  });
  const calls = [];
  let status;
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ path: new URL(url).pathname, body: JSON.parse(init.body) });
    if (status === 'network') throw new TypeError('Network unavailable');
    return Response.json({
      message: 'Refresh refused', status_code: status,
      error: status === 403 ? 'GENERAL.UNAUTHORIZED' : 'GENERAL.UNAUTHENTICATED',
    }, { status });
  });
  for (status of [401, 403, 429, 503, 'network']) {
    storage.setItem(storageKey, retained);
    const admin = createAdmin({ apiUrl: 'https://api.example.test' });
    const events = [];
    const unsubscribe = admin.onAuthStateChanged(session => events.push(session));
    await assert.rejects(admin.store.find({ limit: 10 }));
    await Promise.resolve();
    const rejected = status === 401 || status === 403;
    assert.equal(storage.getItem(storageKey), rejected ? null : retained, String(status));
    assert.equal(admin.isAuthenticated, !rejected, String(status));
    assert.equal(events.some(session => session === null), rejected, String(status));
    unsubscribe();
  }
  assert.deepEqual(calls, Array(5).fill({ path: '/v1/auth/refresh', body: { refresh_token: 'rejected-refresh' } }));
});

test('a rejected refresh cannot clear a different Account login completed while it was pending', async (t) => {
  let refuseRefresh;
  const requested = new Promise(resolve => { refuseRefresh = resolve; });
  let refreshStarted;
  const started = new Promise(resolve => { refreshStarted = resolve; });
  const now = Date.now();
  let verifies = 0;
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (new URL(url).pathname === '/v1/auth/refresh') {
      refreshStarted();
      return requested;
    }
    verifies += 1;
    return Response.json(issued(now, verifies, verifies === 1 ? SESSION_ID : OTHER_SESSION_ID));
  });
  const admin = createAdmin({ apiUrl: 'https://api.refresh-race.test' });
  await admin.account.auth.verify({ session_id: SESSION_ID, code: '123456' });
  const refresh = assert.rejects(admin.account.auth.refresh({ refresh_token: 'refresh-1' }));
  await started;
  await admin.account.auth.verify({ session_id: OTHER_SESSION_ID, code: '654321' });
  refuseRefresh(Response.json({ message: 'Unauthorized', error: 'GENERAL.UNAUTHORIZED', status_code: 403 }, { status: 403 }));
  await refresh;
  assert.equal(admin.session.id, OTHER_SESSION_ID);
  assert.equal(admin.isAuthenticated, true);
});

test('API-token rejection preserves the native snake_case failure without refresh or mutation replay', async (t) => {
  const requests = [];
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const response = {
    message: 'Account API token is revoked',
    error: 'INVALID_TOKEN',
    status_code: 401,
    validation_errors: [],
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
  const admin = createAdmin({ apiUrl: 'https://api.example.test', secretKey: token });
  const payload = {
    id: STORE_ID,
    name: 'Account-authorized Store',
    timezone: 'Europe/Sarajevo',
    languages: ['bs', 'en'],
    market: { key: 'bih', currency: 'bam', tax_mode: 'inclusive' },
    sales_channel: { key: 'web' },
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
      assert.deepEqual(error.validationErrors, []);
      assert.deepEqual(error.response, response);
      return true;
    });
  }
  assert.deepEqual(requests, [
    { path: '/v1/accounts/me', method: 'GET', authorization: `Bearer ${token}`, body: null },
    { path: '/v1/stores', method: 'POST', authorization: `Bearer ${token}`, body: payload },
  ]);
  await assert.rejects(async () => admin.store.create({ ...payload, id: 'store-one' }), TypeError);
  assert.equal(requests.length, 2);
});


test('a restored Account bearer reaches protected requests and follows caller-owned credential renewal', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const now = Date.now();
  let credentials = issued(now, 1);
  const calls = [];
  const rejected = [];
  globalThis.fetch = async (url, init) => {
    const headers = new Headers(init.headers);
    calls.push({ path: new URL(url).pathname, authorization: headers.get('authorization') });
    if (headers.get('authorization') === 'Bearer access-1') return Response.json({ error: 'INVALID_TOKEN', message: 'Account session expired', status_code: 401, validation_errors: [] }, { status: 401 });
    return Response.json({ id: 'account', email: 'staff@example.test' });
  };
  const admin = createAdmin({
    apiUrl: 'https://api.example.test',
    forcedHeaders: () => ({ Authorization: `Bearer ${credentials.access_token}` }),
    onUnauthorized: (context) => { rejected.push(context); return false; },
  });
  await assert.rejects(admin.account.getMe(), { statusCode: 401 });
  assert.deepEqual(rejected, [{ hadAuthorization: true, authorizationToken: 'access-1', path: '/v1/accounts/me' }]);
  credentials = issued(now, 2);
  await admin.account.getMe({ headers: { authorization: 'Bearer caller-override' } });
  assert.deepEqual(calls, [
    { path: '/v1/accounts/me', authorization: 'Bearer access-1' },
    { path: '/v1/accounts/me', authorization: 'Bearer access-2' },
  ]);
});
