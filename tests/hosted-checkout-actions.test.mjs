import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import * as sdk from "../dist/index.js";
import * as storefront from "../dist/storefront.js";

test("the browser checkout surface exposes one mount helper for payments, one for card setup, and typed Monri errors", () => {
  for (const entrypoint of [sdk, storefront]) {
    assert.equal("createStripeEmbeddedCheckout" in entrypoint, false);
    assert.equal(typeof entrypoint.mountCheckoutAction, "function");
    assert.equal(typeof entrypoint.mountPaymentMethodSetup, "function");
    assert.equal(typeof entrypoint.MonriCheckoutError, "function");
  }
});

test("mounting a no-op payment action performs no provider or DOM work, and Monri card entry needs the payment it pays", async () => {
  assert.equal(await storefront.mountCheckoutAction({ action: { type: "none" }, element: "#checkout" }), null);
  const monri = { type: "monri_components", environment: "test", authenticity_token: "token", client_secret: "secret", save_card: false };
  await assert.rejects(storefront.mountCheckoutAction({ action: monri, element: "#checkout" }), /needs the payment_id of the payment it pays/);
  await assert.rejects(storefront.mountCheckoutAction({ action: monri, element: "#checkout", payment_id: null }), TypeError);
});

test("browser entrypoints load provider scripts only when a checkout is explicitly mounted, with the merchant's own keys", () => {
  for (const entry of ["index", "storefront"]) {
    execFileSync(process.execPath, ["--input-type=module", "-e", `
      import assert from "node:assert/strict";
      let scripts = 0;
      globalThis.window = {};
      globalThis.document = {
        querySelectorAll: () => [],
        createElement: () => ({ addEventListener() {}, removeEventListener() {} }),
        head: { appendChild() { scripts += 1; } },
      };
      const sdk = await import(process.argv[1]);
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(scripts, 0);
      let initialized = 0;
      let mounted;
      const target = {};
      window.Stripe = (key, options) => {
        initialized += 1;
        assert.equal(key, "pk_test_explicit_mount");
        assert.equal(options?.stripeAccount, undefined);
        return {
          createEmbeddedCheckoutPage: async (input) => {
            assert.equal(input.clientSecret, "cs_explicit_secret");
            return { mount(value) { mounted = value; }, unmount() {}, destroy() {} };
          },
        };
      };
      const result = await sdk.mountCheckoutAction({
        action: {
          type: "stripe_embedded_checkout", publishable_key: "pk_test_explicit_mount",
          client_secret: "cs_explicit_secret", expires_at: 10,
        },
        element: target,
      });
      assert.equal(result.type, "stripe_embedded_checkout");
      assert.equal(initialized, 1);
      assert.equal(mounted, target);
      assert.equal(scripts, 0);
      const billing = await sdk.mountCheckoutAction({
        action: {
          type: "stripe_embedded_checkout", publishable_key: "pk_test_explicit_mount",
          client_secret: "cs_explicit_secret", expires_at: 10,
        },
        element: target,
      });
      assert.equal(billing.type, "stripe_embedded_checkout");
      assert.equal(initialized, 2);
      assert.equal(scripts, 0);
    `, new URL(`../dist/${entry}.js`, import.meta.url).href], {
      timeout: 10_000,
      stdio: "pipe",
    });
  }
});
