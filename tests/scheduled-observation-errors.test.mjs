import assert from "node:assert/strict";
import test from "node:test";

import { ScheduledResultTimeoutError } from "../dist/admin.js";
import { admin, jsonResponse, storeId } from "./helpers/scheduled-observation-fixtures.mjs";

test("observation timeout is typed, fast-testable, and carries the last authoritative result", async () => {
  const pending = {
    order_id: "order-timeout",
    payment: {
      status: { status: "processing", at: 1 },
    },
  };
  const originalFetch = globalThis.fetch;
  const originalSetTimeout = globalThis.setTimeout;
  let triggerDeadline;
  let observationSignal;
  let calls = 0;
  let transforms = 0;
  let successes = 0;

  globalThis.fetch = async (_url, init = {}) => {
    calls += 1;
    if (calls === 1) return jsonResponse(pending);
    observationSignal = init.signal;
    queueMicrotask(() => triggerDeadline());
    return new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => reject(init.signal.reason), {
        once: true,
      });
    });
  };
  globalThis.setTimeout = (callback, delay = 0, ...args) => {
    if (Number(delay) === 20_000) {
      triggerDeadline = () => callback(...args);
      return originalSetTimeout(() => {}, 60_000);
    }
    return originalSetTimeout(callback, 0, ...args);
  };

  try {
    await assert.rejects(
      admin().eshop.cart.checkout(
        {
          id: "cart-timeout",
          store_id: storeId,
          payment_method_key: "credit_card",
        },
        {
          transformRequest(body) {
            transforms += 1;
            return body;
          },
          onSuccess() {
            successes += 1;
          },
        },
      ),
      (error) => {
        assert.ok(error instanceof ScheduledResultTimeoutError);
        assert.equal(error.lastResult.payment.status.status, "processing");
        assert.match(error.message, /observation timed out/i);
        assert.doesNotMatch(error.message, /delivery failed/i);
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalSetTimeout;
  }

  assert.equal(calls, 2);
  assert.equal(observationSignal.aborted, true);
  assert.equal(transforms, 1);
  assert.equal(successes, 1);
});

test("an observation failure does not replay the caller error callback", async () => {
  const pending = {
    order_id: "order-observation-error",
    payment: {
      status: { status: "processing", at: 1 },
    },
  };
  let calls = 0;
  let successes = 0;
  let errors = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    calls += 1;
    return calls === 1
      ? jsonResponse(pending)
      : jsonResponse(
          {
            message: "observation unavailable",
            error: "OBSERVATION_UNAVAILABLE",
            statusCode: 503,
            validationErrors: [],
          },
          503,
        );
  };

  try {
    await assert.rejects(
      admin().eshop.cart.checkout(
        {
          id: "cart-observation-error",
          store_id: storeId,
          payment_method_key: "credit_card",
        },
        {
          onSuccess() {
            successes += 1;
          },
          onError() {
            errors += 1;
          },
        },
      ),
      /observation unavailable/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls, 2);
  assert.equal(successes, 1);
  assert.equal(errors, 0);
});
