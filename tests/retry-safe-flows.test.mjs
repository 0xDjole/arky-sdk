import assert from "node:assert/strict";
import test from "node:test";

import { DurableRequestError as RootDurableRequestError } from "../dist/index.js";
import {
  ArkyError,
  createStorefront,
  DurableRequestError,
  formValuesFromAnswers,
  initialize,
} from "../dist/storefront.js";
import { DurableRequestError as UtilsDurableRequestError } from "../dist/utils.js";
import { ExclusiveLockManager, MemoryStorage } from "./helpers/durable-request-fixtures.mjs";
import {
  apiUrl,
  checkoutRequest,
  customerRecord,
  errorResponse,
  factoryId,
  ids,
  idFactories,
  idSequence,
  installGlobal,
  placedAcceptance,
  placedOrder,
  publishableKey,
  recordFetch,
  visitorStorage,
} from "./helpers/arky-fixtures.mjs";

const answers = [{ type: "text", question_id: ids.line, key: "message", value: "Hello" }];
const formParams = { form_id: ids.form, questions_updated_at: 1_700_000_000_000, language: "en", answers };

function browser(context) {
  const storage = new MemoryStorage();
  installGlobal(context, "window", globalThis);
  installGlobal(context, "localStorage", storage);
  installGlobal(context, "navigator", { locks: new ExclusiveLockManager() });
  return storage;
}

function storefront(createId) {
  return createStorefront(publishableKey, { ...idFactories, createId, apiUrl, locale: "en", sessionStorage: visitorStorage() });
}

function submissionBody(call) {
  return JSON.parse(call.body.get("submission"));
}

function submission(id, overrides = {}) {
  return { id, form_id: ids.form, language: "en", answers, stage_id: ids.otherLine, created_at: 1, updated_at: 1, ...overrides };
}

function pendingKeys(storage) {
  return [...storage.values.keys()].filter((key) => key.startsWith("arky:pending-create:v1:"));
}

test("forms.submit without an id keeps the factory id until a definite answer", async (context) => {
  const storage = browser(context);
  let answer = "lost";
  const calls = recordFetch(context, (call) => {
    if (answer === "lost") throw new TypeError("Lost response");
    if (answer === "refused") return errorResponse(409, "GENERAL.CONFLICT", "Refused");
    return submission(submissionBody(call).id);
  });
  const client = storefront(idSequence(factoryId(1), factoryId(2), factoryId(3)));

  await assert.rejects(client.forms.submit(formParams), /Lost response/);
  assert.equal(pendingKeys(storage).length, 1);
  answer = "ok";
  assert.equal((await client.forms.submit(formParams)).id, factoryId(1));
  assert.deepEqual(pendingKeys(storage), []);

  answer = "refused";
  await assert.rejects(client.forms.submit(formParams), /Refused/);
  assert.deepEqual(pendingKeys(storage), []);
  answer = "ok";
  await client.forms.submit(formParams);

  assert.deepEqual(calls.map((call) => submissionBody(call).id), [factoryId(1), factoryId(1), factoryId(2), factoryId(3)]);
  assert.ok(calls.every((call) => call.path === `/v1/storefront/forms/${ids.form}/submissions`));
  assert.equal(JSON.stringify([...storage.values.values()]).includes("Hello"), false);
});

test("a changed form submission is a new request, and a wrong answer keeps the pending id", async (context) => {
  const storage = browser(context);
  let answerId = null;
  const calls = recordFetch(context, (call) => submission(answerId ?? submissionBody(call).id));
  const client = storefront(idSequence(factoryId(1), factoryId(2)));
  answerId = ids.submission;
  await assert.rejects(client.forms.submit(formParams), /names another record/);
  assert.equal(pendingKeys(storage).length, 1);
  answerId = null;
  const changed = { ...formParams, answers: [{ ...answers[0], value: "Hello again" }] };
  assert.equal((await client.forms.submit(changed)).id, factoryId(2));
  assert.deepEqual(calls.map((call) => submissionBody(call).id), [factoryId(1), factoryId(2)]);
  assert.deepEqual(pendingKeys(storage), []);
});

test("an explicit form id is sent as is, and a factory id needs browser storage", async (context) => {
  const calls = recordFetch(context, (call) => submission(submissionBody(call).id));
  const client = storefront(idSequence());
  assert.equal((await client.forms.submit({ ...formParams, id: ids.submission })).id, ids.submission);
  await assert.rejects(client.forms.submit(formParams), /Cannot safely start form submission/);
  await assert.rejects(client.forms.submit({ ...formParams, id: "form-1" }), TypeError);
  assert.equal(calls.length, 1);
});

