import assert from "node:assert/strict";
import test from "node:test";

import { createStorefront, initialize, latestPayment, paginate, paymentOutcome, readAllPages } from "../dist/storefront.js";
import { paginate as utilsPaginate } from "../dist/utils.js";
import { MemoryStorage } from "./helpers/durable-request-fixtures.mjs";
import {
  apiUrl,
  errorResponse,
  idFactories,
  ids,
  installGlobal,
  placedOrder,
  publishableKey,
  recordFetch,
  visitorStorage,
} from "./helpers/arky-fixtures.mjs";

const orderToken = `arky_ot_${"T".repeat(42)}A`;
const otherOrderToken = `arky_ot_${"U".repeat(42)}A`;

function storefront() {
  return createStorefront(publishableKey, { ...idFactories, apiUrl, locale: "en", sessionStorage: visitorStorage() });
}

function page(items, cursor) {
  return { items, cursor };
}

test("paginate reads every page once and refuses cursors that don't advance", async () => {
  const cursors = [];
  const pages = { "": page([1, 2], "b"), b: page([3], "c"), c: page([4], null) };
  const read = async (cursor) => {
    cursors.push(cursor);
    return pages[cursor ?? ""];
  };
  assert.deepEqual(await readAllPages(read), [1, 2, 3, 4]);
  assert.deepEqual(cursors, [null, "b", "c"]);
  const seen = [];
  for await (const item of utilsPaginate(read)) seen.push(item);
  assert.deepEqual(seen, [1, 2, 3, 4]);

  await assert.rejects(readAllPages(async (cursor) => page([1], cursor === null ? "a" : "a")), /did not advance/);
  await assert.rejects(readAllPages(async (cursor) => page([1], cursor === null ? "a" : cursor === "a" ? "b" : "a")), /did not advance/);
  await assert.rejects(readAllPages(async () => page([1], "")), /non-empty string/);
  await assert.rejects(readAllPages(async (cursor) => page([1], `${cursor ?? ""}x`), { max_pages: 3 }), /more than 3 pages/);
  await assert.rejects(readAllPages(async () => page([1], null), { max_pages: 0 }), /max_pages/);
  await assert.rejects(readAllPages(async () => ({ cursor: null })), /items, cursor/);
  const first = [];
  for await (const item of paginate(read)) {
    first.push(item);
    if (first.length === 2) break;
  }
  assert.deepEqual(first, [1, 2]);
});

function payment(type, status, overrides = {}) {
  const base = {
    id: ids.payment,
    store_id: ids.store,
    order_id: ids.order,
    payment_option_id: ids.paymentOption,
    money: { amount: 1000, currency: "eur" },
    holds: [],
    status,
    status_revision: "1",
    created_at: 1,
    updated_at: 1,
  };
  const recorded = { status: status === "cancelled" ? "cancelled" : "open", collections: [], refunds: [] };
  const types = {
    stripe_checkout: { type: "stripe_checkout", return_url: "https://shop.example.test", expires_at: 1, status: { type: status }, refunds: [], disputes: [] },
    cash_on_delivery: { type: "cash_on_delivery", ...recorded },
    manual: { type: "manual", requested: { type: "at_checkout" }, reference: null, ...recorded },
  };
  return { ...base, type: types[type], ...overrides };
}

