import assert from "node:assert/strict";
import test from "node:test";

import { ScheduledResultTimeoutError } from "../dist/admin.js";
import {
  admin,
  jsonResponse,
  storeId,
} from "./helpers/scheduled-observation-fixtures.mjs";

const request = {
  send_id: "send-observation-error",
  send: {
    type: "subscription_confirmation",
    data: {
      store_id: storeId,
      mailbox_id: "mailbox-observation-error",
      template_id: "template-observation-error",
      recipients: ["recipient@example.test"],
    },
  },
};

function pendingEmailResult() {
  return {
    sent: 0,
    deliveries: [
      {
        delivery_id: "delivery-observation-error",
        revision: 1,
        recipient: "recipient@example.test",
        mailbox_id: "mailbox-observation-error",
        template_id: "template-observation-error",
        status: "pending",
      },
    ],
  };
}

test("observation timeout is typed and carries the last authoritative Email result", async () => {
  const pending = pendingEmailResult();
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
      admin().notification.email.send(request, {
        transformRequest(body) {
          transforms += 1;
          return body;
        },
        onSuccess() {
          successes += 1;
        },
      }),
      (error) => {
        assert.ok(error instanceof ScheduledResultTimeoutError);
        assert.deepEqual(error.lastResult, pending);
        assert.match(error.message, /observation timed out/i);
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

test("an Email observation failure does not replay the mutation error callback", async () => {
  const pending = pendingEmailResult();
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
      admin().notification.email.send(request, {
        onSuccess() {
          successes += 1;
        },
        onError() {
          errors += 1;
        },
      }),
      /observation unavailable/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls, 2);
  assert.equal(successes, 1);
  assert.equal(errors, 0);
});
