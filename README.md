# arky-sdk

Official TypeScript SDK for [Arky](https://arky.io): the storefront client, a reactive storefront store, and the Admin client.

## Installation

```bash
npm install --save-exact arky-sdk@<version>
```

Pin the exact version, so the Server, Admin and storefronts move together.

## Rules every call follows

- **The app picks ids.** Every create takes the record's `id`: a canonical UUID v4 the app makes once per user action and sends again on every retry. The same request under the same id returns the stored record; a different request under it is refused (409). The SDK checks the id's shape and never makes one: the storefront flows below take a missing id from the app's own `createId` factory.
- **One retry rule, in two tiers.** A storefront flow that takes its id from `createId` keeps its pending state in `localStorage` under a cross-tab lock, sends the same id when the same request is sent again, and clears it on a success or a definite refusal (`isDefiniteRefusal`: any 4xx except 408 and 429). A network failure or a 5xx keeps it for the retry. Form submissions, support conversations and messages, and sign-in code requests keep only the id and a fingerprint of the request, never the answers or the email, and a changed request is a new request with a new id. A checkout that takes its ids from the factories keeps the whole request, contact email included, until it is resolved, and refuses a different checkout or a cart change meanwhile. `joinFree` keeps its cart, line and order ids and its order token for each group until it is resolved (the email comes from the signed-in session); a retry finishes from the order the first attempt placed, and a sign-up for the same group in another catalog replaces the pending one. Without `localStorage` and Web Locks these flows refuse to start with a `DurableRequestStorageError`; pass your own `id` there (for a checkout, `order_id` and `order_token`). `isDurableRequestStorageError(error)` recognizes that error whichever entry point (`arky-sdk`, `arky-sdk/storefront` or `arky-sdk/utils`) threw it.
- **Changes carry the version they read.** Updates and actions send `expected_updated_at` (the `updated_at` the app read) in the body; deletes send it in the query. A stale value is refused (409).
- **Language and context are explicit.** A call that renders or stores text in a language takes `language`. Storefront requests send the store's publishable key and the locale and market key you set; the key itself decides the sales channel. Storefront calls name the company, company location or catalog they act for by id. The SDK never guesses them. A call names a company or one of its locations, never both (`CompanyPartyQuery`); a list filtered by customer, company or location names one of them (`CommercePartyQuery`). The types refuse the rest.
- **One params object per call**, then optional `RequestOptions` (`headers`, `signal`, `onSuccess`, `onError`, and on the storefront `locale` and `market` for that one request). Admin calls always take `store_id`.
- **Errors are `ArkyApiError`s.** A refused request throws an `ArkyApiError` with the Server's `code` (`GENERAL.CONFLICT`, `FORM_SUBMISSION.FORM_CHANGED`, …), `statusCode`, `message`, `validationErrors` and `requestId`. A network failure is a plain `Error` named `NetworkError`.
- **Types are the records.** Enums are `{ type: "<snake_case>", ...fields }` unions; moments are epoch milliseconds (`EpochMilliseconds`); days are `"YYYY-MM-DD"` (`CalendarDate`); money is integer minor units with a `Currency`. Lists return `{ items, cursor }`.

## Storefront client

```typescript
import { createStorefront } from "arky-sdk/storefront";
import { createOrderToken } from "arky-sdk/utils";

const arky = createStorefront("arky_pk_...", {
  apiUrl: "https://api.arky.io",
  locale: "en",
  market: "eu",
  createVisitorIdentity: () => ({ customer_id: crypto.randomUUID(), session_id: crypto.randomUUID() }),
  createSessionId: () => crypto.randomUUID(),
  createId: () => crypto.randomUUID(),
  createOrderToken,
});
```

The four factories are required: the app picks every customer, session and record id and every order token, and a client without them throws when it is created. `createOrderToken` from `arky-sdk/utils` makes a token in the shape Arky accepts. Only an `arky_pk_...` publishable key is accepted. Each storefront key belongs to exactly one sales channel, so carts, prices and checkouts made with it use that channel; there is no channel option or header. `X-Arky-Locale` is the only source of the language, so storefront quotes and checkouts send no `language` in the body. Change the context with `setContext({ locale, market })`, or pass `{ locale, market }` as request options for one call on the same session: `arky.content.entry.find(params, { locale: "it" })`. A cart call refuses a per-call market, because a cart keeps the market it was filled in. `getSetup()` answers the store's `name`, `timezone`, `languages` and payment options. The examples in `examples/` are compiled against the built package in the test run.

### Customer sessions

```typescript
await arky.customer.identify();
await arky.customer.requestCode({ email: "ana@example.com", language: "en" });
await arky.customer.verify({ code: "123456" });
const me = await arky.customer.getMe();
await arky.customer.updateMe({ expected_updated_at: me.customer.updated_at, first_name: "Ana" });
await arky.customer.unsubscribe();
await arky.customer.resubscribe();

await arky.customer.requestCode({ email: "ana.new@example.com", language: "en" });
await arky.customer.changeEmail({ code: "654321" });
```

`requestCode` takes the code email's id from `createId` (or the `id` you pass) and names its language; a lost answer is retried under the same id, so the customer gets one email. On a signed-in session it starts an email change instead of a sign-in: the code goes to the new address, and `changeEmail({ code })` proves it. The session stays signed in, the email becomes the new verified address, and the old address gets a notice in the language the code request named. `unsubscribe` records that the signed-in customer unsubscribed and `resubscribe` releases it; both answer the customer with `email_unsubscribed`. `updateMe` can't replace or remove a verified email. `verify` issues the signed-in session under a new id from `createSessionId` and reuses that id when it retries after a lost answer. Sessions are kept in `localStorage`, or in the `sessionStorage` adapter you pass (needed during SSR). When `verify` signs the visitor in as a customer who already exists, Arky merges the visitor's cart into that customer's cart in the same step. The next `cart.current(...)` follows the merged visitor cart to that cart and selects it, so the customer lands on their merged cart, on a new browser too; `cart.create` or `cart.forget` for the same buyer and catalog drops the pending follow.

### Content, media and forms

```typescript
const site = await arky.content.load({ collection: { key: "website" } });
const title = site.object("info")?.text("title");
const hero = arky.utils.getImageUrl(site.media("hero"), "large");
const post = await arky.content.load({ entry: { collection_id, slug: "launch" } }, { locale: "it" });
const posts = await arky.content.loadEntries({ collection_id, limit: 100 });

const page = await arky.content.entry.find({ collection_id, key: "home", limit: 1 });
const media = await arky.media.findByIds({ ids: [mediaId] });

const form = await arky.forms.get({ key: "contact" });
const submission = await arky.forms.submit({
  form_id: form.id,
  questions_updated_at: form.questions_updated_at,
  language: "en",
  answers: [{ type: "text", question_id: form.questions[0].id, key: "message", value: "Hello" }],
});
```

`content.load` reads one collection (by `id` or `key`) or one entry (by `id`, by `collection_id` and `key`, or by `collection_id` and `slug`); `loadEntries` reads every page of a collection's entries. Both fetch the media their blocks name in reads of at most 100 ids, and any failed read throws, so a build never ships half a page. The answer has `record`, `blocks`, `media_by_id` and accessors in the call's locale: `block(key)`, `text(key)` (a text, markdown or localized block in that locale, `null` when it is missing; no other language is used instead), `media(key)`, `object(key)` and `list(key)`. An accessor for a block of another type throws. Entry slugs are unique per collection and language, so a slug lookup names its collection and reads the client's locale. Every stored media file carries its public `url`; images have `original`, `thumbnail`, `small`, `medium` and `large`.

`forms.submit` takes the submission id from `createId` when you leave `id` out, and keeps it for a retry by the one retry rule; the bot-check token is not part of the kept request, so a fresh token can be sent with the retry. A submission names the `questions_updated_at` of the form it was filled in from; when the form's questions changed since, Arky refuses it with 409 `FORM_SUBMISSION.FORM_CHANGED`, so load the form again. The storefront store's `forms.submitByKey` sends the loaded form's version itself. File answers carry `File` objects; the SDK sends the submission as multipart, with each file in the same request (up to 10 MiB a file, 20 files and 50 MiB a submission). An answer exists only when it is given, so empty or whitespace-only text, empty choices and empty file lists are left out. `buildFormAnswers(form, values)` turns a plain `{ key: value }` map into checked answers. The storefront gets back its own copy of the submission (`StorefrontFormSubmission`: `id`, `form_id`, `language`, `answers`, `stage_id` and the two times, no staff history).

### Catalog and products

```typescript
const catalogs = await arky.eshop.catalog.find();
const products = await arky.eshop.product.find({ catalog_id, include_price: true, limit: 20 });
const product = await arky.eshop.product.get({ slug: "classic", catalog_id, include_price: true });
const byKey = await arky.eshop.product.getByKey({ key: "classic-x1", catalog_id, include_price: true });
const category = await arky.category.getByKey({ key: "kitchen" });
const variants = await arky.eshop.productVariant.find({ product_id: product.id, catalog_id, include_price: true });
```

`get` reads a product, booking service or category by its id or by its slug in the client's locale, and a miss is a 404. A key is read only through `getByKey`, on its own `by-key` route.

### Cart and checkout

```typescript
const created = await arky.eshop.cart.create({
  id: crypto.randomUUID(),
  buyer: { type: "customer" },
  catalog_id,
});
let cart = created.cart;

cart = await arky.eshop.cart.addProduct({
  id: cart.id,
  expected_updated_at: cart.updated_at,
  product: {
    id: crypto.randomUUID(),
    variant_id,
    quantity: 1,
    purchase: { type: "catalog" },
  },
});

const quote = await arky.eshop.cart.quote({ id: cart.id });

const accepted = await arky.eshop.cart.checkout({
  cart_id: cart.id,
  expected_updated_at: cart.updated_at,
  presentation_digest: quote.presentation_digest,
  contact_email: "ana@example.com",
  payment: {
    type: "payment_option",
    payment_option_id: quote.suggested_payment_option_id!,
    return_url: location.href,
    save_payment_method: false,
    payment_method_terms: null,
  },
});
```

The quote is in the client's locale. `quote.ready` is false while `quote.blockers` lists what is missing (a delivery, a shipping choice, a billing address, …); each delivery's `offers` name their shipping method by `shipping_method_key` and `shipping_method_blocks`, so a storefront can show "Courier €45". A rate that needs a weight Arky doesn't know is left out of `offers` and listed in the delivery's `unavailable` with its `code` (`SHIPPING.WEIGHT_UNKNOWN`); when the cart already selected it, the quote shows a `shipping_rate_unavailable` (or `customer_group_shipping_rate_unavailable`) blocker with that code. A product line may buy through a group's purchase access: `{ type: "existing_purchase_access", grant }` for access an order bought, `{ type: "same_cart_purchase_access", cart_customer_group_line_item_id, entitlement_id }` for access bought in the same cart, and `{ type: "assigned_purchase_access", customer_group_member_id, entitlement_id }` for a member the team assigned. `cart.current({ buyer, catalog_id })` reads the cart this browser selected for the signed-in customer (a cart that was merged is followed to its target when the target is this customer's), `cart.forget()` drops the selection, and `cart.reorder({ id, order_id, buyer })` starts a cart from an earlier order and selects it under the buyer and the new cart's `catalog_id`, as `create` does, so it survives a reload. Checkout is refused when the quote changed (`CartPresentationChangedError`, an `ArkyApiError` with code `COMMERCE.PRESENTATION_CHANGED`, carries the new quote). Without `order_id` and `order_token`, checkout takes them from `createId` and `createOrderToken`, keeps the request across reloads before it is sent, and a second checkout of the same cart, version and payment recovers the kept one; a different checkout is refused until the kept one is recovered. With both ids given, the request is sent as is, and `retainCheckout`, `pendingCheckout` and `recoverCheckout` keep it across reloads by hand. A definite refusal (any 4xx but 408 and 429, including the changed-quote 409) drops the kept request, so the cart can be changed and quoted again.

