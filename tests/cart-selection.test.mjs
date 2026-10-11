import assert from "node:assert/strict";
import test from "node:test";
import { CartSelectionError, createStorefront } from "../dist/storefront.js";
import {
  apiUrl,
  cartRecord,
  emailSession,
  ids,
  otherPublishableKey,
  publishableKey,
  recordFetch,
  sessionResult,
  visitorSession,
  visitorStorage,
} from "./helpers/arky-fixtures.mjs";

const customerBuyer = { type: "customer" };
const locationA = { type: "company_location", company_location_id: ids.companyLocation, purchase_order_number: null };
const locationB = { ...locationA, company_location_id: ids.otherCompanyLocation };
const companyBuyer = { type: "company", company_id: ids.company, purchase_order_number: null };
const locationChoice = { type: "company_location_selection", company_id: ids.company, purchase_order_number: null };
const otherCompanyId = "0d1e2f3a-4b5c-4d6e-8f70-81a2b3c4d5e6";
const selectionPrefix = "arky:selected-cart:v3:";
const tokenPrefix = "arky:cart-token:v1:";

function client(storage, options = {}) {
  return createStorefront(publishableKey, { apiUrl, market: "bih", sessionStorage: storage, ...options });
}

function created(cart, token = `recovery-${cart.id}`) {
  return { type: "created", cart, recovery_token: token };
}

function carts(initial = []) {
  const records = new Map(initial.map((cart) => [cart.id, cart]));
  return {
    records,
    respond(call) {
      if (call.method === "POST" && call.path === "/v1/storefront/carts") {
        const cart = cartRecord({ id: call.body.id, buyer: call.body.buyer, catalog_id: call.body.catalog_id ?? ids.catalog });
        records.set(cart.id, cart);
        return created(cart);
      }
      if (call.method === "GET" && call.path.startsWith("/v1/storefront/carts/")) {
        const record = records.get(decodeURIComponent(call.path.split("/").at(-1)));
        return record ?? Response.json({ message: "Cart not found", status_code: 404 }, { status: 404 });
      }
      throw new Error(`Unexpected request ${call.method} ${call.path}`);
    },
  };
}

test("creation selects the app's cart and a reload reads the same cart with its recovery token, storing no cart data", async (context) => {
  const storage = visitorStorage();
  const store = carts();
  const calls = recordFetch(context, (call) => store.respond(call));
  const result = await client(storage).eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null });
  assert.equal(result.type, "created");
  assert.deepEqual(calls[0].body, { id: ids.cart, buyer: customerBuyer, catalog_id: null });
  const [selectionKey] = storage.keys(selectionPrefix);
  assert.ok(selectionKey.endsWith(`:${ids.customer}:bih:customer:`));
  assert.equal(selectionKey.includes(publishableKey), false);
  assert.deepEqual(JSON.parse(storage.getItem(selectionKey)), { version: 3, id: ids.cart });
  assert.deepEqual(storage.keys(tokenPrefix).map((key) => storage.getItem(key)), [`recovery-${ids.cart}`]);
  assert.equal(storage.getItem(selectionKey).includes("recovery"), false);
  const reloaded = await client(storage).eshop.cart.current({ buyer: customerBuyer, catalog_id: null });
  assert.deepEqual(reloaded, store.records.get(ids.cart));
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["POST", "/v1/storefront/carts"],
    ["GET", `/v1/storefront/carts/${ids.cart}`],
  ]);
  assert.equal(calls[1].headers.get("x-arky-cart-token"), `recovery-${ids.cart}`);
  assert.equal(calls[1].url.search, "");
});

test("current without a selection answers null and never creates a cart", async (context) => {
  const calls = recordFetch(context, () => { throw new Error("no request expected"); });
  assert.equal(await client(visitorStorage()).eshop.cart.current({ buyer: customerBuyer, catalog_id: null }), null);
  assert.equal(await client(visitorStorage()).eshop.cart.current(), null);
  assert.equal(calls.length, 0);
});

