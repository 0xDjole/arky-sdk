import assert from "node:assert/strict";
import test from "node:test";
import * as sdk from "../dist/index.js";
import * as storefront from "../dist/storefront.js";

const { followCheckoutAction } = storefront;

test("the browser checkout surface exports one runtime helper", () => {
  for (const entrypoint of [sdk, storefront]) {
    assert.equal(typeof entrypoint.followCheckoutAction, "function");
    assert.equal("checkout" in entrypoint, false);
    assert.equal("stripeCheckout" in entrypoint, false);
    assert.equal("monriCheckout" in entrypoint, false);
  }
});

test("hosted Checkout redirect is the complete browser payment boundary", () => {
  const originalWindow = globalThis.window;
  let assignedUrl = null;
  globalThis.window = {
    location: {
      assign(url) {
        assignedUrl = url;
      },
    },
  };

  try {
    assert.equal(
      followCheckoutAction({
        type: "stripe_checkout",
        url: "https://checkout.stripe.test/cs_exact",
        expires_at: 1_800_000_000,
      }),
      true,
    );
    assert.equal(assignedUrl, "https://checkout.stripe.test/cs_exact");
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});

test("no payment action performs no browser work", () => {
  const originalWindow = globalThis.window;
  let assignments = 0;
  globalThis.window = {
    location: {
      assign() {
        assignments += 1;
      },
    },
  };

  try {
    assert.equal(followCheckoutAction({ type: "none" }), false);
    assert.equal(assignments, 0);
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});

test("server rendering reports that it cannot follow a redirect", () => {
  const originalWindow = globalThis.window;
  delete globalThis.window;
  try {
    assert.equal(
      followCheckoutAction({
        type: "stripe_checkout",
        url: "https://checkout.stripe.test/cs_ssr",
        expires_at: 1_800_000_000,
      }),
      false,
    );
  } finally {
    if (originalWindow !== undefined) globalThis.window = originalWindow;
  }
});

test("Monri hosted form submits only the signed fields returned by Arky", () => {
  const originalWindow = globalThis.window;
  const inputs = [];
  let submitted = false;
  const form = {
    method: "",
    action: "",
    append(input) {
      inputs.push(input);
    },
    submit() {
      submitted = true;
    },
    remove() {},
  };
  globalThis.window = {
    document: {
      createElement(tag) {
        return tag === "form" ? form : { type: "", name: "", value: "" };
      },
      body: { append() {} },
    },
  };

  try {
    const action = {
      type: "monri_form",
      url: "https://ipg.monri.test/v2/form",
      fields: { order_number: "op123", digest: "signed" },
      expires_at: 1_800_000_000,
    };
    assert.equal(followCheckoutAction(action), true);
    assert.equal(form.method, "post");
    assert.equal(form.action, action.url);
    assert.equal(submitted, true);
    assert.deepEqual(
      inputs.map(({ name, value }) => [name, value]),
      [
        ["order_number", "op123"],
        ["digest", "signed"],
      ],
    );
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});
