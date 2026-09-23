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

## Exact Admin definition reads

Use `admin.eshop.product.getByKey({ store_id, key })`, `bookingService.getByKey(...)` and
`bookingResource.getByKey(...)` for a known definition key. Fulfillment routing has the same
`admin.eshop.fulfillmentRoutingPolicy.getByKey({ store_id, key })` lookup. `bookingOffering.getByBinding({
store_id, booking_service_id, booking_resource_id })` resolves the exact parent pair. These reads
return the current authorized definition without searching pages. A failed lookup is not permission
to create a replacement; only an explicit not-found denotes absence. Storefront catalog access
still requires its separate buyer-scoped reads and checkout checks.

## Purchased digital library

Purchased files are separate from catalog discovery. `eshop.digital.library({ limit, cursor,
company_id, company_location_id })` returns `{ items, cursor }`; an empty page can still have a
continuation. Keep that opaque cursor unchanged and use it only for the same Customer and selected
Company/branch. Repeated purchases appear as one product card, and access is rechecked on every
request. For Company access, pass both Company fields to `getLibraryProduct`, `getLibraryAssets`
and `download` as well. Catalog visibility never authorizes a purchased download.

`getLibraryAssets({ digital_product_id, limit, cursor, ...companyContext })` also returns
`{ items, cursor }`. Keep loading explicitly while a cursor exists, including after an empty page.
`getLibraryProduct` returns `{ digital_product_id, presentation, assets: { items, cursor } }`;
`presentation` can be null while the bounded search is unfinished. Preserve the card's retained
label rather than inventing one. File cursors are bound to this Customer/session, Product and
Company/branch and expire after 15 minutes; each successful continuation renews the cursor lifetime,
not access. Refresh the library after expiry or a context/session change.

Pass the selected Asset's `download_reference` unchanged as `reference`:

```typescript
const download = await arky.eshop.digital.download({
  digital_product_id: product.digital_product_id,
  asset_id: asset.id,
  reference: asset.download_reference,
});
```

This reference expires after 15 minutes and is bound to the Customer session and selected context.
Refresh the purchased library after expiry or a session change. It selects the exact purchase; it
does not grant access. The server rechecks access before and after issuing the short-lived URL.

## Independent catalog pricing

`createAdmin().eshop` exposes `price`, `priceList`, `assortment`, `assortmentItem`, `catalog` and
`catalogEntitlement`. Product variants, digital products and booking offerings do not embed
Prices. Create the sellable first, then create its independent Price with a typed `sellable`,
currency, quantity range and status. `price_list_id: null` means a base Price; list Prices
belong to a reusable PriceList with explicit signed priority. Prices are not selected in the SDK.

Storefront product, digital-product and booking-offering reads accept `include_price` and an
optional explicitly selected `company_id` and `company_location_id`. The server checks the caller and current catalog
grants; sending a Company ID does not grant membership or permission. Company selection is per
request and is not remembered by the client. Normal catalog reads do not identify a visitor.

```typescript
const variant = await arky.eshop.productVariant.get({
  product_id: productId, id: variantId, include_price: true,
});
const displayPrice = arky.utils.formatPrice(variant?.price);
```

Public sellables contain one nullable `price` and an independent `purchase_allowed` flag. Paid
CustomerGroupPlan offers have their own server-selected price. `formatPrice` and `getPriceAmount`
consume one server-resolved `StorefrontPrice`, not arrays of market or Audience prices. A null
price is not zero. The public amount is a quantity-one display result; obtain a fresh Cart quote
for actual quantities and accepted totals. Do not multiply that preview into a checkout authority
or infer purchase permission merely because a price is visible.

Price updates cannot move a Price to another sellable, list or currency. Update
nullable fields explicitly and send `expected_updated_at`. Price and PriceList deletion return
the accepted record, including `status: { type: "deleting" }`; acceptance is not proof of completed
erasure. Manual price input contains money and a required reason, never a caller-supplied author.
Accepted Order snapshots retain their separate immutable price provenance.

`admin.eshop.priceList.usage({ id })` reports retained Catalog blockers separately from owned Prices.
Removing a list does not turn its Prices into base Prices. The coordinated Admin/demo and consumer
migration is still in progress; no Rule/Listing SDK owner is exposed.

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
const { items: products } = await arky.eshop.product.list({ limit: 20, include_price: true });
const product = await arky.eshop.product.get({ id: products[0].id, include_price: true });
const variants = await arky.eshop.productVariant.find({
  product_id: product.id, limit: 20, include_price: true,
});

