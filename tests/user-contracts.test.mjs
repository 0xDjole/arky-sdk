import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import {
  accessToken,
  apiUrl as baseUrl,
  confirmedEmail,
  userRecord,
  idFactories,
  ids,
  storefrontIdentity,
  recordFetch,
  SessionStorage,
  sessionResult,
  signedInUser,
  signedInEmail,
  signedInStorage,
  storedSession,
  visitorToken,
} from "./helpers/arky-fixtures.mjs";

const tenantId = ids.tenant;
const userId = ids.user;

const identity = { user_id: userId, session_id: ids.session };
const profile = [{ id: ids.line, key: "name", type: "text", value: "Ana" }];

function client(storage = new SessionStorage()) {
  return createStorefront(storefrontIdentity, { ...idFactories, apiUrl: baseUrl, locale: "bs", visitorIdentity: identity, sessionStorage: storage });
}

test("same caller-picked visitor identities share a request without sending contact fields", async (context) => {
  const calls = recordFetch(context, () => sessionResult());
  const storefront = client();
  await Promise.all([storefront.user.identify(identity), storefront.user.identify(identity)]);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].body, identity);
  assert.equal(storefront.session.signed_in_with, null);
  assert.equal("captureEmail" in storefront.user, false);
});

test("the Admin user list reads the holders of one contact email or number as a Tito page with its cursor", async (context) => {
  const calls = recordFetch(context, (_call, count) => ({ items: [], cursor: count === 1 ? "holders:2" : null }));
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  assert.deepEqual(await admin.users.find({ tenant_id: tenantId, contact_email: "buyer@example.test", limit: 2 }), { items: [], cursor: "holders:2" });
  await admin.users.find({ tenant_id: tenantId, contact_email: "buyer@example.test", limit: 2, cursor: "holders:2" });
  await admin.users.find({ tenant_id: tenantId, contact_number: "+38761123456" });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.query]), [
    ["GET", `/v1/tenants/${tenantId}/users`, { contact_email: "buyer@example.test", limit: "2" }],
    ["GET", `/v1/tenants/${tenantId}/users`, { contact_email: "buyer@example.test", limit: "2", cursor: "holders:2" }],
    ["GET", `/v1/tenants/${tenantId}/users`, { contact_number: "+38761123456" }],
  ]);
});

test("the Admin user list sorts by name, filters on the users' blocks and on dates in their profile", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const filters = [
    { type: "date", key: "visit", operation: "greater_than_or_equal", value: "2026-01-01" },
    { type: "boolean", key: "vip", value: true },
  ];
  const born = [
    { type: "date", key: "birth_date", operation: "greater_than_or_equal", value: "1980-01-01" },
    { type: "date", key: "birth_date", operation: "less_than", value: "1990-01-01" },
  ];
  await admin.users.find({ tenant_id: tenantId, filters, sort_field: "name", sort_direction: "asc", limit: 20 });
  await admin.users.find({ tenant_id: tenantId, profile_filters: born });
  const archived = [{ type: "absent", key: "archived_at" }, { type: "text", key: "doctor", values: ["ana"] }];
  const unborn = [{ type: "absent", key: "birth_date" }];
  await admin.users.find({ tenant_id: tenantId, filters: archived, profile_filters: unborn });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.query]), [
    ["GET", `/v1/tenants/${tenantId}/users`, { filters: JSON.stringify(filters), sort_field: "name", sort_direction: "asc", limit: "20" }],
    ["GET", `/v1/tenants/${tenantId}/users`, { profile_filters: JSON.stringify(born) }],
    ["GET", `/v1/tenants/${tenantId}/users`, { filters: JSON.stringify(archived), profile_filters: JSON.stringify(unborn) }],
  ]);
});

