import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const tenantId = "6d2b8f41-3a75-4c09-9e1d-7b5c2a8f0e36";
const marketId = "1c8e4a97-5d23-4f60-b9a1-3e7d5c0b2f84";

function admin() {
  return createAdmin({ apiUrl: "https://counts.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
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
      { type: "users_by_link", segments: [{ segment: "anonymous", value: 4 }, { segment: "linked", value: 1 }] },
    ],
  };
  const calls = recordFetch(context, () => answer);
  const read = await admin().counts.getStatuses({ tenant_id: tenantId, types: ["orders_by_status", "users_by_link"] });
  assert.deepEqual(read, answer);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].body, null);
  assert.equal(calls[0].path, `/v1/tenants/${tenantId}/counts/statuses`);
  assert.deepEqual(calls[0].query, { types: JSON.stringify(["orders_by_status", "users_by_link"]) });
});

test("a count report sends its span and reads as JSON query values and leaves out reads it does not name", async (context) => {
  const answer = {
    from: "2026-09-17",
    to: "2026-10-16",
    totals: [
      { type: "orders_placed_day", segment: null, value: 12 },
      { type: "placed_value_by_market_day", segment: marketId, value: 125_000 },
      { type: "unique_visitors_day", segment: null, value: 340 },
    ],
    breakdowns: [
      { type: "page_views_by_page_day", segments: [{ segment: "/", value: 90 }], other_segments: 3, other_value: { type: "count", value: 12 } },
      { type: "placed_value_by_market_day", segments: [{ segment: marketId, value: 125_000 }], other_segments: 2, other_value: { type: "money", currencies: [{ currency: "eur", value: 4_000 }, { currency: "bam", value: 9_100 }] } },
    ],
    series: [],
  };
  const calls = recordFetch(context, () => answer);
  const totals = [
    { type: "orders_placed_day" },
    { type: "placed_value_by_market_day", segment: marketId },
    { type: "unique_visitors_day" },
  ];
  const breakdowns = [{ type: "page_views_by_page_day", limit: 10 }];
  const read = await admin().counts.getReport({ tenant_id: tenantId, from: "2026-09-17", to: "2026-10-16", totals, breakdowns });
  assert.deepEqual(read, answer);
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].path, `/v1/tenants/${tenantId}/counts/report`);
  assert.deepEqual(calls[0].query, {
    from: "2026-09-17",
    to: "2026-10-16",
    totals: JSON.stringify(totals),
    breakdowns: JSON.stringify(breakdowns),
  });
  assert.equal(calls[0].url.searchParams.has("series"), false);
  assert.equal(calls[0].url.searchParams.has("tenant_id"), false);
});

test("status counts read what a tenant still has open, with every segment the Server returns", async (context) => {
  const open = [
    "open_recurring_members_by_status",
    "open_rentals_by_status",
    "open_payments_by_type",
    "open_shipments_by_type",
  ];
  const answer = {
    counts: [
      {
        type: "open_recurring_members_by_status",
        segments: [
          { segment: "awaiting_activation", value: 1 },
          { segment: "active", value: 3 },
          { segment: "blocked", value: 0 },
          { segment: "paused", value: 2 },
        ],
      },
      {
        type: "open_rentals_by_status",
        segments: [
          { segment: "waiting", value: 2 },
          { segment: "active", value: 1 },
          { segment: "ending", value: 1 },
        ],
      },
      {
        type: "open_payments_by_type",
        segments: [
          { segment: "stripe_checkout", value: 0 },
          { segment: "stripe_card", value: 1 },
          { segment: "monri_checkout", value: 2 },
          { segment: "monri_card", value: 0 },
          { segment: "recorded", value: 0 },
        ],
      },
      {
        type: "open_shipments_by_type",
        segments: [
          { segment: "fulfillment_job", value: 4 },
          { segment: "fulfillment", value: 1 },
        ],
      },
    ],
  };
  const calls = recordFetch(context, () => answer);
  const read = await admin().counts.getStatuses({ tenant_id: tenantId, types: open });
  assert.deepEqual(read, answer);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].path, `/v1/tenants/${tenantId}/counts/statuses`);
  assert.deepEqual(calls[0].query, { types: JSON.stringify(open) });
});

test("upcoming booked slots are one day total over the span the caller names", async (context) => {
  const answer = {
    from: "2026-10-17",
    to: "2027-10-16",
    totals: [{ type: "booked_slots_day", segment: null, value: 7 }],
    breakdowns: [],
    series: [],
  };
  const calls = recordFetch(context, () => answer);
  const read = await admin().counts.getReport({
    tenant_id: tenantId,
    from: "2026-10-17",
    to: "2027-10-16",
    totals: [{ type: "booked_slots_day" }],
  });
  assert.deepEqual(read, answer);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, `/v1/tenants/${tenantId}/counts/report`);
  assert.deepEqual(calls[0].query, {
    from: "2026-10-17",
    to: "2027-10-16",
    totals: JSON.stringify([{ type: "booked_slots_day" }]),
  });
});

test("conversation counts name the team's waiting segment as the Server does", async (context) => {
  const answer = {
    counts: [
      {
        type: "conversations_by_status",
        segments: [
          { segment: "flow", value: 2 },
          { segment: "waiting_for_tenant", value: 5 },
          { segment: "resolved", value: 9 },
        ],
      },
      { type: "broadcasts_by_status", segments: [{ segment: "draft", value: 1 }, { segment: "scheduled", value: 0 }, { segment: "sending", value: 0 }, { segment: "sent", value: 3 }] },
    ],
  };
  const calls = recordFetch(context, () => answer);
  const read = await admin().counts.getStatuses({ tenant_id: tenantId, types: ["conversations_by_status", "broadcasts_by_status"] });
  assert.deepEqual(read, answer);
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [
    ["GET", `/v1/tenants/${tenantId}/counts/statuses`, { types: JSON.stringify(["conversations_by_status", "broadcasts_by_status"]) }],
  ]);
});

