import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';

const STORE_ID = '8b2f4d6a-1c93-4e57-a0b8-6d4e2f1c9a35';

test('tax-rule writes preserve exact treatments, revisions and explicit schedule boundaries', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return new Response(JSON.stringify({ id: 'rule' }), { headers: { 'content-type': 'application/json' } });
  };
  try {
    const api = createAdmin({ baseUrl: 'https://api.example.test', apiToken: 'arky_api_test' }).store.taxRule;
    const treatment = { type: 'rates', components: [
      { id: 'first', title: 'Exact rate', code: 'vat', calculation: { type: 'percentage', rate: { numerator: 1, denominator: 3 }, compound: true } },
      { id: 'second', title: 'Per item', code: null, calculation: { type: 'fixed_per_unit', unit_amount: { amount: 42, currency: 'eur' } } }
    ] };
    await api.create({ store_id: STORE_ID, market_zone_id: 'assignment', tax_category_id: 'category', treatment, status: { type: 'archived' }, starts_at: 1900000000123, ends_at: null });
    await api.update({ store_id: STORE_ID, id: 'rule', expected_updated_at: 100, treatment, status: { type: 'archived' }, starts_at: null, ends_at: 1900000000456 });
    assert.equal(calls.length, 2);
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(calls[1].init.method, 'PUT');
    assert.equal(calls[0].url.pathname, `/v1/stores/${STORE_ID}/tax-rules`);
    assert.equal(calls[1].url.pathname, `/v1/stores/${STORE_ID}/tax-rules/rule`);
    assert.deepEqual(JSON.parse(calls[0].init.body), { market_zone_id: 'assignment', tax_category_id: 'category', treatment, status: { type: 'archived' }, starts_at: 1900000000123, ends_at: null });
    assert.deepEqual(JSON.parse(calls[1].init.body), { expected_updated_at: 100, treatment, status: { type: 'archived' }, starts_at: null, ends_at: 1900000000456 });
  } finally { globalThis.fetch = original; }
});

test('shipping-rate writes preserve explicit nulls, schedules, prices and revisions', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return new Response(JSON.stringify({ id: 'rate' }), { headers: { 'content-type': 'application/json' } });
  };
  try {
    const api = createAdmin({ baseUrl: 'https://api.example.test', apiToken: 'arky_api_test' }).store.shippingRate;
    const values = {
      conditions: [], pricing: { type: 'flat', amount: 495, free_above_subtotal: null },
      delivery_estimate: null, status: { type: 'active' }, starts_at: null, ends_at: null
    };
    const create = { market_zone_id: 'assignment', shipping_method_id: 'method', shipping_profile_id: 'profile', ...values };
    const update = { ...values, expected_updated_at: 100, starts_at: 1900000000123, ends_at: 1900000000456 };
    await api.create({ store_id: STORE_ID, ...create });
    await api.update({ store_id: STORE_ID, id: 'rate', ...update });
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url.pathname, `/v1/stores/${STORE_ID}/shipping-rates`);
    assert.equal(calls[1].url.pathname, `/v1/stores/${STORE_ID}/shipping-rates/rate`);
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(calls[1].init.method, 'PUT');
    assert.deepEqual(JSON.parse(calls[0].init.body), create);
    assert.deepEqual(JSON.parse(calls[1].init.body), update);
  } finally { globalThis.fetch = original; }
});

const owners = [
  ['marketZone','market-zones',{market_id:'market',zone_id:'zone'},'lookup'],
  ['shippingMethod','shipping-methods',{key:'pickup',location_id:'location',tax_category_id:'category'},'Key'],
  ['shippingRate','shipping-rates',{market_zone_id:'assignment',shipping_method_id:'method',shipping_profile_id:'profile'},null],
  ['taxRule','tax-rules',{market_zone_id:'assignment',default_only:true},null],
];
for (const [owner,path,scope,exact] of owners) {
  test(`${owner} preserves combined predicates, exact reads and native deletion responses`,async()=>{
    const original=globalThis.fetch;
    const calls=[];
    globalThis.fetch=async(url,init)=>{
      calls.push({url:new URL(url),init});
      return new Response(JSON.stringify({items:[],cursor:'after-stale'}),{headers:{'content-type':'application/json'}});
    };
    try {
      const api=createAdmin({baseUrl:'https://api.example.test',apiToken:'arky_api_test'}).store[owner];
      const filters={store_id:STORE_ID,...scope,status:'active',sort_field:'updated_at',sort_direction:'asc',limit:50,cursor:'previous'};
      assert.deepEqual(await api.find(filters),{items:[],cursor:'after-stale'});
      assert.equal(calls[0].url.pathname,`/v1/stores/${STORE_ID}/${path}`);
      assert.equal(calls[0].url.searchParams.has('store_id'),false);
      for(const [key,value]of Object.entries(filters)){
        if(key!=='store_id')assert.equal(calls[0].url.searchParams.get(key),String(value));
      }
      if(exact){
        const keyInput=exact==='Key'?{key:'pickup'}:scope;
        await api[exact === "Key" ? "getByKey" : "lookup"]({store_id:STORE_ID,...keyInput});
        assert.equal(calls[1].url.pathname,`/v1/stores/${STORE_ID}/${path}/${exact==='Key'?'by-key/pickup':'lookup'}`);
        if(exact==='lookup'){
          for(const [key,value]of Object.entries(scope))assert.equal(calls[1].url.searchParams.get(key),value);
        }
      }
      for(const status of [403,404,409,503]){
        let count=0;
        globalThis.fetch=async()=>{count++;return new Response(JSON.stringify({message:'failed'}),{status});};
        await assert.rejects(api.find(filters),error=>error.statusCode===status);
        assert.equal(count,1);
      }
      const remove=api.delete;
      globalThis.fetch=async()=>new Response(null,{status:204});
      assert.equal(await remove({store_id:STORE_ID,id:'record',expected_updated_at:1}),undefined);
      globalThis.fetch=async()=>new Response(JSON.stringify({id:'record',status:{type:'deleting'}}),{status:202,headers:{'content-type':'application/json'}});
      assert.deepEqual(await remove({store_id:STORE_ID,id:'record',expected_updated_at:1}),{id:'record',status:{type:'deleting'}});
      await assert.rejects(async()=>api.find({...filters,store_id:undefined}),TypeError);
      await assert.rejects(async()=>remove({store_id:'chosen',id:'record',expected_updated_at:1}),TypeError);
    }finally{globalThis.fetch=original;}
  });
}