for (const status of [403, 404]) {
  test(`a selected cart that answers ${status} ends the selection and its token, and current answers null`, async (context) => {
    const storage = visitorStorage();
    const store = carts();
    let gone = false;
    const calls = recordFetch(context, (call) => gone && call.method === "GET"
      ? Response.json({ message: "Cart unavailable", status_code: status }, { status })
      : store.respond(call));
    await client(storage).eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null });
    gone = true;
    assert.equal(await client(storage).eshop.cart.current({ buyer: customerBuyer, catalog_id: null }), null);
    assert.deepEqual(storage.keys(selectionPrefix), []);
    assert.deepEqual(storage.keys(tokenPrefix), []);
    assert.equal(await client(storage).eshop.cart.current({ buyer: customerBuyer, catalog_id: null }), null);
    assert.equal(calls.filter((call) => call.method === "GET").length, 1);
    assert.equal(calls.filter((call) => call.method === "POST").length, 1);
  });
}

test("a selected cart that answers 503 throws and keeps the selection and its token for a retry", async (context) => {
  const storage = visitorStorage();
  const store = carts();
  let failing = false;
  const calls = recordFetch(context, (call) => failing && call.method === "GET"
    ? Response.json({ message: "Unavailable", status_code: 503 }, { status: 503 })
    : store.respond(call));
  await client(storage).eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null });
  const kept = [...storage.values].filter(([key]) => key.startsWith("arky:"));
  failing = true;
  await assert.rejects(client(storage).eshop.cart.current({ buyer: customerBuyer, catalog_id: null }), (error) => error.statusCode === 503);
  assert.deepEqual([...storage.values].filter(([key]) => key.startsWith("arky:")), kept);
  failing = false;
  assert.equal((await client(storage).eshop.cart.current({ buyer: customerBuyer, catalog_id: null })).id, ids.cart);
  assert.equal(calls.filter((call) => call.method === "POST").length, 1);
});

test("each company location, the company, the location choice, the customer buyer and each catalog keep their own selected cart through reload", async (context) => {
  const storage = visitorStorage();
  const store = carts();
  const calls = recordFetch(context, (call) => store.respond(call));
  const choices = [
    [ids.cart, { buyer: locationA, catalog_id: null }],
    [ids.otherCart, { buyer: locationB, catalog_id: null }],
    [ids.thirdCart, { buyer: customerBuyer, catalog_id: null }],
    [ids.order, { buyer: customerBuyer, catalog_id: ids.otherCatalog }],
    [ids.otherOrder, { buyer: companyBuyer, catalog_id: null }],
    [ids.payment, { buyer: locationChoice, catalog_id: null }],
  ];
  for (const [id, params] of choices) await client(storage).eshop.cart.create({ id, ...params });
  for (const [id, params] of choices) assert.equal((await client(storage).eshop.cart.current(params)).id, id);
  assert.deepEqual(calls.filter((call) => call.method === "POST").map((call) => call.body.buyer), choices.map(([, params]) => params.buyer));
  assert.equal(storage.keys(selectionPrefix).length, 6);
  assert.equal(storage.keys(tokenPrefix).length, 6);
});

test("the selection belongs to the market and the storefront key it was made in", async (context) => {
  const storage = visitorStorage();
  const store = carts();
  const calls = recordFetch(context, (call) => store.respond(call));
  await client(storage).eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null });
  assert.equal(await client(storage, { market: "ita" }).eshop.cart.current({ buyer: customerBuyer, catalog_id: null }), null);
  const otherKey = createStorefront(otherPublishableKey, { apiUrl, market: "bih", sessionStorage: storage });
  assert.equal(await otherKey.eshop.cart.current({ buyer: customerBuyer, catalog_id: null }), null);
  assert.equal(calls.length, 1);
  assert.equal((await client(storage).eshop.cart.current({ buyer: customerBuyer, catalog_id: null })).id, ids.cart);
  for (const call of calls) assert.equal(call.headers.has("x-arky-sales-channel"), false);
});