test("a storage failure is a DurableRequestError with code storage, recognised whichever bundle checks it", async (context) => {
  const calls = recordFetch(context, () => {
    throw new Error("Nothing may be sent");
  });
  const error = await storefront(idSequence()).forms.submit(formParams).catch((caught) => caught);
  assert.match(error.message, /Cannot safely start form submission/);
  assert.equal(error.name, "DurableRequestError");
  assert.equal(error.code, "storage");
  assert.ok(error instanceof DurableRequestError);
  assert.ok(error instanceof UtilsDurableRequestError);
  assert.ok(error instanceof RootDurableRequestError);
  assert.ok(error instanceof ArkyError);
  const fromUtils = new UtilsDurableRequestError("storage", "The saved request can't be read");
  assert.ok(fromUtils instanceof DurableRequestError);
  assert.equal(fromUtils.code, "storage");
  const lookalike = Object.assign(new Error("The saved request can't be read"), { name: "DurableRequestError", code: "storage" });
  assert.equal(lookalike instanceof DurableRequestError, false);
  assert.equal(lookalike instanceof ArkyError, false);
  assert.equal(calls.length, 0);
});

test("the store's forms.submit with a loaded form takes its id from the factory when none is given and sends the bot-check token", async (context) => {
  browser(context);
  const form = {
    id: ids.form,
    key: "contact",
    questions_updated_at: 1_700_000_000_000,
    questions: [{ id: ids.line, key: "message", required: true, label: { type: "hidden" }, type: "text", min_length: null, max_length: null, pattern: null }],
  };
  const calls = recordFetch(context, (call) => submission(submissionBody(call).id));
  const store = initialize(publishableKey, { ...idFactories, createId: idSequence(factoryId(7)), apiUrl, locale: "en", sessionStorage: visitorStorage() });
  const result = await store.forms.submit({ form, values: { message: "Hello" }, language: "en", bot_check_token: "turnstile-token" });
  assert.equal(result.id, factoryId(7));
  assert.equal(submissionBody(calls[0]).questions_updated_at, form.questions_updated_at);
  assert.equal(submissionBody(calls[0]).bot_check_token, "turnstile-token");
});

test("support start and send reuse their factory ids after a lost answer", async (context) => {
  const storage = browser(context);
  let lose = true;
  const conversationId = factoryId(1);
  const messageId = factoryId(2);
  const calls = recordFetch(context, (call) => {
    if (lose) {
      lose = false;
      throw new TypeError("Lost response");
    }
    const conversation = { id: conversationId, language: "en", status: { type: "team" }, created_at: 1, updated_at: 1 };
    if (call.path === "/v1/storefront/conversations") return { conversation, messages: [] };
    return {
      conversation,
      messages: [{ id: call.body.id, conversation_id: conversationId, sequence: 1, type: { type: "customer_chat", text: "Hi" }, created_at: 1, updated_at: 1 }],
    };
  });
  const client = storefront(idSequence(conversationId, messageId));
  await assert.rejects(client.support.conversation.start({ language: "en" }), /Lost response/);
  const started = await client.support.conversation.start({ language: "en" });
  assert.equal(started.conversation.id, conversationId);
  lose = true;
  const send = { conversation_id: conversationId, input: { type: "text", text: "Hi" } };
  await assert.rejects(client.support.conversation.sendMessage(send), /Lost response/);
  const sent = await client.support.conversation.sendMessage(send);
  assert.equal(sent.messages[0].id, messageId);
  assert.deepEqual(calls.map((call) => [call.path, call.body.id]), [
    ["/v1/storefront/conversations", conversationId],
    ["/v1/storefront/conversations", conversationId],
    [`/v1/storefront/conversations/${conversationId}/messages`, messageId],
    [`/v1/storefront/conversations/${conversationId}/messages`, messageId],
  ]);
  assert.deepEqual(pendingKeys(storage), []);
});

test("requestCode keeps its factory id for the same email and takes a new one for another", async (context) => {
  browser(context);
  let lose = true;
  const calls = recordFetch(context, (call) => {
    if (lose) {
      lose = false;
      throw new TypeError("Lost response");
    }
    return {
      customer: customerRecord(),
      session: { id: ids.session, store_id: ids.store, customer_id: ids.customer },
      email_verification: { issued_at: 1, expires_at: 2 },
    };
  });
  const client = storefront(idSequence(factoryId(1), factoryId(2)));
  await assert.rejects(client.customer.requestCode({ email: "ana@example.test", language: "en" }), /Lost response/);
  await client.customer.requestCode({ email: "ana@example.test", language: "en", bot_check_token: "fresh-token" });
  await client.customer.requestCode({ email: "ivo@example.test", language: "en" });
  await client.customer.requestCode({ id: ids.submission, email: "ivo@example.test", language: "en" });
  assert.deepEqual(calls.map((call) => [call.body.id, call.body.email]), [
    [factoryId(1), "ana@example.test"],
    [factoryId(1), "ana@example.test"],
    [factoryId(2), "ivo@example.test"],
    [ids.submission, "ivo@example.test"],
  ]);
  assert.equal(calls[1].body.bot_check_token, "fresh-token");
});

