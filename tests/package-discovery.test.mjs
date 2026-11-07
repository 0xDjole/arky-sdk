import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import {
  apiUrl,
  fixedIdFactories,
  publishableKey,
  SessionStorage,
} from "./helpers/arky-fixtures.mjs";

const storefrontMemberCalls = [
  "cancel",
  "changeTerms",
  "find",
  "findOrders",
  "get",
  "getCalendar",
  "getCurrent",
  "getDeliveryOptions",
  "getProductChoices",
  "getRevision",
  "getSwitchDeliveryOptions",
  "pause",
  "resume",
  "reviewSwitch",
  "reviewTerms",
  "selectPaymentMethod",
  "skipNext",
  "switch",
  "withdrawRevision",
];

test("the storefront reads packages, offerings and the shopper's own members under eshop, with no assign or email consent calls", () => {
  const client = createStorefront(publishableKey, {
    visitorIdentity: {
      customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58",
      session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63",
    },
    ...fixedIdFactories,
    apiUrl,
    sessionStorage: new SessionStorage(),
  });
  const store = initialize(publishableKey, {
    visitorIdentity: {
      customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58",
      session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63",
    },
    ...fixedIdFactories,
    apiUrl,
    sessionStorage: new SessionStorage(),
  });
  for (const removed of [
    "packages",
    "package_members",
    "subscription_plans",
    "subscription_offerings",
  ]) {
    assert.equal(removed in client, false, removed);
    assert.equal(removed in store, false, removed);
  }
  for (const facade of [client, store]) {
    assert.deepEqual(Object.keys(facade.eshop.package).sort(), [
      "find",
      "get",
      "getByKey",
      "getProductChoices",
      "joinFree",
    ]);
    assert.deepEqual(Object.keys(facade.eshop.packageOffering).sort(), [
      "get",
      "getByKey",
    ]);
    assert.deepEqual(
      Object.keys(facade.eshop.packageMember).sort(),
      storefrontMemberCalls,
    );
    for (const removed of [
      "assign",
      "join",
      "revoke",
      "scheduleEnd",
      "transferMinimum",
      "changeMinimum",
      "correctTaxClassification",
    ]) {
      assert.equal(removed in facade.eshop.packageMember, false, removed);
    }
    assert.equal("subscription" in facade.eshop, false);
  }
});

