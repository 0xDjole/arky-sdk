import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import * as sdk from "../dist/index.js";
import * as storefront from "../dist/storefront.js";

test("the browser checkout surface exposes one mount helper and typed Monri errors", () => {
  for (const entrypoint of [sdk, storefront]) {
    assert.equal(typeof entrypoint.createStripeEmbeddedCheckout, "function");
    assert.equal(typeof entrypoint.mountCheckoutAction, "function");
    assert.equal(typeof entrypoint.MonriCheckoutError, "function");
  }
});

test("mounting a no-op payment action performs no provider or DOM work", async () => {
  assert.equal(
    await storefront.mountCheckoutAction({ type: "none" }, "#checkout"),
    null,
  );
});

test("browser entrypoints load provider scripts only when a checkout is explicitly mounted", () => {
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
        type: "stripe_embedded_checkout", publishable_key: "pk_test_explicit_mount",
        account_id: "acct_explicit_mount", client_secret: "cs_explicit_secret", expires_at: 10,
      }, target);
      assert.equal(result.type, "stripe_embedded_checkout");
      assert.equal(initialized, 1);
      assert.equal(mounted, target);
      assert.equal(scripts, 0);
      const billing = await sdk.mountCheckoutAction({
        type: "stripe_embedded_checkout", publishable_key: "pk_test_explicit_mount",
        client_secret: "cs_explicit_secret", expires_at: 10,
      }, target);
      assert.equal(billing.type, "stripe_embedded_checkout");
      assert.equal(initialized, 2);
      assert.equal(scripts, 0);
    `, new URL(`../dist/${entry}.js`, import.meta.url).href], {
      timeout: 10_000,
      stdio: "pipe",
    });
  }
});
