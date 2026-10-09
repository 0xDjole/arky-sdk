import type { AnalyticsRequest, AnalyticsResponse, AnalyticsReport, AnalyticsReportRequest, AnalyticsTimeRange } from "./analytics";
import { SUPPORTED_STORE_CURRENCIES } from "../utils/price";

const SCOPES = {
  "business_overview": "period",
  "customer_funnel": "period",
  "customer_action_by_country": "period",
  "top_customer_action_pages": "period",
  "entity_status_overview": "current_snapshot",
  "data_health": "mixed",
  "orders_created": "period",
  "customers_created": "period",
  "form_submissions_created": "period",
  "carts_abandoned": "period",
  "media_count": "current_snapshot",
  "products_by_status": "current_snapshot",
  "services_by_status": "current_snapshot",
  "providers_by_status": "current_snapshot",
  "collections_by_status": "current_snapshot",
  "entries_by_status": "current_snapshot",
  "customers_by_status": "current_snapshot",
  "customer_groups_by_status": "current_snapshot",
  "broadcasts_by_status": "current_snapshot",
  "support_conversations_by_status": "current_snapshot",
  "forms_by_status": "current_snapshot",
  "categories_by_status": "current_snapshot",
  "carts_by_status": "current_snapshot",
  "orders_by_status": "current_snapshot",
  "order_products_by_status": "current_snapshot",
  "recent_customer_action": "period"
} as const;
const STATUS_ENTITIES = {
  "products_by_status": "product",
  "services_by_status": "booking_service",
  "providers_by_status": "booking_resource",
  "collections_by_status": "collection",
  "entries_by_status": "entry",
  "customers_by_status": "customer",
  "customer_groups_by_status": "customer_group",
  "broadcasts_by_status": "broadcast",
  "support_conversations_by_status": "support_conversation",
  "forms_by_status": "form",
  "categories_by_status": "category",
  "carts_by_status": "cart",
  "orders_by_status": "order",
  "order_products_by_status": "order_product_item"
} as const;
const STATUSES: Record<string, readonly string[]> = {
  "product": ["active", "draft", "archived", "deleting"],
  "booking_service": ["active", "draft", "archived", "deleting"],
  "booking_resource": ["active", "draft", "archived", "deleting"],
  "collection": ["active", "draft", "archived", "deleting"],
  "entry": ["active", "draft", "archived", "deleting"],
  "customer": ["active", "archived"],
  "customer_group": ["active", "deleting"],
  "broadcast": ["draft", "scheduled", "sending", "sent"],
  "support_conversation": ["flow", "ai", "escalated", "resolved"],
  "form": ["active", "draft", "closed"],
  "category": ["active", "draft", "archived", "deleting"],
  "cart": ["active", "abandoned", "converted", "superseded", "merged", "expired"],
  "order": ["pending", "confirmed", "partially_cancelled", "cancelled"],
  "order_product_item": ["pending", "confirmed", "cancelled"]
};
const FEED_CATEGORIES = ["orders", "carts", "submissions", "customers", "customer_groups", "products", "services", "providers", "content", "customer_actions"];
const CUSTOMER_STAGES = ["visitors", "new_email_known_customers", "new_verified_customers", "buyers"];
const BUSINESS_COUNTS = ["visitors", "new_visitors", "new_email_known_customers", "new_verified_customers", "buyers", "orders", "carts", "abandoned_carts"];
const BUSINESS_RATES = ["visitor_to_known_rate", "visitor_to_buyer_rate", "cart_abandonment_rate"];
const HEALTH_COUNTS = ["anonymous_customers", "known_customers", "duplicate_emails", "unknown_country_events", "unknown_device_events"];
const FEED_COUNTS = ["total", "orders", "submissions", "customers", "customer_groups", "abandoned_carts", "carts", "products", "services", "providers", "content", "customer_actions"];
const DAY = 86_400_000;