test("a location-choice cart stays selected after its buyer picks a location, and never follows another company", async (context) => {
  const storage = visitorStorage();
  const store = carts();
  recordFetch(context, (call) => store.respond(call));
  await client(storage).eshop.cart.create({ id: ids.cart, buyer: locationChoice, catalog_id: null });
  store.records.set(ids.cart, { ...store.records.get(ids.cart), buyer: locationA });
  assert.deepEqual((await client(storage).eshop.cart.current({ buyer: locationChoice, catalog_id: null })).buyer, locationA);
  assert.equal(await client(storage).eshop.cart.current({ buyer: locationA, catalog_id: null }), null);
  const kept = storage.keys(selectionPrefix).map((key) => [key, storage.getItem(key)]);
  store.records.set(ids.cart, { ...store.records.get(ids.cart), buyer: { ...locationChoice, company_id: otherCompanyId } });
  await assert.rejects(client(storage).eshop.cart.current({ buyer: locationChoice, catalog_id: null }), CartSelectionError);
  store.records.set(ids.cart, { ...store.records.get(ids.cart), buyer: companyBuyer });
  await assert.rejects(client(storage).eshop.cart.current({ buyer: locationChoice, catalog_id: null }), CartSelectionError);
  assert.deepEqual(storage.keys(selectionPrefix).map((key) => [key, storage.getItem(key)]), kept);
});

test("a selected cart whose buyer or catalog changed is refused without replacing the selection", async (context) => {
  const storage = visitorStorage();
  const store = carts();
  recordFetch(context, (call) => store.respond(call));
  await client(storage).eshop.cart.create({ id: ids.cart, buyer: locationA, catalog_id: ids.otherCatalog });
  const kept = storage.keys(selectionPrefix).map((key) => [key, storage.getItem(key)]);
  store.records.set(ids.cart, { ...store.records.get(ids.cart), buyer: locationB });
  await assert.rejects(client(storage).eshop.cart.current({ buyer: locationA, catalog_id: ids.otherCatalog }), CartSelectionError);
  store.records.set(ids.cart, { ...store.records.get(ids.cart), buyer: { type: "company", company_id: ids.company, purchase_order_number: null } });
  await assert.rejects(client(storage).eshop.cart.current({ buyer: locationA, catalog_id: ids.otherCatalog }), CartSelectionError);
  store.records.set(ids.cart, { ...store.records.get(ids.cart), buyer: locationA, catalog_id: ids.catalog });
  await assert.rejects(client(storage).eshop.cart.current({ buyer: locationA, catalog_id: ids.otherCatalog }), /different catalog/);
  assert.deepEqual(storage.keys(selectionPrefix).map((key) => [key, storage.getItem(key)]), kept);
});

test("a created cart for another customer, buyer or catalog, or with another id, is never selected", async (context) => {
  for (const [answer, message] of [
    [cartRecord({ customer_id: ids.otherCustomer }), /does not belong/],
    [cartRecord({ buyer: locationA }), /does not belong/],
    [cartRecord({ buyer: companyBuyer }), /does not belong/],
    [cartRecord({ catalog_id: ids.otherCatalog }), /different catalog/],
    [cartRecord({ id: ids.otherCart }), /returned a different cart/],
  ]) {
    const storage = visitorStorage();
    recordFetch(context, () => created(answer));
    await assert.rejects(client(storage).eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: ids.catalog }), message);
    assert.deepEqual(storage.keys(selectionPrefix), []);
    assert.deepEqual(storage.keys(tokenPrefix), []);
  }
});

for (const status of [
  { type: "converted", order_id: ids.order },
  { type: "superseded", target_cart_id: ids.otherCart },
  { type: "expired" },
]) {
  test(`a selected ${status.type} cart ends the selection instead of being replaced silently`, async (context) => {
    const storage = visitorStorage();
    const store = carts();
    const calls = recordFetch(context, (call) => store.respond(call));
    await client(storage).eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null });
    store.records.set(ids.cart, { ...store.records.get(ids.cart), status });
    assert.equal(await client(storage).eshop.cart.current({ buyer: customerBuyer, catalog_id: null }), null);
    assert.deepEqual(storage.keys(selectionPrefix), []);
    assert.deepEqual(storage.keys(tokenPrefix), []);
    assert.equal(calls.filter((call) => call.method === "POST").length, 1);
  });
}

