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
    customer: { id: customerId, status: "active", created_at: 1, updated_at: 1 },
    session: { id: `session-${customerId}`, customer_id: customerId, type: "visitor", token: `customer_visitor_${"a".repeat(64)}`, status: "active", expires_at: 1900000000000 },
  };
}

function cart(overrides = {}) {
  return {
    id: cartId, customer_id: "customer-a", company: null,
    market_id: "market-a", sales_channel_id: "channel-a", status: { type: "active" },
    origin: { type: "storefront", customer_id: "customer-a", customer_session_id: "session-customer-a" },
    line_items: [], delivery_groups: [], billing_address: null, promotion_code_ids: [],
    purchase_order_number: null, item_count: 0, last_action_at: 1, abandoned_at: null, created_at: 1, updated_at: 1,
    ...overrides,
  };
}

function setup(respond) {
  const storage = storefrontSessionStorage(JSON.stringify({ version: 2, ...session() }));
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const call = { path: new URL(url).pathname, query: new URL(url).search, method: init.method, body: init.body ? JSON.parse(init.body) : null, headers: new Headers(init.headers) };
    calls.push(call);
    return respond(call, calls.length);
  };
  const client = () => createStorefront(publishableKey, { apiUrl, market: "market-a", sessionStorage: storage });
  return { storage, calls, client };
}

function receipt(value = cart()) {
  return Response.json({ cart: value, recovery_token: "private-recovery-token" });
}

test("selected Cart creation coalesces and reload exact-reads the same Cart without storing its data or token", async () => {
  const { client, calls, storage } = setup((call) => {
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

test("Company is one nested context; selecting another does not silently change an existing Cart", async () => {
  const company = { company_id: "company-a", company_location_id: null };
  const { client, calls } = setup((call) => call.method === "POST" ? receipt(cart({ company })) : Response.json(cart({ company })));
  await client().eshop.cart.current({ company });
  assert.deepEqual(calls[0].body, { company });
  await assert.rejects(client().eshop.cart.current({ company: null }), /different Company/);
  assert.equal(calls.filter((call) => call.method !== "GET").length, 1);
});

for (const type of ["active", "abandoned", "checking_out", "converted", "merged", "expired"]) {
  test(`selected ${type} Cart has an explicit reuse or terminal replacement policy`, async () => {
    let creates = 0;
    const { client, calls } = setup((call) => {
      if (call.method === "POST") return receipt(cart({ id: ++creates === 1 ? cartId : secondId }));
      return Response.json(cart({ status: { type, checkout_id: secondId, target_cart_id: secondId, command_id: secondId } }));
    });
    await client().eshop.cart.current();
    const terminal = ["converted", "merged", "expired"].includes(type);
    assert.equal((await client().eshop.cart.current()).id, terminal ? secondId : cartId);
    assert.equal(creates, terminal ? 2 : 1);
    assert.equal(calls.filter((call) => call.method === "GET").length, 1);
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
