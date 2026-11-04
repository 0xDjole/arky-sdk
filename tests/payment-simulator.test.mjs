import assert from "node:assert/strict";
import test from "node:test";

import { simulatePayment as adminSimulatePayment } from "../dist/admin.js";
import { ArkyError, MonriCheckoutError, isSimulatedPayment, mountCheckoutAction, mountPaymentMethodSetup, simulatePayment } from "../dist/storefront.js";
import { simulatePayment as rootSimulatePayment, isSimulatedPayment as rootIsSimulatedPayment } from "../dist/index.js";
import { ids, installGlobal, jsonResponse, recordFetch } from "./helpers/arky-fixtures.mjs";

const api_url = "https://api.example.test";
const simulated = { type: "simulator", api_url };
const provider = { type: "provider" };
const stripe = { type: "stripe_embedded_checkout", publishable_key: "pk_test_arky_store", client_secret: "cs_arky_7_secret_random7", expires_at: 1_900_000_000_000, runs_on: simulated };
const monri = { type: "monri_components", environment: "test", authenticity_token: "arky-authenticity", client_secret: "monri_session_secret_randommonri", save_card: false, runs_on: simulated };
const setup = {
  method: { type: { type: "stripe", setup: { type: "dedicated" }, status: { type: "requested" } } },
  client_secret: "seti_arky_3_secret_randomseti",
  publishable_key: "pk_test_arky_store",
  runs_on: simulated,
};
const plan = { type: "stripe_embedded_checkout", publishable_key: "pk_test_arky", client_secret: "cs_plan_secret_randomplan", expires_at: 1_900_000_000_000, runs_on: simulated };
const billing = { full_name: "Test Buyer", address: "Test Street 1", city: "Sarajevo", zip: "71000", phone: "+38761123456", country: "BA", email: "buyer@example.test" };
const simulatorPayments = `${api_url}/v1/simulator/payments`;

class FakeElement {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.listeners = [];
    this.isConnected = true;
    this.textContent = "";
    this.parent = null;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  appendChild(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  remove() {
    this.parent.children = this.parent.children.filter((child) => child !== this);
    this.parent = null;
  }

  addEventListener(type, listener) {
    assert.equal(type, "click");
    this.listeners.push(listener);
  }

  click() {
    if (this.disabled) return;
    for (const listener of this.listeners) listener();
  }
}

function fakePage(context) {
  const target = new FakeElement("div");
  const document = {
    querySelector: (selector) => (selector === "#payment" ? target : null),
    createElement(tag) {
      assert.notEqual(tag, "script", "A simulated payment must not load a provider's script");
      return new FakeElement(tag);
    },
  };
  installGlobal(context, "document", document);
  return target;
}

function flatten(element) {
  return [element, ...element.children.flatMap(flatten)];
}

function outcomeButtons(target) {
  return Object.fromEntries(
    flatten(target)
      .filter((element) => element.attributes["data-arky-simulator-outcome"])
      .map((element) => [element.attributes["data-arky-simulator-outcome"], element]),
  );
}

function panelAlert(target) {
  return flatten(target).find((element) => element.attributes.role === "alert");
}

async function until(condition) {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    if (condition()) return;
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.fail("The awaited change never happened");
}

function accepted() {
  return new Response(null, { status: 204 });
}

test("isSimulatedPayment reads runs_on on a checkout action, a card setup start and a store plan action", () => {
  for (const value of [stripe, monri, setup, plan]) assert.equal(isSimulatedPayment(value), true);
  for (const value of [stripe, monri, setup, plan]) assert.equal(isSimulatedPayment({ ...value, runs_on: provider }), false);
  assert.equal(isSimulatedPayment({ type: "none" }), false);
  assert.equal(rootIsSimulatedPayment(stripe), true);
});

test("simulatePayment posts the client secret and outcome to the address the payment's own answer names, with no credentials", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (input, init) => {
    calls.push({ url: String(input), init });
    return accepted();
  });
  assert.equal(await simulatePayment({ simulation: { type: "stripe_checkout", action: stripe, outcome: "complete" } }), undefined);
  await simulatePayment({ simulation: { type: "stripe_checkout", action: stripe, outcome: "decline" } });
  await simulatePayment({ simulation: { type: "stripe_checkout", action: plan, outcome: "expire" } });
  await rootSimulatePayment({ simulation: { type: "monri", action: monri, outcome: "decline" } });
  await adminSimulatePayment({ simulation: { type: "card_setup", setup, outcome: "cancel" } });
  assert.deepEqual(calls.map(({ url, init }) => [url, init.method, JSON.parse(init.body)]), [
    [simulatorPayments, "POST", { type: "stripe_checkout", client_secret: stripe.client_secret, outcome: "complete" }],
    [simulatorPayments, "POST", { type: "stripe_checkout", client_secret: stripe.client_secret, outcome: "decline" }],
    [simulatorPayments, "POST", { type: "stripe_checkout", client_secret: plan.client_secret, outcome: "expire" }],
    [simulatorPayments, "POST", { type: "monri", client_secret: monri.client_secret, outcome: "decline" }],
    [simulatorPayments, "POST", { type: "card_setup", client_secret: setup.client_secret, outcome: "cancel" }],
  ]);
  for (const { init } of calls) {
    assert.equal(init.credentials, "omit");
    assert.equal(init.redirect, "error");
    assert.equal(new Headers(init.headers).get("content-type"), "application/json");
    assert.equal(new Headers(init.headers).has("authorization"), false);
    assert.ok(init.signal instanceof AbortSignal);
  }
});