console.log(product.slugs.en, product.price?.unit_price);

await arky.eshop.cart.addProduct(product, variants.items[0], 2);
await arky.eshop.cart.quote({
  payment_provider_id: "payment-provider-id",
});
const checkout = await arky.eshop.cart.checkout();
```

Products are cards with a quantity-one "from" price, not embedded variant inventories.
`productVariant.find` returns `{ items, cursor }`; pass its cursor to load further variants, even
after an empty page. `productVariant.get({ product_id, id, include_price: true })` resolves an exact
selection independently of paging. Both honor Company/branch context and current catalog access.
Prices are null when not requested, not permitted or unavailable; zero remains a real price.
Location stock is managed with Admin `inventoryLevel.find` and inventory movements. Storefronts
use the authoritative quote/checkout for availability, not a sum of inventory across warehouses.

Individually tracked objects use `admin.eshop.inventoryUnit`. `find` combines exact Item, Location,
asset-tag and physical-status filters, with timestamp sorting and explicit continuation. Asset tags
are case-sensitive; follow the cursor even after an empty page. `get` reads one exact Unit.
`receive` requires a caller-retained Unit UUID, asset tag, explicit nullable manufacturer serial and
the loaded Level ID/update epoch. Reuse that same request after an uncertain result; never generate
another receipt identity just to retry. `allocate` selects one existing reservation/component slot;
`unassign` frees that selection without releasing the quantity hold. Both require the loaded Unit
update epoch. These methods do not expose arbitrary status editing or physical-history deletion.

Cart requests and responses use one tagged `line_items` array with `product`, `booking`,
`digital_product` and `customer_group_plan` items. The `cartProductItems`, `cartBookingItems`,
`cartDigitalItems` and `cartCustomerGroupPlanItems` helpers select each family. A Form submission
belongs to the applicable individual item through `form_submission_id`, not a Cart-wide Forms array.
Public inputs never authorize prices; supported Admin inputs can carry explicit manual overrides.

Cart has tagged `status.type` and `origin.type`, required `market_id`/`sales_channel_id`, and
required `customer_id`, and nullable nested `company: { company_id, company_location_id }`.
Provenance is in `origin`, not a second top-level Session field. Admin creation requires a Customer;
ordinary updates cannot change it. Company update omission preserves the selection; `null` clears
both Company fields. Storefront identity comes from its authenticated Session.

`client.eshop.cart.current({ company: { company_id, company_location_id } })` creates an empty Cart
when none is selected, or exact-reads the selected Cart. Its ID is retained per Customer and Market
in the configured session storage; there is no server-wide unique current Cart or search lookup.
Market and channel at creation come from the server's storefront context. A Company mismatch fails
instead of silently editing the selected Cart. Use `cart.update` explicitly to change context.
`cart.create()` explicitly creates and selects another empty Cart and returns `{ cart, recovery_token }`,
as does Admin creation. The selection helper never stores the recovery token, Cart contents or prices.
Read errors do not discard a selection. A known converted, merged or expired Cart starts a new empty
selection on the next `current()` call, unless an unresolved Checkout still pins the old Cart.
An active, abandoned or checking-out Cart is retained. Signing in does not transfer guest ownership.

The high-level Cart view clears when its Customer session or Market changes. Load the current
Cart again after switching; late reads, item hydration and writes cannot repopulate the old view.
Selection edits or language changes invalidate the reviewed quote. These view changes never erase
an unresolved Checkout request: recovery still uses that exact retained request.

Quote methods return `CheckoutQuote`: `{ sources, order, presentation_digest }`. The nested
`order` includes the resolved buyer/context snapshots, all four line families, `locale` and the
selected nullable `payment_provider_id`. Low-level checkout requires `quote.order.locale` and
the outer `quote.presentation_digest`, which also binds the source Carts; the nested Order digest
is not the acceptance digest. `initialize` forwards its retained reviewed quote. A presentation
conflict exposes the complete replacement `CheckoutQuote` for review, never silent acceptance.
Quote methods use the configured locale unless one is explicitly supplied. Standalone Admin
`order.getQuote` still accepts a Market key; Cart creation uses a Market UUID.

Checkout submission does not synchronize items or accept new buyer, address or pricing selections.
Prepare those through Cart mutations and quote first. `initialize` checkout accepts only the
reviewed provider (if repeated), `return_url`, `clear_after_checkout`, `save_payment_method` and
`payment_method_terms_version`. Saving a method requires a selected provider and explicit
versioned consent. Recovery retains that exact consent with the original request.

Browser checkout saves the exact Cart UUID, generated `request_id`, locale, digest, optional
provider and return URL under the shared cross-tab durable-request lock before POST. The request
goes to `/checkouts` with the reviewed `sources`, and its `request_id` makes a repeat submission return the
same accepted Checkout. A lost response retains that request; `pendingCheckout()` reads it and an
explicit `recoverCheckout()` submits the same request without requote or Cart mutation. These
methods exist on `client.eshop.cart` and `arky.eshop.cart`; Admin exposes the same operations with
an optional Store selector. Success reads `/checkouts/{checkout_id}` and verifies the exact
request, source Cart and accepted Order before clearing saved state. Recovery does not require
the original Cart to survive cleanup.
After a successful acceptance, use `eshop.checkout.get({ id: checkoutId })` to restore the saved
Order link. This exact read performs no provider call. An explicit
`eshop.checkout.resumePayment({ id: checkoutId })` can return a fresh transient action for the
original open payment Session; it cannot create another Payment or Session. Pending, Processing,
Unknown and terminal payments return local status with no action. These methods are available on
the storefront client, `initialize` facade and Admin (with optional `store_id`). Persist only
the accepted IDs, never the action's client secret. Unresolved acceptance still uses the original
`cart.recoverCheckout()` request, not payment-action resume.
Do not clear storage manually after a conflict or allocate a new Cart to retry the same purchase.
The coordinated Server handoff for a stale-presentation conflict is still an implementation gate;
current conflict handling preserves the request instead of silently accepting its refreshed quote.

```typescript
const reviewed = await admin.eshop.cart.quote({ id: cart.id, locale: "en" });
if (!reviewed.sources || !reviewed.order.locale || !reviewed.order.money) {
  throw new Error("Review a complete Cart quote before accepting.");
}
const purchase = await admin.eshop.cart.checkout({
  id: cart.id,
  locale: reviewed.order.locale,
  sources: reviewed.sources,
  presentation_digest: reviewed.presentation_digest,
  payment_provider_id: reviewed.order.payment_provider_id ?? undefined,
});
```

The quote envelope contains `sources`, `order` and `presentation_digest`; accept the envelope's
digest, not the inner Order presentation digest. Product quote lines have `line_item_id`, total
`money` and exact per-unit `money_runs`. Do not invent one unit amount from a rounded total.
Each run retains discount provenance, tax assessment and duties. Delivery charges live in
`delivery_groups`, not a separate shipping-lines array.

Quote Product/Digital snapshots carry an `AppliedPriceSnapshot`. Accepted Order snapshots use
`price.type = "direct"` with that snapshot under `price.price`, or `"customer_group_allocation"`
for plan components; the latter is an allocation, not a second standalone price. Accepted group
terms retain `group_name`/`group_key` and `plan_name`/`plan_key`. In a plan quote, membership money
and `benefit_lines` are separate portions of the package and must be shown without double counting.
Historical live Product/variant/Offering/Resource/DigitalProduct links may be null; retained
snapshot names, source identities and accepted money do not require a live definition lookup.

Physical Product variants reference InventoryItem components through their fulfillment recipe.
Weights/customs belong to InventoryItem; InventoryLevel is independent stock at one StoreLocation.
Stock admission is decided by quote/checkout, not by a Product-wide client inventory sum.

Booking services use the same Cart. A BookingResource is the person, place, or equipment that
performs the service; a BookingOffering connects one service to one resource and owns its
availability, booking window and reminders. Its prices are independent Price records:

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

Accepted Orders embed tagged `line_items` for products, bookings, digital products and customer-group
plans. Their snapshots, money, commercial status, Form evidence and timestamps arrive with the Order.
`orderBookingItems(order)` selects its booking lines. Independent `OrderBooking` roots retain
appointment execution and reminders; Admin reads one with `eshop.order.getBookingAppointment`.
Completed and NoShow appointments keep their Order line commercially Confirmed.

Order is accepted purchase history, not a product, address or price editor.
Use Cart for new selections, and the dedicated item/financial/fulfillment
commands for ongoing obligations. Root and item statuses use `status.type`.

Accepted buyer, company, Market and SalesChannel snapshots remain independent of current definitions.
`Order.type` identifies a purchase and its Checkout/direct/exchange source, or a customer-group
renewal. `origin` retains the accepting actor; it is not live authorization. Render saved names
and each line's saved `money.total` instead of repricing historical catalog definitions.

Confirmed booking items have dedicated lifecycle commands. Admin clients can cancel, complete, or
mark an item as a no-show; only the owning EmailAuthenticated CustomerSession can cancel through the
Storefront client.
Each command returns the refreshed Order, and cancellation never implies a payment refund:

```typescript
import { createAdmin } from "arky-sdk/admin";
import { orderBookingItems } from "arky-sdk";

