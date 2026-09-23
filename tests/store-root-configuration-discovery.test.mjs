import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';
import { createStorefront } from '../dist/storefront.js';

test('Market mutations honor explicit Store scope without sending routing fields as data', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return new Response(JSON.stringify({ id: 'market-id' }), { headers: { 'content-type': 'application/json' } });
  };
  try {
    const api = createAdmin({ baseUrl: 'https://api.example.test', storeId: 'default', market: 'configured', apiToken: 'arky_api_test' }).store.market;
    const create = { key: 'europe', currency: 'eur', tax_mode: 'inclusive', payment_provider_ids: [] };
    const update = { expected_updated_at: 123, tax_mode: 'exclusive', payment_provider_ids: [] };
    for (const store_id of ['selected', undefined]) {
      const scope = store_id ?? 'default';
      await api.create({ store_id, ...create });
      await api.update({ store_id, id: 'market-id', ...update });
      await api.delete({ store_id, id: 'market-id', expected_updated_at: 124, replacement_default_market_id: 'replacement' });
      const [created, updated, deleted] = calls.slice(-3);
      assert.equal(created.url.pathname, `/v1/stores/${scope}/markets`);
      assert.equal(created.init.method, 'POST');
      assert.deepEqual(JSON.parse(created.init.body), create);
      assert.equal(updated.url.pathname, `/v1/stores/${scope}/markets/market-id`);
      assert.equal(updated.init.method, 'PUT');
      assert.deepEqual(JSON.parse(updated.init.body), update);
      assert.equal(deleted.url.pathname, `/v1/stores/${scope}/markets/market-id`);
      assert.equal(deleted.init.method, 'DELETE');
      assert.deepEqual(Object.fromEntries(deleted.url.searchParams), {
        expected_updated_at: '124', replacement_default_market_id: 'replacement',
      });
    }
    assert.equal(calls.length, 6);
    for (const status of [403, 409, 503]) {
      let count = 0;
      globalThis.fetch = async () => {
        count++;
        return new Response(JSON.stringify({ message: 'failed' }), { status });
      };
      await assert.rejects(api.create({ store_id: 'selected', ...create }), error => error.statusCode === status);
      await assert.rejects(api.update({ store_id: 'selected', id: 'market-id', ...update }), error => error.statusCode === status);
      await assert.rejects(api.delete({ store_id: 'selected', id: 'market-id', expected_updated_at: 124 }), error => error.statusCode === status);
      assert.equal(count, 3, 'no implicit mutation replay');
    }
  } finally {
    globalThis.fetch = original;
  }
});

for (const [owner,path,filter] of [
  ['market','markets',{currency:'eur'}],
  ['location','locations',{is_pickup_location:true}],
  ['paymentProvider','payment-providers',{configuration_type:'stripe'}],
]) {
  test(`${owner} forwards one bounded page and preserves empty continuation`, async () => {
    const original=globalThis.fetch, calls=[];
    globalThis.fetch=async(url,init)=>{
      calls.push({url:new URL(url),init});
      return new Response(JSON.stringify({items:[],cursor:'next'}),{headers:{'content-type':'application/json'}});
    };
    try {
      const api=createAdmin({baseUrl:'https://api.example.test',storeId:'default',market:'configured',apiToken:'arky_api_test'}).store[owner];
      const params={store_id:'selected',key:'trade',status:'active',sort_field:'updated_at',sort_direction:'asc',limit:1,cursor:'previous',...filter};
      assert.deepEqual(await api.list(params),{items:[],cursor:'next'});
      assert.equal(calls.length,1,'no hidden enumeration');
      assert.equal(calls[0].url.pathname,`/v1/stores/selected/${path}`);
      for(const [key,value]of Object.entries(params)){
        if(key!=='store_id') assert.equal(calls[0].url.searchParams.get(key),String(value));
      }
      assert.equal(calls[0].url.searchParams.has('store_id'),false);
      for(const status of [403,409,503]){
        globalThis.fetch=async()=>new Response(JSON.stringify({message:'failed'}),{status});
        await assert.rejects(api.list(params),error=>error.statusCode===status);
      }
    } finally {globalThis.fetch=original}
  });
}

test('exact configuration lookup never falls back to search or creation',async()=>{
  const original=globalThis.fetch,calls=[];
  globalThis.fetch=async(url,init)=>{calls.push({url:new URL(url),init});return new Response(JSON.stringify({id:'exact'}),{headers:{'content-type':'application/json'}})};
  try{
    const api=createAdmin({baseUrl:'https://api.example.test',storeId:'default',market:'configured',apiToken:'arky_api_test'}).store;
    await api.market.getByKey({store_id:'selected',key:'trade'});
    await api.location.getByKey({store_id:'selected',key:'warehouse'});
    await api.market.get({store_id:'selected',id:'market-id'});
    await api.location.get({store_id:'selected',id:'location-id'});
    await api.paymentProvider.getByConfiguration({store_id:'selected',configuration_type:'stripe'});
    await api.paymentProvider.getByKey({store_id:'selected',key:'processor'});
    await api.paymentProvider.get({store_id:'selected',id:'exact'});
    assert.deepEqual(calls.map(call=>call.url.pathname),[
      '/v1/stores/selected/markets/by-key/trade',
      '/v1/stores/selected/locations/by-key/warehouse',
      '/v1/stores/selected/markets/market-id',
      '/v1/stores/selected/locations/location-id',
      '/v1/stores/selected/payment-providers/by-configuration/stripe',
      '/v1/stores/selected/payment-providers/key/processor',
      '/v1/stores/selected/payment-providers/exact',
    ]);
    for(const status of [404,409,503]){
      let count=0;
      globalThis.fetch=async()=>{count++;return new Response(JSON.stringify({message:'failed'}),{status})};
      await assert.rejects(api.paymentProvider.getByConfiguration({configuration_type:'stripe'}),error=>error.statusCode===status);
      assert.equal(count,1);
    }
  }finally{globalThis.fetch=original}
});

test('storefront configuration discovery has explicit pages in its resolved scope',async()=>{
  const original=globalThis.fetch,calls=[];
  globalThis.fetch=async(url,init)=>{calls.push({url:new URL(url),init});return new Response(JSON.stringify({items:[],cursor:'next'}),{headers:{'content-type':'application/json'}})};
  try{
    const api=createStorefront(`arky_pk_${'a'.repeat(42)}A`,{baseUrl:'https://api.example.test',market:'configured'});
    for(const owner of ['market','location']){
      const result=await api.store[owner].list({key:'trade',limit:1,cursor:'previous',sort_direction:'asc'});
      assert.deepEqual(result,{items:[],cursor:'next'});
      const call=calls.at(-1);
      assert.equal(call.url.searchParams.get('cursor'),'previous');
      assert.equal(call.url.searchParams.get('limit'),'1');
      assert.equal(call.url.searchParams.has('store_id'),false);
    }
    assert.equal(calls.length,2);
  }finally{globalThis.fetch=original}
});