function fail(message: string): never { throw new Error(`Invalid analytics contract: ${message}`); }
function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail("expected an object");
  return value as Record<string, unknown>;
}
function fields(value: unknown, required: readonly string[], optional: readonly string[] = []): Record<string, unknown> {
  const row = object(value);
  for (const key of required) if (!Object.prototype.hasOwnProperty.call(row, key)) fail(`missing ${key}`);
  for (const key of Object.keys(row)) if (!required.includes(key) && !optional.includes(key)) fail(`unexpected ${key}`);
  return row;
}
function list(value: unknown, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) fail("expected a bounded list");
  return value;
}
function text(value: unknown, max = 8192): string {
  if (typeof value !== "string" || value.length > max) fail("expected a bounded string");
  return value;
}
function identity(value: unknown): string { const id = text(value, 256); if (!id) fail("missing identity"); return id; }
function integer(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) fail("expected an exact nonnegative integer");
  return value;
}
function timestamp(value: unknown): number { return integer(value); }
function decimal(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) fail("expected a finite nonnegative number");
  return value;
}
function currency(value: unknown): string {
  const code = text(value, 3);
  if (!SUPPORTED_STORE_CURRENCIES.some(item => item.toLowerCase() === code)) fail("unknown currency");
  return code;
}
function rate(value: unknown): void {
  const row = fields(value, ["numerator", "denominator", "value"]);
  const numerator = integer(row.numerator), denominator = integer(row.denominator);
  if (denominator === 0) { if (row.value !== null) fail("undefined rate must be null"); }
  else if (Math.abs(decimal(row.value) - Math.round(numerator / denominator * 10000) / 100) > 1e-8) fail("rate disagrees with its counts");
}
function counts(row: Record<string, unknown>, names: readonly string[]): void { for (const name of names) integer(row[name]); }
function time(value: unknown, expected?: AnalyticsTimeRange): void {
  const row = fields(value, ["from", "to"]);
  const from = timestamp(row.from), to = timestamp(row.to);
  if (from >= to || to > 65535 * DAY || from % DAY || to % DAY) fail("invalid UTC calendar range");
  if (expected && (from !== expected.from || to !== expected.to)) fail("response changed its requested range");
}
function status(entity: string, value: unknown): string {
  const key = text(value, 64);
  if (!STATUSES[entity]?.includes(key)) fail(`unknown ${entity} status`);
  return key;
}
function statusItems(value: unknown, entity: string): void {
  const seen = new Set<string>();
  for (const item of list(value, 100)) {
    const row = fields(item, ["key", "label", "value"]);
    const key = status(entity, row.key);
    if (seen.has(key)) fail("duplicate status bucket");
    seen.add(key); text(row.label, 256); integer(row.value);
  }
}
function stages(value: unknown, expected: readonly string[]): void {
  const rows = list(value, expected.length);
  if (rows.length !== expected.length) fail("missing funnel stages");
  rows.forEach((value, index) => {
    const row = fields(value, ["key", "label", "value"]);
    if (row.key !== expected[index]) fail("funnel stage mismatch");
    text(row.label, 256); integer(row.value);
  });
}
function custom(value: unknown, depth = 0, budget = { nodes: 0 }): void {
  if (depth > 64 || ++budget.nodes > 100000) fail("Custom fact exceeds its structure bound");
  if (value === null || typeof value === "boolean" || typeof value === "string") return;
  if (typeof value === "number") { if (!Number.isFinite(value)) fail("invalid Custom number"); return; }
  if (Array.isArray(value)) { for (const item of value) custom(item, depth + 1, budget); return; }
  for (const item of Object.values(object(value))) custom(item, depth + 1, budget);
}
function feedFact(value: unknown, row: Record<string, unknown>, storeId: string): void {
  const data = object(value), entity = text(row.entity, 64);
  if (data.store_id !== storeId || data.entity_id !== row.entity_id) fail("feed fact owner mismatch");
  const categories: Record<string, string> = {
    order: "orders", cart: "carts", form_submission: "submissions", customer: "customers",
    customer_group: "customer_groups", product: "products", booking_service: "services",
    booking_resource: "providers", collection: "content", entry: "content", form: "content",
    email_template: "content", category: "content", customer_action: "customer_actions"
  };
  if (!Object.prototype.hasOwnProperty.call(categories, entity) || row.category !== categories[entity]) fail("feed category mismatch");
  const actions = entity === "customer_action" ? ["recorded"] : entity === "order"
    ? ["created", "updated", "confirmed", "payment_received", "payment_failed", "cancelled", "refunded"]
    : entity === "cart" ? ["created", "updated", "converted", "abandoned"]
    : entity === "customer" ? ["created", "updated", "archived", "consolidated"]
    : entity === "form_submission" ? ["created"] : ["created", "updated", "deleted"];
  if (!actions.includes(text(row.action, 64)) || (entity !== "customer_action" && row.event_type !== `${entity}_${row.action}`)) fail("feed event identity mismatch");
  const base = ["store_id", "entity_id"];
  let expected = [...base];
  if (entity === "customer_action") {
    expected.push("customer_id", "customer_session_id", "key", "data", "country_code", "device_type");
    if (text(data.key, 256) !== row.event_type) fail("Custom fact key mismatch");
    object(data.data); custom(data.data);
    const encoded = JSON.stringify(data.data);
    if (new TextEncoder().encode(encoded).byteLength > 1024 * 1024) fail("Custom fact exceeds its byte bound");
    const country = text(data.country_code, 2); if (country && !/^[A-Z]{2}$/.test(country)) fail("invalid country code");
    if (!["", "desktop", "mobile", "tablet"].includes(text(data.device_type, 32))) fail("invalid device");
  } else if (entity === "customer" && row.action === "consolidated") {
    expected.push("source_customer_id", "target_customer_id", "consolidated_at");
    identity(data.source_customer_id); identity(data.target_customer_id); timestamp(data.consolidated_at);
  } else if (entity === "customer") {
    expected.push("email", "email_verified", "status"); text(data.email, 1024);
    if (typeof data.email_verified !== "boolean") fail("invalid customer verification");
  } else if (entity === "order") {
    expected.push("customer_id", "customer_session_id", "number", "status", "payment");
    text(data.number, 256); const money = fields(data.payment, ["currency", "total"]); currency(money.currency); integer(money.total);
  } else if (entity === "cart") expected.push("customer_id", "customer_session_id", "status");
  else if (entity === "form_submission") { expected.push("form_id", "customer_id", "customer_session_id"); identity(data.form_id); }
  else if ((entity === "customer_group" && row.action === "deleted") || entity === "email_template") {}
  else if (["product", "booking_service", "booking_resource", "collection", "entry", "form", "category", "customer_group"].includes(entity)) {
    expected.push("key", "status"); text(data.key, 1024);
    if (entity === "entry") { expected.push("collection_id"); identity(data.collection_id); }
  } else fail("unknown feed fact owner");
  fields(data, expected);
  if (Object.prototype.hasOwnProperty.call(data, "customer_id")) {
    if (data.customer_id !== null) identity(data.customer_id);
    if ((data.customer_id ?? "") !== row.customer_id) fail("feed customer mismatch");
  } else if (row.customer_id !== "") fail("unexpected feed customer");
  if (Object.prototype.hasOwnProperty.call(data, "customer_session_id") && data.customer_session_id !== null) identity(data.customer_session_id);
  if (Object.prototype.hasOwnProperty.call(data, "status")) {
    const retained = fields(row.status, ["type"]);
    if (status(entity, data.status) !== retained.type) fail("feed status mismatch");
  } else if (row.status !== null) fail("unexpected feed status");
}
function feed(value: unknown, storeId: string): void {
  const data = fields(value, ["items", "summary", "next_cursor", "meta"]);
  const items = list(data.items, 100), ids = new Set<string>();
  let previous: { at: number; id: string } | null = null;
  for (const item of items) {
    const row = fields(item, ["id", "entity", "entity_id", "action", "event_type", "status", "customer_id", "category", "title", "description", "href", "data", "created_at"]);
    const id = identity(row.id), at = timestamp(row.created_at);
    identity(row.entity_id); identity(row.action); identity(row.event_type); text(row.customer_id, 256);
    if (ids.has(id) || (previous && (at > previous.at || (at === previous.at && id >= previous.id)))) fail("feed order or identity mismatch");
    ids.add(id); previous = { at, id };
    if (!FEED_CATEGORIES.includes(text(row.category, 64))) fail("unknown feed category");
    text(row.title); text(row.description); if (row.href !== null) text(row.href);
    feedFact(row.data, row, storeId);
  }
  const summary = fields(data.summary, [...FEED_COUNTS, "window_start"]); counts(summary, FEED_COUNTS); timestamp(summary.window_start);
  const meta = fields(data.meta, ["row_count", "execution_ms"]); integer(meta.execution_ms);
  if (integer(meta.row_count) !== items.length) fail("feed row count mismatch");
  if (data.next_cursor !== null) {
    const cursor = fields(data.next_cursor, ["created_at", "id"]);
    if (!previous || timestamp(cursor.created_at) !== previous.at || identity(cursor.id) !== previous.id) fail("feed continuation mismatch");
  }
}
function assertReport(value: unknown, storeId: string): asserts value is AnalyticsReport {
  const row = fields(value, ["key", "scope", "data"]), key = text(row.key, 64);
  if (!Object.prototype.hasOwnProperty.call(SCOPES, key) || row.scope !== SCOPES[key as keyof typeof SCOPES]) fail("unknown report or incorrect scope");
  const data = object(row.data);
  switch (key) {
    case "business_overview": { fields(data, [...BUSINESS_COUNTS, ...BUSINESS_RATES, "revenue_by_currency"]); counts(data, BUSINESS_COUNTS); for (const name of BUSINESS_RATES) rate(data[name]);
      const seen = new Set<string>();
      for (const item of list(data.revenue_by_currency, 100)) {
        const row = fields(item, ["currency", "orders", "revenue", "average_order_value"]), code = currency(row.currency);
        if (seen.has(code)) fail("duplicate revenue currency"); seen.add(code);
        const orders = integer(row.orders), revenue = integer(row.revenue);
        if (orders === 0) { if (row.average_order_value !== null) fail("undefined average must be null"); }
        else if (Math.abs(decimal(row.average_order_value) - Math.round(revenue / orders * 100) / 100) > 1e-8) fail("average value mismatch");
      } break; }
    case "customer_funnel": { fields(data, ["stages", "visitor_to_known_rate", "visitor_to_buyer_rate"]); stages(data.stages, CUSTOMER_STAGES); rate(data.visitor_to_known_rate); rate(data.visitor_to_buyer_rate); break; }
    case "customer_action_by_country": { fields(data, ["items"]);
      const seen = new Set<string>();
      for (const item of list(data.items, 1000)) {
        const entry = fields(item, ["key", "label", "value", "unique_profiles", "unique_visitors"]);
        const key = text(entry.key), count = integer(entry.value), unique = integer(entry.unique_visitors);
        if (seen.has(key) || text(entry.label) !== key || integer(entry.unique_profiles) !== unique || unique > count) fail("invalid dimension bucket");
        seen.add(key);
        if (key && !/^[A-Z]{2}$/.test(key)) fail("invalid country");
      } break; }
    case "top_customer_action_pages": { fields(data, ["items"]);
      const seen = new Set<string>();
      for (const item of list(data.items, 100)) {
        const entry = fields(item, ["key", "label", "value", "unique_profiles", "unique_visitors"]);
        const key = text(entry.key), count = integer(entry.value), unique = integer(entry.unique_visitors);
        if (seen.has(key) || text(entry.label) !== key || integer(entry.unique_profiles) !== unique || unique > count) fail("invalid dimension bucket");
        seen.add(key);
      } break; }
    case "entity_status_overview": { fields(data, ["entities"]); const entities = fields(data.entities, Object.values(STATUS_ENTITIES)); for (const [entity, items] of Object.entries(entities)) statusItems(items, entity); break; }
    case "data_health": { fields(data, HEALTH_COUNTS); counts(data, HEALTH_COUNTS); break; }
    case "orders_created": { fields(data, ["value"]); integer(data.value); break; }
    case "customers_created": { fields(data, ["value"]); integer(data.value); break; }
    case "form_submissions_created": { fields(data, ["value"]); integer(data.value); break; }
    case "carts_abandoned": { fields(data, ["value"]); integer(data.value); break; }
    case "media_count": { fields(data, ["value"]); integer(data.value); break; }
    case "products_by_status": { fields(data, ["items"]); statusItems(data.items, "product"); break; }
    case "services_by_status": { fields(data, ["items"]); statusItems(data.items, "booking_service"); break; }
    case "providers_by_status": { fields(data, ["items"]); statusItems(data.items, "booking_resource"); break; }
    case "collections_by_status": { fields(data, ["items"]); statusItems(data.items, "collection"); break; }
    case "entries_by_status": { fields(data, ["items"]); statusItems(data.items, "entry"); break; }
    case "customers_by_status": { fields(data, ["items"]); statusItems(data.items, "customer"); break; }
    case "customer_groups_by_status": { fields(data, ["items"]); statusItems(data.items, "customer_group"); break; }
    case "broadcasts_by_status": { fields(data, ["items"]); statusItems(data.items, "broadcast"); break; }
    case "support_conversations_by_status": { fields(data, ["items"]); statusItems(data.items, "support_conversation"); break; }
    case "forms_by_status": { fields(data, ["items"]); statusItems(data.items, "form"); break; }
    case "categories_by_status": { fields(data, ["items"]); statusItems(data.items, "category"); break; }
    case "carts_by_status": { fields(data, ["items"]); statusItems(data.items, "cart"); break; }
    case "orders_by_status": { fields(data, ["items"]); statusItems(data.items, "order"); break; }
    case "order_products_by_status": { fields(data, ["items"]); statusItems(data.items, "order_product_item"); break; }
    case "recent_customer_action": { feed(data, storeId); break; }
    default: fail("unsupported report");
  }
}
function reportSet(value: unknown, requested: AnalyticsReportRequest[], range: AnalyticsTimeRange, storeId: string): void {
  const reports = list(value, 64);
  if (reports.length !== requested.length) fail("missing report results");
  reports.forEach((value, index) => {
    assertReport(value, storeId);
    const request = requested[index];
    if (value.key !== request.key) fail("report correlation mismatch");
    if (request.key === "recent_customer_action" && value.key === request.key) {
      if (value.data.items.length > (request.limit ?? 30) || value.data.summary.window_start !== range.from) fail("feed range or limit mismatch");
      for (const item of value.data.items) if (item.created_at < range.from || item.created_at >= range.to || (request.category && request.category !== item.category) || (request.cursor_created_at !== undefined && (item.created_at > request.cursor_created_at || (item.created_at === request.cursor_created_at && item.id >= request.cursor_id)))) fail("feed request binding mismatch");
    }
    if (request.key === "customer_action_by_country" && value.key === request.key && value.data.items.length > (request.limit ?? 200)) fail("country limit mismatch");
    if (request.key === "top_customer_action_pages" && value.key === request.key && value.data.items.length > (request.limit ?? 20)) fail("page limit mismatch");
  });
}
function assertResponse(value: unknown, request: AnalyticsRequest, storeId: string): asserts value is AnalyticsResponse {
  if (request.blocks !== undefined) {
    const row = fields(value, ["blocks"]), blocks = list(row.blocks, 16);
    if (blocks.length !== request.blocks.length) fail("missing analytics blocks");
    blocks.forEach((value, index) => {
      const block = fields(value, ["id", "time", "reports"]), expected = request.blocks![index];
      if (block.id !== expected.id) fail("block correlation mismatch");
      time(block.time, expected.time); reportSet(block.reports, expected.reports, expected.time, storeId);
    });
  } else {
    const row = fields(value, ["time", "reports"]);
    time(row.time, request.time); reportSet(row.reports, request.reports, request.time, storeId);
  }
}
export function parseAnalyticsResponse(value: unknown, request: AnalyticsRequest, storeId: string): AnalyticsResponse {
  assertResponse(value, request, storeId);
  return value;
}
export function validateAnalyticsRequest(request: AnalyticsRequest): void {
  const row = object(request);
  const sets = Object.prototype.hasOwnProperty.call(row, "blocks") ? (() => {
    fields(row, ["blocks"]);
    const blocks = list(row.blocks, 16), ids = new Set<string>();
    if (!blocks.length) fail("empty block request");
    return blocks.map(value => {
      const block = fields(value, ["id", "time", "reports"]), id = identity(block.id);
      if (!/^[a-zA-Z0-9_.-]{1,64}$/.test(id) || ids.has(id)) fail("invalid block identity");
      ids.add(id); return block;
    });
  })() : [fields(row, ["time", "reports"])];
  let work = 0, total = 0;
  for (const set of sets) {
    time(set.time); const reports = list(set.reports, 64), keys = new Set<string>();
    if (!reports.length) fail("empty report set");
    total += reports.length;
    for (const value of reports) {
      const report = object(value), key = text(report.key, 64);
      if (!Object.prototype.hasOwnProperty.call(SCOPES, key) || keys.has(key)) fail("unknown or repeated report"); keys.add(key);
      const feed = key === "recent_customer_action", limit = feed || key === "customer_action_by_country" || key === "top_customer_action_pages";
      fields(report, ["key"], feed ? ["limit", "category", "cursor_created_at", "cursor_id"] : limit ? ["limit"] : []);
      if (report.limit !== undefined && report.limit !== null) { const n = integer(report.limit); if (!n || n > (key === "customer_action_by_country" ? 1000 : 100)) fail("invalid report limit"); }
      if (report.category !== undefined && report.category !== null && !FEED_CATEGORIES.includes(text(report.category, 64))) fail("unknown feed category");
      if ((report.cursor_created_at != null) !== (report.cursor_id != null)) fail("partial feed cursor");
      if (report.cursor_created_at != null) { timestamp(report.cursor_created_at); identity(report.cursor_id); }
      work += key === "business_overview" || key === "customer_funnel" ? 8 : key === "entity_status_overview" ? 14 : key === "data_health" ? 3 : feed ? 2 : 1;
    }
  }
  if (total > 64 || work > 128) fail("analytics work bound exceeded");
}
