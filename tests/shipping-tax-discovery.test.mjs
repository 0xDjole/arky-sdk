import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';

test('tax-rule writes preserve exact treatments, revisions and explicit schedule boundaries', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return new Response(JSON.stringify({ id: 'rule' }), { headers: { 'content-type': 'application/json' } });
  };
  try {
    const api = createAdmin({ baseUrl: 'https://api.example.test', storeId: 'store', apiToken: 'arky_api_test' }).store.taxRule;
    const treatment = { type: 'rates', components: [
      { id: 'first', title: 'Exact rate', code: 'vat', calculation: { type: 'percentage', rate: { numerator: 1, denominator: 3 }, compound: true } },
      { id: 'second', title: 'Per item', code: null, calculation: { type: 'fixed_per_unit', unit_amount: { amount: 42, currency: 'eur' } } }
    ] };
    await api.create({ market_zone_id: 'assignment', tax_category_id: 'category', treatment, status: { type: 'archived' }, starts_at: 1900000000123, ends_at: null });
    await api.update({ id: 'rule', expected_updated_at: 100, treatment, status: { type: 'archived' }, starts_at: null, ends_at: 1900000000456 });
    assert.equal(calls.length, 2);
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(calls[1].init.method, 'PUT');
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
    const api = createAdmin({ baseUrl: 'https://api.example.test', storeId: 'store', apiToken: 'arky_api_test' }).store.shippingRate;
    const values = {
      conditions: [], pricing: { type: 'flat', amount: 495, free_above_subtotal: null },
      delivery_estimate: null, status: { type: 'active' }, starts_at: null, ends_at: null
    };
    const create = { market_zone_id: 'assignment', shipping_method_id: 'method', shipping_profile_id: 'profile', ...values };
    const update = { ...values, expected_updated_at: 100, starts_at: 1900000000123, ends_at: 1900000000456 };
    await api.create(create);
    await api.update({ id: 'rate', ...update });
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url.pathname, '/v1/stores/store/shipping-rates');
    assert.equal(calls[1].url.pathname, '/v1/stores/store/shipping-rates/rate');
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(calls[1].init.method, 'PUT');
    assert.deepEqual(JSON.parse(calls[0].init.body), create);
    assert.deepEqual(JSON.parse(calls[1].init.body), update);
  } finally { globalThis.fetch = original; }
});

const owners = [
  ['marketZone','market-zones',{market_id:'market',zone_id:'zone'},'Binding'],
  ['marketSalesChannel','market-sales-channels',{market_id:'market',sales_channel_id:'channel'},'Binding'],
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
      const api=createAdmin({baseUrl:'https://api.example.test',storeId:'default',apiToken:'arky_api_test'}).store[owner];
      const filters={store_id:'chosen',...scope,status:'active',sort_field:'updated_at',sort_direction:'asc',limit:50,cursor:'previous'};
      assert.deepEqual(await api.find(filters),{items:[],cursor:'after-stale'});
      assert.equal(calls[0].url.pathname,`/v1/stores/chosen/${path}`);
      for(const [key,value]of Object.entries(filters)){
        if(key!=='store_id')assert.equal(calls[0].url.searchParams.get(key),String(value));
      }
      if(exact){
        const keyInput=exact==='Key'?{key:'pickup'}:scope;
        await api[`getBy${exact}`]({store_id:'chosen',...keyInput});
        assert.equal(calls[1].url.pathname,`/v1/stores/chosen/${path}/by-${exact==='Key'?'key/pickup':'binding'}`);
        if(exact==='Binding'){
          for(const [key,value]of Object.entries(scope))assert.equal(calls[1].url.searchParams.get(key),value);
        }
      }
      for(const status of [403,404,409,503]){
        let count=0;
        globalThis.fetch=async()=>{count++;return new Response(JSON.stringify({message:'failed'}),{status});};
        await assert.rejects(api.find(filters),error=>error.statusCode===status);
        assert.equal(count,1);
      }
      const remove=api[owner==='marketSalesChannel'?'remove':'delete'];
      globalThis.fetch=async()=>new Response(null,{status:204});
      assert.equal(await remove({store_id:'chosen',id:'record',expected_updated_at:1}),undefined);
      globalThis.fetch=async()=>new Response(JSON.stringify({id:'record',status:{type:'deleting'}}),{status:202,headers:{'content-type':'application/json'}});
      assert.deepEqual(await remove({store_id:'chosen',id:'record',expected_updated_at:1}),{id:'record',status:{type:'deleting'}});
    }finally{globalThis.fetch=original;}
  });
}
