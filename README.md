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
| A website or web app | `initialize(publishableKey, options)`: the client plus reactive atoms, a cart store per buyer and catalog, a headless checkout and a booking calendar | `arky-sdk/storefront` |
| Server code, or your own state layer | `createStorefront(publishableKey, options)`: the plain storefront client, the same calls without atoms | `arky-sdk/storefront` |
| Staff tools, scripts, back offices | `createAdmin({ apiUrl, secretKey? })` | `arky-sdk/admin` |

`arky-sdk/storefront` exports everything a storefront needs: both clients, the helpers (prices, blocks, images, paging, payments, forms), the error classes and every type. `arky-sdk/utils` holds the helpers on their own, and `arky-sdk/types` the types with the error classes and constants.

## How every call works

- **One params object, then request options.** A call takes one object of Arky's own fields, then optional request options: `signal`, `headers`, `onSuccess`, `onError`, and on the storefront `locale`, `market` and `order_token` for that one request. A call with nothing to send, such as `customer.getMe()`, takes only the options. Admin calls that act on a store name its `store_id`.
- **One verb per kind of action.** `find…` reads a list. `get…` reads one record or view: `get({ id })`, `get({ slug })` where a record has slugs, `getByKey({ key })`. Records change through `create`, `update` and `delete`. A cart or a checkout changes through `add…`, `remove…`, `set…` (replace a value) and `select…` (pick one of the offered choices). Business actions keep their own names: `quote`, `shipTo`, `checkout`, `place`, `submit`, `cancel`, `pause`, `requestCode`, `verify`.
- **One casing rule.** Arky's data is snake_case: params, answers, atoms and the helpers' results. The SDK's own setup options and callbacks are camelCase: `apiUrl`, `createId`, `onComplete`.
- **Every list answers a page.** `{ items, cursor }`, with `cursor: null` on the last page. Pass the cursor back to read the next page, or let `readAllPages(read)` collect them and `paginate(read)` walk them. A missing record is an `ArkyApiError` with code `GENERAL.NOT_FOUND`.
- **The app picks every id.** A create takes the record's `id`, a canonical UUID v4 the app makes once per user action and sends again on every retry. The same request under the same id answers the stored record; a different request under it is refused (409). The SDK never makes an id up: storefront calls that leave the `id` out take it from your `createId` factory.
- **Changes carry the version they read.** Updates and actions send `expected_updated_at` (the `updated_at` you read); a stale one is refused with 409. The cart store sends it for you.
- **Context is explicit.** Storefront requests carry the publishable key, which decides the sales channel, plus the locale and the market you set with `setContext({ locale, market })`. A call names the catalog it reads, and the company or one of its locations it acts for, never both.
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
const { items: catalogs } = await arky.eshop.catalog.find();
const catalog = catalogs.find((candidate) => candidate.key === "public-eu");
console.log(setup.name, setup.languages, arky.currency.get(), catalog?.id);
```

- **The four factories are required.** The app picks every customer, session and record id and every order token; `createOrderToken` makes a token in the shape Arky accepts. Without them `initialize` throws.
- **`apiUrl`** defaults to `https://api.arky.io`. Only an `arky_pk_...` publishable key is accepted.
- **Sessions** are kept in `localStorage`. During server rendering, pass a request-local `sessionStorage` adapter. `visitorIdentity` restores a visitor pair your app picked earlier.
- **`arky.store.load()`** reads the store's setup and the current market and fills the `setup`, `market`, `currency` and `allowed_payment_option_ids` atoms. `arky.getSetup()` only answers the setup: `name`, `timezone`, `languages`, `payment_options` and `bot_check`.
- **Catalogs.** `eshop.catalog.find()` lists the catalogs open to this buyer in the current market and sales channel, each with its access `level`. Pick yours by its `key`; every listing, product, booking and cart call names its `catalog_id`.
- **`setContext({ locale, market })`** changes the language or the market. A market change clears every cart view; each market keeps its own carts, and switching back reads them again.

The store has the same calls as the plain client, under the same names. On top of them it has atoms (`session`, `setup`, `market`, `currency`, `locale`, …) and three helpers, each for one buyer and catalog: `eshop.cart(scope)`, `eshop.checkoutFlow(scope)` and `eshop.bookingCalendar(scope)`. The plain client's own cart calls stay reachable at `arky.client.eshop.cart`.

