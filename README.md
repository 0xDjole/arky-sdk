# arky-sdk

Official TypeScript SDK for [Arky](https://arky.io), the website backend and Admin client for custom frontends.

## Installation

```bash
npm install arky-sdk
```

## Storefront quick start

Pin the exact released version so the Server, Admin and storefront route/header contracts move
together:

```bash
npm install --save-exact arky-sdk@<version>
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

Localized text has two Block shapes: a `localized_text` Block whose value maps each locale to a
string, or an `object` Block whose keys are locales and whose values are `text` or `markdown`
Blocks. `getBlockTextValue(block, locale)` reads both. A standalone `markdown` Block holds one
string:

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
const presentation = await arky.forms.get({ key: "contact" });
const request = {
  id: crypto.randomUUID(),
  key: "contact",
  presentation,
  values: {
    email: "visitor@example.com",
    message: "Hello from the storefront",
  },
};
await arky.forms.submitByKey(request);
```

Display the returned presentation before collecting answers. Retain `request` for a retry:
the same ID, presentation, locale and values must be resubmitted after a lost response. The helper
does not substitute a later cached Form or fetch new questions during submission. An explicit
`FORM.PRESENTATION_CHANGED` response is nonacceptance: show the returned presentation and require
another user submission, with a new request ID. Keep the storefront locale equal to the retained
presentation's locale when retrying.

The browser persists one versioned, discriminated Customer-session record. A Visitor record contains
its short-lived token; an email-authenticated record contains the current access and refresh
credentials. Requesting a code returns only a safe Visitor view and retains the existing token in
that record. Verification and refresh replace the full record atomically; refresh sends only the
body credential with the Store's publishable key and never sends an access-token Authorization
header. Customer credentials use the `customer_visitor_`,
`customer_access_`, and `customer_refresh_` prefixes; `arky_vst_` is rejected. Storage is isolated by
API endpoint and a fingerprint of the publishable key.

To explicitly capture a contact address on the current Customer without signing in:

```typescript
const identity = await arky.customer.captureEmail({ email: "visitor@example.com" });
```

The helper lazily creates a Visitor if needed and reuses that Session on later calls. Capture
creates an unverified email identity or reuses the Visitor's own active identity. It does not select a primary
email, send email, authenticate, join a Group or record marketing consent. Those are separate
explicit flows. A signed-in Session accepts only its proven address and returns that exact
identity unchanged. Ambiguous active bindings fail rather than selecting one automatically.

To join an open Customer group:

```typescript
const membership = await arky.customer_group_members.current({ customer_group_id: group.id });
const joinRequest = {
  command_id: crypto.randomUUID(),
  request: {
    customer_group_id: group.id,
    scope: { type: "customer" as const },
    expected_updated_at: membership?.updated_at ?? null,
  },
};
const joined = await arky.customer_group_members.join(joinRequest);
```

Only submit Join when membership is absent or Requested. Keep the same request and command ID
for a lost-response retry; a conflict requires refreshing membership, not silently issuing another
command. The existing Visitor Session is reused, or created lazily without requiring a Market.
Store and Customer come from the public key and Session, never caller-supplied IDs. For Company
membership, select both `company_id` and `company_location_id`; the Server checks permission for
that branch. Responses contain only self-visible membership, not private administrative grants.
Joining buys nothing and grants no paid or digital access; it does not verify email or record email
consent. A Granted membership only satisfies group conditions on catalogs, promotions and shipping.

## Exact Admin definition reads

Use `admin.eshop.product.getByKey({ store_id, key })`, `bookingService.getByKey(...)` and
`bookingResource.getByKey(...)` for a known definition key. Fulfillment routing has the same
`admin.eshop.fulfillmentRoutingPolicy.getByKey({ store_id, key })` lookup. `bookingOffering.lookup({
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
currency, quantity range and status. `scope: { type: "base" }` is a base Price;
`{ type: "price_list", price_list_id }` belongs to a reusable, optionally scheduled PriceList.
Prices are not selected in the SDK.

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

Public sellables contain one nullable `price` and an independent `purchase_allowed` flag.
Subscription plans read through `subscription_plans.find/get` carry their own server-selected price.
`formatPrice` and `getPriceAmount` consume one server-resolved `StorefrontPrice`, not arrays of
Market prices. A null
price is not zero. The public amount is a quantity-one display result; obtain a fresh Cart quote
for actual quantities and accepted totals. Do not multiply that preview into a checkout authority
or infer purchase permission merely because a price is visible.

Price updates cannot move a Price to another sellable, list or currency. Update
nullable fields explicitly and send `expected_updated_at`. Price and PriceList deletion return
the accepted record, including `status: { type: "deleting" }`; acceptance is not proof of completed
erasure. Manual price input contains money and a required reason, never a caller-supplied author.
Accepted Order snapshots retain their separate immutable price provenance.

`admin.eshop.priceList.usage({ id })` reports retained Catalog blockers separately from owned Prices.
Removing a list does not turn its Prices into base Prices.

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
await arky.eshop.cart.quote();
const checkout = await arky.eshop.cart.checkout({
  payment_option_id: "payment-option-id",
});
```

Products are cards with a quantity-one "from" price, not embedded variant inventories.
`productVariant.find` returns `{ items, cursor }`; pass its cursor to load further variants, even
after an empty page. `productVariant.get({ product_id, id, include_price: true })` resolves an exact
selection independently of paging. Both honor Company/branch context and current catalog access.
Prices are null when not requested, not permitted or unavailable; zero remains a real price.
Location stock is managed with Admin `inventoryLevel.find` and inventory movements. Storefronts
use the authoritative quote and acceptance for availability, not a sum of inventory across warehouses.

Individually tracked objects use `admin.eshop.inventoryUnit`. `find` combines exact Item, Location,
asset-tag and physical-status filters, with timestamp sorting and explicit continuation. Asset tags
are case-sensitive; follow the cursor even after an empty page. `get` reads one exact Unit.
`receive` requires a caller-retained Unit UUID, asset tag, explicit nullable manufacturer serial and
the loaded Level ID/update epoch. Reuse that same request after an uncertain result; never generate
another receipt identity just to retry. `allocate` selects one exact job line/component slot;
`unassign` frees that selection without releasing the quantity hold. Both require the loaded Unit
update epoch. These methods do not expose arbitrary status editing or physical-history deletion.

Physical returns use `admin.eshop.return.create/get/find/execute`. Customers request and read their
own returns through `arky.eshop.return.create/get/find`; staff approve or decline them. Create names
an accepted Order with exact product-unit spans and components, or a Rental with `rental_unit`
lines that each name one `inventory_unit_id`. Retain the command and Return UUIDs before sending.
Staff creation may name the destination warehouse; approval can set it for a Customer request.
`execute` keeps the command UUID, source and loaded update epoch across retries. Receive records
custody; Dispose records restocked or not-restocked quantities and explicit Individual Unit IDs.
Missing records quantities that will not arrive. Each action addresses the exact line and Inventory
Item. The Return closes automatically when every quantity is accounted for. Physical returns do
not refund money; use the separate Refund flow when repayment is due.
`find` combines an optional Order or Rental scope (never both), destination and physical-status
filters with timestamp sorting and explicit continuation. Follow its cursor even after an empty
page; use `get` for exact current state. Rentals are separate agreements under
`admin.eshop.rental`; ending an agreement requests returns for its units still out and cancels
unsent issue work through the partner handshake where needed.

Cart requests and responses use one tagged `line_items` array with `product`, `booking`,
`digital_product` and `subscription_plan` items. The `cartProductItems`, `cartBookingItems`,
`cartDigitalItems` and `cartSubscriptionPlanItems` helpers select each family. The low-level
`client.eshop.cart.removeItem({ id, line_item: { type, line_item_id } })` removes one item by its
typed reference; the `initialize` facade wraps it as `removeProduct`, `removeDigital`,
`removeSubscriptionPlan` and `removeBooking`. A booking input carries its `capacity_units` (seat
count). A Form submission
belongs to the applicable individual item through `form_submission_id`, not a Cart-wide Forms array.
Public inputs never authorize prices; supported Admin inputs can carry explicit manual overrides.

Each Cart delivery group has a nullable `scheduled_window`. Choose a fixed date with
`{ type: "absolute", from, to }`, or a purchased subscription drop with
`{ type: "subscription", delivery_index: 0 }` (zero-based, below 100). Relative selections follow
the plan's calendar and support `start: { type: "on_acceptance" }`. Assign each physical
entitlement's exact quantity to every purchased drop. Entitlements sharing a relative group must
resolve to the same window; rental equipment or extra products may accompany that drop.
The quote's corresponding `delivery_groups[].scheduled_window` contains the resolved `{ from, to }`
dates for display. Acceptance freezes exact dates in the Order; retain the Cart's relative
selection when requesting another quote.

For physical subscription entitlements, call `store.eshop.cart.quoteFutureDeliveries({ plans })`
after adding the plan to the loaded Cart. Each plan choice has `cart_line_item_id` and `deliveries`
with `{ id, entitlement_ids, destination, shipping_rate_id }`. A null rate previews available
offers; select a rate and review again. The response includes the server-expanded windows,
per-entitlement unit spans, offers and either `selection_required` or `ready` with signed
`quote_acceptance`. Display these terms before accepting them:

```ts
const preview = await store.eshop.cart.quoteFutureDeliveries({ plans: deliveryChoices });
await store.eshop.cart.acceptFutureDeliveries({
  plans: preview.plans.map((plan) => ({
    cart_line_item_id: plan.cart_line_item_id,
    deliveries: plan.deliveries.map((proposal) => {
      if (proposal.status.type !== "ready") throw new Error("Select a delivery rate first");
      return {
        ...proposal.quote.basis.choice,
        quote_acceptance: proposal.status.quote_acceptance,
      };
    }),
  })),
});
```

Use each entitlement's previewed quantities and drop order to select the initial Cart delivery
groups, then review the complete Cart and check out. Future-promise acceptance updates the loaded
Cart and invalidates its purchase review. Low-level storefront and Admin `cart` APIs expose the
same two methods with an explicit Cart `id`; Admin also accepts `store_id` and `locale`.

Cart has tagged `status.type` and `origin.type`, required `market_id`/`sales_channel_id`, and
required `customer_id`, and nullable nested `company: { company_id, company_location_id }`.
Provenance is in `origin`, not a second top-level Session field. Admin creation requires a Customer;
ordinary updates cannot change it. Company update omission preserves the selection; `null` clears
both Company fields. Storefront identity comes from its authenticated Session.

`client.eshop.cart.current({ company: { company_id, company_location_id } })` creates an empty Cart
when none is selected, or exact-reads the selected Cart. Its ID is retained per client namespace,
Customer, Market, Company and branch in the configured session storage. Switching Company or branch
keeps each context’s selection. Omitted or null Company selects the personal Cart. There is no
server-wide unique current Cart or search lookup. Market and channel at creation come from the
server’s storefront context. A response with a different Company or branch is refused without
changing the retained selection. An unresolved checkout must be recovered in its original context
before another Cart can be mutated.
`cart.create()` explicitly creates and selects another empty Cart and returns `{ cart, recovery_token }`,
as does Admin creation. The selection helper never stores the recovery token, Cart contents or prices.
Read errors do not discard a selection. A known converted, merged or expired Cart starts a new empty
selection on the next `current()` call, unless an unresolved acceptance request still pins the old
Cart.
An active or abandoned Cart is retained. Signing in does not transfer guest ownership.

The high-level Cart view clears when its Customer session or Market changes. Load the current
Cart again after switching; late reads, item hydration and writes cannot repopulate the old view.
Selection edits or language changes invalidate the reviewed quote. These view changes never erase
an unresolved acceptance request: recovery still uses that exact retained request.

Quote methods return `CheckoutQuote`: `{ sources, order, presentation_digest }`. The nested
`order` includes the resolved buyer/context snapshots, all four line families, `locale`, the
selected nullable `payment_option_id` and the permitted `payment_option_ids`. Low-level
acceptance requires `quote.order.locale` and
the outer `quote.presentation_digest`, which also binds the source Carts; the nested Order digest
is not the acceptance digest. `initialize` forwards its retained reviewed quote. A presentation
conflict exposes the complete replacement `CheckoutQuote` for review, never silent acceptance.
Quote methods use the configured locale unless one is explicitly supplied. Standalone Admin
`order.getQuote` still accepts a Market key; Cart creation uses a Market UUID.

Acceptance does not synchronize items or accept new buyer, address or pricing selections.
Prepare those through Cart mutations and quote first. The `initialize` facade's `checkout` accepts
only a
provider from the reviewed `order.payment_option_ids`, `return_url`, `clear_after_checkout`, `save_payment_method` and
`payment_method_terms_version`. Saving a method requires a selected provider and explicit
versioned consent. Recovery retains that exact consent with the original request.
Omitting the provider selects the quote's suggested provider; choosing another permitted provider
does not alter the reviewed selections or prices. An unquoted provider is rejected before submission.

The high-level `cart.refresh` and `cart.quote` accept native `delivery_groups`. Each group retains
its own ID, destination, items, selected `shipping_rate_id`, optional quote acceptance and schedule.
Omitting the field preserves existing groups; `[]` explicitly clears them. Do not supply both
`delivery_groups` and the simple `shipping_address` convenience input. Shipping methods are not
prices: select a quoted ShippingRate on its delivery group, then quote again and review the total.
Payment-option choice belongs to `checkout`, not `quote`.

Hydrated `product_items` expose `shipping_profile_id` from the same Variant read used to hydrate
the item; nonphysical variants have `null`. Use it when assigning physical items to delivery groups.
Omit `promotion_codes` during unrelated Cart edits to preserve applied promotions; `[]` or `null`
explicitly removes them. The helper's `promotion_codes` atom contains display codes from the latest
quote, not the Cart's stored promotion UUIDs, and is cleared when that quote is invalidated.

`cart.checkout` accepts the reviewed Cart into one Order; there is no separate Checkout record.
Browser acceptance saves the exact Cart UUID, generated `request_id`, locale, digest, optional
provider and return URL under the shared cross-tab durable-request lock before POST. The request
goes to `/carts/accept` with the reviewed `sources`, and its `request_id` makes a repeat submission
return the same accepted Order. A lost response retains that request; `pendingCheckout()` reads it
and an explicit `recoverCheckout()` submits the same request without requote or Cart mutation.
These methods exist on `client.eshop.cart` and `arky.eshop.cart`; Admin exposes the same operations
with an optional Store selector. Success reads the returned Order and verifies that its `source` is
the `cart_acceptance` of this request, with the same Cart version and line bindings, before
clearing saved state. A definite rejection clears the saved request. Recovery does not require the
original Cart to survive cleanup.
The result carries `order_id`, `number`, `payment` and a transient `payment_action`; read the Order
with `eshop.order.get({ id: order_id })`. An explicit
`eshop.checkout.resumePayment({ order_id })` (`POST /orders/{id}/payment-action`) can return a fresh
transient action for the original open payment Session; it cannot create another Payment or
Session. Pending, Processing, Unknown and terminal payments return local status with no action.
These methods are available on the storefront client, `initialize` facade and Admin (with optional
`store_id`). Persist only the accepted IDs, never the action's client secret. Unresolved acceptance
still uses the original `cart.recoverCheckout()` request, not payment-action resume.
Do not clear storage manually after a conflict or allocate a new Cart to retry the same purchase.
A presentation conflict preserves the request instead of silently accepting its refreshed quote.

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
  payment_option_id: reviewed.order.payment_option_id ?? undefined,
});
```

The quote envelope contains `sources`, `order` and `presentation_digest`; accept the envelope's
digest, not the inner Order presentation digest. Product quote lines have `line_item_id`, total
`money` and exact per-unit `money_runs`. Do not invent one unit amount from a rounded total.
Each run retains discount provenance, tax assessment and duties. Delivery charges live in
`delivery_groups`, not a separate shipping-lines array.

Quote Product/Digital snapshots carry an `AppliedPriceSnapshot`. Accepted Order snapshots use
`price.type = "direct"` with that snapshot under `price.price`, or `"subscription_allocation"` for a
plan's entitlement lines; an allocation is a share of the plan price, not a second standalone
price. The Subscription plan line carries no money of its own: its linked Product, DigitalProduct
and `rental_use` lines carry the allocated plan price, and the plan's Price snapshot is accepted
evidence that is not added again. Accepted plan terms retain `offering_key` and `plan_key`. In a
plan quote, show the `entitlement_lines` as the package's portions without double counting.
Historical live Product/variant/Offering/Resource/DigitalProduct links may be null; retained
snapshot names, source identities and accepted money do not require a live definition lookup.

Physical Product variants reference InventoryItem components through their fulfillment recipe.
Weights/customs belong to InventoryItem; InventoryLevel is independent stock at one StoreLocation.
Stock admission is decided by quote and acceptance, not by a Product-wide client inventory sum.

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

One Cart booking item is one appointment and contains one `booking_offering_id`, one
`requested_interval` and its `capacity_units`. BookingOffering does not configure Forms. If application code submits a
standalone Form first, pass only its resulting submission ID with the appointment:

```typescript
const presentation = await arky.forms.get({ key: "booking-details" });
const request = {
  id: crypto.randomUUID(),
  key: "booking-details",
  presentation,
  values: { note: "Window seat, please" },
};
const submission = await arky.forms.submitByKey(request);

