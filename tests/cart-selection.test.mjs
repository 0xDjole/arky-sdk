import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createStorefront } from "../dist/storefront.js";
import { storefrontSessionStorage } from "./helpers/storefront-session-storage.mjs";

const apiUrl = "https://api.example.test";
const publishableKey = `arky_pk_${"a".repeat(42)}A`;
const cartId = "9f1b6e23-e2ea-4ab9-a1b7-eaaf550ddf41";
const secondId = "2b815d21-78be-431a-b49c-0d5d62c87823";
const savedFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = savedFetch; });

function session(customerId = "customer-a") {
  return {
    customer: { id: customerId, status: { type: "active" }, created_at: 1, updated_at: 1 },
    session: { id: `session-${customerId}`, customer_id: customerId, type: "visitor", token: `customer_visitor_${"a".repeat(64)}`, status: { type: "active" }, expires_at: 1900000000000 },
  };
}

function cart(overrides = {}) {
  return {
    id: cartId, customer_id: "customer-a", company: null,
    market_id: "market-a", catalog_id: "catalog-a", sales_channel_id: "channel-a", status: { type: "active" },
    origin: { type: "storefront", customer_id: "customer-a", customer_session_id: "session-customer-a" },
    line_items: [], delivery_groups: [], billing_address: null, promotion_code_ids: [],
    purchase_order_number: null, item_count: 0, last_action_at: 1, abandoned_at: null, created_at: 1, updated_at: 1,
    ...overrides,
  };
}

function market(key, id = key) {
  return { id, key, currency: "eur", tax_mode: "exclusive", payment_option_ids: [] };
}

function setup(respond, confirmMarket = (key) => market(key)) {
  const storage = storefrontSessionStorage(JSON.stringify({ version: 2, ...session() }));
  const calls = [];
  const marketReads = [];
  globalThis.fetch = async (url, init) => {
    const parsed = new URL(url);
    const selected = parsed.pathname.match(/^\/v1\/storefront\/markets\/by-key\/([^/]+)$/);
    if (selected) {
      marketReads.push({ key: decodeURIComponent(selected[1]), method: init.method, headers: new Headers(init.headers) });
      return Response.json(confirmMarket(decodeURIComponent(selected[1])));
    }
    const call = { path: parsed.pathname, query: parsed.search, method: init.method, body: init.body ? JSON.parse(init.body) : null, headers: new Headers(init.headers) };
    calls.push(call);
    return respond(call, calls.length);
  };
  const client = (options = { market: "market-a" }) => createStorefront(publishableKey, { apiUrl, ...options, sessionStorage: storage });
  return { storage, calls, client, marketReads };
}

function receipt(value = cart()) {
  return Response.json({ cart: value, recovery_token: "private-recovery-token" });
}

test("selected Cart creation coalesces and reload exact-reads the same Cart without storing its data or token", async () => {
  const { client, calls, storage, marketReads } = setup((call) => {
    if (call.method === "POST" && call.path === "/v1/storefront/carts") return receipt();
    assert.equal(call.path, `/v1/storefront/carts/${cartId}`);
    assert.equal(call.method, "GET");
    return Response.json(cart());
  });
  const first = client();
  const results = await Promise.all([first.eshop.cart.current(), first.eshop.cart.current()]);
  assert.deepEqual(results, [cart(), cart()]);
  assert.equal(calls.length, 1);
  assert.deepEqual(await client().eshop.cart.current(), cart());
  assert.equal(calls.length, 2);
  assert.deepEqual(marketReads.map(({ key, method }) => [key, method]), [["market-a", "GET"], ["market-a", "GET"], ["market-a", "GET"]]);
  assert.ok(marketReads.every(({ headers }) => headers.get("x-arky-market") === "market-a"));
  const [[key, value]] = storage.values;
  assert.ok(key.startsWith("arky:selected-cart:v1:"));
  assert.ok(!key.includes(publishableKey));
  assert.deepEqual(JSON.parse(value), { version: 1, id: cartId, market_id: "market-a" });
  assert.ok(!value.includes("private-recovery-token"));
});