test("paymentOutcome maps every payment status to paid, pay later, awaiting, unconfirmed or failed", () => {
  assert.equal(paymentOutcome(payment("stripe_checkout", "paid")), "paid");
  for (const status of ["pending", "open", "requires_action", "closing"]) {
    assert.equal(paymentOutcome(payment("stripe_checkout", status)), "awaiting", status);
  }
  assert.equal(paymentOutcome(payment("stripe_checkout", "unknown")), "unconfirmed");
  for (const status of ["expired", "cancelled", "declined", "failed"]) {
    assert.equal(paymentOutcome(payment("stripe_checkout", status)), "failed", status);
  }
  assert.equal(paymentOutcome(payment("cash_on_delivery", "open")), "pay_later");
  assert.equal(paymentOutcome(payment("manual", "open")), "pay_later");
  assert.equal(paymentOutcome(payment("cash_on_delivery", "cancelled")), "failed");
  const collected = payment("cash_on_delivery", "open");
  const active = { id: ids.credit, money: { amount: 1000, currency: "eur" }, recorded_by: { type: "account", account_id: ids.account }, reference: null, recorded_at: 2, status: { type: "active" } };
  collected.type.collections = [active];
  assert.equal(paymentOutcome(collected), "paid");
  collected.type.collections = [{ ...active, status: { type: "voided", by: { type: "account", account_id: ids.account }, reason: "Wrong", at: 3 } }];
  assert.equal(paymentOutcome(collected), "pay_later");
  const older = payment("stripe_checkout", "failed", { id: ids.otherOrder, created_at: 1 });
  const newer = payment("stripe_checkout", "paid", { created_at: 5 });
  assert.equal(latestPayment([older, newer]).created_at, 5);
  assert.equal(latestPayment([]), null);
});

test("order.fromLink reads the order with the link's token, keeps the token and hands back the link without it", async (context) => {
  const storage = new MemoryStorage();
  installGlobal(context, "localStorage", storage);
  const calls = recordFetch(context, (call) => (call.path === `/v1/storefront/orders/${ids.order}` ? placedOrder() : errorResponse(404, "GENERAL.NOT_FOUND", "Missing")));
  const client = storefront();
  const opened = await client.eshop.order.fromLink({
    id: ids.order,
    url: `https://shop.example.test/order/${ids.order}?lang=en#order_token=${orderToken}&tab=items`,
  });
  assert.equal(opened.order.id, ids.order);
  assert.equal(opened.url, `https://shop.example.test/order/${ids.order}?lang=en#tab=items`);
  assert.equal(calls[0].headers.get("x-arky-order-token"), orderToken);
  assert.equal(opened.order_token, orderToken);
  assert.equal(client.eshop.order.retainedToken({ order_id: ids.order }), orderToken);

  const again = await client.eshop.order.fromLink({ id: ids.order, url: `https://shop.example.test/order/${ids.order}` });
  assert.equal(again.url, `https://shop.example.test/order/${ids.order}`);
  assert.equal(again.order_token, orderToken);
  assert.equal(calls[1].headers.get("x-arky-order-token"), orderToken);

  await client.eshop.order.fromLink({ id: ids.order, url: `https://shop.example.test/order#order_token=${otherOrderToken}` });
  assert.equal(client.eshop.order.retainedToken({ order_id: ids.order }), otherOrderToken);

  await assert.rejects(client.eshop.order.fromLink({ id: ids.order, url: "https://shop.example.test/#order_token=nope" }), (error) => error.name === "ArkyError" && error.code === "invalid_link");
  await assert.rejects(
    client.eshop.order.fromLink({ id: ids.order, url: `https://shop.example.test/#order_token=${orderToken}&order_token=${orderToken}` }),
    /invalid order token/,
  );
  await assert.rejects(client.eshop.order.fromLink({ id: ids.otherOrder, url: `https://shop.example.test/#order_token=${orderToken}` }), /Missing/);
  assert.equal(client.eshop.order.retainedToken({ order_id: ids.otherOrder }), null);
  assert.equal(calls.length, 4);
});

function media(id) {
  const file = { url: `https://cdn.example.test/${id}.jpg` };
  return {
    id,
    store_id: ids.store,
    file_name: `${id}.jpg`,
    alt: null,
    generation_id: id,
    content: { type: "image", original: file, thumbnail: file, small: file, medium: file, large: file },
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
  };
}

function mediaId(index) {
  return `00000000-0000-4000-9000-${String(index).padStart(12, "0")}`;
}

