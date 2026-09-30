import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAdmin } from '../dist/admin.js';

const STORE_ID = '1e8a4c63-7d25-4b9f-a0c1-5f2d8e6b3a47';

test('identity discovery keeps native filters and opaque continuation, with separate exact commands', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const identity = { id: 'identity', store_id: STORE_ID, customer_id: 'customer', type: { type: 'email', email: 'private@example.test' }, status: { type: 'active' }, verified_at: null, created_at: 1, updated_at: 1 };
  const page = { items: [identity], cursor: 'opaque:+/=' };
  globalThis.fetch = async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ path: parsed.pathname, query: Object.fromEntries(parsed.searchParams), method: init.method, body: init.body ? JSON.parse(init.body) : null });
    if (parsed.pathname.endsWith('/identities')) return Response.json(page);
    return Response.json(parsed.pathname.endsWith('/revoke') ? { ...identity, status: { type: 'revoked' } } : identity);
  };
  try {
    const admin = createAdmin({ baseUrl: 'https://api.example.test' });
    const scope = { store_id: STORE_ID, customer_id: 'customer' };
    assert.deepEqual(await admin.customers.identities({ ...scope, status: 'active', verified: false, limit: 1 }), page);
    await admin.customers.identities({ ...scope, status: 'active', verified: false, limit: 1, cursor: page.cursor });
    assert.deepEqual(await admin.customers.getIdentity({ ...scope, identity_id: 'identity' }), identity);
    assert.equal((await admin.customers.revokeIdentity({ ...scope, identity_id: 'identity' })).status.type, 'revoked');
    const path = `/v1/stores/${STORE_ID}/customers/customer/identities`;
    assert.deepEqual(calls, [
      { path, query: { status:'active',verified:'false',limit:'1' }, method:'GET',body:null },
      { path, query: { status:'active',verified:'false',limit:'1',cursor:'opaque:+/=' }, method:'GET',body:null },
      { path: `${path}/identity`, query:{},method:'GET',body:null },
      { path: `${path}/identity/revoke`, query:{},method:'POST',body:null }
    ]);
  } finally { globalThis.fetch = originalFetch; }
});
