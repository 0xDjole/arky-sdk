import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAdmin } from '../dist/admin.js';

const STORE_ID = '4c7a2e95-1d38-4b60-8f9e-0a5d3c7b2e14';
const REQUEST_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function merchantOption(storeId, id) {
  return {
    id, store_id: storeId, key: 'stripe', blocks: [], status: { type: 'active' },
    type: { type: 'stripe', connection: { type: 'configured', configuration: {
      account_id: 'acct_merchant', livemode: false, publishable_key: 'pk_test_merchant',
      account_observed_at: 2, charges_enabled: true, webhook: { type: 'unconfigured' },
    } } },
    created_at: 1, updated_at: 2,
  };
}

function configurationChange(storeId, id) {
  return {
    store_id: storeId, payment_option_id: id, request_id: REQUEST_ID, type: 'access',
    expected_updated_at: 2, accepted_updated_at: 3, accepted_at: 3, account_id: 'acct_merchant', livemode: false,
  };
}

test('Stripe configuration binds an existing PaymentOption with the caller request identity and exposes exact change inspection', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const id = 'provider/one';
  const setup = {
    payment_option: merchantOption(STORE_ID, id),
    callback_url: `https://api.example.test/v1/stores/${STORE_ID}/payment-options/stripe/provider%2Fone/webhook`,
    api_version: '2026-01-01', enabled_events: ['checkout.session.completed'],
  };
  const change = configurationChange(STORE_ID, id);
  const closed = {
    type: 'closed', store_id: STORE_ID, payment_option_id: id, request_id: REQUEST_ID,
    expected_updated_at: 2, updated_at: 4,
  };
  const replies = [setup, change, change, closed, merchantOption(STORE_ID, id)];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method, body: init.body ? JSON.parse(init.body) : null });
    return Response.json(replies.shift());
  };
  try {
    const client = createAdmin({ baseUrl: 'https://api.example.test' });
    const stripe = client.store.paymentOption.stripe;
    for (const removed of ['connect', 'getConnection', 'openDashboard']) assert.equal(removed in stripe, false);
    assert.equal('setStoreId' in client, false);
    const configuration = { type: 'access', restricted_key: 'rk_test_merchant', publishable_key: 'pk_test_merchant' };
    assert.deepEqual(await stripe.setup({ store_id: STORE_ID, id }), setup);
    assert.deepEqual(await stripe.configure({ store_id: STORE_ID, id, request_id: REQUEST_ID, expected_updated_at: 2, configuration }), change);
    assert.deepEqual(await stripe.getConfigurationChange({ store_id: STORE_ID, id, request_id: REQUEST_ID }), change);
    assert.deepEqual(await stripe.cancelConfiguration({ store_id: STORE_ID, id, request_id: REQUEST_ID, expected_updated_at: 2 }), closed);
    assert.deepEqual(await stripe.refresh({ store_id: STORE_ID, id }), merchantOption(STORE_ID, id));
    const base = `https://api.example.test/v1/stores/${STORE_ID}/payment-options/stripe/provider%2Fone`;
    assert.deepEqual(calls, [
      { url: `${base}/setup`, method: 'GET', body: null },
      { url: `${base}/configuration`, method: 'POST', body: { request_id: REQUEST_ID, expected_updated_at: 2, configuration } },
      { url: `${base}/configuration/requests/${REQUEST_ID}`, method: 'GET', body: null },
      { url: `${base}/configuration/requests/${REQUEST_ID}/cancel`, method: 'POST', body: { expected_updated_at: 2 } },
      { url: `${base}/refresh`, method: 'POST', body: null },
    ]);
  } finally { globalThis.fetch = originalFetch; }
});

test('failed change reads and invalid identities never dispatch a configuration command', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push([String(url), init.method]);
    return Response.json({ statusCode: 404, message: 'Not found' }, { status: 404 });
  };
  try {
    const stripe = createAdmin({ baseUrl: 'https://api.example.test' }).store.paymentOption.stripe;
    await assert.rejects(stripe.getConfigurationChange({ store_id: STORE_ID, id: 'provider/other', request_id: REQUEST_ID }), { statusCode: 404 });
    assert.deepEqual(calls, [[`https://api.example.test/v1/stores/${STORE_ID}/payment-options/stripe/provider%2Fother/configuration/requests/${REQUEST_ID}`, 'GET']]);
    const configure = { store_id: STORE_ID, id: 'provider', request_id: REQUEST_ID, expected_updated_at: 2,
      configuration: { type: 'webhook', endpoint_id: 'we_merchant', signing_secret: 'whsec_merchant', previous_secret_expires_at: null } };
    for (const request_id of [undefined, 'operation/other', REQUEST_ID.toUpperCase()]) {
      await assert.rejects(stripe.configure({ ...configure, request_id }), { name: 'TypeError', message: "A business request requires the caller's canonical UUID-v4 request_id" });
      await assert.rejects(stripe.getConfigurationChange({ store_id: STORE_ID, id: 'provider', request_id }), TypeError);
      await assert.rejects(stripe.cancelConfiguration({ store_id: STORE_ID, id: 'provider', request_id, expected_updated_at: 2 }), TypeError);
    }
    for (const store_id of [undefined, 'store/other']) {
      await assert.rejects(async () => stripe.configure({ ...configure, store_id }), { name: 'TypeError', message: 'A Store target must be an explicit canonical UUID-v4' });
      await assert.rejects(async () => stripe.setup({ store_id, id: 'provider' }), TypeError);
    }
    assert.equal(calls.length, 1);
  } finally { globalThis.fetch = originalFetch; }
});
