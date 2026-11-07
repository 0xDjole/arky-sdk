import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';

const STORE_ID = '8e5d1f60-3a2c-4b7e-9f18-6c4a2d0b7e95';

const sellable = { type: 'product_variant', variant_id: 'variant' };
for (const [owner, path, filters] of [
  ['packageItemPrice', 'package-item-prices', { package_item_id: 'item', sellable, status: 'active' }],
  ['packageItem', 'package-items', { package_id: 'package', market_id: 'market' }],
  ['packageAccess', 'package-accesses', { package_id: 'package', sort_direction: 'desc' }],
]) {
  test(`${owner} keeps native filters, empty continuation, and read failures`, async () => {
    const original = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url: new URL(url), init });
      const page = { items: [], cursor: 'after-stale' };
      return new Response(JSON.stringify(page), { headers: { 'content-type': 'application/json' } });
    };
    try {
      const api = createAdmin({ apiUrl: 'https://api.example.test', accountToken: 'arky_at_ttttttttttttttttttttttttttttttttttttttttttA' }).eshop[owner];
      const input = { store_id: STORE_ID, ...filters, limit: 50, cursor: 'previous' };
      assert.deepEqual(
        await api.find(input),
        { items: [], cursor: 'after-stale' },
      );
      assert.equal(calls[0].url.pathname, `/v1/stores/${STORE_ID}/${path}`);
      assert.equal(calls[0].url.searchParams.has('store_id'), false);
      for (const [key, value] of Object.entries(input)) {
        if (key === 'store_id') continue;
        assert.equal(calls[0].url.searchParams.get(key), typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
      if (owner === 'packageItemPrice') {
        await api.find({ store_id: STORE_ID, package_item_id: 'item' });
        assert.equal(calls[1].url.pathname, `/v1/stores/${STORE_ID}/package-item-prices`);
        assert.equal(calls[1].url.searchParams.get('package_item_id'), 'item');
        assert.equal(calls[1].url.searchParams.has('sellable'), false);
        await api.find({ store_id: STORE_ID, sellable });
        assert.equal(calls[2].url.searchParams.get('sellable'), JSON.stringify(sellable));
        assert.equal(calls[2].url.searchParams.has('package_item_id'), false);
      }
      if (owner === 'packageItem') {
        const item = { type: 'product', product_id: 'product' };
        await api.find({ store_id: STORE_ID, package_id: 'package', market_id: 'market', item });
        assert.equal(calls[1].url.pathname, `/v1/stores/${STORE_ID}/package-items`);
        assert.equal(calls[1].url.searchParams.get('market_id'), 'market');
        assert.equal(calls[1].url.searchParams.get('item'), JSON.stringify(item));
        assert.equal(calls[1].url.searchParams.has('cursor'), false);
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
