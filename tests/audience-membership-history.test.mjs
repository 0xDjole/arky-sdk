import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/index.js";

test("Membership history forwards independent cursors and exposes no retired financial owners", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  const history = {
    orders: { items: [], cursor: "next-orders" },
    subscriptions: { items: [], cursor: "next-subscriptions" },
  };
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: new URL(url), method: init.method ?? "GET", body: init.body });
    return new Response(JSON.stringify(history), { headers: { "content-type": "application/json" } });
  };
  try {
    const client = createAdmin({ apiToken: "test-token", baseUrl: "https://api.example.test", storeId: "configured-store", market: "us", locale: "en" });
    assert.equal("refunds" in client.audiences.memberships, false);
    assert.equal("disputes" in client.audiences.memberships, false);
    for (const cursors of [{}, { order_cursor: "orders-page" }, { subscription_cursor: "subscriptions-page" }]) {
      assert.deepEqual(await client.audiences.memberships.listBilling({ store_id: "exact-store", audience_id: "audience", membership_id: "membership", limit: 25, ...cursors }), history);
    }
    assert.equal(requests.length, 3);
    for (const request of requests) {
      assert.equal(request.method, "GET");
      assert.equal(request.body, undefined);
      assert.equal(request.url.pathname, "/v1/stores/exact-store/audiences/audience/memberships/membership/billing");
      assert.equal(request.url.searchParams.get("limit"), "25");
    }
    assert.equal(requests[0].url.searchParams.has("order_cursor"), false);
    assert.equal(requests[0].url.searchParams.has("subscription_cursor"), false);
    assert.equal(requests[1].url.searchParams.get("order_cursor"), "orders-page");
    assert.equal(requests[1].url.searchParams.has("subscription_cursor"), false);
    assert.equal(requests[2].url.searchParams.get("subscription_cursor"), "subscriptions-page");
    assert.equal(requests[2].url.searchParams.has("order_cursor"), false);
  } finally { globalThis.fetch = originalFetch; }
});