await arky.eshop.cart.quote({
  payment_provider_id: "payment-provider-id",
});
const bookingCheckout = await arky.eshop.cart.checkout();
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
const appointment = await admin.eshop.order.getBookingAppointment({
  order_id: adminOrder.id,
  order_booking_item_id: orderBookingItems(adminOrder)[0].id,
});
console.log(appointment.status.type);

await admin.eshop.order.completeBookingItem({
  order_id: adminOrder.id,
  order_booking_item_id: orderBookingItems(adminOrder)[0].id,
});

await arky.eshop.order.cancelBookingItem({
  command_id: savedCancellation.command_id,
  order_id: customerOrder.id,
  order_booking_item_id: orderBookingItems(customerOrder)[0].id,
});
```

Those are separate terminal alternatives on different confirmed items. One item cannot be
completed and then cancelled (or moved to any other terminal state).
Import `orderBookingItems` from `arky-sdk` to select the accepted booking lines. Before cancelling,
generate and persist one UUID-v4 `command_id` with the exact Order/item selection; the example's
`savedCancellation` is that caller-owned saved request. Reuse it after a failed response rather than
generating a new command on each attempt. Cancellation credits the remaining booking obligation;
any provider refund is a separate operation.

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

## Customer identity history

Admin Customer identity history is separate from its selected email. Use
`admin.customers.identities({ customer_id, status, verified, limit, cursor })` for a bounded page;
follow the returned cursor even when a page is empty. `verified` filters retained proof, not current
authentication. Resolve a Customer's `primary_email_identity_id` through
`admin.customers.getIdentity({ customer_id, identity_id })`, not the first history item. No selection
means no primary email; a failed exact read is not absence. The explicit `revokeIdentity` command
retains historical proof while invalidating current use. Customer root statuses are tagged objects;
the Customer/identity discovery `status` parameter is a scalar tag.

## Embedded card checkout

Store setup is fetched lazily and deduplicated:

```typescript
const setup = await arky.store.load();
console.log(setup.languages.default, setup.default_market?.key);
console.log(setup.payment_providers); // [{ id, key, blocks, type: "cash_on_delivery" | "manual" | "stripe" }]
```

Setup contains only the exact default Market (`null` before commerce is ready), not a list of
Markets. An explicit non-default selection resolves through `client.store.market.getByKey(key)`;
ordinary Market browsing uses `client.store.market.list({ limit, cursor })`. Neither configuration
read creates a visitor or grants purchase permission. `setMarket(key)` changes context synchronously;
call `await arky.store.load()` to resolve that selection before reading `arky.market` or currency.
During resolution, a mismatched previous Market is unavailable; failed or stale reads never select
the default instead. The public `commerce` tag supplies readiness and exact default IDs, not private
seller or invoicing configuration. `languages.default` may be null.

The Storefront setup exposes each provider UUID, key, content Blocks and safe provider type. Stripe account,
capability, consent, and disablement evidence remain private Admin data.

Payment configuration belongs to Arky. A card checkout returns a short-lived embedded Stripe
action. The SDK mounts that exact Checkout Session inside the merchant page; it never redirects the
ordinary purchase to a Stripe-hosted Checkout page and it never exposes secret credentials:

```typescript
import { mountCheckoutAction } from "arky-sdk";

