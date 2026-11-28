import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { MutationObserver, QueryClient, useQueryClient } from "@tanstack/react-query";

import { ARKY_METHOD_TYPES, ARKY_METHODS_WITHOUT_PARAMS, createArkyReact } from "../dist/react.js";
import { createAdmin } from "../dist/admin.js";
import { createNetworkUser, createStorefront } from "../dist/storefront.js";
import { apiUrl, factoryOrderToken, fixedIdFactories, ids, recordFetch, storefrontIdentity, visitorStorage } from "./helpers/arky-fixtures.mjs";
import { MemoryStorage } from "./helpers/durable-request-fixtures.mjs";

const reviewedWriteVerbs = new Set([
  "accept", "add", "allocate", "allow", "answer", "archive", "assign", "attach", "attend", "batch", "block", "call", "cancel", "change",
  "checkout", "clear", "complete", "confirm", "connect", "copy", "correct", "create", "credit", "decline", "delete", "deliver", "detach", "end",
  "ensure", "erase", "execute", "expire", "finish", "forget", "grant", "identify", "import", "invite", "issue", "join", "logout", "make", "mark", "merge",
  "move", "name", "new", "on", "open", "pause", "pay", "print", "receive", "record", "recover", "refresh", "reissue", "release", "remove",
  "rename", "reopen", "reorder", "replace", "reply", "report", "request", "reschedule", "resend", "reset", "resize", "resolve", "resubscribe",
  "resume", "retain", "revoke", "save", "schedule", "select", "send", "set", "settle", "setup", "skip", "start", "step", "submit",
  "suspend", "switch", "take", "test", "track", "transfer", "turn", "unassign", "unblock", "unschedule", "unsubscribe", "update",
  "upload", "use", "verify", "void", "wipe", "withdraw", "write",
]);

