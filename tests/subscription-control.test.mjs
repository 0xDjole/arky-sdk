import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const store = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
const otherStore = "e5f1a9c3-7b24-4d68-a0e2-9c4b7d1f3e85";
const subscriptionId = "0d4b8c62-3a75-4f0e-9a52-3e2bb2a3d5f1";
const methodId = "4c2e7b19-6f3a-4d8e-b1c5-9a0d2e7f3b64";
const planId = "7e3a9c51-2b84-4d6f-a0c7-5e1d3b9f2a68";
const catalogId = "e4c8a2f6-1b73-4d95-a0e7-5f2c9b6d3a18";

function subscriptions() {
  return createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.subscription;
}

const calendar = {
  subscription_id: subscriptionId,
  expected_updated_at: 1_700_000_000_000,
  first_occurrence: 3,
  end: { type: "before", occurrence_index: 4 },
  type: "skip_next",
  calendars: [{ effective_from_occurrence: 3, schedule: { type: "recurring", timezone: "Europe/Berlin", anchor: 1_690_000_000_000, first_period_offset: 4 } }],
  reason: "Customer is away next month",
};
const funding = {
  subscription_id: subscriptionId,
  expected_updated_at: 1_700_000_000_000,
  first_occurrence: 3,
  end: { type: "from_here_onward" },
  payment_method_id: methodId,
  reason: "Customer replaced the saved card",
};

test("pausing or cancelling sends one command with the subscription version and no hidden identity", async (context) => {
  const result = { id: subscriptionId, status: { type: "active" } };
  const calls = recordFetch(context, () => result);
  const api = subscriptions();
  for (const type of [{ type: "pause", reason: "Customer is travelling" }, { type: "cancel", reason: "Customer asked to stop" }]) {
    const params = { store_id: store, id: subscriptionId, expected_updated_at: 1_700_000_000_000, type };
    const before = structuredClone(params);
    assert.deepEqual(await api.control(params), result);
    assert.deepEqual(await api.control(params), result);
    assert.deepEqual(params, before);
    assert.deepEqual(calls.at(-1).body, calls.at(-2).body);
    assert.deepEqual(calls.at(-1).body, { id: subscriptionId, expected_updated_at: 1_700_000_000_000, type });
  }
  await assert.rejects(async () => api.control({ id: subscriptionId, expected_updated_at: 1, type: { type: "pause", reason: "Travel" } }), TypeError);
  assert.equal(calls.length, 4);
  assert.ok(calls.every((call) => call.method === "POST" && call.path === `/v1/stores/${store}/subscriptions/commands` && call.url.search === ""));
});

test("calendar, payment method and plan changes are reviewed and accepted on the named store with the same body", async (context) => {
  const calls = recordFetch(context, () => ({ subscription: { id: subscriptionId }, created: [], withdrawn: [], timeline: [] }));
  const api = subscriptions();
  const plan = { subscription_id: subscriptionId, expected_updated_at: 1_700_000_000_000, to_subscription_plan_id: planId, rentals: [], reason: "Upgrade" };
  const before = structuredClone({ calendar, funding, plan });
  await api.calendarOptions({ store_id: store, id: subscriptionId });
  await api.reviewCalendarChange({ store_id: store, ...calendar });
  await api.changeCalendar({ store_id: store, ...calendar });
  await api.reviewPaymentMethodChange({ store_id: otherStore, ...funding });
  await api.changePaymentMethod({ store_id: otherStore, ...funding });
  await api.reviewPlanChange({ store_id: store, ...plan });
  await api.changePlan({ store_id: store, ...plan, catalog_id: catalogId });
  assert.deepEqual({ calendar, funding, plan }, before);
  const base = `/v1/stores/${store}/subscriptions`;
  const other = `/v1/stores/${otherStore}/subscriptions`;
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", `${base}/calendar/options`, { subscription_id: subscriptionId }],
    ["POST", `${base}/calendar/review`, calendar],
    ["POST", `${base}/calendar/accept`, calendar],
    ["POST", `${other}/funding/review`, funding],
    ["POST", `${other}/funding/accept`, funding],
    ["POST", `${base}/plan/review`, plan],
    ["POST", `${base}/plan/accept`, { ...plan, catalog_id: catalogId }],
  ]);
  assert.equal("catalog_id" in calls[5].body, false);
  await assert.rejects(async () => api.reviewPaymentMethodChange({ ...funding }), TypeError);
  assert.equal(calls.length, 7);
  assert.ok(calls.every((call) => call.url.search === "" && !("store_id" in call.body)));
});

test("a buyer controls and changes their own subscription through storefront routes and gets their own view back", async (context) => {
  const self = { id: subscriptionId, status: { type: "paused" } };
  const calls = recordFetch(context, (call) => call.path.endsWith("/commands") ? self : { subscription: self, created: [], withdrawn: [], timeline: [] });
  const api = createStorefront(publishableKey, { apiUrl, sessionStorage: visitorStorage() }).eshop.subscription;
  const plan = { subscription_id: subscriptionId, expected_updated_at: 1_700_000_000_000, to_subscription_plan_id: planId, rentals: [], reason: "Upgrade" };
  assert.deepEqual(await api.control({ id: subscriptionId, expected_updated_at: 5, type: { type: "pause", reason: "Travel" } }), self);
  await api.calendarOptions({ id: subscriptionId });
  await api.reviewCalendarChange(calendar);
  await api.changePaymentMethod(funding);
  await api.reviewPlanChange(plan);
  await api.changePlan({ ...plan, catalog_id: catalogId });
  const base = "/v1/storefront/subscriptions";
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", `${base}/commands`, { id: subscriptionId, expected_updated_at: 5, type: { type: "pause", reason: "Travel" } }],
    ["POST", `${base}/calendar/options`, { subscription_id: subscriptionId }],
    ["POST", `${base}/calendar/review`, calendar],
    ["POST", `${base}/funding/accept`, funding],
    ["POST", `${base}/plan/review`, plan],
    ["POST", `${base}/plan/accept`, { ...plan, catalog_id: catalogId }],
  ]);
  assert.equal("catalog_id" in calls[4].body, false);
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
    assert.equal("store_id" in call.body, false);
  }
});