await arky.eshop.cart.quote({
  payment_provider_id: "stripe-payment-provider-id",
});
const result = await arky.eshop.cart.checkout({
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
await arky.client.eshop.cart.get({ id: cart.id });
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
Session ID; token refresh returns a new Session while preserving `authenticated_at` and `scope`:

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
Token and Session responses also expose `scope: { type: "account" }` or
`{ type: "store", store_id: string }`. A Store restriction never grants permission and cannot be
widened by changing the client's `storeId` or refreshing credentials. Restricted credentials
cannot create Personal API Tokens, list other Stores or perform Account-wide administration;
they can revoke their own Session. Ordinary platform-origin and Store-branded login remain
Account-wide. Verified custom-domain issuance is not yet exposed; scope is server-selected,
not a login request option.

The SDK keeps the wire/domain name `AccountApiToken`, while documentation and product copy call
these credentials Personal API Tokens. Expiry is determined from `expires_at`; token status is
only `active` or `revoked`.

Store settings and storefront-client registrations are separate Admin surfaces:

```typescript
const store = await admin.store.get({
  id: "internal-store-id",
});

await admin.store.update({
  id: store.id,
  name: "Arky Sarajevo",
  billing_email: "billing@example.com",
  contact_email: "team@example.com",
  default_market_id: "market-id",
  default_sales_channel_id: "sales-channel-id",
  default_language: "en",
  supported_languages: ["en", "bs"],
});

const storefrontClients = await admin.storefrontClient.find({
  store_id: store.id,
  limit: 20,
});

const classifications = await admin.classification.find({ limit: 20 });
```

Publishable credentials belong to individual StorefrontClient registrations and their allowed
sales channels, not to Store settings. Use `storefrontClient.create/update/revoke` to manage those
registrations. Store reads and updates do not return or regenerate a reusable Store-wide key.

Admin Store records use `name`, private `billing_email`, optional public `contact_email`, and
explicit `default_language`/`supported_languages` fields. Creation requires an explicit billing
email. Omit `contact_email` on update to preserve it or send `null` to clear it; editing either
email never changes the other. Public `support.email` comes only from `contact_email`, with no
billing or Account fallback. Mailboxes own sender and reply-to identity, and staff notification
recipients remain explicitly configured. A new Store creates no inferred Mailbox. Physical places are exposed as `StoreLocation`
values with the shared `PostalAddress` shape. Webhooks and Build Hooks are addressed by UUID and
use `{ type: "active" }` / `{ type: "disabled" }` statuses. Membership IDs are opaque, Server-generated UUID-v4 values;
`StoreUsage` represents one feature and either its current total or one UTC calendar month.
Booking quotas use the canonical `booking_services` and `booking_resources` feature keys.

`admin.store.buildHook.list` and `admin.store.webhook.list` require `store_id` and return
`{ items, cursor }`. Both support `query`, flat `status: "active" | "disabled"`, `limit` (1–200,
default 50), `cursor`, `sort_field: "created_at" | "updated_at"` and `sort_direction: "asc" | "desc"`.
Search matches BuildHook IDs or Webhook IDs/subscribed event names, not private destination URLs.
Keep following a returned cursor even when a page is empty. Returned URLs, header values and
Webhook secrets are masked; omit those fields when updating to preserve their stored values.
Webhook subscriptions use `{ type: "order.created" }` or a scoped value such as
`{ type: "entry.updated", collection_id: "collection-id", key: null }`. The platform event catalog's
separate `event` metadata field is not the subscription discriminator.

`admin.store.find` accepts literal name text, `sort_field: "name"`, and ascending/descending
ordering. `admin.account.search` is platform-Administrator-only and orders by email.
Both default to 50 records and accept at most 200. Pass an opaque returned cursor unchanged;
an empty page with a cursor still has a continuation. Cursors belong to their original filters,
sort and operator. Neither helper automatically fetches later pages. Permission panels use
`admin.store.member.getOwn({ store_id })`, not an assumed-complete membership discovery page.

`admin.store.market.list`, `admin.store.location.list` and `admin.store.paymentProvider.list`
return `{ items, cursor }`, not complete arrays. Each accepts an explicit `store_id`, exact `key`,
owner-specific filters, `created_at`/`updated_at` ordering and bounded `limit`/`cursor` paging.
Market filters include currency and active/deleting status; Location filters include
`is_pickup_location` and active/archived/deleting status; configured providers filter by
`configuration_type` and active/disabled/deleting status. No helper silently fetches all pages.
Storefront Market/Location lists also return pages; their authenticated context supplies Store
and active-only visibility, so neither `store_id` nor status belongs in their query.

Use `market.get({ store_id, id })` or `location.get({ store_id, id })` for a saved selection,
and `getByKey({ store_id, key })` for exact configuration lookup. Provider configuration has
`paymentProvider.getByConfiguration({ store_id, configuration_type })` in addition to exact ID/key
reads. A missing discovery candidate is not proof that configuration is absent and never
authorizes repeated creation, connection or payment. Only exact reads confirm a saved identity.

Store creation also requires `initial_market: { key, currency, tax_mode }`; for example,
`{ key: "bih", currency: "bam", tax_mode: "inclusive" }`. Server creates that Market and the initial
SalesChannel in the Store transaction. Ready Store reads expose `default_market_id` and
`default_sales_channel_id` inside `commerce` when `commerce.type === "ready"`.
Use `storeCommerceDefaults(store)` to read that pair; uninitialized/initializing Stores have no
implicit defaults. An update may select other current same-Store defaults; neither accepts `null`,
and the SDK does not select a replacement for the operator.

### Stripe connection setup

Create a local Stripe PaymentProvider before calling `store.paymentProvider.stripe.connect`.
The connection request requires its `payment_provider_id`, a canonical UUID-v4 `operation_id`,
explicit `authorize_account_debits`, and return/refresh URLs. An unconnected account also needs
its two-letter country. The response contains `provider`, the retained eleven-field `operation`,
and a response-only `onboarding_url`.

Inspect an uncertain result with `store.paymentProvider.stripe.getConnection({ store_id,
operation_id })`. This exact authorized read makes no Stripe call. Account creation and metadata
binding have independent tagged statuses; `unknown` is not a failed request or permission to
create another account. Browser integrations must persist the exact request with the shared
durable-request utilities before sending and retain it through failed reads or ambiguous responses.
The low-level SDK neither generates a replacement operation nor automatically retries connection.

### Companies and commercial groups

Company management is top-level: `admin.companies` exposes `create`, `get`, `find`, `update`,
`usage` and `delete`. Its `membership`, `role` and `location` owners expose their corresponding
commands. Company Customers are members, while roles define explicit Company permissions;
neither an arbitrary Company ID nor a commercial group grants membership or sign-in proof.

```typescript
const company = await admin.companies.create({
  name: "Buyer Ltd",
  profile: {
    legal_name: "Buyer Ltd",
    registration_number: null,
    tax_number: null,
    contact_email: "accounts@example.com",
    contact_phone: null,
    registered_address: null,
  },
  status: { type: "active" },
});

const roles = await admin.companies.role.find({ key: "buyer" });
const buyerRole = roles.items[0];
if (!buyerRole) throw new Error("The Store's buyer role is unavailable");

await admin.companies.membership.create({
  company_id: company.id,
  customer_id: "customer-uuid-v4",
  role_ids: [buyerRole.id],
});

const group = await admin.eshop.customerGroup.create({
  key: "wholesale",
  name: "Wholesale",
  status: { type: "active" },
});
await admin.eshop.customerGroupCompany.create({
  customer_group_id: group.id,
  company_id: company.id,
});
```

`CompanyProfile` and `CompanyAddress` mirror strict wire values: include every declared field and
use `null` for an absent value. Address fields are `name`, `company`, `street1`, `street2`, `city`,
`state`, `postal_code`, `country`, `phone` and `email`. CompanyLocation's shipping address must also
satisfy Server shipping validation. A location update explicitly supplies `billing_address`,
including `null` to clear it. Roles expose Server-owned `is_system`; callers cannot create that
flag, edit built-in roles or change a role's key. The closed permission set distinguishes placing
Orders from creating Subscriptions and own history from Company history.

`admin.eshop.customerGroupCustomer` manages direct Customer edges, and
`admin.eshop.customerGroupCompany` manages Company edges. These immutable relationships have
`create`, `get`, `find` and `delete`, not a generic update. Commercial groups are not Audiences and
do not subscribe anyone to marketing. Find results use `items` and an explicit continuation
`cursor`; supplying both group and target filters selects an exact edge rather than a paged scan.
Company membership queries select at most one of Company, Customer or role. Server validates
supported filter combinations and current authority.

### Markets, SalesChannels and deletion

`admin.store.salesChannel` exposes typed `create`, `get`, `find`, `update`, `usage` and `delete`.
Market management uses `admin.store.market`: `list()`, `get(id)`, `usage(id)`, `create`, `update`
and `delete`. Market key/currency and SalesChannel key are immutable. Market reads use tagged
`active`/`deleting` status; SalesChannels can additionally be archived.

Company, membership, role, location, group, edge, channel and Market edits/deletes require the
current `updated_at` as `expected_updated_at` where those commands exist. Inspect each available
`usage` response before deletion: it names bounded actual dependencies, including CatalogEntitlements,
with `more_*` flags. Default Market deletion needs `replacement_default_market_id`; default channel
archival/deletion needs `replacement_default_sales_channel_id`. An unused non-default definition
needs no replacement. Server checks live dependencies and validates any replacement in the same
transaction; the SDK neither clears a grant nor silently reassigns a buyer's context.

A successful asynchronous delete returns the exact record with `status.type === "deleting"`
from HTTP 202, not a boolean or proof of physical removal. Reload after changes or a conflict;
do not manufacture a newer version or replacement operation. Normal request options, cancellation
signals and SDK errors are preserved. These operator APIs do not implement a storefront Company
switcher or bypass backend permission checks.

### Other operator commands

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

Payments belong directly to an Order through `order_id`. Collection status (`authorized`, `completed`,
`unknown`, and the other lifecycle states) is separate from money: `amounts.authorized` is an
authorization ceiling, `amounts.captured` is evidenced collected money, and refunds and unresolved
capture/refund reservations have their own fields. A completed Payment can later be partially or
fully refunded without changing its collection status. Use `admin.eshop.order.getFinancialSummary({ id })`
for the Order-wide balance, including commercial credits, all Payments and dispute losses. Do not
calculate the Order balance from one Payment or treat `unknown` as permission to collect again.

Cash and manual collection commands record money already received; they do not charge a customer.
Persist the complete command before sending it. Recover an interrupted command with the same
`payment_capture_id` and money, then validate the returned capture receipt before clearing it:

```typescript
const recorded = await admin.eshop.payment.recordCashOnDeliveryCollection(savedReceipt);
console.log(recorded.capture.id, recorded.payment.amounts.captured);
console.log(recorded.financial_summary.outstanding);
```

`savedReceipt` contains `id` (the Payment UUID), `payment_capture_id` (a new UUID-v4 for this receipt),
`money: { amount, currency }`, and optionally `store_id`. Each amount is a positive integer in minor
units. `recordManualCollection` additionally requires `reference: string | null`.
`createManual` creates the separate manual collection intent with its own stable `id`, `order_id`,
`payment_provider_id`, `money` and required nullable `reference`; intent creation is not money received.
Unexpected receipts remain recorded and may open a reconciliation hold.

Refunds use the collected Payment ID and one stable UUID-v4 for the concrete refund. Persist that ID
with the immutable request before sending or recovering it. The common `create` command reserves
eligible money for Stripe, manual and cash-on-delivery refunds; it does not prove money was sent.
Commercial refunds require existing active OrderCredit allocations and actual refundable principal:

```typescript
const result = await admin.eshop.refund.create({
  payment_id: "payment-id",
  refund_id: "persisted-refund-uuid-v4",
  payment_capture_id: null,
  money: { amount: 2500, currency: "eur" },
  application: {
    type: "commercial_credit",
    allocations: [
      { order_credit_id: "credit-id", order_credit_allocation_id: "allocation-id", amount: 2500 },
    ],
  },
  reason: "customer_request",
  private_note: null,
  reference: null,
});

console.log(result.money.amount, result.money.currency, result.status);
```

For cash/manual refunds, record actual money separately with `recordMoney({ id, effect_id, movement,
money, allocations, reference })`. Persist the exact receipt before sending it. `effect_id` is a new
UUID-v4 for that actual movement; retry keeps it unchanged. `movement: { type: "sent" }` records cash
sent to the customer; `{ type: "returned", sent_effect_id }` records money returned to the business
against that original Sent effect. `reference` is required. Commercial allocations describe the
exact portion actually moved. Stripe money is recorded from provider evidence, not manual receipts.

Use `get({ id })` for one Refund and `find({ payment_id })` for a Payment's history (omit payment_id
for Store history). Reads expose immutable `financial_effects`; requested `money` and process status
alone are not actual refunded money. Receipt results include sent/returned/effective/pending amounts,
the Payment, and the Order financial summary. `cancelLocal({ id, expected_updated_at })` releases only
the unperformed local remainder and preserves actual receipts. ExcessCollection has a reason and
no commercial allocations; it does not alter the accepted bill. Payment disputes are read-only Stripe facts available
through `admin.eshop.order.getDisputes` and `admin.eshop.order.getDispute`; their public provider
evidence contains only `dispute_id` and `charge_id`.

To cancel part of an embedded product item, address its canonical item ID and exact accepted unit
positions. Before the first request, persist a UUID-v4 `command_id`, the Order's current `updated_at`
and the selected unit spans in your application's durable command storage. Send that saved request:

```typescript
await admin.eshop.order.cancelProductItem({
  order_id: savedProductCancellation.order_id,
  order_product_item_id: savedProductCancellation.order_product_item_id,
  command_id: savedProductCancellation.command_id,
  expected_updated_at: savedProductCancellation.expected_updated_at,
  units: savedProductCancellation.units,
});
```

For example, `units: [{ first_unit: 0, quantity: 1 }]` selects the first accepted unit, not any
arbitrary remaining quantity. Retry an uncertain result with the same saved payload; do not create
a replacement command or substitute a newer revision. A separately reviewed cancellation uses a
fresh command and current Order state. The response is the updated Order.

## Fulfillment and shipping labels

Fulfillment work is scoped to a StoreLocation. Its line source maps stable local work positions
to accepted Order units. A Shipment selects those local positions and freezes its parcel and
optional customs facts. Create the parcel first; carrier-label quoting/purchase is a separate flow:

```typescript
const result = await admin.eshop.shipment.create({
  order_id: "6ba7b81a-9dad-41d1-80b4-00c04fd430c8",
  shipment_id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
  origin_store_location_id: "6ba7b818-9dad-41d1-80b4-00c04fd430c8",
  fulfillment_order_id: "6ba7b813-9dad-41d1-80b4-00c04fd430c8",
  lines: [
    {
      fulfillment_order_line_id: "6ba7b814-9dad-41d1-80b4-00c04fd430c8",
      unit_spans: [{ first_unit: 0, quantity: 1 }],
      unit_bindings: [],
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
  customs_declaration: null,
});

const rates = await admin.eshop.shippingLabel.quote({
  owner: { type: "outbound_shipment", shipment_id: result.shipment.id },
});
console.log(rates.map((rate) => ({ service: rate.display_name, total: rate.total })));
```

`unit_bindings` is required on Shipment and Pickup lines. Quantity-tracked goods use an empty array;
individually tracked components require explicit `{ fulfillment_unit_index, inventory_unit_id }`
bindings for the complete accepted component recipe, at most 100 distinct Units per manifest.
The Unit must already be allocated to the corresponding reservation slot. Work positions are not
Order positions or physical serial numbers.

Use `admin.eshop.shipment.fulfillment.resolveUnitSlots({ order_id, fulfillment_order_id,
expected_updated_at: work.updated_at, lines })` to read the required Individual component slots
for selected `{ fulfillment_order_line_id, unit_spans }` lines. It returns the exact existing
reservation/slot, Item/key and nullable current Unit for each component; it does not reserve stock.
Discover available objects with `inventoryUnit.find` filtered by that Item, the returned Location
and `status: "available"`. Pass the chosen Unit's loaded revision and the returned reservation/slot
to `inventoryUnit.allocate`, then resolve again to display saved assignments after reload or an
uncertain response. Build the manifest's `unit_bindings` from those confirmed assignments. At most
100 physical component slots are resolved per request; quantity-only goods return an empty list.

`selectShipmentUnits` from `arky-sdk/utils` builds a quantity selection from loaded work and complete
shipment history without expanding every unit. It excludes both dispatched positions and positions
claimed by unexecuted, non-cancelled parcels. Its empty bindings array supports quantity-tracked
goods; supply explicit allocated Unit bindings for individually tracked goods before creating the
parcel. Server admission remains authoritative if work changes after the read.

An unshipped parcel can be cancelled explicitly. Cancellation frees its prepared positions, not
the underlying stock hold, and does not automatically refund postage:

```typescript
await admin.eshop.shipment.cancel({
  order_id: result.shipment.order_id,
  shipment_id: result.shipment.id,
  expected_updated_at: result.shipment.updated_at,
});
```

For an active parcel, `shippingLabel.request` accepts the selected signed quote and a retained
`shipping_label_id`; preserve the identity through an uncertain response. Inspect it with
`shippingLabel.get` or use its supported `reconcile` command. Labels, carrier refund requests and
merchant-debit reversals have separate APIs and lifecycle records. A successful label purchase is
not dispatch, and a carrier refund is not customer repayment or proof that goods returned.

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