test("simulatePayment refuses a real payment, an outcome that value doesn't offer and a setup with no secret before anything is sent", async (context) => {
  const calls = recordFetch(context, accepted);
  const refused = [
    { type: "stripe_checkout", action: { ...stripe, runs_on: provider }, outcome: "complete" },
    { type: "monri", action: { ...monri, runs_on: provider }, outcome: "complete" },
    { type: "card_setup", setup: { ...setup, runs_on: provider }, outcome: "complete" },
    { type: "stripe_checkout", action: { ...stripe, runs_on: undefined }, outcome: "complete" },
    { type: "stripe_checkout", action: { ...stripe, runs_on: { type: "simulator" } }, outcome: "complete" },
    { type: "stripe_checkout", action: stripe, outcome: "cancel" },
    { type: "monri", action: monri, outcome: "expire" },
    { type: "card_setup", setup, outcome: "expire" },
    { type: "card_setup", setup: { ...setup, client_secret: null }, outcome: "complete" },
  ];
  for (const simulation of refused) await assert.rejects(simulatePayment({ simulation }), TypeError);
  assert.equal(calls.length, 0);
});

test("simulatePayment answers not_confirmed for any answer but 204 and for no answer, and a caller's own abort stays an abort", async (context) => {
  let reply = () => jsonResponse({ error: "SIMULATOR.PAYMENT_FINISHED" }, 409);
  const calls = recordFetch(context, () => reply());
  const simulation = { type: "stripe_checkout", action: stripe, outcome: "expire" };
  await assert.rejects(simulatePayment({ simulation }), (error) => {
    assert.ok(error instanceof ArkyError);
    assert.equal(error.code, "not_confirmed");
    assert.match(error.message, /didn't confirm the expire outcome \(status 409\)/);
    return true;
  });
  reply = () => {
    throw new TypeError("fetch failed");
  };
  await assert.rejects(simulatePayment({ simulation }), (error) => {
    assert.ok(error instanceof ArkyError);
    assert.equal(error.code, "not_confirmed");
    assert.match(error.message, /no answer/);
    return true;
  });
  assert.equal(calls.length, 2);
  const abort = new AbortController();
  const aborted = new DOMException("The caller stopped waiting", "AbortError");
  reply = () => {
    abort.abort(aborted);
    throw aborted;
  };
  await assert.rejects(simulatePayment({ simulation }, { signal: abort.signal }), (error) => error === aborted);
});

test("a simulated Stripe action mounts Arky's panel with no Stripe.js, and a click posts its outcome and then runs onComplete", async (context) => {
  const target = fakePage(context);
  const calls = recordFetch(context, accepted);
  let completed = 0;
  const mounted = await mountCheckoutAction({ action: stripe, element: "#payment", onComplete: () => { completed += 1; } });
  assert.equal(mounted.type, "simulator");
  assert.equal("checkout" in mounted, false);
  const buttons = outcomeButtons(target);
  assert.deepEqual(Object.keys(buttons), ["complete", "decline", "expire"]);
  for (const button of Object.values(buttons)) assert.equal(button.type, "button");
  const panelText = flatten(target).map((element) => element.textContent).join(" ");
  assert.match(panelText, /Test payment/);
  assert.match(panelText, /No real money moves/);
  assert.equal(calls.length, 0);

  buttons.decline.click();
  assert.equal(buttons.complete.disabled, true);
  await until(() => completed === 1);
  assert.equal(buttons.complete.disabled, false, "A declined card leaves the page open for another try");
  assert.deepEqual(calls.map((call) => [call.href, call.body.outcome]), [[simulatorPayments, "decline"]]);

  buttons.complete.click();
  await until(() => completed === 2);
  assert.deepEqual(calls.map((call) => call.body), [
    { type: "stripe_checkout", client_secret: stripe.client_secret, outcome: "decline" },
    { type: "stripe_checkout", client_secret: stripe.client_secret, outcome: "complete" },
  ]);
  assert.equal(buttons.complete.disabled, true, "A finished payment offers nothing more");
  assert.equal(buttons.expire.disabled, true);

  mounted.unmount();
  assert.equal(target.children.length, 0);
});

test("a simulated store plan action mounts the same panel, and an expire is posted too", async (context) => {
  const target = fakePage(context);
  const calls = recordFetch(context, accepted);
  let completed = 0;
  const mounted = await mountCheckoutAction({ action: plan, element: target, onComplete: () => { completed += 1; } });
  assert.equal(mounted.type, "simulator");
  outcomeButtons(target).expire.click();
  await until(() => completed === 1);
  assert.deepEqual(calls.map((call) => call.body.outcome), ["expire"]);
  mounted.destroy();
  assert.equal(target.children.length, 0);
});

test("the Stripe panel shows a refused post in place, runs no onComplete, and lets the same outcome be repeated", async (context) => {
  const target = fakePage(context);
  let status = 502;
  const calls = recordFetch(context, () => (status === 204 ? accepted() : jsonResponse({}, status)));
  let completed = 0;
  const mounted = await mountCheckoutAction({ action: stripe, element: target, onComplete: () => { completed += 1; } });
  const buttons = outcomeButtons(target);
  const alert = panelAlert(target);
  assert.equal(alert.hidden, true);
  buttons.complete.click();
  await until(() => alert.hidden === false);
  assert.match(alert.textContent, /didn't confirm the complete outcome \(status 502\)/);
  assert.equal(completed, 0);
  assert.equal(buttons.complete.disabled, false);
  status = 204;
  buttons.complete.click();
  await until(() => completed === 1);
  assert.equal(alert.hidden, true);
  assert.equal(calls.length, 2);
  mounted.destroy();
});

test("removing the Stripe panel during a post runs no onComplete afterwards", async (context) => {
  const target = fakePage(context);
  let answer;
  recordFetch(context, () => new Promise((resolve) => { answer = resolve; }));
  let completed = 0;
  const mounted = await mountCheckoutAction({ action: stripe, element: target, onComplete: () => { completed += 1; } });
  const { complete } = outcomeButtons(target);
  complete.click();
  await until(() => answer !== undefined);
  mounted.destroy();
  answer(accepted());
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(completed, 0);
});

test("a simulated Stripe action needs a container that exists", async (context) => {
  const target = fakePage(context);
  await assert.rejects(mountCheckoutAction({ action: stripe, element: "#missing" }), (error) => error instanceof ArkyError && error.code === "unavailable");
  target.isConnected = false;
  await assert.rejects(mountCheckoutAction({ action: stripe, element: target }), (error) => error instanceof ArkyError && error.code === "unavailable");
});

test("a simulated Monri action keeps its mount on a plain http page, and confirm sends the outcome chosen in the panel", async (context) => {
  const target = fakePage(context);
  const calls = recordFetch(context, accepted);
  let completed = 0;
  const mounted = await mountCheckoutAction({ action: monri, element: "#payment", payment_id: ids.payment, onComplete: () => { completed += 1; } });
  assert.equal(mounted.type, "monri_components");
  const buttons = outcomeButtons(target);
  assert.deepEqual(Object.keys(buttons), ["complete", "decline"]);
  assert.equal(buttons.complete.attributes["aria-pressed"], "true");
  assert.equal(calls.length, 0);

  buttons.decline.click();
  assert.equal(buttons.decline.attributes["aria-pressed"], "true");
  assert.equal(buttons.complete.attributes["aria-pressed"], "false");
  assert.equal(calls.length, 0, "A click on the Monri panel only picks the outcome");

  await assert.rejects(mounted.confirm({ ...billing, full_name: "" }), (error) => error instanceof MonriCheckoutError && error.code === "invalid_details");
  assert.equal(calls.length, 0);
  assert.equal(completed, 0);

  assert.equal(await mounted.confirm(billing), undefined);
  assert.deepEqual(calls.map((call) => [call.href, call.body]), [
    [simulatorPayments, { type: "monri", client_secret: monri.client_secret, outcome: "decline" }],
  ]);
  assert.equal(completed, 1);
  await assert.rejects(mounted.confirm(billing), (error) => error instanceof MonriCheckoutError && error.code === "already_submitted");
  assert.equal(calls.length, 1);
  mounted.unmount();
  assert.equal(target.children.length, 0);
  await assert.rejects(mounted.confirm(billing), (error) => error instanceof MonriCheckoutError && error.code === "unavailable");
});

test("a simulated Monri confirm sends complete until another is chosen, and a post Arky didn't confirm is an unknown result", async (context) => {
  const target = fakePage(context);
  let status = 204;
  const calls = recordFetch(context, () => (status === 204 ? accepted() : jsonResponse({}, status)));
  let completed = 0;
  const approved = await mountCheckoutAction({ action: monri, element: target, payment_id: ids.payment, onComplete: () => { completed += 1; } });
  await approved.confirm(billing);
  assert.equal(calls.at(-1).body.outcome, "complete");
  assert.equal(completed, 1);
  approved.destroy();

  status = 502;
  const unknown = await mountCheckoutAction({ action: monri, element: target, payment_id: ids.payment, onComplete: () => { completed += 1; } });
  await assert.rejects(unknown.confirm(billing), (error) => error instanceof MonriCheckoutError && error.code === "unknown_result");
  assert.equal(completed, 1);
  await assert.rejects(unknown.confirm(billing), (error) => error instanceof MonriCheckoutError && error.code === "already_submitted");
  unknown.destroy();

  await assert.rejects(mountCheckoutAction({ action: monri, element: target }), /needs the payment_id of the payment it pays/);
  await assert.rejects(mountCheckoutAction({ action: monri, element: "#missing", payment_id: ids.payment }), (error) => error instanceof MonriCheckoutError && error.code === "unavailable");
  const { save_card: _saveCard, ...invalid } = monri;
  await assert.rejects(mountCheckoutAction({ action: invalid, element: target, payment_id: ids.payment }), (error) => error instanceof MonriCheckoutError && error.code === "invalid_action");
  assert.equal(target.children.length, 0);
});

test("a simulated card setup keeps its mount with no Stripe.js: confirm sends the chosen outcome and a decline throws declined", async (context) => {
  const target = fakePage(context);
  const calls = recordFetch(context, accepted);
  const mounted = await mountPaymentMethodSetup({ setup, element: "#payment" });
  assert.equal("type" in mounted, false);
  const buttons = outcomeButtons(target);
  assert.deepEqual(Object.keys(buttons), ["complete", "decline", "cancel"]);
  assert.equal(calls.length, 0);

  assert.deepEqual(await mounted.confirm({ return_url: "http://127.0.0.1:4173/account" }), { type: "completed", setup_intent_id: "seti_arky_3" });

  buttons.decline.click();
  assert.equal(calls.length, 1, "A click on the card panel only picks the outcome");
  await assert.rejects(mounted.confirm({ return_url: "http://127.0.0.1:4173/account" }), (error) => {
    assert.ok(error instanceof ArkyError);
    assert.equal(error.code, "declined");
    return true;
  });

  buttons.cancel.click();
  assert.deepEqual(await mounted.confirm({ return_url: "http://127.0.0.1:4173/account" }), { type: "pending", setup_intent_id: "seti_arky_3" });

  assert.deepEqual(calls.map((call) => [call.href, call.body]), [
    [simulatorPayments, { type: "card_setup", client_secret: setup.client_secret, outcome: "complete" }],
    [simulatorPayments, { type: "card_setup", client_secret: setup.client_secret, outcome: "decline" }],
    [simulatorPayments, { type: "card_setup", client_secret: setup.client_secret, outcome: "cancel" }],
  ]);

  mounted.destroy();
  assert.equal(target.children.length, 0);
  await assert.rejects(mounted.confirm({ return_url: "http://127.0.0.1:4173/account" }), (error) => error instanceof ArkyError && error.code === "unavailable");
  assert.equal(calls.length, 3);
});

test("a simulated card setup answers not_confirmed when the post isn't confirmed, and can be confirmed again", async (context) => {
  const target = fakePage(context);
  let status = 502;
  const calls = recordFetch(context, () => (status === 204 ? accepted() : jsonResponse({}, status)));
  const mounted = await mountPaymentMethodSetup({ setup, element: target });
  await assert.rejects(mounted.confirm({ return_url: "https://shop.example.test/account" }), (error) => error instanceof ArkyError && error.code === "not_confirmed");
  const { complete } = outcomeButtons(target);
  assert.equal(complete.disabled, false);
  status = 204;
  assert.deepEqual(await mounted.confirm({ return_url: "https://shop.example.test/account" }), { type: "completed", setup_intent_id: "seti_arky_3" });
  assert.equal(calls.length, 2);
  mounted.destroy();
});
