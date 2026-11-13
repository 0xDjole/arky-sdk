import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { errorResponse, ids, recordFetch } from "./helpers/arky-fixtures.mjs";

const storeId = "3e7a1c95-4b28-4d60-9f13-8c2e5a7d0b46";
const loginId = "5d9b3f71-2c46-4e08-a1b7-6f3d8e0c2a95";
const lineId = "8c2e6a14-7d39-4b05-9e1f-3a5c7b9d1f28";
const sender = { type: "name", name: "Clinic" };

function admin() {
  return createAdmin({ apiUrl: "https://phone.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
}

test("a store's own and its network's Twilio logins carry the SMS sender, and later changes name the login's version", async (context) => {
  const login = { id: loginId, store_id: storeId, type: { type: "twilio", account_sid: `AC${"1".repeat(32)}`, sms_sender: sender }, status: "active", created_at: 1, updated_at: 2 };
  const calls = recordFetch(context, () => login);
  const api = admin().store.provider;
  await api.connectTwilio({ store_id: storeId, id: loginId, account_sid: `AC${"1".repeat(32)}`, auth_token: "twilio-token", sms_sender: sender });
  await api.connectNetworkTwilio({ store_id: storeId, id: loginId, sms_sender: { type: "number", number: "+38733000000" } });
  await api.replaceTwilioAuthToken({ store_id: storeId, id: loginId, expected_updated_at: 2, auth_token: "twilio-next" });
  await api.setSmsSender({ store_id: storeId, id: loginId, expected_updated_at: 3, sms_sender: sender });
  await api.setStatus({ store_id: storeId, id: loginId, expected_updated_at: 4, status: "disabled" });
  const base = `/v1/stores/${storeId}/store-providers`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `${base}/twilio`, { id: loginId, account_sid: `AC${"1".repeat(32)}`, auth_token: "twilio-token", sms_sender: sender }],
    ["POST", `${base}/network-twilio`, { id: loginId, sms_sender: { type: "number", number: "+38733000000" } }],
    ["POST", `${base}/twilio/${loginId}/replace-auth-token`, { expected_updated_at: 2, auth_token: "twilio-next" }],
    ["PUT", `${base}/${loginId}/sms-sender`, { expected_updated_at: 3, sms_sender: sender }],
    ["PUT", `${base}/${loginId}/status`, { expected_updated_at: 4, status: "disabled" }],
  ]);
  assert.equal("network_provider_id" in calls[1].body, false);
  await assert.rejects(async () => api.connectNetworkTwilio({ store_id: storeId, id: "twilio", sms_sender: sender }), TypeError);
  await assert.rejects(async () => api.connectTwilio({ store_id: storeId, id: "twilio", account_sid: "AC", auth_token: "x", sms_sender: sender }), TypeError);
  assert.equal(calls.length, 5);
});

test("a test store connects its Twilio and ElevenLabs twins keylessly, a store its own ElevenLabs with key and region, and sets ElevenLabs up again with its version", async (context) => {
  const login = { id: loginId, store_id: storeId, type: { type: "arky_eleven_labs", region: "global", setup: { type: "waiting" } }, status: "active", created_at: 1, updated_at: 2 };
  const calls = recordFetch(context, () => login);
  const api = admin().store.provider;
  await api.connectArkyTwilio({ store_id: storeId, id: loginId, sms_sender: sender });
  await api.connectElevenLabs({ store_id: storeId, id: loginId, api_key: "sk_elevenlabs", region: "eu" });
  assert.deepEqual(await api.connectArkyElevenLabs({ store_id: storeId, id: loginId }), login);
  await api.setUpElevenLabsAgain({ store_id: storeId, id: loginId, expected_updated_at: 2 });
  const base = `/v1/stores/${storeId}/store-providers`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `${base}/arky-twilio`, { id: loginId, sms_sender: sender }],
    ["POST", `${base}/elevenlabs`, { id: loginId, api_key: "sk_elevenlabs", region: "eu" }],
    ["POST", `${base}/arky-elevenlabs`, { id: loginId }],
    ["POST", `${base}/${loginId}/elevenlabs-setup`, { expected_updated_at: 2 }],
  ]);
  await assert.rejects(async () => api.connectArkyTwilio({ store_id: storeId, id: "twin", sms_sender: sender }), TypeError);
  await assert.rejects(async () => api.connectElevenLabs({ store_id: storeId, id: "own", api_key: "k", region: "eu" }), TypeError);
  await assert.rejects(async () => api.connectArkyElevenLabs({ store_id: storeId, id: "twin" }), TypeError);
  assert.equal(calls.length, 4);
});