test("content.load resolves block media in batches of 100 and reads blocks in the call's locale", async (context) => {
  const gallery = Array.from({ length: 150 }, (_, index) => ({ id: mediaId(index + 1000), key: "photo", type: "media", value: mediaId(index) }));
  const collection = {
    id: ids.form,
    store_id: ids.store,
    key: "website",
    schema: [],
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
    blocks: [
      { id: mediaId(2000), key: "hero", type: "media", value: mediaId(0) },
      {
        id: mediaId(2001),
        key: "info",
        type: "object",
        value: [
          { id: mediaId(2002), key: "contact_title", type: "localized_text", value: { en: "Contact", it: "Contatti" } },
          { id: mediaId(2003), key: "phone", type: "text", value: "+385 1" },
          { id: mediaId(2004), key: "hours", type: "number", value: 9 },
        ],
      },
      { id: mediaId(2005), key: "gallery", type: "array", value: gallery },
    ],
  };
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/collections/website") return collection;
    if (call.path === "/v1/storefront/media") return JSON.parse(call.query.ids).map(media);
    throw new Error(`Unexpected request ${call.path}`);
  });
  const store = initialize(publishableKey, { ...idFactories, apiUrl, locale: "it", sessionStorage: visitorStorage() });
  const site = await store.content.load({ collection: { key: "website" } }, { locale: "en" });
  const mediaReads = calls.filter((call) => call.path === "/v1/storefront/media");
  assert.deepEqual(mediaReads.map((call) => JSON.parse(call.query.ids).length), [100, 50]);
  assert.ok(calls.every((call) => call.headers.get("x-arky-locale") === "en"));
  assert.equal(site.record.key, "website");
  assert.equal(site.locale, "en");
  assert.equal(site.media("hero").id, mediaId(0));
  assert.equal(site.object("info").text("contact_title"), "Contact");
  assert.equal(site.object("info").text("phone"), "+385 1");
  assert.equal(site.object("info").text("missing"), null);
  assert.throws(() => site.object("info").text("hours"), /is number, not text/);
  assert.equal(site.list("gallery").length, 150);
  assert.equal(site.list("gallery")[149].media("photo").id, mediaId(149));
  assert.equal(Object.keys(site.media_by_id).length, 150);
  assert.equal(site.object("missing"), null);
  assert.deepEqual(site.list("missing"), []);
});

test("content.load and loadEntries never swallow a failed read", async (context) => {
  let failMedia = true;
  recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/entries") {
      return call.query.cursor
        ? { items: [{ id: ids.otherLine, key: "two", slugs: {}, blocks: [], collection_id: ids.form, store_id: ids.store, status: { type: "active" }, created_at: 1, updated_at: 1, validation_errors: [] }], cursor: null }
        : { items: [{ id: ids.line, key: "one", slugs: {}, blocks: [{ id: mediaId(1), key: "cover", type: "media", value: mediaId(1) }], collection_id: ids.form, store_id: ids.store, status: { type: "active" }, created_at: 1, updated_at: 1, validation_errors: [] }], cursor: "next" };
    }
    if (call.path === "/v1/storefront/media") return failMedia ? errorResponse(503, "GENERAL.UNAVAILABLE", "Media is down") : JSON.parse(call.query.ids).map(media);
    if (call.path === "/v1/storefront/collections/broken") return errorResponse(500, "GENERAL.INTERNAL", "Boom");
    throw new Error(`Unexpected request ${call.path}`);
  });
  const client = storefront();
  await assert.rejects(client.content.load({ collection: { key: "broken" } }), /Boom/);
  await assert.rejects(client.content.loadEntries({ collection_id: ids.form }), /Media is down/);
  failMedia = false;
  const entries = await client.content.loadEntries({ collection_id: ids.form, limit: 1 });
  assert.deepEqual(entries.map((entry) => entry.record.key), ["one", "two"]);
  assert.equal(entries[0].media("cover").id, mediaId(1));
  await assert.rejects(client.content.load({ entry: { collection_id: ids.form, key: "absent" } }), /No entry has the key 'absent'/);
});
