import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createStorefront, initialize } from '../dist/storefront.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const key = `arky_pk_${'a'.repeat(42)}A`;
const apiUrl = 'https://api.example.test';
const market = (key, currency = 'eur') => ({ id: `id-${key}`, key, currency, tax_mode: 'exclusive', payment_provider_ids: [`provider-${key}`] });
const setup = () => ({
  commerce: { type: 'ready', default_market_id: 'id-retail', default_sales_channel_id: 'channel' },
  timezone: 'UTC', languages: { default: null, available: [] }, default_market: market('retail'),
  payment_providers: [{ id: 'provider-retail', key: 'manual', type: 'manual', blocks: [] }],
  support: { email: null }, readiness: { commerce: true, market: true, payment: true }
});

test('setup returns only its exact default, while explicit selected configuration is one exact read', async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ path: new URL(url).pathname, method: init.method });
    if (calls.at(-1).path === '/v1/storefront') return Response.json(setup());
    if (calls.at(-1).path === '/v1/storefront/markets/by-key/trade') return Response.json(market('trade', 'usd'));
    throw new Error(`Unexpected request: ${url}`);
  };
  const store = initialize(key, { apiUrl, market: 'trade' });
  const [first, second] = await Promise.all([store.store.load(), store.store.load()]);
  assert.deepEqual(first, setup());
  assert.equal(first, second);
  assert.equal('markets' in first, false);
  assert.equal(store.currency.get(), 'usd');
  assert.deepEqual(store.allowed_payment_provider_ids.get(), ['provider-trade']);
  assert.deepEqual(calls.map(call => call.path), ['/v1/storefront', '/v1/storefront/markets/by-key/trade']);
  assert.ok(calls.every(call => call.method === 'GET'));
});

test('the default Market is usable without any Market discovery or exact-key request', async () => {
  const calls = [];
  globalThis.fetch = async (url) => { calls.push(new URL(url).pathname); return Response.json(setup()); };
  const store = initialize(key, { apiUrl });
  await store.store.load();
  assert.deepEqual(store.market.get(), market('retail'));
  assert.equal(store.getMarket(), 'retail');
  assert.deepEqual(calls, ['/v1/storefront']);
});

test('late exact Market selection cannot replace a newer context or its currency/providers', async () => {
  let release, started;
  const waiting = new Promise(resolve => { release = resolve; });
  const requested = new Promise(resolve => { started = resolve; });
  globalThis.fetch = async (url) => {
    const path = new URL(url).pathname;
    if (path === '/v1/storefront') return Response.json(setup());
    if (path.endsWith('/old')) { started(); await waiting; return Response.json(market('old', 'jpy')); }
    if (path.endsWith('/new')) return Response.json(market('new', 'usd'));
    throw new Error(`Unexpected request: ${url}`);
  };
  const store = initialize(key, { apiUrl, market: 'old' });
  const pending = store.store.load();
  const rejected = assert.rejects(pending, /Customer or Market changed/);
  await requested;
  store.setMarket('new');
  assert.equal(store.market.get(), null);
  assert.deepEqual(store.allowed_payment_provider_ids.get(), []);
  await store.store.load();
  release();
  await rejected;
  assert.equal(store.market.get().key, 'new');
  assert.equal(store.currency.get(), 'usd');
  assert.deepEqual(store.allowed_payment_provider_ids.get(), ['provider-new']);
});

test('failed or mismatched exact selection never falls back to default or a discovery page', async () => {
  const calls = [];
  let failure = true;
  globalThis.fetch = async (url) => {
    const path = new URL(url).pathname;
    calls.push(path);
    if (path === '/v1/storefront') return Response.json(setup());
    if (path.endsWith('/trade')) return failure ? Response.json({ message: 'unavailable' }, { status: 503 }) : Response.json(market('wrong'));
    throw new Error(`Unexpected request: ${url}`);
  };
  const store = initialize(key, { apiUrl, market: 'trade' });
  await assert.rejects(store.store.load());
  assert.equal(store.market.get(), null);
  failure = false;
  await assert.rejects(store.store.load(), /selected key/);
  assert.equal(store.currency.get(), null);
  assert.ok(calls.every(path => path === '/v1/storefront' || path === '/v1/storefront/markets/by-key/trade'));
});

test('uninitialized Store setup remains available without inventing a Market', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ ...setup(), commerce: { type: 'uninitialized' }, default_market: null, readiness: { commerce: false, market: false, payment: false } }); };
  const store = initialize(key, { apiUrl });
  await store.store.load();
  assert.equal(store.market.get(), null);
  assert.equal(store.currency.get(), null);
  assert.equal(calls, 1);
});

test('exact Market key lookup encodes the key and performs no session creation', async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url: new URL(url), init }); return Response.json(market('retail')); };
  const client = createStorefront(key, { apiUrl });
  await client.store.market.getByKey('a/b');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.pathname, '/v1/storefront/markets/by-key/a%2Fb');
  assert.equal(calls[0].init.method, 'GET');
});
