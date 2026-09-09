import assert from "node:assert/strict";
import test from "node:test";

import { createStorefront } from "../dist/storefront.js";
import { createAdmin } from "../dist/admin.js";

const publishableKey = `arky_pk_${"a".repeat(42)}A`;
const apiUrl = "https://api.example.test";
const companyId = "8f9a5793-561f-4655-8f6b-42f5d6ded326";

test("Admin creates paid Audience definitions without embedded commercial terms", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: new URL(url),
      method: init.method,
      body: JSON.parse(init.body),
    });
    return new Response(
      JSON.stringify({
        id: "350082ac-9c53-497a-a7b2-4ecb36e1b53c",
        key: "membership",
        name: "Membership",
        type: { type: "paid" },
        status: { type: "draft" },
        created_at: 1788862721000,
        updated_at: 1788862721000,
      }),
      { headers: { "content-type": "application/json" } },
    );
  };
  try {
    const admin = createAdmin({
      apiToken: "test-token",
      baseUrl: apiUrl,
      storeId: "configured-store",
      market: "us",
      locale: "en",
    });
    const saved = await admin.audiences.create({
      store_id: "selected-store",
      key: "membership",
      name: "Membership",
      type: { type: "paid" },
    });
    assert.deepEqual(saved.type, { type: "paid" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.pathname, "/v1/stores/selected-store/audiences");
    assert.equal(calls[0].method, "POST");
    assert.deepEqual(calls[0].body, {
      key: "membership",
      name: "Membership",
      type: { type: "paid" },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function audience() {
  return {
    id: "350082ac-9c53-497a-a7b2-4ecb36e1b53c",
    key: "monthly_membership",
    name: "Membership",
    type: {
      type: "paid",
      prices: [
        {
          unit_price: { currency: "bam", amount: 25000 },
          compare_at: null,
          billing: { type: "one_time" },
          min_quantity: 1,
          max_quantity: 1,
          priced_at: 1788862721000,
        },
        {
          unit_price: { currency: "bam", amount: 1000 },
          compare_at: null,
          billing: { type: "recurring", interval: "month", interval_count: 1 },
          min_quantity: 1,
          max_quantity: 1,
          priced_at: 1788862721000,
        },
        {
          unit_price: { currency: "bam", amount: 9000 },
          compare_at: null,
          billing: { type: "recurring", interval: "year", interval_count: 1 },
          min_quantity: 1,
          max_quantity: 1,
          priced_at: 1788862721000,
        },
      ],
      purchase_allowed: true,
    },
  };
}

test("Audience reads forward selected Company and price options without identifying a visitor", async () => {
  const calls = [];
  const expected = audience();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({
      url: parsed,
      headers: new Headers(init.headers),
      method: init.method,
    });
    assert.match(parsed.pathname, /^\/v1\/storefront\/audiences(?:\/[^/]+)?$/);
    const body = parsed.pathname.endsWith("/audiences")
      ? { items: [expected], cursor: "next-page" }
      : expected;
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  try {
    const client = createStorefront(publishableKey, {
      apiUrl,
      locale: "bs",
      market: "bih",
    });
    const page = await client.audiences.find({
      company_id: companyId,
      include_price: true,
      limit: 20,
      cursor: "previous-page",
    });
    assert.deepEqual(page, { items: [expected], cursor: "next-page" });
    assert.deepEqual(
      await client.audiences.get({
        key: expected.key,
        company_id: companyId,
        include_price: true,
      }),
      expected,
    );
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.equal(call.url.searchParams.get("company_id"), companyId);
      assert.equal(call.url.searchParams.get("include_price"), "true");
      assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
      assert.equal(call.headers.get("x-arky-market"), "bih");
      assert.equal(call.headers.get("x-arky-locale"), "bs");
      assert.equal(call.headers.get("authorization"), null);
    }
    assert.equal(calls[0].url.searchParams.get("limit"), "20");
    assert.equal(calls[0].url.searchParams.get("cursor"), "previous-page");
    assert.equal(calls[1].url.searchParams.has("key"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Audience read context stays explicit and does not retain a previous Company selection", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), headers: new Headers(init.headers) });
    return new Response(JSON.stringify({ items: [], cursor: null }), {
      headers: { "content-type": "application/json" },
    });
  };
  try {
    const root = createStorefront(publishableKey, {
      apiUrl,
      locale: "bs",
      market: "bih",
    });
    await root.audiences.find({ company_id: companyId, include_price: true });
    await root.audiences.find();
    await root.withContext({ locale: "en", market: "eur" }).audiences.get({
      key: "membership/with?separator",
      include_price: false,
    });
    assert.equal(calls[1].url.searchParams.has("company_id"), false);
    assert.equal(calls[1].url.searchParams.has("include_price"), false);
    assert.equal(
      calls[2].url.pathname,
      "/v1/storefront/audiences/membership%2Fwith%3Fseparator",
    );
    assert.equal(calls[2].url.searchParams.get("include_price"), "false");
    assert.equal(calls[2].headers.get("x-arky-market"), "eur");
    assert.equal(calls[2].headers.get("x-arky-locale"), "en");
    assert.equal(root.getMarket(), "bih");
    assert.equal(root.getLocale(), "bs");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