for (const status of [{ type: "active" }, { type: "abandoned" }]) {
  test(`a selected ${status.type} cart is reused`, async (context) => {
    const storage = visitorStorage();
    const store = carts();
    recordFetch(context, (call) => store.respond(call));
    await client(storage).eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null });
    store.records.set(ids.cart, { ...store.records.get(ids.cart), status });
    assert.deepEqual((await client(storage).eshop.cart.current({ buyer: customerBuyer, catalog_id: null })).status, status);
    assert.equal(storage.keys(selectionPrefix).length, 1);
  });
}

test("the customer's own merged cart is followed to its target of the same customer, and dropped when the target is another customer's", async (context) => {
  const storage = visitorStorage();
  const store = carts();
  const calls = recordFetch(context, (call) => call.path.endsWith(ids.thirdCart)
    ? Response.json({ message: "Not this customer's cart", status_code: 403 }, { status: 403 })
    : store.respond(call));
  await client(storage).eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null });
  store.records.set(ids.cart, { ...store.records.get(ids.cart), status: { type: "merged", target_cart_id: ids.otherCart } });
  store.records.set(ids.otherCart, cartRecord({ id: ids.otherCart }));
  assert.equal((await client(storage).eshop.cart.current({ buyer: customerBuyer, catalog_id: null })).id, ids.otherCart);
  assert.deepEqual(storage.keys(selectionPrefix).map((key) => JSON.parse(storage.getItem(key)).id), [ids.otherCart]);
  assert.deepEqual(storage.keys(tokenPrefix), []);
  const reads = calls.length;
  assert.equal((await client(storage).eshop.cart.current({ buyer: customerBuyer, catalog_id: null })).id, ids.otherCart);
  assert.deepEqual(calls.slice(reads).map((call) => call.path), [`/v1/storefront/carts/${ids.otherCart}`]);

  store.records.set(ids.otherCart, { ...store.records.get(ids.otherCart), status: { type: "merged", target_cart_id: ids.thirdCart } });
  assert.equal(await client(storage).eshop.cart.current({ buyer: customerBuyer, catalog_id: null }), null);
  assert.deepEqual(storage.keys(selectionPrefix), []);
});

test("corrupt selected state reads as no selection without a network call", async (context) => {
  const storage = visitorStorage();
  const store = carts();
  const calls = recordFetch(context, (call) => store.respond(call));
  await client(storage).eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null });
  const [key] = storage.keys(selectionPrefix);
  for (const value of ['{"version":1}', '{"version":3,"id":"cart-1"}', "not json"]) {
    storage.setItem(key, value);
    assert.equal(await client(storage).eshop.cart.current({ buyer: customerBuyer, catalog_id: null }), null);
  }
  assert.equal(calls.length, 1);
});

test("explicit creation selects a new empty cart without changing the previous cart", async (context) => {
  const storage = visitorStorage();
  const store = carts();
  const calls = recordFetch(context, (call) => store.respond(call));
  await client(storage).eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null });
  const second = await client(storage).eshop.cart.create({ id: ids.otherCart, buyer: customerBuyer, catalog_id: null });
  assert.equal(second.cart.id, ids.otherCart);
  assert.equal(second.recovery_token, `recovery-${ids.otherCart}`);
  assert.equal((await client(storage).eshop.cart.current({ buyer: customerBuyer, catalog_id: null })).id, ids.otherCart);
  assert.equal(calls.filter((call) => call.method === "POST").length, 2);
  assert.ok(calls.every((call) => ["GET", "POST"].includes(call.method)));
});

test("forget drops the selection and its token without a request", async (context) => {
  const storage = visitorStorage();
  const store = carts();
  const calls = recordFetch(context, (call) => store.respond(call));
  const storefront = client(storage);
  await storefront.eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null });
  storefront.eshop.cart.forget({ buyer: customerBuyer, catalog_id: null });
  assert.deepEqual(storage.keys(selectionPrefix), []);
  assert.deepEqual(storage.keys(tokenPrefix), []);
  assert.equal(await storefront.eshop.cart.current({ buyer: customerBuyer, catalog_id: null }), null);
  assert.equal(calls.length, 1);
});