for (const status of [403, 404, 503]) {
  test(`selected Cart ${status} never creates a replacement or removes the retained selection`, async () => {
    const { client, calls, storage } = setup((call) => call.method === "POST" ? receipt() : Response.json({ message: "Cart unavailable" }, { status }));
    await client().eshop.cart.current();
    const retained = [...storage.values];
    await assert.rejects(client().eshop.cart.current());
    assert.equal(calls.filter((call) => call.method === "POST").length, 1);
    assert.deepEqual([...storage.values], retained);
  });
}

test("each Company branch and the personal context retain separate Carts through reload", async () => {
  const carts = new Map();
  let next = 0;
  const { client, calls, storage } = setup((call) => {
    if (call.method === "POST") {
      const value = cart({ id: `cart-${++next}`, company: call.body.company ?? null });
      carts.set(value.id, value);
      return receipt(value);
    }
    return Response.json(carts.get(call.path.split("/").at(-1)));
  });
  const contexts = [
    { company_id: "company-a", company_location_id: "branch-a" },
    { company_id: "company-a", company_location_id: "branch-b" },
    { company_id: "company-b", company_location_id: "branch-c" },
    null,
  ];
  const selected = [];
  for (const company of contexts) selected.push(await client().eshop.cart.current({ company }));
  assert.equal(new Set(selected.map((value) => value.id)).size, 4);
  for (const [index, company] of contexts.entries()) assert.deepEqual(await client().eshop.cart.current({ company }), selected[index]);
  assert.deepEqual(await client().eshop.cart.current(), selected[3]);
  assert.equal(calls.filter((call) => call.method === "POST").length, 4);
  assert.equal([...storage.values.keys()].filter((key) => key.startsWith("arky:selected-cart:")).length, 4);
});

test("an exact Cart whose Company context changed cannot be silently reused", async () => {
  const company = { company_id: "company-a", company_location_id: "branch-a" };
  const { client, calls } = setup((call) => call.method === "POST" ? receipt(cart({ company })) : Response.json(cart({ company: { ...company, company_location_id: "branch-b" } })));
  await client().eshop.cart.current({ company });
  await assert.rejects(client().eshop.cart.current({ company }), /different Company/);
  assert.equal(calls.filter((call) => call.method !== "GET").length, 1);
});

test("the default personal Cart refuses a Company response", async () => {
  const { client, calls, storage } = setup(() => receipt(cart({ company: { company_id: "company-a", company_location_id: "branch-a" } })));
  await assert.rejects(client().eshop.cart.current(), /different Company/);
  assert.equal(calls.length, 1);
  assert.equal([...storage.values.keys()].filter((key) => key.startsWith("arky:selected-cart:")).length, 0);
});

for (const status of [
  { type: "active" },
  { type: "abandoned" },
  { type: "converted", order_id: secondId, request_id: secondId },
  { type: "merged", target_cart_id: secondId, request_id: secondId },
  { type: "superseded", target_cart_id: secondId, request_id: secondId },
  { type: "expired" },
]) {
  const { type } = status;
  test(`selected ${type} Cart has an explicit reuse or terminal replacement policy`, async () => {
    let creates = 0;
    const { client, calls } = setup((call) => {
      if (call.method === "POST") return receipt(cart({ id: ++creates === 1 ? cartId : secondId }));
      return Response.json(cart({ status }));
    });
    await client().eshop.cart.current();
    const terminal = ["converted", "merged", "superseded", "expired"].includes(type);
    const selected = await client().eshop.cart.current();
    assert.equal(selected.id, terminal ? secondId : cartId);
    assert.deepEqual(selected.status, terminal ? { type: "active" } : status);
    assert.equal(creates, terminal ? 2 : 1);
    assert.equal(calls.filter((call) => call.method === "GET").length, 1);
    assert.ok(calls.filter((call) => call.method === "GET").every((call) => call.path.endsWith(`/${cartId}`)));
    assert.ok(calls.every((call) => ["GET", "POST"].includes(call.method)));
  });
}

