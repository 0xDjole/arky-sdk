import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';
import { createStorefront } from '../dist/storefront.js';

const STORE_ID = '5c9e1a37-8d24-4f60-b3a5-0e7f2c4d6b18';
const OTHER_STORE_ID = 'a0d6f2b8-3e51-4c79-9f24-7b1e5a3c8d60';

test('Market mutations honor explicit Store scope without sending routing fields as data', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return new Response(JSON.stringify({ id: 'market-id' }), { headers: { 'content-type': 'application/json' } });
  };
  try {
    const api = createAdmin({ baseUrl: 'https://api.example.test', market: 'configured', apiToken: 'arky_api_test' }).store.market;
    const create = { key: 'europe', currency: 'eur', tax_mode: 'inclusive' };
    const update = { expected_updated_at: 123, tax_mode: 'exclusive' };
    for (const store_id of [STORE_ID, OTHER_STORE_ID]) {
      await api.create({ store_id, ...create });
      await api.update({ store_id, id: 'market-id', ...update });
      await api.delete({ store_id, id: 'market-id', expected_updated_at: 124 });
      const [created, updated, deleted] = calls.slice(-3);
      assert.equal(created.url.pathname, `/v1/stores/${store_id}/markets`);
      assert.equal(created.init.method, 'POST');
      assert.deepEqual(JSON.parse(created.init.body), create);
      assert.equal(updated.url.pathname, `/v1/stores/${store_id}/markets/market-id`);
      assert.equal(updated.init.method, 'PUT');
      assert.deepEqual(JSON.parse(updated.init.body), update);
      assert.equal(deleted.url.pathname, `/v1/stores/${store_id}/markets/market-id`);
      assert.equal(deleted.init.method, 'DELETE');
      assert.equal(deleted.init.body, undefined);
      assert.deepEqual(Object.fromEntries(deleted.url.searchParams), { expected_updated_at: '124' });
    }
    for (const store_id of [undefined, 'default', 'selected']) {
      await assert.rejects(async () => api.create({ store_id, ...create }), TypeError);
      await assert.rejects(async () => api.update({ store_id, id: 'market-id', ...update }), TypeError);
      await assert.rejects(async () => api.delete({ store_id, id: 'market-id', expected_updated_at: 124 }), TypeError);
    }
    assert.equal(calls.length, 6);
    for (const status of [403, 409, 503]) {
      let count = 0;
      globalThis.fetch = async () => {
        count++;
        return new Response(JSON.stringify({ message: 'failed' }), { status });
      };
      await assert.rejects(api.create({ store_id: STORE_ID, ...create }), error => error.statusCode === status);
      await assert.rejects(api.update({ store_id: STORE_ID, id: 'market-id', ...update }), error => error.statusCode === status);
      await assert.rejects(api.delete({ store_id: STORE_ID, id: 'market-id', expected_updated_at: 124 }), error => error.statusCode === status);
      assert.equal(count, 3, 'no implicit mutation replay');
    }
  } finally {
    globalThis.fetch = original;
  }
});

for (const [owner,path,filter] of [
  ['market','markets',{currency:'eur'}],
  ['location','locations',{is_pickup_location:true}],
  ['paymentOption','payment-options',{type_name:'stripe'}],
]) {
  test(`${owner} forwards one bounded page and preserves empty continuation`, async () => {
    const original=globalThis.fetch, calls=[];
    globalThis.fetch=async(url,init)=>{
      calls.push({url:new URL(url),init});
      return new Response(JSON.stringify({items:[],cursor:'next'}),{headers:{'content-type':'application/json'}});
    };
    try {
      const api=createAdmin({baseUrl:'https://api.example.test',market:'configured',apiToken:'arky_api_test'}).store[owner];
      const params={store_id:STORE_ID,key:'trade',status:'active',sort_field:'updated_at',sort_direction:'asc',limit:1,cursor:'previous',...filter};
      assert.deepEqual(await api.list(params),{items:[],cursor:'next'});
      assert.equal(calls.length,1,'no hidden enumeration');
      assert.equal(calls[0].url.pathname,`/v1/stores/${STORE_ID}/${path}`);
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
    const api=createAdmin({baseUrl:'https://api.example.test',market:'configured',apiToken:'arky_api_test'}).store;
    await api.market.getByKey({store_id:STORE_ID,key:'trade'});
    await api.location.getByKey({store_id:STORE_ID,key:'warehouse'});
    await api.market.get({store_id:STORE_ID,id:'market-id'});
    await api.location.get({store_id:STORE_ID,id:'location-id'});
    await api.paymentOption.getByKey({store_id:STORE_ID,key:'processor'});
    await api.paymentOption.get({store_id:STORE_ID,id:'exact'});
    assert.deepEqual(calls.map(call=>call.url.pathname),[
      `/v1/stores/${STORE_ID}/markets/by-key/trade`,
      `/v1/stores/${STORE_ID}/locations/by-key/warehouse`,
      `/v1/stores/${STORE_ID}/markets/market-id`,
      `/v1/stores/${STORE_ID}/locations/location-id`,
      `/v1/stores/${STORE_ID}/payment-options/key/processor`,
      `/v1/stores/${STORE_ID}/payment-options/exact`,
    ]);
    assert.ok(calls.every(call=>call.url.search===''&&(call.init.method??'GET')==='GET'));
    assert.equal('getByType' in api.paymentOption,false);
    for(const status of [404,409,503]){
      let count=0;
      globalThis.fetch=async()=>{count++;return new Response(JSON.stringify({message:'failed'}),{status})};
      await assert.rejects(api.paymentOption.getByKey({store_id:STORE_ID,key:'processor'}),error=>error.statusCode===status);
      await assert.rejects(api.market.getByKey({store_id:STORE_ID,key:'trade'}),error=>error.statusCode===status);
      assert.equal(count,2);
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