test("members who save support flows list the store's own logins and its network's by id, type and status", async (context) => {
  const own = { id: loginId, type: "eleven_labs", status: "active" };
  const network = { id: ids.picked, type: "eleven_labs", status: "disabled" };
  const calls = recordFetch(context, (call) => ({ items: [call.path.endsWith("/network-logins") ? network : own], cursor: null }));
  const api = admin().store.provider;
  assert.deepEqual(await api.findLogins({ store_id: storeId, limit: 20, cursor: "next" }), { items: [own], cursor: null });
  assert.deepEqual(await api.findLogins({ store_id: storeId }), { items: [own], cursor: null });
  assert.deepEqual(await api.findNetworkLogins({ store_id: storeId }), { items: [network], cursor: null });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `/v1/stores/${storeId}/store-providers/logins`, { limit: "20", cursor: "next" }, null],
    ["GET", `/v1/stores/${storeId}/store-providers/logins`, {}, null],
    ["GET", `/v1/stores/${storeId}/network-logins`, {}, null],
  ]);
});

test("a network Twilio login the network doesn't have is refused once with the Server's code", async (context) => {
  const calls = recordFetch(context, () => errorResponse(409, "STORE_PROVIDER.NETWORK_TWILIO_MISSING", "The network has no active Twilio login"));
  await assert.rejects(admin().store.provider.connectNetworkTwilio({ store_id: storeId, id: loginId, sms_sender: sender }), (error) => {
    assert.equal(error.statusCode, 409);
    assert.equal(error.code, "STORE_PROVIDER.NETWORK_TWILIO_MISSING");
    return true;
  });
  assert.equal(calls.length, 1);
});

test("a phone line is made on a login, set up again and deleted with its version", async (context) => {
  const line = { id: lineId, store_id: storeId, login: { type: "store", store_provider_id: loginId }, number: "+38733000000", setup: { type: "waiting" }, created_at: 1, updated_at: 2 };
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? { deleted: true } : call.method === "GET" && call.path.endsWith("/phone-numbers") ? { items: [line], cursor: null } : line);
  const api = admin().store.phoneNumber;
  assert.deepEqual(await api.find({ store_id: storeId, limit: 10 }), { items: [line], cursor: null });
  assert.deepEqual(await api.create({ store_id: storeId, id: lineId, login: { type: "store", store_provider_id: loginId }, number: "+38733000000" }), line);
  await api.create({ store_id: storeId, id: lineId, login: { type: "network", network_provider_id: ids.picked }, number: "+38733000001" });
  assert.deepEqual(await api.get({ store_id: storeId, id: lineId }), line);
  assert.deepEqual(await api.setUpAgain({ store_id: storeId, id: lineId, expected_updated_at: 2 }), line);
  assert.deepEqual(await api.delete({ store_id: storeId, id: lineId, expected_updated_at: 3 }), { deleted: true });
  const base = `/v1/stores/${storeId}/phone-numbers`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", base, { limit: "10" }, null],
    ["POST", base, {}, { id: lineId, login: { type: "store", store_provider_id: loginId }, number: "+38733000000" }],
    ["POST", base, {}, { id: lineId, login: { type: "network", network_provider_id: ids.picked }, number: "+38733000001" }],
    ["GET", `${base}/${lineId}`, {}, null],
    ["POST", `${base}/${lineId}/setup`, {}, { expected_updated_at: 2 }],
    ["DELETE", `${base}/${lineId}`, { expected_updated_at: "3" }, null],
  ]);
  await assert.rejects(async () => api.create({ store_id: storeId, id: "line", login: { type: "store", store_provider_id: loginId }, number: "+38733000000" }), TypeError);
  assert.equal(calls.length, 6);
});

test("a phone line a flow or a role still names is refused with the holder the Server names", async (context) => {
  const refusal = errorResponse(409, "REFERENCE.STILL_REFERENCED", "Phone line is used by support_flow", {
    validation_errors: [{ field: "holder_type", error: "support_flow" }, { field: "holder_id", error: ids.form }],
  });
  const calls = recordFetch(context, () => refusal);
  await assert.rejects(admin().store.phoneNumber.delete({ store_id: storeId, id: lineId, expected_updated_at: 3 }), (error) => {
    assert.equal(error.statusCode, 409);
    assert.equal(error.code, "REFERENCE.STILL_REFERENCED");
    assert.deepEqual(error.validationErrors, [{ field: "holder_type", error: "support_flow" }, { field: "holder_id", error: ids.form }]);
    return true;
  });
  assert.equal(calls.length, 1);
});
