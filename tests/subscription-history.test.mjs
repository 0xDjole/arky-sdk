import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/index.js";

test("Subscription history forwards its own cursor and exposes no retired financial owners", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  const page = { items: [], cursor: "next-orders" };
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: new URL(url), method: init.method ?? "GET", body: init.body });
    return new Response(JSON.stringify(page), {
      headers: { "content-type": "application/json" },
    });
  };
  try {
    const client = createAdmin({
      apiToken: "test-token",
      baseUrl: "https://api.example.test",
      storeId: "configured-store",
      market: "us",
      locale: "en",
    });
    const subscriptions = client.eshop.subscription;
    for (const owner of ["refunds", "disputes", "billing", "memberships"]) {
      assert.equal(owner in subscriptions, false, owner);
    }
    for (const cursors of [{}, { cursor: "orders-page" }]) {
      assert.deepEqual(
        await subscriptions.findOrders({
          store_id: "exact-store",
          id: "subscription",
          limit: 25,
          ...cursors,
        }),
        page,
      );
    }
    assert.equal(requests.length, 2);
    for (const request of requests) {
      assert.equal(request.method, "GET");
      assert.equal(request.body, undefined);
      assert.equal(
        request.url.pathname,
        "/v1/stores/exact-store/subscriptions/subscription/orders",
      );
      assert.equal(request.url.searchParams.get("limit"), "25");
    }
    assert.equal(requests[0].url.searchParams.has("cursor"), false);
    assert.equal(requests[1].url.searchParams.get("cursor"), "orders-page");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