test("caller-supplied cart credentials never reach the URL and cannot replace the stored token", async (context) => {
  const storage = visitorStorage();
  const store = carts();
  const calls = recordFetch(context, (call) => store.respond(call));
  await client(storage).eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null });
  const options = {
    params: { token: "secret-a", cart_token: "secret-b", Token: "secret-c", include: "summary" },
    headers: { "X-Arky-Cart-Token": "caller-cannot-override", "x-arky-cart-token": "caller-cannot-override" },
  };
  await client(storage).eshop.cart.current({ buyer: customerBuyer, catalog_id: null }, options);
  await client(storage).eshop.cart.get({ id: ids.cart }, options);
  for (const call of calls.slice(1)) {
    assert.equal(call.path, `/v1/storefront/carts/${ids.cart}`);
    assert.deepEqual(call.query, { include: "summary" });
    assert.equal(call.href.includes("secret"), false);
    assert.equal(call.headers.get("x-arky-cart-token"), `recovery-${ids.cart}`);
  }
});

test("a failed selection save throws and the retry under the same id selects the existing cart", async (context) => {
  const storage = visitorStorage();
  let first = true;
  const calls = recordFetch(context, (call) => {
    if (call.method === "POST") {
      const cart = cartRecord({ id: call.body.id });
      const answer = first ? created(cart) : { type: "existing", cart };
      first = false;
      return answer;
    }
    return cartRecord();
  });
  const write = storage.setItem.bind(storage);
  storage.setItem = (key, value) => {
    if (key.startsWith("arky:")) throw new Error("storage full");
    write(key, value);
  };
  await assert.rejects(client(storage).eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null }), /selection could not be saved; retry with the same cart id/);
  storage.setItem = write;
  const retried = await client(storage).eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null });
  assert.equal(retried.type, "existing");
  assert.deepEqual(calls.filter((call) => call.method === "POST").map((call) => call.body.id), [ids.cart, ids.cart]);
  assert.equal((await client(storage).eshop.cart.current({ buyer: customerBuyer, catalog_id: null })).id, ids.cart);
});

test("cart ids are the app's: creation and reorder refuse a missing or non-canonical id before any request", async (context) => {
  const calls = recordFetch(context, () => { throw new Error("no request expected"); });
  const storefront = client(visitorStorage());
  for (const id of [undefined, "", "cart-1", ids.cart.toUpperCase()]) {
    await assert.rejects(async () => storefront.eshop.cart.create({ id, buyer: customerBuyer, catalog_id: null }), TypeError);
    await assert.rejects(async () => storefront.eshop.cart.reorder({ id, order_id: ids.order, buyer: customerBuyer }), TypeError);
  }
  assert.equal(calls.length, 0);
});