test("corrupt selected state fails visibly without network calls", async () => {
  const { client, storage, calls } = setup(() => receipt());
  await client().eshop.cart.current();
  const [key] = storage.values.keys();
  storage.setItem(key, '{"version":1}');
  await assert.rejects(client().eshop.cart.current(), /reference is invalid/);
  assert.equal(calls.length, 1);
  assert.equal(storage.getItem(key), '{"version":1}');
});

test("explicit creation selects a new empty Cart without changing the previous Cart", async () => {
  let creates = 0;
  const { client, calls } = setup((call) => call.method === "POST"
    ? receipt(cart({ id: ++creates === 1 ? cartId : secondId }))
    : Response.json(cart({ id: secondId })));
  const active = client();
  await active.eshop.cart.current();
  const created = await active.eshop.cart.create();
  assert.equal(created.cart.id, secondId);
  assert.equal(created.recovery_token, "private-recovery-token");
  assert.equal((await client().eshop.cart.current()).id, secondId);
  assert.equal(calls.filter((call) => call.method === "POST").length, 2);
  assert.ok(calls.every((call) => !["PUT", "DELETE"].includes(call.method)));
});

test("selected Cart exact reading cannot leak a caller-supplied recovery credential into its URL", async () => {
  const { client, calls } = setup((call) => call.method === "POST" ? receipt() : Response.json(cart()));
  await client().eshop.cart.current();
  await client().eshop.cart.current({}, {
    params: { token: "secret-a", cart_token: "secret-b" },
    headers: { "X-Arky-Cart-Token": "secret-c" },
  });
  assert.equal(calls[1].path, `/v1/storefront/carts/${cartId}`);
  assert.equal(calls[1].query, "");
  assert.equal(calls[1].headers.get("x-arky-cart-token"), null);
});

test("a late Market or Customer change cannot install an old Cart in the new context", async () => {
  let release;
  let started;
  const gate = new Promise((resolve) => { release = resolve; });
  const entering = new Promise((resolve) => { started = resolve; });
  const { client, storage, calls } = setup(async (call) => {
    if (call.path.endsWith("/customer/identify")) return Response.json(session("customer-b"));
    started();
    await gate;
    return receipt();
  });
  const active = client();
  const pending = active.eshop.cart.current();
  await entering;
  active.setMarket("market-b");
  await active.customer.identify();
  release();
  await assert.rejects(pending, /Customer or Market changed/);
  assert.equal([...storage.values.keys()].filter((key) => key.startsWith("arky:selected-cart:")).length, 0);
  assert.equal(calls.filter((call) => call.path.endsWith("/carts")).length, 1);
});

test("the selected Market must be explicit and confirmed before any Cart read or creation", async () => {
  const unselected = setup(() => receipt());
  await assert.rejects(unselected.client({}).eshop.cart.current(), /Select a Market before selecting or creating a Cart/);
  await assert.rejects(unselected.client({}).eshop.cart.create(), /Select a Market before selecting or creating a Cart/);
  assert.equal(unselected.calls.length, 0);
  assert.equal(unselected.marketReads.length, 0);
  const wrongKey = setup(() => receipt(), () => market("market-b"));
  await assert.rejects(wrongKey.client().eshop.cart.current(), /did not confirm the selected key/);
  assert.equal(wrongKey.calls.length, 0);
  const wrongIdentity = setup(() => receipt(), (key) => market(key, "market-other"));
  await assert.rejects(wrongIdentity.client().eshop.cart.current(), /does not match the selected Cart/);
  assert.equal(wrongIdentity.calls.filter((call) => call.method === "POST").length, 1);
  assert.equal([...wrongIdentity.storage.values.keys()].filter((key) => key.startsWith("arky:selected-cart:")).length, 0);
});