test("Admin User commands send profile blocks, address changes and explicit staff merge versions", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "GET" && call.path.endsWith("/users") ? { items: [], cursor: null } : userRecord());
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  await admin.users.create({ tenant_id: tenantId, id: userId, profile, blocks: [] });
  await admin.users.find({ tenant_id: tenantId, verified: true, has_cart: true });
  await admin.users.update({ tenant_id: tenantId, id: userId, expected_updated_at: 2, profile, blocks: [], addresses: [{ id: ids.line, country: "BA", city: "Sarajevo" }], default_shipping_address_id: ids.line });
  await admin.users.erase({ tenant_id: tenantId, id: userId, expected_updated_at: 3 });
  await admin.users.merge({ tenant_id: tenantId, id: userId, target_user_id: ids.otherUser, expected_updated_at: 4 });
  const rows = [{ user_id: userId, profile, blocks: [] }];
  await admin.users.previewImport({ tenant_id: tenantId, rows });
  await admin.users.import({ tenant_id: tenantId, rows });
  await admin.users.findSessions({ tenant_id: tenantId, user_id: userId });
  await admin.users.revokeSession({ tenant_id: tenantId, user_id: userId, session_id: ids.session });
  await admin.users.revokeAllSessions({ tenant_id: tenantId, user_id: userId });
  assert.deepEqual(calls[0].body, { id: userId, profile, blocks: [] });
  assert.equal(calls[1].url.search, "?verified=true&has_cart=true");
  assert.deepEqual(calls[4].body, { target_user_id: ids.otherUser, expected_updated_at: 4 });
  assert.deepEqual(calls[5].body, { rows });
  assert.equal(calls[6].path, `/v1/tenants/${tenantId}/users/import`);
  for (const retired of ["archive", "resolveOrReserveEmail", "sendSignInCode"]) assert.equal(retired in admin.users, false);
  await assert.rejects(async () => admin.users.create({ tenant_id: tenantId, id: "user", profile, blocks: [] }), TypeError);
});

