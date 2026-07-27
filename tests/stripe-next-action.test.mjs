import assert from "node:assert/strict";
import test from "node:test";
import { createStripeConfirmationTokenController } from "../dist/storefront.js";

test("Stripe next-action handling does not create unused Elements", async () => {
  let elementsCalls = 0;
  let handledClientSecret = null;
  const stripe = {
    elements() {
      elementsCalls += 1;
      throw new Error("resume-only handling must not create Elements");
    },
    async handleNextAction({ clientSecret }) {
      handledClientSecret = clientSecret;
      return {};
    },
  };
  const controller = await createStripeConfirmationTokenController(
    {
      publishableKey: "pk_test_exact",
      connectedAccountId: "acct_exact",
      amount: 1250,
      currency: "EUR",
    },
    async (publishableKey, options) => {
      assert.equal(publishableKey, "pk_test_exact");
      assert.deepEqual(options, { stripeAccount: "acct_exact" });
      return stripe;
    },
  );

  await controller.handleNextAction("pi_exact_secret", {
    connectedAccountId: "acct_exact",
  });

  assert.equal(handledClientSecret, "pi_exact_secret");
  assert.equal(elementsCalls, 0);
  controller.destroy();
});

test("Stripe next-action handling uses the exact returned connected account after provider drift", async () => {
  const loads = [];
  let initialHandleCalls = 0;
  let exactHandledClientSecret = null;
  let elementsCalls = 0;
  const initialStripe = {
    elements() {
      elementsCalls += 1;
      throw new Error("next-action handling must not create Elements");
    },
    async handleNextAction() {
      initialHandleCalls += 1;
      return {};
    },
  };
  const exactStripe = {
    elements() {
      elementsCalls += 1;
      throw new Error("next-action handling must not create Elements");
    },
    async handleNextAction({ clientSecret }) {
      exactHandledClientSecret = clientSecret;
      return {};
    },
  };
  const controller = await createStripeConfirmationTokenController(
    {
      publishableKey: "pk_test_drift",
      connectedAccountId: "acct_initial",
      amount: 1250,
      currency: "EUR",
    },
    async (publishableKey, options) => {
      loads.push([publishableKey, options]);
      return options?.stripeAccount === "acct_exact"
        ? exactStripe
        : initialStripe;
    },
  );

  await controller.handleNextAction("pi_drift_secret", {
    connectedAccountId: "acct_exact",
  });

  assert.deepEqual(loads, [
    ["pk_test_drift", { stripeAccount: "acct_initial" }],
    ["pk_test_drift", { stripeAccount: "acct_exact" }],
  ]);
  assert.equal(initialHandleCalls, 0);
  assert.equal(exactHandledClientSecret, "pi_drift_secret");
  assert.equal(elementsCalls, 0);
  controller.destroy();
});

test("Stripe routing snapshots normalized controller config before the first async boundary", async () => {
  const loads = [];
  let releaseInitialLoad;
  const initialLoadGate = new Promise((resolve) => {
    releaseInitialLoad = resolve;
  });
  const initialStripe = {
    async handleNextAction() {
      throw new Error("mutated initial routing must not be used");
    },
  };
  let handledClientSecret = null;
  const exactStripe = {
    async handleNextAction({ clientSecret }) {
      handledClientSecret = clientSecret;
      return {};
    },
  };
  const mutableConfig = {
    publishableKey: "  pk_test_snapshot  ",
    connectedAccountId: "  acct_initial_snapshot  ",
    amount: 1250,
    currency: "EUR",
  };
  const controllerPromise = createStripeConfirmationTokenController(
    mutableConfig,
    async (publishableKey, options) => {
      loads.push([publishableKey, options]);
      if (loads.length === 1) {
        await initialLoadGate;
        return initialStripe;
      }
      return exactStripe;
    },
  );

  mutableConfig.publishableKey = "pk_test_mutated_before_load";
  mutableConfig.connectedAccountId = "acct_mutated_before_load";
  releaseInitialLoad();
  const controller = await controllerPromise;
  mutableConfig.publishableKey = "pk_test_mutated_after_load";
  mutableConfig.connectedAccountId = "acct_mutated_after_load";

  await controller.handleNextAction("pi_snapshot_secret", {
    connectedAccountId: "acct_exact_snapshot",
  });

  assert.deepEqual(loads, [
    ["pk_test_snapshot", { stripeAccount: "acct_initial_snapshot" }],
    ["pk_test_snapshot", { stripeAccount: "acct_exact_snapshot" }],
  ]);
  assert.equal(handledClientSecret, "pi_snapshot_secret");
  controller.destroy();
});

test("Stripe Elements remain lazy until payment input is mounted", async () => {
  let elementsCalls = 0;
  let mountedTarget = null;
  const paymentElement = {
    mount(target) {
      mountedTarget = target;
    },
    destroy() {},
  };
  const elements = {
    create(type) {
      assert.equal(type, "payment");
      return paymentElement;
    },
    update() {},
    async submit() {
      return {};
    },
  };
  const controller = await createStripeConfirmationTokenController(
    {
      publishableKey: "pk_test_lazy",
      amount: 500,
      currency: "USD",
    },
    async () => ({
      elements() {
        elementsCalls += 1;
        return elements;
      },
    }),
  );

  controller.update({ amount: 700, currency: "EUR" });
  assert.equal(elementsCalls, 0);

  controller.mount("#payment");
  assert.equal(elementsCalls, 1);
  assert.equal(mountedTarget, "#payment");
  controller.destroy();
});