test("a visitor who signs in as an existing customer lands on the cart the server merged their guest cart into", async (context) => {
  const storage = visitorStorage(ids.customer, ids.session);
  const guestLine = { type: "product", id: ids.line, product_id: ids.product, variant_id: ids.variant, quantity: 1, form_submission_id: null, price_override: null, purchase: { type: "catalog" } };
  const store = carts();
  const target = cartRecord({ id: ids.otherCart, customer_id: ids.otherCustomer, line_items: [guestLine] });
  const calls = recordFetch(context, (call) => {
    if (call.path === `/v1/storefront/carts/${ids.cart}/product-items`) {
      const cart = { ...store.records.get(ids.cart), line_items: [guestLine], updated_at: 2 };
      store.records.set(ids.cart, cart);
      return cart;
    }
    if (call.path === "/v1/storefront/customer/request-code") {
      return { customer: sessionResult().customer, session: { id: ids.session, customer_id: ids.customer }, email_verification: { issued_at: 1, expires_at: 2 } };
    }
    if (call.path === "/v1/storefront/customer/verify") {
      store.records.set(ids.cart, { ...store.records.get(ids.cart), status: { type: "merged", target_cart_id: ids.otherCart } });
      store.records.set(ids.otherCart, target);
      return sessionResult(ids.otherCustomer, emailSession(ids.otherCustomer, ids.otherSession));
    }
    if (call.path === "/v1/storefront/customer/logout") return new Response(null, { status: 204 });
    if (call.path === "/v1/storefront/customer/identify") {
      return sessionResult(ids.thirdCart, visitorSession(ids.thirdCart, ids.credit));
    }
    return store.respond(call);
  });
  const storefront = client(storage);
  await storefront.eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null });
  await storefront.eshop.cart.addProduct({ id: ids.cart, expected_updated_at: 1, product: { id: ids.line, product_id: ids.product, variant_id: ids.variant, quantity: 1, purchase: { type: "catalog" } } });
  await storefront.customer.requestCode({ id: ids.form, email: "buyer@example.test", language: "en" });
  await storefront.customer.verify({ code: "123456" });
  assert.equal(storefront.session.customer.id, ids.otherCustomer);
  const signInLinks = storage.keys("arky:cart-sign-in:v1:");
  assert.equal(signInLinks.length, 1);
  assert.ok(signInLinks[0].endsWith(`:${ids.otherCustomer}`));
  assert.deepEqual(JSON.parse(storage.getItem(signInLinks[0])), { version: 1, from_customer_id: ids.customer });

  const before = calls.length;
  const landed = await storefront.eshop.cart.current({ buyer: customerBuyer, catalog_id: null });
  assert.deepEqual(landed, target);
  assert.deepEqual(calls.slice(before).map((call) => [call.method, call.path, call.headers.get("x-arky-cart-token")]), [
    ["GET", `/v1/storefront/carts/${ids.cart}`, `recovery-${ids.cart}`],
    ["GET", `/v1/storefront/carts/${ids.otherCart}`, null],
  ]);
  const selected = storage.keys(selectionPrefix);
  assert.equal(selected.length, 1);
  assert.ok(selected[0].includes(`:${ids.otherCustomer}:`));
  assert.deepEqual(JSON.parse(storage.getItem(selected[0])), { version: 3, id: ids.otherCart });
  assert.deepEqual(storage.keys(tokenPrefix), []);

  const again = calls.length;
  assert.deepEqual(await storefront.eshop.cart.current({ buyer: customerBuyer, catalog_id: null }), target);
  assert.deepEqual(calls.slice(again).map((call) => call.path), [`/v1/storefront/carts/${ids.otherCart}`]);

  await storefront.customer.logout();
  assert.equal(storefront.session, null);
  const afterLogout = calls.length;
  assert.equal(await storefront.eshop.cart.current({ buyer: customerBuyer, catalog_id: null }), null);
  assert.deepEqual(calls.slice(afterLogout).map((call) => call.path), ["/v1/storefront/customer/identify"]);
});

test("an explicit new cart after sign-in is kept instead of being replaced by a later follow", async (context) => {
  const storage = visitorStorage(ids.customer, ids.session);
  const store = carts();
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/verify") {
      store.records.set(ids.cart, { ...store.records.get(ids.cart), status: { type: "merged", target_cart_id: ids.otherCart } });
      store.records.set(ids.otherCart, cartRecord({ id: ids.otherCart, customer_id: ids.otherCustomer }));
      return sessionResult(ids.otherCustomer, emailSession(ids.otherCustomer, ids.otherSession));
    }
    if (call.method === "POST" && call.path === "/v1/storefront/carts") {
      const cart = cartRecord({ id: call.body.id, customer_id: call.body.id === ids.cart ? ids.customer : ids.otherCustomer });
      store.records.set(cart.id, cart);
      return created(cart);
    }
    return store.respond(call);
  });
  const storefront = client(storage);
  await storefront.eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null });
  await storefront.customer.verify({ code: "123456" });
  await storefront.eshop.cart.create({ id: ids.thirdCart, buyer: customerBuyer, catalog_id: null });
  const before = calls.length;
  assert.equal((await storefront.eshop.cart.current({ buyer: customerBuyer, catalog_id: null })).id, ids.thirdCart);
  assert.deepEqual(calls.slice(before).map((call) => call.path), [`/v1/storefront/carts/${ids.thirdCart}`]);
  assert.deepEqual(storage.keys(selectionPrefix).map((key) => JSON.parse(storage.getItem(key)).id), [ids.thirdCart]);
});

