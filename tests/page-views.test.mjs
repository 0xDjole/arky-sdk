import assert from "node:assert/strict";
import test from "node:test";

import { createStorefront, initialize } from "../dist/storefront.js";
import {
  apiUrl,
  factoryOrderToken,
  idFactories,
  ids,
  installGlobal,
  storefrontIdentity,
  recordFetch,
  SessionStorage,
  visitorStorage,
  visitorToken,
} from "./helpers/arky-fixtures.mjs";
import { ExclusiveLockManager, MemoryStorage } from "./helpers/durable-request-fixtures.mjs";

function stubBeacon(context, accept = true) {
  const sent = [];
  installGlobal(context, "navigator", {
    sendBeacon(url, body) {
      sent.push({ url, body, parsed: JSON.parse(body) });
      return accept;
    },
  });
  return sent;
}

function refuseFetch(context) {
  return recordFetch(context, (call) => {
    throw new Error(`A page view sent ${call.method} ${call.path}`);
  });
}

test("a page view is one text beacon with only the store, sales channel, path and referrer", (context) => {
  const sent = stubBeacon(context);
  const calls = refuseFetch(context);
  const storefront = createStorefront(storefrontIdentity, { ...idFactories, apiUrl, sessionStorage: visitorStorage() });

  storefront.pageViews.send({
    path: "/products/example?utm_source=mail",
    referrer: "https://www.google.com/search?q=example",
  });
  storefront.pageViews.send({ path: "/" });

  assert.deepEqual(sent.map((beacon) => beacon.url), [
    `${apiUrl}/v1/storefront/page-views`,
    `${apiUrl}/v1/storefront/page-views`,
  ]);
  assert.equal(typeof sent[0].body, "string");
  assert.deepEqual(sent.map((beacon) => beacon.parsed), [
    {
      store_id: storefrontIdentity.storeId, sales_channel_id: storefrontIdentity.salesChannelId,
      path: "/products/example?utm_source=mail",
      referrer: "https://www.google.com/search?q=example",
    },
    { store_id: storefrontIdentity.storeId, sales_channel_id: storefrontIdentity.salesChannelId, path: "/", referrer: null },
  ]);
  for (const beacon of sent) {
    assert.equal(beacon.body.includes(ids.session), false);
    assert.equal(beacon.body.includes(ids.customer), false);
    assert.equal(beacon.body.includes(visitorToken), false);
  }
  assert.equal(calls.length, 0);
});

test("a page view forwards no session, customer, store or visitor field from the caller", (context) => {
  const sent = stubBeacon(context);
  const storefront = createStorefront(storefrontIdentity, { ...idFactories, apiUrl, sessionStorage: visitorStorage() });

  storefront.pageViews.send({
    path: "/",
    referrer: null,
    customer_session_id: ids.session,
    customer_id: ids.customer,
    store_id: ids.otherStore,
    visitor_id: ids.otherSession,
  });

  assert.deepEqual(sent.map((beacon) => beacon.parsed), [
    { store_id: storefrontIdentity.storeId, sales_channel_id: storefrontIdentity.salesChannelId, path: "/", referrer: null },
  ]);
});

test("an empty referrer travels as none, and a page view never creates or stores a visitor session", (context) => {
  const sent = stubBeacon(context);
  const calls = refuseFetch(context);
  const storage = new SessionStorage();
  const storefront = createStorefront(storefrontIdentity, {
    apiUrl,
    sessionStorage: storage,
    createVisitorIdentity: () => ({ customer_id: ids.customer, session_id: ids.session }),
    createSessionId: () => ids.otherSession,
    createId: () => ids.submission,
    createOrderToken: () => factoryOrderToken,
  });

  storefront.pageViews.send({ path: "/about", referrer: "" });

  assert.deepEqual(sent.map((beacon) => beacon.parsed), [
    { store_id: storefrontIdentity.storeId, sales_channel_id: storefrontIdentity.salesChannelId, path: "/about", referrer: null },
  ]);
  assert.equal(calls.length, 0);
  assert.equal(storefront.session, null);
  assert.deepEqual(storage.keys(""), []);
});

test("a page view refuses a path without a leading slash and a referrer that is not text", (context) => {
  const sent = stubBeacon(context);
  const storefront = createStorefront(storefrontIdentity, { ...idFactories, apiUrl, sessionStorage: visitorStorage() });

  assert.throws(() => storefront.pageViews.send({ path: "products/example" }), TypeError);
  assert.throws(() => storefront.pageViews.send({ path: "https://shop.example/products" }), TypeError);
  assert.throws(() => storefront.pageViews.send({ path: "/", referrer: 42 }), TypeError);
  assert.equal(sent.length, 0);
});

test("a page view fails visibly outside a browser and when the browser does not queue it", (context) => {
  const storefront = createStorefront(storefrontIdentity, { ...idFactories, apiUrl, sessionStorage: visitorStorage() });
  assert.equal(typeof globalThis.navigator?.sendBeacon, "undefined");
  assert.throws(() => storefront.pageViews.send({ path: "/" }), /navigator\.sendBeacon/);

  const sent = stubBeacon(context, false);
  assert.throws(() => storefront.pageViews.send({ path: "/" }), /did not queue/);
  assert.equal(sent.length, 1);
});

test("the initialized store sends page views through the same call and keeps actions for tracked outcomes", async (context) => {
  const sent = stubBeacon(context);
  const calls = recordFetch(context, () => new Response(null, { status: 204 }));
  const store = initialize(storefrontIdentity, { ...idFactories, apiUrl, locale: "en", sessionStorage: visitorStorage() });

  store.pageViews.send({ path: "/", referrer: "https://news.example.org/story" });

  assert.deepEqual(sent.map((beacon) => beacon.parsed), [
    { store_id: storefrontIdentity.storeId, sales_channel_id: storefrontIdentity.salesChannelId, path: "/", referrer: "https://news.example.org/story" },
  ]);
  assert.equal(store.actions.pageView, undefined);
  assert.equal(calls.length, 0);

  const descriptors = ["localStorage", "navigator"].map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]);
  Object.defineProperty(globalThis, "localStorage", { configurable: true, writable: true, value: new MemoryStorage() });
  Object.defineProperty(globalThis, "navigator", { configurable: true, writable: true, value: { locks: new ExclusiveLockManager() } });
  try {
    await store.actions.track({ key: "search" });
  } finally {
    for (const [name, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", "/v1/storefront/actions/track", { id: calls[0].body.id, key: "search" }],
  ]);
  assert.match(calls[0].body.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