## 2. Products

A catalog lists products, booking services, customer groups and group offerings. `eshop.catalogItem.find` pages them as cards, one per listing:

```typescript
import { findBlock, formatMinor, getBlockTextValue, getImageUrl } from "arky-sdk/storefront";
import type { CatalogListing, Media } from "arky-sdk/storefront";

const page = await arky.eshop.catalogItem.find({ catalog_id, include_price: true, selection: { types: ["product"] }, limit: 24 });
const imageIds = page.items.flatMap((listing) => {
  const image = findBlock(listing.content, "image");
  return image?.type === "media" && image.value ? [image.value] : [];
});
const { items: images } = await arky.media.find({ ids: imageIds });
const imageById = new Map<string, Media>(images.map((image) => [image.id, image]));

const cards = page.items.map((listing: CatalogListing) => {
  const image = findBlock(listing.content, "image");
  const summary = listing.price_summary;
  return {
    name: getBlockTextValue(findBlock(listing.content, "name"), "en"),
    image: image?.type === "media" && image.value ? getImageUrl(imageById.get(image.value), "medium") : null,
    from: summary?.type === "comparable" && listing.currency ? formatMinor(summary.min_amount, listing.currency, "en") : "",
    href: `/products/${listing.content.slugs.en}`,
  };
});
console.log(cards, page.cursor);
```

- **One search for every listing.** A card names its `catalog_item_id`, what it lists (`item`), its `position` and the listed record's `content` (`key`, `slugs`, `blocks`, `categories`). `selection` narrows and orders the cards:
  - `types` (`product`, `booking_service`, `customer_group`, `customer_group_offering`), `text`, `categories` (for products and booking services) and block filters `blocks`;
  - `choice`, a filter on the priced choices: a `sku` (products only), choice `blocks` and `price: { min_amount?, max_amount? }`;
  - `price_basis` (`product_unit`, `booking_option`, `permanent_agreement` or `recurring_agreement` with its `cadence`);
  - `sort`: `catalog_order` (the default), `relevance` (needs `text`) or `starting_price` (needs `price_basis`), and `direction`, `asc` unless you ask for `desc`. Relevance has no descending order.
- **Prices on cards.** With `include_price: true` and an access level that shows prices, a card has its `currency` and `price_summary`: `{ type: "comparable", basis, min_amount, max_amount, choice_count }`, or `{ type: "different_bases", choice_count }` when its choices aren't priced the same way. A price filter or a starting-price sort also answers the card's `matching_price`. A standalone customer group card names its only price, `catalog_item_price_id`.
- **Pages.** A page holds 20 cards unless you ask for more, and a page can come back short with a `cursor`: follow it.
- **Media.** `media.find({ ids })` takes any number of ids and reads them 100 at a time. Every file has its public URL at `content.original.url`. Images also come as `thumbnail`, `small`, `medium` and `large`, and `getImageUrl(media, size)` picks one.
- **Texts are blocks.** `findBlock(record, key)` finds a block and `getBlockTextValue(block, locale)` reads its text in the language you name, never another; an empty string means there is none. Pass a second language as the third argument when your page has one to show instead.

A product page reads the product by its slug in the current language, then the prices of its listing:

```typescript
const product = await arky.eshop.product.get({ slug: "classic", catalog_id });
const { items: choices } = await arky.eshop.catalogItem.findPrices({ catalog_item_id: product.catalog_item_id, catalog_id, include_price: true });
const byKey = await arky.eshop.product.getByKey({ key: "classic-x1", catalog_id });
console.log(choices.map((choice) => [choice.catalog_item_price_id, choice.content.sku, choice.price?.unit_price.amount]), byKey.id);
```