test("a failed selection save retries persistence and exact reading without reposting creation", async () => {
  const { client, storage, calls } = setup((call) => call.method === "POST" ? receipt() : Response.json(cart()));
  const write = storage.setItem.bind(storage);
  storage.setItem = () => { throw new Error("storage full"); };
  const active = client();
  await assert.rejects(active.eshop.cart.current(), /selection could not be saved/);
  storage.setItem = write;
  assert.equal((await active.eshop.cart.current()).id, cartId);
  assert.equal(calls.filter((call) => call.method === "POST").length, 1);
  assert.equal(calls.filter((call) => call.method === "GET").length, 1);
});

test("a named Catalog creates and retains its own Cart next to the Cart created without one", async () => {
  const carts = new Map();
  let next = 0;
  const { client, calls, storage } = setup((call) => {
    if (call.method === "POST") {
      const value = cart({ id: `cart-${++next}`, catalog_id: call.body.catalog_id ?? "public-catalog" });
      carts.set(value.id, value);
      return receipt(value);
    }
    return Response.json(carts.get(call.path.split("/").at(-1)));
  });
  const publicCart = await client().eshop.cart.current();
  const partnerCart = await client().eshop.cart.current({ catalog_id: "partner-catalog" });
  assert.equal(publicCart.catalog_id, "public-catalog");
  assert.equal(partnerCart.catalog_id, "partner-catalog");
  assert.notEqual(publicCart.id, partnerCart.id);
  assert.deepEqual(calls.filter((call) => call.method === "POST").map((call) => call.body), [{}, { catalog_id: "partner-catalog" }]);
  assert.deepEqual(await client().eshop.cart.current({ catalog_id: "partner-catalog" }), partnerCart);
  assert.deepEqual(await client().eshop.cart.current(), publicCart);
  assert.equal(calls.filter((call) => call.method === "POST").length, 2);
  const keys = [...storage.values.keys()].filter((key) => key.startsWith("arky:selected-cart:"));
  assert.equal(keys.length, 2);
  assert.ok(keys.some((key) => key.endsWith(":partner-catalog")));
  assert.ok(keys.some((key) => key.endsWith(":")));
});

test("explicit creation sends the named Catalog with the Company context", async () => {
  const company = { company_id: "company-a", company_location_id: "branch-a" };
  const { client, calls } = setup((call) => receipt(cart({ company, catalog_id: call.body.catalog_id })));
  const created = await client().eshop.cart.create({ company, catalog_id: "partner-catalog" });
  assert.equal(created.cart.catalog_id, "partner-catalog");
  assert.deepEqual(calls[0].body, { company, catalog_id: "partner-catalog" });
});

test("a selected Cart in another Catalog than the one named is refused without replacing the selection", async () => {
  const { client, calls, storage } = setup((call) => call.method === "POST"
    ? receipt(cart({ catalog_id: "partner-catalog" }))
    : Response.json(cart({ catalog_id: "other-catalog" })));
  await client().eshop.cart.current({ catalog_id: "partner-catalog" });
  const retained = [...storage.values];
  await assert.rejects(client().eshop.cart.current({ catalog_id: "partner-catalog" }), /different Catalog/);
  assert.deepEqual([...storage.values], retained);
  assert.equal(calls.filter((call) => call.method === "POST").length, 1);
});

test("a created Cart in another Catalog, or without one, is never selected", async () => {
  const wrong = setup(() => receipt(cart({ catalog_id: "other-catalog" })));
  await assert.rejects(wrong.client().eshop.cart.current({ catalog_id: "partner-catalog" }), /different Catalog/);
  assert.equal([...wrong.storage.values.keys()].filter((key) => key.startsWith("arky:selected-cart:")).length, 0);
  const missing = setup(() => receipt(cart({ catalog_id: undefined })));
  await assert.rejects(missing.client().eshop.cart.current(), /does not name the Cart's Catalog/);
  assert.equal([...missing.storage.values.keys()].filter((key) => key.startsWith("arky:selected-cart:")).length, 0);
});
