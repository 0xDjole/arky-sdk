# arky-sdk

Official TypeScript SDK for [Arky](https://arky.io), the website backend and Admin client for custom frontends.

## Installation

```bash
npm install arky-sdk
```

## Storefront quick start

The next coordinated browser contract on `develop` is `arky-sdk@0.26.2`. After that exact version
is released from protected `master`, pin it so the Server, App, and storefront route/header
contracts move together:

```bash
npm install --save-exact arky-sdk@0.26.2
```

Copy the Store publishable key from Developer and initialize one client:

```typescript
import { initialize } from "arky-sdk/storefront";

export const arky = initialize(import.meta.env.PUBLIC_ARKY_PUBLISHABLE_KEY);
```

`initialize` is synchronous. It makes no request and creates no visitor. Production requests use `https://api.arky.io` by default.

For local development or an explicit initial context:

```typescript
export const arky = initialize("arky_pk_...", {
  apiUrl: "http://localhost:8000",
  locale: "it",
  market: "ita",
});
```

The SDK accepts only an `arky_pk_...` publishable key. A personal `arky_api_...` token or a Customer-session credential is rejected at initialization. Publishable keys identify a Store; they grant no Admin access and are safe to include in browser code.

## Read content and submit forms

Anonymous Content and catalog reads do not create a visitor:

```typescript
const page = await arky.content.entry.get({
  collection_id: "pages",
  key: "homepage",
});

const titleBlock = page.blocks.find((block) => block.key === "title");
const title = arky.utils.getBlockTextValue(titleBlock, arky.getLocale());
```

Localized content uses the shared Block vocabulary: the field is an `object`, each locale is a key,
and each locale value is a propertyless `text` or `markdown` Block. There is no separate
localized-text Block or schema type, and a standalone `markdown` Block always has one scalar string
value:

```typescript
import type { Block } from "arky-sdk";

const title = {
  id: "title",
  key: "title",
  type: "object",
  value: {
    en: { id: "title-en", key: "en", type: "text", value: "Welcome" },
    it: { id: "title-it", key: "it", type: "text", value: "Benvenuto" },
  },
} satisfies Block;
```

Relationship constraints such as `collection_id` and `on_delete` live only on `BlockSchema`.
A `form` Block contains a Form ID; submitting that Form still produces a separate immutable
FormSubmission.

Stateful operations identify the visitor lazily. Concurrent first operations share one identify request:

```typescript
await arky.forms.submitByKey({
  key: "contact",
  values: {
    email: "visitor@example.com",
    message: "Hello from the storefront",
  },
});
```

The browser persists one versioned, discriminated Customer-session record. A Visitor record contains
its short-lived token; an email-authenticated record contains the current access and refresh
credentials. Requesting a code returns only a safe Visitor view and retains the existing token in
that record. Verification and refresh replace the full record atomically; refresh sends only the
body credential with the Store's publishable key and never sends an access-token Authorization
header. Customer credentials use the `customer_visitor_`,
`customer_access_`, and `customer_refresh_` prefixes; `arky_vst_` is rejected. Storage is isolated by
API endpoint and a fingerprint of the publishable key.

## Actions and experiments

Customer and business facts use the Actions surface across the SDK. Tracking an action
creates a visitor session when needed:

```typescript
await arky.actions.track({
  key: "product.view",
  data: { product_id: "product-id" },
});

await arky.actions.pageView({ path: window.location.pathname });
```

The low-level storefront equivalent is `arky.client.actions.track(...)`. Admin integrations read
the same append-only facts through `admin.actions.find(...)`; Customer search filters them with
`has_customer_action`.

Experiment definitions expose `goal_action_key`, while storefront assignment responses expose no
goal data. Analytics report requests use `customer_action_by_country`,
`top_customer_action_pages`, and `recent_customer_action`; the corresponding feed category and
summary field are `customer_actions`. Event payloads and payment flows still use `action` where
that word describes a command or verb rather than the Actions domain.

## Products, booking services, and checkout

```typescript
const { items: products } = await arky.eshop.product.list({ limit: 20 });
const product = await arky.eshop.product.get({ id: products[0].id });
const inventory = await arky.eshop.product.getInventory({ id: product.id });

console.log(product.slugs.en, product.status);
console.log(arky.utils.getFreeToSellStock({ inventory }));

await arky.eshop.cart.addProduct(product, product.variants[0], 2);
await arky.eshop.cart.quote();

const checkout = await arky.eshop.cart.checkout({
  payment_provider_id: "payment-provider-id",
});
```

Cart responses expose the three canonical embedded collections: `product_items`,
`booking_items`, and `digital_items`. A Form submission belongs to the individual item through
`form_submission_id`; Cart requests and responses no longer carry one cart-wide `forms` array.
Low-level quote calls use `ProductQuoteInput`, `BookingQuoteInput`, and
`DigitalProductQuoteInput`, while Cart mutations use `CartProductInput`, `CartBookingInput`, and
`CartDigitalItemInput`. Trusted Admin mutations accept the corresponding `TrustedCart*` inputs
with `price_override`.

Product variants expose optional `weight_grams`. Inventory is a separate resource keyed by
`product_id`, `variant_id`, and `store_location_id`; it persists `on_hand` and `reserved`, while
free-to-sell stock is always derived as `on_hand - reserved`.

Booking services use the same Cart. A BookingResource is the person, place, or equipment that
performs the service; a BookingOffering connects one service to one resource and owns its price,
availability, booking window, and reminders:

```typescript
await arky.customer.requestCode({ email: "customer@example.com" });
await arky.customer.verify({ code: "code-from-email" });

const { items: services } = await arky.eshop.bookingService.list({ limit: 20 });

await arky.eshop.bookingService.initialize();
await arky.eshop.bookingService.select(services[0]);
arky.eshop.bookingService.findFirstAvailable();

const state = arky.eshop.bookingService.state.get();
if (state.slots[0]) {
  arky.eshop.bookingService.selectTimeSlot(state.slots[0]);
  arky.eshop.bookingService.nextStep();
  await arky.eshop.bookingService.addToCart();
}
```

Booking Service and Booking Resource records persist localized `slugs`. The singular lookup
selector remains `slug`:

```typescript
const service = await arky.eshop.bookingService.get({ slug: "consultation" });
console.log(service.slugs.en);
```

One Cart booking item is one appointment and contains one `booking_offering_id` plus one
`requested_interval`. BookingOffering does not configure Forms. If application code submits a
standalone Form first, pass only its resulting submission ID with the appointment:

```typescript
const submission = await arky.forms.submitByKey({
  key: "booking-details",
  values: { note: "Window seat, please" },
});

await arky.eshop.bookingService.addToCart(undefined, submission.id);
```

Completed Orders embed `product_items`, `booking_items`, and `digital_items`; the child item
snapshots, money, status, Form submission ID, and timestamps arrive with the Order. Product items
also expose their inventory allocations. There are no separate Order product, digital, Booking, or
OrderBooking read resources.

Confirmed booking items have dedicated lifecycle commands. Admin clients can cancel, complete, or
mark an item as a no-show; only the owning EmailAuthenticated CustomerSession can cancel through the
Storefront client.
Each command returns the refreshed Order, and cancellation never implies a payment refund:

```typescript
import { createAdmin } from "arky-sdk/admin";

const bookingCheckout = await arky.eshop.cart.checkout({
  payment_provider_id: "payment-provider-id",
});
const customerOrder = await arky.eshop.order.get({
  id: bookingCheckout.order_id,
});
const admin = createAdmin({
  baseUrl: "https://api.arky.io",
  storeId: "store-id",
  market: "eu",
  apiToken: process.env.ARKY_PERSONAL_API_TOKEN,
});
const adminOrder = await admin.eshop.order.get({
  id: "another-confirmed-booking-order-id",
});

await admin.eshop.order.completeBookingItem({
  order_id: adminOrder.id,
  order_booking_item_id: adminOrder.booking_items[0].id,
});

await arky.eshop.order.cancelBookingItem({
  order_id: customerOrder.id,
  order_booking_item_id: customerOrder.booking_items[0].id,
});
```

Those are separate terminal alternatives on different confirmed items. One item cannot be
completed and then cancelled (or moved to any other terminal state).

Nano Stores expose reactive module state:

```typescript
const unsubscribe = arky.eshop.cart.snapshot.subscribe((snapshot) => {
  console.log(snapshot.item_count, snapshot.cart?.id);
});

await arky.eshop.cart.load();
unsubscribe();
```

## Locale and market context

Locale and market are independent. Neither is inferred from the other, browser language, IP address, or geolocation:

```typescript
arky.setContext({ locale: "bs" });
arky.setContext({ market: "bih" });
```

Use an isolated scoped client for SSR, static generation, or parallel contexts:

```typescript
const italian = arky.withContext({ locale: "it", market: "ita" });
const page = await italian.content.entry.get({
  collection_id: "pages",
  key: "homepage",
});
```

Changing the scoped client does not mutate the original client. A market change while the cart contains items throws `CART_MARKET_LOCKED`; the SDK never silently clears or reprices the cart.

## Embedded card checkout

Store setup is fetched lazily and deduplicated:

```typescript
const setup = await arky.store.load();
console.log(setup.languages.default, setup.markets.default);
console.log(setup.payment_providers); // [{ id, type: "cash_on_delivery" | "stripe" }]
```

The Storefront setup exposes only each provider UUID and safe provider type. Stripe account,
capability, consent, and disablement evidence remain private Admin data.

Payment configuration belongs to Arky. A card checkout returns a short-lived embedded Stripe
action. The SDK mounts that exact Checkout Session inside the merchant page; it never redirects the
ordinary purchase to a Stripe-hosted Checkout page and it never exposes secret credentials:

```typescript
import { mountCheckoutAction } from "arky-sdk";

const result = await arky.eshop.cart.checkout({
  payment_provider_id: "stripe-payment-provider-id",
  return_url: window.location.href,
});

const mounted = await mountCheckoutAction(result.payment_action, "#payment", {
  onComplete: () => arky.eshop.order.get({ id: result.order_id }),
});

// Call mounted?.destroy() when the checkout view is disposed.
```

Purchase and paid Audience actions include a required `connected_account_id`. Store subscription
selection uses its separate checkout-action contract with nullable `stripe_account_id`;
`mountCheckoutAction` accepts either action without changing either wire shape.

Embedded Checkout completion and a browser return are navigation signals only. Authoritative Arky
state, advanced by a signed Stripe event or an exact provider read, settles the payment.

## SSR and static generation

Anonymous reads work without browser storage. Stateful SSR requires an explicit request-local adapter so a server module cannot retain one visitor across requests:

```typescript
const arky = initialize(process.env.ARKY_PUBLISHABLE_KEY!, {
  locale: requestLocale,
  market: requestMarket,
  sessionStorage: {
    getItem: (key) => requestSession.get(key) ?? null,
    setItem: (key, value) => requestSession.set(key, value),
    removeItem: (key) => requestSession.delete(key),
  },
});
```

Create one client per request. `withContext` also creates an isolated Customer session; when used during SSR it reuses the request-local adapter under a separate scoped storage key. The SDK does not ship framework-specific cookie adapters.

## Low-level storefront client

The module facade exposes its low-level client as `arky.client`:

```typescript
await arky.client.eshop.product.find({ limit: 20 });
const cart = await arky.client.eshop.cart.current();
await arky.client.eshop.cart.get({ id: cart.id, token: cart.token });
await arky.client.content.entry.find({
  collection_id: "pages",
  key: "homepage",
  limit: 1,
});
await arky.client.classification.get({ key: "topics" });
```

Low-level requests use Store-ID-free `/v1/storefront` routes and send connection context as headers:

```http
X-Arky-Publishable-Key: arky_pk_...
X-Arky-Locale: it
X-Arky-Market: ita
Authorization: Bearer <visitor-token-or-access-token>
```

For cart recovery, `cart.get({ id, token })` sends the recovery credential as
`X-Arky-Cart-Token`. It is never placed in the request URL or body, and the corresponding response
is private and non-cacheable.

Locale and market headers are omitted when no explicit context is set, allowing the server to use Store defaults.

## Configuration

```typescript
initialize(publishableKey: string, {
  apiUrl?: string,
  locale?: string,
  market?: string,
  sessionStorage?: StorefrontSessionStorage,
});
```

One storefront client always represents one publishable key and one Store. To connect to another Store, initialize a second explicit client with its publishable key.

## Releasing

SDK packages are released only by tagging the current protected `master` commit with the exact
`v<package.json version>` tag. The `Publish SDK` workflow reruns `npm test` and publishes through
npm trusted publishing with provenance; configure that workflow as the package's trusted publisher
instead of storing a long-lived npm token.

## Admin client

Private operator integrations use the separate Admin client. Personal API tokens must never be exposed in browser code:

```typescript
import { createAdmin } from "arky-sdk/admin";

const admin = createAdmin({
  baseUrl: "https://api.arky.io",
  storeId: "internal-store-id",
  apiToken: process.env.ARKY_PERSONAL_API_TOKEN,
});
```

Interactive operator login starts a pending Account Session. Verification activates that same
Session ID; token refresh returns a new Session while preserving `authenticated_at`:

```typescript
const pending = await admin.account.auth.code({
  email: "operator@example.com",
});
const session = await admin.account.auth.verify({
  session_id: pending.session_id,
  code: "123456",
});
```

Session listings are discriminated by `pending_verification`, `active`, `locked`, `superseded`,
or `revoked`. Expiry is derived from the deadline fields and is not a stored Session status.

The SDK keeps the wire/domain name `AccountApiToken`, while documentation and product copy call
these credentials Personal API Tokens. Expiry is determined from `expires_at`; token status is
only `active` or `revoked`.

Store connection management is available through the Admin surface:

```typescript
const store = await admin.store.regeneratePublishableKey({
  store_id: "internal-store-id",
});

await admin.store.update({
  id: store.id,
  name: "Arky Sarajevo",
  billing_email: "billing@example.com",
  contact_email: "team@example.com",
  default_market_id: "market-id",
  default_language: "en",
  supported_languages: ["en", "bs"],
});

const classifications = await admin.classification.find({ limit: 20 });
```

Admin Store records use `name`, private `billing_email`, optional public `contact_email`, and
explicit `default_language`/`supported_languages` fields. Creation requires an explicit billing
email. Omit `contact_email` on update to preserve it or send `null` to clear it; editing either
email never changes the other. Public `support.email` comes only from `contact_email`, with no
billing or Account fallback. Mailboxes own sender and reply-to identity, and staff notification
recipients remain explicitly configured. A new Store creates no inferred Mailbox. Physical places are exposed as `StoreLocation`
values with the shared `PostalAddress` shape. Webhooks and Build Hooks are addressed by UUID and
use `active`/`disabled` status values. Membership IDs are opaque, Server-generated UUID-v4 values;
`StoreUsage` represents one feature and either its current total or one UTC calendar month.
Booking quotas use the canonical `booking_services` and `booking_resources` feature keys.

Inspect skipped incoming emails through the Mailbox's read-only diagnostics:

```typescript
const issues = await admin.notification.mailbox.findSyncIssues({
  id: "mailbox-id",
  limit: 50,
});
```

Each page defaults to 50 records and accepts at most 100; pass the returned `cursor` explicitly
for the next page. Records contain an exact native IMAP or Gmail identity, a fixed safe reason
and message, and `observed_at` in epoch milliseconds. They contain no email body, headers,
attachments, or credentials. Inspection remains available after disconnect; there is no
diagnostic retry or purge command.

Manage Store-wide email restrictions through `admin.customers.emailSuppression`:

```typescript
const current = await admin.customers.emailSuppression.find({
  query: "person@example.com",
});
```

Exact email search returns at most two independent restrictions. Store-wide pages default to
50 rows, accept at most 100, and retain their cursor even when type/status filtering returns
an empty page. Use `block`/`unblock` for AdminBlock and `recordUnsubscribe`/`recordResubscribe`
for an actual recipient request. Mutations require a current same-Store Owner/Admin AccountSession
and a nonempty explanation; API tokens do not authorize these commands.

Activation takes a caller-generated UUID-v4 `id` and `command_id`, with explicit
`expected_version: null` for a new restriction. For an existing restriction, retain its ID and
pass the returned opaque `version` as `expected_version`. Release requires the current version.
Retry the identical command ID and payload after a lost response; never automatically generate a
replacement command. A conflict requires reviewing the new authoritative record. Responses contain
`{ restriction, version }`; `restriction.status.type` is `active` or `released`, with checked epoch
millisecond timestamps and latest-change evidence only.

Unsubscribe blocks automatic marketing; AdminBlock also blocks manual Campaign/Support email.
Neither blocks essential login, receipt, or booking messages. Releasing one restriction does not
release the other, restart Campaigns, resend cancelled email, or rejoin an Audience. No generic
update/delete, Send anyway, public email lookup, or recipient self-service release is exposed.

Store subscription reads expose the current `status` and optional `plan_access`; their
`payment_action` is `none`. Selecting a paid plan returns any transient payment action directly on
the subscription response, so callers complete that action without storing or retrieving a
separate checkout resource:

```typescript
const subscription = await admin.store.subscription.select({
  store_id: store.id,
  plan_id: "pro",
  return_url: "https://admin.example.com/billing/return",
});

if (subscription.payment_action.type !== "none") {
  await mountCheckoutAction(
    subscription.payment_action,
    "#subscription-checkout",
  );
}
```

Promotion commands use typed discount and condition variants. A create command omits embedded
discount IDs; each response returns a stable Server-generated UUID-v4. On update, include an
existing embedded ID to preserve that discount, and omit the ID for a new discount. Supplying a
discount array replaces the complete existing array:

```typescript
const promo = await admin.eshop.promoCode.createPromoCode({
  code: "WELCOME10",
  discounts: [{ type: "item_percentage", market: "bih", basis_points: 1_000 }],
  conditions: [
    { type: "products", product_ids: ["product-id"] },
    {
      type: "minimum_order_amount",
      market: "bih",
      money: { amount: 5_000, currency: "bam" },
    },
    { type: "maximum_uses_per_customer", count: 1 },
  ],
});

const itemDiscount = promo.discounts[0];
if (itemDiscount?.type === "item_percentage") {
  await admin.eshop.promoCode.updatePromoCode({
    id: promo.id,
    discounts: [
      { ...itemDiscount, basis_points: 1_500 },
      { type: "shipping_percentage", market: "bih", basis_points: 1_000 },
    ],
  });
}
```

`item_fixed` and `minimum_order_amount` carry a shared `Money` value. Redemption windows use
nullable `starts_at` and `ends_at`; per-customer limits use the Customer vocabulary.

Order refunds use one stable UUID-v4 for the concrete refund. Persist that ID with the immutable
request before sending or retrying a Stripe refund. After an operator has physically returned a
cash-on-delivery payment, record the completed return through the dedicated command:

```typescript
const result = await admin.eshop.order.recordCashOnDeliveryRefund({
  order_id: "order-id",
  refund_id: "persisted-refund-uuid-v4",
  amount: 2500,
  allocations: [
    { type: "product", item_id: "order-product-item-id", amount: 2500 },
  ],
  reason: "customer_request",
});

console.log(result.money.amount, result.money.currency, result.status);
```

Refund reads expose typed provider evidence, one `money` value, and canonical product, booking,
digital, shipping, or adjustment allocations. Payment disputes are read-only Stripe facts available
through `admin.eshop.order.getDisputes` and `admin.eshop.order.getDispute`; their public provider
evidence contains only `dispute_id` and `charge_id`.

To cancel part of an embedded product item, address its canonical item ID directly:

```typescript
await admin.eshop.order.cancelProductItem({
  order_id: "order-id",
  order_product_item_id: "order-product-item-id",
  quantity: 1,
});
```

## Fulfillment and shipping labels

Fulfillment work is scoped to a StoreLocation. Rate requests and Shipment lines address stable
embedded Order product-item IDs, while one Shipment freezes its parcel and optional customs facts:

```typescript
const [rate] = await admin.eshop.shipment.getRates({
  order_id: "6ba7b81a-9dad-41d1-80b4-00c04fd430c8",
  store_location_id: "6ba7b818-9dad-41d1-80b4-00c04fd430c8",
  lines: [
    {
      order_product_item_id: "6ba7b817-9dad-41d1-80b4-00c04fd430c8",
      quantity: 1,
    },
  ],
  parcel: {
    length: 150,
    width: 100,
    height: 50,
    weight: 750,
    distance_unit: "mm",
    mass_unit: "g",
  },
});

const result = await admin.eshop.shipment.create({
  order_id: "6ba7b81a-9dad-41d1-80b4-00c04fd430c8",
  shipment_id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
  rate_id: rate.id,
  origin_store_location_id: "6ba7b818-9dad-41d1-80b4-00c04fd430c8",
  fulfillment_order_id: "6ba7b813-9dad-41d1-80b4-00c04fd430c8",
  lines: [
    {
      order_product_item_id: "6ba7b817-9dad-41d1-80b4-00c04fd430c8",
      fulfillment_order_line_id: "6ba7b814-9dad-41d1-80b4-00c04fd430c8",
      quantity: 1,
    },
  ],
  parcel: {
    length: 150,
    width: 100,
    height: 50,
    weight: 750,
    distance_unit: "mm",
    mass_unit: "g",
  },
});

console.log(rate.postage, rate.platform_label_fee, rate.total);
console.log(result.shipment.label.total);
```

Every created Shipment owns its durable `ShippingLabel` from the initial `requested` state;
label-less Shipment responses are invalid. `ShippingLabel`, its optional embedded
`ShippingLabelRefund`, its `merchant_debit`, and its optional `merchant_debit_reversal` are
carrier- and payment-provider-neutral public DTOs:

```typescript
await admin.eshop.shipment.label.retry({
  order_id: result.shipment.order_id,
  shipment_id: result.shipment.id,
});

await admin.eshop.shipment.label.refund.request({
  order_id: result.shipment.order_id,
  shipment_id: result.shipment.id,
});

console.log(result.shipment.label.merchant_debit.status);
console.log(result.shipment.label.merchant_debit_reversal?.status);
```

These DTOs expose safe lifecycle state and `Money` snapshots only. Carrier and payment-provider
object IDs, processing claims, attempt counters, and persistence versions remain Server-internal.

## TypeScript

Every Arky-owned absolute instant is a signed UTC Unix epoch-millisecond number, represented in
TypeScript by `EpochMilliseconds`. This includes API filters, booking intervals, Date Blocks,
Form date values, session deadlines, lifecycle timestamps, and canonical provider evidence returned
by Arky. Convert explicit numbers or JavaScript Dates through the checked helpers:

```typescript
import { epochMilliseconds, epochMillisecondsFromDate, epochMillisecondsToDate } from "arky-sdk";

const from = epochMillisecondsFromDate(new Date("2024-01-02T03:04:05.678Z"));
const to = epochMilliseconds(from + 60_000);
console.log(epochMillisecondsToDate(from).toISOString());
```

There is no seconds fallback or magnitude detection: `epochMilliseconds(1_700_000_000)` is a valid
instant in January 1970. Helpers reject fractional, nonfinite, and unsafe integers; Date conversion
also rejects instants outside JavaScript's Date range. Duration fields retain their explicit units,
elapsed request timing uses a monotonic clock, and calendar dates such as availability `local_date`
remain strings. Prices and `compare_at` are money, not timestamps.

The clean browser-auth boundary uses `arky_admin_session:v2` with a version-2 envelope and
`arky_customer_session:v2:...` with version-2 Customer records. Older auth namespaces are ignored;
users sign in again rather than having seconds-shaped records reinterpreted. Existing durable
payment, refund, shipment, and media request recovery records are not cleared, rewritten, or assigned
new request identities by this auth cutover. Deploying this contract still requires the coordinated
Server/client preproduction reset and verification plan; an SDK update does not perform that reset.
Durable media uploads retain `File.lastModified` as native browser millisecond metadata, including
its exact frozen JSON bytes and replay identity; it is not a seconds-valued Arky domain timestamp.

```typescript
import {
  initialize,
  type ArkyStore,
  type StorefrontDto,
  type StorefrontSetup,
} from "arky-sdk/storefront";
import type { Block, Cart, Order, Price, Product, Service } from "arky-sdk";

type StorefrontProduct = StorefrontDto<Product>;
type StorefrontCart = StorefrontDto<Cart>;
```

Storefront request types intentionally contain no Store routing ID. Admin request types remain Store-explicit.

## Verification

Run the complete SDK package contract with one command:

```bash
npm test
```

It builds the distributable package and runs every SDK contract case. App alone verifies the SDK
against the exact immutable test Server image digest. Each storefront owns a
hermetic repo-local build/preview Playwright smoke through its own `npm test`; storefronts never pull
or run the shared test Server image.

## Adding an endpoint

When adding SDK methods:

1. Mirror server response DTOs in `src/types/index.ts` or the relevant API module.
2. Keep Admin inputs Store-explicit, but omit `store_id` from every storefront input, URL, and body.
3. Use `/v1/storefront/...` keyless routes and let the shared client attach publishable-key, locale, market, and visitor headers.
4. Mark customer mutations as stateful so they call the deduplicated visitor-session lifecycle.
5. Add explicit response generics to every HTTP call and re-export consumer-facing types.