- **Reads.** `get` takes `{ id }` or `{ slug }`; a key is read with `getByKey({ key })`. Both answer the product with the `catalog_item_id` of its listing in that catalog. Booking services and categories read the same way; collections, forms, markets, customer groups and their offerings read by `{ id }` or with `getByKey({ key })`.
- **Choices.** `catalogItem.findPrices({ catalog_item_id })` pages a listing's choices. Each names its `catalog_item_price_id`, the `sellable` it prices (a `product_variant`, `booking_offering` or `customer_group`), its `content` (`sku`, `blocks` and the price `basis`) and, with `include_price: true`, its `price`. A cart line names the `catalog_item_price_id` it is bought at.
- **More reads.** `catalogItem.getByParent({ item: { type: "product", product_id } })` reads the listing of a record, and `productVariant.get({ product_id, id })` reads one variant, with its price when you pass `include_price: true`.

## 3. Cart

`arky.eshop.cart({ buyer, catalog_id })` answers the cart store of that buyer and catalog: the same store on every call, shared with the checkout flow and the booking calendar of the same buyer and catalog.

```typescript
const cart = arky.eshop.cart({ buyer: { type: "customer" }, catalog_id });
cart.item_count.subscribe((count) => console.log("items", count));
cart.status.subscribe((status) => console.log(status.error?.code));

await cart.ensure();
await cart.addProduct({ variant_id, quantity: 1, purchase: { type: "catalog", catalog_item_price_id } });
const [line] = cart.product_items.get();
if (line) {
  await cart.setProductQuantity({ line_item_id: line.id, quantity: 2 });
  await cart.removeItem({ line_item_id: line.id });
}
```

- **Atoms:**
  - `cart`, `product_items`, `booking_items`, `customer_group_items`, `item_count`;
  - `quote_result`, `promotion_codes` and `last_order`;
  - `status`: `loading`, `syncing`, `fetching_quote`, `processing_checkout`, `error` and `quote_error`, where an error is `{ code, message }`.