test("a user's categories go in on create and update as entries, and the list finds the users in any named category", async (context) => {
  const diabetes = "7e3a9c51-2d84-4b06-9f1e-5c8a2d6b0e73";
  const vip = "2c6e8a04-9b17-4d35-a0f2-6e1c3b5d7a98";
  const categories = [{ category_id: diabetes, fields: [{ type: "select_one", field_id: ids.line, option_key: "type_2" }] }];
  const calls = recordFetch(context, (call) => call.method === "GET" ? { items: [], cursor: null } : userRecord());
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  await admin.users.create({ tenant_id: tenantId, id: userId, profile, blocks: [], categories });
  await admin.users.update({ tenant_id: tenantId, id: userId, expected_updated_at: 2, categories: [] });
  await admin.users.find({ tenant_id: tenantId, category_ids: [diabetes, vip], query: "Ana", limit: 20 });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/tenants/${tenantId}/users`, {}, { id: userId, profile, blocks: [], categories }],
    ["PATCH", `/v1/tenants/${tenantId}/users/${userId}`, {}, { expected_updated_at: 2, categories: [] }],
    ["GET", `/v1/tenants/${tenantId}/users`, { category_ids: JSON.stringify([diabetes, vip]), query: "Ana", limit: "20" }, null],
  ]);
});

test("Admin contact commands add, change with PUT and remove a contact by its address, drop a link by its position and invite a contact", async (context) => {
  const address = { type: "phone", number: "+38761222333" };
  const invite = {
    id: ids.form,
    user_id: userId,
    sent_to: address,
    language: "bs",
    code: { failed_attempts: 0, outgoing_message_id: ids.submission, issued_at: 1, expires_at: 2 },
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
  };
  const calls = recordFetch(context, (call) => {
    if (call.method === "GET") return [invite];
    if (call.path.endsWith("/invites")) return invite;
    return userRecord(userId, { contacts: [{ type: "unconfirmed_phone", number: address.number, language: "bs", sms: { type: "off", at: 3 } }] });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const base = `/v1/tenants/${tenantId}/users/${userId}`;
  const contact = { type: "phone", number: "+38761222333", language: "bs" };
  const added = await admin.users.addContact({ tenant_id: tenantId, user_id: userId, expected_updated_at: 4, contact, sms: "on" });
  assert.equal(added.contacts[0].type, "unconfirmed_phone");
  await admin.users.addContact({ tenant_id: tenantId, user_id: userId, expected_updated_at: 5, contact: { type: "email", email: "ana@example.test", language: "bs" } });
  await admin.users.updateContact({ tenant_id: tenantId, user_id: userId, expected_updated_at: 6, address, language: "en" });
  await admin.users.removeContact({ tenant_id: tenantId, user_id: userId, expected_updated_at: 7, address });
  await admin.users.removeLink({ tenant_id: tenantId, user_id: userId, position: 0, expected_updated_at: 8 });
  assert.deepEqual(await admin.users.findInvites({ tenant_id: tenantId, user_id: userId }), [invite]);
  assert.deepEqual(await admin.users.inviteContact({ tenant_id: tenantId, user_id: userId, id: ids.form, address }), invite);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", `${base}/contacts`, { expected_updated_at: 4, contact, sms: "on" }],
    ["POST", `${base}/contacts`, { expected_updated_at: 5, contact: { type: "email", email: "ana@example.test", language: "bs" }, sms: null }],
    ["PUT", `${base}/contacts`, { expected_updated_at: 6, address, language: "en" }],
    ["POST", `${base}/contacts/remove`, { expected_updated_at: 7, address }],
    ["DELETE", `${base}/links/0`, null],
    ["GET", `${base}/invites`, null],
    ["POST", `${base}/invites`, { id: ids.form, address }],
  ]);
  assert.equal(calls[4].url.search, "?expected_updated_at=8");
  for (const position of [-1, 1.5]) {
    assert.throws(() => admin.users.removeLink({ tenant_id: tenantId, user_id: userId, position, expected_updated_at: 8 }), {
      name: "TypeError",
      message: "A link's position is its index in the user's links list",
    });
  }
  await assert.rejects(async () => admin.users.inviteContact({ tenant_id: tenantId, user_id: userId, id: "invite", address }), {
    name: "TypeError",
    message: "The user invite id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 7);
  for (const removed of ["findLogins", "createLogin", "updateLogin", "deleteLogin", "inviteLogin"]) assert.equal(removed in admin.users, false, removed);
});

test("code requests retain caller ID, language and bot proof without claiming an address", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("/identify") ? sessionResult() : { user: userRecord(), session: { id: ids.session, user_id: userId }, code: { issued_at: 1, expires_at: 2 } });
  const storefront = client();
  await storefront.user.requestCode({ id: ids.form, contact: { type: "email", email: "reader@example.test", language: "en" } });
  await storefront.user.requestCode({ id: ids.line, contact: { type: "phone", number: "+38761222333", language: "bs" } });
  assert.deepEqual(calls[0].body, identity);
  assert.deepEqual(calls[1].body, { id: ids.form, contact: { type: "email", email: "reader@example.test", language: "en" } });
  assert.deepEqual(calls[2].body, { id: ids.line, contact: { type: "phone", number: "+38761222333", language: "bs" } });
  assert.equal(calls[1].headers.get("x-arky-locale"), "bs");
  assert.equal(storefront.session.signed_in_with, null);
  await assert.rejects(storefront.user.requestCode({ id: "bad", contact: { type: "email", email: "reader@example.test", language: "en" } }), TypeError);
});

test("retrying a lost code response keeps the same exact request and active Visitor identity", async (context) => {
  let sends = 0;
  const result = { user: userRecord(), session: { id: ids.session, user_id: userId }, code: { issued_at: 1, expires_at: 2 } };
  const calls = recordFetch(context, (call) => {
    if (call.path.endsWith("/identify")) return sessionResult();
    if (++sends === 1) throw new TypeError("Code response was lost");
    return result;
  });
  const storage = new SessionStorage();
  const storefront = client(storage);
  await storefront.user.identify(identity);
  const retained = [...storage.values];
  const request = { id: ids.form, contact: { type: "email", email: "reader@example.test", language: "en" } };

  await assert.rejects(storefront.user.requestCode(request), /Code response was lost/);
  assert.deepEqual([...storage.values], retained);
  assert.deepEqual(await storefront.user.requestCode(request), result);
  const codeCalls = calls.filter((call) => call.path === "/v1/storefront/user/request-code");
  assert.deepEqual(codeCalls.map((call) => [call.method, call.body, call.headers.get("authorization"), call.headers.get("x-arky-locale")]), [
    ["POST", { id: ids.form, contact: { type: "email", email: "reader@example.test", language: "en" } }, `Bearer ${visitorToken}`, "bs"],
    ["POST", { id: ids.form, contact: { type: "email", email: "reader@example.test", language: "en" } }, `Bearer ${visitorToken}`, "bs"],
  ]);
  assert.equal(storefront.session.id, ids.session);
  assert.equal(storefront.session.signed_in_with, null);
});

test("a code answer for another session is refused without changing stored identity", async (context) => {
  recordFetch(context, (call) => call.path.endsWith("/identify") ? sessionResult() : { user: userRecord(), session: { id: ids.otherSession, user_id: userId }, code: { issued_at: 1, expires_at: 2 } });
  const storage = new SessionStorage();
  const storefront = client(storage);
  await storefront.user.identify(identity);
  const retained = [...storage.values];
  await assert.rejects(storefront.user.requestCode({ id: ids.form, contact: { type: "email", email: "reader@example.test", language: "en" } }), /does not match/);
  assert.deepEqual([...storage.values], retained);
});

test("an unconfigured contact notice surfaces the server refusal and retains the signed-in session", async (context) => {
  const calls = recordFetch(context, () => new Response(JSON.stringify({ status_code: 409, message: "This tenant can't send sign-in change notices yet", error: "USER_SIGN_IN.UNAVAILABLE" }), { status: 409, headers: { "content-type": "application/json" } }));
  const storefront = client(signedInStorage());
  const before = structuredClone(storefront.session);
  const address = { type: "email", email: "added@example.test" };
  await assert.rejects(storefront.user.verifyContact({ address, code: "123456" }), /sign-in change notices/);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", "/v1/storefront/user/me/contacts/verify", { address, code: "123456" }],
  ]);
  assert.deepEqual(storefront.session, before);
});

test("a confirmed new email keeps current credentials and persists the returned user", async (context) => {
  const address = { type: "email", email: "added@example.test" };
  const user = signedInUser(userId, signedInEmail, {
    name: { first_name: "Ana", last_name: "Kovač" },
    contacts: [confirmedEmail(), confirmedEmail("added@example.test")],
    updated_at: 1_700_000_000_002,
  });
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  assert.deepEqual(before.signed_in_with, { type: "email", email: signedInEmail });
  const retainedCredentials = JSON.parse(storage.initial).session;
  const calls = recordFetch(context, () => ({
    user,
    session: { id: before.id, user_id: before.user.id, tenant_id: tenantId },
  }));
  const result = await storefront.user.verifyContact({ address, code: "123456" });
  assert.deepEqual(result.user, user);
  assert.equal("logins" in result, false);
  assert.deepEqual(calls[0].body, { address, code: "123456" });
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${accessToken}`);
  assert.equal(storefront.session.id, before.id);
  assert.deepEqual(storefront.session.user, user);
  assert.deepEqual(storefront.session.signed_in_with, before.signed_in_with, "the session keeps the address it signed in with");
  const after = JSON.parse([...storage.values.values()][0]);
  assert.deepEqual(after.session, retainedCredentials);
  assert.equal("login" in after, false);
  const reloaded = client(storage);
  assert.deepEqual(reloaded.session.user, user);
  assert.equal(reloaded.session.id, before.id);
});

