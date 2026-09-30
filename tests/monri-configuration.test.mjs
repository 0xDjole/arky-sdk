import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';

const STORE_ID = '9a4c2e71-5d38-4b06-8f1a-2c7e9b3d5f40';
const OTHER_STORE_ID = '1f6b8d23-4e97-4a50-b2c8-7d0e5a9c3f16';

test('Monri creation sends explicit credentials once to the selected Store and returns the safe configuration', async () => {
  const original = globalThis.fetch;
  const calls = [];
  const result = { id: 'provider', type: { type: 'monri', environment: 'test' } };
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } });
  };
  try {
    const api = createAdmin({ baseUrl: 'https://api.example.test', apiToken: 'arky_api_test' }).store.paymentOption;
    const input = { id: 'provider', key: 'cards', blocks: [], environment: 'test', merchant_key: 'submitted-secret', authenticity_token: 'submitted-token', status: { type: 'disabled' } };
    for (const store_id of [STORE_ID, OTHER_STORE_ID]) {
      assert.deepEqual(await api.monri.create({ ...input, store_id }), result);
      const call = calls.at(-1);
      assert.equal(call.url.pathname, `/v1/stores/${store_id}/payment-options/monri`);
      assert.equal(call.init.method, 'POST');
      assert.deepEqual(JSON.parse(call.init.body), input);
    }
    assert.equal(calls.length, 2);
    for (const store_id of [undefined, 'default', 'selected']) {
      await assert.rejects(async () => api.monri.create({ ...input, store_id }), TypeError);
    }
    assert.equal(calls.length, 2);
    for (const status of [403, 409, 503]) {
      let attempts = 0;
      globalThis.fetch = async () => { attempts++; return new Response(JSON.stringify({ message: 'failed' }), { status }); };
      await assert.rejects(api.monri.create({ ...input, store_id: STORE_ID }), error => error.statusCode === status);
      assert.equal(attempts, 1);
    }
  } finally { globalThis.fetch = original; }
});

test('provider availability uses the exact current owner and timestamp without resending credentials', async () => {
  const original = globalThis.fetch;
  const calls = [];
  const result = { id: 'provider', store_id: STORE_ID, status: { type: 'disabled' }, type: { type: 'monri', environment: 'test' } };
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return Response.json(result);
  };
  try {
    const api = createAdmin({ baseUrl: 'https://api.example.test', apiToken: 'arky_api_test' }).store.paymentOption;
    const input = { store_id: STORE_ID, id: 'provider', expected_updated_at: 1000, blocks: [], status: { type: 'disabled' } };
    assert.deepEqual(await api.update(input), result);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.pathname, `/v1/stores/${STORE_ID}/payment-options/provider`);
    assert.equal(calls[0].init.method, 'PUT');
    assert.deepEqual(JSON.parse(calls[0].init.body), { expected_updated_at: 1000, blocks: [], status: { type: 'disabled' } });
  } finally { globalThis.fetch = original; }
});
