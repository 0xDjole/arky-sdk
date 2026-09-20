import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';

const sellable = { type: 'product_variant', product_id: 'product', variant_id: 'variant' };
for (const [owner, path, filters] of [
  ['price', 'prices', { sellable, price_list_id: 'list', currency: 'eur', status: 'active', sort_field: 'updated_at', sort_direction: 'asc' }],
  ['assortmentItem', 'assortment-items', { sellable, assortment_id: 'assortment' }],
  ['catalogEntitlement', 'catalog-entitlements', { catalog_id: 'catalog', status: 'deleting', sort_field: 'created_at', sort_direction: 'desc' }],
]) {
  test(`${owner} keeps native filters, empty continuation, and read failures`, async () => {
    const original = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url: new URL(url), init });
      return new Response(JSON.stringify({ items: [], cursor: 'after-stale' }), { headers: { 'content-type': 'application/json' } });
    };
    try {
      const api = createAdmin({ baseUrl: 'https://api.example.test', storeId: 'default', apiToken: 'arky_api_test' }).eshop[owner];
      const input = { store_id: 'selected', ...filters, limit: 50, cursor: 'previous' };
      assert.deepEqual(await api.find(input), { items: [], cursor: 'after-stale' });
      assert.equal(calls[0].url.pathname, `/v1/stores/selected/${path}`);
      assert.equal(calls[0].url.searchParams.has('store_id'), false);
      for (const [key, value] of Object.entries(input)) {
        if (key === 'store_id') continue;
        assert.equal(calls[0].url.searchParams.get(key), typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
      if (owner === 'price') {
        await api.find({ base_only: true, currency: 'usd' });
        assert.equal(calls[1].url.searchParams.get('base_only'), 'true');
        assert.equal(calls[1].url.searchParams.has('price_list_id'), false);
      }
      for (const status of [403, 409, 503]) {
        let count = 0;
        globalThis.fetch = async () => { count += 1; return new Response(JSON.stringify({ message: 'read failed' }), { status }); };
        await assert.rejects(api.find(input), (error) => error.statusCode === status);
        assert.equal(count, 1);
      }
    } finally { globalThis.fetch = original; }
  });
}