test("package and member transport keeps combined predicates, empty continuations and app-picked ids", async (context) => {
  const store = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
  const memberPackageId = "cf8a15f4-1489-40a1-a850-a98b7e311699";
  const offeringId = "a3d5f7b9-2c4e-4a6b-8d0f-1e3a5c7e9b2d";
  const memberId = "e245588f-0542-4bb3-97c8-23de326627d1";
  const customerId = "70b5f662-f3d8-48c9-8c16-c60dd4ff1703";
  const cursor = "opaque:/+==next";
  const packageFields = {
    key: "members",
    blocks: [],
    renewal: { type: "never" },
    stay: { type: "any_time" },
    minimum: { type: "none" },
    schedule: { type: "always" },
    status: { type: "active" },
    items: [],
  };
  const memberPackage = {
    id: memberPackageId,
    store_id: store,
    ...packageFields,
    created_at: 1,
    updated_at: 1,
  };
  const subject = { type: "customer", customer_id: customerId };
  const member = {
    id: memberId,
    store_id: store,
    package_id: memberPackageId,
    subject,
    renewal: { type: "never", access_end: { type: "never" } },
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
  };
  const replies = [
    { items: [], cursor },
    { items: [memberPackage], cursor: null },
    memberPackage,
    memberPackage,
    { items: [], cursor },
    { items: [member], cursor: null },
    member,
    member,
    { ...memberPackage, status: { type: "deleting" } },
  ];
  const calls = [];
  context.mock.method(globalThis, "fetch", async (input, init = {}) => {
    calls.push({
      url: new URL(input),
      method: init.method ?? "GET",
      headers: new Headers(init.headers),
      body: init.body ? JSON.parse(init.body) : null,
    });
    const reply = replies.shift();
    return new Response(JSON.stringify(reply), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
  const admin = createAdmin({
    apiUrl: "https://api.example.test",
    accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA",
  });
  const filter = {
    store_id: store,
    package_offering_id: offeringId,
    status: { type: "active" },
    query: "members",
    limit: 20,
  };
  const page = await admin.eshop.package.find(filter);
  assert.deepEqual(page, { items: [], cursor });
  assert.equal(calls.length, 1);
  assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), {
    package_offering_id: offeringId,
    status: JSON.stringify({ type: "active" }),
    query: "members",
    limit: "20",
  });
  assert.deepEqual(
    await admin.eshop.package.find({ ...filter, cursor: page.cursor }),
    { items: [memberPackage], cursor: null },
  );
  assert.deepEqual(
    await admin.eshop.package.getByKey({
      store_id: store,
      key: memberPackage.key,
    }),
    memberPackage,
  );
  assert.deepEqual(
    await admin.eshop.package.create({
      store_id: store,
      id: memberPackageId,
      ...packageFields,
    }),
    memberPackage,
  );
  const members = {
    store_id: store,
    package_id: memberPackageId,
    customer_id: customerId,
    status: "active",
    limit: 20,
  };
  assert.deepEqual(await admin.eshop.packageMember.find(members), {
    items: [],
    cursor,
  });
  assert.deepEqual(
    await admin.eshop.packageMember.find({ ...members, cursor }),
    { items: [member], cursor: null },
  );
  assert.deepEqual(
    await admin.eshop.packageMember.get({
      store_id: store,
      id: memberId,
    }),
    member,
  );
  assert.deepEqual(
    await admin.eshop.packageMember.assign({
      store_id: store,
      id: memberId,
      package_id: memberPackageId,
      subject,
      access_end: { type: "never" },
    }),
    member,
  );
  assert.deepEqual(
    await admin.eshop.package.delete({
      store_id: store,
      id: memberPackageId,
      expected_updated_at: 1,
    }),
    { ...memberPackage, status: { type: "deleting" } },
  );
  assert.ok(
    calls.every(
      (call) =>
        call.url.pathname.startsWith(`/v1/stores/${store}/`) &&
        call.headers.get("authorization") === "Bearer arky_at_ttttttttttttttttttttttttttttttttttttttttttA",
    ),
  );
  assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), {
    package_offering_id: offeringId,
    status: JSON.stringify({ type: "active" }),
    query: "members",
    limit: "20",
    cursor,
  });
  assert.equal(
    calls[2].url.pathname,
    `/v1/stores/${store}/packages/by-key/members`,
  );
  assert.deepEqual(calls[3].body, { id: memberPackageId, ...packageFields });
  assert.deepEqual(Object.fromEntries(calls[5].url.searchParams), {
    package_id: memberPackageId,
    customer_id: customerId,
    status: "active",
    limit: "20",
    cursor,
  });
  assert.equal(
    calls[6].url.pathname,
    `/v1/stores/${store}/package-members/${memberId}`,
  );
  assert.equal(calls[7].method, "POST");
  assert.equal(
    calls[7].url.pathname,
    `/v1/stores/${store}/package-members`,
  );
  assert.deepEqual(calls[7].body, {
    id: memberId,
    package_id: memberPackageId,
    subject,
    access_end: { type: "never" },
  });
  assert.equal(calls[8].method, "DELETE");
  assert.equal(
    calls[8].url.pathname,
    `/v1/stores/${store}/packages/${memberPackageId}`,
  );
  assert.equal(calls[8].url.search, "?expected_updated_at=1");
  assert.equal(calls.length, 9);
  await assert.rejects(
    async () =>
      admin.eshop.packageMember.assign({
        store_id: store,
        id: "member",
        package_id: memberPackageId,
        subject,
        access_end: { type: "never" },
      }),
    TypeError,
  );
  await assert.rejects(
    async () =>
      admin.eshop.package.create({
        store_id: store,
        id: undefined,
        ...packageFields,
      }),
    TypeError,
  );
  await assert.rejects(
    async () =>
      admin.eshop.packageMember.find({ ...members, store_id: undefined }),
    TypeError,
  );
  assert.equal(calls.length, 9);
  for (const removed of [
    "add",
    "remove",
    "lookup",
    "execute",
    "join",
    "findCommands",
    "update",
    "delete",
  ])
    assert.equal(removed in admin.eshop.packageMember, false, removed);
  assert.equal("usage" in admin.eshop.package, false);
});
