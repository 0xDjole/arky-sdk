import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAdmin } from '../dist/admin.js';
import { stripeConnectionFixture } from './helpers/stripe-connection.mjs';

test('Stripe commands bind an existing provider and expose independent exact operation inspection', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const operationId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const result = stripeConnectionFixture('explicit-store', 'provider', operationId);
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method, body: init.body ? JSON.parse(init.body) : null });
    return Response.json(init.method === 'POST' ? result : result.operation);
  };
  try {
    const client = createAdmin({ baseUrl: 'https://api.example.test', storeId: 'default-store' });
    const request = {
      store_id: 'explicit-store', payment_option_id: 'provider', operation_id: operationId,
      return_url: 'https://admin.test/return', refresh_url: 'https://admin.test/refresh',
      authorize_account_debits: false, country: 'BA'
    };
    assert.deepEqual(await client.store.paymentOption.stripe.connect(request), result);
    client.setStoreId('another-store');
    assert.deepEqual(await client.store.paymentOption.stripe.getConnection({ store_id: 'explicit-store', operation_id: operationId }), result.operation);
    assert.deepEqual(calls, [
      { url: 'https://api.example.test/v1/stores/explicit-store/payment-options/stripe/connect', method: 'POST', body: request },
      { url: `https://api.example.test/v1/stores/explicit-store/payment-options/stripe/connections/${operationId}`, method: 'GET', body: null }
    ]);
  } finally { globalThis.fetch = originalFetch; }
});

test('failed operation reads do not dispatch a connection command or fall back to provider enumeration', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push([String(url), init.method]);
    return Response.json({ statusCode: 404, message: 'Not found' }, { status: 404 });
  };
  try {
    const client = createAdmin({ baseUrl: 'https://api.example.test', storeId: 'default' });
    await assert.rejects(client.store.paymentOption.stripe.getConnection({ store_id: 'store/other', operation_id: 'operation/other' }), { statusCode: 404 });
    assert.deepEqual(calls, [['https://api.example.test/v1/stores/store%2Fother/payment-options/stripe/connections/operation%2Fother', 'GET']]);
  } finally { globalThis.fetch = originalFetch; }
});
