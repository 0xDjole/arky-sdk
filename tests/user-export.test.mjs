import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';

const TENANT_ID = '9c2e5b74-1f38-4a6d-8b05-3e7f0a9d6c12';
const USER_ID = '4f0c1d2e-8a6b-4c3d-9e5f-6a7b8c9d0e1f';

test('A patient export is one GET on the user that answers every part and names what was cut', async context => {
  const calls = [];
  const response = {
    user: { id: USER_ID, links: [{ type: 'own' }], contacts: [{ type: 'confirmed_email', email: 'patient@example.test', language: 'bs' }] },
    booking_lines: [],
    entries: [{ entry: { id: 'chart' }, files: [{ media_id: 'scan', link: { url: 'https://files.test/scan', expires_at: 300000 } }] }],
    form_submissions: [],
    conversations: [],
    cut: [{ part: 'calls', reason: 'grant' }, { part: 'form_submissions', reason: 'size' }],
    exported_at: 1000,
  };
  context.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? 'GET', body: init.body });
    return new Response(JSON.stringify(response), { headers: { 'content-type': 'application/json' } });
  });
  const api = createAdmin({ apiUrl: 'https://users.test', accountToken: 'arky_at_ttttttttttttttttttttttttttttttttttttttttttA' }).users;
  const exported = await api.export({ tenant_id: TENANT_ID, id: USER_ID });
  assert.deepEqual(exported, response);
  assert.equal('logins' in exported, false, 'contacts travel on the user, so the export has no login list');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.pathname, `/v1/tenants/${TENANT_ID}/users/${USER_ID}/export`);
  assert.equal(calls[0].method, 'GET');
  assert.equal(calls[0].body, undefined);
  assert.equal([...calls[0].url.searchParams.keys()].length, 0, 'the export takes no query');
});