await arky.eshop.bookingService.addToCart(undefined, submission.id);
```

Accepted Orders embed tagged `line_items` for products, bookings, digital products, subscription
plans and rental use. Their snapshots, money, commercial status, Form evidence and timestamps arrive
with the Order.
`orderBookingItems(order)` selects its booking lines. Independent `OrderBooking` roots retain
appointment execution and reminders; Admin reads one with `eshop.order.getBookingAppointment`.
Completed and NoShow appointments keep their Order line commercially Confirmed.

Order is accepted purchase history, not a product, address or price editor.
Use Cart for new selections, and the dedicated item/financial/fulfillment
commands for ongoing obligations. Root and item statuses use `status.type`.

Accepted buyer, company, Market and SalesChannel snapshots remain independent of current definitions.
`Order.source` records what generated the purchase: `cart_acceptance`, `direct` or
`subscription` (a renewal occurrence). `origin` retains the accepting actor; it is not live
authorization. Render the saved snapshots and each line's saved `money.total` instead of repricing
historical catalog definitions.

Confirmed booking items have dedicated lifecycle commands. Admin clients can cancel, complete, or
mark an item as a no-show; only the owning EmailAuthenticated CustomerSession can cancel through the
Storefront client.
Each command returns the refreshed Order, and cancellation never implies a payment refund:

```typescript
import { createAdmin } from "arky-sdk/admin";
import { orderBookingItems } from "arky-sdk";