- **Reads:** `ensure()` loads the cart this browser selected for the buyer and catalog, or creates one under an id from `createId`, kept across a lost answer. `load()` only loads; `create({ id? })` only creates.
- **Changes:** each answers the changed cart and sends the cart id and version for you. Line ids come from `createId` when you leave them out.
  - lines: `addProduct`, `addBooking`, `addCustomerGroup`, `setProductQuantity({ line_item_id, quantity })`, `removeItem({ line_item_id })`, `clear()`;
  - checkout details: `shipTo({ destination, contact_email? })`, `setDeliveryGroups({ delivery_groups })`, `selectShippingMethod({ shipping_method_id })`, `setBillingAddress({ billing_address })`, `setBuyer({ buyer })` (a company buyer's `purchase_order_number`), `setPromotionCodes({ promotion_codes })`;
  - group deliveries: `setFutureDeliveries({ customer_groups })` and `quoteFutureDeliveries({ customer_groups })`.
- **Quote and checkout:** `quote({ contact_email? })`, `checkout(...)`, `retainCheckout(...)`, `pendingCheckout()` and `recoverCheckout()`. Most pages use the [checkout flow](#4-checkout) instead.
- **After a failed write:** a write whose answer is lost, or that is refused because the cart changed (409), drops the view: `cart` and `quote_result` turn `null`, and the next `ensure()` reads the current cart. `reset()` drops the view by hand; `clear()` empties the cart in Arky.
- **Prices.** A product line names how it is bought: `purchase: { type: "catalog", catalog_item_price_id }` for one of its listing's prices, read with `catalogItem.findPrices`. Lines that use a customer group's purchase access name `existing_purchase_access`, `same_cart_purchase_access` or `assigned_purchase_access` instead. Booking and customer group lines name their `catalog_item_price_id` too.

A cart line names its variant. To show names, quote the cart and read its products:

```typescript
import { findBlock, getBlockTextValue } from "arky-sdk/storefront";

const cart = arky.eshop.cart({ buyer: { type: "customer" }, catalog_id });
await cart.ensure();
const quote = await cart.quote();
const productIds = [...new Set(quote.lines.flatMap((line) => (line.type === "product" ? [line.product_id] : [])))];
const products = await Promise.all(productIds.map((id) => arky.eshop.product.get({ id, catalog_id })));
const names = new Map<string, string>(products.map((product) => [product.id, getBlockTextValue(findBlock(product, "name"), "en")]));
console.log(quote.lines.map((line) => (line.type === "product" ? names.get(line.product_id) : line.type)), quote.totals.total);
```

The quote is in the store's locale, and each product line's `snapshot` keeps the variant's `variant_sku` and `variant_blocks` as they were quoted. `quote.ready` is false while `quote.blockers` lists what is missing: a delivery, a shipping choice, a billing address, a taken booking slot, and so on. Each delivery's `offers` name their shipping method by `shipping_method_key` and `shipping_method_blocks`, so a page can show "Courier €45". A rate that needs a weight Arky doesn't know is left out of `offers` and listed in the delivery's `unavailable` with its `code` (`SHIPPING.WEIGHT_UNKNOWN`).

## 4. Checkout

`arky.eshop.checkoutFlow({ buyer, catalog_id })` is a headless checkout for your own cart page: steps, state and errors, and no UI.

```typescript
import { mountCheckoutAction } from "arky-sdk/storefront";

const checkout = arky.eshop.checkoutFlow({ buyer: { type: "customer" }, catalog_id });
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
  - `cart`: no lines, or a line that can't be bought as it is (a taken booking slot, a purchase limit), named in `quote.blockers`;
  - `details`: the contact email, an address, the billing address or a purchase order number is missing;
  - `shipping`: a delivery needs its shipping choice;
  - `payment`: ready to place;
  - `paying`: the order waits for its payment, or a kept checkout waits for `recover()`;
  - `placed`: paid, to pay later (cash on delivery), unconfirmed (the provider's answer needs checking) or free.
- **State:** the `cart`, the `quote` with its `blockers`, `contact_email`, `destination`, `billing_address`, the chosen `payment_option_id` (the quote's suggestion until you pick one), the `pending` request, the `placed` order, its `payment` and `outcome`, `busy` and `error`.
- **Steps you call.** Each step that reads or writes Arky answers the new state. `setContact` and `selectPaymentOption` only change the state.
  - `open()` and `refresh()` (quote again);
  - `setContact({ contact_email: { email, language } })`, `shipTo({ destination })`, `setBillingAddress({ billing_address })`;
  - `selectShipping({ delivery_group_id, shipping_method_id, rate_id })` and `selectPaymentOption({ payment_option_id })`;
  - `setPromotionCodes({ promotion_codes })`;
  - `place({ return_url?, save_payment_method?, payment_method_terms? })`.
- **Contact email.** The order's contact is an email with the language its emails are written in. `open()` starts from the signed-in customer's verified contact, or the billing address email in the store's locale. After `setContact`, every quote sends the email, so a guest can use a promotion code limited to one use per customer. A company buyer's purchase order number is set with `checkout.cart.setBuyer({ buyer })`.
- **On account.** `place` pays with one of the quote's payment options, or places a free order. A company buyer with on-account terms checks out through the cart store instead: `checkout.cart.checkout({ contact_email: { email, language }, payment: { type: "on_account", payment_option_id } })`.
- **After placing:** `recover()` finishes a kept checkout, `resumePayment()` asks for a new payment action for an unpaid order, `refreshPayment()` reads the payment again, and `openOrder({ order_id, url })` reopens an order after a payment redirect. `openOrder` answers `{ state, url }`, where `url` is the link without its order token.
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

const placed = arky.eshop.checkoutFlow({ buyer: { type: "customer" }, catalog_id }).state.get().placed;
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

Saved cards use `eshop.paymentMethod.requestSetup`, `startSetup`, `mountPaymentMethodSetup({ setup, element })` and its `confirm({ return_url })`, then `completeSetup`.

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
- **Session lifetime.** A signed-in session's access token lasts an hour; the SDK refreshes it on the first 401 and keeps every cart and checkout view. A session that can't be refreshed is cleared and reported to `onAuthStateChanged` and the `session` atom. Changing the shopper, signing out or switching markets clears checkout contact, delivery, payment selection and the displayed order. A late response from the previous context cannot restore them; kept checkout requests remain available for explicit recovery.
- **Email changes.** On a signed-in session, `requestCode` starts an email change: the code goes to the new address and `changeEmail({ code })` proves it. `updateMe` changes the profile blocks and the addresses, never a verified email. `unsubscribe()` and `resubscribe()` record the customer's email choice.

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
- **Answer errors.** A value that doesn't fit throws a `FormAnswerError` with the question's key and a code: `required`, `invalid`, `too_short`, `too_long`, `pattern_mismatch`, `too_small`, `too_large`, `unknown_option`, `too_many_files`, `file_size`, `files_too_large`, `file_name` or `unknown_question`.
- **Empty answers** are left out. File answers carry `File` objects and are sent as multipart: up to 10 MiB a file, 20 files and 50 MiB a submission.
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

`arky.eshop.bookingCalendar({ buyer, catalog_id })` builds a month calendar and the free slots of a booking service, and adds a chosen slot to that buyer's cart:

```typescript
const { items: services } = await arky.eshop.catalogItem.find({ catalog_id, selection: { types: ["booking_service"] }, limit: 20 });
const calendar = arky.eshop.bookingCalendar({ buyer: { type: "customer" }, catalog_id });

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
  - the service: `booking_service`, `booking_choices` (the prices of its offerings in this catalog), `booking_resources`, `selected_booking_resource_id`, `availability`, `timezone` and `loading`;
  - the calendar: `month` and `days` (`date`, `iso`, `available`, `is_selected`, `is_in_range`, `is_today`, `blank`), plus the `calendar.month_label` atom with the shown month in the store's language;
  - the choice: `selected_date`, `slots` (`booking_offering_id`, `catalog_item_price_id`, `price`, `from`, `to`, `time_text`, `date_text`, `is_multi_day`) and `selected_slot`.
- **Calls.** Steps that read Arky answer the new state; picks only change the state.
  - reads: `select({ booking_service_id })`, `prevMonth()`, `nextMonth()`, `selectResource({ booking_resource_id })`, `loadMoreChoices()` and `loadMoreAvailability()`;
  - picks: `selectDate({ date })`, `selectFirstAvailableDate()`, `selectSlot({ slot })` and `setTimezone({ timezone })`;
  - `addToCart({ slot, id?, capacity_units?, form_submission_id? })` answers the cart.
- **Prices and resources.** `select` reads the service and the first page of its listing's prices; a slot shows once its offering's price is loaded, so call `loadMoreChoices()` while `booking_choices_cursor` is set. The resources come with the availability, and the calendar reads each new one once.
- **Stays.** A slot that spans days (a stay of several nights) is `is_multi_day`, its `time_text` is the date range, and its days are `is_in_range` once it is chosen. With bookings already in the cart, the calendar starts after the last one.

The cart and the checkout are the same as for products: the `checkoutFlow` of the same buyer and catalog sees the booking lines.
- **Without the calendar,** read the service with `bookingService.get({ id, catalog_id })`, its offerings' prices with `catalogItem.findPrices({ catalog_item_id, catalog_id })`, and the free slots with `bookingService.getAvailability({ catalog_id, booking_service_id, from, to })` (at most 60 days per read; follow `cursor`). Add a slot with `cart.addBooking({ booking_offering_id, requested_interval, capacity_units, catalog_item_price_id })`. `bookingOffering.get({ id, catalog_id })` reads one offering with its price, and `bookingResource.get({ id, offering_id, catalog_id })` the resource that provides it.
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
| `CustomerGroupJoinError` | a free group sign-up | `sign_in_required`, `email_mismatch`, `not_free`, `sign_up_used`, `sign_up_expired` |
| `ScheduledResultTimeoutError` | `pollScheduledResult` stopped waiting | `timeout` |
| `FulfillmentSelectionError` | an Admin fulfillment unit helper got a wrong selection | `invalid_selection` |
| `ArkyError` itself | anything else | `not_found` (content), `invalid_link` (order link), `answer_mismatch` (an answer names another record), `no_session`, `token_conflict` and `storage` (order tokens), `too_many_pages` (paging), `unavailable` (Stripe.js didn't load), `invalid_details` and `declined` (saving a card), `not_sent` (page view), `not_confirmed` (payment simulator), and on the Admin client `session_changed` and `refresh_failed` |

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
- **Kept requests.** A checkout, a free group sign-up and a kept form submission keep their whole request, and drop it on a success or a definite refusal.
- **Light creates.** Form submissions, support conversations and messages, and sign-in code requests keep only their id and a fingerprint of the request.
- **Cart writes** in a browser need `localStorage` and Web Locks too, because they check that no checkout of that cart is unfinished.

A checkout without `order_id` and `order_token` takes them from the factories and keeps the request before it is sent. Sending the same checkout again recovers the kept one; a different one is refused (`DurableRequestError` `pending`) until it is recovered. The store's cart keeps its checkout in its own buyer and catalog scope, so a company's branches check out side by side. The plain client's `eshop.cart.checkout` keeps it in one shared slot unless you pass `scope: { buyer, catalog_id }`; `pendingCheckout({ scope })` and `recoverCheckout({ scope })` read and finish it.

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

const listings = await readAllPages((cursor) => client.eshop.catalogItem.find({ catalog_id, selection: { types: ["product"] }, limit: 100, cursor }));
const created = await client.eshop.cart.create({ id: crypto.randomUUID(), buyer: { type: "customer" }, catalog_id });
const cart = await client.eshop.cart.addProduct({
  id: created.cart.id,
  expected_updated_at: created.cart.updated_at,
  product: { id: crypto.randomUUID(), variant_id, quantity: 1, purchase: { type: "catalog", catalog_item_price_id } },
});
const quote = await client.eshop.cart.quote({ id: cart.id, contact_email: "ana@example.com" });
console.log(listings.length, quote.ready, quote.blockers);
```

Its cart calls name the cart and its version:
- **Selection:** `cart.create`, `getCurrent({ buyer, catalog_id })` (the cart this browser selected, or `null`), `forget({ buyer, catalog_id })` and `reorder({ id, order_id, buyer })`.
- **Reads and changes:** `get`, `update`, `addProduct`, `addBooking`, `addCustomerGroup`, `removeItem`, `clear` and `selectShippingMethod`.
- **Quote and checkout:** `quote({ id, contact_email? })`, `checkout`, `retainCheckout`, `pendingCheckout` and `recoverCheckout`. A quote takes the guest's email as a string; a checkout's `contact_email` is `{ email, language }` or `null`.
- **After checkout:** `getOrder({ id })` (the order the cart became, or `null`) and `findOffers` (a company's offered carts).

A checkout refused because the quote changed throws a `CartPresentationChangedError` with the new quote. Send the guest's `contact_email` with the quote once you know it: a promotion code limited to one use per customer counts a guest by that email, and without it the quote is refused with 409 `CART.PROMOTION_EMAIL_REQUIRED`.

## More of the storefront

- **`eshop.order`:** `find`, `get`, `fromLink`, `retainedToken`, `findPayments`, `getPayment`, `findFulfillments`, `resumePayment` (a new payment action for an unpaid order), `downloadAsset`, `cancelProductItem`, `cancelBookingItem` and `rescheduleBookingItem`. Order lists filter booking lines by `booking_statuses`.
- **`eshop.promotion.get({ id })`:** the text shoppers see for a promotion, `{ id, key, blocks }`.
- **`eshop.library`:** `find`, `getProduct`, `findAssets` and `download`, for the digital files the buyer owns. Pass `company_id` or `company_location_id` for a company's.
- **Customer groups:** groups a store sells are listed with `catalogItem.find` and read like products: `eshop.customerGroup` (`get`, `getByKey`, `getProductChoices`, `joinFree`) and `eshop.customerGroupOffering` (`get`, `getByKey`), each with the `catalog_id` it is listed in. A group or offering read answers its `catalog_item_id`; `catalogItem.findPrices` pages its prices.
  - `joinFree({ key, catalog_id })` (or `{ id, catalog_id }`) joins a signed-in customer to a free permanent group. It reads the group's price in that catalog, creates its own cart, checks the quote is free and places the zero-price order, with every id from the factories. It answers `{ type: "joined", order_id }` or `{ type: "already_member", customer_group_member_id }`.
  - A cart buys a group with `addCustomerGroup({ customer_group_id, quantity, choices, start, catalog_item_price_id })`, where `start` is `{ type: "on_acceptance" }`, `{ type: "scheduled", starts_at }` or `{ type: "switch", customer_group_member_id }`.
  - `getProductChoices` answers a group's product alternatives with their `sku`, `product_blocks` and `variant_blocks`.
- **`newsletter`:**
  - `requestCode({ contact: { email, language } })` answers `{ type: "verified" }` when that address is already signed in. Otherwise it signs out another address and sends a code, answering `{ type: "code_sent" }`.
  - `join({ email, code, key, catalog_id })` verifies the code and runs `joinFree`.
- **`eshop.customerGroupMember`:**
  - reads: `find`, `get`, `getCurrent`, `findOrders`, `getRevision`, `getPurchaseAccess`, `getCalendar`, `getProductChoices` and `getDeliveryOptions`;
  - the member's actions: `cancel`, `pause`, `resume`, `skipNext`, `selectPaymentMethod`, `reviewSwitch`, `switch`, `reviewTerms`, `changeTerms` and `withdrawRevision`.
- **Other eshop reads:** `eshop.minimumProgress.get`, `eshop.paymentMethod` (saved cards), `eshop.rental` (`find`, `get({ id })`) and `eshop.return` (`create`, `get({ id })`, `find`, `getOrderOptions`, `findRentalOptions`).
- **`companies`,** the signed-in customer's companies: `getAccess({ id })`, `membership.find`, `location.find` and `location.get({ id })`.
- **`store`:** `country.find`, `country.get({ code })`, `location.find`, `location.get({ id })`, `market.find`, `market.get({ id })`, `market.getByKey({ key })` and `load()` (on the store only).
- **`category`:** `get`, `getByKey` and `findChildren({ id })`.
- **`support.conversation`:** `start({ language, flow_key? })`, `get({ id })`, `findMessages({ conversation_id })`, `getMessage({ conversation_id, message_id })` and `sendMessage({ conversation_id, input, prompt_message_id? })`, under the customer's own session. `start` and `sendMessage` take their ids from `createId`. A `flow_email_contact` prompt is answered with `input: { type: "email_contact", contact }`.
- **Tracking:**
  - `actions.track({ key, data? })`;
  - `experiments.use({ key })`: call it only where that version is shown;
  - `pageViews.send({ path, referrer })`: one `navigator.sendBeacon`, with no session or customer id.

## Admin client

Digital asset uploads have a 50 MiB request limit in production, including multipart overhead.
An oversized request returns HTTP 413. Form attachments have their separate
10 MiB per-file and 50 MiB per-submission limits.

```typescript
import { createAdmin } from "arky-sdk/admin";

const admin = createAdmin({ apiUrl: "https://api.arky.io", secretKey: process.env.ARKY_SECRET_KEY });
const { items: markets } = await admin.store.market.find({ store_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" });
console.log(markets.length);
```

Without `secretKey`, an Account signs in with a code, and the client keeps and refreshes the Account session:

```typescript
const pending = await admin.account.auth.requestCode({ email: "staff@example.com" });
await admin.account.auth.verify({ session_id: pending.session_id, code: "123456" });
console.log(admin.session?.email);
```

- **Store sign-in.** Pass `store_id` and the code email's `language` to `requestCode`, and `store_id` to `verify`, to sign in through a store's own site.
- **Restored tokens.** A process restoring an Account access token can pass a `forcedHeaders` callback with its Bearer `Authorization` header and `onUnauthorized: () => false`.
- **API keys.** Store API keys are made with `admin.store.apiKey`: a publishable key belongs to one sales channel, and a secret key carries explicit store permissions.

| Namespace | What it covers |
|---|---|
| `account` | `getMe`, `find`, `delete`, `session`, `auth` |
| `platform` | `findCurrencies`, `findWebhookEvents`, `findStorePlans`, `administrator`, `stripeBillingEvent`, `resendEvent` |
| `store` | the store, `subscription`, `usage`, `member`, `emails`, `role`, `webhook`, `country`, `location`, `market`, `salesChannel`, `apiKey`, `paymentOption`, `zone`, `taxCategory`, `shippingProfile`, `shippingMethod` |
| `notification` | `outgoingEmail`, `outgoingWebhook`, `incomingWebhook`, `template`, `layout`, `emailProvider`, `emailAddress`, `resendEvent` |
| `broadcast` | one email to the members of customer groups |
| `support` | `flow` and `conversation` (chat and email in one record) |
| `media`, `category`, `content` | files, categories, collections and entries |
| `forms` | forms, submissions, stage changes, files, `notes` |
| `companies`, `customers` | companies with locations, roles, memberships and notes; customers with sessions, email suppressions, notes, `erase` and `merge` |
| `actions`, `experiments`, `counts` | the customer timeline, A/B tests (`getResults`), the store's counts (`getStatuses`, `getReport`) |
| `eshop` | products, variants, digital assets, bookings, catalogs with their items and `catalogItemPrice`, promotions, customer groups and members, payment methods, payments, carts, orders (with `resumePayment`, credits and notes), inventory, fulfillment, returns and rentals |

What a delete answers is what Arky answers:
- the record marked `deleting`, for records that clean up after themselves: markets, store and company locations, catalogs, products, booking services, offerings and resources, categories, collections, media and companies. Variants, inventory items, promotions and promotion codes answer it too, or nothing when the record is already gone;
- nothing, for catalog item prices, catalog items and accesses, customer groups and their offerings, and experiments;
- `true` or `false`, for email templates, layouts, providers and addresses;
- the note, for notes;
- `{ deleted }`, for every other delete.

## Utilities

`arky-sdk/storefront` exports the helpers a storefront uses. Each one that shows text takes the locale explicitly.

- **Blocks:** `findBlock(record, key)`, `getBlockTextValue(block, locale)`, `getBlockValue(record, key)`, `getBlockContentValue(record, key, locale)`, `getBlockValues(record, key)`, `formatBlockValue(block, locale)`, `selectLocalizedText(value, locale)`, `getImageUrl(media, size)`, and `collectBlockReferences(blocks)`, which answers `{ media_ids, entry_ids, form_ids, product_ids }`.
- **Money:** `formatPrice(price, locale)`, `formatMoney(money, locale)`, `formatMinor(amount, currency, locale)`, `getPriceAmount`, `getCurrencySymbol`, `getCurrencyName`, `getCurrencyMinorUnits`, `convertToMajor`, `convertToMinor` and `CURRENCY_MINOR_UNITS`. Money is integer minor units with a `Currency`.
- **Time:** moments are epoch milliseconds (`epochMilliseconds`, `epochMillisecondsNow`, `epochMillisecondsFromDate`, `epochMillisecondsToDate`); days are `"YYYY-MM-DD"`.
- **Paging:** `readAllPages(read)` and `paginate(read)` refuse a cursor that doesn't advance and stop after `max_pages` (1,000 unless you say otherwise).
- **Payments:** `paymentOutcome`, `latestPayment` and `paymentAmounts`; `mountCheckoutAction` and `mountPaymentMethodSetup`.
- **Forms:** `buildFormAnswers(form, values)` and `formValuesFromAnswers(answers)`.
- **Lines:** `cartProductItems(cart)`, `cartBookingItems`, `cartCustomerGroupItems`, `orderProductItems(order)`, `orderBookingItems`, `orderCustomerGroupItems`, `orderRentalUseItems`, `orderPurchaseAccessItems` and `orderLineItemsOfType(order, type)` pick the lines of one type.
- **Ids:** `requireId`, `isCanonicalId`, `createOrderToken` and `isOrderToken`.
- **Local payment simulator.** On a local runtime a payment's client secret ends in `_secret_emulator`. `isSimulatedPayment(action)` says so, and `simulatePayment({ simulator_url, simulation }, { signal? })` completes, expires, cancels or declines it.

`arky-sdk/utils` has the same helpers, without the payment mounts, the simulator, the line pickers and `CURRENCY_MINOR_UNITS`, plus a few for apps and back offices:
- key checks: `isValidKey`, `validateKey` and `toKey`; currencies: `isCurrency` and `SUPPORTED_STORE_CURRENCIES`;
- requests an app makes retry-safe itself: `getOrCreateDurableRequest`, `readDurableRequest`, `durableRequestPayload`, `clearDurableRequest` and `withDurableRequestLock`;
- `pollScheduledResult(first, read, isPending, signal?)`, which reads again until work Arky runs later is done and throws `ScheduledResultTimeoutError` after 20 seconds;
- the Admin fulfillment unit helpers and store permission checks.

## Releasing

SDK packages are released by tagging the protected `master` commit with `v<package.json version>`. The `Publish SDK` workflow runs the tests and publishes with npm provenance. Version bumps are patch-only.