test("count reads refuse a tenant id that is not canonical before sending", async (context) => {
  const calls = recordFetch(context, () => ({ counts: [] }));
  await assert.rejects(async () => admin().counts.getStatuses({ tenant_id: "", types: ["orders_by_status"] }), TypeError);
  await assert.rejects(
    async () => admin().counts.getReport({ tenant_id: "", from: "2026-10-01", to: "2026-10-02", totals: [{ type: "orders_placed_day" }] }),
    TypeError,
  );
  assert.equal(calls.length, 0);
});

test("a report reads bookings by day and a location's money inside one market", async (context) => {
  const locationId = "3f9d2c71-6b84-4e05-a1d3-9c7e5b2a0f68";
  const answer = {
    from: "2026-10-01",
    to: "2026-10-31",
    totals: [
      { type: "booking_lines_by_status_day", market_id: null, segment: "no_show", value: 3 },
      { type: "paid_value_by_location_day", market_id: marketId, segment: locationId, value: 42_000 },
    ],
    breakdowns: [
      {
        type: "paid_value_by_location_day",
        market_id: marketId,
        segments: [{ segment: locationId, value: 42_000 }],
        other_segments: 1,
        other_value: { type: "money", currencies: [{ currency: "bam", value: 9_000 }] },
      },
    ],
    series: [],
  };
  const calls = recordFetch(context, () => answer);
  const totals = [
    { type: "booking_lines_by_status_day", segment: "no_show" },
    { type: "paid_value_by_location_day", market_id: marketId, segment: locationId },
  ];
  const breakdowns = [{ type: "paid_value_by_location_day", market_id: marketId, limit: 1 }];
  const read = await admin().counts.getReport({ tenant_id: tenantId, from: "2026-10-01", to: "2026-10-31", totals, breakdowns });
  assert.deepEqual(read, answer);
  assert.equal(calls[0].path, `/v1/tenants/${tenantId}/counts/report`);
  assert.deepEqual(calls[0].query, {
    from: "2026-10-01",
    to: "2026-10-31",
    totals: JSON.stringify(totals),
    breakdowns: JSON.stringify(breakdowns),
  });
});

test("a report reads one branch's bookings by outcome and by sales channel under the branch id", async (context) => {
  const locationId = "3f9d2c71-6b84-4e05-a1d3-9c7e5b2a0f68";
  const channelId = "5a7c9e1b-3d4f-4a6b-8c0d-2e4f6a8b0c1d";
  const answer = {
    from: "2026-11-01",
    to: "2026-11-30",
    totals: [{ type: "booking_lines_by_location_status_day", market_id: null, tenant_location_id: locationId, segment: "attended", value: 14 }],
    breakdowns: [
      {
        type: "bookings_by_location_sales_channel_day",
        market_id: null,
        tenant_location_id: locationId,
        segments: [{ segment: channelId, value: 9 }],
        other_segments: 0,
        other_value: { type: "count", value: 0 },
      },
    ],
    series: [{ type: "booking_lines_by_location_status_day", market_id: null, tenant_location_id: locationId, segment: "no_show", points: [] }],
  };
  const calls = recordFetch(context, () => answer);
  const totals = [{ type: "booking_lines_by_location_status_day", tenant_location_id: locationId, segment: "attended" }];
  const breakdowns = [{ type: "bookings_by_location_sales_channel_day", tenant_location_id: locationId, limit: 5 }];
  const series = [{ type: "booking_lines_by_location_status_day", tenant_location_id: locationId, segment: "no_show" }];
  const read = await admin().counts.getReport({ tenant_id: tenantId, from: "2026-11-01", to: "2026-11-30", totals, breakdowns, series });
  assert.deepEqual(read, answer);
  assert.deepEqual(calls[0].query, {
    from: "2026-11-01",
    to: "2026-11-30",
    totals: JSON.stringify(totals),
    breakdowns: JSON.stringify(breakdowns),
    series: JSON.stringify(series),
  });
});

test("a report reads one booking resource's lines by outcome under the resource id, and the answer names the resource", async (context) => {
  const resourceId = "7b9d1f3a-5c2e-4a6b-8d0f-1a3c5e7b9d2f";
  const answer = {
    from: "2026-11-01",
    to: "2026-11-30",
    totals: [{ type: "booking_lines_by_resource_status_day", market_id: null, tenant_location_id: null, booking_resource_id: resourceId, segment: "attended", value: 6 }],
    breakdowns: [
      {
        type: "booking_lines_by_resource_status_day",
        market_id: null,
        tenant_location_id: null,
        booking_resource_id: resourceId,
        segments: [{ segment: "no_show", value: 1 }],
        other_segments: 0,
        other_value: { type: "count", value: 0 },
      },
    ],
    series: [],
  };
  const calls = recordFetch(context, () => answer);
  const totals = [{ type: "booking_lines_by_resource_status_day", booking_resource_id: resourceId, segment: "attended" }];
  const breakdowns = [{ type: "booking_lines_by_resource_status_day", booking_resource_id: resourceId }];
  assert.deepEqual(await admin().counts.getReport({ tenant_id: tenantId, from: "2026-11-01", to: "2026-11-30", totals, breakdowns }), answer);
  assert.deepEqual(calls[0].query, {
    from: "2026-11-01",
    to: "2026-11-30",
    totals: JSON.stringify(totals),
    breakdowns: JSON.stringify(breakdowns),
  });
});
