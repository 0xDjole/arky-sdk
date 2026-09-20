import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';

for (const [owner, path] of [['catalog', 'catalogs'], ['assortment', 'assortments'], ['priceList', 'price-lists']]) {
  test(`${owner} discovery preserves combined filters and empty-page continuation; exact identity is separate`, async () => {
    const original = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url: new URL(url), init });
      return new Response(JSON.stringify({ items: [], cursor: 'after-stale' }), { headers: { 'content-type': 'application/json' } });
    };
    try {
      const api = createAdmin({ baseUrl: 'https://api.example.test', storeId: 'default', apiToken: 'arky_api_test' }).eshop[owner];
      const filters = { key: 'a'.repeat(255), status: 'archived', sort_field: 'updated_at', sort_direction: 'asc', limit: 200, cursor: 'previous', ...(owner === 'catalog' ? { assortment_id: 'assortment', price_list_id: 'list' } : {}) };
      assert.deepEqual(await api.find({ store_id: 'selected', ...filters }), { items: [], cursor: 'after-stale' });
      assert.equal(calls[0].url.pathname, `/v1/stores/selected/${path}`);
      assert.equal(calls[0].url.searchParams.has('store_id'), false);
      for (const [key, value] of Object.entries(filters)) assert.equal(calls[0].url.searchParams.get(key), String(value));
      await api.getByKey({ store_id: 'selected', key: 'key/with spaces' });
      assert.equal(calls[1].url.pathname, `/v1/stores/selected/${path}/by-key/key%2Fwith%20spaces`);
      assert.equal(calls[1].url.search, '');
      assert.equal(calls[1].init.method, 'GET');
      for (const status of [404, 403, 503]) {
        let count = 0;
        globalThis.fetch = async () => { count += 1; return new Response(JSON.stringify({ message: 'read failed' }), { status }); };
        await assert.rejects(api.getByKey({ key: 'missing' }), (error) => error.statusCode === status);
        assert.equal(count, 1);
      }
    } finally { globalThis.fetch = original; }
  });
}
