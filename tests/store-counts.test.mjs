import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const storeId = "6d2b8f41-3a75-4c09-9e1d-7b5c2a8f0e36";
const marketId = "1c8e4a97-5d23-4f60-b9a1-3e7d5c0b2f84";

function admin() {
  return createAdmin({ baseUrl: "https://counts.test", secretKey: "arky_api_counts" });
}

test("status counts read the named counts by status in one call", async (context) => {
  const answer = {
    counts: [
      {
        type: "orders_by_status",
        segments: [
          { segment: "pending", value: 2 },
          { segment: "confirmed", value: 1 },
          { segment: "partially_cancelled", value: 0 },
          { segment: "cancelled", value: 0 },
        ],
      },
      { type: "customers_by_type", segments: [{ segment: "anonymous", value: 4 }, { segment: "verified", value: 1 }] },
    ],
  };
  const calls = recordFetch(context, () => answer);
  const read = await admin().counts.statuses({ store_id: storeId, types: ["orders_by_status", "customers_by_type"] });
  assert.deepEqual(read, answer);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].body, null);
  assert.equal(calls[0].path, `/v1/stores/${storeId}/counts/statuses`);
  assert.deepEqual(calls[0].query, { types: JSON.stringify(["orders_by_status", "customers_by_type"]) });
});

test("a count report sends its span and reads as JSON query values and leaves out reads it does not name", async (context) => {
  const answer = {
    from: "2026-09-17",
    to: "2026-10-16",
    totals: [
      { type: "new_orders_day", segment: null, value: 12 },
      { type: "placed_value_by_market_day", segment: marketId, value: 125_000 },
      { type: "unique_visitors_day", segment: null, value: 340 },
    ],
    breakdowns: [
      { type: "page_views_by_page_day", segments: [{ segment: "/", value: 90 }], other_segments: 3, other_value: 12 },
    ],
    series: [],
  };
  const calls = recordFetch(context, () => answer);
  const totals = [
    { type: "new_orders_day" },
    { type: "placed_value_by_market_day", segment: marketId },
    { type: "unique_visitors_day" },
  ];
  const breakdowns = [{ type: "page_views_by_page_day", limit: 10 }];
  const read = await admin().counts.report({ store_id: storeId, from: "2026-09-17", to: "2026-10-16", totals, breakdowns });
  assert.deepEqual(read, answer);
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].path, `/v1/stores/${storeId}/counts/report`);
  assert.deepEqual(calls[0].query, {
    from: "2026-09-17",
    to: "2026-10-16",
    totals: JSON.stringify(totals),
    breakdowns: JSON.stringify(breakdowns),
  });
  assert.equal(calls[0].url.searchParams.has("series"), false);
  assert.equal(calls[0].url.searchParams.has("store_id"), false);
});

test("count reads refuse a store id that is not canonical before sending", async (context) => {
  const calls = recordFetch(context, () => ({ counts: [] }));
  await assert.rejects(async () => admin().counts.statuses({ store_id: "", types: ["orders_by_status"] }), TypeError);
  await assert.rejects(
    async () => admin().counts.report({ store_id: "", from: "2026-10-01", to: "2026-10-02", totals: [{ type: "new_orders_day" }] }),
    TypeError,
  );
  assert.equal(calls.length, 0);
});
