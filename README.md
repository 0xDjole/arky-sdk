# arky-sdk

Official TypeScript SDK for [Arky](https://arky.io): the storefront client, a reactive storefront store, and the Admin client.

## Installation

```bash
npm install --save-exact arky-sdk@<version>
```

Pin the exact version, so the Server, Admin and storefronts move together.

## Rules every call follows

- **The app picks ids.** Every create takes the record's `id`: a canonical UUID v4 the app makes once per user action and sends again on every retry. The same request under the same id returns the stored record; a different request under it is refused (409). The SDK checks the id's shape and never makes one.
- **Changes carry the version they read.** Updates and actions send `expected_updated_at` (the `updated_at` the app read) in the body; deletes send it in the query. A stale value is refused (409).
- **Language and context are explicit.** A call that renders or stores text in a language takes `language`. Storefront requests send the store's publishable key and the locale and market key you set; the key itself decides the sales channel. Storefront calls name the company, company location or catalog they act for by id. The SDK never guesses them. A call names a company or one of its locations, never both (`CompanyPartyQuery`); a list filtered by customer, company or location names one of them (`CommercePartyQuery`). The types refuse the rest.
- **One params object per call**, then optional `RequestOptions` (`headers`, `signal`, `onSuccess`, `onError`). Admin calls always take `store_id`.
- **Types are the records.** Enums are `{ type: "<snake_case>", ...fields }` unions; moments are epoch milliseconds (`EpochMilliseconds`); days are `"YYYY-MM-DD"` (`CalendarDate`); money is integer minor units with a `Currency`. Lists return `{ items, cursor }`.

## Storefront client

```typescript
import { createStorefront } from "arky-sdk/storefront";

const arky = createStorefront("arky_pk_...", {
  apiUrl: "https://api.arky.io",
  locale: "en",
  market: "eu",
  createVisitorIdentity: () => ({ customer_id: crypto.randomUUID(), session_id: crypto.randomUUID() }),
  createSessionId: () => crypto.randomUUID(),
});
```

`createVisitorIdentity` and `createSessionId` are required: the app picks every customer and session id, and a client without them throws when it is created. Only an `arky_pk_...` publishable key is accepted. Each storefront key belongs to exactly one sales channel, so carts, prices and checkouts made with it use that channel; there is no channel option or header. `X-Arky-Locale` is the only source of the language, so storefront quotes and checkouts send no `language` in the body. Change the context with `setContext({ locale, market })`, or make a scoped copy with `withContext(...)`. `getSetup()` answers the store's `name`, `timezone`, `languages` and payment options.

### Customer sessions

```typescript
await arky.customer.identify();
await arky.customer.requestCode({ id: crypto.randomUUID(), email: "ana@example.com", language: "en" });
await arky.customer.verify({ code: "123456" });
const me = await arky.customer.getMe();
await arky.customer.updateMe({ expected_updated_at: me.customer.updated_at, first_name: "Ana" });
await arky.customer.unsubscribe();
await arky.customer.resubscribe();

await arky.customer.requestCode({ id: crypto.randomUUID(), email: "ana.new@example.com", language: "en" });
await arky.customer.changeEmail({ code: "654321" });
```

`requestCode` names the code email's id and its language. On a signed-in session it starts an email change instead of a sign-in: the code goes to the new address, and `changeEmail({ code })` proves it. The session stays signed in, the email becomes the new verified address, and the old address gets a notice in the language the code request named. `unsubscribe` records that the signed-in customer unsubscribed and `resubscribe` releases it; both answer the customer with `email_unsubscribed`. `updateMe` can't replace or remove a verified email. `verify` issues the signed-in session under a new id from `createSessionId` and reuses that id when it retries after a lost answer. Sessions are kept in `localStorage`, or in the `sessionStorage` adapter you pass (needed during SSR). When `verify` signs the visitor in as a customer who already exists, Arky merges the visitor's cart into that customer's cart in the same step. The next `cart.current(...)` follows the merged visitor cart to that cart and selects it, so the customer lands on their merged cart, on a new browser too; `cart.create` or `cart.forget` for the same buyer and catalog drops the pending follow.

### Content, media and forms

```typescript
const page = await arky.content.entry.find({ collection_id, key: "home", limit: 1 });
const post = await arky.content.entry.findBySlug({ collection_id, slug: "launch" });
const entry = await arky.content.entry.get({ id });
const media = await arky.media.findByIds({ ids: [mediaId] });
const url = arky.utils.getImageUrl(media[0], "medium");

const form = await arky.forms.get({ key: "contact" });
const submission = await arky.forms.submit({
  form_id: form.id,
  questions_updated_at: form.questions_updated_at,
  id: crypto.randomUUID(),
  language: "en",
  answers: [{ type: "text", question_id: form.questions[0].id, key: "message", value: "Hello" }],
});
```

Entry slugs are unique per collection and language, so a slug lookup names its collection and reads the client's locale. Every stored media file carries its public `url`; images have `original`, `thumbnail`, `small`, `medium` and `large`.

A submission names the `questions_updated_at` of the form it was filled in from; when the form's questions changed since, Arky refuses it with 409 `FORM_SUBMISSION.FORM_CHANGED`, so load the form again. The storefront store's `forms.submitByKey` sends the loaded form's version itself. File answers carry `File` objects; the SDK sends the submission as multipart, with each file in the same request (up to 10 MiB a file, 20 files and 50 MiB a submission). An answer exists only when it is given, so empty or whitespace-only text, empty choices and empty file lists are left out. `buildFormAnswers(form, values)` turns a plain `{ key: value }` map into checked answers. The storefront gets back its own copy of the submission (`StorefrontFormSubmission`: `id`, `form_id`, `language`, `answers`, `stage_id` and the two times, no staff history).

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
  order_id: crypto.randomUUID(),
  order_token: createOrderToken(),
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

The quote is in the client's locale. `quote.ready` is false while `quote.blockers` lists what is missing (a delivery, a shipping choice, a billing address, …); each delivery's `offers` name their shipping method by `shipping_method_key` and `shipping_method_blocks`, so a storefront can show "Courier €45". A rate that needs a weight Arky doesn't know is left out of `offers` and listed in the delivery's `unavailable` with its `code` (`SHIPPING.WEIGHT_UNKNOWN`); when the cart already selected it, the quote shows a `shipping_rate_unavailable` (or `customer_group_shipping_rate_unavailable`) blocker with that code. A product line may buy through a group's purchase access: `{ type: "existing_purchase_access", grant }` for access an order bought, `{ type: "same_cart_purchase_access", cart_customer_group_line_item_id, entitlement_id }` for access bought in the same cart, and `{ type: "assigned_purchase_access", customer_group_member_id, entitlement_id }` for a member the team assigned. `cart.current({ buyer, catalog_id })` reads the cart this browser selected for the signed-in customer (a cart that was merged is followed to its target when the target is this customer's), `cart.forget()` drops the selection, and `cart.reorder({ id, order_id, buyer })` starts a cart from an earlier order and selects it under the buyer and the new cart's `catalog_id`, as `create` does, so it survives a reload. Checkout is refused when the quote changed (`CartPresentationChangedError` carries the new quote). A checkout can be kept across reloads with `retainCheckout`, `pendingCheckout` and `recoverCheckout`; a definite refusal (any 4xx but 408 and 429, including the changed-quote 409) drops the kept request, so the cart can be changed and quoted again.

