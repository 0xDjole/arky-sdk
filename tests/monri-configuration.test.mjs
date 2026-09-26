import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';

test('Monri creation sends explicit credentials once to the selected Store and returns the safe configuration', async () => {
  const original = globalThis.fetch;
  const calls = [];
  const result = { id: 'provider', configuration: { type: 'monri', environment: 'test' } };
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } });
  };
  try {
    const api = createAdmin({ baseUrl: 'https://api.example.test', storeId: 'default', apiToken: 'arky_api_test' }).store.paymentOption;
    const input = { id: 'provider', key: 'cards', blocks: [], environment: 'test', merchant_key: 'submitted-secret', authenticity_token: 'submitted-token', status: { type: 'disabled' } };
    for (const store_id of ['selected', undefined]) {
      assert.deepEqual(await api.monri.create({ ...input, store_id }), result);
      const call = calls.at(-1);
      assert.equal(call.url.pathname, `/v1/stores/${store_id ?? 'default'}/payment-options/monri`);
      assert.equal(call.init.method, 'POST');
      assert.deepEqual(JSON.parse(call.init.body), { store_id: store_id ?? 'default', ...input });
    }
    assert.equal(calls.length, 2);
    for (const status of [403, 409, 503]) {
      let attempts = 0;
      globalThis.fetch = async () => { attempts++; return new Response(JSON.stringify({ message: 'failed' }), { status }); };
      await assert.rejects(api.monri.create(input), error => error.statusCode === status);
      assert.equal(attempts, 1);
    }
  } finally { globalThis.fetch = original; }
});

test('provider availability uses the exact current owner and timestamp without resending credentials', async () => {
  const original = globalThis.fetch;
  const calls = [];
  const result = { id: 'provider', store_id: 'selected', status: { type: 'disabled' }, configuration: { type: 'monri', environment: 'test' } };
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return Response.json(result);
  };
  try {
    const api = createAdmin({ baseUrl: 'https://api.example.test', storeId: 'default', apiToken: 'arky_api_test' }).store.paymentOption;
    const input = { store_id: 'selected', id: 'provider', expected_updated_at: 1000, blocks: [], status: { type: 'disabled' } };
    assert.deepEqual(await api.update(input), result);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.pathname, '/v1/stores/selected/payment-options/provider');
    assert.equal(calls[0].init.method, 'PUT');
    assert.deepEqual(JSON.parse(calls[0].init.body), input);
  } finally { globalThis.fetch = original; }
});