### Paying

```typescript
import { mountCheckoutAction } from "arky-sdk/storefront";

if (accepted.type === "placed") {
  await mountCheckoutAction(accepted.payment_action, "#payment", {}, accepted.payment_id ?? undefined);
}
```

Checkout answers `{ type: "placed", order_id, number, payment_id, payment_action }`, or `{ type: "already_member", customer_group_member_id }` when the cart is a free sign-up the buyer already holds (no order is made). Stripe embedded Checkout and Monri card entry are supported. `eshop.order.paymentAction({ order_id })` resumes an unfinished payment. `paymentOutcome(payment)` (from `arky-sdk/storefront` or `arky-sdk/utils`) says what a payment means to the shopper: `paid`, `pay_later` (cash on delivery or a manual payment not yet collected), `awaiting` or `failed`; `latestPayment(payments)` picks the newest. Saved cards use `eshop.paymentMethod.requestSetup`, `startSetup` (with `mountPaymentMethodSetup`) and `completeSetup`.

```typescript
const { order, url } = await arky.eshop.order.fromLink({ id: orderId, url: location.href });
history.replaceState(history.state, "", url);
```

`order.fromLink` opens an order from an order email link (`#order_token=...`): it checks the token, reads the order with it, keeps the token for the next reads of that order and answers the link without the token, so the app can take it out of the address bar. Without a token in the link it uses the token kept at checkout, or the customer's session. `order.retainedToken(id)` answers the kept token.

