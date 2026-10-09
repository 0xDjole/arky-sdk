import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';

const STORE_ID = '8e5d1f60-3a2c-4b7e-9f18-6c4a2d0b7e95';

const sellable = { type: 'product_variant', product_id: 'product', variant_id: 'variant' };
for (const [owner, path, filters] of [
  ['price', 'prices', { catalog_id: 'catalog', sellable, status: 'active', sort_field: 'updated_at', sort_direction: 'asc' }],
  ['catalogItem', 'catalog-items', { catalog_id: 'catalog', item: { type: 'product', product_id: 'product' } }],
  ['catalogAccess', 'catalog-accesses', { catalog_id: 'catalog', sort_field: 'created_at', sort_direction: 'desc' }],
]) {
  test(`${owner} keeps native filters, empty continuation, and read failures`, async () => {
    const original = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url: new URL(url), init });
      return new Response(JSON.stringify({ items: [], cursor: 'after-stale' }), { headers: { 'content-type': 'application/json' } });
    };
    try {
      const api = createAdmin({ baseUrl: 'https://api.example.test', apiToken: 'arky_api_test' }).eshop[owner];
      const input = { store_id: STORE_ID, ...filters, limit: 50, cursor: 'previous' };
      assert.deepEqual(await api.find(input), { items: [], cursor: 'after-stale' });
      assert.equal(calls[0].url.pathname, `/v1/stores/${STORE_ID}/${path}`);
      assert.equal(calls[0].url.searchParams.has('store_id'), false);
      for (const [key, value] of Object.entries(input)) {
        if (key === 'store_id') continue;
        assert.equal(calls[0].url.searchParams.get(key), typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
      if (owner === 'price') {
        await api.find({ store_id: STORE_ID, catalog_id: 'catalog' });
        assert.equal(calls[1].url.pathname, `/v1/stores/${STORE_ID}/prices`);
        assert.equal(calls[1].url.searchParams.get('catalog_id'), 'catalog');
        assert.equal(calls[1].url.searchParams.has('sellable'), false);
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