test("a merged guest cart is never followed into a cart the signed-in customer does not own", async (context) => {
  const storage = visitorStorage(ids.customer, ids.session);
  const store = carts();
  recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/verify") {
      store.records.set(ids.cart, { ...store.records.get(ids.cart), status: { type: "merged", target_cart_id: ids.otherCart } });
      store.records.set(ids.otherCart, cartRecord({ id: ids.otherCart, customer_id: ids.thirdCart }));
      return sessionResult(ids.otherCustomer, emailSession(ids.otherCustomer, ids.otherSession));
    }
    return store.respond(call);
  });
  const storefront = client(storage);
  await storefront.eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null });
  await storefront.customer.verify({ code: "123456" });
  assert.equal(await storefront.eshop.cart.current({ buyer: customerBuyer, catalog_id: null }), null);
  assert.deepEqual(storage.keys(selectionPrefix), []);
  assert.deepEqual(storage.keys(tokenPrefix), []);
});

test("a reordered cart becomes the selection for its catalog and survives a reload", async (context) => {
  const storage = visitorStorage();
  const reordered = cartRecord({ id: ids.otherCart, catalog_id: ids.otherCatalog, origin: { type: "reorder", customer_session_id: ids.session, order_id: ids.order } });
  const leftOut = [{ order_line_item_id: ids.line, product_id: ids.product, variant_id: ids.variant, quantity: 1 }];
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/carts/reorder") return { cart: created(reordered, "reorder-token"), left_out: leftOut };
    return reordered;
  });
  const answer = await client(storage).eshop.cart.reorder({ id: ids.otherCart, order_id: ids.order, buyer: customerBuyer });
  assert.deepEqual(answer, { cart: created(reordered, "reorder-token"), left_out: leftOut });
  assert.deepEqual(calls[0].body, { id: ids.otherCart, order_id: ids.order, buyer: customerBuyer });
  const [key] = storage.keys(selectionPrefix);
  assert.ok(key.endsWith(`:customer:${ids.otherCatalog}`));
  const reloaded = await client(storage).eshop.cart.current({ buyer: customerBuyer, catalog_id: ids.otherCatalog });
  assert.equal(reloaded.id, ids.otherCart);
  assert.equal(calls[1].headers.get("x-arky-cart-token"), "reorder-token");
  assert.equal(await client(storage).eshop.cart.current({ buyer: customerBuyer, catalog_id: null }), null);
});

test("a reorder that answers another cart or another customer's cart is never selected", async (context) => {
  for (const [cart, message] of [
    [cartRecord({ id: ids.thirdCart }), /reorder returned a different cart/],
    [cartRecord({ id: ids.otherCart, customer_id: ids.otherCustomer }), /does not belong/],
  ]) {
    const storage = visitorStorage();
    recordFetch(context, () => ({ cart: created(cart), left_out: [] }));
    await assert.rejects(client(storage).eshop.cart.reorder({ id: ids.otherCart, order_id: ids.order, buyer: customerBuyer }), message);
    assert.deepEqual(storage.keys(selectionPrefix), []);
  }
});

test("selection needs request-local storage: a server-side client cannot create, reorder or read a selection", async (context) => {
  const calls = recordFetch(context, () => { throw new Error("no request expected"); });
  const serverSide = createStorefront(publishableKey, { apiUrl, market: "bih" });
  await assert.rejects(serverSide.eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null }), /request-local sessionStorage/);
  await assert.rejects(serverSide.eshop.cart.reorder({ id: ids.cart, order_id: ids.order, buyer: customerBuyer }), /request-local sessionStorage/);
  await assert.rejects(serverSide.eshop.cart.current(), /request-local sessionStorage/);
  assert.equal(calls.length, 0);
});
