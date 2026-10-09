import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdmin } from '../dist/admin.js';

const STORE_ID = '2e7a5c91-4f08-4d63-b1c9-8a3f6e0d2b74';

for (const [owner, path, scope] of [['zone','zones',{market_id:'market'}], ['taxCategory','tax-categories',{}], ['salesChannel','sales-channels',{status:'archived'}]]) {
  test(`${owner} preserves native filters, exact key reads and empty continuations`, async () => {
    const original = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({url:new URL(url),init});
      return new Response(JSON.stringify({items:[],cursor:'next'}),{headers:{'content-type':'application/json'}});
    };
    try {
      const api = createAdmin({baseUrl:'https://api.example.test',apiToken:'arky_api_test'}).store[owner];
      const filters = {store_id:STORE_ID,key:'trade',...scope,sort_field:'updated_at',sort_direction:'asc',limit:50,cursor:'previous'};
      assert.deepEqual(await api.find(filters),{items:[],cursor:'next'});
      assert.equal(calls[0].url.pathname,`/v1/stores/${STORE_ID}/${path}`);
      for (const [key,value] of Object.entries(filters)) {
        if(key!=='store_id') assert.equal(calls[0].url.searchParams.get(key),String(value));
      }
      assert.equal(calls[0].url.searchParams.has('store_id'),false);
      globalThis.fetch = async (url,init) => {
        calls.push({url:new URL(url),init});
        return new Response(JSON.stringify({id:'exact',key:'trade'}),{headers:{'content-type':'application/json'}});
      };
      assert.deepEqual(await api.getByKey({store_id:STORE_ID,key:'trade'}),{id:'exact',key:'trade'});
      assert.equal(calls[1].url.pathname,`/v1/stores/${STORE_ID}/${path}/by-key/trade`);
      for(const status of [403,404,409,503]) {
        let count=0;
        globalThis.fetch=async()=>{count+=1;return new Response(JSON.stringify({message:'failed'}),{status});};
        await assert.rejects(api.getByKey({store_id:STORE_ID,key:'trade'}),error=>error.statusCode===status);
        assert.equal(count,1);
        await assert.rejects(api.find(filters),error=>error.statusCode===status);
        assert.equal(count,2);
        await assert.rejects(async()=>api.getByKey({key:'trade'}),TypeError);
        assert.equal(count,2);
      }
    } finally {globalThis.fetch=original;}
  });
}