test("a checkout without ids takes them from the factories, keeps them, and blocks a different checkout", async (context) => {
  browser(context);
  const orderId = ids.order;
  let lose = true;
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/carts/accept") {
      if (lose) {
        lose = false;
        throw new TypeError("Lost response");
      }
      return placedAcceptance();
    }
    if (call.path === `/v1/storefront/orders/${orderId}`) return placedOrder();
    throw new Error(`Unexpected request ${call.path}`);
  });
  const client = createStorefront(publishableKey, {
    ...idFactories,
    createId: idSequence(orderId),
    createOrderToken: () => checkoutRequest().order_token,
    apiUrl,
    locale: "en",
    sessionStorage: visitorStorage(),
  });
  const { order_id: _orderId, order_token: _orderToken, ...draft } = checkoutRequest();
  await assert.rejects(client.eshop.cart.checkout(draft), /Lost response/);
  assert.equal((await client.eshop.cart.pendingCheckout()).order_id, orderId);
  await assert.rejects(client.eshop.cart.checkout({ ...draft, contact_email: "other@example.test" }), /Recover the unfinished cart checkout/);
  assert.deepEqual(await client.eshop.cart.checkout(draft), placedAcceptance());
  assert.equal(await client.eshop.cart.pendingCheckout(), null);
  const accepts = calls.filter((call) => call.path === "/v1/storefront/carts/accept");
  assert.equal(accepts.length, 2);
  assert.deepEqual(accepts[0].body, accepts[1].body);
  assert.equal(accepts[0].body.order_id, orderId);
  await assert.rejects(client.eshop.cart.checkout({ ...draft, order_id: orderId }), /both its order_id and order_token/);
});

test("a kept form submission keeps its answers for a reload, refuses a different one, and sends the same id again", async (context) => {
  const storage = browser(context);
  let answer = "lost";
  const calls = recordFetch(context, (call) => {
    if (answer === "lost") throw new TypeError("Lost response");
    return submission(submissionBody(call).id);
  });
  const client = storefront(idSequence(factoryId(1)));
  const kept = await client.forms.retainSubmission(formParams);
  assert.equal(kept.id, factoryId(1));
  await assert.rejects(client.forms.recoverSubmission({ form_id: ids.form, bot_check_token: "first-token" }), /Lost response/);

  const reloaded = storefront(idSequence());
  const pending = await reloaded.forms.pendingSubmission({ form_id: ids.form });
  assert.deepEqual(pending, { id: factoryId(1), ...formParams });
  assert.deepEqual(formValuesFromAnswers(pending.answers), { message: "Hello" });
  assert.deepEqual(await reloaded.forms.retainSubmission(formParams), pending);
  await assert.rejects(
    reloaded.forms.retainSubmission({ ...formParams, answers: [{ ...answers[0], value: "Changed" }] }),
    (error) => error instanceof DurableRequestError && error.code === "pending",
  );
  await assert.rejects(reloaded.forms.retainSubmission({ ...formParams, answers: [{ type: "file", question_id: ids.line, key: "file", files: [] }] }), TypeError);

  answer = "ok";
  assert.equal((await reloaded.forms.recoverSubmission({ form_id: ids.form, bot_check_token: "second-token" })).id, factoryId(1));
  assert.equal(await reloaded.forms.pendingSubmission({ form_id: ids.form }), null);
  assert.equal(await reloaded.forms.recoverSubmission({ form_id: ids.form }), null);
  assert.deepEqual(calls.map((call) => [submissionBody(call).id, submissionBody(call).bot_check_token]), [
    [factoryId(1), "first-token"],
    [factoryId(1), "second-token"],
  ]);
  assert.deepEqual(pendingKeys(storage), []);
});

test("a kept form submission refused by the Server is dropped, so the form can be sent again", async (context) => {
  browser(context);
  recordFetch(context, () => errorResponse(409, "FORM_SUBMISSION.FORM_CHANGED", "The form changed; reload it"));
  const client = storefront(idSequence(factoryId(1)));
  await client.forms.retainSubmission(formParams);
  await assert.rejects(client.forms.recoverSubmission({ form_id: ids.form }), (error) => error.code === "FORM_SUBMISSION.FORM_CHANGED");
  assert.equal(await client.forms.pendingSubmission({ form_id: ids.form }), null);
});