function admin() {
  return createAdmin({ apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
}

function storefront() {
  return createStorefront(storefrontIdentity, { apiUrl, ...fixedIdFactories });
}

function visitorStorefront() {
  return createStorefront(storefrontIdentity, { apiUrl, sessionStorage: visitorStorage(), ...fixedIdFactories });
}

function networkUser(sessionStorage = new MemoryStorage()) {
  return createNetworkUser({ apiUrl, networkId: ids.network, sessionStorage });
}

function hooksFor(client, queryClient = new QueryClient()) {
  const { ArkyProvider, useArky } = createArkyReact();
  const seen = {};
  function Probe() {
    seen.hooks = useArky();
    seen.queryClient = useQueryClient();
    return null;
  }
  renderToString(createElement(ArkyProvider, { client, queryClient }, createElement(Probe)));
  return seen;
}

function nameRule(name) {
  return name.startsWith("get") || name.startsWith("find") ? "read" : "write";
}

function verbOf(name) {
  return name.match(/^[a-z]+/)[0];
}

function mirroredMembers(group) {
  return Object.keys(group).filter((key) => typeof group[key] === "function" || (group[key] && typeof group[key] === "object"));
}

function methodPaths(group, path = []) {
  return mirroredMembers(group).sort().flatMap((key) =>
    typeof group[key] === "function" ? [[...path, key]] : methodPaths(group[key], [...path, key]),
  );
}

function groupPaths(group, path = []) {
  return mirroredMembers(group)
    .filter((key) => typeof group[key] === "object")
    .flatMap((key) => [[...path, key], ...groupPaths(group[key], [...path, key])]);
}

function at(tree, parts) {
  return parts.reduce((node, part) => node[part], tree);
}

test("every Admin, storefront and network user method is a read or a write, by its get or find name or the explicit table", () => {
  const classified = new Set();
  for (const [label, client] of [["admin", admin()], ["storefront", storefront()], ["network user", networkUser()]]) {
    const { hooks } = hooksFor(client);
    for (const parts of [[], ...groupPaths(client)]) {
      assert.deepEqual(Object.keys(at(hooks, parts)).sort(), [...mirroredMembers(at(client, parts)), "key"].sort(), `${label} ${parts.join(".")}`);
    }
    for (const parts of methodPaths(client)) {
      const path = parts.join(".");
      const name = parts.at(-1);
      const declared = Object.hasOwn(ARKY_METHOD_TYPES, path) ? ARKY_METHOD_TYPES[path] : undefined;
      const type = declared ?? nameRule(name);
      assert.deepEqual(Object.keys(at(hooks, parts)).sort(), type === "read" ? ["key", "query"] : ["mutation"], `${label} ${path}`);
      if (declared === undefined && type === "write") {
        assert.ok(
          reviewedWriteVerbs.has(verbOf(name)),
          `${label} ${path}: "${verbOf(name)}" is no reviewed write verb; name the method in ARKY_METHOD_TYPES, or add the verb to reviewedWriteVerbs when it only ever writes`,
        );
      }
      classified.add(path);
    }
  }
  for (const [path, type] of Object.entries(ARKY_METHOD_TYPES)) {
    const name = path.split(".").at(-1);
    assert.ok(classified.has(path), `${path} names no Admin, storefront or network user method`);
    const repeated = type === "read" ? nameRule(name) === "read" : nameRule(name) === "write" && reviewedWriteVerbs.has(verbOf(name));
    assert.equal(repeated, false, `${path} only repeats what its name says`);
  }
  for (const path of ARKY_METHODS_WITHOUT_PARAMS) {
    assert.ok(classified.has(path), `${path} in ARKY_METHODS_WITHOUT_PARAMS names no Admin, storefront or network user method`);
  }
});

test("keys are arky, the group path, the method and its params, and every group's key is its prefix", () => {
  const { hooks: arky } = hooksFor(admin());
  const params = { tenant_id: ids.tenant, limit: 25 };
  assert.deepEqual(arky.users.find.key(params), ["arky", "users", "find", params]);
  assert.deepEqual(arky.eshop.order.notes.find.key({ tenant_id: ids.tenant, order_id: ids.order }), [
    "arky", "eshop", "order", "notes", "find", { tenant_id: ids.tenant, order_id: ids.order },
  ]);
  assert.deepEqual(arky.account.getMe.key(), ["arky", "account", "getMe", undefined]);
  assert.deepEqual(arky.key(), ["arky"]);
  assert.deepEqual(arky.users.key(), ["arky", "users"]);
  assert.deepEqual(arky.eshop.order.notes.key(), ["arky", "eshop", "order", "notes"]);

  const options = arky.users.find.query(params, { staleTime: 5_000, enabled: false });
  assert.deepEqual(options.queryKey, arky.users.find.key(params));
  assert.equal(options.staleTime, 5_000);
  assert.equal(options.enabled, false);
  assert.equal(typeof options.queryFn, "function");
  assert.deepEqual(arky.users.update.mutation().mutationKey, ["arky", "users", "update"]);

  const { hooks: shop } = hooksFor(storefront());
  assert.deepEqual(shop.eshop.cart.quote.key({ id: ids.cart }), ["arky", "eshop", "cart", "quote", { id: ids.cart }]);
  assert.deepEqual(shop.getSetup.key(), ["arky", "getSetup", undefined]);
  assert.deepEqual(shop.user.key(), ["arky", "user"]);
});

test("the request options that change the answer join the key, and the others stay out of it", () => {
  const { hooks: shop } = hooksFor(storefront());
  const order = { id: ids.order };
  const label = { "x-request-label": "order page" };
  assert.deepEqual(shop.eshop.order.get.key(order, { order_token: factoryOrderToken, headers: label }), [
    "arky", "eshop", "order", "get", order, { order_token: factoryOrderToken },
  ]);
  assert.deepEqual(shop.tenant.country.find.key(undefined, { locale: "bs", market: "bih" }), [
    "arky", "tenant", "country", "find", undefined, { locale: "bs", market: "bih" },
  ]);
  assert.deepEqual(shop.eshop.order.get.key(order, { order_token: null, headers: label }), ["arky", "eshop", "order", "get", order]);
  assert.deepEqual(shop.eshop.order.get.key(order, {}), ["arky", "eshop", "order", "get", order]);

  const options = shop.eshop.order.get.query(order, { request: { order_token: factoryOrderToken }, staleTime: 1_000 });
  assert.deepEqual(options.queryKey, ["arky", "eshop", "order", "get", order, { order_token: factoryOrderToken }]);
  assert.equal(options.staleTime, 1_000);
  assert.equal("request" in options, false);

  const { hooks: arky } = hooksFor(admin());
  assert.equal("request" in arky.users.update.mutation({ request: { headers: label } }), false);
});

test("a storefront read's key names the client's language and market, so changing either reads again", () => {
  const client = createStorefront(storefrontIdentity, { apiUrl, ...fixedIdFactories, locale: "bs", market: "bih" });
  const { hooks: shop } = hooksFor(client);
  const order = { id: ids.order };
  assert.deepEqual(shop.eshop.order.get.key(order), ["arky", "eshop", "order", "get", order, { locale: "bs", market: "bih" }]);
  assert.deepEqual(shop.eshop.order.get.key(order, { order_token: factoryOrderToken }), [
    "arky", "eshop", "order", "get", order, { order_token: factoryOrderToken, locale: "bs", market: "bih" },
  ]);
  client.setContext({ locale: "hr" });
  assert.deepEqual(shop.eshop.order.get.key(order), ["arky", "eshop", "order", "get", order, { locale: "hr", market: "bih" }]);
  assert.deepEqual(shop.tenant.country.find.key(undefined, { market: "hrv" }), ["arky", "tenant", "country", "find", undefined, { locale: "hr", market: "hrv" }]);
  const { hooks: arky } = hooksFor(admin());
  assert.deepEqual(arky.users.find.key({ tenant_id: ids.tenant }), ["arky", "users", "find", { tenant_id: ids.tenant }]);
});

test("a read runs its SDK call under its key with TanStack's abort signal, also a read without params and one Arky takes as a POST", async (context) => {
  const user = { id: ids.user, tenant_id: ids.tenant, updated_at: 1 };
  const quote = { blockers: [] };
  const account = { id: ids.account };
  const calls = recordFetch(context, (call) => (call.path.endsWith("/quote") ? quote : call.path === "/v1/accounts/me" ? account : user));
  const queryClient = new QueryClient();
  const { hooks: arky } = hooksFor(admin(), queryClient);
  const params = { tenant_id: ids.tenant, id: ids.user };

  assert.deepEqual(await queryClient.fetchQuery(arky.users.get.query(params)), user);
  assert.deepEqual(queryClient.getQueryData(arky.users.get.key(params)), user);

  const quoteParams = { tenant_id: ids.tenant, id: ids.cart, language: "en" };
  assert.deepEqual(await queryClient.fetchQuery(arky.eshop.cart.quote.query(quoteParams)), quote);
  assert.deepEqual(await queryClient.fetchQuery(arky.account.getMe.query()), account);
  assert.deepEqual(queryClient.getQueryData(arky.account.getMe.key()), account);

  assert.deepEqual(calls.map((call) => [call.method, call.href, call.body]), [
    ["GET", `${apiUrl}/v1/tenants/${ids.tenant}/users/${ids.user}`, null],
    ["POST", `${apiUrl}/v1/tenants/${ids.tenant}/carts/${ids.cart}/quote`, { language: "en" }],
    ["GET", `${apiUrl}/v1/accounts/me`, null],
  ]);
  for (const call of calls) assert.ok(call.signal instanceof AbortSignal, call.href);
});

test("a read sends its request options with the call, also an order token and a read without params", async (context) => {
  const order = { id: ids.order };
  const countries = { items: [], cursor: null };
  const calls = recordFetch(context, (call) => (call.path === "/v1/platform/countries" ? countries : order));
  const queryClient = new QueryClient();
  const { hooks: shop } = hooksFor(visitorStorefront(), queryClient);

  assert.deepEqual(await queryClient.fetchQuery(shop.eshop.order.get.query(order, { request: { order_token: factoryOrderToken } })), order);
  assert.deepEqual(queryClient.getQueryData(shop.eshop.order.get.key(order, { order_token: factoryOrderToken })), order);
  assert.equal(queryClient.getQueryData(shop.eshop.order.get.key(order)), undefined);
  assert.deepEqual(await queryClient.fetchQuery(shop.tenant.country.find.query(undefined, { request: { locale: "bs" } })), countries);

  assert.deepEqual(calls.map((call) => [call.method, call.href]), [
    ["GET", `${apiUrl}/v1/storefront/orders/${ids.order}`],
    ["GET", `${apiUrl}/v1/platform/countries`],
  ]);
  assert.equal(calls[0].headers.get("x-arky-order-token"), factoryOrderToken);
  assert.equal(calls[1].headers.get("x-arky-locale"), "bs");
  assert.equal(calls[1].headers.has("x-arky-order-token"), false);
  for (const call of calls) assert.ok(call.signal instanceof AbortSignal, call.href);

  const { hooks: arky } = hooksFor(admin(), queryClient);
  await queryClient.fetchQuery(arky.account.getMe.query(undefined, { request: { headers: { "x-request-label": "profile" } } }));
  assert.equal(calls[2].href, `${apiUrl}/v1/accounts/me`);
  assert.equal(calls[2].headers.get("x-request-label"), "profile");
  assert.ok(calls[2].signal instanceof AbortSignal);
});

test("a write invalidates its group's prefix and the keys it names, then runs the caller's onSuccess", async (context) => {
  const updated = { id: ids.user, tenant_id: ids.tenant, updated_at: 2 };
  const calls = recordFetch(context, () => updated);
  const queryClient = new QueryClient();
  const { hooks: arky, queryClient: provided } = hooksFor(admin(), queryClient);
  assert.equal(provided, queryClient);
  const tenant_id = ids.tenant;
  const keys = {
    user: arky.users.get.key({ tenant_id, id: ids.user }),
    users: arky.users.find.key({ tenant_id }),
    userNotes: arky.users.notes.find.key({ tenant_id, user_id: ids.user }),
    order: arky.eshop.order.get.key({ tenant_id, id: ids.order }),
    orderNotes: arky.eshop.order.notes.find.key({ tenant_id, order_id: ids.order }),
    tenant: arky.tenant.get.key({ id: tenant_id }),
  };
  for (const key of Object.values(keys)) queryClient.setQueryData(key, { seeded: true });
  const invalidated = () => Object.fromEntries(Object.entries(keys).map(([name, key]) => [name, queryClient.getQueryState(key).isInvalidated]));

  const variables = { tenant_id, id: ids.user, expected_updated_at: 1, name: { first_name: "Ana", last_name: "Kovač" } };
  const ran = [];
  const save = new MutationObserver(
    queryClient,
    arky.users.update.mutation({
      invalidates: [arky.eshop.order.key()],
      onSuccess: (data, received) => ran.push({ data, received, invalidated: invalidated() }),
    }),
  );
  assert.deepEqual(await save.mutate(variables), updated);
  assert.deepEqual(ran, [
    {
      data: updated,
      received: variables,
      invalidated: { user: true, users: true, userNotes: true, order: true, orderNotes: true, tenant: false },
    },
  ]);
  assert.deepEqual(calls.map((call) => [call.method, call.href, call.body]), [
    ["PATCH", `${apiUrl}/v1/tenants/${tenant_id}/users/${ids.user}`, { expected_updated_at: 1, name: { first_name: "Ana", last_name: "Kovač" } }],
  ]);
});

test("a write in a nested group invalidates only that group's prefix", async (context) => {
  const note = { id: ids.picked, body: "Called back" };
  const calls = recordFetch(context, () => note);
  const queryClient = new QueryClient();
  const { hooks: arky } = hooksFor(admin(), queryClient);
  const tenant_id = ids.tenant;
  const userKey = arky.users.get.key({ tenant_id, id: ids.user });
  const notesKey = arky.users.notes.find.key({ tenant_id, user_id: ids.user });
  queryClient.setQueryData(userKey, { seeded: true });
  queryClient.setQueryData(notesKey, { seeded: true });

  const variables = { tenant_id, user_id: ids.user, id: ids.picked, body: "Called back" };
  assert.deepEqual(await new MutationObserver(queryClient, arky.users.notes.create.mutation()).mutate(variables), note);
  assert.equal(queryClient.getQueryState(notesKey).isInvalidated, true);
  assert.equal(queryClient.getQueryState(userKey).isInvalidated, false);
  assert.deepEqual(calls.map((call) => [call.method, call.href, call.body]), [
    ["POST", `${apiUrl}/v1/tenants/${tenant_id}/users/${ids.user}/notes`, { id: ids.picked, body: "Called back" }],
  ]);
});

test("a write sends its request options with the call, also a write without params and an order token", async (context) => {
  const action = { type: "redirect", url: "https://pay.example.test" };
  const calls = recordFetch(context, (call) =>
    call.path === "/v1/accounts" ? { id: ids.account } : call.path.endsWith("/payment-action") ? action : { id: ids.user, updated_at: 2 },
  );
  const queryClient = new QueryClient();
  const { hooks: arky } = hooksFor(admin(), queryClient);
  const { hooks: shop } = hooksFor(visitorStorefront(), queryClient);
  const label = { "x-request-label": "staff page" };
  const tokenKey = shop.eshop.order.get.key({ id: ids.order }, { order_token: factoryOrderToken });
  queryClient.setQueryData(tokenKey, { seeded: true });

  const variables = { tenant_id: ids.tenant, id: ids.user, expected_updated_at: 1 };
  await new MutationObserver(queryClient, arky.users.update.mutation({ request: { headers: label } })).mutate(variables);
  await new MutationObserver(queryClient, arky.account.delete.mutation({ request: { headers: label } })).mutate();
  const resume = new MutationObserver(queryClient, shop.eshop.order.resumePayment.mutation({ request: { order_token: factoryOrderToken } }));
  assert.deepEqual(await resume.mutate({ order_id: ids.order }), action);

  assert.deepEqual(
    calls.map((call) => [call.method, call.href, call.body, call.headers.get("x-request-label"), call.headers.get("x-arky-order-token")]),
    [
      ["PATCH", `${apiUrl}/v1/tenants/${ids.tenant}/users/${ids.user}`, { expected_updated_at: 1 }, "staff page", null],
      ["DELETE", `${apiUrl}/v1/accounts`, null, "staff page", null],
      ["POST", `${apiUrl}/v1/storefront/orders/${ids.order}/payment-action`, null, null, factoryOrderToken],
    ],
  );
  assert.equal(queryClient.getQueryState(tokenKey).isInvalidated, true);
});

test("useArky needs an ArkyProvider above it", () => {
  const { useArky } = createArkyReact();
  function Lonely() {
    useArky();
    return null;
  }
  assert.throws(() => renderToString(createElement(Lonely)), { name: "TypeError", message: "useArky() needs an ArkyProvider above it" });
});

test("the walk never runs a getter and mirrors only methods and groups", () => {
  let getterReads = 0;
  const client = {
    get session() {
      getterReads++;
      return { id: ids.session };
    },
    version: "1",
    things: { get: async () => "thing", create: async () => "made" },
  };
  const { hooks } = hooksFor(client);
  assert.equal(getterReads, 0);
  assert.deepEqual(Object.keys(hooks).sort(), ["key", "things"]);
  assert.deepEqual(Object.keys(hooks.things).sort(), ["create", "get", "key"]);
  assert.throws(() => hooksFor({ things: { key: async () => "key" } }), {
    name: "TypeError",
    message: "things.key can't get hooks: key() names its group",
  });
});

test("a network user's own reads and writes take no params, and the tenant key it opens is a write", async (context) => {
  const token = {
    id: ids.session,
    access_token: `network_user_access_${"a".repeat(43)}`,
    refresh_token: `network_user_refresh_${"r".repeat(43)}`,
    access_expires_at: 1_900_000_000_000,
    refresh_expires_at: 1_900_000_600_000,
    authenticated_at: 1_700_000_000_000,
    reach: { type: "network" },
  };
  const storage = new MemoryStorage();
  storage.seed(`arky_network_user_session:v1:${encodeURIComponent(apiUrl)}:${ids.network}`, JSON.stringify({ version: 1, token }));
  const me = { account_id: ids.account, logins: [], session: { id: ids.session, reach: { type: "network" }, signed_in_with: { type: "email", email: "ana@example.test" }, authenticated_at: 1, access_expires_at: 2, refresh_expires_at: 3 } };
  const calls = recordFetch(context, (call) => (call.method === "DELETE" ? { deleted: true } : me));
  const queryClient = new QueryClient();
  const { hooks: portal } = hooksFor(networkUser(storage), queryClient);
  assert.deepEqual(portal.getMe.key(), ["arky", "getMe", undefined]);
  assert.deepEqual(await queryClient.fetchQuery(portal.getMe.query()), me);
  assert.deepEqual(Object.keys(portal.tenant.openKey).sort(), ["mutation"]);
  assert.deepEqual(Object.keys(portal.tenant.find).sort(), ["key", "query"]);
  assert.deepEqual(await new MutationObserver(queryClient, portal.deleteAccount.mutation()).mutate(), { deleted: true });
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["GET", `/v1/networks/${ids.network}/user/me`],
    ["DELETE", `/v1/networks/${ids.network}/user/me`],
  ]);
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${token.access_token}`);
});
