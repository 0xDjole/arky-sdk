import assert from "node:assert/strict";
import test from "node:test";

import { createStorefront, initialize } from "../dist/storefront.js";
import {
  apiUrl,
  idFactories,
  ids,
  installGlobal,
  publishableKey,
  recordFetch,
  SessionStorage,
  visitorStorage,
  visitorToken,
} from "./helpers/arky-fixtures.mjs";

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

test("a page view is one text beacon with only the publishable key, the path and the referrer", (context) => {
  const sent = stubBeacon(context);
  const calls = refuseFetch(context);
  const storefront = createStorefront(publishableKey, { ...idFactories, apiUrl, sessionStorage: visitorStorage() });

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
      publishable_key: publishableKey,
      path: "/products/example?utm_source=mail",
      referrer: "https://www.google.com/search?q=example",
    },
    { publishable_key: publishableKey, path: "/", referrer: null },
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
  const storefront = createStorefront(publishableKey, { ...idFactories, apiUrl, sessionStorage: visitorStorage() });

  storefront.pageViews.send({
    path: "/",
    referrer: null,
    customer_session_id: ids.session,
    customer_id: ids.customer,
    store_id: ids.otherStore,
    visitor_id: ids.otherSession,
  });

  assert.deepEqual(sent.map((beacon) => beacon.parsed), [
    { publishable_key: publishableKey, path: "/", referrer: null },
  ]);
});

test("an empty referrer travels as none, and a page view never creates or stores a visitor session", (context) => {
  const sent = stubBeacon(context);
  const calls = refuseFetch(context);
  const storage = new SessionStorage();
  const storefront = createStorefront(publishableKey, {
    apiUrl,
    sessionStorage: storage,
    createVisitorIdentity: () => ({ customer_id: ids.customer, session_id: ids.session }),
    createSessionId: () => ids.otherSession,
  });

  storefront.pageViews.send({ path: "/about", referrer: "" });

  assert.deepEqual(sent.map((beacon) => beacon.parsed), [
    { publishable_key: publishableKey, path: "/about", referrer: null },
  ]);
  assert.equal(calls.length, 0);
  assert.equal(storefront.session, null);
  assert.deepEqual(storage.keys(""), []);
});

test("a page view refuses a path without a leading slash and a referrer that is not text", (context) => {
  const sent = stubBeacon(context);
  const storefront = createStorefront(publishableKey, { ...idFactories, apiUrl, sessionStorage: visitorStorage() });

  assert.throws(() => storefront.pageViews.send({ path: "products/example" }), TypeError);
  assert.throws(() => storefront.pageViews.send({ path: "https://shop.example/products" }), TypeError);
  assert.throws(() => storefront.pageViews.send({ path: "/", referrer: 42 }), TypeError);
  assert.equal(sent.length, 0);
});

test("a page view fails visibly outside a browser and when the browser does not queue it", (context) => {
  const storefront = createStorefront(publishableKey, { ...idFactories, apiUrl, sessionStorage: visitorStorage() });
  assert.equal(typeof globalThis.navigator?.sendBeacon, "undefined");
  assert.throws(() => storefront.pageViews.send({ path: "/" }), /navigator\.sendBeacon/);

  const sent = stubBeacon(context, false);
  assert.throws(() => storefront.pageViews.send({ path: "/" }), /did not queue/);
  assert.equal(sent.length, 1);
});

test("the initialized store sends page views through the same call and keeps actions for tracked outcomes", async (context) => {
  const sent = stubBeacon(context);
  const calls = recordFetch(context, () => new Response(null, { status: 204 }));
  const store = initialize(publishableKey, { ...idFactories, apiUrl, locale: "en", sessionStorage: visitorStorage() });

  store.pageViews.send({ path: "/", referrer: "https://news.example.org/story" });

  assert.deepEqual(sent.map((beacon) => beacon.parsed), [
    { publishable_key: publishableKey, path: "/", referrer: "https://news.example.org/story" },
  ]);
  assert.equal(store.actions.pageView, undefined);
  assert.equal(calls.length, 0);

  await store.actions.track({ key: "search" });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", "/v1/storefront/actions/track", { key: "search" }],
  ]);
});