await arky.eshop.cart.quote();
const bookingCheckout = await arky.eshop.cart.checkout({
  payment_option_id: "payment-option-id",
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
console.log(setup.payment_options); // [{ id, key, blocks, type: "cash_on_delivery" | "manual" | "stripe" }]
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

Payment configuration belongs to Arky. Card checkout returns either `stripe_embedded_checkout`
or `monri_components`. Both use the same accepted Order and Payment. The SDK mounts
the exact provider form inside the merchant page; server-only merchant credentials never leave
Arky. `none` has no form and mounts to `null`.

```typescript
import { mountCheckoutAction } from "arky-sdk";

await arky.eshop.cart.quote();
const result = await arky.eshop.cart.checkout({
  payment_option_id: "stripe-payment-option-id",
  return_url: window.location.href,
});

const mounted = await mountCheckoutAction(result.payment_action, "#payment", {
  onComplete: () => arky.eshop.order.get({ id: result.order_id }),
});

// Call mounted?.destroy() when the checkout view is disposed.
```

Stripe purchase actions include a required `connected_account_id`. Store subscription selection
uses its separate Stripe action with nullable `stripe_account_id`. Stripe owns submission inside
its form; the returned mount has `type: "stripe_embedded_checkout"` and a `checkout` instance.

Monri requires an HTTPS page and loads its card fields directly from Monri's official script
origin. The action provides only the exact Payment ID, Test/Live environment, browser authenticity
token and session client secret. Do not persist the action or invent an expiry. A page cannot mix
Monri Test and Live libraries. The returned mount has `type: "monri_components"`; connect its
`confirm` method to the buyer's explicit form submission with their actual billing details:

```typescript
import type { MonriBuyerDetails } from "arky-sdk";

async function submitMonri(details: MonriBuyerDetails) {
  if (mounted?.type === "monri_components") {
    await mounted.confirm(details);
  }
}
```

Billing requires `fullName`, `address`, `city`, `zip`, `phone`, `country` and `email`. Card numbers
and security codes stay in Monri's hosted fields. This path does not save a reusable card or offer
installments. `onValidationError` provides safe card-validation text. `MonriCheckoutError.code`
distinguishes invalid billing from an uncertain submitted result. Invalid billing can be corrected
before submission; an attempted native confirmation is not automatically retried. After uncertainty,
read the same ARKY Payment instead of accepting the Cart again. Checking status must not remount
an unchanged capability and silently re-enable submission.

Both mounts expose `destroy` and `unmount`. Monri cleanup removes only the SDK-owned host and
suppresses its later callbacks; Monri does not document a native component-destruction method.
Neither method cancels a provider payment.

Embedded completion and browser return are prompts to read authoritative ARKY state, not payment
proof. Stripe uses its supported signed-event/exact-observation policy; Monri initial Purchase
uses signed backend notifications. An approved or declined browser result never settles money in
the SDK. A delayed notification can leave the same Order awaiting payment.

Saved cards are `admin.eshop.paymentMethod` records (and `storefront.eshop.paymentMethod` for the
signed-in customer). A card belongs to a Customer or a Company (`owner`), keeps the PaymentOption it
was saved with and shows its `details` (brand, last 4 digits, expiry) once Ready. A card is saved at
checkout with `save_payment_method`, or added with `requestSetup`, then `startSetup` (which returns
the Stripe SetupIntent `client_secret` for Stripe.js) and `completeSetup` after confirmation. Monri
cards are saved at checkout. `subscription.updateCard({ command_id, request: { subscription_id,
order_id, payment_method_id } })` pays a declined renewal Order with another ready card of the same
payer and makes later renewals use it; switching between Stripe and Monri is refused with
`PAYMENT_METHOD.PROVIDER_SWITCH`.

Store Admin configures Monri with `store.paymentOption.monri.create`. Merchant key and
authenticity token are write-only; configuration reads return only its environment. Use
`store.paymentOption.update` with the current `expected_updated_at`, unchanged content Blocks
and explicit Active/Disabled status to change availability. That update cannot replace merchant
credentials, provider identity or environment. Saving configuration performs no provider call;
selecting one card provider on the Market remains a separate step.

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

Admin client configuration does not require a Market. Non-commerce calls need no placeholder
Market or commerce initialization; commands that use a Market take their explicit context.

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
Account-wide; login on a Store's verified Admin domain (`admin.store.adminDomain`) issues a
Store-scoped Session. Scope is server-selected from the login origin, not a request option.

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

const storefrontClients = await admin.store.storefrontClient.find({
  store_id: store.id,
  limit: 20,
});

const classifications = await admin.classification.find({ limit: 20 });
```

Publishable credentials belong to individual StorefrontClient registrations and their allowed
sales channels, not to Store settings. Use `store.storefrontClient.create/update/revoke` to manage those
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

`admin.store.market.list`, `admin.store.location.list` and `admin.store.paymentOption.list`
return `{ items, cursor }`, not complete arrays. Each accepts an explicit `store_id`, exact `key`,
owner-specific filters, `created_at`/`updated_at` ordering and bounded `limit`/`cursor` paging.
Market filters include currency and active/deleting status; Location filters include
`is_pickup_location` and active/archived/deleting status; configured providers filter by
`configuration_type` and active/disabled/deleting status. No helper silently fetches all pages.
Storefront Market/Location lists also return pages; their authenticated context supplies Store
and active-only visibility, so neither `store_id` nor status belongs in their query.

Use `market.get({ store_id, id })` or `location.get({ store_id, id })` for a saved selection,
and `getByKey({ store_id, key })` for exact configuration lookup. Provider configuration has
`paymentOption.getByConfiguration({ store_id, configuration_type })` in addition to exact ID/key
reads. A missing discovery candidate is not proof that configuration is absent and never
authorizes repeated creation, connection or payment. Only exact reads confirm a saved identity.

Store creation leaves Commerce uninitialized. Content, Forms, and Support work without a Market;
a non-commerce StorefrontClient can have an empty `sales_channel_ids` list. An Owner explicitly
starts commerce with `store.commerce.initialize({ operation_id, request })` and inspects the same
operation with `store.commerce.getInitialization({ operation_id })`. Ready Store reads expose `default_market_id` and
`default_sales_channel_id` inside `commerce` when `commerce.type === "ready"`.
Use `storeCommerceDefaults(store)` to read that pair; uninitialized/initializing Stores have no
implicit defaults. An update may select other current same-Store defaults; neither accepts `null`,
and the SDK does not select a replacement for the operator.

### Stripe connection setup

Create a local Stripe PaymentOption before calling `store.paymentOption.stripe.connect`.
The connection request requires its `payment_option_id`, a canonical UUID-v4 `operation_id`,
explicit `authorize_account_debits`, and return/refresh URLs. An unconnected account also needs
its two-letter country. The response contains `provider`, the retained eleven-field `operation`,
and a response-only `onboarding_url`.

Inspect an uncertain result with `store.paymentOption.stripe.getConnection({ store_id,
operation_id })`. This exact authorized read makes no Stripe call. Account creation and metadata
binding have independent tagged statuses; `unknown` is not a failed request or permission to
create another account. Browser integrations must persist the exact request with the shared
durable-request utilities before sending and retain it through failed reads or ambiguous responses.
The low-level SDK neither generates a replacement operation nor automatically retries connection.

### Companies and Customer groups

Company management is top-level: `admin.companies` exposes `create`, `get`, `find`, `update`,
`usage` and `delete`. Its `membership`, `role` and `location` owners expose their corresponding
commands. Company Customers are members, while roles define explicit Company permissions;
neither an arbitrary Company ID nor a Customer group grants membership or sign-in proof.

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
  scope: { type: "company_wide" },
});

const group = await admin.eshop.customerGroup.create({
  key: "wholesale",
  name: "Wholesale",
  status: { type: "active" },
  join_policy: { type: "private" },
  communication: { type: "disabled" },
});
await admin.eshop.customerGroupMember.execute({
  command_id: crypto.randomUUID(),
  command: {
    type: "grant_admission",
    customer_group_id: group.id,
    member: { type: "company", company_id: company.id },
    expected_updated_at: null,
  },
});
```

`CompanyProfile` and `CompanyAddress` mirror strict wire values: include every declared field and
use `null` for an absent value. Address fields are `name`, `company`, `street1`, `street2`, `city`,
`state`, `postal_code`, `country`, `phone` and `email`. CompanyLocation's shipping address must also
satisfy Server shipping validation. A location update explicitly supplies `billing_address`,
including `null` to clear it. A membership's `scope` is `company_wide` or explicit
`locations`. A role's key cannot change. The closed permission set distinguishes placing Orders
from creating Subscriptions and own history from Company history.

A Customer group is an audience. `admin.eshop.customerGroupMember` holds its one relationship per
Customer or Company member: `execute` runs a journaled `grant_admission`, `revoke_admission`,
`grant_administrative_access` or `clear_administrative_access` command under a caller-retained
`command_id` (retry the same command after a lost response), `lookup` reads the exact member
and `find`/`findCommands` page members and command history. Membership buys nothing and subscribes
no one to email; group email consent is `admin.eshop.customerGroupEmailConsent`. Company membership
queries select at most one of Company, Customer or role. Server validates supported filter
combinations and current authority.

### Markets, SalesChannels and deletion

`admin.store.salesChannel` exposes typed `create`, `get`, `find`, `update`, `usage` and `delete`.
Market management uses `admin.store.market`: `list()`, `get(id)`, `usage(id)`, `create`, `update`
and `delete`. Market key/currency and SalesChannel key are immutable. Market reads use tagged
`active`/`deleting` status; SalesChannels can additionally be archived.

Company, membership, role, location, group, channel and Market edits/deletes require the
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
release the other, restart Campaigns, resend cancelled email, or restore a group email consent. No generic
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

A Promotion owns typed eligibility `conditions` and discount `effects`; `activation` is
`automatic` or `code`, and a code-activated Promotion is redeemed through its PromotionCode
records. Each effect carries a caller-generated UUID-v4 `id`, unique within the Promotion; keep it
unchanged on update to preserve that effect. An update sends `expected_updated_at` and replaces the
complete condition and effect arrays:

```typescript
const promotion = await admin.eshop.promotion.create({
  key: "welcome-10",
  activation: { type: "code" },
  conditions: [
    { type: "minimum_order_amount", money: { amount: 5_000, currency: "eur" } },
  ],
  effects: [
    {
      type: "item_percentage",
      id: crypto.randomUUID(),
      target: { type: "products", product_ids: ["product-id"] },
      basis_points: 1_000,
    },
  ],
  stacking: { type: "combinable" },
  priority: 0,
  max_uses: null,
  max_uses_per_customer: 1,
  status: { type: "active" },
  starts_at: null,
  ends_at: null,
});

await admin.eshop.promotionCode.create({
  promotion_id: promotion.id,
  code: "WELCOME10",
  max_uses: null,
  status: { type: "active" },
});
```

`item_fixed`, `order_fixed`, `delivery_fixed` and `minimum_order_amount` carry a shared `Money`
value. Redemption windows use nullable `starts_at` and `ends_at`.

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
`payment_option_id`, `money` and required nullable `reference`; intent creation is not money received.
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
through `admin.eshop.dispute.find({ payment_id })` and `admin.eshop.dispute.get({ dispute_id })`;
their public provider evidence contains only `dispute_id` and `charge_id`.

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

Customers use `arky.eshop.order.cancelProductItem` with the same saved command shape. Only the
Order's Customer may request it; Company purchases additionally require current branch purchase
permission. The response can retain uncancelled units while a partner confirmation is pending.
Only applied cancellation creates a commercial credit; accepted Order prices never change.

## Fulfillment

Inventory owns physical items, warehouse levels, Individual Units and the movement log. Available
stock is `on_hand - reserved - unavailable` and may be negative for permitted backorders. A job
holds its remaining quantities when its delivery opens; future Scheduled work holds none. Setting
stock aside protects it from dispatch. Every stock change retains its movement source.

FulfillmentOrder is a warehouse job. An `order_product` line maps stable local work positions to
accepted Order units. A `rental_issue` line names the Rental and accepted terms revision; replacement
also retains the predecessor Unit and its exact delivery line/index. One job may combine products
from one Order delivery group with rental equipment. Work positions are distinct from Order unit
positions and physical serial numbers. Use `admin.eshop.fulfillmentOrder.find({ order_id })` or
`find({ rental_id })`, and `get({ fulfillment_order_id })` for one exact job.

Fulfillment records the units prepared and sent from one job. Its method comes from the job:
delivery goes Preparing → Fulfilled; pickup goes Preparing → Ready → Fulfilled. Ready notifies the
customer but does not move stock. Fulfilled moves stock once. There is no separate parcel record,
package-size/customs input or carrier-label API. Tracking is entered by staff or the partner.

```typescript
const prepared = await admin.eshop.fulfillment.create({
  fulfillment_id: savedFulfillmentId,
  fulfillment_order_id: work.id,
  lines: [{
    fulfillment_order_line_id: work.lines[0].id,
    unit_spans: [{ first_unit: 0, quantity: 1 }],
    selected_units: [],
    lot_reference: "milk-batch-2026-09",
  }],
});

const dispatched = await admin.eshop.fulfillment.execute({
  fulfillment_id: prepared.id,
  command_id: savedDispatchCommandId,
  expected_updated_at: prepared.updated_at,
  action: { type: "fulfill", late_reason: null },
  tracking: { carrier: "Local courier", number: "DEL-1042", url: null },
});
```

Persist each caller-owned UUID and complete request before sending. Retry an uncertain response
with that identical payload. A pickup needs a `ready` command before `fulfill`; its tracking remains
null. Use `updateTracking` for delivery tracking and `markDelivered` for its actual delivery time.
Collection sets `delivered_at` automatically. Neither tracking nor delivery-time changes move stock
again. Cancelling a preparation uses `execute` with `action: { type: "cancel" }` and frees its
prepared positions while leaving the job's quantity hold in place.

`fulfillment.find` takes exactly one `order_id`, `fulfillment_order_id` or `rental_id` scope and
returns `{ items, cursor }`. `selectFulfillmentUnits` from `arky-sdk/utils` selects quantities from
loaded work and its complete Fulfillment history, excluding executed units and active preparations.
It returns empty `selected_units` for quantity-tracked goods. Individually tracked components need
explicit `{ fulfillment_unit_index, inventory_unit_id }` bindings for the complete recipe.

Use `fulfillmentOrder.unitSlots({ fulfillment_order_id, expected_updated_at: work.updated_at,
lines })` for the exact Individual component slots. It returns the job line/index, Item/key and
nullable allocated Unit without changing stock. Find Available Units at that warehouse, pass the
chosen Unit's revision and exact job/line/index to `inventoryUnit.allocate`, and resolve again to
show saved assignments after refresh. At most 100 physical component slots are resolved per request.
Server admission rechecks the allocation and all current work before accepting a Fulfillment.

A warehouse is run by staff or a FulfillmentPartner. Partner memberships and account API tokens
see only their warehouses' operational work and stock. Partners accept, reject or hand back jobs
through `fulfillmentOrder.controlPartner`, and use the same Fulfillment APIs to record goods leaving.
A cancellation of accepted partner work stays pending until confirmation or dispatch. Pending
Product lines retain `cancellation_command_id`, identifying the original Order request; rental-ending
lines carry null. Confirmation applies only those still-pending units and preserves the requester.

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
payment, refund, fulfillment, and media request recovery records are not cleared, rewritten, or assigned
new request identities by this auth cutover. Durable media uploads retain `File.lastModified` as native browser millisecond metadata, including
its exact frozen JSON bytes and replay identity; it is not a seconds-valued Arky domain timestamp.

```typescript
import {
  initialize,
  type ArkyStore,
  type StorefrontDto,
  type StorefrontSetup,
} from "arky-sdk/storefront";
import type { Block, BookingService, Cart, Order, Price, Product } from "arky-sdk";

type StorefrontProduct = StorefrontDto<Product>;
type StorefrontCart = StorefrontDto<Cart>;
```

Storefront request types intentionally contain no Store routing ID. Admin request types remain Store-explicit.

## Verification

Run the complete SDK package contract with one command:

```bash
npm test
```

It builds the distributable package and runs every SDK contract case. Admin verifies the SDK
against a real test Server: on CI the published test image pinned to its immutable digest, locally
a host Server built from the current source. Each storefront owns a hermetic repo-local
build/preview Playwright smoke through its own `npm test`; storefronts never pull or run the shared
test Server image.

## Adding an endpoint

When adding SDK methods:

1. Mirror server response DTOs in `src/types/index.ts` or the relevant API module.
2. Keep Admin inputs Store-explicit, but omit `store_id` from every storefront input, URL, and body.
3. Use `/v1/storefront/...` keyless routes and let the shared client attach publishable-key, locale, market, and visitor headers.
4. Mark customer mutations as stateful so they call the deduplicated visitor-session lifecycle.
5. Add explicit response generics to every HTTP call and re-export consumer-facing types.

## Shared company and customer area

A Store owner can enable the branded customer area in the Admin app. The public
`store.customerWorkspace.get({ id: storeId })` returns branding and a publishable StorefrontClient
binding. It grants no Account or Company authority. Store owners configure it with
`store.customerWorkspace.update({ id, expected_revision, customer_workspace })`; preserve the
returned revision even when its binding is disabled.

Company users sign in with normal Customer email proof. Use `companies.memberships` to page their
memberships, `companies.access({ id })` for current permissions and branch scope, and
`companies.locations({ company_id, limit, cursor })` for permitted branches. Orders and subscriptions
accept `company_id` plus `company_location_id`; access is rechecked on primary records for every read.
The `view_own_*` permissions retain the original purchaser restriction. `view_company_*` permissions
allow the current authorized branch’s records. Customer groups determine catalog visibility without
replacing Company membership or role checks.

Purchases use the normal catalog, Cart review and acceptance flow. Each Company purchase names the
chosen branch. Starting a package also needs `create_subscriptions`; saving its Company card needs
`manage_payment_methods`. Fulfillment partners use Account sessions restricted to their assigned
warehouses and operational work.

`eshop.rental.find({ subscription_id, limit, cursor })` lists the authenticated customer’s permitted
rental agreements. `eshop.return.orderOptions({ order_id })` and
`eshop.return.rentalOptions({ rental_id, limit, cursor })` supply current returnable selections.
Submit the explicit selected goods or machine through the normal return request command. Staff or
an authorized fulfillment partner approves, receives and inspects returned stock.

Dedicated card setup can be mounted using `mountPaymentMethodSetup(start, element)` from
`arky-sdk/storefront`; call the returned `confirm(returnUrl)` after consent and destroy it on unmount.
A refresh calls `startSetup` for the retained method to recover the same actionable SetupIntent.
`completeSetup` observes the provider outcome; a browser completion is never payment-method proof.
