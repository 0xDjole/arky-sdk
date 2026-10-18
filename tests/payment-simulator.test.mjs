import assert from "node:assert/strict";
import test from "node:test";

import { simulatePayment as adminSimulatePayment } from "../dist/admin.js";
import { isSimulatedPayment, simulatePayment } from "../dist/storefront.js";
import { ids, jsonResponse, recordFetch } from "./helpers/arky-fixtures.mjs";

const stripe = { type: "stripe_embedded_checkout", publishable_key: "pk_test_emu", client_secret: "cs_emu_7_secret_emulator", expires_at: 1_900_000_000_000 };
const monri = { type: "monri_components", environment: "test", authenticity_token: "local-authenticity", client_secret: `monri_${ids.order}_secret_emulator`, save_card: false };
const setup = { method: {}, client_secret: "seti_emu_3_secret_emulator", publishable_key: "pk_test_emu" };

test("simulatePayment plays the shopper at the local simulator for a Stripe Checkout, a Monri payment and a card setup", async (context) => {
  const calls = recordFetch(context, () => new Response(null, { status: 204 }));
  assert.equal(isSimulatedPayment(stripe), true);
  assert.equal(isSimulatedPayment(monri), true);
  assert.equal(isSimulatedPayment(setup), true);
  assert.equal(isSimulatedPayment({ ...stripe, client_secret: "cs_live_123_secret_abc" }), false);
  assert.equal(isSimulatedPayment({ type: "none" }), false);
  assert.equal(isSimulatedPayment({ ...setup, client_secret: null }), false);
  await simulatePayment({ simulator_url: "http://127.0.0.1:39090", simulation: { type: "stripe_checkout", action: stripe, outcome: "complete" } });
  await simulatePayment({
    simulator_url: "http://localhost:39090",
    simulation: { type: "monri", action: monri, payment_id: ids.payment, attempt_id: ids.credit, outcome: "decline" },
  });
  await adminSimulatePayment({ simulator_url: "http://127.0.0.1:39090", simulation: { type: "card_setup", setup, outcome: "cancel" } });
  assert.deepEqual(calls.map((call) => [call.method, call.href, call.body]), [
    ["POST", "http://127.0.0.1:39090/local/checkout/cs_emu_7/complete", null],
    [
      "POST",
      `http://localhost:39090/local/monri/payments/monri_${ids.order}/decline`,
      { attempt_id: ids.credit, client_secret: monri.client_secret, payment_id: ids.payment, authenticity_token: "local-authenticity", environment: "test" },
    ],
    ["POST", "http://127.0.0.1:39090/local/setup/seti_emu_3/cancel", null],
  ]);
  assert.equal(calls[1].headers.get("content-type"), "application/json");
});

test("simulatePayment refuses a real payment, a remote simulator, an outcome the provider has not and an unconfirmed answer", async (context) => {
  let status = 204;
  const calls = recordFetch(context, () => (status === 204 ? new Response(null, { status }) : jsonResponse({}, status)));
  for (const simulator_url of ["https://127.0.0.1:39090", "http://simulator.example.test", "http://127.0.0.1:39090/local", "not a url"]) {
    await assert.rejects(simulatePayment({ simulator_url, simulation: { type: "stripe_checkout", action: stripe, outcome: "complete" } }), TypeError);
  }
  await assert.rejects(
    simulatePayment({ simulator_url: "http://127.0.0.1:39090", simulation: { type: "stripe_checkout", action: { ...stripe, client_secret: "cs_live_123_secret_abc" }, outcome: "complete" } }),
    TypeError,
  );
  await assert.rejects(
    simulatePayment({ simulator_url: "http://127.0.0.1:39090", simulation: { type: "stripe_checkout", action: stripe, outcome: "decline" } }),
    TypeError,
  );
  await assert.rejects(
    simulatePayment({ simulator_url: "http://127.0.0.1:39090", simulation: { type: "monri", action: monri, payment_id: ids.payment, attempt_id: "attempt-1", outcome: "complete" } }),
    TypeError,
  );
  assert.equal(calls.length, 0);
  status = 502;
  await assert.rejects(
    simulatePayment({ simulator_url: "http://127.0.0.1:39090", simulation: { type: "stripe_checkout", action: stripe, outcome: "expire" } }),
    /didn't confirm the expire outcome/,
  );
  assert.equal(calls.length, 1);
});
