# arky-sdk

Official TypeScript SDK for [Arky](https://arky.io). It gives a storefront everything it needs (products, carts, checkout with Stripe or Monri, sign-in, forms, bookings, orders, content), plus the Admin client for staff tools and scripts.

## Install

```bash
npm install --save-exact arky-sdk@<version>
```

Pin the exact version, so the Server, Admin and storefronts move together.

## Start here

| You are building | Call | Import from |
|---|---|---|
| A website or web app | `initialize({ storeId, salesChannelId }, options)`: the client plus reactive atoms, a cart store per buyer, package and market, a headless checkout and a booking calendar | `arky-sdk/storefront` |
| Server code, or your own state layer | `createStorefront({ storeId, salesChannelId }, options)`: the plain storefront client, the same calls without atoms | `arky-sdk/storefront` |
| Staff tools, scripts, back offices | `createAdmin({ apiUrl, accountToken? })` | `arky-sdk/admin` |
| A React app | `createArkyReact<AdminClient>()` or `createArkyReact<StorefrontClient>()`: TanStack Query options and keys for every call of that client ([React](#react)) | `arky-sdk/react` |

`arky-sdk/storefront` exports everything a storefront needs: both clients, the helpers (prices, blocks, images, paging, payments, forms), the error classes and every type. `arky-sdk/utils` holds the helpers on their own, and `arky-sdk/types` the types with the error classes and constants.

## How every call works

- **One params object, then request options.** A call takes one object of Arky's own fields, then optional request options: `signal`, `headers`, `onSuccess`, `onError`, and on the storefront `locale`, `market` and `order_token` for that one request. Each client has its own type for them: the Admin client takes `AdminRequestOptions`, without `locale`, `market` and `order_token`, and the storefront `StorefrontRequestOptions`. A call with nothing to send, such as `customer.getMe()`, takes only the options. Admin calls that act on a store name its `store_id`.
- **One verb per kind of action.** `find…` reads a list. `get…` reads one record or view: `get({ id })`, `get({ slug })` where a record has slugs, `getByKey({ key })`. Records change through `create`, `update` and `delete`. A cart or a checkout changes through `add…`, `remove…`, `set…` (replace a value) and `select…` (pick one of the offered choices). Business actions keep their own names: `quote`, `shipTo`, `checkout`, `place`, `submit`, `cancel`, `pause`, `requestCode`, `verify`.
- **One casing rule.** Arky's data is snake_case: params, answers, atoms and the helpers' results. The SDK's own setup options and callbacks are camelCase: `apiUrl`, `createId`, `onComplete`.
- **Every list answers a page.** `{ items, cursor }`, with `cursor: null` on the last page. Pass the cursor back to read the next page, or let `readAllPages(read)` collect them and `paginate(read)` walk them. A missing record is an `ArkyApiError` with status 404 and its record's own code, such as `PRODUCT.NOT_FOUND` (see [Errors](#errors)).
- **The app picks every id.** A create takes the record's `id`, a canonical UUID v4 the app makes once per user action and sends again on every retry. The same request under the same id answers the stored record; a different request under it is refused (409). The SDK never makes an id up: storefront calls that leave the `id` out take it from your `createId` factory.
- **Changes carry the version they read.** Updates and actions send `expected_updated_at` (the `updated_at` you read); a stale one is refused with 409. The cart store sends it for you. Stock actions and two conversation actions name what they read instead. A stock action names the stock level (its id, or `expected_level_id` on a movement or a unit receipt) and its `action_id` (a unit receipt names its new unit's `id`), and an adjustment names the count it corrects in `expected_count` (the level's `on_hand`, or its `unavailable` with `from_set_aside`). Assigning a conversation names the assignee you read (`expected_account_id`), and changing its reply email the selection you read (`expected_reply`). A value that moved is refused with 409 `GENERAL.CONFLICT`. A package's access row has no version, so its delete names only the row's id.
- **A cart keeps its market.** A cart call names the cart's own market: another one is refused with `409 CART.OTHER_MARKET`, so a cart kept from another market is read, or moved with an `update` whose `market_id` is the context's, before anything is added.
- **Plan access.** A store without plan access refuses storefront changes with `402 STORE.SUBSCRIPTION_REQUIRED`, an email change and the code request for it included; buyers can still identify, sign in with a code, sign out, read and edit their profile, and read what they hold.
- **Context is explicit.** Storefront requests carry `X-Arky-Store-Id` and `X-Arky-Sales-Channel-Id`, plus the locale and the market you set with `setContext({ locale, market })`. A call names the package it reads, and the company or one of its locations it acts for, never both. Every commercial call (packages, their items, products, bookings and carts) names its market, even when the named channel sells in one: without it Arky refuses with 409 `SALES_CHANNEL.MARKET_REQUIRED`, and a market the channel doesn't sell in with `SALES_CHANNEL.MARKET_NOT_LISTED`. A request through an archived sales channel of the store is refused with 409 `SALES_CHANNEL.NOT_ACTIVE`, which leaves the shopper's session as it is. Content reads need no market. A locale outside the store's languages is refused with `STORE.LANGUAGE_NOT_SUPPORTED`.
- **Errors carry a code.** Everything the SDK throws at runtime is an `ArkyError` with a `code` that you map to your own text. A `TypeError` means your code passed a wrong value. See [Errors](#errors).

## 1. Set up the store

```typescript
import { createOrderToken, initialize } from "arky-sdk/storefront";

const arky = initialize({ storeId: "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19", salesChannelId: "e5a8c2d7-3b91-4f06-9d4e-1c7b6a0f3e28" }, {
  locale: "en",
  market: "eu",
  createVisitorIdentity: () => ({ customer_id: crypto.randomUUID(), session_id: crypto.randomUUID() }),
  createSessionId: () => crypto.randomUUID(),
  createId: () => crypto.randomUUID(),
  createOrderToken,
});

const setup = await arky.store.load();
const packages = await arky.eshop.package.find();
const shopPackage = packages.find((candidate) => candidate.key === "public");
console.log(setup.name, setup.languages, arky.currency.get(), shopPackage?.id);
```

- **The four factories are required.** The app picks every customer, session and record id and every order token; `createOrderToken` makes a token in the shape Arky accepts. Without them `initialize` throws.
- **`apiUrl`** defaults to `https://api.arky.io`. The store and sales-channel IDs are required canonical UUID v4 values. They are public identifiers and authenticate no person.
- **Sessions** are kept in `localStorage`, separately for each API URL, store and sales channel. During server rendering, pass a request-local `sessionStorage` adapter. `visitorIdentity` restores a visitor pair your app picked earlier.
- **`arky.store.load()`** reads the store's setup and the current market and fills the `setup`, `market` and `currency` atoms; the market's `payment_option_ids` lists its payment options, and each quote's `payment_option_ids` lists the ones that can pay that cart. The client reads each market once: `arky.client.store.market.getCurrent()` answers the current one from the same read. `arky.getSetup()` only answers the setup: `name`, `timezone`, `languages`, `payment_options`, `customer_sign_in`, which is `{ type: "store" }` when the store signs its own customers in, or `{ type: "network", network_id }` when they sign in through the network ([Network customer sign-in](#network-customer-sign-in)), and `seller`, which is `{ type: "seller", name, address }` with the store's legal name and postal address, or `{ type: "none" }`. The setup is read once per client. A `409 PAYMENT_METHOD.TERMS_CHANGED` refusal (the store changed an option's saved-card wording) drops it, so the next `getSetup()` or `store.load()` reads the new wording.
- **Packages.** A package is a set of things you can buy, get or rent; a shop is a package with priced items. `eshop.package.find()` lists the packages open to this buyer in the current market and sales channel as a plain array, each with its `blocks` (its name and texts) and its access `level`. Pick yours by its `key`; every item, product, booking and cart call names its `package_id`. `package` is a reserved word in strict TypeScript, so a local holding one is `shopPackage` or `memberPackage`; properties such as `eshop.package` are fine.
- **`setContext({ locale, market })`** changes the language or the market. A market change clears every cart view; each market keeps its own carts and its own cart store, and switching back reads them again.

The store has the same calls as the plain client, under the same names. On top of them it has atoms (`session`, `setup`, `market`, `currency`, `locale`, …) and three helpers, each for one buyer and package in the current market: `eshop.cart(scope)`, `eshop.checkoutFlow(scope)` and `eshop.bookingCalendar(scope)`. The plain client's own cart calls stay reachable at `arky.client.eshop.cart`.

## 2. Products

A package sells products, booking services and packages through its priced items. `eshop.packageItem.find` pages them, one answer per priced item in the current market:

```typescript
import { findBlock, formatMinor, getBlockTextValue, getImageUrl } from "arky-sdk/storefront";
import type { Media, StorefrontPackageItem } from "arky-sdk/storefront";

const page = await arky.eshop.packageItem.find({ package_id, include_price: true, selection: { types: ["product"] }, limit: 24 });
const imageIds = page.items.flatMap((item) => {
  const image = findBlock(item.content, "image");
  return image?.type === "media" && image.value ? [image.value] : [];
});
const images = await arky.media.find({ ids: imageIds });
const imageById = new Map<string, Media>(images.map((image) => [image.id, image]));

const rows = page.items.map((item: StorefrontPackageItem) => {
  const image = findBlock(item.content, "image");
  const summary = item.price_summary;
  return {
    name: getBlockTextValue(findBlock(item.content, "name"), "en"),
    image: image?.type === "media" && image.value ? getImageUrl(imageById.get(image.value), "medium") : null,
    from: summary && item.currency ? formatMinor(summary.min_amount, item.currency, "en") : "",
    href: `/products/${item.content.slugs.en}`,
  };
});
console.log(rows, page.cursor);
```

- **One search for every priced item.** An answer names its `package_item_id`, `package_id` and `market_id`, what it lists (`item`), its `position` and the listed record's `content` (`key`, `slugs`, `blocks`, `categories`). `selection` narrows and orders the answers:
  - `types` (`product`, `booking_service`, `package`), `text`, `categories` (for products and booking services) and block filters `blocks` on the listed record;
  - `price: { min_amount?, max_amount? }` and `price_basis` (`product_unit`, `booking_option`, `package_never` or `package_every` with its `cadence`). Every price of one item has the same basis, so an item matches when its basis is the one asked for and its lowest to highest price overlaps the range. Search is per item, not per variant: a storefront that needs one variant filters its own read of the item's prices;
  - `sort`: `package_order` (the default) or `starting_price` (needs `price_basis`), and `direction`, `asc` unless you ask for `desc`. `text` matches words and word starts of an item's text, or the listed record's exact key, and keeps the order you ask for.
- **Prices in search.** With `include_price: true` and an access level that shows prices, an answer has its `currency` and `price_summary`, `{ basis, min_amount, max_amount, price_count }` over the item's prices on sale. A package's item holds exactly one price, and its answer names it as `price_id`.
- **Pages.** A page holds 20 answers unless you ask for more, and a page can come back short with a `cursor`: follow it.
- **Media.** `media.find({ ids })` takes any number of ids, reads them 100 at a time and answers a plain array, and an answer that isn't a list or names a file it didn't ask for is refused (`ArkyError` `answer_mismatch`); `content.load` and `loadEntries` read their media through it. Storefront reads answer Public files, with their URL at `content.original.url`. Images also come as `thumbnail`, `small`, `medium` and `large`, and `getImageUrl(media, size)` picks one. Private files have null metadata URLs and `getImageUrl` returns null for them.
- **Texts are blocks.** `findBlock(record, key)` finds a block and `getBlockTextValue(block, locale)` reads its text in the language you name, never another; an empty string means there is none.

A product page reads the product by its slug in the current language, then the prices of its item:

```typescript
const product = await arky.eshop.product.get({ slug: "classic", package_id });
const { items: choices } = await arky.eshop.packageItem.findPrices({ package_item_id: product.package_item_id, package_id, include_price: true });
const byKey = await arky.eshop.product.getByKey({ key: "classic-x1", package_id });
console.log(choices.map((choice) => [choice.price_id, choice.content.sku, choice.price?.unit_price.amount]), byKey.id);
```

- **Reads.** `get` takes `{ id }` or `{ slug }`; a key is read with `getByKey({ key })`. Both answer the product with the `package_item_id` of its item in that package and the current market. Booking services and categories read the same way; collections, forms, markets, packages and their offerings read by `{ id }` or with `getByKey({ key })`.
- **Prices.** `packageItem.findPrices({ package_item_id })` pages an item's prices, its exact choices. Each names its `price_id`, the `sellable` it prices (a `product_variant`, `booking_offering` or `package`), its `content` (`sku`, `blocks` and the price `basis`) and, with `include_price: true`, its `price`, which carries the full reference (`package_id`, `package_item_id`, `price_id`) a cart line names.
- **More reads.** `packageItem.getByParent({ item: { type: "product", product_id } })` reads the item of a record in the current market, `productVariant.get({ product_id, id })` reads one variant, with its price when you pass `include_price: true`, and `product.findByIds({ ids, package_id })` reads up to 100 products in one request, answering `{ items, cursor: null }` with the ones the package sells now, in the order asked. Staff read up to 100 variants with `eshop.productVariant.find({ store_id, ids })`, which takes no other filter, sort or page.

## 3. Cart

`arky.eshop.cart({ buyer, package_id })` answers the cart store of that buyer and package in the current market: the same store on every call, shared with the checkout flow and the booking calendar of the same scope. A shopper who switches market gets that market's cart store. A store kept from before the switch refuses its next call with `CartError` `context_changed`. Storefront cart reads answer the buyer's copy of the cart, `StorefrontCart`, and the line helpers take it. Its quote is the buyer's copy too, `StorefrontCartQuote`: a package line's `package` leaves out each item's allocation weight, and its `start` leaves out the reason the store team wrote for an amendment.

```typescript
const cart = arky.eshop.cart({ buyer: { type: "customer" }, package_id });
cart.item_count.subscribe((count) => console.log("items", count));
cart.status.subscribe((status) => console.log(status.error?.code));

await cart.ensure();
await cart.addProduct({ variant_id, quantity: 1, price: { package_id, package_item_id, price_id } });
const [line] = cart.product_items.get();
if (line) {
  await cart.setProductQuantity({ line_item_id: line.id, quantity: 2 });
  await cart.removeItem({ line_item_id: line.id });
}
```

- **Atoms:**
  - `cart`, `product_items`, `booking_items`, `package_items`, `item_count` (product units, one per booking line, and each package line's quantity);
  - `quote_result` and `promotion_codes`, where `promotion_codes` holds every code the quote lists, each with its `state`: `applied`, `stopped` (a promotion ahead of it stopped the ones after it) or `not_applied` (it takes nothing off this cart);
  - `status`: `loading`, `syncing`, `fetching_quote`, `processing_checkout`, `error` and `quote_error`, where an error is `{ code, message }`.
- **Reads:** `ensure()` loads the cart this browser selected for the buyer, package and market, or creates one under an id from `createId`, kept across a lost answer. `load()` only loads; `create({ id?, place_of_sale? })` only creates. A store whose branches issue fiscal receipts names the cart's place of sale, `{ type: "store_location", store_location_id }` or `{ type: "none" }`, when it creates the cart or later with `setPlaceOfSale({ place_of_sale })`. With no session, `load()` answers `null` and sends nothing, so a visitor who only browses never becomes a Customer; the first write identifies the visitor. A selected cart that now names another buyer, package or market ends the selection: another buyer or package is refused once with `CartError` `other_cart`, another market reads as no cart.
- **Changes:** each answers the changed cart and sends the cart id and version for you. Line ids come from `createId` when you leave them out.
  - lines: `addProduct`, `addBooking`, `addPackage`, `setProductQuantity({ line_item_id, quantity })`, `removeItem({ line_item_id })`, `clear()`;
  - checkout details: `shipTo({ destination, contact_email? })`, `setDeliveryGroups({ delivery_groups })`, `selectShippingMethod({ shipping_method_id })`, `setBillingAddress({ billing_address })`, `setBuyer({ buyer })` (a company buyer's `purchase_order_number`; the buyer stays the one this cart store is for, else `CartError` `not_ready`), `setPlaceOfSale({ place_of_sale })`, `setPromotionCodes({ promotion_codes })`, which replaces the whole list, so pass the codes you keep plus the new one;
  - package deliveries: `setFutureDeliveries({ packages })` and `quoteFutureDeliveries({ packages })`.
- **Quote and checkout:** `quote({ contact_email? })`, `checkout(...)`, `retainCheckout(...)`, `pendingCheckout()` and `recoverCheckout()`. `checkout` and `recoverCheckout` answer the placed order; the cart store keeps no copy of it. Most pages use the [checkout flow](#4-checkout) instead.
- **After a failed write:** a write whose answer is lost, or that is refused because the cart changed (409), drops the view: `cart` and `quote_result` turn `null`, and the next `ensure()` reads the current cart. `reset()` drops the view by hand; `clear()` empties the cart in Arky. A change made while another change to the same cart is still being sent is refused with `CartError` `busy` before anything is sent, and the view keeps the first change's answer.
- **Prices.** Every line names the exact price it is bought at, `price: { package_id, package_item_id, price_id }`, one of its item's prices read with `packageItem.findPrices`, so product, booking and package lines name it the same way. A cart is priced from its own package only: a club's prices are the products the club package lists, bought in a cart of that package, and money off for its members in another shop is a promotion with a `package` condition.

A cart line names its variant. To show names, quote the cart and read its products:

```typescript
import { findBlock, getBlockTextValue } from "arky-sdk/storefront";

const cart = arky.eshop.cart({ buyer: { type: "customer" }, package_id });
await cart.ensure();
const quote = await cart.quote();
console.log(quote.lines.map((line) => (line.type === "product" ? getBlockTextValue(findBlock(line.product, "name"), "en") : line.type)), quote.totals.total);
```

The quote is in the store's locale, and each product line's `snapshot` keeps the variant's `variant_sku` and `variant_blocks` as they were quoted. A product line's `compare_at` is its price's comparison amount, or `null` when the price has none. A product line also names its `product` (`{ id, key, blocks }`) and its variant's `shipping_profile_id` (`null` when the variant doesn't ship), so a page names the line and `shipTo` groups shipped lines by profile without reading any variant. The cart's own product lines answer their `product_id`, which a cart update never sends back. A delivery's `money` is `{ price, discounts, tax }`, where only a delivery's `tax` may be `follow_goods`. `quote.ready` is false while `quote.blockers` lists what is missing: a delivery, a shipping choice, a billing address, a taken booking slot, and so on. Each delivery's `offers` name their shipping method by `shipping_method_key` and `shipping_method_blocks`, so a page can show "Courier €45". A rate that needs a weight Arky doesn't know is left out of `offers` and listed in the delivery's `unavailable` with its `code` (`SHIPPING.WEIGHT_UNKNOWN`).

Arky works out every amount a page shows, so a page never adds up money itself:
- **Line totals.** Each product, booking and package line has `totals: { subtotal, discount, tax, total }`, a booking line's for all its `capacity_units` and a package line's the sum of its items, each of which (`get_product`, `rent_product`) has its own `totals`. `total` is `subtotal - discount + tax` in a tax-exclusive market and `subtotal - discount` in an inclusive one.
- **Delivery totals.** Each delivery has `totals` in the same shape, `null` until its shipping is chosen. The quote's `totals` are the sums of the line and delivery totals, so the parts always add up to `totals.total`.
- **One shipping method for the whole cart.** `shipping_choices: [{ shipping_method_id, amount }]` lists each method that serves every delivery, with the sum of its offers, which is what `selectShippingMethod({ shipping_method_id })` sets before delivery promotions and tax.
- **Delivery estimates.** A delivery's and an offer's `delivery_estimate` is `{ min, max }` in business days, or `null`.

## 4. Checkout

`arky.eshop.checkoutFlow({ buyer, package_id })` is a headless checkout for your own cart page: steps, state and errors, and no UI.

```typescript
import { mountCheckoutAction } from "arky-sdk/storefront";

const checkout = arky.eshop.checkoutFlow({ buyer: { type: "customer" }, package_id });
checkout.state.subscribe((state) => console.log(state.step, state.error?.code));

let state = await checkout.open();
checkout.setContact({ contact_email: { email: "ana@example.com", language: "en" } });
state = await checkout.shipTo({ destination: { type: "delivery", address } });
for (const delivery of state.quote?.deliveries ?? []) {
  const [offer] = delivery.offers;
  if (offer) {
    state = await checkout.selectShipping({
      delivery_group_id: delivery.delivery_group_id,
      shipping_method_id: offer.shipping_method_id,
      rate_id: offer.rate_id,
    });
  }
}
if (state.step === "payment") state = await checkout.place({ return_url: (orderId) => `${location.origin}/order?order_id=${orderId}` });

const placed = state.placed;
if (placed && placed.payment_action.type !== "none") {
  await mountCheckoutAction({ action: placed.payment_action, payment_id: placed.payment_id, element: "#payment" });
}
```

- **Steps.** `state.step` is one of:
  - `cart`: no lines, a line that can't be bought as it is (a taken booking slot, a price that can't hold its fixed per-unit fee: `tax_unavailable`, a package that would put the buyer under a second purchase minimum: `package_minimum_conflict`, or a `switch` or `amend` line whose change Arky refuses: `package_change_refused`, with that refusal's `code`), or a cart that needs a payment none of the market's payment options can take (`payment_unavailable`, with the reason's `code`), named in `quote.blockers`. A package change keeps its membership, so its new minimum never counts as a second one. While one of the buyer's memberships has a package change waiting, a line for a package of the offering that change moves into is blocked with `package_change_scheduled`, and placing it is refused with `PACKAGE_MEMBER.CHANGE_SCHEDULED`;
  - `details`: the contact email, an address, the billing address, a purchase order number or the place of sale is missing (`place_of_sale_required`: set it with `setPlaceOfSale`), the chosen branch doesn't sell now (`place_of_sale_not_active`), a company buyer at a place whose fiscal system is TaxCore has no verified tax ID for that country that TaxCore takes (`fiscal_buyer_tax_id_required`), a package line still needs a delivery (`package_delivery_required`, a renewing `switch` line's new shipping profile included), or a delivery no longer fits its lines (`delivery_unavailable`: set it again with `shipTo`);
  - `shipping`: a delivery needs its shipping choice;
  - `payment`: ready to place;
  - `paying`: the order waits for its payment, or a kept checkout waits for `recover()`;
  - `placed`: paid, to pay later (cash on delivery), unconfirmed (the provider's answer needs checking) or free.
  - Every blocker kind has its step; a kind this SDK doesn't know yet holds the `cart` step.
- **State:** the `cart`, the `quote` with its `blockers`, `contact_email`, `contact_name` (`{ first_name, last_name }` or `null`), `destination` (read from the cart's delivery), `billing_address`, the chosen `payment_option_id` (the quote's suggestion until you pick one), the `pending` request, the `placed` order with its `payment_method_id` and `payment_method_setup` (set when placing saves a card), its `payment` and `outcome`, `busy` and `error`.
- **Steps you call.** Each step that reads or writes Arky answers the new state. `setContact` and `selectPaymentOption` only change the state.
  - `open()` and `refresh()` (quote again);
  - `setContact({ contact_email: { email, language }, contact_name? })`, `shipTo({ destination })`, `setPlaceOfSale({ place_of_sale })`, `setBillingAddress({ billing_address })`;
  - `selectShipping({ delivery_group_id, shipping_method_id, rate_id })` and `selectPaymentOption({ payment_option_id })`;
  - `setPromotionCodes({ promotion_codes })`;
  - `place({ return_url?, save_payment_method?, payment_method_terms? })`;
  - `reset()` leaves `placed` or `paying` and keeps the contact, for a buyer who keeps shopping on the same page. `open()` drops a finished order by itself and keeps one still waiting for its payment.
- **Contact.** The order's contact is an email with the language its emails are written in, plus an optional `contact_name` with both `first_name` and `last_name` that the SDK never fills in. `open()` names no contact: the page sets it with `setContact` from its own field, the billing address or the session, in the page language, and the flow stays on `details` until then. Each `setContact` states the whole contact, so a name it leaves out is cleared. After `setContact`, every quote sends the email, so a guest can use a promotion code limited to one use per customer. A company buyer's purchase order number is set with `checkout.cart.setBuyer({ buyer })`.
- **Placing.** `place` pays with one of the quote's payment options, or places a free order at a zero total. The quote's `payment_option_ids` lists only the options that can pay this cart, so pick from it as it is. A paid package is paid by card at checkout: a cart with a package line that charges money or saves a card lists only card options, and Arky refuses cash on delivery and manual options for it with `CART.CARD_REQUIRED`. When the cart needs a payment and no option can take it, the quote shows `payment_unavailable` with the reason's `code` (`CART.CARD_REQUIRED`, `CART.DEDICATED_SETUP_NEEDS_STRIPE`, `PAYMENT_METHOD.TERMS_UNAVAILABLE` or `CART.PAYMENT_OPTION_UNAVAILABLE`), and checkout answers that code. When a package line's `saves_card` in the quote is true, the order saves the buyer's card: `place({ payment_method_terms })` passes the card wording the buyer accepted, the flow sends `save_payment_method: { type: "save", terms }`, and `place` without that wording, or with `save_payment_method: false`, is refused with `not_ready` before anything is sent. Without such a line the flow sends `{ type: "dont_save" }` unless the page passes `save_payment_method: true` with the wording. At a zero total a saved card sends the selected payment option instead of a free order, and Arky saves the card a renewing package needs through Stripe's setup; the quote then lists only Stripe options with saved-card wording in its language. Pass `state.placed.payment_method_setup` to `mountPaymentMethodSetup({ setup, element })`, confirm it, then call `eshop.paymentMethod.completeSetup({ id: state.placed.payment_method_id })`. Arky refuses that place with `CART.NOTHING_DUE` when no line saves a card. A Monri store can't take such a cart, because Arky saves a Monri card only from a paid checkout: its quote shows `payment_unavailable` with `CART.DEDICATED_SETUP_NEEDS_STRIPE`.
- **On account.** A company buyer with on-account terms checks out through the cart store instead: `checkout.cart.checkout({ contact_email: { email, language }, payment: { type: "on_account", payment_option_id } })`. A cart with a package line that charges money or saves a card is never put on account (`CART.ON_ACCOUNT_PAID_PACKAGE`). A store that sells a membership paid by invoice sells a product and, once it is paid, gives the package through a zero-price order, or assigns it when the package needs no order.
- **After placing:** `recover()` finishes a kept checkout, `resumePayment()` reopens the order's checkout payment page while its payment window is open, `refreshPayment()` reads the payment again, and `openOrder({ order_id, url })` reopens an order after a payment redirect. `openOrder` answers `{ state, url }`, where `url` is the link without its order token.
- **Errors:** every step throws a `CheckoutFlowError` and records `{ code, message }` in `state.error`. The codes are:
  - `busy` (a step is already running), `not_ready` and `pending` (recover the kept checkout first);
  - `presentation_changed`: the state then shows the new quote, which the buyer reviews before placing again;
  - `refused`, `interrupted` (try again or `recover()`), `unavailable` (no browser storage or lock) and `failed`.

### Paying with Stripe or Monri

`mountCheckoutAction({ action, payment_id, element, onComplete?, onValidationError? })` mounts the payment form into `element` (a selector or an element). It answers what it mounted, or `null` when the order has nothing to pay:

- **Stripe** mounts Stripe's embedded Checkout. `onComplete` runs when Stripe reports the payment done; call `checkout.refreshPayment()` then, or read the order page after the `return_url` redirect.
- **Monri** mounts Monri's card form. It needs the `payment_id` and the buyer's billing details, so call the mount's `confirm` from your pay button. `onValidationError` gets a `MonriCheckoutError` with code `invalid_card` while the card details are wrong, and `null` when they are fine.

```typescript
import { mountCheckoutAction, MonriCheckoutError } from "arky-sdk/storefront";

const placed = arky.eshop.checkoutFlow({ buyer: { type: "customer" }, package_id }).state.get().placed;
if (placed && placed.payment_action.type === "monri_components") {
  const mount = await mountCheckoutAction({ action: placed.payment_action, payment_id: placed.payment_id, element: "#payment" });
  if (mount?.type === "monri_components") {
    try {
      await mount.confirm({
        full_name: "Ana Horvat",
        address: "Main Street 1",
        city: "Zagreb",
        zip: "10000",
        phone: "+385 1 234 567",
        country: "HR",
        email: "ana@example.com",
      });
    } catch (error) {
      if (!(error instanceof MonriCheckoutError)) throw error;
      console.log(error.code);
    }
  }
}
```

A `MonriCheckoutError` says what went wrong:
- `invalid_details` lets the buyer correct the form;
- `unknown_result` means the payment needs checking, so never start a second checkout;
- `already_submitted`, `invalid_action` and `unavailable` (Monri needs an HTTPS page).

Saved cards use `eshop.paymentMethod.requestSetup`, `startSetup`, `mountPaymentMethodSetup({ setup, element })` and its `confirm({ return_url })`, then `completeSetup`, which answers the card as Arky holds it without asking Stripe; Stripe's own setup post is what makes it ready. A Monri option refuses this setup (`PAYMENT_METHOD.DEDICATED_SETUP_NEEDS_STRIPE`), because Arky saves a Monri card only from a paid checkout.

A membership replaces its card by saving a new one and selecting it: `eshop.packageMember.selectPaymentMethod({ id, expected_updated_at, payment_method_id })` charges any renewal that's owed, and `resume` then restarts a blocked membership. A Stripe card is saved with the setup above. A Monri membership's buyer places a paid checkout under the Monri option with `place({ save_payment_method: true, payment_method_terms })` and, once its payment succeeds, selects `state.placed.payment_method_id`. Arky has no payment page for an owed renewal order.

Each checkout action and card setup carries `runs_on`, which says where the payment runs: `{ type: "provider" }`, or `{ type: "simulator", api_url }` on a [test store](#test-stores). These two mounts handle both, so the same site code works on a test store and a live one. A network's store-billing card setup also works with `mountPaymentMethodSetup`. On a test store the mount draws a test payment form in the page's own words: pass `simulator_texts: { title, description, complete, decline, expire, cancel }` to `mountCheckoutAction` and `mountPaymentMethodSetup`. A simulated payment mounted without them is refused with `ArkyError` `not_ready`; a live payment ignores them.

## 5. Order page

An order email links to the order with a `#order_token=...` fragment, so a guest can open it in any browser:

```typescript
import { latestPayment, paymentAmounts, paymentOutcome } from "arky-sdk/storefront";

const opened = await arky.eshop.order.fromLink({ id: orderId, url: location.href });
history.replaceState(history.state, "", opened.url);

const payments = await arky.eshop.order.findPayments({ order_id: opened.order.id }, { order_token: opened.order_token });
const latest = latestPayment(payments);
console.log(opened.order.number, latest ? paymentOutcome(latest) : null, paymentAmounts(payments).net_paid);
```

- **`order.fromLink({ id, url })`** checks the token, reads the order with it, keeps the token for that order and answers `{ order, url, order_token }`, where `url` is the link without the token. A link without a token uses the token kept at checkout, or the customer's session. A malformed token is an `ArkyError` with code `invalid_link`.
- **Tokens are sent only when you pass them.** Order reads send a token only as the request option `{ order_token }`. The order, its payments and fulfillments, `resumePayment`, `downloadAsset`, cancellations, reschedules and returns accept it. `order.retainedToken({ order_id })` answers the kept one. Keep payment provider return URLs free of the token.
- **`paymentOutcome(payment)`** says what a payment means to the shopper: `paid`, `awaiting`, `unconfirmed` (the provider's answer is unclear and the team settles it, so tell the shopper you will email them) or `failed`. `latestPayment(payments)` picks the newest.
- **`paymentAmounts(payments)`** adds up an order's payments (`StorefrontPayment[]`) as Arky does: `paid`, `refunded`, `refund_pending`, `disputed` and `net_paid`. `disputed` nets each reinstatement against its withdrawal, and counts a withdrawal Stripe reports in another currency as the dispute's own amount. It leaves out what is still owed, because that also subtracts the order's credits, which a storefront doesn't read.
- **Buyer's copies.** Storefront order, payment and return reads answer the buyer's copies (`StorefrontOrder`, `StorefrontPayment`, `StorefrontReturn`), which leave out what only the store team sees, such as who recorded a payment; `paymentOutcome`, `paymentAmounts` and the line helpers take them.
- **Invoices.** A storefront order carries light copies `{ id, type, created_at }`. An `unissued_invoice` names its `reason`: `awaiting_outside_number`, `awaiting_receipts`, `counter_held` or `blocked`. Issued `invoice` and `reversed_invoice` copies carry their number and issue time; `credit_note` and `reversal` also name the invoice they correct. `outside_invoice` and `outside_credit_note` carry the merchant’s number and document (`{ type: "link", url }` with an HTTPS URL or `{ type: "paper" }`), and an outside credit note names its credited `invoice_id`. `eshop.order.getInvoice({ order_id, invoice_id })` reads a full document with the same Order access. Arky documents hold frozen seller, buyer, lines and totals; `fiscal_receipts` names their pending or numbered receipts. Payments belong to the Order.
- **Receipts.** A storefront order carries its fiscal `receipts`, oldest first, as light copies `{ id, type, document, created_at }`. `type` is `sale`, `advance`, `next_advance`, `advance_settle`, `advance_return`, `advance_correction`, `final`, `refund`, `correction` or `copy`, and `document` names the fiscal system with the receipt's `state`: `tax_core` (`done` with its `invoice_number` and `verification_url`), `fbih_printer` (`done` with its `receipt_number`) or `croatia_cis` with its `number` (`done` with its `jir`). A `tax_core` receipt issued on another device is `done_on_other_device` with its `invoice_number`. An `fbih_printer` receipt written by hand is `written_by_hand` with its `hand_number`, then `printing_after_hand` and `done_after_hand` with the printed `receipt_number`, or `print_failed_after_hand` while the print waits for staff; one issued on another device is `done_on_other_device` with its `receipt_number`, a string.

To order again, `reorder({ id, order_id, buyer, package_id })` builds a new cart from the products the order bought directly, in the package you name (normally the buyer's current one) and the current market, at that package's prices there, with the same access as creating a cart there. The `buyer` is the order's own (`CART.REORDER_BUYER`). A product that package doesn't sell in that market, or that can't be bought now, is left out and listed in `left_out`; when nothing is left, Arky refuses with `CART.REORDER_NOTHING_LEFT`. The new cart becomes this browser's cart for that buyer, package and market, so the cart store's `load()` reads it:

```typescript
const reordered = await arky.client.eshop.cart.reorder({
  id: crypto.randomUUID(),
  order_id: orderId,
  buyer: { type: "customer" },
  package_id,
});
const cart = await arky.eshop.cart({ buyer: { type: "customer" }, package_id }).load();
console.log(cart?.id === reordered.cart.cart.id, reordered.left_out.map((line) => line.variant_id));
```

## 6. Customer sign-in

```typescript
arky.session.subscribe((session) => console.log(session?.type));

await arky.customer.requestCode({ contact: { type: "email", email: "ana@example.com", language: "en" } });
await arky.customer.verify({ code: "123456" });
const me = await arky.customer.getMe();
if (me) {
  await arky.customer.updateMe({
    expected_updated_at: me.customer.updated_at,
    profile: [{ id: crypto.randomUUID(), key: "first_name", type: "text", value: "Ana" }],
  });
}
const { items: orders } = await arky.eshop.order.find({ limit: 20 });
console.log(orders.length);
const signedOut = await arky.customer.logout();
console.log(signedOut.type);
```

- **Visitors, customers and contacts.** A visitor signs in with a code sent to an email or a phone number, in a store that signs its own customers in: a store of an `Isolated` network, or any test store. `requestCode({ contact })` takes `{ type: "email", email, language }` or `{ type: "phone", number, language }` (E.164, such as `+38761234567`) and sends the code by email or SMS in that language, one of the store's languages. The code message's id comes from `createId`; a lost answer is retried under the same id, so the customer gets one message. The accepted code signs in to the store's own account for that address: a code for an address whose account is already linked to a customer of the store signs the visitor in to that customer, and otherwise the visitor's own customer is linked to the account. Either way the address becomes a confirmed contact. A customer's `contacts` are where the store writes to the person, each `unconfirmed_email` or `unconfirmed_phone` (typed in, not proved) or `confirmed_email` or `confirmed_phone` (the person proved it); they never sign anyone in, and several customers may hold one address. Its `links` show `{ type: "own" }` for each account that signs in to it, never the account. A store of a `Connected` network refuses its own customer codes with `409 CUSTOMER_SIGN_IN.NETWORK_SIGN_IN`: its customers sign in through the network ([Network customer sign-in](#network-customer-sign-in)).
- **`verify`** signs the customer in under a new session id from `createSessionId`. Its `session` is `store_customer_signed_in_by_email` with the `email` or `store_customer_signed_in_by_phone` with the `number` it signed in with, and the client's `session.signed_in_with` names that address. When the visitor signs in as a customer who already exists, Arky merges the visitor's cart into that customer's cart, and the cart store follows it. A staff invite's message gives its template `code`, `email` or `number`, and `code_days`; the page its link opens passes them back as `verify({ code, email })` or `verify({ code, number })`. An invite opens only with its own code.
- **Sign-in refusals** carry their own codes: `CUSTOMER_SIGN_IN.CODE_RECENT` (a new code within the configured interval, sixty seconds in production), `CUSTOMER_SIGN_IN.CODE_INVALID` (a wrong or expired code, or none waiting) and `CUSTOMER_SIGN_IN.ATTEMPTS_EXHAUSTED` (too many wrong codes for the address).
- **No session, no visitor.** With no session, `getMe()` answers `null` and sends nothing, as `eshop.cart.getCurrent` and a cart store's `load()` do. The first write, such as a code request, a cart or a form submission, identifies the visitor.
- **Signing out.** `logout()` forgets the session in this browser and answers `{ type: "revoked", session_id }` when Arky confirmed it, `{ type: "unconfirmed", session_id }` when the request failed, so an earlier copy of the session may still work until it expires, or `{ type: "local_only" }` when there was no session.
- **Session lifetime.** A signed-in session's access token lasts an hour; the SDK refreshes it on the first 401 and keeps every cart and checkout view. Every tab of a browser uses the one stored session: the SDK reads it for each request, refreshes it in one tab at a time under a Web Lock, uses a session another tab already refreshed instead of refreshing again, and reports a session another tab changed to `onAuthStateChanged`. A browser without Web Locks refuses the refresh with `ArkyError` `storage`. A browser that refuses storage keeps the session in that tab only, and the client's `sessionStorageUnavailable` is then `true`, so the site can tell the shopper that other tabs won't share the sign-in. Only Arky's own refusal of that refresh (401 `GENERAL.UNAUTHENTICATED` or 403 `GENERAL.UNAUTHORIZED` in Arky's error body) clears the session and reports it to `onAuthStateChanged` and the `session` atom. Any other failed refresh, such as a 401 or 403 from a proxy, a 429 or a 5xx, fails that request with the refresh's error and keeps the session for the next try. A refresh whose answer was lost after Arky made the new session has already replaced the old one, so the next refresh is refused and the shopper signs in again. A visitor whose token Arky itself refuses (401 `GENERAL.UNAUTHENTICATED` in Arky's error body, for example after the visitor session expired) is replaced: the SDK identifies a new visitor and sends the request once more. Any other 401, such as a proxy's, fails that request and keeps the visitor. Changing the shopper, signing out or switching markets clears checkout contact, delivery, payment selection and the displayed order. A late response from the previous context cannot restore them; a kept checkout request stays in the browser for explicit recovery by the customer who kept it, and another customer signed in on the same browser neither sees it nor is blocked by it.
- **Contacts.** On a signed-in session, `requestCode` sends a code to another email or number, and `verifyContact({ address, code })` confirms it as a contact and adds it to the person's sign-in, where `address` is `{ type: "email", email }` or `{ type: "phone", number }`. `addContact({ expected_updated_at, contact, sms })` saves an unconfirmed contact, `updateContact({ expected_updated_at, address, language, sms })` changes the language its messages are written in or a phone's SMS consent, and `removeContact({ expected_updated_at, address })` removes it; removing a contact never ends a sign-in. A customer holds each address once (`CUSTOMER_CONTACT.EXISTS`) and at most the configured number of contacts (`CUSTOMER_CONTACT.LIMIT`). `unsubscribe({ address })` and `resubscribe({ address })` record one email's choice. Each answer is `CustomerMe`, `{ customer, session }`, and the stored session takes its customer at once. `removeLink()` removes the signed-in customer's own link, ends this browser's session and answers `{ removed: true }`; a customer's last link stays while it owns a saved card or holds a company membership (`CUSTOMER_LINK.LAST_LINK`).
- **A visitor fills in its own record.** A visitor that never signs in uses `getMe`, `updateMe`, `addContact`, `updateContact` and `removeContact` too, so a booking page saves the person's name, phone and SMS consent without a sign-in. Only a code confirms an address: a visitor's contacts stay unconfirmed until `requestCode` and `verify` sign it in.
- **Name and SMS consent.** A customer's `updateMe`, a visitor's included, also takes `name` (`{ first_name, last_name }`, `null` to clear). Each phone contact holds its own SMS consent: `sms: "on"` records the customer's own yes for that number only, a number starts with SMS off unless the save that adds it turns it on, and the read shows `sms` as `{ type: "off" }` or `{ type: "on", at }`. The store team's customer read answers `{ type: "off", at }`, when the number's SMS became off, or `{ type: "on", at, by }`.

### Network customer sign-in

In a `Connected` network, a customer signs in once through the network and opens a key at each store they use:

```typescript
import { createNetworkCustomer } from "arky-sdk/storefront";

const network = createNetworkCustomer({ apiUrl: "https://api.arky.io", networkId: "0f6a3c84-2d19-4e75-b8a1-5c9e7d3b2f60" });
const session_id = crypto.randomUUID();
await network.requestCode({ session_id, reach: { type: "network" }, contact: { type: "email", email: "ana@example.com", language: "en" } });
await network.verify({ session_id, code: "123456" });
const { items: stores } = await network.store.find();
const key = await network.store.openKey({ store_id: stores[0].store_id, id: crypto.randomUUID(), visitor_token: arky.customer.visitorToken });
arky.customer.useStoreKey(key);
```

- **Reach.** `{ type: "network" }` is the network's own portal: it opens every store the person uses and may change the person's logins. `{ type: "store", store_id }` is one store's own page: it reaches that store only (`403 NETWORK_CUSTOMER_SIGN_IN.STORE_NOT_REACHED` at another) and never changes logins (`409 ACCOUNT_LOGIN.NETWORK_REACH_REQUIRED`). An `Isolated` network refuses the network sign-in (`409 NETWORK_CUSTOMER_SIGN_IN.NOT_CONNECTED`), and so does a test store (`409 NETWORK_CUSTOMER_SIGN_IN.TEST_STORE`).
- **The code.** `requestCode({ session_id, reach, contact })` answers `{ session_id, code_expires_at }` alike for every address and sends the code through the network's own Resend or Twilio login, with its customer texts in the contact's language (`409 NETWORK.CUSTOMER_TEXT_MISSING` without one, `NETWORK.RESEND_MISSING` or `NETWORK.TWILIO_MISSING` without the login). The same `session_id` and contact while the code is open answer the same pending sign-in. `NETWORK_CUSTOMER_SIGN_IN.CODES_BUSY` means the network's code budget is spent for now, and `NETWORK_CUSTOMER_SIGN_IN.CODE_RECENT` that a code to that address went out moments ago. `verify({ session_id, code })` keeps the sign-in in this browser; a wrong, expired or replaced code answers `NETWORK_CUSTOMER_SIGN_IN.CODE_INVALID`, too many `NETWORK_CUSTOMER_SIGN_IN.ATTEMPTS_EXHAUSTED`.
- **Store keys.** A network sign-in never acts in a store itself. `store.openKey({ store_id, id, visitor_token })` opens that store's key for the customer linked to the person there, else for the visitor whose `visitor_token` it passes (`arky.customer.visitorToken`, or `null`), else for a new customer, and the sign-in's address becomes a confirmed contact there. `arky.customer.useStoreKey(key)` makes the key the storefront client's session, so every storefront call works as for any signed-in customer. A key lives as long as its sign-in and has no refresh token: when Arky refuses it, the storefront client forgets it and identifies a new visitor. A key the store revoked can't be opened again by the same sign-in (`409 NETWORK_CUSTOMER_SIGN_IN.KEY_REVOKED`). `store.acceptInvite({ store_id, id, code, sent_to })` redeems that store's invite inside a sign-in with reach `{ type: "store", store_id }` and answers its key the same way, opened under the app-picked `id`: the same `id` again answers that key, so a lost answer is sent again as it was, and an `id` that names another record is refused with `409`.
- **The person's account.** `getMe()` answers `{ account_id, logins, session }`: the customer logins (`customer_email` and `customer_phone`) and this sign-in's `reach` and `signed_in_with`. With reach `network`, `login.requestCode({ contact })`, `login.verify({ address, code, confirm_join })` and `login.remove({ address })` change the logins, and every change tells the person's other logins. An address that belongs to another account of the network answers `409 ACCOUNT_LOGIN.JOIN_CONFIRMATION_REQUIRED` and joins that account only with `confirm_join: true`; `ACCOUNT_LOGIN.JOIN_LINKED_APART` names a store where both are linked to different customers, which merges them first. The other refusals are `ACCOUNT_LOGIN.TAKEN`, `ACCOUNT_LOGIN.LIMIT`, `ACCOUNT_LOGIN.LAST_LOGIN`, `ACCOUNT_LOGIN.EMAIL_SESSION_REQUIRED` (adding an email needs a sign-in with an email the account holds) and `ACCOUNT_LOGIN.OLDER_EMAIL_REQUIRED`. `store.find()` lists the stores the person is linked to, `store.removeLink({ store_id })` removes the person's own link there, and `deleteAccount()` deletes the account through a sign-in with its oldest email (`409 ACCOUNT.ANCHOR_SESSION_REQUIRED`), or answers `409 ACCOUNT.MEMBER_SESSION_REQUIRED` for an account with memberships, which only its own member session deletes. A delete that would take a store customer's last link while that customer's saved card or company membership needs it answers `409 CUSTOMER_LINK.LAST_LINK`, as every account delete does.
- **Session.** The client sends the `network_customer_access_` token, refreshes once when Arky refuses it, and forgets the sign-in when Arky refuses the refresh. Its `session` is `{ id, reach }`, `onAuthStateChanged` reports changes, and `logout()` answers `{ type: "ended", session_id }`, `{ type: "unconfirmed", session_id }` or `{ type: "local_only" }`.

## 7. Forms

```typescript
import { FormAnswerError } from "arky-sdk/storefront";

const form = await arky.forms.getByKey({ key: "contact" });

try {
  await arky.forms.submit({ form, values: { email: "ana@example.com", message: "Hello" }, language: "en" });
} catch (error) {
  if (error instanceof FormAnswerError) console.log(error.questionKey, error.code);
  else throw error;
}
```

- **Submitting.** `forms.submit` takes the loaded `form` and a `{ key: value }` map, checks each value against its question and builds the answers. You can also pass `form_id`, `questions_updated_at` and `answers` that you built yourself.
- **Answer errors.** A value that doesn't fit throws a `FormAnswerError` with the question's key and a code: `required`, `invalid`, `too_short`, `too_long`, `pattern_mismatch`, `too_small`, `too_large`, `unknown_option`, `too_many_files` (more than the question's `max_files`), `file_size` (an empty file), `file_name` or `unknown_question`.
- **Lengths and patterns.** Text lengths count characters as Arky does, so an emoji counts once. A question's `pattern` is checked before sending only where JavaScript reads it as Arky does: a pattern with `\d`, `\w` or `\b` (Unicode classes in Arky), or one JavaScript can't read, is left to Arky, which answers the question's field error.
- **Empty answers** are left out. File answers carry `File` objects and are sent as multipart. Arky's configured limits refuse what is too big (production: 10 MiB a file, 20 files and 50 MiB a request): 413 `FORM_SUBMISSION.FILE_TOO_LARGE`, 409 `FORM_SUBMISSION.TOO_MANY_FILES` and 413 `GENERAL.PAYLOAD_TOO_LARGE`.
- **The form a shopper sees.** `forms.get` and `forms.getByKey` answer `StorefrontForm`: `id`, `key`, `questions`, `questions_updated_at` and `status`, without the store's email and stage settings.
- **Changed forms.** When the form's questions changed since you loaded it, Arky refuses with 409 `FORM_SUBMISSION.FORM_CHANGED`: load it again.

A long form can keep its answers in the browser until they are sent, so a lost answer survives a reload:

```typescript
import { formValuesFromAnswers } from "arky-sdk/storefront";

const application = await arky.forms.getByKey({ key: "partner-application" });
const saved = await arky.forms.pendingSubmission({ form_id: application.id });
const restored = saved ? formValuesFromAnswers(saved.answers) : {};
const kept = saved ?? (await arky.forms.retainSubmission({ form: application, values: { company: "Kafana d.o.o." }, language: "en" }));
const sent = await arky.forms.recoverSubmission({ form_id: kept.form_id });
console.log(restored, sent?.id);
```

`retainSubmission` keeps the whole submission, answers included, under an id from `createId`; it can't hold files. The same answers again answer the kept one; different ones are refused with `DurableRequestError` `pending` until it is sent. `pendingSubmission` reads it back and `recoverSubmission` sends it under the same id.

## 8. Bookings

`arky.eshop.bookingCalendar({ buyer, package_id })` builds a month calendar and the free slots of a booking service, and adds a chosen slot to that buyer's cart:

```typescript
const { items: services } = await arky.eshop.packageItem.find({ package_id, selection: { types: ["booking_service"] }, limit: 20 });
const calendar = arky.eshop.bookingCalendar({ buyer: { type: "customer" }, package_id });

const [service] = services;
if (service?.item.type === "booking_service") {
  const state = await calendar.select({ booking_service_id: service.item.booking_service_id, store_location_id });
  const day = state.days.find((cell) => cell.available);
  if (day) calendar.selectDate({ date: day.iso });
  const [slot] = calendar.state.get().slots;
  if (slot) await calendar.addToCart({ slot });
}
```

- **State:**
  - the service: `booking_service`, `store_location_id` (the branch the visit is at), `booking_choices` (the prices of its offerings in this package and market), `booking_resources` (`{ id, key, blocks, timezone }`, from the availability rows), `selected_booking_resource_id`, `availability`, `timezone` (`null`: each slot in its resource's timezone) and `loading`;
  - the calendar: `month` and `days` (`date`, `iso`, `available`, `is_selected`, `is_in_range`, `is_today`, `blank`), plus the `calendar.month_label` atom with the shown month in the store's language;
  - the choice: `selected_date`, `slots` (`booking_offering_id`, `store_location_id`, `booking_resource_id`, `price_ref`, `price`, `from`, `to`, `timezone`, `time_text`, `date_text`, `is_multi_day`) and `selected_slot`.
- **Calls.** Steps that read Arky answer the new state; picks only change the state.
  - reads: `select({ booking_service_id, store_location_id })`, `prevMonth()`, `nextMonth()`, `selectResource({ booking_resource_id })` and `loadMoreChoices()`;
  - picks: `selectDate({ date })`, `selectFirstAvailableDate()`, `selectSlot({ slot })` and `setTimezone({ timezone })`;
  - `addToCart({ slot, id?, capacity_units?, form_submission_id?, add_ons? })` answers the cart. Pass `add_ons` for an offering that has add-ons, each once; without them the line names none. The line names the slot's branch; its resource is `{ type: "resource", booking_resource_id }` after `selectResource`, else `{ type: "any" }`, so Arky picks one.
- **Sign-out and language.** Signing out or another buyer signing in empties the calendar, member prices included; call `select` again. A language change writes the slot texts again in the new language.
- **Prices and resources.** `select` reads the service and the first page of its item's prices; a slot shows once its offering's price is loaded, so call `loadMoreChoices()` while `booking_choices_cursor` is set. The resources come with the availability: each row names its resource's `resource_key` and `resource_blocks`, so `booking_resources` lists `{ id, key, blocks, timezone }` and the calendar reads no resource.
- **Months and time zones.** A month read covers the shown month and a day on each side, up to 20 offerings a request, following `cursor` until every offering is in: Arky ends a page before the offering that would pass its slot budget and answers the cursor of the rest. A slot shows in its resource's timezone (`slot.timezone`) under that zone's date, as a venue's own site shows it; `setTimezone({ timezone })` shows every slot in one zone instead, such as the visitor's for an online service.
- **Stays.** A slot that crosses midnight, such as a night's stay, is `is_multi_day`: its `time_text` is the date range, and its days are `is_in_range` once it is chosen. A booking lasts at most 24 hours, so a stay of several nights is one booking a night; with a booking of the same service already in the cart, the calendar opens on the month that booking ends in.

The cart and the checkout are the same as for products: the `checkoutFlow` of the same scope sees the booking lines.
- **Without the calendar,** read the service with `bookingService.get({ id, package_id })`, its offerings' prices with `packageItem.findPrices({ package_item_id, package_id })`, and the free slots at one branch with `bookingService.getAvailability({ package_id, booking_service_id, store_location_id, from, to })` (at most 60 days per read; follow `cursor`). Each row names its `booking_offering_id`, `store_location_id` and `booking_resource_id`. Add a slot with `cart.addBooking({ booking_offering_id, store_location_id, resource, requested_interval, add_ons, capacity_units, price })`, where `resource` is `{ type: "any" }` or `{ type: "resource", booking_resource_id }`, `add_ons` names each of the offering's add-ons once, every one being required, with the booker's resource pick for it (`{ add_on_id, resource, form_submission_id?, add_ons }`, empty when the offering has none); Arky picks the offering that fills each add-on and refuses picks that break the offering's rules with `CART.BOOKING_ADD_ON_INVALID` and `price` is `{ package_id, package_item_id, price_id }`. `bookingOffering.get({ id, package_id })` reads one offering with its price, and `bookingResource.get({ id, offering_id, package_id })` one resource it can use.
- **What the quote plans.** Each quote booking line has `availability`: `available` with `spots` and the `plan`, `history` with the `plan`, or `unavailable` with its `code`. The plan names the resource Arky picked, the line's `interval`, its `total_interval` with every add-on, and each add-on's own interval and resource.
- **Taken slots.** The quote checks the slot again: a taken slot is a `booking_unavailable` blocker.
- **Later changes.** `eshop.order.cancelBookingItem` and `rescheduleBookingItem` change a booking after the order; both name the line as `order_booking_item_id`.
- **The patient's answer.** An upcoming booking's `status.attendance` is `{ type: "upcoming", response }`, where `response` is `unanswered`, `coming` or `change_requested` with its `at`; a reschedule sets it back to `unanswered`. `eshop.order.answerBookingItem({ order_id, order_booking_item_id, starts_at, answer })` records the signed-in customer's `answer` (`"coming"` or `"change_requested"`) for the start they saw. A reminder carries a signed answer link: `eshop.order.answerBookingByLink({ token, answer })` needs no session and answers `{ order_id, order_booking_item_id, starts_at, response }`. A stale start is refused with `409 GENERAL.CONFLICT` and an answer after the start with `ORDER.BOOKING_CHANGE_CLOSED`.
- **Resources.** `eshop.bookingResource.get({ id, offering_id, package_id })` accepts an id or a slug in the client’s locale. Slugs are unique per store and language; the supplied offering must be visible and be able to use that resource. A booking resource has no type: its categories say what it is. Its `hours` name the branch of each window (`{ store_location_id, from, to }`, times of day in milliseconds).
- **Order booking lines.** A booking line names its `store_location_id`, `customer_id`, `interval` and `total_interval` (with every add-on), its `add_ons` (each with its own offering, service, resource, `interval`, `price` `{ type: "free" }` or `{ type: "listed", price, amount }`, and `status` `held` or `taken_off`) and `changes`, the staff changes to the line (`line`, `add_on`, `add_on_added` or `offering_changed`, with `by` and `at`).

## 9. Content and media

```typescript
const site = await arky.content.load({ collection: { key: "website" } });
const title = site.object("info")?.text("title");
const post = await arky.content.load({ entry: { collection_id, slug: "launch" } }, { locale: "it" });
const posts = await arky.content.loadEntries({ collection_id, limit: 20 });
const older = posts.cursor ? await arky.content.loadEntries({ collection_id, limit: 20, cursor: posts.cursor }) : null;
console.log(title, site.media("hero")?.id, post.text("title"), posts.items.length, older?.items.length);
```

- **`content.load`** reads one collection (`{ id }` or `{ key }`) or one entry (`{ id }`, `{ collection_id, key }` or `{ collection_id, slug }`), with the media its blocks name. `loadEntries` reads one page of a collection's entries (`limit`, 20 unless named, at most 100) with the media they name and answers `{ items, cursor }`; pass `cursor` back for the next page. It never walks the whole collection.
- **Accessors.** The answer has `record`, `blocks`, `media_by_id` and accessors in the call's locale: `block(key)`, `text(key)`, `media(key)`, `object(key)` and `list(key)`. Text is read in the exact language asked for, never another, and an accessor for a block of another type throws.
- **Missing entries.** A key or slug that matches no entry throws an `ArkyError` with code `not_found`.
- **Plain reads:** `content.collection.get({ id })`, `content.collection.getByKey({ key })`, `content.entry.get({ id })` and `content.entry.find`, which takes `collection_id` with `key`, `slug`, `query` or `filters`, or a list of `ids`.
- **Storefront shapes.** These routes answer `StorefrontCollection` and `StorefrontEntry`. A collection has `type: "public"`; an entry keeps its key and slugs in `type: { type: "public", key, slugs }`, so a loaded entry's URL uses `post.record.type.slugs.it`. Public entry create and update still take `key` and `slugs` as request fields.
- **Shared entries.** After the customer signs in, `sharedEntries.find({ collection_id?, limit?, cursor? })`, `get({ id })` and `fileLink({ id, media_id, variant })` read the entries shared with that customer as `StorefrontSharedEntry`. A file link answers `{ url, expires_at }` and lasts five minutes. These reads use the customer's session and each read is logged. Public content reads do not expose Private, Shared or Note entries.

## Errors

Everything the SDK throws at runtime is an `ArkyError` with a `code`; map the code to your own text. Each class works with `instanceof` whichever entry point made it.

| Class | When | Codes |
|---|---|---|
| `ArkyApiError` | Arky answered with its own refusal | Arky's own, such as `GENERAL.CONFLICT`, `GENERAL.NOT_FOUND` and `FORM_SUBMISSION.FORM_CHANGED`, exactly as the Server sent it; it also has `statusCode` and `validationErrors` |
| `CartPresentationChangedError` | a checkout's quote changed (an `ArkyApiError` with code `COMMERCE.PRESENTATION_CHANGED`) | carries the new `quote` |
| `ArkyNetworkError` | no readable answer: no answer at all, a success that isn't JSON, or a refusal without Arky's error body, such as a proxy's 502 page (with its `statusCode`) | `network`, `aborted`, `unreadable_answer` |
| `DurableRequestError` | a retry-safe request couldn't run | `storage` (no `localStorage` or Web Locks; nothing was sent), `busy`, `pending`, `answer_mismatch`, `settled_elsewhere` |
| `CartError` | the cart store or the cart selection | `no_cart`, `not_ready`, `busy`, `other_cart`, `context_changed`, `answer_mismatch`, `storage`, `no_session` |
| `CheckoutFlowError` | a checkout step | see [Checkout](#4-checkout) |
| `FormAnswerError` | a form value doesn't fit its question | see [Forms](#7-forms) |
| `MonriCheckoutError` | Monri card entry | `invalid_card`, `invalid_details`, `unknown_result`, `already_submitted`, `invalid_action`, `unavailable` |
| `PackageJoinError` | a free package sign-up | `sign_in_required`, `email_mismatch`, `not_free`, `sign_up_used`, `sign_up_expired` |
| `ScheduledResultTimeoutError` | `pollScheduledResult` stopped waiting | `timeout` |
| `FulfillmentSelectionError` | an Admin fulfillment unit helper got a wrong selection | `invalid_selection` |
| `ArkyError` itself | anything else | `not_found` (content), `invalid_link` (order link), `answer_mismatch` (an answer names another record), `no_session`, `token_conflict` and `storage` (order tokens), `too_many_pages` (paging), `unavailable` (Stripe.js didn't load, or a test store's payment form has no container), `invalid_details` and `declined` (saving a card), `not_sent` (page view), `not_confirmed` (provider simulator), `not_ready` (a test store's payment form without `simulator_texts`), and on the Admin client `session_changed` and `refresh_failed` |

- **A missing record answers its own code:** `ACCOUNT.NOT_FOUND`, `STORE_LOCATION.NOT_FOUND`, `CUSTOMER.NOT_FOUND`, `PRODUCT.NOT_FOUND`, `CATEGORY.NOT_FOUND`, `COLLECTION.NOT_FOUND`, `ENTRY.NOT_FOUND`, `FORM.NOT_FOUND`, `FORM_SUBMISSION.NOT_FOUND`, `MEDIA.NOT_FOUND`, `FULFILLMENT.NOT_FOUND`, `FULFILLMENT_JOB.NOT_FOUND` and so on, all 404. `GENERAL.NOT_FOUND` stays where a record has no code of its own, such as a network or a market. The `USER.*` and `LOCATION.*` codes are gone: they are `ACCOUNT.*` and `STORE_LOCATION.*`.
- **A failed write is the server's failure:** `ACCOUNT.FAILED_UPDATE`, `STORE.FAILED_CREATE`, `STORE_LOCATION.FAILED_CREATE` and the like answer 500, never 400, so `isDefiniteRefusal` lets the same request go again.
- **Codes worth their own text:** `BOOKING_OFFERING.TOO_LONG` (a booking and its add-ons would span more than one day: a cart line blocker, or a 409 refusal), `CUSTOMER_LINK.LAST_LINK` (409: removing a link or deleting an account would take the link a customer's saved card or company membership needs) and `STORE.SELLER_REQUIRED` (409: Arky invoicing, a fiscal provider or a fiscal device needs the store's seller first).

The status atoms of the cart store record errors the same way, as `{ code, message }`; a wrong value your code passed shows as `invalid_input`.

```typescript
import { ArkyApiError, ArkyError, CartPresentationChangedError, isDefiniteRefusal } from "arky-sdk/storefront";

export function errorKey(error: unknown): string {
  if (error instanceof CartPresentationChangedError) return "checkout.quote_changed";
  if (error instanceof ArkyApiError) return error.code;
  if (error instanceof ArkyError) return `${error.name}.${error.code}`;
  return "failed";
}

export function canRetry(error: unknown): boolean {
  return !isDefiniteRefusal(error);
}
```

`isDefiniteRefusal(error)` is true for any 4xx answer except 408 and 429: the request itself must change before it is sent again. A network failure, a 5xx or an aborted read can be sent again unchanged. `refusalClearsKeptRequest(error)` says whether a refusal ends a kept retry-safe request: a definite refusal other than 401 and 403, which a fresh sign-in may still let through, so a site's own kept requests can drop the same ones the SDK drops.

## Retry-safe requests

The calls that take their ids from the factories keep them in `localStorage` under a cross-tab Web Lock, so a lost answer is retried under the same id.
- **Kept requests.** A checkout, a free package sign-up and a kept form submission keep their whole request, and drop it on a success or a definite refusal other than `401` and `403`. An authentication or authorization refusal can come after Arky stored the record, so it keeps the request for a retry.
- **Light creates.** Form submissions, support conversations and messages, sign-in code requests and a tracked action that names no id (`actions.track`) keep only their id and a fingerprint of the request. A tracked action keeps one slot per action key, so a second track of a key while the first is still being sent is refused with `DurableRequestError` `busy`.
- **Cart writes** in a browser need `localStorage` and Web Locks too, because they check that no checkout of that cart is unfinished.

A checkout without `order_id` and `order_token` takes them from the factories and keeps the request before it is sent. Sending the same checkout again recovers the kept one; a different one is refused (`DurableRequestError` `pending`) until it is recovered. The store's cart keeps its checkout in its own buyer, package and market scope, so a company's branches check out side by side. The plain client's `eshop.cart.checkout` keeps it in one shared slot unless you pass `scope: { buyer, package_id }`; `pendingCheckout({ scope })` and `recoverCheckout({ scope })` read and finish it. Every slot belongs to the customer session that kept it: a visitor who signs in still finds the checkout they kept as a guest, and another customer on the same browser starts clean. With no session, `pendingCheckout` and `recoverCheckout` answer `null`.

## The plain client

`createStorefront` takes the same options as `initialize` and has the same calls, without atoms or helpers:

```typescript
import { createOrderToken, createStorefront, readAllPages } from "arky-sdk/storefront";

const client = createStorefront({ storeId: "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19", salesChannelId: "e5a8c2d7-3b91-4f06-9d4e-1c7b6a0f3e28" }, {
  locale: "en",
  market: "eu",
  createVisitorIdentity: () => ({ customer_id: crypto.randomUUID(), session_id: crypto.randomUUID() }),
  createSessionId: () => crypto.randomUUID(),
  createId: () => crypto.randomUUID(),
  createOrderToken,
});

const items = await readAllPages((cursor) => client.eshop.packageItem.find({ package_id, selection: { types: ["product"] }, limit: 100, cursor }));
const created = await client.eshop.cart.create({ id: crypto.randomUUID(), buyer: { type: "customer" }, package_id });
const cart = await client.eshop.cart.addProduct({
  id: created.cart.id,
  expected_updated_at: created.cart.updated_at,
  product: { id: crypto.randomUUID(), variant_id, quantity: 1, price: { package_id, package_item_id, price_id } },
});
const quote = await client.eshop.cart.quote({ id: cart.id, contact_email: "ana@example.com" });
console.log(items.length, quote.ready, quote.blockers);
```

Its cart calls name the cart and its version:
- **Selection:** `cart.create({ id, buyer, package_id })`, which names the current market's id on the request, reading it once by the market's key, `getCurrent({ buyer, package_id })` (the cart this browser selected in the current market, or `null`), `forget({ buyer, package_id })` and `reorder({ id, order_id, buyer, package_id })` (see [Order page](#5-order-page)).
- **Reads and changes:** `get`, `update`, `addProduct`, `addBooking`, `addPackage`, `removeItem`, `clear` and `selectShippingMethod`. An `update` may change the cart's `package_id` or `market_id`: Arky checks each line again, and the request names that market too.
- **Quote and checkout:** `quote({ id, contact_email? })`, `checkout`, `retainCheckout`, `pendingCheckout` and `recoverCheckout`. A quote takes the guest's email as a string; a checkout's `contact_email` is `{ email, language }` or `null`, and it may name `contact_name: { first_name, last_name }` or `null`. A name has both nonblank parts; the SDK never fills either part in. A package line's `rent_product` items name the lent machine's `product`, a `ProductReference` (`{ id, key, blocks }` with the product's current blocks), also when no package lists that product.
- **After checkout:** `getOrder({ id })` (the order the cart became, or `null`) and `findOffers` (a company's offered carts).

A checkout refused because the quote changed throws a `CartPresentationChangedError` with the new quote. Send the guest's `contact_email` with the quote once you know it: a promotion code limited to one use per customer counts a guest by that email, and without it the quote is refused with 409 `CART.PROMOTION_EMAIL_REQUIRED`.

## More of the storefront

- **`eshop.order`:** `find`, `get`, `fromLink`, `retainedToken`, `findPayments` (a plain array), `findFulfillments({ order_id, limit?, cursor? })` (one page of the Order's shipments, oldest first, `{ items, cursor }`; a page whose shipments pass Arky's bound is refused with `409 FULFILLMENT.HISTORY_LIMIT`, so ask a smaller page), `getPayment`, `getInvoice`, `findOrdersPayments({ order_ids })` (the payments of 1 to 100 of the buyer's own Orders in one request, `{ order_id, payments }` in the order named, with no Order token; one Order she can't read refuses the whole read), `findProducts({ order_id, ids })` (1 to 100 ids of products the Order's product and rental lines name, each answered `{ type: "found", id, key, blocks }` or `{ type: "gone", id }` whatever its sale status, a plain array; the staff `eshop.order.findProducts({ store_id, order_id, ids })` answers the same; the ids come from the Order's lines: a product line's `product_id`, `null` only for a cancelled line whose variant is gone, and a rental-use line's `product_id`, while a package line carries its `package` as `{ id, key, blocks }`, on the staff and the buyer's Order alike; an Order webhook carries the stored Order, `WebhookOrder`, whose lines name neither), `resumePayment` (reopens the order's checkout payment page while its payment window is open; a renewal order has none), `downloadAsset`, `cancelBookingItem` and `rescheduleBookingItem`. A customer cancels booking lines only; the store's team cancels product lines. Order lists filter booking lines by `booking_statuses`. A list read since a time (`updated_at_from`) may answer a short or empty page that still has a `cursor`; keep paging until the cursor is `null`, as `readAllPages` does.
- **`eshop.promotion.get({ id })`:** the text shoppers see for a promotion, `{ id, key, blocks }`.
- **`eshop.library`:** `find`, `getProduct`, `findAssets` and `download`, for the digital files the buyer owns. Pass `company_id` or `company_location_id` for a company's. `download({ product_id, asset_id, reference })` takes the `download_reference` `findAssets` answered; it lasts 15 minutes, and an expired one is refused with `409 DIGITAL_ASSET.DOWNLOAD_EXPIRED`, so read `findAssets` again for a new one.
- **Packages:** packages a store sells are listed with `packageItem.find` and read like products: `eshop.package` (`find`, `get`, `getByKey`, `getProductChoices`, `joinFree`) and `eshop.packageOffering` (`get`, `getByKey`), each with the `package_id` of the shop it is listed in. Each plan is sold by its own `package` item, which holds exactly one price: a package read answers that item's `package_item_id`, and `packageItem.findPrices` pages its one price. A package read answers its `renewal`, `stay` and `minimum`, its automatic `items` in order as `{ id, type }`, `rental_products`: for each `rent_product` item, its `package_item_id` and the lent machine's `product`, a `ProductReference` with the product's current blocks, also when no package lists that product, or `null` once the product no longer exists, and `package_offering_id`, the offering the package belongs to or `null`.
  - An offering is a family of plans a membership moves between. An offering read answers its `id`, `key`, `blocks` and `package_ids`, the plans of it that the shop sells in the current market, in the offering's order, and 404 when the shop sells none, so a page groups the plans it lists by their `package_offering_id`.
  - `joinFree({ key, package_id, language })` (or `{ id, package_id, language }`) joins a signed-in customer to a free package, one that never renews and has no automatic items. `package_id` names the shop it is priced in. The Order contact is the customer's verified email in the `language` you pass, normally the page language. It reads the package's price in that shop and market, creates its own cart, checks the quote is free and places the zero-price order, with every id from the factories. It answers `{ type: "joined", order_id }` or `{ type: "already_member", package_member_id }`.
  - A cart buys a package with `addPackage({ package_id, quantity, choices, start, price })`, where `package_id` is the package being joined, `price` is the `{ package_id, package_item_id, price_id }` it is bought at, and `start` is `{ type: "on_acceptance" }`, `{ type: "scheduled", starts_at }` or `{ type: "switch", package_member_id }`. Buying another package of an offering whose package the buyer already holds is refused with `CART.OFFERING_MEMBER`, whatever either package's renewal: a `switch` line naming that membership changes it instead (see [Changing a package](#changing-a-package)).
  - `getProductChoices` answers a `get_product` item's alternatives with their `sku`, `product_blocks` and `variant_blocks`.
- **`newsletter`:**
  - `requestCode({ contact: { email, language } })` answers `{ type: "verified" }` when the signed-in customer, however they signed in (email, phone or a network store key), holds that address as a confirmed email. Otherwise it signs out a signed-in customer and sends a code, answering `{ type: "code_sent" }`.
  - `join({ email, code, key, package_id, language })` verifies the code and runs `joinFree`.
- **`broadcast.unsubscribe({ token })`:** a store's own unsubscribe page, which its Broadcast template links to with `{{unsubscribe_token}}`, posts the token from its `?token=` when the reader confirms and answers `{ result: "unsubscribed" }`. It needs no session. The email's one-click unsubscribe header keeps naming Arky's address.
- **`eshop.packageMember`:**
  - reads: `find`, `get`, `getCurrent`, `findOrders`, `getRevision`, `getCalendar`, `getProductChoices`, `getDeliveryOptions` and `getSwitchDeliveryOptions` (see [Changing a package](#changing-a-package));
  - `findOrders({ id, limit, cursor })` lists the membership's orders newest first by when their lines start, each order once, as `StorefrontOrder`s; pass the answer's `cursor` back as it is. A company or branch member's orders follow the Order rule: they need `view_company_orders` (all) or `view_own_orders` (the caller's), and without either the read is refused with `403`;
  - a membership's accepted terms keep the one variant each `get_product` item gives it (`variant_id`). `getProductChoices` answers the variants that item lists now, each `available` only when a change to it fits the accepted terms, and none once the item is gone; `changeTerms` names the new choice in `choices`;
  - `getRevision({ package_member_id, revision_id })` answers the revision, which holds its accepted `terms` in full, and `package`: the current `{ id, key, blocks }` of the package that revision is for, whatever the package's status, dates or sale, so a past order can name the package it bought (see the example below);
  - a revision's `origin` is `{ type: "initial" }`, or says what the change was in its own `type`, with the `previous_revision_id`: `own_terms` (the membership's own terms), `package_change` (a move at the next renewal, or a `never` package change bought with a `switch` line), `upgrade` (a renewing upgrade bought now with a `switch` line), `amend` (the store team's amendment of a `never` agreement) or `minimum`. The admin `eshop.packageMember.findRevisions` and `getRevision` answer the same types and add the change's `reason`;
  - a company or location membership's terms carry `purchase_order_number`, the number its renewals put on their orders, and a person's carry `null`. `changeTerms` and `getDeliveryOptions` send it with the rest of the terms; a new number clears a block for a missing one (`purchase_order_number_required`), and `resume` then passes;
  - a renewal whose membership's first order has no place of sale, in a store with a fiscal location, blocks the membership with `place_of_sale_required` instead of placing the order, and `resume` is refused with `PACKAGE_MEMBER.PLACE_OF_SALE_REQUIRED`; sell the package again at a place;
  - the member's actions: `cancel`, `pause`, `resume`, `skipNext`, `selectPaymentMethod`, `reviewSwitch`, `switch`, `reviewTerms`, `changeTerms` and `withdrawRevision`;
  - `withdrawRevision` withdraws a change that hasn't taken effect yet. Withdrawing a store team's amendment also cancels the lines of its zero-price order and withdraws the rentals it opened, and so does ending the membership before the amendment's date, so no confirmed order is left with nothing to ship.
- **Other eshop reads:** `eshop.minimumProgress.get`, `eshop.paymentMethod` (saved cards), `eshop.rental` (`find({ package_member_ids?, company_id?, company_location_id?, limit, cursor })`, naming at least one of 1 to 32 of the buyer's memberships, a company or a branch, where a company or branch needs `view_company_packages`, `get({ id })`, each rental with the rented machine's `product`: a `ProductReference` with its current blocks, whatever the package lists or sells, or `null` once the product no longer exists, and its `status` as Arky stores it, see the rental statuses below) and `eshop.return` (`create`, `get({ id })`, which also answers each line's product as a `ProductReference`, `find`, `getOrderOptions`, `findRentalOptions`).
- **`companies`,** the signed-in customer's companies: `getAccess({ id })`, `membership.find` (the customer's own), `location.find` and `location.get({ id })`. Members whose grants allow it also manage the company: `update` (`manage_company`); `location.create`, `update` and `delete` (`manage_addresses`); and `membership.find({ company_id })`, `create`, `update`, `delete`, `resendInvite` and `role.find({ company_id })` (`manage_members`). Creates take the app's `id`, and a location create sends `blocks: []`. Members never see company or location `blocks`, and their updates keep the stored ones. A location delete answers `{ deleted }`. `getAccess` answers `company` as `{ type: "company", ...the company }` for a member with a Company grant, or `{ type: "locations", id, name, status }` for a member whose grants name locations only. A buyer's copy of a rejected tax registration carries `rejected_at` and no reason.
- **`store`:** `country.find`, `country.get({ code })`, `location.find`, `location.get({ id })`, `market.find`, `market.get({ id })`, `market.getByKey({ key })`, `market.getCurrent()` (the client's current market, read once per key) and `load()` (on the store only).
- **`customer.ensureSession()`** identifies a visitor when there is no session yet, retrying once under a new visitor pair when Arky answers `409`, and does nothing when a session exists. The store helpers use it; call it before a page's first write of your own.
- **`category`:** `get`, `getByKey` and `findChildren({ id })`.
- **`support.conversation`:** `start({ language, flow_key, subject? })` starts a chat on the named support flow, one with a chat entry and text in that language; a start without a flow is refused (`400`), and a `flow_key` that isn't a key throws a `TypeError` before anything is sent. The calls are `start`, `get({ id })`, `findMessages({ conversation_id, after_sequence? })` (newest first, or with `after_sequence` the messages after it, oldest first, as the store's own `findMessages` does), `getMessage({ conversation_id, message_id })`, `sendMessage({ conversation_id, input, prompt_message_id? })`, `markRead({ conversation_id, sequence })` and `getAttachmentLink({ conversation_id, message_id, sha256 })`, under the customer's own session. A store `reply` lists its files in `attachments`, and `getAttachmentLink` answers a five-minute link to one of them. A conversation shows its `type`, `{ type: "chat", language, subject }` or `{ type: "phone" }` (a phone thread has no subject), its `next_message_sequence`, so a page reads messages only when it moves, and `customer_read` (`{ type: "unread" }` or `{ type: "through", sequence }`); a listed one shows `newest_message_at` and `unread` in place of `next_message_sequence`. A signed-in customer's `find({ limit?, cursor? })` lists her chats and her `phone` thread, newest message first, and `findAll({ limit?, cursor? })` pages the same items from Arky's own records, newest created first, so a thread started a moment ago is there at once; a page can come back short, so page on until `cursor` is `null`. The phone thread is read-only, so `sendMessage` there answers `409 CONVERSATION.NO_CHAT`, and `markRead` works as in a chat. It shows each `sms` with its `text`, each `reminder` that was sent with its booking line and start, each `booking_response` with its `answer`, and each `call` with only its `direction` (`incoming`) and `outcome`; a call's transcript and recording stay with the store. At a `chat_assistant` step, `sendMessage` answers only the customer's message; the assistant's `assistant_reply` comes later, so read it with `findMessages`. A reply's open `proposal` is answered with `confirmProposal` or `declineProposal({ conversation_id, message_id, proposal_id })`, which answer the message with the proposal's new `state`: `booked` (a new booking, with its `order_id` and `order_booking_line_item_id`), `applied` (a move, cancellation or confirmed visit), `refused` with its `reason`, or `closed`. A `book` command names the branch, `store_location_id`, with its offering and interval. `start` and `sendMessage` take their ids from `createId`. A `flow_email_contact` prompt is answered with `input: { type: "email_contact", contact }`, and a `flow_choice` prompt with `input: { type: "button", index }`, the pressed button's place in the prompt's `buttons`, counted from 0.
- **Tracking:**
  - `actions.track({ id?, key, data? })`: the id comes from `createId` when left out and is kept for the retry;
  - `experiments.use({ key })`: call it only where that version is shown;
  - `pageViews.send({ path, referrer })`: one `navigator.sendBeacon`, with no session or customer id.

An order's package line names its member and revision. Read that revision to show the package the order bought, even after the package stopped selling:

```typescript
import { findBlock, getBlockTextValue, orderPackageItems } from "arky-sdk/storefront";

const { items: orders } = await arky.eshop.order.find({ limit: 20 });
for (const order of orders) {
  for (const line of orderPackageItems(order)) {
    const revision = await arky.eshop.packageMember.getRevision({
      package_member_id: line.package_member_id,
      revision_id: line.package_member_revision_id,
    });
    console.log(order.number, revision.package.key, getBlockTextValue(findBlock(revision.package, "name"), "en"));
  }
}
```

### Changing a package

A `{ type: "switch", package_member_id }` line moves a membership the buyer holds to another package of the same offering, priced by that package's own `package` item. It keeps the membership's quantity and names the choices the new package needs. What it does depends on the membership's renewal:

- **`every`:** an upgrade to a higher-priced package of the same cadence that gives something at once (a service or a digital variant) takes effect when the order is accepted, and the order charges the price difference for the rest of the paid period. The upgrade's order ships nothing: what the new package ships or lends starts with the next renewal order. Every other move of a renewing membership waits for its next renewal through the member's `switch` action, which refuses an upgrade with `PACKAGE_MEMBER.UPGRADE_IS_BOUGHT`.
- **`never`:** a package change. The order charges the new package's price times the membership's quantity, and it moves the same membership when its package line is confirmed: at placement when the change charges nothing for its package (a free checkout, or one that pays only its deliveries on account, by cash on delivery or by a manual option), and when the payment is confirmed for a card checkout. The quote line's `rental_change` says what happens to the lent machines, so the page never works it out itself:
  - `items`: for each `rent_product` item of the new package, the rental that continues on it (`rental_id`, or `null` when a new rental opens), the units it keeps (`kept_quantity`) and the units the order ships (`shipped_quantity`). A cart delivery names only the shipped units;
  - `ending`: each rental of the membership that ends, with the units that come back (`returned_quantity`).
  
  Until the change applies, the membership keeps its package, terms, minimum and rentals, the rentals the order opened are `waiting`, and it is managed through the order: its other actions are refused with `PACKAGE_MEMBER.CHANGE_SCHEDULED`, and a second `switch` line with `PACKAGE_MEMBER.CHANGE_WAITING`. When the change applies, those rentals turn `active`. When the order line is cancelled before it is paid, the change ends unapplied, its rentals are `withdrawn` and the membership keeps its package. Only the buyer changes a package this way: a store team's `switch` of a `never` membership is refused with `CART.AMENDMENT_REQUIRED`, and the team amends it from the next month with an `amend` start.
- A switch never changes the renewal kind: between a `never` and an `every` package it is refused with `CART.SWITCH_NOT_UPGRADE`, so the buyer ends the membership, then buys the other package.

A renewing move also names a delivery for each shipping profile the new package ships or lends under and the membership's terms don't deliver: an address or a pickup, its shipping method and its fee (`base_fee`), priced for the windows of the first renewal the new terms ship in. The membership's other deliveries carry over as accepted, and a delivery for a profile the terms already deliver is refused.

- A `switch` line names them as a purchase does, with `setFutureDeliveries` and the offers `quoteFutureDeliveries` answers. Until each is named, its quote shows `package_delivery_required`. Any other refusal of the change shows on the line as `package_change_refused` with the refusal's `code`, such as `PACKAGE_MEMBER.CHANGE_WAITING`, and placing it is refused with that code.
- The `switch` action names them in `deliveries`: `[]` when none is needed, and always `[]` for a `never` membership. Without one it is refused with `PACKAGE_MEMBER.DELIVERY_REQUIRED`.
- `getSwitchDeliveryOptions` lists the methods and fees a new delivery can take, for the move, the current `revision_id`, the page's `language` and the `delivery_id` you ask about. It reads no delivery's method or fee, so before the buyer picks one, name that delivery with any canonical method id and `base_fee: 0`, then send `reviewSwitch` and `switch` with the chosen `shipping_method_id` and its `base_fee`. An offer has a `base_fee` when every window of that renewal costs the same, and its `window_amounts` either way.

```typescript
const printEdition = "6b2d9f41-8c37-4e05-a1d6-3f9b2c7e5a80";
const printProfile = "c3e8a1f5-2d74-4b96-8e0a-7f1c5d3b9a26";
const { items: renewing } = await arky.eshop.packageMember.find({ status: "active", limit: 20 });
const member = renewing.find((candidate) => candidate.renewal.type === "every");
const current = member ? await arky.eshop.packageMember.getCurrent({ id: member.id }) : null;
if (member && current?.revision) {
  const move = {
    id: member.id,
    expected_updated_at: member.updated_at,
    to_package_id: printEdition,
    choices: [],
    price: { package_id, package_item_id, price_id },
  };
  const asked = {
    id: crypto.randomUUID(),
    package_item_ids: [package_item_id],
    destination: { type: "delivery" as const, address },
    shipping_method_id: crypto.randomUUID(),
    shipping_profile_id: printProfile,
    base_fee: 0,
  };
  const options = await arky.eshop.packageMember.getSwitchDeliveryOptions({
    ...move,
    revision_id: current.revision.id,
    language: "en",
    delivery_id: asked.id,
    deliveries: [asked],
  });
  const [offer] = options.offers;
  if (offer && offer.base_fee !== null) {
    const delivery = { ...asked, shipping_method_id: offer.shipping_method_id, base_fee: offer.base_fee };
    const reviewed = await arky.eshop.packageMember.reviewSwitch({ ...move, deliveries: [delivery], reason: "Add the print edition" });
    console.log(reviewed.created?.schedule);
  }
}
```

The store team never makes a renewing membership's next renewal charge more than its accepted terms charge for that renewal: the package price times the quantity, plus each delivery's fee for each of its windows in that renewal, or once for a delivery that only lends when that renewal ships it new units. Each terms is priced over one of its own renewals. A team `switch` or `changeTerms`, a `switch` line the team places, and the team's withdrawal of a waiting change that would raise it are refused with `PACKAGE_MEMBER.HIGHER_PRICE` (a line shows it as `package_change_refused`), whatever raised it: a pricier package, another cadence, a larger quantity, a delivery fee or newly lent units. The buyer makes that change or withdrawal itself.

A move from terms whose renewals charge nothing to terms that charge follows a first purchase's card rule. A `switch` line's checkout saves a card and selects it on the membership: its quote line says `saves_card` and the quote lists only card options. The `switch` action and `changeTerms` have no checkout, so they are refused with `PACKAGE_MEMBER.CARD_REQUIRED` until the membership renews with a ready card, which the buyer saves and selects first.

A rental's `status` (`RentalStatus` for the store team, `CustomerRentalStatus` for the buyer) says where its machine stands, so a page shows it as read and never works it out:

- `waiting`: the order that opened it waits. That is a first purchase until its payment activates the membership, a package change until it applies, and a team amendment until its date. Nothing of it is picked or shipped yet. A first purchase's order holds its machines in stock while it waits, so another buyer's checkout can't take the last one (`INVENTORY_LEVEL.NOT_AVAILABLE`); a failed or expired payment frees them;
- `active`: its terms started, and its machine ships, stays out or is replaced;
- `ending`: its machine goes back (`requested_at`, `return_due_at`). The store team's status says who ended it: `ending_by_account` (`requested_at`, `actor`, `reason`, `return_due_at`) or `ending_by_system` (`requested_at` and a `cause`, `package_changed`, `purchase_cancelled` or `member_ended`, with no deadline); the buyer reads one `ending`;
- `closed`: none of its machines is out and no return is open (`closed_at`). The store team's status keeps the ending it closed: `closed_after_account_ending` (`requested_at`, `actor`, `reason`, `return_due_at`, `closed_at`) or `closed_after_system_ending` (`requested_at`, `cause`, `closed_at`); the buyer reads one `closed`;
- `withdrawn`: its terms never started, because the order ended unpaid, the change ended unapplied, the amendment was withdrawn or the membership was cancelled first (`withdrawn_at`). It never had a machine out and opens no return, and a storefront lists it nowhere.

Ending, closing or replacing a `waiting` or `withdrawn` rental is refused with `RENTAL.WRONG_STATUS`; a waiting rental is managed through its order or its amendment. The store team lists rentals by any of these statuses with the admin `eshop.rental.find({ store_id, status })`, where `status: "ending"` finds both kinds of ending and `status: "closed"` both kinds of close, lists the rentals of up to 32 memberships with `package_member_ids`, of a company's or a branch's memberships with `company_id` or `company_location_id`, and reads up to 100 rentals by `ids` (alone, in the order named, `cursor: null`). Each listed rental carries the machine's `product` (or `null`), its `quantity` and its `units`, as the buyer's rental does, and `eshop.rental.get` answers `product` and `units` beside `rental` and `terms`. A rental's `quantity` is how many machines it rents, the rented item's quantity times the membership's: the number `get` answers as `terms.quantity`, so a list needs no read of each rental for it. The store's `open_rentals_by_status` count has `waiting`, `active` and `ending` segments. A rental names the membership revision that holds its terms as `package_member_revision_id`. The `rental.created` and `rental.updated` webhooks carry the same `status`: a rental is created `waiting` or `active`, and a waiting one posts `rental.updated` when it starts and when it is withdrawn, so a consumer that switches on the status meets every value above.

Every other package line answers `rental_change: null`. A store team that assigns a package directly is refused with `PACKAGE_MEMBER.OFFERING_MEMBER` while the subject holds another package of that offering. A `never` membership changes through its `switch` line, and a membership in another package of the offering is refused with `CART.OFFERING_MEMBER`.

```typescript
const { items: memberships } = await arky.eshop.packageMember.find({ status: "active", limit: 20 });
const membership = memberships.find((member) => member.renewal.type === "never");
const largerPackage = "4f1c2b8e-7a35-4d96-b0e2-9c6d3a1f5e87";
if (membership) {
  const cart = arky.eshop.cart({ buyer: { type: "customer" }, package_id });
  await cart.ensure();
  await cart.addPackage({
    package_id: largerPackage,
    quantity: 1,
    choices: [],
    start: { type: "switch", package_member_id: membership.id },
    price: { package_id, package_item_id, price_id },
  });
  const quote = await cart.quote();
  for (const line of quote.lines) {
    if (line.type !== "package" || !line.rental_change) continue;
    for (const item of line.rental_change.items) {
      console.log(item.rental_id ? "stays" : "new", item.kept_quantity, item.shipped_quantity);
    }
    for (const ending of line.rental_change.ending) console.log("goes back", ending.rental_id, ending.returned_quantity);
  }
}
```

## Admin client

Digital asset uploads have a 50 MiB request limit in production, including multipart overhead.
An oversized request is refused with 413 `GENERAL.PAYLOAD_TOO_LARGE`. Form attachments have their separate
10 MiB per-file and 50 MiB per-submission limits.

```typescript
import { createAdmin } from "arky-sdk/admin";

const accountToken = process.env.ARKY_API_TOKEN;
if (!accountToken) throw new Error("Set ARKY_API_TOKEN to an account token");
const admin = createAdmin({ apiUrl: "https://api.arky.io", accountToken });
const { items: markets } = await admin.store.market.find({ store_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" });
console.log(markets.length);
```

`accountToken` takes an account token (`arky_at_` and 43 URL-safe characters, see [Account tokens](#account-tokens)); any other value throws a `TypeError` before a request goes out. The client never refreshes a token: a revoked or expired one, or one whose Account is being deleted, answers `401 GENERAL.UNAUTHENTICATED`. Its `session` is `null`, and `logout()` answers `{ type: "account_token" }` and revokes nothing.

Without `accountToken`, an Account signs in with a code sent by the named network, and the client keeps and refreshes the Account session:

```typescript
const network_id = "0f6a3c84-2d19-4e75-b8a1-5c9e7d3b2f60";
const pending = await admin.account.auth.requestCode({ session_id: crypto.randomUUID(), network_id, email: "staff@example.com", language: "en" });
await admin.account.auth.verify({ session_id: pending.session_id, network_id, code: "123456" });
console.log(admin.session?.email);
```

The app picks the code request's `session_id` once per send-code press and sends the same id on a retry: the same id and email answer the same pending session and send no second code. A store's sign-in (`store_id`) opens only that store.

- **Store sign-in.** Every `requestCode` names the code email's `language`. Pass `store_id` to `requestCode` and `verify` to sign in through a live store's own site; a store sign-in treats any address that isn't a member email of its network as unknown and makes nothing. Test stores require network sign-in, whose code goes to the person's real inbox. Other stores, platform administration, creating a store, accepting another store's invite, the Account's tokens and deleting the Account refuse a store-scoped session with `403 ACCOUNT.PLATFORM_OR_NETWORK_SIGN_IN_REQUIRED`, and its session list shows only that store's sessions.
- **Platform sign-in.** A platform account signs in with `account.auth.requestPlatformCode({ session_id, email, language })` and `verifyPlatform({ session_id, code })`. A session's `scope` is `{ type: "platform" }`, `{ type: "network", network_id }` or `{ type: "store", store_id }`.
- **Network sign-in.** Any address gets a code. A member email of the network opens its account; an address no login of the network holds makes a new account with that member email; and a customer email that is its account's oldest email becomes a member email while that account holds no membership. Any other address answers `409 ACCOUNT_SIGN_IN.MEMBER_EMAIL_REQUIRED` after the code check.
- **The account.** `account.getMe()` answers `AccountMe`: `type` is `{ type: "platform", logins, name, second_factor }` or `{ type: "network", network_id, logins, name, phone, second_factor }`, and `session_email` is the email this session signed in with. A platform account's logins are `email`; a network account's are `member_email`, which opens member sessions, and `customer_email` and `customer_phone`, which only open the network's customer sign-in. `updateProfile({ name, phone, expected_updated_at })` takes an E.164 `phone` on a network account; a platform account has none (`400 GENERAL.VALIDATION_FAILED`). Reads of a colleague's account (`account.find`, `platform.account.*`, `network.member.resetSecondFactor`) answer `ListedAccount`, whose `email` is the oldest member email and which shows no customer login.
- **A member's emails.** Through the account's own member session, `account.login.requestCode({ email, language })` sends a code and `account.login.verify({ email, code, confirm_join })` adds the email as a member email, or makes its own customer email one; `account.login.remove({ address })` removes a login, and any session may remove the email it signed in with or a newer one. Each answers `AccountMe`. Removing a login ends the sessions signed in with it, and every change tells the account's other logins. The refusals are those of the network customer's logins, with `ACCOUNT_LOGIN.MEMBER_SESSION_REQUIRED` for a change only the own member session makes and `ACCOUNT.LAST_MEMBER_EMAIL` for the last member email of an account with memberships.
- **Sign-in refusals** carry their own codes: `ACCOUNT_SIGN_IN.CODE_RECENT`, `ACCOUNT_SIGN_IN.CODE_INVALID`, `ACCOUNT_SIGN_IN.ATTEMPTS_EXHAUSTED`, and `STORE_SIGN_IN.UNAVAILABLE` while a store's email sending is paused or its plan has lapsed. The same `session_id` with another email, through the other sign-in or after its code was used answers 409 `GENERAL.CONFLICT`.
- **Session refresh.** The client refreshes when Arky refuses the access token and sends that request again; it never compares this device's clock with the session's expiry. The kept session holds `id`, `access_token`, `refresh_token` and `email`; any other stored value is no session, so the person signs in again. A logout Arky refuses for its access token rotates once and revokes again. Only Arky's own refusal of a refresh (401 `GENERAL.UNAUTHENTICATED` or 403 `GENERAL.UNAUTHORIZED` in Arky's error body) clears the kept session and reports `null` to `onAuthStateChanged`. Any other failed refresh, such as a 401 or 403 from a proxy in front of Arky, a 429 or a 5xx, fails that request and keeps the session for the next try. A refresh rotates the refresh token, so after a lost refresh answer the next refresh is refused and the person signs in again. A browser without Web Locks refuses the refresh with `ArkyError` `storage`, and a refresh answer that isn't JSON fails with `ArkyNetworkError` `unreadable_answer`.
- **Restored tokens.** A process restoring an Account access token can pass a `forcedHeaders` callback with its Bearer `Authorization` header and `onUnauthorized: () => false`.
- **Forwarding the access token.** `admin.getAccessToken()` answers the token the client sends: the account token it was made with, or the signed-in session's current access token, or `null` signed out. An app's own server can pass it on to read Arky as the same Account. Read it for each request, because a refresh replaces it.
- **Media uploads.** `media.create({ store_id, id, file, visibility })` needs `visibility: "public" | "private"`, fixed at creation: a create without it is refused with a `TypeError` before anything is sent, and Arky refuses an upload without it with `400`. URL imports use `source_url` instead of `file`. In a browser, it keeps the exact file and visibility in IndexedDB until Arky confirms them, one kept upload per store, and refuses a different upload with `DurableRequestError` `pending` while one is kept. `readPendingMediaCreate(store_id)` from `arky-sdk/utils` reads the kept upload back for a retry under its id, and `discardPendingMediaCreate(store_id)` drops it, also one whose stored file can't be read; a discard while that upload is still being sent is refused with `busy`.
- **Customer import.** A customer import (`customers.previewImport`, `customers.import`) answers one outcome per row: `create` in a preview or `created`, `existing` when the row's id already names the same imported customer, which changes nothing, or `failed` with the row's error answer (`ApiErrorResponse`: its `error` code, `status_code` and `validation_errors`). The counts are `rows_to_create` in a preview and `customers_created` in the import, with `rows_existing` and `rows_failed`.
- **Customer contacts and links.** `customers.addContact({ store_id, customer_id, expected_updated_at, contact, sms })`, `updateContact({ store_id, customer_id, expected_updated_at, address, language, sms })` and `removeContact({ store_id, customer_id, expected_updated_at, address })` change a customer's contacts and answer the `Customer`. `customers.inviteContact({ store_id, customer_id, id, address })` sends an invite code to one of its contacts, through the store's own channel in an `Isolated` store and through the network's in a `Connected` one (`CUSTOMER_CONTACT.ALREADY_CONFIRMED` for a confirmed contact, `CUSTOMER_CONTACT.SMS_OFF` for a number whose SMS is off), and `findInvites({ store_id, customer_id })` lists the open ones. `removeLink({ store_id, customer_id, position, expected_updated_at })` removes the link at that position in the `links` the staff member read, which ends its sessions and keys. Customer search answers `contacts` as `{ status: "unconfirmed" | "confirmed", address }` and `linked`, and the store's counts split customers into `linked` and `anonymous` (`customers_by_link`). `customers.find({ store_id, contact_email, limit?, cursor? })` or `{ store_id, contact_number, … }` (an email or an E.164 number, one of the two) reads the customers holding that exact contact from Arky's own records, a page with its `cursor`, for code that decides from the answer, such as an import skipping a known patient; it takes no `ids`, `query`, other filters or sort, and leaves out holders the caller doesn't reach, so a page can come back short. The search list also sorts by `sort_field: "name"` (last name, then first name) and takes `filters`, 1 to 32 `BlockQuery` predicates on the customers' `blocks`, and `profile_filters`, 1 to 32 `date` predicates on the `Date` blocks of their `profile` by the store's own key (a birth-date range is two predicates on one key), all of which must hold. Either list also takes `{ type: "absent", key }` (`CustomerBlockAbsence`): in `filters` it holds for a customer with no block value at that key, such as the patients not archived, and in `profile_filters` for one with no profile date at that key.
- **Unknown card charges.** A Stripe card charge whose answer was lost is settled with `payment.resolveCharge`: `{ type: "payment_intent", payment_intent_id }` when Stripe shows it, which Arky records as `confirmed_made` (with the PaymentIntent and the account that confirmed it) without asking Stripe, counts as paid and refunds nothing until Stripe's post proves the charge and makes it `paid`; or `{ type: "not_made" }`, which the payment then shows as `confirmed_not_made`. A PaymentIntent another payment of the option holds is refused with `PAYMENT.INTENT_HELD`, and a post that disagrees opens an `account_outcome_disagrees` hold. A Monri card charge, and a cancelled Monri page whose money came, take `{ type: "made", transaction_id }` and show `confirmed_made { transaction_id, by }`; a transaction number the payment already records is refused with `PAYMENT.TRANSACTION_RECORDED`. Orders, Payments and Customers carry `access: "read" | "write"` in roles. Write includes Read; an account token uses its Account's current access.

| Namespace | What it covers |
|---|---|
| `account` | `getMe`, `find`, `delete`, `login`, `session`, `token`, `auth` |
| `platform` | `findCurrencies` and `findWebhookEvents` (plain arrays), `account`, `stripeBillingEvent`, `storePlanCharge`, `resendEvent`, `networkSmsPost` |
| `store` | the store, `nameDefaultLocation`, `testStores`, `wipe`, `subscription`, `usage`, `member`, `role`, `webhook`, `country`, `location`, `market`, `salesChannel`, `provider`, `phoneNumber`, `auditLog`, `paymentOption`, `simulator`, `zone`, `taxCategory`, `shippingProfile`, `shippingMethod`, `seller`, `invoicing`, `invoiceCounter`, `fiscalDevice` |
| `network` | networks, their `provider` logins, their `plan` list and their stores (`store.nameOwner`) |
| `notification` | `notification`, `outgoingMessage`, `outgoingWebhook`, `incomingWebhook`, `template`, `layout`, `emailAddress`, `resendEvent` |
| `broadcast` | one email or SMS to the members of packages or to the store's customers |
| `support` | `flow`, `assistant`, `conversation` (chat and email in one record), `call`, and a call's provider posts (`twilioPost`, `elevenLabsPost`) |
| `media`, `category`, `content` | files, categories, public collections and entries, `privateCollection`, `privateEntry` |
| `forms` | forms, submissions, stage changes, files, `notes` |
| `companies`, `customers` | companies with locations, roles, memberships and notes; customers with contacts, links, invites, sessions, `suppression`, notes, `erase`, `merge` and `export` |
| `actions`, `experiments`, `counts` | the customer timeline, A/B tests (`getResults`), the store's counts (`getStatuses`, `getReport`) |
| `eshop` | products, variants, digital assets, bookings, packages with their items, `packageItemPrice` and `packageAccess`, offerings and members, promotions, payment methods, payments, carts, orders (with `resumePayment`, credits, invoices, `fiscalReceipt` and notes), inventory, fulfillment, returns and rentals |

- **Store-provider webhooks.** The merchant makes a webhook at Arky's address and pastes its signing secret. A Stripe login saves it with `store.provider.saveStripeWebhookSecret`, for the first paste and every roll; a Resend login carries it as `webhook_secret` in `store.provider.connectResend` and `replaceResendKey`. `store.provider.checkStripeSetup` and `checkResendSetup` answer the address and events to set and name each problem they find. Make the Stripe webhook a Snapshot destination (Stripe suggests Thin), on any API version. Give a Resend connection a Full access API key: a Sending access key can only send, and Arky also reads the account's webhooks, domains, suppressions and received mail.
- **Card logins.** A card option charges through a store provider, so connect the login first: `store.provider.connectStripe({ store_id, id, restricted_key, publishable_key })` or `connectMonri({ store_id, id, environment, merchant_key, authenticity_token })`, and on a test store `connectArkyStripe` or `connectArkyMonri({ store_id, id })`. Then make the option with `store.paymentOption.createStripe`, `createMonri`, `createArkyStripe` or `createArkyMonri({ store_id, provider_id, id, key, blocks, status, saved_card_terms })`. A login of another supplier is refused with `STORE_PROVIDER.TYPE_MISMATCH`. The option's `type` carries the login's `provider_id`, `provider_status` and `provider_updated_at` with the login's own fields. `replaceStripeKeys`, `refreshStripe` and `replaceMonriMerchantKey` act on the login and answer the `StoreProvider`. Only the store owner connects a card login or changes its keys, merchant key or webhook secret.
- **Card payment posts.** `notification.incomingWebhook.find({ payment_option_id, status })` lists one Stripe or Monri option's received posts.
- **Store webhook posts.** Each post Arky sends to a `store.webhook` URL is `{ id, type, timestamp, store_id, store, customer, data }`. `customer` is `null` when the event names no customer, `{ id, store_id }` when it names one by id only (a Private form's `form_submission.created` and `stage_changed`, every `form_submission.deleted`, `customer.erased`, and a customer that is gone), and otherwise `{ id, store_id, emails, phones }` with the customer's confirmed contacts. No post's `data` carries `notify_customer`: `order.cancelled`, `refund.succeeded`, `fulfillment.ready`, `fulfillment.dispatched` and `fulfillment.delivered` leave it out.
- **Invoices.** An Order has at most one live invoice plus its credit notes; placing it does not create a draft. `eshop.order.invoice.find({ store_id, order_id?, limit?, cursor? })` lists documents and `get({ store_id, invoice_id })` reads one. `findUnissued({ store_id, reason, limit?, cursor? })` lists obligations for one required reason and supplies a read-only `explanation`: ready, paused, awaiting an outside number, or blocked with a code and message. `issue({ store_id, order_id, buyer, memo })` issues against the Order, with `buyer` chosen from the Order or supplied explicitly and `memo` set to none or text. `attachOutside({ store_id, order_id, number, document })` also addresses the Order. `detachOutside({ store_id, invoice_id, expected_updated_at })` returns the renewed waiting obligation or `null`; a credited outside document cannot be detached or replaced. `createOutsideCreditNote({ store_id, invoice_id, id, order_credit_id, number, document })` retains that invoice relationship. `reissue({ store_id, invoice_id, expected_updated_at, reversal_id, new_invoice_id, reason, buyer, memo, void_credit_ids })` returns `{ reversed, reversal, invoice }`. Issued documents keep their frozen facts. `store.seller` owns legal and payment-reference details. `store.invoicing.set({ store_id, expected_updated_at, invoicing })` selects `{ type: "none" }`, `{ type: "outside" }` or `{ type: "arky" }`; an eligible Arky seller uses one annual Store invoice counter, managed through `store.invoiceCounter.find` and `confirm`. `eshop.payment.record({ store_id, order_id, fiscal_device_id, payments })` returns `{ payments, fiscal_receipts }`. `eshop.order.fiscalReceipt.issue({ store_id, order_id, fiscal_device_id })` creates the receipts currently due on that device.
- **Fiscal receipts and devices.** Every `FiscalReceipt` carries its frozen `print` decision, `at_desk` or `not_printed`, and the desk agent's claim answers `buyer_present` as `print === "at_desk"`. An `advance` names its `chain`: `{ type: "goods" }` or `{ type: "target", target }`. `eshop.order.fiscalReceipt.settle({ store_id, fiscal_receipt_id, outcome })` takes `{ type: "issued_on_other_device", number, issued_at }` for a requested TaxCore receipt or a requested receipt of a `manual` FBiH device, `{ type: "written_by_hand", hand_number, written_at }` for a requested receipt of an FBiH printer, which the printer then prints, and `{ type: "not_issued" }` for an `unknown` receipt or a `print_failed_after_hand` one, which the printer then prints again. The other hand path answers `409 FISCAL_RECEIPT.HAND_PATH_MISMATCH`. A restore holds every active fiscal device: its `status` is `held_after_restore` and its readiness `{ type: "not_ready", reason: "held_after_restore" }`, it sends nothing, and a desk agent's claim answers `409 FISCAL_RECEIPT.DEVICE_HELD`. Only the store owner releases it with `store.fiscalDevice.release({ store_id, id, expected_updated_at })`, which answers the device; an archived device answers `409 FISCAL_DEVICE.ARCHIVED`. A TaxCore claim's `request` is `{ type: "tax_core", body }`, the body the box takes: `body.invoiceRequest` holds the invoice, with `dateAndTimeOfIssue` on an advance paid by bank transfer and `referentDocumentNumber` and `referentDocumentDT` together when the receipt names an earlier one, and beside it an advance settle carries `advanceFinal: true` and a final `advanceFinal: true`, `advancePaid`, `advanceTax`, `advanceLastInvoiceNumber` and `advanceLastInvoiceDateTime`. The agent reports the box's `sdcDateTime` text as the answer's `sdc_date_time`, and a `done` TaxCore receipt keeps it next to `signed_at`. A Croatian receipt freezes, when it is made, its `seller` (`name`, `address`, `oib`), its `cashier` (the staff member's name, or `Online` for an automatic save) and its `payment_method` (`cash`, `card`, `transaction_account` or `other`). Arky stops sending an offline Croatian receipt again at its `clearance_due_at`; past it, `eshop.order.fiscalReceipt.deliver({ store_id, fiscal_receipt_id })` sends it once more by hand and answers the receipt. The same call on an OFS cloud receipt still `requested` once its automatic tries have ended, `limits.fiscal.cloud_tries_seconds` after the receipt was made (24 hours by default), queues one more send and answers the receipt as it is, still `requested`. Any other receipt, or one before then, is refused with `409 FISCAL_RECEIPT.NOT_DELIVERABLE`, and a held device with `409 FISCAL_RECEIPT.DEVICE_HELD`. A desk PC works through `createFiscalDeviceAgent({ apiUrl, storeId, token, redirect? })` from `arky-sdk/admin`, with the device key the owner made; `redirect` goes to every request's `fetch` (`"follow"`, as every client does, when it is absent), so a desk app that must not follow a redirect names `"error"`, which ends such a request as `ArkyNetworkError` `network`, or `"manual"`, which ends it as `unreadable_answer` with the answer's `statusCode`. Every staff receipt answer (`find`'s items, `get`, `copy`, `correct`, `settle`, `deliver` and `issue`) is a `FiscalReceiptDetail`: the receipt with `deliverable`, true exactly when `deliver` would take it now, worked out on each answer; offer the action only then. The desk agent's claim and report and `eshop.payment.record`'s `fiscal_receipts` answer the plain `FiscalReceipt`. `eshop.order.fiscalReceipt.find` lists the receipts of up to 100 distinct Orders with `order_ids`, Order by Order in the order named and each Order's oldest first, or the store's receipts, the `open` ones alone with `open: true`, within `created_at_from` and `created_at_to` (epoch milliseconds, both inclusive); `order_ids` with `open` or with the range answers `400`.
- **Money left on an Order.** The admin `eshop.order.get` answers the Order with `money_left`: `{ type: "shown", credit_left, refund_allocation_maximums }` for a caller who reads Orders or Payments, and `{ type: "not_shown" }` for one who reaches the Order only through a Bookings scope. `credit_left` lists each target with money left as `{ target, subtotal, total }`: `subtotal` is the most a `part` credit may take and `total` what a `remaining` credit gives back, per unit for a product `span` and for the whole booking, rental-use line or delivery group. `refund_allocation_maximums` lists each Active credit's allocation a new refund may still name, `{ order_credit_id, order_credit_allocation_id, target, maximum }`, net of the refunds that succeeded or are in flight on it. The credit and refund writes use the same rules, so a page shows the limit Arky enforces.
- **Payment lists.** `eshop.payment.find` takes `order_ids` (up to 100 Orders), `created_at_from` and `created_at_to` (inclusive), a recorded payment's `method` (`cash`, `card`, `bank_transfer` or `other`), `cashier_account_id` (the account that recorded it) and `store_location_id` (the Order's place of sale), each combining with the others.
- **Voiding a payment.** Every staff payment answer (`eshop.payment.get`, `find` and `record`, and the admin `eshop.order.findPayments`) carries `void`, the answer `eshop.payment.void` would give now: `{ type: "available" }`, `not_recorded` (card money is refunded instead, `400`), `voided` (`PAYMENT.VOIDED`), `refunded` (a refund is requested or sent, `PAYMENT.REFUNDED`) or `receipted` (a fiscal receipt names it, `PAYMENT.RECEIPTED`). Offer Void only on `available`. Storefront payment copies have no `void`.
- **Refunds.** `eshop.payment.allocateRefund({ store_id, payment_id, refund_id, expected_updated_at, application })` explains a refund Stripe started, as `{ type: "commercial_credit", allocations }` or `{ type: "excess_collection", reason }`; the refund's `allocated` source then carries that `application`, and a second allocation answers `409 PAYMENT.REFUND_ALLOCATED`. Each refund on a staff payment names its `type`: `stripe` (one Arky sent, with its `request`), `stripe_dashboard` (one Stripe reported that Arky didn't send, with its `source`, `unallocated` or `allocated`, the only kind `allocateRefund` takes), `monri` or `recorded`; the buyer's copy is unchanged. `recordRefundReceipt` records a recorded refund as `{ type: "sent", reference, method }`, where `method` is `{ type: "cash" }`, `{ type: "card" }`, `{ type: "bank_transfer" }` or `{ type: "other" }`, and later as `{ type: "returned", reference }`; the refund's `sent` status keeps the method. The buyer's copy from the storefront's `eshop.order.findPayments` and `getPayment` names the same `method` on `sent` and on `returned.sent`, and leaves out each part's `reference` and who recorded it.
- **Monri.** `store.provider.replaceMonriMerchantKey` gives a Monri login a new merchant key, and `eshop.payment.recordMadeRefund` records a refund already made in Monri's back office.
- **Support.** `support.conversation.assign({ expected_account_id, account_id })` and `selectReplyEmail({ expected_reply, reply })` name the value they read. `reply`, `resolve` and `sendSms({ store_id, conversation_id, id, newest_message_sequence, text, resolve? })` name the newest message the person read as `newest_message_sequence` (`null` when the thread has none); a newer one answers `409 GENERAL.CONFLICT`. `markRead` and `markUnread({ store_id, conversation_id, sequence })` move the store's read position. A thread's `subject` sits in its `type` (`chat`, `email` and `chat_and_email` have one, `phone` none), and it has `customer_read`, `store_read` and `unread`, which the Server works out for the store's side: whether a message from the customer's side follows `store_read`. `support.conversation.find` takes `unread` (`true` or `false`) and `unassigned: true` (threads with no assignee; with `assigned_account_id` it is refused with `400`). It waits as `waiting_for_store` with its `reason` (`message`, `booking_change_requested`, `callback_requested` or `reopened`), and a `phone` thread holds `sms`, `reminder`, `booking_response` and `call` messages. An SMS is refused with `CONVERSATION.NO_PHONE`, `CONVERSATION.NO_SMS_CONSENT` or `CONVERSATION.SMS_NOT_SET_UP`. `startChat({ store_id, id, message_id, customer_id, language, subject, text, files? })` starts a chat with a customer whose first message is the staff reply, shown in the customer's own chats. `reply` and `startChat` take `files` (`File[]`) for a reply delivered to the chat alone and send one multipart request; files with an emailed reply are refused with `CONVERSATION.FILES_CHAT_ONLY`, and a `reply` message keeps its files in its `delivery`, `{ type: "chat", attachments }`. `sendCustomerSms({ store_id, customer_id, id, text, resolve? })` texts a customer straight into their Phone thread, which it opens when they have none, under the same rules as `sendSms` but naming no message. `reopen({ store_id, conversation_id, newest_message_sequence })` makes a resolved conversation wait for the store again as `reopened`, without a message.
- **Support flows.** A flow's `entries` may hold `{ type: "phone", phone_number_id, language, start_step_key }`, one flow per phone line (`409 SUPPORT_FLOW.PHONE_NUMBER_TAKEN`). A phone entry reaches only `phone_say` (`prompt`, `next_step_key`), `phone_menu` (`prompt`, `options` of `{ digit, next_step_key }`, digits 0 to 9, and `no_answer_step_key`; the caller has the configured seconds to press a digit), `phone_ring` (`number`, `ring` in milliseconds within the configured bounds, 5 to 60 seconds in production), `phone_assistant`, `open_hours` (`hours`, whose windows are `{ from, to }` times of day in milliseconds, `open_step_key`, `closed_step_key`), `hand_to_store` and `resolve`. A `prompt` is `{ type: "speak", text }`, with text in the entry's `language` and only in languages Twilio's voices speak (`409 SUPPORT_FLOW.NO_TWILIO_VOICE`), or `{ type: "play", media_id }`, a Public MP3 or WAV file of the store played to the caller in every language (`409 SUPPORT_FLOW.PROMPT_NOT_AUDIO` for another kind of file); while a flow plays a file, deleting it answers `409 REFERENCE.STILL_REFERENCED`. A call whose recording is gone fails that step with `prompt_recording_missing` and waits for the store's callback. A chat reaches `chat_assistant` (`assistant_id`, `hand_over_step_key`). `phone_assistant` holds `assistant_id`, `greeting`, `recording` (`{ type: "off" }` or `{ type: "keep", period }`, a number of days from 1 to the configured 365 in production) and `transfer_step_key`. `assistant_id` names a `support.assistant` record (`create`, `update`, `get`, `find({ key? })`, `delete`, under the app's id and a `key`), whose settings are `{ status, login, languages, instructions, actions, sales_channel_id, market_id, package_id }`, `status` is `{ type: "active" }` or `{ type: "paused" }`, `login` names the ElevenLabs login it runs on, `{ type: "store", store_provider_id }` for one of the store's `eleven_labs` or `arky_eleven_labs` providers or `{ type: "network", network_provider_id }` for its network's (a test store names only its `arky_eleven_labs`, `409 STORE_PROVIDER.TEST_STORE_NEEDS_ARKY_ELEVENLABS`). Whoever may save flows picks it from `store.provider.findLogins({ store_id, limit?, cursor? })`, the store's own providers, and `store.provider.findNetworkLogins({ store_id })`, the network's `resend`, `twilio` and `eleven_labs` logins the store may use (none for a test store), each as `{ id, type, status }` with no secret or setup detail. `actions` lists `book`, `move`, `cancel`, `confirm_attendance` and, on a `phone_assistant` only, `record_sms_consent`, which lets the assistant record a caller's spoken yes to SMS for the number they call from. A paused assistant keeps every setting and answers nothing: a call goes straight on to `transfer_step_key`, and a chat's next customer message goes on to `hand_over_step_key`. A flow with an active assistant needs its `login` active and `ready` (`SUPPORT_FLOW.ASSISTANT_NOT_READY`); a paused one only needs an ElevenLabs login the store may use, and the assistant's sales channel must sell in its market (`SUPPORT_FLOW.ASSISTANT_MARKET_NOT_LISTED`). Any active member of the store reads its flows with `support.flow.find` and `get`; creating, changing and deleting them needs `support`.
- **Phone calls.** `support.call.find({ store_id, outcomes?, waiting_callback?, phone_number_id?, query?, limit?, cursor? })` lists calls as `{ call, customer_id, customer_name, waiting_callback }` under the store's conversations scope; `outcomes` takes the call outcomes and `missed`. `call` is the call message without its transcript, as every message read shows it, and a `spoken` confirmation's `caller_text` is blank there too. `support.call.get({ store_id, conversation_id, message_id })` reads the call with its transcript, and `getRecordingLink` answers `{ url, expires_at }` for five minutes while the recording is `stored` (`CONVERSATION.NO_RECORDING` otherwise). A recording whose copy never reached Arky ends `not_received` with its `at` once its keep period ends, and one Twilio refused to delete is `delete_failed` with its `recording_sid` and `error`. Both need a `calls` grant that covers the call's line and customer, which `admin` doesn't include. Each read the grant allows or refuses writes an audit row (`call_read` or `call_recording_read`). `counts.getReport` reads `calls_by_outcome_day` (one outcome per segment), `missed_calls_day` and `call_seconds_day`. A call's `state` names its `handler` once connected, its `assistant_session` says whether an assistant took it, each transcript line's `at` is milliseconds from the call's start, and a flow's `failure` is `{ type: "none" }` or `{ type: "failed", step_key, reason, at }`. A wiped call stays as a `wiped_call` message until its `delete_at`. Twilio and ElevenLabs posts about calls are read and settled per login: `support.twilioPost` and `support.elevenLabsPost`, each with `find({ store_id, store_provider_id | network_provider_id, status, limit?, cursor? })` and `resolve({ store_id, id, expected_updated_at, resolution, reason? })`, where `resolution` is `apply` or `ignore`.
- **SMS and phone lines.** A store sends SMS through one Twilio login: its own (`store.provider.connectTwilio({ store_id, id, account_sid, auth_token, sms_sender })`) or its network's active one (`connectNetworkTwilio({ store_id, id, sms_sender })`, refused with `409 STORE_PROVIDER.NETWORK_TWILIO_MISSING` when the network has none), where `sms_sender` is `{ type: "name", name }` or `{ type: "number", number }` on the store's own login, and `{ type: "name", name }` or `{ type: "line", phone_number_id }` (one of the store's phone lines) on the network's. `setSmsSender({ store_id, id, expected_updated_at, sms_sender })` takes any of the three. A test store connects only Arky's Twilio twin, keylessly (`connectArkyTwilio({ store_id, id, sms_sender })`), and its lines sit on it; `connectTwilio` and `connectNetworkTwilio` on a test store answer `409 STORE_PROVIDER.TEST_STORE_NEEDS_ARKY_TWILIO`, and `connectArkyTwilio` on a live store `409 STORE_PROVIDER.ARKY_PROVIDER_NEEDS_TEST_STORE`.
- **The assistant's ElevenLabs login.** A live store may connect its own ElevenLabs account (`store.provider.connectElevenLabs({ store_id, id, api_key, region })`, `region` one of `global`, `us`, `eu`, `in` and `sg`), and a test store Arky's ElevenLabs twin keylessly (`connectArkyElevenLabs({ store_id, id })`), which has no region. Arky then sets up the agent and its tools there: the provider's `setup` goes from `waiting` to `ready` (with `agent_id`, `tools` and `at`) or `failed`, and `setUpElevenLabsAgain({ store_id, id, expected_updated_at })` repeats it from `ready` or `failed`. A test store's phone assistant may also run on a real ElevenLabs login, the store's own `connectElevenLabs` account or its network's login, which `findNetworkLogins` lists for it; its chat assistant runs only on the twin (`409 STORE_PROVIDER.TEST_STORE_NEEDS_ARKY_ELEVENLABS`), and a live store can't connect the twin (`409 STORE_PROVIDER.ARKY_PROVIDER_NEEDS_TEST_STORE`). `setSmsSender` and `replaceTwilioAuthToken` change them; only the store owner makes these changes. `store.phoneNumber.create({ store_id, id, login, number })` adds a phone line in E.164 form; its `setup` goes from `waiting` to `ready` or `failed`, and `setUpAgain` retries it. Any active member of the store reads its lines with `store.phoneNumber.find` and `get`. `store.phoneNumber.delete({ store_id, id, expected_updated_at })` answers `{ deleted: true }`. While a flow's phone entry or a role's `calls` grant names the line, it is refused with `409 REFERENCE.STILL_REFERENCED`, whose validation errors are `holder_type` (`support_flow` or `store_role`) and `holder_id`.
- **Broadcast selection.** Email broadcasts use `type: { type: "email", email: { email_template_id, email_address_id, from_name, reply_to_address_id }, audience }` for create and update. Reads keep that same `email` selection beside the audience and status. Scheduling freezes reviewed content in the status.
- **Sent history.** `notification.outgoingMessage.find` lists emails and SMS, one flat `type` per kind of send (`event_email`, `event_sms`, `booking_reminder_sms`, `broadcast_sms` and so on). `to` takes an email address or an E.164 number, and `order_id` goes only with `type: "receipt_resend_email"`: it finds that Order's receipt resends. An SMS's `status` is `sms_waiting`, `sms_sending`, `sms_accepted` (with its `delivery`), `sms_not_sent` (with its `reason`) or `sms_unknown`.
- **Notifications.** Each automatic message is one `notification.notification` record: `create({ store_id, id, type, status })` with a flat `type` such as `{ type: "order_received", email }`, `{ type: "booking_confirmed_sms", sms_template_id }` or `{ type: "booking_reminder_sms", sms_template_id, before, services }`, and `status: "active" | "paused"`. Lengths of time are milliseconds (`before`, `after` on the after-visit messages, `at` on the daily overview) or whole days (`after` on the offer reminder, `after_visit` on recalls); `services` is `{ type: "all" }` or `{ type: "ids", booking_service_ids }`. The sign-in and changed-login messages are `customer_sign_in_email`, `customer_sign_in_sms`, `login_changed_email` and `login_changed_sms`. A message with no record, or a paused one, sends nothing. Email kinds hold an `email` selection `{ email_template_id, email_address_id, from_name, reply_to_address_id }`. Alerts to the store team also hold `recipients`, store roles or addresses each with a `language`. Besides the order, return, conversation, booking, entry and daily overview alerts, the invoice and fiscal alerts are `{ type, email, recipients }`: `invoice_counter_held_alert`, `outside_invoice_waiting_alert`, `invoice_issue_blocked_alert`, `fiscal_receipt_refused_alert`, `fiscal_receipt_unknown_alert`, `fiscal_receipt_deadline_alert`, `fiscal_refund_needs_allocation_alert`, `fiscal_advance_open_alert`, `fiscal_credit_after_receipt_alert`, `fiscal_refund_returned_alert`, `fiscal_dispute_lost_alert`, `fiscal_device_not_ready_alert` and `fiscal_certificate_expiring_alert`. An alert's email template has the purpose of the same name. Reminders and recalls may have several records; every other type has one per store. `find({ store_id, type? })`, `get`, `update` (it sends the whole `type` and `status`, and a different type name is refused with `NOTIFICATION.TYPE_CHANGED`) and `delete({ store_id, id, expected_updated_at })` complete it.
- **Templates.** `notification.template` holds email and SMS texts in one record: `type` is `{ type: "email", purpose, default_language, content, layout_id }` or `{ type: "sms", purpose, content }`, where an SMS's `content` maps each language to its text. `find({ store_id, type?, purpose? })` filters by `type` (`"email"` or `"sms"`), or by type and purpose, or reads up to 100 templates by `ids` alone, and answers summary rows (`TemplateSummary`: the record with `languages` in place of `content`); `get` reads one template's content. `notification.layout.find` answers `EmailLayoutSummary` rows (`languages` in place of `content`) and `broadcast.find` answers `BroadcastSummary` rows, whose status has no copied `content`, and reads up to 100 broadcasts by `ids` alone; `get` reads the whole record. `findDefaults({ store_id })` answers the starter templates as a plain array; `preview` answers `{ type: "email", subject, html, text }` or `{ type: "sms", text }`; `test` sends an email template only.
- **Suppressions.** `customers.suppression` lists one row per destination and kind: `email_unsubscribe`, `email_block`, `email_hard_bounce`, `email_complaint`, `sms_block` and `sms_opt_out`. Staff record them with `blockEmail`, `recordUnsubscribe` and `blockSms`, and release them with `unblockEmail`, `recordResubscribe` and `releaseSms`, each with a `note`.
- **Member terms.** `eshop.packageMember.reviewTerms` and `changeTerms` send the whole accepted `terms`, its `purchase_order_number` included (`null` for a person's membership). A revision answers its terms' rental items without `tax_category_id` (`PackageMemberPackage`, the buyer's `PackageMemberSelfPackage`), and a change sends its terms in the same shape (`PackageMemberAcceptedTerms`); the cart's package lines keep `tax_category_id` (`PackageSnapshot`). The store team never makes a renewing membership's next renewal charge more (`PACKAGE_MEMBER.HIGHER_PRICE`, see [Changing a package](#changing-a-package)).
- **Form stages.** A form's `stages` are optional. Each stage is `{ id, key, changed_email }`; `changed_email` is `{ type: "off" }` or `{ type: "send", email }`, the email a submission's customer gets when it moves to that stage. A submission's `stage` is `{ type: "none" }` or `{ type: "at", stage_id, changed_at }`, the storefront copy's `stage_id` is `null` at no stage, and `forms.findSubmissions` filters with `stage`: a stage id, or `"none"`. `forms.changeSubmissionStage` names the stage it read as `expected_stage`.
- **Form emails.** A form's `emails` are `received`, the submission's customer's email, `{ type: "off" }` or `{ type: "send", email }`, and `submission_alert`, the store team's alert, `{ type: "off" }` or `{ type: "on", email, recipients }`. An alert that is on names 1 or more recipients, store roles or addresses each with a `language` (`FORM.ALERT_RECIPIENT_COUNT`). A form has no separate `stage_changed` map or `alert_recipients` list.
- **Stage-change notes.** A stage change that names a note writes it with the target `{ type: "form_submission_stage_change", form_submission_id, changed_at }`, the change it explains, and the submission's `stage_history` names no note. The note lists with the submission's notes and its author can edit it, but deleting it is refused with `NOTE.STAGE_CHANGE_REASON`.
- **Collection cleanup.** `content.collection.getCleanup({ store_id, id })` shows a deleting collection's cleanup: `running`, or the entry or collection where it stopped with what blocks it.
- **Bookings.** A booking service has its `length` and `slot_interval` in milliseconds, a `booking_window` (`opens`: `{ type: "any_time" }` or `{ type: "before_start", period }`, and `closes_before_start`) and `customer_changes` (`{ type: "not_allowed" }` or `{ type: "until_before_start", period }`), every period in milliseconds. A booking resource has no type; its `hours` hold windows `{ store_location_id, from, to }`, so one resource works at several branches, and its `daily_limits` cap bookings of a service a day (`{ booking_service_id, bookings }`). A booking offering joins a service to the resources it may use (`resources`: `{ type: "category", category_id }` or `{ type: "ids", booking_resource_ids }`), its `times` (`{ from, to }` times of day), its branches (`locations`: `all`, `ids` or `elsewhere` with one `store_location_id`), its `hours` (`all`, or `only` with its own hours) and its `add_ons` (`{ id, booking_service_id, resources, from }`, an extra service booked from `from` into the visit). `bookingService.getAvailability` reads one branch (`store_location_id`). `eshop.order.findBookingItems` rows carry the Order's `order_blocks`, `source`, `sales_channel_id`, `booking_line_count` and `live_invoice` (or `null`), and the list takes `store_location_id` (the line's own branch) and `not_invoiced: true` (attended lines whose Order has no live invoice). `eshop.order.findBookingReminders({ store_id, order_id, order_booking_item_id })` answers, for each active reminder notification covering the line's service, `{ notification_id, result, sent_at }`, where `result` is `null` until a reminder was made for the line's current start. Staff change a sold line with `eshop.order.updateBookingItem({ store_id, order_id, order_booking_item_id, expected_updated_at, update, notify_customer })`, where `update` is `start`, `length`, `branch`, `offering`, `resource`, `add_on` (an add-on's start and resource) or `add_add_on`, and take one add-on off with `takeOffBookingAddOn({ store_id, order_id, order_booking_item_id, add_on_id, credit_id, expected_updated_at })`, which credits it under the app's `credit_id`. A visit's steps go through `stepBookingItem({ store_id, order_id, order_booking_item_id, expected_updated_at, step })`, where `attended` and `no_show` also name the desk's `fiscal_device_id` or `null`. Every booking line call names the line as `order_booking_item_id`. `counts.getReport` reads one branch's bookings with `booking_lines_by_location_status_day`, `bookings_by_location_sales_channel_day` and `booked_minutes_by_location_resource_day`, which take `store_location_id`, and one booking resource's lines by outcome with `booking_lines_by_resource_status_day`, which takes `booking_resource_id`; every total, breakdown and series answers its `booking_resource_id` (or `null`). The report also reads `booking_lines_by_resource_day`, `invoices_issued_by_location_day`, `payments_by_method_day`, `payments_by_cashier_day`, `receivables_by_market_due_day` and `sales_by_package_day` by segment, `booking_lines_by_start_hour_day` by the hour a capacity-holding line starts on its branch's clock (`segment` `"0"` to `"23"`, day counts only; a weekday-by-hour view reads one series per hour, at most `limits.counts.report_series` series a report), and `invoiced_value_by_location_day`, `invoiced_value_by_service_day`, `paid_value_by_resource_day`, `paid_value_by_method_day` and `paid_value_by_cashier_day` within one `market_id`.
- **Reads by ids and record pages.** These lists read up to 100 records by `ids`, alone, answering them in the order named with `cursor: null` and leaving out unknown ids and other stores' ones: `companies.find`, `companies.location.find`, `eshop.packageMember.find`, `eshop.promotion.find`, `eshop.promotionCode.find` and `eshop.bookingOffering.find` (which also takes a `limit` with `ids`). `eshop.package.findByIds({ store_id, ids })` answers whole packages, as `get` does, and `eshop.packageMember.findCurrent({ store_id, ids })` each member's current terms, as `getCurrent` does. `companies.membership.find({ store_id, company_id, email })` answers the open invite for that email, and `{ store_id, company_id, customer_id }` the customer's active or disabled membership, zero or one, from Arky's own records; neither takes `role_id`, `limit` or `cursor`. `companies.find({ store_id, tax_registration_country, tax_registration_identifier, limit?, cursor? })`, both together and no other filter (`limit` 1 to 200), pages every company holding exactly that registration, whatever its status; the identifier matches byte for byte as it was typed. Staff member rows carry `first_order_id`, `eshop.packageMember.find` takes `renewal_type` (`never` or `every`), `findOrders({ id, sort_direction: "asc", limit: 1 })` answers a member's first Order, and the staff `eshop.order.find` lists the Orders of up to 100 members with `package_member_ids`. Booking definitions have pages read from Arky's own records, each `{ store_id, limit?, cursor? }` (`limit` 1 to 100, default 100): `bookingOffering.findAll` (the store's offerings, for code that loads them to act on them), `bookingOffering.findByService({ booking_service_id })`, `bookingOffering.findByResource({ booking_resource_id })`, `bookingService.findAll`, `bookingService.findByBlockTarget({ block_target_id })` (the services whose blocks name that form, media, entry or product), `bookingResource.findAll` and `bookingResource.findByCategory({ category_id })` (that category, not its children). A page leaves out what the caller may not read, so it can come back short. `category.getByKey({ store_id, key })`, `content.privateCollection.getByKey({ store_id, key })` and `content.entry.getByKey({ store_id, collection_id, key })` read one record by its key, and `content.collection.findEntries({ store_id, id, limit?, cursor? })` pages a Public collection's entries of any status from Arky's own records (`limit` 1 to 100, default 20). `content.privateEntry.find` takes `status`, and `forms.find` takes `type` (`public` or `private`, not with `ids`).
- **Packages and their automatic items.** `eshop.package.create` and `update` save a package and its automatic items together: `items` is a list of operations, `{ action: "create", id, type }`, `{ action: "update", id, expected_updated_at, type }` and `{ action: "delete", id, expected_updated_at }`, where `type` is a `get_product` or `rent_product` type. A `get_product` delivery is `none`, `once_per_period` (`offset` and `window` in days) or `repeating_in_period`. A renewing package's `timing` holds `retry_offsets` and `recovery_window` in milliseconds and `reminder`, `{ type: "none" }` or `{ type: "before", period }` in days. A stay ends with `renew`, `renew_once`, `continue_without_stay` or `stop`. A `variants` minimum lists `variant_ids`, and each unit counts by its variant's `measure`, which a physical variant holds in its `fulfillment` (`{ type: "physical", shipping_profile_id, inventory_requirements, backorder, measure }`); a digital variant has none. A `schedule` that names only an end, `{ type: "scheduled", starts_at: null, ends_at }`, starts at the save's own time. `find` lists packages with `automatic_item_count` and `market_ids`, and `get` and `getByKey` answer `items` too. `eshop.package.copy({ store_id, id, source_package_id, source_market_id, target_market_id, cursor })` copies one market's priced items.
- **Priced items.** `eshop.packageItem` creates one per parent and market (`{ store_id, id, package_id, market_id, item }`), and `update` changes only its `position`. `item` is `{ type: "product", product_id }`, `{ type: "booking_service", booking_service_id }` or `{ type: "package", package_id, price: { id, amount, compare_at, changes, schedule, status } }`: a plan is listed together with its one price, `0` when the plan is free. An item's prices sit in their wrappers: a `product` item's `prices` are `{ variant_id, price }`, a `booking_service` item's `{ booking_offering_id, price }`, and a `package` item holds one `price`, which can be archived or removed with the item but never deleted alone (`PACKAGE_ITEM_PRICE.REQUIRED`). An item has no status or schedule of its own: `setAllPrices({ store_id, id, expected_updated_at, status, schedule })` archives or schedules all its prices at once, applying started dated changes first, and it forgets which were already archived.
- **Item prices.** Prices live inside their item and change only by named operations on `eshop.packageItemPrice`: `create`, `update` with that price's own `updated_at`, `delete` and `batch`. A price answer carries `package_item_updated_at`, the item's new version, so a later reorder gives no false stale error. `getByChoice({ store_id, package_item_id, sellable })` reads one item's price for one choice exactly, archived or not, and answers 404 when that choice has no price. `find` names a `package_item_id` or a `sellable` and answers `{ items, cursor }` straight from Arky's own records. A price answer names its choice as `sellable`, taken from its wrapper. `create`, `update` and `packageItem.setAllPrices` take a `schedule` that may name only an end, `{ type: "scheduled", starts_at: null, ends_at }`, which starts at the save's own time; `batch`, and a plan's price inside `packageItem.create` and `packageItem.batch`, need a `starts_at`.
- **Access rows.** `eshop.packageAccess` creates and deletes rows, never edits them, so a row has no `updated_at`: `delete({ store_id, id })` names only the row, and `find` lists a package's rows by `created_at`, with `sort_direction`.
- **Offerings.** `eshop.packageOffering` saves `{ key, blocks, package_ids }`. An offering has no status: each of its packages sells, takes joins and moves under its own status and schedule.
- **Promotion schedules.** `promotion.create` and `update` take a `schedule` that may name only an end, `{ type: "scheduled", starts_at: null, ends_at }`, which starts at the save's own time; a promotion read answers the saved start. A condition's list is named for what it holds: `{ type: "customer", customer_ids }`, `package` with `package_ids`, `package_offering` with `package_offering_ids`, `company` with `company_ids`, `company_location` with `company_location_ids`, `market` with `market_ids` and `sales_channel` with `sales_channel_ids`.
- **Promotion limits.** Promotions and their codes use `limit: { type: "unlimited" }` or `limit: { type: "limited", max_uses: number }`. Whether a promotion or code has a cap is fixed when it is created; a later edit may change a limited cap's number. A promotion's `customer_limit` caps its uses per buyer email in the same shape, and an edit may change it either way: a signed-in customer counts by their verified email, a guest by the checkout's contact email. Reads return `uses`, with uncapped uses appearing after the count queue applies them. Taking or returning a use leaves the promotion and code's `updated_at` unchanged. `PromotionWebhookPayload` and `PromotionCodeWebhookPayload` carry settings, including `limit` and the promotion's `customer_limit`, without `uses`.

A promotion taken through a code, capped at 1,000 uses in all and one per buyer email:

```typescript
const store_id = "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63";
const promotion = await admin.eshop.promotion.create({
  store_id,
  id: crypto.randomUUID(),
  key: "welcome-ten",
  blocks: [],
  activation: { type: "codes" },
  conditions: [],
  effects: [{ type: "order_percentage", id: crypto.randomUUID(), basis_points: 1000 }],
  stacking: { type: "continue" },
  priority: 0,
  limit: { type: "limited", max_uses: 1000 },
  customer_limit: { type: "limited", max_uses: 1 },
  schedule: { type: "always" },
  status: { type: "active" },
});
await admin.eshop.promotionCode.create({
  store_id,
  id: crypto.randomUUID(),
  promotion_id: promotion.id,
  code: "WELCOME10",
  limit: { type: "unlimited" },
  status: { type: "active" },
});
```

Inventory movement reads report a warehouse unit write-off as `reason: { type: "written_off", actor, reason }`, and a fulfillment's dispatch as `reason: { type: "dispatched" }`, whose fulfillment is the movement's `action_id`. `eshop.inventoryUnit.writeOff` owns that action; manual stock adjustments keep their existing reason types. A written-off unit's `status` names where it was lost, with its ids flat: `{ type: "written_off_at_warehouse", store_location_id }`, `{ type: "written_off_on_rental", rental_id, fulfillment_id }` or `{ type: "written_off_at_return", return_id, store_location_id }`, each with `actor`, `reason` and `written_off_at`. `eshop.inventoryUnit.find` filters all three with `status: "written_off"`. `eshop.inventoryItem.find` and `eshop.inventoryUnit.find` read up to 100 records by `ids` (alone, in the order named, `cursor: null`), and `eshop.inventoryLevel.find` and `findStock` take up to 32 stock items as `inventory_item_ids`.

A fulfillment job line has no `quantity` of its own. A product line's count is the units of its `source.order_unit_spans`, and a rental line's source is `{ type: "rental_issue", rental_id, package_member_revision_id, quantity }`. The `fulfillment_job.*` webhooks carry the same lines, and the fulfillment unit helpers count the same way. `eshop.fulfillmentJob.findItems` still answers each item's `quantity`. `eshop.fulfillment.find` and `eshop.fulfillmentJob.find` take several Orders as `order_ids`; a job answers its Order's `order_number` (`null` for a rental replacement), and `eshop.return.find` rows carry `order_number` too (`null` for a rental return).

What a delete answers is what Arky answers:
- the record marked `deleting`, for records that clean up after themselves: markets, store locations, packages, products, booking services, offerings and resources, categories, collections, media and companies. Promotions and promotion codes answer it too, and one that is already gone answers `404`. Variants answer it, or nothing when the variant is already gone;
- `{ deleted: true }`, for inventory items, inventory levels, package item prices, package items, package accesses and package offerings, and `404` for one that is missing or another store's. Inventory items have only `active` and `archived` statuses; their delete removes the item and its empty levels together;
- nothing, for experiments;
- `true` or `false`, for email templates, layouts, providers and addresses;
- the note, for notes;
- `{ deleted }`, for every other delete.

## Private content

Collections have an immutable `type`: `public`, `private`, `shared` or `notes`. Platform and store Admins manage Private and Shared collection definitions through `content.privateCollection.create`, `find`, `get`, `update` and `delete`. Their entries use `content.privateEntry`; ordinary `content.collection` and `content.entry` routes serve Public content.

```typescript
const store_id = "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19";
const customer_id = "07b6e8c1-4f39-4a25-89d3-2e6c1b7f0a54";
const collection = await admin.content.privateCollection.create({
  store_id,
  id: crypto.randomUUID(),
  key: "customer-history",
  type: "private",
  schema: [],
  blocks: [],
});

const entry = await admin.content.privateEntry.create({
  store_id,
  collection_id: collection.id,
  id: crypto.randomUUID(),
  type: { type: "private_customer", customer_id },
  blocks: [],
});

const history = await admin.content.privateEntry.find({
  store_id,
  collection_id: collection.id,
  owner: { type: "customer", customer_id },
  limit: 20,
});
console.log(entry.id, history.items, history.cursor);
```

- **Entry types.** A Public entry has `{ type: "public", key, slugs }`. Private entries are `private_store`, `private_customer`, `private_company`, `private_order`, `private_conversation` or `private_form_submission`, each naming only its relevant owner id. A Shared entry has `{ type: "shared", customer_id }`. Note entries have the corresponding `note_*` type, including `note_form_submission_stage_change` with `changed_at`. Entries have no top-level `key`, `slugs` or `actor`.
- **Changing entries.** Private entry `get`, `update` and `delete` name `store_id`, `collection_id` and `id`; writes also name `expected_updated_at`. The type and owner are fixed at creation. Private and Shared entries allow `active`, `draft` and `archived`; scheduled publication belongs to Public entries. Lists take an optional `owner`, `limit` and `cursor`, with no text search or block filters.
- **Printing.** `content.privateEntry.print({ store_id, collection_id, id })` answers the entry, like `get`, and writes one `{ action: "entry_printed", collection_id, entry_id, owner }` audit row instead of `entry_read`. It needs read access to the entry; a refused print writes a `refused` row.
- **Permissions.** `{ type: "public_collections", access: "read" | "write" }` covers Public collections. `{ type: "private_collections", collections, access }` covers whole Private and Shared collections, and `{ type: "customer_entries", collections, customers, access }` only the entries of the customers its scope names; `collections` is `{ type: "all" }` or `{ type: "ids", collection_ids }`, and `customers` is `all`, `own`, `customer`, `package` or `company`. Write includes Read. A `private_collections` or `customer_entries` grant works only for a member with two-factor on, through a session; otherwise the request answers `403 ACCOUNT.SECOND_FACTOR_REQUIRED`. `store.member.getOwn` and `findOwn` say which grants are held back and why: `access.withheld` lists `{ type: "second_factor_off", permission }` while the Account's two-factor is off and `{ type: "account_token", permission }` for an account token, which never opens them. Empty `permissions` with empty `withheld` means the roles grant nothing here. `admin`, the store owner and platform accounts reach no Private or Shared entry, and no Private file, without such a grant.
- **Files.** Private and Shared entries use Private media. `content.privateEntry.fileLink({ store_id, collection_id, id, media_id, variant })` reads a file named by that entry and answers `{ url, expires_at }`. The link lasts five minutes and needs the same permission as the entry. Media metadata has `visibility` and null URLs for Private files; media search lists Public files only, and a Private file is never read by id.
- **Audit log.** `store.auditLog.find({ store_id, limit?, cursor? })` reads the store's audit log, newest first; add `account_id` for one person's actions, or `subject_type` with `subject_id` for one record's history (such as `{ subject_type: "entry", subject_id }`). Each row has its `actor`, an `action` such as `{ action: "entry_read", collection_id, entry_id, owner }`, a `result` of `allowed` or `refused`, `ip`, the client address of the staff member's or customer's request that wrote it (`null` for the assistant's rows and rows written outside a request), and `at`. Only `admin` reads it. Rows about a customer's conversation, messages, calls and form submissions carry `customer_id`, and entry rows carry `owner` (`{ type: "store" }`, `{ type: "company", company_id }` or `{ type: "customer", customer_id }`), so `{ subject_type: "customer", subject_id }` answers everything done with one patient's records, such as who opened their chart. Staff reads of a thread's messages write `conversation_message_list_read`, attachment links `conversation_message_file_read` and form file links `form_submission_file_read`, each naming the file by its `sha256`; the patient export writes `customer_exported`.
- **Patient export.** `customers.export({ store_id, id })` answers one customer's data in one JSON answer: `customer` with its contacts and links, `booking_lines`, `entries` (each with five-minute `files` links), `form_submissions` (with file links), `conversations` (messages, attachment links and call recordings), `cut` and `exported_at`. It needs a `customers` grant covering the customer; each part follows its own grant, and `cut` names each part the caller's grants or the configured size cut (`{ part, reason: "grant" | "size" }`), so a partial export never passes for a whole one. Each export writes one `customer_exported` row.
- **Notes.** Existing customer, company, order, conversation and form-submission note calls keep their request and response shapes. The store's fixed Notes collection holds them internally. Their author comes from the Create access row; editing or deleting a note writes no additional access row.

## Networks and store plans

A live store has `type: { type: "live", account_id, network_id }`. Its network owns its plans and its provider logins. Any account of a network can open a live store in it and own it (`owner: { type: "caller" }`). Platform accounts manage networks, their logins and their plans through `network`; an operator opening a store names its owner with `owner: { type: "email", email, language }`, a member email of an active account of that network (`409 STORE.OWNER_EMAIL_REQUIRED` without it, `404 ACCOUNT.NOT_FOUND` for an email no such account holds), and that account accepts the owner invite before its owner powers start; until then its membership's status is `{ type: "owner_invited", contact }`, which only the named owner may accept. Such a create names no `agreement` (`400 GENERAL.VALIDATION_FAILED` on `agreement`): the named owner sends it with the accept, `store.member.acceptInvite({ store_id, expected_updated_at, agreement: { id, document } })`, which writes the store's agreement with the owner as `accepted_by` (`409 GENERAL.CONFLICT` when the store already holds one). Until it accepts, the network's team or a platform Admin may name another owner with `network.store.nameOwner({ network_id, store_id, email, language, expected_updated_at })`, which answers the store; once the owner accepted, no other owner can be named (`409 STORE_MEMBERSHIP.NOT_INVITED`), and while the store's plan holds a card, naming another Account answers `409 STORE_MEMBERSHIP.PLAN_CARD_HELD`. A store's `default_location_id` names its main location; every store has one, and only the owner names another with `store.nameDefaultLocation({ id, store_location_id, expected_updated_at })`, and the network's store list reads the store's `city` through it. The network's store read answers `counts` as `{ members, customers }`. An Account's `type` is `{ type: "network", network_id, … }` or `{ type: "platform", … }`, fixed when it is made. `platform.account.find()` lists the platform accounts, `add({ id, email })` makes one with the platform `admin` role, and `delete({ account_id })` deletes one, each as a `ListedAccount`; the last platform Admin can't be deleted (`ACCOUNT.LAST_PLATFORM_ACCOUNT`).

`network.create({ id, name, type })` makes a network, where `type` is `{ type: "isolated" }` (each store signs its own customers in) or `{ type: "connected" }` (customers sign in once through the network). A network's `type` never changes: a create replay or `update` naming another one answers `409 NETWORK.TYPE_FIXED`. A `Network` holds `id`, `name`, `type` and its timestamps. Its logins are `NetworkProvider`s, which `network.provider.find({ network_id })` lists. A login's `type` is one of:

- `resend`: the network's sign-in sender, with `from_name`, `from_address`, `sign_in_subject`, `sign_in_body`, `member_login_changed_subject` and `member_login_changed_body` (the notice a member login gets when the account's logins change, rendering `{{address}}`), `store_addresses` and `customer_texts`. `store_addresses` is `{ type: "off" }` or `{ type: "domain", domain }`: whether stores may make email addresses on the network's domain with `login: { type: "network" }`. A store reads it with `notification.emailAddress.getNetworkDomain({ store_id })`.
- `stripe`: store billing, with `account_id`, `publishable_key` and `secret_key`, which names the key's kind, `standard` or `restricted`.
- `twilio` with `account_sid` and `customer_texts`: the line and SMS login that stores use through `store.provider.connectNetworkTwilio`, which takes the network's active one.
- **Customer texts** are what the network sends its customers in a `Connected` network: the sign-in code, a store's invite and the notice that their logins changed. A Resend login's `customer_texts` is `{ type: "off" }` or `{ type: "on", texts }`, one text per language with `code_subject`, `code_body`, `invite_subject`, `invite_body`, `login_changed_subject` and `login_changed_body`; a Twilio login's is `{ type: "off" }` or `{ type: "on", sender_name, texts }`, with `code_body`, `invite_body` and `login_changed_body`. Code and invite texts print `{{code}}` and may print `{{code_minutes}}`; login-change texts render `{{address}}`. `network.provider.replaceEmailCustomerTexts({ network_id, id, expected_updated_at, customer_texts })` and `replaceSmsCustomerTexts` change them and answer the `NetworkProvider`; turning them on in an `Isolated` network answers `409 NETWORK.CUSTOMER_TEXTS_NOT_CONNECTED`.
- `eleven_labs`, with `region` (`global`, `us`, `eu`, `in` or `sg`) and `setup`: `waiting`, `ready` with `agent_id`, `tools` and `at`, or `failed` with `error` and `at`. `tools` names each of the assistant's tools by its ElevenLabs id: `find_slots`, `propose`, `confirm`, `request_callback`, `transfer` and `record_sms_consent`.

`network.provider.connectResend` (with the member login-change texts and `customer_texts`), `connectStripe`, `connectTwilio({ network_id, id, account_sid, auth_token, customer_texts })` and `connectElevenLabs` connect a login with an app-picked `id`. Connecting an active login disables the network's earlier active login of the same type. `updateResend` changes the sender fields and `store_addresses`; customer texts change only through their own calls. It, `replaceResendKey`, `replaceStripeKeys`, `replaceTwilioAuthToken`, `setUpElevenLabsAgain`, `setStatus` and `delete` each name the login's `expected_updated_at`.

`network.plan.find({ network_id })` lists the plans the caller may see. A plan's `access` is `{ type: "public", price }`, a plan any store owner may pick, or `{ type: "network_only", price }`, a plan only a platform Admin or the network's team sees and grants (a store's own pick of one is refused with `409 NETWORK_PLAN.NETWORK_ONLY`). A price is `free`, `lifetime` with `amount` and `currency`, `monthly` with those fields plus `months` and `trial`, or `yearly` with `years` and `trial`; a `network_only` price may also be `outside`, which Arky never charges because the network bills the store itself. A renewing price requires `trial: { type: "none" }` or `{ type: "days", period }`, a number of days. Every amount is for the whole store. Features use `{ type: "unlimited" }` or `{ type: "max", count }`, including `test_stores`. Move stores off a plan before deleting it.

```typescript
const network_id = "0f6a3c84-2d19-4e75-b8a1-5c9e7d3b2f60";
const plan_id = "93ac1e72-8b40-42d5-a617-c49f02b8653e";
const store = await admin.store.create({
  id: crypto.randomUUID(),
  type: { type: "live", network_id, plan: { type: "free", plan_id }, owner: { type: "caller" } },
  name: "My shop",
  timezone: "Europe/Sarajevo",
  languages: ["en"],
  market: { key: "eu", currency: "eur", tax_mode: "inclusive" },
  sales_channel: { key: "web" },
  location_address: { country: "BA" },
});
```

For a paid plan, call `store.subscription.createCardSetup({ network_id, id, store_id })` with a stable app-picked id and the store the card is for: for a new store, the id its create will name, so pick the store's id first; for an existing store, a live open store of that network that the caller owns. Mount its answer with `mountPaymentMethodSetup`, confirm it, then create the store with `plan: { type: "card", plan_id, network_provider_id, setup_intent_id }`, naming the Stripe login the card setup answered. A platform account may instead choose `{ type: "grant", plan_id }`.

`store.subscription.get({ store_id })` returns a flat `plan` state: `granted`, `trialing`, `active`, `paid_lifetime`, `past_due`, `trial_cancellation_scheduled`, `paid_cancellation_scheduled`, `unpaid` or `cancelled`. Every state names its `plan_id`; every state but Granted and Cancelled holds the plan's `card`, `{ type: "stripe", network_provider_id, stripe_customer_id, stripe_payment_method_id, brand, last4, exp_month, exp_year }`, the store's own Stripe customer and the card that pays. Trialing and TrialCancellationScheduled carry `trial_ends_at`; Active and PaidCancellationScheduled carry `paid_until` and the period's calendar `anchor`, and PastDue carries `paid_until`. Unpaid and Cancelled have no plan access. Test stores use their live store's plan and have no subscription of their own. The network's team (`Plans` read) and platform Admins read up to 100 of the network's stores' subscriptions at once with `network.store.findSubscriptions({ network_id, ids })`, a plain array in the order named; a store outside the network answers `404`.

- `changePlan({ store_id, plan_id, expected_updated_at, card? })` changes the plan, where `card` is `{ network_provider_id, setup_intent_id }`. There is no credit and no proration: the owner's switch from one paid plan to another charges the new plan's full price, and the store keeps its plan and access until that charge is paid, when the new period starts. Asking for the plan the store holds resumes a scheduled cancellation and drops a switch still being charged. A change by the network's team or a platform Admin is a move: the store holds the new plan at once with its card and period, and nothing is charged; such a move names no `card` (`400 GENERAL.BAD_REQUEST` with one). `endGrant` takes the same fields.
- `setCard({ store_id, network_provider_id, setup_intent_id, expected_updated_at })` saves a newly confirmed card setup.
- `pendingPayment({ store_id })` returns `{ type: "none" }`, `{ type: "stripe", payment_intent_id, publishable_key, client_secret, payment_method_id, runs_on }` for a charge whose card the owner must confirm with the bank, or `{ type: "report", payment_intent_id }` once the payment no longer waits for the owner (or the owner already reported it): the owner's "check payment" sends `reportPayment({ store_id, payment_intent_id })`, which marks the charge `action_reported` and answers it (`409 STORE_SUBSCRIPTION.PAYMENT_NOT_WAITING` when no charge waits for that payment).
- `findCharges({ store_id, limit?, cursor? })` lists the plan's charges newest first. A `StorePlanCharge` holds its `purpose` (`renewal`, `new_period`, `lifetime`, `switch` or `switch_lifetime`, each with its `plan_id`), `money`, `type` (`{ type: "stripe", network_provider_id, stripe_customer_id, stripe_payment_method_id, status }`) and `waits_for_owner`, true while the owner must act.
- `cancel({ store_id, expected_updated_at })` schedules the end of paid access. `grant({ store_id, plan_id, expected_updated_at })` is a platform-admin action; `endGrant({ store_id, plan_id, expected_updated_at, card? })` names the replacement plan and a card setup when needed.
- Network provider posts go to `/v1/networks/{network_id}/providers/{network_provider_id}/webhooks/stripe` and `/v1/networks/{network_id}/providers/{network_provider_id}/webhooks/resend`. `platform.stripeBillingEvent` and `platform.resendEvent` require `network_id` and `network_provider_id` for both `find` and `resolve`. Their types are `stripe_billing_payment_succeeded` (with `store_plan_charge_id`, `stripe_payment_intent_id`, `amount_received` and `currency`), `stripe_billing_payment_cancelled` (with `store_plan_charge_id` and `stripe_payment_intent_id`) and `network_resend`, and the network's sign-in email is `network_sign_in_email`; each carries its `network_id` and `network_provider_id`. A Resend post's `event`, on `network_resend` and on a store's `store_resend` (`notification.resendEvent`), names a received email's sender as `from`, the address as Arky normalizes it, or `null` when the post's sender isn't a usable address; a report on an email Arky sent (`email.sent`, `email.delivered`, `email.bounced` and the rest) always has `from: null`. A billing post applied to a plan charge names it as `{ type: "store_plan_charge", store_plan_charge_id }`. A platform Admin lists the charges waiting for a person at one login with `platform.storePlanCharge.find({ network_id, network_provider_id, limit?, cursor? })` and settles one with `settle({ id, store_id, expected_updated_at, outcome })`, where `outcome` is `{ type: "paid" }`, `{ type: "not_paid" }` or `{ type: "refunded", stripe_refund_id }` (`409 STORE_PLAN_CHARGE.NOT_SETTLEABLE` otherwise). Twilio's report on a network's own customer SMS is a `network_twilio_sms` post (`{ network_id, network_provider_id, outgoing_message_id, event }`, `event` `sent`, `delivered` or `failed` with its `code`), applied through the queue; a platform Admin lists one login's posts with `platform.networkSmsPost.find({ network_id, network_provider_id, status, limit?, cursor? })` and resolves one with `resolve({ network_id, network_provider_id, id, expected_updated_at, resolution, reason? })`. A store's SMS report is a `twilio_sms` post.

## Account tokens

A script, CI job or agent works through an account token, passed as `createAdmin({ apiUrl, accountToken })`. It acts as its Account and uses that Account's current roles and owner powers. History records `credential_type: { type: "account_token", account_token_id }`. A token has a store reach, with no separate permission list. Its calls count against its own rate limit once the Server has validated it. A token client has no session and reports no `onAuthStateChanged` callbacks.

A platform or network session makes one, signed in within the recent sign-in window (15 minutes in production, else `403 ACCOUNT.RECENT_SIGN_IN_REQUIRED`):

```typescript
const live_store_id = "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19";
const made = await admin.account.token.create({
  id: crypto.randomUUID(),
  name: "CI",
  stores: { type: "ids", store_ids: [live_store_id] },
  expiry: { type: "never" },
});
if (made.type === "secret_created") console.log(made.token.token_hint, made.value.length);
```

- **Shown once.** `secret_created` carries the token and its `value`; Arky keeps only its hash, so the value can't be read again. The same create again under the same `id` answers `existing` with the token and no value, and the same `id` with anything else changed answers `409 GENERAL.CONFLICT`. `expiry` is required: `{ type: "never" }`, or `{ type: "at", expires_at }` with a time later than now. A token records the email of the session that made it as `email`.
- **Where it works.** `{ type: "all" }` covers the stores the Account can use. `{ type: "ids", store_ids }` covers only the listed live stores and their test stores (Arky refuses the old `only` tag), and can create test children when its Account has owner powers on the live store. The Account's current access still applies to every request. A target outside the token's reach answers `403 ACCOUNT_TOKEN.STORE_NOT_COVERED`. Deleting a listed store removes it from the token; an empty token is deleted.
- **Store reads and members.** `store.get` answers the store with `owner_email` when the caller reads members (Admin or Conversations), and without the field otherwise. `store.member.find` takes `role_id`, `status` (`active`, `disabled` or `invited`) and `account_id`.
- **Owner actions.** Closing, wiping and creating or listing test stores require the owner's Account or a platform account. A member's token does not gain owner powers.
- **Listing, revoking, deleting.** `account.token.find({ limit, cursor })` lists the Account's tokens newest first, each with its `token_hint` (the value's first 16 characters) and never the value. `revoke({ id, expected_updated_at })` takes effect at once and answers the revoked token; revoking it again answers `409 ACCOUNT_TOKEN.REVOKED`. `delete({ id, expected_updated_at })` removes a revoked token and answers `{ deleted: true }`; an active one answers `409 ACCOUNT_TOKEN.ACTIVE`. No call edits a token: rotate by making a new one, deploying it, then revoking the old one. An Account holds at most 50 tokens in production, revoked ones included until they are deleted (`409 ACCOUNT_TOKEN.LIMIT`).
- **Account and platform access.** Token management, Account session management, invite acceptance and Account deletion require a platform or network session. Platform routes require a platform account's session or `All` token; an `Only` token never reaches them. `account.getMe()` works for tokens, and store lists include only their reachable stores.

## Test stores

A test store belongs to a live store through `type: { type: "test", live_store_id: live_store_id }`. It inherits the live store's owner and plan access. Its payments and emails use test providers, and the live plan's `test_stores` limit bounds how many children it holds; children being deleted still count until removal finishes.

Use the live store owner's session or an `Only` account token naming that live store. `store.testStores.find({ store_id: live_store_id })` lists its children. `store.testStores.findByLiveStores({ live_store_ids, limit?, cursor? })` reads the children of up to 100 distinct live stores in one page, in the order the live stores are named; group them by `type.live_store_id`, and follow `cursor` with the same list in the same order (another list or order answers `400` on `cursor`). Each named store must be one whose children the caller may read, or the whole read is refused with that store's answer. `store.find({ query?, type?, status?, limit?, cursor?, sort_field?, sort_direction? })` filters by `type` (`live` or `test`) and `status` (`active`, `suspended`, `wiping`, `wiping_suspended` or `deleting`); a cursor belongs to the filters it was made with, and a network account's page, filtered from its own memberships, can come back short and still carry a cursor. A test store cannot choose its own plan. `store.wipe({ id, expected_updated_at, confirmation })` clears a store's business data while keeping its settings, members, connections and billing; the store refuses ordinary use while its status is `wiping`.

The store's type decides which providers it may connect:

| Store | Card payments | Email |
|---|---|---|
| `live` | `stripe` with live keys, `monri` in `live` | `resend` |
| `test` | `arky_stripe`, `arky_monri`, `stripe` with test keys, `monri` in `test` | `arky_resend` |

Making a store sets up no providers, for either type. A test store's setup script connects them with keyless calls, and nothing picks a provider for you:

```typescript
const live_store_id = "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19";
const store = await admin.store.create({
  id: crypto.randomUUID(),
  type: { type: "test", live_store_id: live_store_id },
  name: "My shop (test)",
  timezone: "Europe/Sarajevo",
  languages: ["en"],
  market: { key: "eu", currency: "eur", tax_mode: "inclusive" },
  sales_channel: { key: "web" },
  location_address: { country: "BA" },
});

const login = await admin.store.provider.connectArkyStripe({
  store_id: store.id,
  id: crypto.randomUUID(),
});

await admin.store.paymentOption.createArkyStripe({
  store_id: store.id,
  provider_id: login.id,
  id: crypto.randomUUID(),
  key: "card",
  blocks: [],
  status: "active",
  saved_card_terms: { en: "Save this card for the renewals you agree to." },
});

await admin.store.provider.connectArkyResend({
  store_id: store.id,
  id: crypto.randomUUID(),
  domains: ["shop.example.com"],
});
```

`store.provider.connectArkyMonri` and `store.paymentOption.createArkyMonri` take the same fields as their ArkyStripe calls. A storefront still reads `stripe` or `monri` as the option's `type`; `arky_stripe` and `arky_monri` show only on Admin's `PaymentOption`. To finish with a test store, call `store.requestDeletion`, as for any store. The owner's account token can close or wipe live and test stores within its reach. Each call still needs the exact name in `confirmation` and the current `expected_updated_at`.

**Paying in a browser.** On a simulated value `mountCheckoutAction` and `mountPaymentMethodSetup` load no provider script and work on a plain `http` page. They mount a small panel in the page's own words, `simulator_texts: { title, description, complete, decline, expire, cancel }`, which the mount requires (`ArkyError` `not_ready` without them), with a button per outcome, each marked `data-arky-simulator-outcome`:

- **Stripe checkout:** `complete`, `decline` and `expire`. A click plays that outcome and then runs `onComplete`, and the mount has `type: "simulator"`. A decline leaves the page open for another try.
- **Monri:** `complete` and `decline`. A click picks the outcome, and the mount's `confirm(details)` sends it, `complete` until another is picked.
- **Card setup:** `complete`, `decline` and `cancel`. A click picks the outcome, and `confirm` sends it and throws `ArkyError` `declined` for a decline.

A site that wants its own controls checks `isSimulatedPayment` and calls `simulatePayment`. It posts to the address the answer names, with no credentials, and throws a `TypeError` before sending anything for a value that runs on the real provider:

```typescript
import { isSimulatedPayment, simulatePayment } from "arky-sdk/storefront";

const { placed } = arky.eshop.checkoutFlow({ buyer: { type: "customer" }, package_id }).state.get();
if (placed && placed.payment_action.type === "stripe_embedded_checkout" && isSimulatedPayment(placed.payment_action)) {
  await simulatePayment({ simulation: { type: "stripe_checkout", action: placed.payment_action, outcome: "decline" } });
}
```

Anything but a confirmed answer throws `ArkyError` `not_confirmed`, and repeating an outcome is safe.

A pending store subscription payment with `type: "stripe"` and simulator `runs_on` uses `simulatePayment({ simulation: { type: "stripe_payment_intent", action: payment, outcome: "complete" } })`, which also sends the payment's card (`payment_method_id`). Its offered outcomes are `complete` and `decline`.

**Driving a test store through the API.** These need `Admin`, and each refuses a live store with `SIMULATOR.LIVE_STORE`:

```typescript
const store_id = "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63";
const payment_id = "f17c0b95-2e4d-4a83-9b6c-31d5e8a70f24";

await admin.store.simulator.payments.pay({ store_id, payment_id });

const emails = await admin.store.simulator.emails.find({ store_id, to: "buyer@example.com", limit: 10 });
console.log(emails.items[0]?.subject, emails.items[0]?.text);

const sms = await admin.store.simulator.sms.find({ store_id, to: "+38761000001", limit: 10 });
console.log(sms.items[0]?.body);

await admin.store.simulator.plannedOutcomes.create({
  store_id,
  id: crypto.randomUUID(),
  provider: "resend",
  operation: "send_email",
  matching: { type: "to", address: "buyer@example.com" },
  outcome: { type: "rate_limited", retry_after_seconds: 2 },
});
```

- **Payments.** `pay`, `decline` and `expire` take `{ store_id, payment_id }` and answer once Arky has received the simulated event. A Monri payment has no `expire` (`SIMULATOR.OUTCOME_NOT_OFFERED`), repeating an outcome answers the same, and another outcome on a finished payment is refused (`SIMULATOR.PAYMENT_FINISHED`).
- **Emails.** `emails.find` reads everything the store's simulated Resend account was given, newest first and sign-in codes included. A store with no `arky_resend` connection reads an empty page.
- **SMS.** `sms.find({ store_id, to?, limit?, cursor? })` reads the SMS the store's simulated Twilio account was given, as `{ id, from, to, body, status, error_code, created_at }`, newest first and sign-in codes included; `to` is one number in E.164 form. A store with no `arky_twilio` connection reads an empty page.
- **Calls.** `calls.start({ store_id, to, from })` rings one of the store's simulated phone lines, `from` a caller's number or `null` for a withheld one, and `calls.get({ store_id, call_sid })` reads it again; both answer `{ id, from, to, status, audio, created_at }`. `audio` is `{ type: "stream", url, parameters }` while the call waits at the assistant, and `{ type: "none" }` otherwise. A page can stand in for the phone: open a WebSocket to `url`, speak Twilio's media-stream messages on it with `parameters` as the start message's `customParameters`, send the microphone and play what comes back. That is how a test store whose phone assistant runs on a real ElevenLabs login is talked to; the twin's address carries no sound. `calls.setStatus` reports the call's status as Twilio would, and `calls.findConversations`, `calls.callTool` and `calls.finishConversation` play the assistant's side on the twin.
- **Planned outcomes.** `plannedOutcomes.create` makes the next matching call of one operation fail or wait, once. `matching` is `{ type: "any" }`, `{ type: "to", address }` for `send_email`, or `{ type: "payment", payment_id }`. `outcome` is `refused`, `rate_limited`, `unavailable`, `lost_response`, `delayed`, `declined`, `missing_link`, `expired_link`, or, for `send_email` only, `daily_quota_exceeded` or `monthly_quota_exceeded`, which answer Resend's `429` with that name and send nothing. `plannedOutcomes.find` lists the plans not used yet, and `plannedOutcomes.remove` answers `{ deleted }`.

Nothing moves the clock, so month ends and expiry dates can't be reached ahead of their date.

**Going live.** Run the setup script against the parent live store with live provider keys. Test data stays in its test store. The site's environment supplies the live store ID and sales-channel ID; its storefront code stays the same.

## React

`arky-sdk/react` turns the Admin or storefront client into [TanStack Query](https://tanstack.com/query) options: a page reads with `useQuery` and writes with `useMutation`. It needs `react` 19 and `@tanstack/react-query` 5, both optional peer dependencies; no other entry of the SDK loads React.

```typescript
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { createArkyReact } from "arky-sdk/react";
import type { AdminClient } from "arky-sdk/admin";

export const { ArkyProvider, useArky } = createArkyReact<AdminClient>();
export const queryClient = new QueryClient();

export function useCustomerPage(store_id: string, id: string) {
  const arky = useArky();
  const customer = useQuery(arky.customers.get.query({ store_id, id }));
  const notes = useQuery(arky.customers.notes.find.query({ store_id, customer_id: id }, { staleTime: 30_000 }));
  const save = useMutation(arky.customers.update.mutation({ invalidates: [arky.eshop.order.key()] }));
  return { customer, notes, save };
}
```

Render `<ArkyProvider client={admin} queryClient={queryClient}>` once around the app, in client code (a `"use client"` module in Next.js); it also provides the `QueryClient` to TanStack. `useArky()` answers a tree that mirrors the client, built once by a plain walk over its methods:

- **Reads** are the `get…` and `find…` methods, plus the ones `ARKY_METHOD_TYPES` names because their verb doesn't say it: the quotes, previews and package member reviews Arky takes as a POST, the Stripe and Resend setup checks, `pendingPayment`, `customers.export`, file links, downloads, `content.load` and `loadEntries`, `order.fromLink` and `retainedToken`, and `pendingSubmission` and `pendingCheckout`. Each has `query(params, options?)`, the query options with their `queryKey` and `queryFn` and any `useQuery` option you add, and `key(params, request?)`.
- **Writes** are every other method, the tax registration reviews included. Each has `mutation(options?)`: the mutation options, with any `useMutation` option you add, an `invalidates` list of more keys and the call's `request` options.
- **Keys** are `["arky", ...group path, method, params]`, such as `["arky", "customers", "find", { store_id }]`. A storefront read adds the `order_token` it is given and the language and market it runs under, the call's own or else the client's, after the params, because they change the answer: `["arky", "eshop", "order", "get", { id }, { order_token, locale: "en", market: "eu" }]`. So after `setContext` a read under the new language or market is a new query, and a cached answer in the old language is never shown under the new one. Every group's `key()` is its prefix, `arky.key()` is `["arky"]`, and a read's `key(params, request?)` carries its data type, so `queryClient.setQueryData(arky.customers.get.key(params), update)` is typed.
- **Invalidation.** A write that succeeds invalidates its own group's prefix and each key in `invalidates`, then runs your `onSuccess`. `customers.update` invalidates every customers read, nested groups included, `customers.notes.create` only the notes, and a write on the client itself, such as `logout`, every Arky query.
- **Request options.** A call's request options go in `request`: `query(params, { request: { order_token } })` for a read, and `mutation({ request: { order_token } })` for a write, which sends the same `request` with every call of that mutation. A read adds TanStack's abort signal to them, so its `request` takes no `signal`. Only `order_token`, `locale` and `market` join the key; `headers`, `onSuccess` and `onError` don't. A method without params, such as `account.getMe()` (`ARKY_METHODS_WITHOUT_PARAMS` lists them), takes the request options as its only argument, abort signal included. The Admin hooks' `request` is the Admin client's `AdminRequestOptions`, so it has no `locale`, `market` or `order_token`.
- Getters such as `session` and `isAuthenticated` stay on the client. `useArky()` outside an `ArkyProvider` throws a `TypeError`.

## Utilities

`arky-sdk/storefront` exports the helpers a storefront uses. Each one that shows text takes the locale explicitly.

- **Blocks:** `findBlock(record, key)`, `getBlockTextValue(block, locale)`, `getBlockValue(record, key)`, `getBlockContentValue(record, key, locale)`, `getBlockValues(record, key)`, `formatBlockValue(block, locale)`, `selectLocalizedText(value, locale)`, `getImageUrl(media, size)`, and `collectBlockReferences(blocks)`, which answers `{ media_ids, entry_ids, form_ids, product_ids }`.
- **Money:** `formatPrice(price, locale)`, `formatMoney(money, locale)`, `formatMinor(amount, currency, locale)`, `getPriceAmount`, `getCurrencySymbol`, `getCurrencyName`, `getCurrencyMinorUnits`, `convertToMajor`, `convertToMinor` and `CURRENCY_MINOR_UNITS`. Money is integer minor units with a `Currency`.
- **Time:** moments are epoch milliseconds (`epochMilliseconds`, `epochMillisecondsNow`, `epochMillisecondsFromDate`, `epochMillisecondsToDate`); days are `"YYYY-MM-DD"`.
- **Paging:** `readAllPages(read)` and `paginate(read)` refuse a cursor that doesn't advance and stop after `max_pages` (1,000 unless you say otherwise).
- **Payments:** `paymentOutcome`, `latestPayment` and `paymentAmounts`; `mountCheckoutAction` and `mountPaymentMethodSetup`.
- **Forms:** `buildFormAnswers(form, values)` and `formValuesFromAnswers(answers)`.
- **Addresses:** `missingShippingFields(address)` names the fields a shipping address still misses, in the order Arky checks them, with `COUNTRIES_WITHOUT_POSTAL_CODES` and `COUNTRIES_WITH_SHIPPING_STATES` (from `arky-sdk/utils`). Arky saves an address or contact phone only in E.164 form and an email only as a valid address, and refuses anything else with `400 GENERAL.VALIDATION_FAILED` on that field (for example `billing_address.phone`). `toE164(country, input)` (from `arky-sdk/storefront` or `arky-sdk/utils`) turns a number typed for an address in `country` into E.164, or answers why it can't: `empty`, `invalid_characters`, `unknown_country` (write it with `+` and the country code), `national_prefix_missing` (with the prefix, such as `0`) or `invalid_number`.
- **Lines:** `cartProductItems(cart)`, `cartBookingItems`, `cartPackageItems`, `orderProductItems(order)`, `orderBookingItems`, `orderPackageItems`, `orderRentalUseItems` and `orderLineItemsOfType(order, type)` pick the lines of one type.
- **Ids:** `requireId`, `isCanonicalId`, `createOrderToken` and `isOrderToken`.
- **Provider simulator.** `isSimulatedPayment(value)` says a checkout action, card setup or pending store payment runs on Arky's provider simulator. `simulatePayment({ simulation }, { signal? })` plays a checkout, card-setup or store-payment outcome ([Test stores](#test-stores)).

`arky-sdk/utils` has the same helpers, without the payment mounts, the simulator, the line pickers and `CURRENCY_MINOR_UNITS`, plus a few for apps and back offices:
- key checks: `isValidKey`, `validateKey` and `toKey`; currencies: `isCurrency` and `SUPPORTED_STORE_CURRENCIES`;
- requests an app makes retry-safe itself: `getOrCreateDurableRequest`, `readDurableRequest`, `durableRequestPayload`, `clearDurableRequest` and `withDurableRequestLock`;
- `pollScheduledResult(first, read, isPending, signal?)`, which reads again until work Arky runs later is done and throws `ScheduledResultTimeoutError` after 20 seconds;
- the Admin fulfillment unit helpers and store permission checks;
- `copyPackagePriceRef(price)`, which copies the `{ package_id, package_item_id, price_id }` a cart line names out of a price answer.

## Releasing

SDK packages are released by tagging the protected `master` commit with `v<package.json version>`. The `Publish SDK` workflow runs the tests and publishes with npm provenance. Version bumps are patch-only.