### Orders, customer groups and more

- `eshop.order`: `find`, `get`, `fulfillments`, `findPayments`, `getPayment`, `paymentAction`, `cancelProductItem`, `cancelBookingItem`, `rescheduleBookingItem`. Order lists filter booking lines by `booking_statuses` (`pending`, `confirmed`, `attended`, `no_show`, `cancelled`).
- `eshop.promotion.get(id)`: the text shoppers see for an Active or Archived promotion, `{ id, key, blocks }`, with no conditions or counters.
- `eshop.library`: `find`, `getProduct`, `findAssets`, `download` (digital files the buyer owns). Pass nothing for the customer's own files, `company_id` for a company's, or `company_location_id` alone for a location's.
- `eshop.customerGroup` (`find`, `get`, `joinFree`) and `eshop.customerGroupOffering.get`: the groups a store sells, read like products (`catalog_id`, `include_price`). `joinFree({ identifier, catalog_id })` joins a signed-in customer to a free permanent group with no entitlements: it creates its own cart, adds the group, checks the quote is ready and free, and places the zero-price order a broadcast audience counts, with every id from the factories and kept for a retry. It answers `{ type: "joined", order_id }` or `{ type: "already_member", customer_group_member_id }`, and refuses with a `CustomerGroupJoinError` (`sign_in_required`, `not_free`, …).
- `newsletter`: `sendCode({ email, language })` answers `{ type: "verified" }` when that address is already signed in, else signs out another address and sends a code (`{ type: "code_sent" }`); `join({ email, code, identifier, catalog_id })` verifies the code, checks it confirmed that address and runs `joinFree`. A cart buys one with `eshop.cart.addCustomerGroup({ id, expected_updated_at, customer_group: { id, customer_group_id, start, deliveries } })`; `start` is `{ type: "on_acceptance" }`, `{ type: "scheduled", starts_at }` or, to move a member to another group of its offering, `{ type: "switch", customer_group_member_id }`.
- `eshop.customerGroupMember`: `find` (the customer's own members, or a company's or location's with `company_id` / `company_location_id`), `get`, `findOrders`, `getRevision` (a revision with its terms), `purchaseAccess({ id, catalog_id })`, `calendar` (the next occurrence and the one after a skip), and the member's actions `cancel`, `pause`, `resume`, `skipNext`, `selectPaymentMethod` and `withdrawRevision`. A switch is `reviewSwitch` then `switch` with the same body; it may name a `catalog_id`: Arky then prices it from that catalog, which must sell in the market of the member's first order (`CUSTOMER_GROUP_MEMBER.CATALOG_OTHER_MARKET` otherwise); without one it is priced from the current terms' catalog. When that catalog doesn't list the new group, has no price for it or doesn't let the buyer buy from it, `reviewSwitch` and `switch` answer 409 `CUSTOMER_GROUP_MEMBER.TARGET_NOT_PRICED`. A switch names no rentals: when the new terms start, each rented unit stays on its entitlement if that entitlement still lends the same variant, else moves to a free entitlement lending that variant, else is returned. The storefront gets the customer's copies (`CustomerGroupMemberSelf`, `CustomerGroupMemberRevisionDetailSelf`, `CustomerGroupMemberChangeSelf`): no staff emails or internal reasons.
- `eshop.minimumProgress.get({ customer_id } | { company_id } | { company_location_id })`: progress toward a group's purchase minimum. A company whose minimum counts per location answers `per_location`; read each location instead.
- `eshop.paymentMethod`: saved cards (`find`, `get`, `requestSetup`, `startSetup`, `completeSetup`, …), `currentConsentText({ language })` for the text a buyer accepts when saving a card, and `consentText({ terms_version })` for an earlier one.
- `eshop.rental`, `eshop.return`, `companies` (the signed-in customer's companies, locations and access grants).
- `support.conversation`: `start({ language, flow_key })` (without `flow_key` the chat goes straight to the team) answers the conversation and its first messages; `get`, `findMessages`, `getMessage` and `sendMessage({ conversation_id, input, prompt_message_id })` run under the customer's own session, with no separate chat token. `start` and `sendMessage` take their ids from `createId` when you leave `id` out and keep them by the one retry rule. `input` is `{ type: "text", text }` or `{ type: "button", label }`; while the chat waits on a choice, question or email prompt, `prompt_message_id` names the prompt shown (409 `CONVERSATION.STALE_PROMPT` otherwise).
- `actions.track({ key, data })`, `experiments.use({ key })`. An assignment means the storefront asked for a version, so call `experiments.use` only where that version is actually shown. A goal of `order_placed` means an order was placed, paid or not.
- `pageViews.send({ path, referrer })` counts a page view in the browser: one `navigator.sendBeacon` text body carrying the publishable key, the path and the referrer, so the call needs no headers and no preflight. It sends no session or customer ID, stores nothing in the browser and never creates a visitor or an action. Arky counts the unique visitor from the request's client address and `User-Agent`, which it never stores; it keeps the path without query or fragment, the referrer only as another site's host, and the country from the network (`ZZ` when unknown).

## Storefront store

`initialize` wraps the storefront client in [nanostores](https://github.com/nanostores/nanostores) atoms for UI frameworks:

```typescript
import { initialize } from "arky-sdk/storefront";
import { createOrderToken } from "arky-sdk/utils";

export const store = initialize("arky_pk_...", {
  locale: "en",
  market: "eu",
  createVisitorIdentity: () => ({ customer_id: crypto.randomUUID(), session_id: crypto.randomUUID() }),
  createSessionId: () => crypto.randomUUID(),
  createId: () => crypto.randomUUID(),
  createOrderToken,
});

const [catalog] = await store.eshop.catalog.find();
const cart = store.eshop.carts.for({ buyer: { type: "customer" }, catalog_id: catalog.id });
await cart.ensure();
await cart.addProduct({ variant_id, quantity: 1, purchase: { type: "catalog" } });
await cart.shipTo({ type: "delivery", address });
await cart.quote();
await cart.checkout({ contact_email, payment });
```

`eshop.carts.for({ buyer, catalog_id })` answers one cart store per buyer and catalog, the same one on every call, so a customer cart and a company or location cart live side by side. Each keeps its own `cart`, `quote_result`, `status` and `last_order`. `eshop.cart` is the cart whose buyer and catalog the first `load`, `create` or `ensure` names. `ensure()` loads the selected cart or creates one under an id from `createId`, kept across a lost answer. A cart write whose answer is lost, or that is refused because the cart changed (a 409), drops the cart view: `cart` and `quote_result` turn `null`, the next `ensure()` or `load()` reads the current cart, and the next write sends its current version. A page that shows the cart loads it again after such a failure. Line ids, the cart id and the order ids come from `createId` and `createOrderToken` when you leave them out. `shipTo(destination)` reads the shipping profile of each shipped variant, makes one delivery per profile (a cart can't mix profiles in one delivery), keeps each delivery's id, and keeps its shipping choice only while the address stays the same. The store uses its locale for quotes and refuses to change the market while any cart has items; a sign-out or a market change clears every cart store. `addCustomerGroup(input)` adds a group line, `customer_group_items` lists the cart's group lines, and `setFutureDeliveries` / `quoteFutureDeliveries` take each group line's deliveries.

`eshop.checkoutFlow({ buyer, catalog_id })` is a headless checkout for a store-built cart page: no UI, only steps, state and errors.

```typescript
const checkout = store.eshop.checkoutFlow({ buyer: { type: "customer" }, catalog_id: catalog.id });
checkout.state.subscribe((state) => render(state));
await checkout.open();
checkout.setContact("ana@example.com");
await checkout.shipTo({ type: "delivery", address });
await checkout.chooseShipping(deliveryGroupId, { shipping_method_id, rate_id });
checkout.choosePayment(paymentOptionId);
const placed = await checkout.place({ return_url: (orderId) => `${location.origin}/order/${orderId}` });
```

- `state.step` is `cart` (no lines), `details` (contact email, address or billing missing), `shipping` (a delivery needs its shipping choice), `payment` (ready to place), `paying` (a placed order waits for its payment, or a kept checkout waits for `recover()`) or `placed` (paid, to pay later, or free). The state also carries the `cart`, the `quote` with its `blockers`, the chosen `payment_option_id` (the quote's suggestion until one is chosen), the `pending` request, the `placed` order, its `payment` and `outcome`, `busy` and `error`.
- `place` takes the order id and token from the factories, keeps the request before it is sent and reads the payment; mount `state.placed.payment_action` with `mountCheckoutAction` when it isn't `none`. `recover()` finishes a kept checkout, `resumePayment()` asks for a new payment action, `refreshPayment()` reads the payment again, and `resume({ order_id, url })` reopens an order after a payment redirect (through `order.fromLink`).
- Every step throws a `CheckoutFlowError` and records it in `state.error`: `busy`, `not_ready`, `pending`, `presentation_changed` (the state then shows the new quote), `refused` (a definite refusal), `interrupted` (try again or `recover()`), `unavailable` (no browser storage or lock) or `failed`.

The booking store (`eshop.bookingService`) builds the calendar and slots. A slot that spans days (a stay of several nights) is `isMultiDay`, its `timeText` is the date range, and its days are `isInRange` in the calendar once it is chosen. `addToCart([{ slot }])` creates the cart for the booking's catalog when none is loaded and adds each chosen slot, under a line id from `createId` unless you give one; a cart of another catalog is refused.

## Admin client

```typescript
import { createAdmin } from "arky-sdk/admin";

const admin = createAdmin({ baseUrl: "https://api.arky.io", secretKey: process.env.ARKY_SECRET_KEY });
```

Without `secretKey`, sign in with `admin.account.auth.code({ email })` and `admin.account.auth.verify({ session_id, code })`. The same client retains and refreshes the issued Account session. A process restoring an Account access token can supply a `forcedHeaders` callback returning its Bearer `Authorization` header and `onUnauthorized: () => false`; that process owns token expiry and refresh before requests.

| Namespace | What it covers |
|---|---|
| `account` | `getMe`, `delete`, `search`, `session`, `auth` |
| `platform` | currencies, webhook events, store plans, `administrator` (each with its account's `email`), `stripeBillingEvent` |
| `store` | the store (with `pauseEmailSending` and `allowEmailSending`), `subscription` (with `endGrant` for platform administrators), `usage.find` (each counter beside its plan allowance), `member` (an invite lasts 7 days, inviting again renews it, and the invited account accepts with `acceptInvite`), `emails`, `role`, `webhook`, `location`, `market`, `salesChannel`, `apiKey` (Publishable keys belong to one sales channel; Secret keys carry explicit permissions; `revoke` retires either), `paymentOption`, `zone`, `taxCategory`, `shippingProfile`, `shippingMethod` |
| `notification` | `outgoingEmail` and `outgoingWebhook` (what Arky sent; a send is never stopped), `incomingWebhook` (provider posts), `template` (the wording of one email type in each store language), `emailProvider` (`connect` a Resend key, `replaceKey` to swap it on the same provider with the version read, live `domains` including `partially_verified` and `partially_failed`), `emailAddress` (the store's sending and receiving addresses) |
| `broadcast` | one email to the members of a customer group offering or of chosen customer groups, sent from one of the store's addresses; `BROADCAST_FIELDS` and `BROADCAST_BLOCK_FIELD_PREFIXES` list the placeholders it may use |
| `support` | `flow` (fixed-step chat flows), `conversation` (chat and email in one record, with `startEmail` and `reply` taking their own `text` or a SupportReply `email_template_id`, `changeChatVisibility` to show or hide a received email in the chat, `selectSendingAddress`, `resolve`, `assign`, `notes` and `attachmentLink`) |
| `media`, `category`, `content` | files, categories, collections and entries |
| `forms` | forms, submissions, stage changes, files, `notes` |
| `companies`, `customers` | companies with locations, purchasing (`setPurchasing`), tax registrations (`submitTaxRegistration`, `reviewTaxRegistration`), roles, memberships with scoped grants, and notes; customers with sessions, email suppressions, notes, `erase` and `merge` |
| `actions`, `experiments`, `analytics` | the customer timeline, A/B tests, reports |
| `eshop` | products, variants, digital assets, bookings, prices, catalogs, promotions, `customerGroup`, `customerGroupOffering` and `customerGroupMember` (with `assign`, `current`, `revisions`, `purchaseAccess`, `calendar`, each change as `review…` then the change, and `transferPurchaseRequirement`), payment methods (with `consentText`), payments (with `resolveRefund` and `resolveCharge` for Monri), provider events, carts, orders (with credits, notes, `rescheduleBookingItem`, `attendBookingItem` and `markBookingItemNoShow`), inventory, fulfillment (jobs carry the Order's current `contact`; `fulfillmentJob.getPickupCash` reads the cash a pickup still owes and `fulfillmentJob.recordPickupCash` records it), `minimumProgress`, returns (staff name the receiving location; approve and decline name `notify_customer`; `credit` for received goods) and rentals |

A customer group without entitlements is a free sign-up: it is permanent, its price is 0 in every catalog that lists it, and Arky refuses any other amount. The team can `assign` a customer, company or location to a group that neither ships nor lends anything, without an order; assigning into another group of an offering the subject already holds moves them.

Deletes of records that clean up after themselves (stores, markets, locations, catalogs, products, variants, bookings, categories, collections, media, companies, inventory items) return the record marked `deleting` (a variant or inventory item that is already gone answers nothing); most other deletes return `{ deleted }`, and a few (prices, catalog items and accesses, experiments, customer groups and customer group offerings) return nothing.

## Utilities

`arky-sdk/utils` and `client.utils` hold block readers (`getBlockTextValue`, `getBlockContentValue`, `selectLocalizedText`, `collectBlockReferences`), media URLs (`getImageUrl`), money formatting (`formatMinor`, `formatMoney`, `formatPrice`, `CURRENCY_MINOR_UNITS`), time helpers, key validation and `requireId` / `isCanonicalId`. Formatting helpers take the locale explicitly. `paginate(read)` walks every page of a list (`for await (const product of paginate((cursor) => arky.eshop.product.find({ catalog_id, ...(cursor ? { cursor } : {}) })))`) and `readAllPages(read)` collects them; both refuse a cursor that doesn't advance and stop after `max_pages` (1,000 unless you say otherwise). `paymentOutcome`, `latestPayment`, `isDefiniteRefusal` and `isDurableRequestStorageError` are there too.

## Releasing

SDK packages are released by tagging the protected `master` commit with `v<package.json version>`. The `Publish SDK` workflow runs the tests and publishes with npm provenance. Version bumps are patch-only.

## Customer identity

Customers are Anonymous until their inbox is verified. Storefront responses contain their typed profile; staff responses also contain private blocks. Imports create Anonymous customers from caller-picked IDs and typed blocks without matching an email.

Every storefront client takes the four factories. `visitorIdentity` is optional and restores a pair your application picked earlier:

```typescript
const arkyStore = initialize(publishableKey, {
  locale: "en",
  market: "us",
  visitorIdentity: { customer_id: customerId, session_id: visitorSessionId },
  createVisitorIdentity: () => ({ customer_id: crypto.randomUUID(), session_id: crypto.randomUUID() }),
  createSessionId: () => crypto.randomUUID(),
  createId: () => crypto.randomUUID(),
  createOrderToken,
});
```

To sign in, request a code with an explicit `language` (the id comes from `createId` unless you pass one), then call `verify({ code })`: the SDK takes the new session's id from `createSessionId`. Automatic credential refresh takes each new id from `createSessionId` too, and reuses it for that refresh attempt. When a signed-in session can't be refreshed, the SDK clears it and reports the sign-out to `onAuthStateChanged`. Explicit refresh uses `customer.refresh({ session_id })`. Store API keys replace personal tokens: Publishable keys select one sales channel, and Secret keys grant explicit store permissions. Pass a Secret key as `createAdmin({ baseUrl, secretKey })`.

Reusable email templates have a key and fixed data type. Select templates explicitly through `admin.store.emails.update`; each empty setting disables that email. Forms select their own received, stage-change and alert emails.

Email changes currently return an unavailable response until the required previous-address notice is configured. After an uncertain sign-in issuance (`CommitOutcomeUnknown`), `verify` keeps its session id for the retry; a definite refusal drops it, so the next `verify` takes a new one from `createSessionId`.

Use `createVisitorIdentity` to replace an expired Visitor. The application picks both IDs; the SDK keeps that pair across a lost response and retries. A static `visitorIdentity` is used once; after expiry the SDK takes a new pair from `createVisitorIdentity`, or you supply one with `customer.identify({ customer_id, session_id })`.

An Order capability is a token from the app's `createOrderToken` factory (or one you pass with your own `order_id`), kept with that `order_id` and reused on every checkout retry. A checkout without ids, `retainCheckout` and the checkout flow retain that pair. The token is transient and never appears in an Order record or a checkout response. Exact Order reads, payments, payment actions, fulfillments, cancellations and Order returns accept `{ order_token }` as request options; the SDK sends `X-Arky-Order-Token` only for those requests. Lists and customer, company, rental and library access keep their ordinary session scope. `order.downloadAsset({ order_id, line_item_id, asset_id, order_token })` downloads one asset from that exact Order.

For an initial email link, `eshop.order.fromLink({ id, url })` keeps a valid fragment token against the exact API, Store and Order and answers the URL without it. Keep payment provider return URLs free of the token.
