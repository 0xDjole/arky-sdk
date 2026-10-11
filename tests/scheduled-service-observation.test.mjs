import assert from "node:assert/strict";
import test from "node:test";

import { ScheduledResultTimeoutError as AdminTimeoutError } from "../dist/admin.js";
import { ScheduledResultTimeoutError as StorefrontTimeoutError } from "../dist/storefront.js";
import { pollScheduledResult, ScheduledResultTimeoutError } from "../dist/utils.js";

const settled = (result) => result.status === "answered";
const pending = (result) => !settled(result);

test("a scheduled result that is no longer pending is returned at once without any observation", async () => {
  let observations = 0;
  const answered = { status: "answered" };
  assert.equal(await pollScheduledResult(answered, async () => { observations += 1; return answered; }, pending), answered);
  assert.equal(observations, 0);
});

test("a pending scheduled result follows the exact observation until it settles and returns the settled result", async () => {
  const observed = [{ status: "answering" }, { status: "answered" }];
  const signals = [];
  const result = await pollScheduledResult({ status: "waiting" }, async (signal) => {
    signals.push(signal);
    return observed.shift();
  }, pending);
  assert.deepEqual(result, { status: "answered" });
  assert.equal(signals.length, 2);
  assert.ok(signals.every((signal) => signal instanceof AbortSignal && !signal.aborted));
  assert.deepEqual(observed, []);
});

test("the caller's abort stops a pending observation, and an aborted caller observes nothing", async () => {
  const controller = new AbortController();
  let observations = 0;
  await assert.rejects(
    pollScheduledResult({ status: "waiting" }, async () => {
      observations += 1;
      controller.abort(new Error("left the page"));
      return { status: "waiting" };
    }, pending, controller.signal),
    /left the page/,
  );
  assert.equal(observations, 1);
  const gone = new AbortController();
  gone.abort(new Error("already gone"));
  await assert.rejects(pollScheduledResult({ status: "waiting" }, async () => { observations += 1; return { status: "answered" }; }, pending, gone.signal), /already gone/);
  assert.equal(observations, 1);
});

test("a failed observation is propagated as it is, and every entry point exports the timeout error with its last result", async () => {
  await assert.rejects(pollScheduledResult({ status: "waiting" }, async () => { throw new TypeError("observation lost"); }, pending), /observation lost/);
  for (const TimeoutError of [ScheduledResultTimeoutError, AdminTimeoutError, StorefrontTimeoutError]) {
    const timeout = new TimeoutError({ status: "waiting" });
    assert.ok(timeout instanceof Error);
    assert.equal(timeout.name, "ScheduledResultTimeoutError");
    assert.deepEqual(timeout.lastResult, { status: "waiting" });
  }
});