### Paying

```typescript
import { mountCheckoutAction } from "arky-sdk/storefront";

if (accepted.type === "placed") {
  await mountCheckoutAction(accepted.payment_action, "#payment", {}, accepted.payment_id ?? undefined);
}
```

Checkout answers `{ type: "placed", order_id, number, payment_id, payment_action }`, or `{ type: "already_member", customer_group_member_id }` when the cart is a free sign-up the buyer already holds (no order is made). Stripe embedded Checkout and Monri card entry are supported. `eshop.order.paymentAction({ order_id })` resumes an unfinished payment. Saved cards use `eshop.paymentMethod.requestSetup`, `startSetup` (with `mountPaymentMethodSetup`) and `completeSetup`.

### Orders, customer groups and more

- `eshop.order`: `find`, `get`, `fulfillments`, `findPayments`, `getPayment`, `paymentAction`, `cancelProductItem`, `cancelBookingItem`, `rescheduleBookingItem`. Order lists filter booking lines by `booking_statuses` (`pending`, `confirmed`, `attended`, `no_show`, `cancelled`).
- `eshop.promotion.get(id)`: the text shoppers see for an Active or Archived promotion, `{ id, key, blocks }`, with no conditions or counters.
- `eshop.library`: `find`, `getProduct`, `findAssets`, `download` (digital files the buyer owns). Pass nothing for the customer's own files, `company_id` for a company's, or `company_location_id` alone for a location's.
- `eshop.customerGroup` (`find`, `get`) and `eshop.customerGroupOffering.get`: the groups a store sells, read like products (`catalog_id`, `include_price`). A cart buys one with `eshop.cart.addCustomerGroup({ id, expected_updated_at, customer_group: { id, customer_group_id, start, deliveries } })`; `start` is `{ type: "on_acceptance" }`, `{ type: "scheduled", starts_at }` or, to move a member to another group of its offering, `{ type: "switch", customer_group_member_id }`.
- `eshop.customerGroupMember`: `find` (the customer's own members, or a company's or location's with `company_id` / `company_location_id`), `get`, `findOrders`, `getRevision` (a revision with its terms), `purchaseAccess({ id, catalog_id })`, `calendar` (the next occurrence and the one after a skip), and the member's actions `cancel`, `pause`, `resume`, `skipNext`, `selectPaymentMethod` and `withdrawRevision`. A switch is `reviewSwitch` then `switch` with the same body; it may name a `catalog_id`: Arky then prices it from that catalog, which must sell in the market of the member's first order (`CUSTOMER_GROUP_MEMBER.CATALOG_OTHER_MARKET` otherwise); without one it is priced from the current terms' catalog. When that catalog doesn't list the new group, has no price for it or doesn't let the buyer buy from it, `reviewSwitch` and `switch` answer 409 `CUSTOMER_GROUP_MEMBER.TARGET_NOT_PRICED`. A switch names no rentals: when the new terms start, each rented unit stays on its entitlement if that entitlement still lends the same variant, else moves to a free entitlement lending that variant, else is returned. The storefront gets the customer's copies (`CustomerGroupMemberSelf`, `CustomerGroupMemberRevisionDetailSelf`, `CustomerGroupMemberChangeSelf`): no staff emails or internal reasons.
- `eshop.minimumProgress.get({ customer_id } | { company_id } | { company_location_id })`: progress toward a group's purchase minimum. A company whose minimum counts per location answers `per_location`; read each location instead.
- `eshop.paymentMethod`: saved cards (`find`, `get`, `requestSetup`, `startSetup`, `completeSetup`, …), `currentConsentText({ language })` for the text a buyer accepts when saving a card, and `consentText({ terms_version })` for an earlier one.
- `eshop.rental`, `eshop.return`, `companies` (the signed-in customer's companies, locations and access grants).
- `support.conversation`: `start({ id, language, flow_key })` (without `flow_key` the chat goes straight to the team) answers the conversation and its first messages; `get`, `findMessages`, `getMessage` and `sendMessage({ conversation_id, id, input, prompt_message_id })` run under the customer's own session, with no separate chat token. `input` is `{ type: "text", text }` or `{ type: "button", label }`; while the chat waits on a choice, question or email prompt, `prompt_message_id` names the prompt shown (409 `CONVERSATION.STALE_PROMPT` otherwise).
- `actions.track({ key, data })`, `experiments.use({ key })`. An assignment means the storefront asked for a version, so call `experiments.use` only where that version is actually shown. A goal of `order_placed` means an order was placed, paid or not.
- `pageViews.send({ path, referrer })` counts a page view in the browser: one `navigator.sendBeacon` text body carrying the publishable key, the path and the referrer, so the call needs no headers and no preflight. It sends no session or customer ID, stores nothing in the browser and never creates a visitor or an action. Arky counts the unique visitor from the request's client address and `User-Agent`, which it never stores; it keeps the path without query or fragment, the referrer only as another site's host, and the country from the network (`ZZ` when unknown).

## Storefront store

`initialize` wraps the storefront client in [nanostores](https://github.com/nanostores/nanostores) atoms for UI frameworks:

```typescript
import { initialize } from "arky-sdk/storefront";

export const store = initialize("arky_pk_...", {
  locale: "en",
  market: "eu",
  createVisitorIdentity: () => ({ customer_id: crypto.randomUUID(), session_id: crypto.randomUUID() }),
  createSessionId: () => crypto.randomUUID(),
});

const [catalog] = await store.eshop.catalog.find();
await store.eshop.cart.load({ buyer: { type: "customer" }, catalog_id: catalog.id });
await store.eshop.cart.addProduct({ id: crypto.randomUUID(), variant_id, quantity: 1, purchase: { type: "catalog" } });
await store.eshop.cart.quote();
await store.eshop.cart.checkout({ order_id: crypto.randomUUID(), order_token: createOrderToken(), contact_email, payment });
```

The store keeps `cart`, `quote_result`, `status` and `last_order`, uses the store's locale for quotes, and refuses to change the market while the cart has items. `eshop.cart.addCustomerGroup(input)` adds a group line, `customer_group_items` lists the cart's group lines, and `setFutureDeliveries` / `quoteFutureDeliveries` take each group line's deliveries. The booking store (`eshop.bookingService`) builds the calendar and slots; `addToCart([{ id, slot }])` adds each chosen slot under the line id you give.

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

`arky-sdk/utils` and `client.utils` hold block readers (`getBlockTextValue`, `getBlockContentValue`, `selectLocalizedText`, `collectBlockReferences`), media URLs (`getImageUrl`), money formatting (`formatMinor`, `formatMoney`, `formatPrice`, `CURRENCY_MINOR_UNITS`), time helpers, key validation and `requireId` / `isCanonicalId`. Formatting helpers take the locale explicitly.

## Releasing

SDK packages are released by tagging the protected `master` commit with `v<package.json version>`. The `Publish SDK` workflow runs the tests and publishes with npm provenance. Version bumps are patch-only.

## Customer identity

Customers are Anonymous until their inbox is verified. Storefront responses contain their typed profile; staff responses also contain private blocks. Imports create Anonymous customers from caller-picked IDs and typed blocks without matching an email.

Every storefront client takes the two id factories. `visitorIdentity` is optional and restores a pair your application picked earlier:

```typescript
const arkyStore = initialize(publishableKey, {
  locale: "en",
  market: "us",
  visitorIdentity: { customer_id: customerId, session_id: visitorSessionId },
  createVisitorIdentity: () => ({ customer_id: crypto.randomUUID(), session_id: crypto.randomUUID() }),
  createSessionId: () => crypto.randomUUID(),
});
```

To sign in, request a code using a caller-picked `id` and explicit `language`, then call `verify({ code })`: the SDK takes the new session's id from `createSessionId`. Automatic credential refresh takes each new id from `createSessionId` too, and reuses it for that refresh attempt. When a signed-in session can't be refreshed, the SDK clears it and reports the sign-out to `onAuthStateChanged`. Explicit refresh uses `customer.refresh({ session_id })`. Store API keys replace personal tokens: Publishable keys select one sales channel, and Secret keys grant explicit store permissions. Pass a Secret key as `createAdmin({ baseUrl, secretKey })`.

Reusable email templates have a key and fixed data type. Select templates explicitly through `admin.store.emails.update`; each empty setting disables that email. Forms select their own received, stage-change and alert emails.

Email changes currently return an unavailable response until the required previous-address notice is configured. After an uncertain sign-in issuance (`CommitOutcomeUnknown`), `verify` keeps its session id for the retry; a definite refusal drops it, so the next `verify` takes a new one from `createSessionId`.

Use `createVisitorIdentity` to replace an expired Visitor. The application picks both IDs; the SDK keeps that pair across a lost response and retries. A static `visitorIdentity` is used once; after expiry the SDK takes a new pair from `createVisitorIdentity`, or you supply one with `customer.identify({ customer_id, session_id })`.

An app creates an Order capability with `createOrderToken` from `arky-sdk/utils`, keeps it with the chosen `order_id`, and reuses both on every checkout retry. `retainCheckout` retains that pair. The token is transient and never appears in an Order record or a checkout response. Exact Order reads, payments, payment actions, fulfillments, cancellations and Order returns accept `{ order_token }` as request options; the SDK sends `X-Arky-Order-Token` only for those requests. Lists and customer, company, rental and library access keep their ordinary session scope. `order.downloadAsset({ order_id, line_item_id, asset_id, order_token })` downloads one asset from that exact Order.

For an initial email link, retain a valid fragment token against the exact API, Store and Order using `retainOrderToken(scope, orderId, token)`, then strip it from the browser URL. `readOrderToken` restores only that exact scope. Keep payment provider return URLs free of the token.