test("a contact answer for another session cannot replace the current user session", async (context) => {
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  const retained = storage.initial;
  recordFetch(context, () => ({
    user: userRecord(userId, { name: { first_name: "Ana", last_name: "Kovač" } }),
    session: { id: ids.otherSession, user_id: userId, tenant_id: tenantId },
  }));
  await assert.rejects(
    storefront.user.verifyContact({ address: { type: "email", email: "added@example.test" }, code: "123456" }),
    /does not match the active user session/,
  );
  assert.deepEqual(storefront.session, before);
  assert.equal(storage.initial, retained);
  assert.equal(storage.values.size, 0);
});

for (const method of ["getMe", "updateMe"]) {
  test(`${method} retains credentials and reloads the current returned profile`, async (context) => {
    const storage = signedInStorage();
    const storefront = client(storage);
    const before = structuredClone(storefront.session);
    const credentials = JSON.parse(storage.initial).session;
    const user = signedInUser(userId, signedInEmail, { profile });
    const response = { user, session: { id: before.id, user_id: userId, tenant_id: tenantId } };
    const calls = recordFetch(context, () => response);
    const result = method === "getMe"
      ? await storefront.user.getMe()
      : await storefront.user.updateMe({ profile, expected_updated_at: 2 });
    assert.deepEqual(result, response);
    assert.equal(calls[0].method, method === "getMe" ? "GET" : "PATCH");
    assert.deepEqual(storefront.session.user.profile, profile);
    assert.deepEqual(JSON.parse([...storage.values.values()][0]).session, credentials);
    const reloaded = client(storage);
    assert.equal(reloaded.session.id, before.id);
    assert.deepEqual(reloaded.session.user.profile, profile);
  });

  test(`${method} returns a late response without replacing current cached identity`, async (context) => {
    const storage = signedInStorage();
    const storefront = client(storage);
    const before = structuredClone(storefront.session);
    recordFetch(context, () => ({
      user: userRecord(userId, { profile }),
      session: { id: ids.otherSession, user_id: userId, tenant_id: tenantId },
    }));
    const result = await (method === "getMe" ? storefront.user.getMe() : storefront.user.updateMe({ profile, expected_updated_at: 2 }));
    assert.deepEqual(result.user.profile, profile);
    assert.equal(result.session.id, ids.otherSession);
    assert.deepEqual(storefront.session, before);
    assert.equal(storage.values.size, 0);
  });
}

