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
| A website or web app | `initialize(publishableKey, options)`: the client plus reactive atoms, a cart store per buyer, package and market, a headless checkout and a booking calendar | `arky-sdk/storefront` |
| Server code, or your own state layer | `createStorefront(publishableKey, options)`: the plain storefront client, the same calls without atoms | `arky-sdk/storefront` |
| Staff tools, scripts, back offices | `createAdmin({ apiUrl, secretKey? })` | `arky-sdk/admin` |

`arky-sdk/storefront` exports everything a storefront needs: both clients, the helpers (prices, blocks, images, paging, payments, forms), the error classes and every type. `arky-sdk/utils` holds the helpers on their own, and `arky-sdk/types` the types with the error classes and constants.

## How every call works

- **One params object, then request options.** A call takes one object of Arky's own fields, then optional request options: `signal`, `headers`, `onSuccess`, `onError`, and on the storefront `locale`, `market` and `order_token` for that one request. A call with nothing to send, such as `customer.getMe()`, takes only the options. Admin calls that act on a store name its `store_id`.
- **One verb per kind of action.** `find…` reads a list. `get…` reads one record or view: `get({ id })`, `get({ slug })` where a record has slugs, `getByKey({ key })`. Records change through `create`, `update` and `delete`. A cart or a checkout changes through `add…`, `remove…`, `set…` (replace a value) and `select…` (pick one of the offered choices). Business actions keep their own names: `quote`, `shipTo`, `checkout`, `place`, `submit`, `cancel`, `pause`, `requestCode`, `verify`.
- **One casing rule.** Arky's data is snake_case: params, answers, atoms and the helpers' results. The SDK's own setup options and callbacks are camelCase: `apiUrl`, `createId`, `onComplete`.
- **Every list answers a page.** `{ items, cursor }`, with `cursor: null` on the last page. Pass the cursor back to read the next page, or let `readAllPages(read)` collect them and `paginate(read)` walk them. A missing record is an `ArkyApiError` with code `GENERAL.NOT_FOUND`.
- **The app picks every id.** A create takes the record's `id`, a canonical UUID v4 the app makes once per user action and sends again on every retry. The same request under the same id answers the stored record; a different request under it is refused (409). The SDK never makes an id up: storefront calls that leave the `id` out take it from your `createId` factory.
- **Changes carry the version they read.** Updates and actions send `expected_updated_at` (the `updated_at` you read); a stale one is refused with 409. The cart store sends it for you. Stock actions and two conversation actions name what they read instead. A stock action names the stock level (its id, or `expected_level_id` on a movement or a unit receipt) and its `action_id` (a unit receipt names its new unit's `id`), and an adjustment names the count it corrects in `expected_count` (the level's `on_hand`, or its `unavailable` with `from_set_aside`). Assigning a conversation names the assignee you read (`expected_account_id`), and changing its reply email the selection you read (`expected_reply`). A value that moved is refused with 409 `GENERAL.CONFLICT`. A package's access row has no version, so its delete names only the row's id.
- **Context is explicit.** Storefront requests carry the publishable key, which decides the sales channel, plus the locale and the market you set with `setContext({ locale, market })`. A call names the package it reads, and the company or one of its locations it acts for, never both. Every commercial call (packages, their items, products, bookings and carts) names its market, even when the key's channel sells in one: without it Arky refuses with 409 `SALES_CHANNEL.MARKET_REQUIRED`, and a market the channel doesn't sell in with `SALES_CHANNEL.MARKET_NOT_LISTED`. Content reads need no market. A locale outside the store's languages is refused with `STORE.LANGUAGE_NOT_SUPPORTED`.
- **Errors carry a code.** Everything the SDK throws at runtime is an `ArkyError` with a `code` that you map to your own text. A `TypeError` means your code passed a wrong value. See [Errors](#errors).

## 1. Set up the store

```typescript
import { createOrderToken, initialize } from "arky-sdk/storefront";

const arky = initialize("arky_pk_...", {
  locale: "en",
  market: "eu",
  createVisitorIdentity: () => ({ customer_id: crypto.randomUUID(), session_id: crypto.randomUUID() }),
  createSessionId: () => crypto.randomUUID(),
  createId: () => crypto.randomUUID(),
  createOrderToken,
});

const setup = await arky.store.load();
const { items: packages } = await arky.eshop.package.find();
const shopPackage = packages.find((candidate) => candidate.key === "public");
console.log(setup.name, setup.languages, arky.currency.get(), shopPackage?.id);
```

- **The four factories are required.** The app picks every customer, session and record id and every order token; `createOrderToken` makes a token in the shape Arky accepts. Without them `initialize` throws.
- **`apiUrl`** defaults to `https://api.arky.io`. Only an `arky_pk_...` publishable key is accepted.
- **Sessions** are kept in `localStorage`. During server rendering, pass a request-local `sessionStorage` adapter. `visitorIdentity` restores a visitor pair your app picked earlier.
- **`arky.store.load()`** reads the store's setup and the current market and fills the `setup`, `market`, `currency` and `allowed_payment_option_ids` atoms. `arky.getSetup()` only answers the setup: `name`, `timezone`, `languages`, `payment_options` and `bot_check`.
- **Packages.** A package is a set of things you can buy, get or rent; a shop is a package with priced items. `eshop.package.find()` lists the packages open to this buyer in the current market and sales channel, each with its access `level`. Pick yours by its `key`; every item, product, booking and cart call names its `package_id`. `package` is a reserved word in strict TypeScript, so a local holding one is `shopPackage` or `memberPackage`; properties such as `eshop.package` are fine.
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
const { items: images } = await arky.media.find({ ids: imageIds });
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
  - `sort`: `package_order` (the default), `relevance` (needs `text`) or `starting_price` (needs `price_basis`), and `direction`, `asc` unless you ask for `desc`. Relevance has no descending order.
- **Prices in search.** With `include_price: true` and an access level that shows prices, an answer has its `currency` and `price_summary`, `{ basis, min_amount, max_amount, price_count }` over the item's prices on sale. A package's item holds exactly one price, and its answer names it as `price_id`.
- **Pages.** A page holds 20 answers unless you ask for more, and a page can come back short with a `cursor`: follow it.
- **Media.** `media.find({ ids })` takes any number of ids and reads them 100 at a time. Every file has its public URL at `content.original.url`. Images also come as `thumbnail`, `small`, `medium` and `large`, and `getImageUrl(media, size)` picks one.
- **Texts are blocks.** `findBlock(record, key)` finds a block and `getBlockTextValue(block, locale)` reads its text in the language you name, never another; an empty string means there is none. Pass a second language as the third argument when your page has one to show instead.

A product page reads the product by its slug in the current language, then the prices of its item:

```typescript
const product = await arky.eshop.product.get({ slug: "classic", package_id });
const { items: choices } = await arky.eshop.packageItem.findPrices({ package_item_id: product.package_item_id, package_id, include_price: true });
const byKey = await arky.eshop.product.getByKey({ key: "classic-x1", package_id });
console.log(choices.map((choice) => [choice.price_id, choice.content.sku, choice.price?.unit_price.amount]), byKey.id);
```

- **Reads.** `get` takes `{ id }` or `{ slug }`; a key is read with `getByKey({ key })`. Both answer the product with the `package_item_id` of its item in that package and the current market. Booking services and categories read the same way; collections, forms, markets, packages and their offerings read by `{ id }` or with `getByKey({ key })`.
- **Prices.** `packageItem.findPrices({ package_item_id })` pages an item's prices, its exact choices. Each names its `price_id`, the `sellable` it prices (a `product_variant`, `booking_offering` or `package`), its `content` (`sku`, `blocks` and the price `basis`) and, with `include_price: true`, its `price`, which carries the full reference (`package_id`, `package_item_id`, `price_id`) a cart line names.
- **More reads.** `packageItem.getByParent({ item: { type: "product", product_id } })` reads the item of a record in the current market, and `productVariant.get({ product_id, id })` reads one variant, with its price when you pass `include_price: true`.

## 3. Cart

`arky.eshop.cart({ buyer, package_id })` answers the cart store of that buyer and package in the current market: the same store on every call, shared with the checkout flow and the booking calendar of the same scope. A shopper who switches market gets that market's cart store. A store kept from before the switch refuses its next call with `CartError` `context_changed`.

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
  - `cart`, `product_items`, `booking_items`, `package_items`, `item_count`;
  - `quote_result`, `promotion_codes` and `last_order`, where `promotion_codes` holds every code the quote lists, each with its `state`: `applied`, `stopped` (a promotion ahead of it stopped the ones after it) or `not_applied` (it takes nothing off this cart);
  - `status`: `loading`, `syncing`, `fetching_quote`, `processing_checkout`, `error` and `quote_error`, where an error is `{ code, message }`.
- **Reads:** `ensure()` loads the cart this browser selected for the buyer, package and market, or creates one under an id from `createId`, kept across a lost answer. `load()` only loads; `create({ id? })` only creates.
- **Changes:** each answers the changed cart and sends the cart id and version for you. Line ids come from `createId` when you leave them out.
  - lines: `addProduct`, `addBooking`, `addPackage`, `setProductQuantity({ line_item_id, quantity })`, `removeItem({ line_item_id })`, `clear()`;
  - checkout details: `shipTo({ destination, contact_email? })`, `setDeliveryGroups({ delivery_groups })`, `selectShippingMethod({ shipping_method_id })`, `setBillingAddress({ billing_address })`, `setBuyer({ buyer })` (a company buyer's `purchase_order_number`), `setPromotionCodes({ promotion_codes })`, which replaces the whole list, so pass the codes you keep plus the new one;
  - package deliveries: `setFutureDeliveries({ packages })` and `quoteFutureDeliveries({ packages })`.
- **Quote and checkout:** `quote({ contact_email? })`, `checkout(...)`, `retainCheckout(...)`, `pendingCheckout()` and `recoverCheckout()`. Most pages use the [checkout flow](#4-checkout) instead.
- **After a failed write:** a write whose answer is lost, or that is refused because the cart changed (409), drops the view: `cart` and `quote_result` turn `null`, and the next `ensure()` reads the current cart. `reset()` drops the view by hand; `clear()` empties the cart in Arky.
- **Prices.** Every line names the exact price it is bought at, `price: { package_id, package_item_id, price_id }`, one of its item's prices read with `packageItem.findPrices`, so product, booking and package lines name it the same way. A cart is priced from its own package only: a club's prices are the products the club package lists, bought in a cart of that package, and money off for its members in another shop is a promotion with a `package` condition.

A cart line names its variant. To show names, quote the cart and read its products:

```typescript
import { findBlock, getBlockTextValue } from "arky-sdk/storefront";

const cart = arky.eshop.cart({ buyer: { type: "customer" }, package_id });
await cart.ensure();
const quote = await cart.quote();
const productIds = [...new Set(quote.lines.flatMap((line) => (line.type === "product" ? [line.product_id] : [])))];
const products = await Promise.all(productIds.map((id) => arky.eshop.product.get({ id, package_id })));
const names = new Map<string, string>(products.map((product) => [product.id, getBlockTextValue(findBlock(product, "name"), "en")]));
console.log(quote.lines.map((line) => (line.type === "product" ? names.get(line.product_id) : line.type)), quote.totals.total);
```

The quote is in the store's locale, and each product line's `snapshot` keeps the variant's `variant_sku` and `variant_blocks` as they were quoted. `quote.ready` is false while `quote.blockers` lists what is missing: a delivery, a shipping choice, a billing address, a taken booking slot, and so on. Each delivery's `offers` name their shipping method by `shipping_method_key` and `shipping_method_blocks`, so a page can show "Courier €45". A rate that needs a weight Arky doesn't know is left out of `offers` and listed in the delivery's `unavailable` with its `code` (`SHIPPING.WEIGHT_UNKNOWN`).

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
if (state.step === "payment") state = await checkout.place({ return_url: (orderId) => `${location.origin}/order/${orderId}` });

const placed = state.placed;
if (placed && placed.payment_action.type !== "none") {
  await mountCheckoutAction({ action: placed.payment_action, payment_id: placed.payment_id, element: "#payment" });
}
```

- **Steps.** `state.step` is one of:
  - `cart`: no lines, a line that can't be bought as it is (a taken booking slot, a price that can't hold its fixed per-unit fee: `tax_unavailable`, a package that would put the buyer under a second purchase minimum: `package_minimum_conflict`, or a `switch` or `amend` line whose change Arky refuses: `package_change_refused`, with that refusal's `code`), or a cart that needs a payment none of the market's payment options can take (`payment_unavailable`, with the reason's `code`), named in `quote.blockers`. A package change keeps its membership, so its new minimum never counts as a second one. While one of the buyer's memberships has a package change waiting, a line for a package of the offering that change moves into is blocked with `package_change_scheduled`, and placing it is refused with `PACKAGE_MEMBER.CHANGE_SCHEDULED`;
  - `details`: the contact email, an address, the billing address or a purchase order number is missing, a package line still needs a delivery (`package_delivery_required`, a renewing `switch` line's new shipping profile included), or a delivery no longer fits its lines (`delivery_unavailable`: set it again with `shipTo`);
  - `shipping`: a delivery needs its shipping choice;
  - `payment`: ready to place;
  - `paying`: the order waits for its payment, or a kept checkout waits for `recover()`;
  - `placed`: paid, to pay later (cash on delivery), unconfirmed (the provider's answer needs checking) or free.
- **State:** the `cart`, the `quote` with its `blockers`, `contact_email`, `contact_first_name`, `contact_last_name`, `destination`, `billing_address`, the chosen `payment_option_id` (the quote's suggestion until you pick one), the `pending` request, the `placed` order with its `payment_method_id` and `payment_method_setup` (set when placing saves a card), its `payment` and `outcome`, `busy` and `error`.
- **Steps you call.** Each step that reads or writes Arky answers the new state. `setContact` and `selectPaymentOption` only change the state.
  - `open()` and `refresh()` (quote again);
  - `setContact({ contact_email: { email, language }, contact_first_name?, contact_last_name? })`, `shipTo({ destination })`, `setBillingAddress({ billing_address })`;
  - `selectShipping({ delivery_group_id, shipping_method_id, rate_id })` and `selectPaymentOption({ payment_option_id })`;
  - `setPromotionCodes({ promotion_codes })`;
  - `place({ return_url?, save_payment_method?, payment_method_terms? })`.
- **Contact.** The order's contact is an email with the language its emails are written in, plus an optional first and last name that the SDK never fills in. `open()` names no contact: the page sets it with `setContact` from its own field, the billing address or the session, in the page language, and the flow stays on `details` until then. Each `setContact` states the whole contact, so a name it leaves out is cleared. After `setContact`, every quote sends the email, so a guest can use a promotion code limited to one use per customer. A company buyer's purchase order number is set with `checkout.cart.setBuyer({ buyer })`.
- **Placing.** `place` pays with one of the quote's payment options, or places a free order at a zero total. The quote's `payment_option_ids` lists only the options that can pay this cart, so pick from it as it is. A paid package is paid by card at checkout: a cart with a package line that charges money or saves a card lists only card options, and Arky refuses cash on delivery and manual options for it with `CART.CARD_REQUIRED`. When the cart needs a payment and no option can take it, the quote shows `payment_unavailable` with the reason's `code` (`CART.CARD_REQUIRED`, `CART.DEDICATED_SETUP_NEEDS_STRIPE`, `PAYMENT_METHOD.TERMS_UNAVAILABLE` or `CART.PAYMENT_OPTION_UNAVAILABLE`), and checkout answers that code. At a zero total, `place({ save_payment_method: true, payment_method_terms })` sends the selected payment option instead, and Arky saves the card a renewing package needs through Stripe's setup; each package line's `saves_card` in the quote says when, and the quote then lists only Stripe options with saved-card wording in its language. Pass `state.placed.payment_method_setup` to `mountPaymentMethodSetup({ setup, element })`, confirm it, then call `eshop.paymentMethod.completeSetup({ id: state.placed.payment_method_id })`. Arky refuses that place with `CART.NOTHING_DUE` when no line saves a card. A Monri store can't take such a cart, because Arky saves a Monri card only from a paid checkout: its quote shows `payment_unavailable` with `CART.DEDICATED_SETUP_NEEDS_STRIPE`.
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

Saved cards use `eshop.paymentMethod.requestSetup`, `startSetup`, `mountPaymentMethodSetup({ setup, element })` and its `confirm({ return_url })`, then `completeSetup`. A Monri option refuses this setup (`PAYMENT_METHOD.DEDICATED_SETUP_NEEDS_STRIPE`), because Arky saves a Monri card only from a paid checkout.

A membership replaces its card by saving a new one and selecting it: `eshop.packageMember.selectPaymentMethod({ id, expected_updated_at, payment_method_id })` charges any renewal that's owed, and `resume` then restarts a blocked membership. A Stripe card is saved with the setup above. A Monri membership's buyer places a paid checkout under the Monri option with `place({ save_payment_method: true, payment_method_terms })` and, once its payment succeeds, selects `state.placed.payment_method_id`. Arky has no payment page for an owed renewal order.

Each checkout answer, card setup start and store plan answer carries `runs_on`, which says where the payment runs: `{ type: "provider" }`, or `{ type: "simulator", api_url }` on a [test store](#test-stores). These two mounts handle both, so the same site code works on a test store and a live one.

## 5. Order page

An order email links to the order with a `#order_token=...` fragment, so a guest can open it in any browser:

```typescript
import { latestPayment, paymentAmounts, paymentOutcome } from "arky-sdk/storefront";

const opened = await arky.eshop.order.fromLink({ id: orderId, url: location.href });
history.replaceState(history.state, "", opened.url);

const payments = await arky.eshop.order.findPayments({ order_id: opened.order.id }, { order_token: opened.order_token });
const latest = latestPayment(payments.items);
console.log(opened.order.number, latest ? paymentOutcome(latest) : null, paymentAmounts(payments.items).net_paid);
```

- **`order.fromLink({ id, url })`** checks the token, reads the order with it, keeps the token for that order and answers `{ order, url, order_token }`, where `url` is the link without the token. A link without a token uses the token kept at checkout, or the customer's session. A malformed token is an `ArkyError` with code `invalid_link`.
- **Tokens are sent only when you pass them.** Order reads send a token only as the request option `{ order_token }`. The order, its payments and fulfillments, `resumePayment`, `downloadAsset`, cancellations, reschedules and returns accept it. `order.retainedToken({ order_id })` answers the kept one. Keep payment provider return URLs free of the token.
- **`paymentOutcome(payment)`** says what a payment means to the shopper: `paid`, `pay_later` (cash on delivery or a manual payment not yet collected), `awaiting`, `unconfirmed` (the provider's answer is unclear and the team settles it, so tell the shopper you will email them) or `failed`. `latestPayment(payments)` picks the newest.
- **`paymentAmounts(payments)`** adds up an order's payments as Arky does: `paid`, `refunded`, `refund_pending`, `disputed` and `net_paid`. It leaves out what is still owed, because that also subtracts the order's credits, which a storefront doesn't read.

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

await arky.customer.requestCode({ contact: { email: "ana@example.com", language: "en" } });
await arky.customer.verify({ code: "123456" });
const me = await arky.customer.getMe();
await arky.customer.updateMe({
  expected_updated_at: me.customer.updated_at,
  profile: [{ id: crypto.randomUUID(), key: "first_name", type: "text", value: "Ana" }],
});
const { items: orders } = await arky.eshop.order.find({ limit: 20 });
console.log(orders.length);
await arky.customer.logout();
```

- **Visitors and customers.** Customers are anonymous visitors until they verify their inbox. `requestCode({ contact: { email, language } })` takes the code email's id from `createId`; a lost answer is retried under the same id, so the customer gets one email. A verified customer's `type.contact` keeps the email and the language their emails use.
- **`verify`** signs the customer in under a new session id from `createSessionId`. When the visitor signs in as a customer who already exists, Arky merges the visitor's cart into that customer's cart, and the cart store follows it.
- **Sign-in refusals** carry their own codes: `CUSTOMER_SIGN_IN.CODE_RECENT` (a new code within the configured interval, sixty seconds in production), `CUSTOMER_SIGN_IN.CODE_INVALID` (a wrong or expired code, or none waiting) and `CUSTOMER_SIGN_IN.ATTEMPTS_EXHAUSTED` (too many wrong codes for the address).
- **Session lifetime.** A signed-in session's access token lasts an hour; the SDK refreshes it on the first 401 and keeps every cart and checkout view. Only Arky's own refusal of that refresh (401 `GENERAL.UNAUTHENTICATED` or 403 `GENERAL.UNAUTHORIZED` in Arky's error body) clears the session and reports it to `onAuthStateChanged` and the `session` atom. Any other failed refresh, such as a 401 or 403 from a proxy, a 429, a 5xx or a lost answer, fails that request with the refresh's error and keeps the session for the next try. A visitor whose token Arky itself refuses (401 `GENERAL.UNAUTHENTICATED` in Arky's error body, for example after the visitor session expired) is replaced: the SDK identifies a new visitor and sends the request once more. Any other 401, such as a proxy's, fails that request and keeps the visitor. Changing the shopper, signing out or switching markets clears checkout contact, delivery, payment selection and the displayed order. A late response from the previous context cannot restore them; kept checkout requests remain available for explicit recovery.
- **Email changes.** On a signed-in session, `requestCode` starts an email change: the code goes to the new address and `changeEmail({ code })` proves it. `updateMe` changes the profile blocks, the addresses and the `language` the customer's emails are written in (one of the store's languages, otherwise `CUSTOMER.LANGUAGE_NOT_SUPPORTED`), never a verified email. `unsubscribe()` and `resubscribe()` record the customer's email choice.

## 7. Forms and the bot check

```typescript
import { FormAnswerError } from "arky-sdk/storefront";

const { bot_check } = await arky.getSetup();
const form = await arky.forms.getByKey({ key: "contact" });
const bot_check_token = bot_check.type === "off" ? undefined : await solveBotCheck(bot_check.type, bot_check.site_key);

try {
  await arky.forms.submit({ form, values: { email: "ana@example.com", message: "Hello" }, language: "en", bot_check_token });
} catch (error) {
  if (error instanceof FormAnswerError) console.log(error.questionKey, error.code);
  else throw error;
}
```

- **Submitting.** `forms.submit` takes the loaded `form` and a `{ key: value }` map, checks each value against its question and builds the answers. You can also pass `form_id`, `questions_updated_at` and `answers` that you built yourself.
- **Answer errors.** A value that doesn't fit throws a `FormAnswerError` with the question's key and a code: `required`, `invalid`, `too_short`, `too_long`, `pattern_mismatch`, `too_small`, `too_large`, `unknown_option`, `too_many_files` (more than the question's `max_files`), `file_size` (an empty file), `file_name` or `unknown_question`.
- **Empty answers** are left out. File answers carry `File` objects and are sent as multipart. Arky's configured limits refuse what is too big (production: 10 MiB a file, 20 files and 50 MiB a request): 413 `FORM_SUBMISSION.FILE_TOO_LARGE`, 409 `FORM_SUBMISSION.TOO_MANY_FILES` and 413 `GENERAL.PAYLOAD_TOO_LARGE`.
- **Changed forms.** When the form's questions changed since you loaded it, Arky refuses with 409 `FORM_SUBMISSION.FORM_CHANGED`: load it again.
- **Bot check.** When the publishable key has a bot check on, `getSetup().bot_check` names the provider (`turnstile` or `h_captcha`) and its `site_key`. Render that provider's widget and send its token as `bot_check_token` with `forms.submit`, `forms.recoverSubmission`, `customer.requestCode` and `newsletter.requestCode`. Send a fresh token on every retry.

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
  const state = await calendar.select({ booking_service_id: service.item.booking_service_id });
  const day = state.days.find((cell) => cell.available);
  if (day) calendar.selectDate({ date: day.iso });
  const [slot] = calendar.state.get().slots;
  if (slot) await calendar.addToCart({ slot });
}
```

- **State:**
  - the service: `booking_service`, `booking_choices` (the prices of its offerings in this package and market), `booking_resources`, `selected_booking_resource_id`, `availability`, `timezone` and `loading`;
  - the calendar: `month` and `days` (`date`, `iso`, `available`, `is_selected`, `is_in_range`, `is_today`, `blank`), plus the `calendar.month_label` atom with the shown month in the store's language;
  - the choice: `selected_date`, `slots` (`booking_offering_id`, `price_ref`, `price`, `from`, `to`, `time_text`, `date_text`, `is_multi_day`) and `selected_slot`.
- **Calls.** Steps that read Arky answer the new state; picks only change the state.
  - reads: `select({ booking_service_id })`, `prevMonth()`, `nextMonth()`, `selectResource({ booking_resource_id })`, `loadMoreChoices()` and `loadMoreAvailability()`;
  - picks: `selectDate({ date })`, `selectFirstAvailableDate()`, `selectSlot({ slot })` and `setTimezone({ timezone })`;
  - `addToCart({ slot, id?, capacity_units?, form_submission_id? })` answers the cart.
- **Prices and resources.** `select` reads the service and the first page of its item's prices; a slot shows once its offering's price is loaded, so call `loadMoreChoices()` while `booking_choices_cursor` is set. The resources come with the availability, and the calendar reads each new one once.
- **Stays.** A slot that spans days (a stay of several nights) is `is_multi_day`, its `time_text` is the date range, and its days are `is_in_range` once it is chosen. With bookings already in the cart, the calendar starts after the last one.

The cart and the checkout are the same as for products: the `checkoutFlow` of the same scope sees the booking lines.
- **Without the calendar,** read the service with `bookingService.get({ id, package_id })`, its offerings' prices with `packageItem.findPrices({ package_item_id, package_id })`, and the free slots with `bookingService.getAvailability({ package_id, booking_service_id, from, to })` (at most 60 days per read; follow `cursor`). Add a slot with `cart.addBooking({ booking_offering_id, requested_interval, capacity_units, price })`, where `price` is `{ package_id, package_item_id, price_id }`. `bookingOffering.get({ id, package_id })` reads one offering with its price, and `bookingResource.get({ id, offering_id, package_id })` the resource that provides it.
- **Taken slots.** The quote checks the slot again: a taken slot is a `booking_unavailable` blocker.
- **Later changes.** `eshop.order.cancelBookingItem` and `rescheduleBookingItem` change a booking after the order.

## 9. Content and media

```typescript
const site = await arky.content.load({ collection: { key: "website" } });
const title = site.object("info")?.text("title");
const post = await arky.content.load({ entry: { collection_id, slug: "launch" } }, { locale: "it" });
const posts = await arky.content.loadEntries({ collection_id, limit: 100 });
console.log(title, site.media("hero")?.id, post.text("title"), posts.length);
```

- **`content.load`** reads one collection (`{ id }` or `{ key }`) or one entry (`{ id }`, `{ collection_id, key }` or `{ collection_id, slug }`), with the media its blocks name. `loadEntries` reads every page of a collection's entries.
- **Accessors.** The answer has `record`, `blocks`, `media_by_id` and accessors in the call's locale: `block(key)`, `text(key)`, `media(key)`, `object(key)` and `list(key)`. Text is read in the exact language asked for, never another, and an accessor for a block of another type throws.
- **Missing entries.** A key or slug that matches no entry throws an `ArkyError` with code `not_found`.
- **Plain reads:** `content.collection.get({ id })`, `content.collection.getByKey({ key })`, `content.entry.get({ id })` and `content.entry.find`, which takes `collection_id` with `key`, `slug`, `query` or `filters`, or a list of `ids`.

## Errors

Everything the SDK throws at runtime is an `ArkyError` with a `code`; map the code to your own text. Each class works with `instanceof` whichever entry point made it.

| Class | When | Codes |
|---|---|---|
| `ArkyApiError` | Arky answered with an error | Arky's own, such as `GENERAL.CONFLICT`, `GENERAL.NOT_FOUND` and `FORM_SUBMISSION.FORM_CHANGED`; it also has `statusCode`, `validationErrors` and `requestId` |
| `CartPresentationChangedError` | a checkout's quote changed (an `ArkyApiError` with code `COMMERCE.PRESENTATION_CHANGED`) | carries the new `quote` |
| `ArkyNetworkError` | no readable answer | `network`, `aborted`, `unreadable_answer` |
| `DurableRequestError` | a retry-safe request couldn't run | `storage` (no `localStorage` or Web Locks; nothing was sent), `busy`, `pending`, `answer_mismatch`, `settled_elsewhere` |
| `CartError` | the cart store or the cart selection | `no_cart`, `not_ready`, `busy`, `other_cart`, `context_changed`, `answer_mismatch`, `storage`, `no_session` |
| `CheckoutFlowError` | a checkout step | see [Checkout](#4-checkout) |
| `FormAnswerError` | a form value doesn't fit its question | see [Forms](#7-forms-and-the-bot-check) |
| `MonriCheckoutError` | Monri card entry | `invalid_card`, `invalid_details`, `unknown_result`, `already_submitted`, `invalid_action`, `unavailable` |
| `PackageJoinError` | a free package sign-up | `sign_in_required`, `email_mismatch`, `not_free`, `sign_up_used`, `sign_up_expired` |
| `ScheduledResultTimeoutError` | `pollScheduledResult` stopped waiting | `timeout` |
| `FulfillmentSelectionError` | an Admin fulfillment unit helper got a wrong selection | `invalid_selection` |
| `ArkyError` itself | anything else | `not_found` (content), `invalid_link` (order link), `answer_mismatch` (an answer names another record), `no_session`, `token_conflict` and `storage` (order tokens), `too_many_pages` (paging), `unavailable` (Stripe.js didn't load, or a test store's payment form has no container), `invalid_details` and `declined` (saving a card), `not_sent` (page view), `not_confirmed` (provider simulator), and on the Admin client `session_changed` and `refresh_failed` |

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

`isDefiniteRefusal(error)` is true for any 4xx answer except 408 and 429: the request itself must change before it is sent again. A network failure, a 5xx or an aborted read can be sent again unchanged.

## Retry-safe requests

The calls that take their ids from the factories keep them in `localStorage` under a cross-tab Web Lock, so a lost answer is retried under the same id.
- **Kept requests.** A checkout, a free package sign-up and a kept form submission keep their whole request, and drop it on a success or a definite refusal.
- **Light creates.** Form submissions, support conversations and messages, and sign-in code requests keep only their id and a fingerprint of the request.
- **Cart writes** in a browser need `localStorage` and Web Locks too, because they check that no checkout of that cart is unfinished.

A checkout without `order_id` and `order_token` takes them from the factories and keeps the request before it is sent. Sending the same checkout again recovers the kept one; a different one is refused (`DurableRequestError` `pending`) until it is recovered. The store's cart keeps its checkout in its own buyer, package and market scope, so a company's branches check out side by side. The plain client's `eshop.cart.checkout` keeps it in one shared slot unless you pass `scope: { buyer, package_id }`; `pendingCheckout({ scope })` and `recoverCheckout({ scope })` read and finish it.

## The plain client

`createStorefront` takes the same options as `initialize` and has the same calls, without atoms or helpers:

```typescript
import { createOrderToken, createStorefront, readAllPages } from "arky-sdk/storefront";

const client = createStorefront("arky_pk_...", {
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
- **Quote and checkout:** `quote({ id, contact_email? })`, `checkout`, `retainCheckout`, `pendingCheckout` and `recoverCheckout`. A quote takes the guest's email as a string; a checkout's `contact_email` is `{ email, language }` or `null`, and it may name `contact_first_name` and `contact_last_name`, each optional, which the SDK never fills in. A package line's `rent_product` items name the lent machine's `product`, a `ProductReference` (`{ id, key, blocks }` with the product's current blocks), also when no package lists that product.
- **After checkout:** `getOrder({ id })` (the order the cart became, or `null`) and `findOffers` (a company's offered carts).

A checkout refused because the quote changed throws a `CartPresentationChangedError` with the new quote. Send the guest's `contact_email` with the quote once you know it: a promotion code limited to one use per customer counts a guest by that email, and without it the quote is refused with 409 `CART.PROMOTION_EMAIL_REQUIRED`.

## More of the storefront

- **`eshop.order`:** `find`, `get`, `fromLink`, `retainedToken`, `findPayments`, `getPayment`, `findFulfillments`, `resumePayment` (reopens the order's checkout payment page while its payment window is open; a renewal order has none), `downloadAsset`, `cancelBookingItem` and `rescheduleBookingItem`. A customer cancels booking lines only; the store's team cancels product lines. Order lists filter booking lines by `booking_statuses`.
- **`eshop.promotion.get({ id })`:** the text shoppers see for a promotion, `{ id, key, blocks }`.
- **`eshop.library`:** `find`, `getProduct`, `findAssets` and `download`, for the digital files the buyer owns. Pass `company_id` or `company_location_id` for a company's.
- **Packages:** packages a store sells are listed with `packageItem.find` and read like products: `eshop.package` (`find`, `get`, `getByKey`, `getProductChoices`, `joinFree`) and `eshop.packageOffering` (`get`, `getByKey`), each with the `package_id` of the shop it is listed in. Each plan is sold by its own `package` item, which holds exactly one price: a package read answers that item's `package_item_id`, and `packageItem.findPrices` pages its one price. A package read answers its `renewal`, `stay` and `minimum`, its automatic `items` in order as `{ id, type }`, `rental_products`: for each `rent_product` item, its `package_item_id` and the lent machine's `product`, a `ProductReference` with the product's current blocks, also when no package lists that product, or `null` once the product no longer exists, and `package_offering_id`, the offering the package belongs to or `null`.
  - An offering is a family of plans a membership moves between. An offering read answers its `id`, `key`, `blocks` and `package_ids`, the plans of it that the shop sells in the current market, in the offering's order, and 404 when the shop sells none, so a page groups the plans it lists by their `package_offering_id`.
  - `joinFree({ key, package_id, language })` (or `{ id, package_id, language }`) joins a signed-in customer to a free package, one that never renews and has no automatic items. `package_id` names the shop it is priced in. The Order contact is the customer's verified email in the `language` you pass, normally the page language. It reads the package's price in that shop and market, creates its own cart, checks the quote is free and places the zero-price order, with every id from the factories. It answers `{ type: "joined", order_id }` or `{ type: "already_member", package_member_id }`.
  - A cart buys a package with `addPackage({ package_id, quantity, choices, start, price })`, where `package_id` is the package being joined, `price` is the `{ package_id, package_item_id, price_id }` it is bought at, and `start` is `{ type: "on_acceptance" }`, `{ type: "scheduled", starts_at }` or `{ type: "switch", package_member_id }`. Buying another package of an offering whose package the buyer already holds is refused with `CART.OFFERING_MEMBER`, whatever either package's renewal: a `switch` line naming that membership changes it instead (see [Changing a package](#changing-a-package)).
  - `getProductChoices` answers a `get_product` item's alternatives with their `sku`, `product_blocks` and `variant_blocks`.
- **`newsletter`:**
  - `requestCode({ contact: { email, language } })` answers `{ type: "verified" }` when that address is already signed in. Otherwise it signs out another address and sends a code, answering `{ type: "code_sent" }`.
  - `join({ email, code, key, package_id, language })` verifies the code and runs `joinFree`.
- **`broadcast.unsubscribe({ token })`:** a store's own unsubscribe page, which its Broadcast template links to with `{{unsubscribe_token}}`, posts the token from its `?token=` when the reader confirms and answers `{ result: "unsubscribed" }`. It needs no session. The email's one-click unsubscribe header keeps naming Arky's address.
- **`eshop.packageMember`:**
  - reads: `find`, `get`, `getCurrent`, `findOrders`, `getRevision`, `getCalendar`, `getProductChoices`, `getDeliveryOptions` and `getSwitchDeliveryOptions` (see [Changing a package](#changing-a-package));
  - `findOrders({ id, limit, cursor })` lists the membership's orders newest first by when their lines start, each order once; pass the answer's `cursor` back as it is;
  - a membership's accepted terms keep the one variant each `get_product` item gives it (`variant_id`). `getProductChoices` answers the variants that item lists now, each `available` only when a change to it fits the accepted terms, and none once the item is gone; `changeTerms` names the new choice in `choices`;
  - `getRevision({ package_member_id, revision_id })` answers the revision, which holds its accepted `terms` in full, and `package`: the current `{ id, key, blocks }` of the package that revision is for, whatever the package's status, dates or sale, so a past order can name the package it bought (see the example below);
  - a revision's `origin.change.type` says what the change was: `own_terms` (the membership's own terms), `package_change` (a move at the next renewal, or a `never` package change bought with a `switch` line), `upgrade` (a renewing upgrade bought now with a `switch` line), `amend` (the store team's amendment of a `never` agreement) or `minimum`;
  - a company or location membership's terms carry `purchase_order_number`, the number its renewals put on their orders, and a person's carry `null`. `changeTerms` and `getDeliveryOptions` send it with the rest of the terms; a new number clears a block for a missing one (`purchase_order_number_required`), and `resume` then passes;
  - the member's actions: `cancel`, `pause`, `resume`, `skipNext`, `selectPaymentMethod`, `reviewSwitch`, `switch`, `reviewTerms`, `changeTerms` and `withdrawRevision`;
  - `withdrawRevision` withdraws a change that hasn't taken effect yet. Withdrawing a store team's amendment also cancels the lines of its zero-price order and withdraws the rentals it opened, and so does ending the membership before the amendment's date, so no confirmed order is left with nothing to ship.
- **Other eshop reads:** `eshop.minimumProgress.get`, `eshop.paymentMethod` (saved cards), `eshop.rental` (`find`, `get({ id })`, each rental with the rented machine's `product`: a `ProductReference` with its current blocks, whatever the package lists or sells, or `null` once the product no longer exists, and its `status` as Arky stores it, see the rental statuses below) and `eshop.return` (`create`, `get({ id })`, which also answers each line's product as a `ProductReference`, `find`, `getOrderOptions`, `findRentalOptions`).
- **`companies`,** the signed-in customer's companies: `getAccess({ id })`, `membership.find` (the customer's own), `location.find` and `location.get({ id })`. Members whose grants allow it also manage the company: `update` (`manage_company`); `location.create`, `update` and `delete` (`manage_addresses`); and `membership.find({ company_id })`, `create`, `update`, `delete`, `resendInvite` and `role.find({ company_id })` (`manage_members`). Creates take the app's `id`, and a location create sends `blocks: []`. Members never see company or location `blocks`, and their updates keep the stored ones. A location delete answers `{ deleted }`.
- **`store`:** `country.find`, `country.get({ code })`, `location.find`, `location.get({ id })`, `market.find`, `market.get({ id })`, `market.getByKey({ key })` and `load()` (on the store only).
- **`category`:** `get`, `getByKey` and `findChildren({ id })`.
- **`support.conversation`:** `start({ language, flow_key? })`, `get({ id })`, `findMessages({ conversation_id })`, `getMessage({ conversation_id, message_id })` and `sendMessage({ conversation_id, input, prompt_message_id? })`, under the customer's own session. `start` and `sendMessage` take their ids from `createId`. A `flow_email_contact` prompt is answered with `input: { type: "email_contact", contact }`.
- **Tracking:**
  - `actions.track({ key, data? })`;
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
      revision_id: line.revision_id,
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
- `ending`: its machine goes back (`requested_at`, `return_due_at`);
- `closed`: none of its machines is out and no return is open (`closed_at`);
- `withdrawn`: its terms never started, because the order ended unpaid, the change ended unapplied, the amendment was withdrawn or the membership was cancelled first (`withdrawn_at`). It never had a machine out and opens no return, and a storefront lists it nowhere.

Ending, closing or replacing a `waiting` or `withdrawn` rental is refused with `RENTAL.WRONG_STATUS`; a waiting rental is managed through its order or its amendment. The store team lists rentals by any of these statuses with the admin `eshop.rental.find({ store_id, status })`, and the store's `open_rentals_by_status` count has `waiting`, `active` and `ending` segments. The `rental.created` and `rental.updated` webhooks carry the same `status`: a rental is created `waiting` or `active`, and a waiting one posts `rental.updated` when it starts and when it is withdrawn, so a consumer that switches on the status meets every value above.

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

const admin = createAdmin({ apiUrl: "https://api.arky.io", secretKey: process.env.ARKY_SECRET_KEY });
const { items: markets } = await admin.store.market.find({ store_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" });
console.log(markets.length);
```

Without `secretKey`, an Account signs in with a code, and the client keeps and refreshes the Account session:

```typescript
const pending = await admin.account.auth.requestCode({ session_id: crypto.randomUUID(), email: "staff@example.com" });
await admin.account.auth.verify({ session_id: pending.session_id, code: "123456" });
console.log(admin.session?.email);
```

The app picks the code request's `session_id` once per send-code press and sends the same id on a retry: the same id and email answer the same pending session and send no second code. A store's sign-in (`store_id`) opens only that store.

- **Store sign-in.** Pass `store_id` and the code email's `language` to `requestCode`, and `store_id` to `verify`, to sign in through a store's own site. Other stores, platform administration, creating a store and deleting the Account refuse that session (deleting the Account with `ACCOUNT.ARKY_SIGN_IN_REQUIRED`), and its session list shows only that store's sessions.
- **Sign-in refusals** carry their own codes: `ACCOUNT_SIGN_IN.CODE_RECENT`, `ACCOUNT_SIGN_IN.CODE_INVALID`, `ACCOUNT_SIGN_IN.ATTEMPTS_EXHAUSTED`, and `STORE_SIGN_IN.UNAVAILABLE` while a store's email sending is paused or its plan has lapsed. The same `session_id` with another email, through the other sign-in or after its code was used answers 409 `GENERAL.CONFLICT`.
- **Session refresh.** Only Arky's own refusal of a refresh (401 `GENERAL.UNAUTHENTICATED` or 403 `GENERAL.UNAUTHORIZED` in Arky's error body) clears the kept session and reports `null` to `onAuthStateChanged`. Any other failed refresh, such as a 401 or 403 from a proxy in front of Arky, a 429, a 5xx or a lost answer, fails that request and keeps the session for the next try.
- **Restored tokens.** A process restoring an Account access token can pass a `forcedHeaders` callback with its Bearer `Authorization` header and `onUnauthorized: () => false`.
- **API keys.** Store API keys are made with `admin.store.apiKey`: a publishable key belongs to one sales channel, and a secret key carries explicit store permissions. Orders, Payments and Customers carry `access: "read_write" | "read_only"` in roles and secret keys alike: read-only reads what the full permission reads and is refused every write.

| Namespace | What it covers |
|---|---|
| `account` | `getMe`, `find`, `delete`, `session`, `auth` |
| `platform` | `findCurrencies`, `findWebhookEvents`, `findStorePlans`, `administrator`, `stripeBillingEvent`, `resendEvent` |
| `store` | the store, `subscription`, `usage`, `member`, `emails`, `role`, `webhook`, `country`, `location`, `market`, `salesChannel`, `apiKey`, `paymentOption`, `simulator`, `zone`, `taxCategory`, `shippingProfile`, `shippingMethod` |
| `notification` | `outgoingEmail`, `outgoingWebhook`, `incomingWebhook`, `template`, `layout`, `emailProvider`, `emailAddress`, `resendEvent` |
| `broadcast` | one email to the members of packages |
| `support` | `flow` and `conversation` (chat and email in one record) |
| `media`, `category`, `content` | files, categories, collections and entries |
| `forms` | forms, submissions, stage changes, files, `notes` |
| `companies`, `customers` | companies with locations, roles, memberships and notes; customers with sessions, email suppressions, notes, `erase` and `merge` |
| `actions`, `experiments`, `counts` | the customer timeline, A/B tests (`getResults`), the store's counts (`getStatuses`, `getReport`) |
| `eshop` | products, variants, digital assets, bookings, packages with their items, `packageItemPrice` and `packageAccess`, offerings and members, promotions, payment methods, payments, carts, orders (with `resumePayment`, credits and notes), inventory, fulfillment, returns and rentals |

- **Provider webhooks.** Arky never creates, replaces or deletes a webhook at Stripe or Resend: the merchant makes one at Arky's address and pastes its signing secret. A Stripe option saves it with `store.paymentOption.stripe.saveWebhookSecret`, for the first paste and every roll; a Resend connection carries it as `webhook_secret` in `notification.emailProvider.connect` and `replaceKey`. `stripe.checkSetup` and `emailProvider.checkSetup` answer the address and events to set and name each problem they find.
- **Card payment posts.** `notification.incomingWebhook.find({ payment_option_id, status })` lists one Stripe or Monri option's received posts.
- **Monri.** `store.paymentOption.monri.replaceMerchantKey` gives an option a new merchant key, and `eshop.payment.recordMadeRefund` records a refund already made in Monri's back office.
- **Support.** `support.conversation.assign({ expected_account_id, account_id })` and `selectReplyEmail({ expected_reply, reply })` name the value they read.
- **Sent history.** `notification.outgoingEmail.find` takes `order_id` only with `type: "receipt_resend"`: it finds that Order's receipt resends.
- **Member terms.** `eshop.packageMember.reviewTerms` and `changeTerms` send the whole accepted `terms`, its `purchase_order_number` included (`null` for a person's membership). The store team never makes a renewing membership's next renewal charge more (`PACKAGE_MEMBER.HIGHER_PRICE`, see [Changing a package](#changing-a-package)).
- **Stage-change notes.** A stage change that names a note writes it with the target `{ type: "form_submission_stage_change", form_submission_id, changed_at }`, the change it explains, and the submission's `stage_history` names no note. The note lists with the submission's notes and its author can edit it, but deleting it is refused with `NOTE.STAGE_CHANGE_REASON`.
- **Collection cleanup.** `content.collection.getCleanup({ store_id, id })` shows a deleting collection's cleanup: `running`, or the entry or collection where it stopped with what blocks it.
- **Packages and their automatic items.** `eshop.package.create` and `update` save a package and its automatic items together: `items` is a list of operations, `{ action: "create", id, type }`, `{ action: "update", id, expected_updated_at, type }` and `{ action: "delete", id, expected_updated_at }`, where `type` is a `get_product` or `rent_product` type. A `get_product` delivery is `none`, `once_per_period` or `repeating_in_period`. A stay ends with `renew`, `renew_once`, `continue_without_stay` or `stop`. A `variants` minimum lists `variant_ids`, and each unit counts by its variant's `measure`. A `schedule` that names only an end, `{ type: "scheduled", starts_at: null, ends_at }`, starts at the save's own time. `find` lists packages with `automatic_item_count` and `market_ids`, and `get` and `getByKey` answer `items` too. `eshop.package.copy({ store_id, id, source_package_id, source_market_id, target_market_id, cursor })` copies one market's priced items.
- **Priced items.** `eshop.packageItem` creates one per parent and market (`{ store_id, id, package_id, market_id, item }`), and `update` changes only its `position`. `item` is `{ type: "product", product_id }`, `{ type: "booking_service", booking_service_id }` or `{ type: "package", package_id, price: { id, amount, compare_at, changes, schedule, status } }`: a plan is listed together with its one price, `0` when the plan is free. An item's prices sit in their wrappers: a `product` item's `prices` are `{ variant_id, price }`, a `booking_service` item's `{ booking_offering_id, price }`, and a `package` item holds one `price`, which can be archived or removed with the item but never deleted alone (`PACKAGE_ITEM_PRICE.REQUIRED`). An item has no status or schedule of its own: `setAllPrices({ store_id, id, expected_updated_at, status, schedule })` archives or schedules all its prices at once, applying started dated changes first, and it forgets which were already archived.
- **Item prices.** Prices live inside their item and change only by named operations on `eshop.packageItemPrice`: `create`, `update` with that price's own `updated_at`, `delete` and `batch`. A price answer carries `package_item_updated_at`, the item's new version, so a later reorder gives no false stale error. `getByChoice({ store_id, package_item_id, sellable })` reads one item's price for one choice exactly, archived or not, and answers 404 when that choice has no price. `find` names a `package_item_id` or a `sellable` and answers `{ items, cursor }` straight from Arky's own records. A price answer names its choice as `sellable`, taken from its wrapper.
- **Access rows.** `eshop.packageAccess` creates and deletes rows, never edits them, so a row has no `updated_at`: `delete({ store_id, id })` names only the row, and `find` lists a package's rows by `created_at`, with `sort_direction`.
- **Offerings.** `eshop.packageOffering` saves `{ key, blocks, package_ids }`. An offering has no status: each of its packages sells, takes joins and moves under its own status and schedule.
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

What a delete answers is what Arky answers:
- the record marked `deleting`, for records that clean up after themselves: markets, store locations, packages, products, booking services, offerings and resources, categories, collections, media and companies. Variants, promotions and promotion codes answer it too, or nothing when the record is already gone;
- nothing, for inventory items, package item prices, package items and accesses, package offerings, and experiments. Inventory items have only `active` and `archived` statuses; their delete removes the item and its empty levels together and answers 204;
- `true` or `false`, for email templates, layouts, providers and addresses;
- the note, for notes;
- `{ deleted }`, for every other delete.

## Test stores

A test store is a real store that runs the code a live store runs. Its payments and emails go to Arky's own provider simulator, so no money moves and no mail leaves. You make one and drive it with an Account session or a secret key holding `Admin`.

An Account holds at most 5 test stores at a time, and a store being deleted counts until it is gone (`STORE.TEST_STORE_LIMIT`). `store.mode` is `"live"` or `"test"`, you name it when you make the store, and it never changes. `account.getMe()` answers the count as `test_stores`. A test store holds the test plan for free, can't pick or buy a plan (`STORE_SUBSCRIPTION.TEST_STORE`) and can't change owner (`STORE.TEST_STORE_TRANSFER`).

A store's mode decides what it may connect, and each wrong pairing is refused when the option or connection is made:

| Store | Card payments | Email |
|---|---|---|
| `live` | `stripe` with live keys, `monri` in `live` | `resend` |
| `test` | `arky_stripe`, `arky_monri`, `stripe` with test keys, `monri` in `test` | `arky_resend` |

Making a store sets up no providers, in either mode. A test store's setup script connects them with keyless calls, and nothing picks a provider for you:

```typescript
const store = await admin.store.create({
  id: crypto.randomUUID(),
  mode: "test",
  name: "My shop (test)",
  timezone: "Europe/Sarajevo",
  languages: ["en"],
  market: { key: "eu", currency: "eur", tax_mode: "inclusive" },
  sales_channel: { key: "web" },
  location_address: { country: "BA" },
});

await admin.store.paymentOption.arkyStripe.connect({
  store_id: store.id,
  id: crypto.randomUUID(),
  key: "card",
  blocks: [],
  status: "active",
  saved_card_terms: { en: "Save this card for the renewals you agree to." },
});

await admin.notification.emailProvider.connectArkyResend({
  store_id: store.id,
  id: crypto.randomUUID(),
  name: "Test mail",
  domains: ["shop.example.com"],
});
```

`store.paymentOption.arkyMonri.connect` takes the same fields as `arkyStripe.connect`. A storefront still reads `stripe` or `monri` as the option's `type`; `arky_stripe` and `arky_monri` show only on Admin's `PaymentOption`. To finish with a test store, call `store.requestDeletion`, as for any store.

**Paying in a browser.** On a simulated value `mountCheckoutAction` and `mountPaymentMethodSetup` load no provider script and work on a plain `http` page. They mount a small panel that says it is a test payment, with a button per outcome, each marked `data-arky-simulator-outcome`:

- **Stripe checkout** and a store plan: `complete`, `decline` and `expire`. A click plays that outcome and then runs `onComplete`, and the mount has `type: "simulator"`. A decline leaves the page open for another try.
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

**Driving a test store through the API.** These need `Admin`, and each refuses a live store with `SIMULATOR.LIVE_STORE`:

```typescript
const store_id = "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63";
const payment_id = "f17c0b95-2e4d-4a83-9b6c-31d5e8a70f24";

await admin.store.simulator.payments.pay({ store_id, payment_id });

const emails = await admin.store.simulator.emails.find({ store_id, to: "buyer@example.com", limit: 10 });
console.log(emails.items[0]?.subject, emails.items[0]?.text);

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
- **Planned outcomes.** `plannedOutcomes.create` makes the next matching call of one operation fail or wait, once. `matching` is `{ type: "any" }`, `{ type: "to", address }` for `send_email`, or `{ type: "payment", payment_id }`. `outcome` is `refused`, `rate_limited`, `unavailable`, `lost_response`, `delayed`, `declined`, `missing_link` or `expired_link`. `plannedOutcomes.find` lists the plans not used yet, and `plannedOutcomes.remove` answers `{ deleted }`.

Nothing moves the clock, so month ends and expiry dates can't be reached ahead of their date.

**Going live.** Make a second store as `mode: "live"` with the same setup script and live keys. Test data never moves. Arky's address stays the same: a site's environment names the store and its publishable key, and its code doesn't change, because the checkout answer says where each payment runs.

## Utilities

`arky-sdk/storefront` exports the helpers a storefront uses. Each one that shows text takes the locale explicitly.

- **Blocks:** `findBlock(record, key)`, `getBlockTextValue(block, locale)`, `getBlockValue(record, key)`, `getBlockContentValue(record, key, locale)`, `getBlockValues(record, key)`, `formatBlockValue(block, locale)`, `selectLocalizedText(value, locale)`, `getImageUrl(media, size)`, and `collectBlockReferences(blocks)`, which answers `{ media_ids, entry_ids, form_ids, product_ids }`.
- **Money:** `formatPrice(price, locale)`, `formatMoney(money, locale)`, `formatMinor(amount, currency, locale)`, `getPriceAmount`, `getCurrencySymbol`, `getCurrencyName`, `getCurrencyMinorUnits`, `convertToMajor`, `convertToMinor` and `CURRENCY_MINOR_UNITS`. Money is integer minor units with a `Currency`.
- **Time:** moments are epoch milliseconds (`epochMilliseconds`, `epochMillisecondsNow`, `epochMillisecondsFromDate`, `epochMillisecondsToDate`); days are `"YYYY-MM-DD"`.
- **Paging:** `readAllPages(read)` and `paginate(read)` refuse a cursor that doesn't advance and stop after `max_pages` (1,000 unless you say otherwise).
- **Payments:** `paymentOutcome`, `latestPayment` and `paymentAmounts`; `mountCheckoutAction` and `mountPaymentMethodSetup`.
- **Forms:** `buildFormAnswers(form, values)` and `formValuesFromAnswers(answers)`.
- **Lines:** `cartProductItems(cart)`, `cartBookingItems`, `cartPackageItems`, `orderProductItems(order)`, `orderBookingItems`, `orderPackageItems`, `orderRentalUseItems` and `orderLineItemsOfType(order, type)` pick the lines of one type.
- **Ids:** `requireId`, `isCanonicalId`, `createOrderToken` and `isOrderToken`.
- **Provider simulator.** `isSimulatedPayment(value)` says a checkout action, card setup or store plan action runs on Arky's provider simulator, and `simulatePayment({ simulation }, { signal? })` plays its outcome ([Test stores](#test-stores)).

`arky-sdk/utils` has the same helpers, without the payment mounts, the simulator, the line pickers and `CURRENCY_MINOR_UNITS`, plus a few for apps and back offices:
- key checks: `isValidKey`, `validateKey` and `toKey`; currencies: `isCurrency` and `SUPPORTED_STORE_CURRENCIES`;
- requests an app makes retry-safe itself: `getOrCreateDurableRequest`, `readDurableRequest`, `durableRequestPayload`, `clearDurableRequest` and `withDurableRequestLock`;
- `pollScheduledResult(first, read, isPending, signal?)`, which reads again until work Arky runs later is done and throws `ScheduledResultTimeoutError` after 20 seconds;
- the Admin fulfillment unit helpers and store permission checks;
- `copyPackagePriceRef(price)`, which copies the `{ package_id, package_item_id, price_id }` a cart line names out of a price answer.

## Releasing

SDK packages are released by tagging the protected `master` commit with `v<package.json version>`. The `Publish SDK` workflow runs the tests and publishes with npm provenance. Version bumps are patch-only.
