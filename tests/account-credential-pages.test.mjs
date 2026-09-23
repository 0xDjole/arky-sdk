import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

test("own credential lists forward bounded pages and preserve tagged statuses without hidden reads", async (context) => {
  const cursor = "account:/+==";
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, headers: new Headers(init.headers) });
    const body = { items: [{ id: "credential", status: { type: "revoked" } }], cursor: parsed.searchParams.has("cursor") ? null : cursor };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ baseUrl: "https://credentials.test", apiToken: "arky_account_access_contract" });
  for (const [api, path] of [[admin.account.apiToken, "api-tokens"], [admin.account.session, "sessions"]]) {
    const count = calls.length;
    const first = await api.list({ limit: 1 }, { headers: { "X-Trace-Id": "credential-page" } });
    assert.equal(calls.length, count + 1);
    assert.equal(first.cursor, cursor);
    assert.deepEqual(first.items[0].status, { type: "revoked" });
    const next = await api.list({ limit: 1, cursor: first.cursor });
    assert.equal(calls.length, count + 2);
    assert.equal(next.cursor, null);
    assert.equal(calls[count].url.pathname, `/v1/accounts/me/${path}`);
    assert.equal(calls[count].headers.get("X-Trace-Id"), "credential-page");
    assert.deepEqual(Object.fromEntries(calls[count + 1].url.searchParams), { limit: "1", cursor });
    await api.list();
    assert.equal(calls.length, count + 3);
    assert.equal(calls[count + 2].url.search, "");
  }
});