test("a signed-in user changes the language of a contact by its address with the version they read", async (context) => {
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  const address = { type: "email", email: signedInEmail };
  const changed = { ...before.user, contacts: [confirmedEmail(signedInEmail, "bs")], updated_at: 1_700_000_000_003 };
  const response = { user: changed, session: { id: before.id, user_id: userId, tenant_id: tenantId } };
  const calls = recordFetch(context, () => response);
  assert.deepEqual(await storefront.user.updateContact({ expected_updated_at: 2, address, language: "bs" }), response);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["PATCH", "/v1/storefront/user/me/contacts", { expected_updated_at: 2, address, language: "bs" }],
  ]);
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${accessToken}`);
  assert.deepEqual(storefront.session.user.contacts, [confirmedEmail(signedInEmail, "bs")]);
  await storefront.user.updateMe({ expected_updated_at: 3, profile });
  assert.equal("language" in calls[1].body, false, "a language lives on its contact, not on the profile");
});

test("a signed-in user adds and removes contacts of their own, and removing the tenant link ends this browser's session", async (context) => {
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  const contact = { type: "phone", number: "+38761222333", language: "bs" };
  const address = { type: "phone", number: "+38761222333" };
  const answer = { user: before.user, session: { id: before.id, user_id: userId, tenant_id: tenantId } };
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? { removed: true } : answer);
  await storefront.user.addContact({ expected_updated_at: 3, contact, sms: "on" });
  await storefront.user.addContact({ expected_updated_at: 4, contact: { type: "email", email: "second@example.test", language: "bs" } });
  await storefront.user.removeContact({ expected_updated_at: 5, address });
  assert.equal(storefront.session.id, before.id);
  assert.deepEqual(await storefront.user.removeLink(), { removed: true });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", "/v1/storefront/user/me/contacts", { expected_updated_at: 3, contact, sms: "on" }],
    ["POST", "/v1/storefront/user/me/contacts", { expected_updated_at: 4, contact: { type: "email", email: "second@example.test", language: "bs" }, sms: null }],
    ["POST", "/v1/storefront/user/me/contacts/remove", { expected_updated_at: 5, address }],
    ["DELETE", "/v1/storefront/user/me/link", null],
  ]);
  for (const call of calls) assert.equal(call.headers.get("authorization"), `Bearer ${accessToken}`);
  assert.equal(storefront.session, null, "removing the tenant link ends the session that removed it");
  assert.equal(storage.values.size, 0);
  for (const removed of ["addLogin", "updateLogin", "deleteLogin", "verifyNewLogin"]) assert.equal(removed in storefront.user, false, removed);
});

test("a visitor has no tenant link to remove, so removeLink refuses before any request", async (context) => {
  const calls = recordFetch(context, () => ({ removed: true }));
  const storefront = client(new SessionStorage(storedSession()));
  await assert.rejects(storefront.user.removeLink(), (error) => error.code === "no_session");
  assert.equal(calls.length, 0);
  assert.equal(storefront.session.type, "visitor");
});

test("a signed-in user unsubscribes and resubscribes a contact by its address and keeps the session", async (context) => {
  const storage = signedInStorage();
  const storefront = client(storage);
  const before = structuredClone(storefront.session);
  const address = { type: "email", email: signedInEmail };
  const answer = { user: before.user, session: { id: before.id, user_id: userId, tenant_id: tenantId } };
  const calls = recordFetch(context, () => answer);
  assert.deepEqual(await storefront.user.unsubscribe({ address }), answer);
  assert.deepEqual(await storefront.user.resubscribe({ address }), answer);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", "/v1/storefront/user/me/contacts/unsubscribe", { address }],
    ["POST", "/v1/storefront/user/me/contacts/resubscribe", { address }],
  ]);
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), `Bearer ${accessToken}`);
    assert.equal(call.headers.get("x-arky-tenant-id"), storefrontIdentity.tenantId);
    assert.equal(call.headers.get("x-arky-sales-channel-id"), storefrontIdentity.salesChannelId);
  }
  assert.deepEqual(storefront.session, before);
  const store = initialize(storefrontIdentity, { ...idFactories, apiUrl: baseUrl, locale: "bs", visitorIdentity: identity, sessionStorage: signedInStorage() });
  assert.equal(typeof store.user.unsubscribe, "function");
});
