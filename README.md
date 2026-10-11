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
});
```

Only an `arky_pk_...` publishable key is accepted. Each storefront key belongs to exactly one sales channel, so carts, prices and checkouts made with it use that channel; there is no channel option or header. `X-Arky-Locale` is the only source of the language, so storefront quotes and checkouts send no `language` in the body. Change the context with `setContext({ locale, market })`, or make a scoped copy with `withContext(...)`. `getSetup()` answers the store's `name`, `timezone`, `languages` and payment options.

### Customer sessions

```typescript
await arky.customer.identify();
await arky.customer.requestCode({ id: crypto.randomUUID(), email: "ana@example.com", language: "en" });
await arky.customer.verify({ code: "123456" });
const me = await arky.customer.getMe();
await arky.customer.updateMe({ expected_updated_at: me.customer.updated_at, first_name: "Ana" });
await arky.customer.resubscribe();

await arky.customer.requestCode({ id: crypto.randomUUID(), email: "ana.new@example.com", language: "en" });
await arky.customer.changeEmail({ code: "654321", language: "en" });
```

`requestCode` names the code email's id and its language. On a signed-in session it starts an email change instead of a sign-in: the code goes to the new address, and `changeEmail({ code, language })` proves it. The session stays signed in, the email becomes the new verified address, and the old address gets a notice in `language`. `updateMe` can't replace or remove a verified email. Sessions are kept in `localStorage`, or in the `sessionStorage` adapter you pass (needed during SSR). When `verify` signs the visitor in as a customer who already exists, Arky merges the visitor's cart into that customer's cart in the same step. The next `cart.current(...)` follows the merged visitor cart to that cart and selects it, so the customer lands on their merged cart, on a new browser too; `cart.create` or `cart.forget` for the same buyer and catalog drops the pending follow.

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
  form_updated_at: form.updated_at,
  id: crypto.randomUUID(),
  language: "en",
  answers: [{ type: "text", question_id: form.questions[0].id, key: "message", value: "Hello" }],
});
```

Entry slugs are unique per collection and language, so a slug lookup names its collection and reads the client's locale. Every stored media file carries its public `url`; images have `original`, `thumbnail`, `small`, `medium` and `large`.

A submission names the `updated_at` of the form it was filled in from (`form_updated_at`); when the form changed since, Arky refuses it with 409 `FORM_SUBMISSION.FORM_CHANGED`, so load the form again. The storefront store's `forms.submitByKey` sends the loaded form's version itself. File answers carry `File` objects; the SDK sends the submission as multipart, with each file in the same request (up to 10 MiB a file, 20 files and 50 MiB a submission). An answer exists only when it is given, so empty or whitespace-only text, empty choices and empty file lists are left out. `buildFormAnswers(form, values)` turns a plain `{ key: value }` map into checked answers. The storefront gets back its own copy of the submission (`StorefrontFormSubmission`: `id`, `form_id`, `language`, `answers`, `stage_id` and the two times, no staff history).

### Catalog and products

```typescript
const catalogs = await arky.eshop.catalog.find();
const products = await arky.eshop.product.find({ catalog_id, include_price: true, limit: 20 });
const product = await arky.eshop.product.get({ slug: "espresso", catalog_id, include_price: true });
const byKey = await arky.eshop.product.getByKey({ key: "espresso-x1", catalog_id, include_price: true });
const category = await arky.category.getByKey({ key: "coffee" });
const variants = await arky.eshop.productVariant.find({ product_id: product.id, catalog_id, include_price: true });
```

`get` reads a product, booking service or category by its id or by its slug in the client's locale, and a miss is a 404. A key is read only through `getByKey`, on its own `by-key` route.

### Cart and checkout

```typescript
const created = await arky.eshop.cart.create({
  id: crypto.randomUUID(),
  buyer: { type: "customer" },
  catalog_id: null,
});
let cart = created.cart;

cart = await arky.eshop.cart.addProduct({
  id: cart.id,
  expected_updated_at: cart.updated_at,
  product: {
    id: crypto.randomUUID(),
    product_id,
    variant_id,
    quantity: 1,
    purchase: { type: "catalog" },
  },
});

const quote = await arky.eshop.cart.quote({ id: cart.id });

const accepted = await arky.eshop.cart.checkout({
  order_id: crypto.randomUUID(),
  cart_id: cart.id,
  expected_updated_at: cart.updated_at,
  presentation_digest: quote.presentation_digest,
  contact_email: "ana@example.com",
  payment: {
    type: "payment_option",
    payment_option_id: quote.suggested_payment_option_id!,
    return_url: location.href,
    save_payment_method: false,
    payment_method_terms_version: null,
  },
});
```

The quote is in the client's locale. `quote.ready` is false while `quote.blockers` lists what is missing (a delivery, a shipping choice, a billing address, …); each delivery's `offers` name their shipping method by `shipping_method_key` and `shipping_method_blocks`, so a storefront can show "Courier €45". `cart.current({ buyer, catalog_id })` reads the cart this browser selected for the signed-in customer (a cart that was merged is followed to its target when the target is this customer's), `cart.forget()` drops the selection, and `cart.reorder({ id, order_id, buyer })` starts a cart from an earlier order and selects it under the buyer and the new cart's `catalog_id`, as `create` does, so it survives a reload. Checkout is refused when the quote changed (`CartPresentationChangedError` carries the new quote). A checkout can be kept across reloads with `retainCheckout`, `pendingCheckout` and `recoverCheckout`; a definite refusal (any 4xx but 408 and 429, including the changed-quote 409) drops the kept request, so the cart can be changed and quoted again.

### Paying

```typescript
import { mountCheckoutAction } from "arky-sdk/storefront";

if (accepted.type === "placed") {
  await mountCheckoutAction(accepted.payment_action, "#payment", {}, accepted.payment_id ?? undefined);
}
```

Checkout answers `{ type: "placed", order_id, number, payment_id, payment_action }`, or `{ type: "already_member", customer_group_member_id }` when the cart is a free sign-up the buyer already holds (no order is made). Stripe embedded Checkout and Monri card entry are supported. `eshop.order.paymentAction({ order_id })` resumes an unfinished payment. Saved cards use `eshop.paymentMethod.requestSetup`, `startSetup` (with `mountPaymentMethodSetup`) and `completeSetup`.

### Orders, customer groups and more

- `eshop.order`: `find`, `get`, `fulfillments`, `findPayments`, `getPayment`, `paymentAction`, `cancelProductItem`, `cancelBookingItem`.
- `eshop.library`: `find`, `getProduct`, `findAssets`, `download` (digital files the buyer owns). Pass nothing for the customer's own files, `company_id` for a company's, or `company_location_id` alone for a location's.
- `eshop.customerGroup` (`find`, `get`) and `eshop.customerGroupOffering.get`: the groups a store sells, read like products (`catalog_id`, `include_price`). A cart buys one with `eshop.cart.addCustomerGroup({ id, expected_updated_at, customer_group: { id, customer_group_id, start, deliveries } })`; `start` is `{ type: "on_acceptance" }`, `{ type: "scheduled", starts_at }` or, to move a member to another group of its offering, `{ type: "switch", customer_group_member_id }`.
- `eshop.customerGroupMember`: `find` (the customer's own members, or a company's or location's with `company_id` / `company_location_id`), `get`, `findOrders`, `getRevision` (a revision with its terms), `purchaseAccess({ id, catalog_id })`, `calendar` (the next occurrence and the one after a skip), and the member's actions `cancel`, `pause`, `resume`, `skipNext`, `selectPaymentMethod` and `withdrawRevision`. A switch is `reviewSwitch` then `switch` with the same body; it may name a `catalog_id`: Arky then prices it from that catalog, which must sell in the market of the member's first order (`CUSTOMER_GROUP_MEMBER.CATALOG_OTHER_MARKET` otherwise); without one it is priced from the current terms' catalog. When that catalog doesn't list the new group, has no price for it or doesn't let the buyer buy from it, `reviewSwitch` and `switch` answer 409 `CUSTOMER_GROUP_MEMBER.TARGET_NOT_PRICED`. A switch names no rentals: when the new terms start, each rented machine stays on its entitlement if that entitlement still lends the same variant, else moves to a free entitlement lending that variant, else is returned. The storefront gets the customer's copies (`CustomerGroupMemberSelf`, `CustomerGroupMemberRevisionDetailSelf`, `CustomerGroupMemberChangeSelf`): no staff emails or internal reasons.
- `eshop.minimumProgress.get({ customer_id } | { company_id } | { company_location_id })`: progress toward a group's purchase minimum. A company whose minimum counts per location answers `per_location`; read each location instead.
- `eshop.paymentMethod`: saved cards (`find`, `get`, `requestSetup`, `startSetup`, `completeSetup`, …), `currentConsentText({ language })` for the text a buyer accepts when saving a card, and `consentText({ terms_version })` for an earlier one.
- `eshop.rental`, `eshop.return`, `companies` (the signed-in customer's companies, locations and access grants).
- `support.conversation`: `start({ id, language, flow_key })` (without `flow_key` the chat goes straight to the team) answers the conversation, its first messages and the chat's `support_token`; `get`, `findMessages`, `getMessage` and `sendMessage({ support_token, conversation_id, id, input, prompt_message_id })` take that token. `input` is `{ type: "text", text }` or `{ type: "button", label }`; while the chat waits on a choice, question or email prompt, `prompt_message_id` names the prompt shown (409 `SUPPORT.STALE_PROMPT` otherwise).
- `actions.track({ key, data })`, `experiments.use({ key })`. An assignment means the storefront asked for a version, so call `experiments.use` only where that version is actually shown. A goal of `order_placed` means an order was placed, paid or not.

## Storefront store

`initialize` wraps the storefront client in [nanostores](https://github.com/nanostores/nanostores) atoms for UI frameworks:

```typescript
import { initialize } from "arky-sdk/storefront";

export const store = initialize("arky_pk_...", { locale: "en", market: "eu" });

await store.eshop.cart.load({ buyer: { type: "customer" } });
await store.eshop.cart.addProduct({ id: crypto.randomUUID(), product_id, variant_id, quantity: 1, purchase: { type: "catalog" } });
await store.eshop.cart.quote();
await store.eshop.cart.checkout({ order_id: crypto.randomUUID(), contact_email, payment });
```

The store keeps `cart`, `quote_result`, `status` and `last_order`, uses the store's locale for quotes, and refuses to change the market while the cart has items. `eshop.cart.addCustomerGroup(input)` adds a group line, `customer_group_items` lists the cart's group lines, and `setFutureDeliveries` / `quoteFutureDeliveries` take each group line's deliveries. The booking store (`eshop.bookingService`) builds the calendar and slots; `addToCart([{ id, slot }])` adds each chosen slot under the line id you give.

## Admin client

```typescript
import { createAdmin } from "arky-sdk/admin";

const admin = createAdmin({ baseUrl: "https://api.arky.io", apiToken: process.env.ARKY_API_TOKEN });
```

Without `apiToken`, sign in with `admin.account.auth.code({ email })` and `admin.account.auth.verify({ session_id, code })`.

| Namespace | What it covers |
|---|---|
| `account` | `getMe`, `delete`, `search`, `apiToken`, `session`, `auth` |
| `platform` | currencies, webhook events, store plans, `administrator` (each with its account's `email`), `stripeBillingEvent` |
| `store` | the store (with `pauseEmailSending` and `allowEmailSending`), `subscription` (with `endGrant` for platform administrators), `usage.find` (each counter beside its plan allowance), `member` (an invite lasts 7 days, inviting again renews it, and the invited account accepts with `acceptInvite`), `role`, `webhook`, `location`, `market`, `salesChannel`, `storefrontKey` (each publishable key belongs to one sales channel for good; `revoke` retires it), `paymentOption`, `zone`, `taxCategory`, `shippingProfile`, `shippingMethod` |
| `notification` | notifications (`email` or `webhook`; a notification is never stopped), `template` (`transactional` with its sending address and email type, or `support_reply`), `emailDomain`, `emailAddress` (the store's sending and receiving addresses) |
| `broadcast` | one email to the members of a customer group offering or of chosen customer groups, sent from one of the store's addresses; `BROADCAST_FIELDS` and `BROADCAST_BLOCK_FIELD_PREFIXES` list the placeholders it may use |
| `support` | `flow` (fixed-step chat flows), `conversation` (chat and email in one record, with `reply`, `selectSendingAddress`, `resolve`, `assign`, `notes` and `attachmentLink`) |
| `media`, `category`, `content` | files, categories, collections and entries |
| `forms` | forms, submissions, stage changes, files, `notes` |
| `companies`, `customers` | companies with locations, purchasing (`setPurchasing`), tax registrations (`submitTaxRegistration`, `reviewTaxRegistration`), roles, memberships with scoped grants, and notes; customers with sessions, email suppressions, notes, `erase` and `merge` |
| `actions`, `experiments`, `analytics` | the customer timeline, A/B tests, reports |
| `eshop` | products, variants, digital assets, bookings, prices, catalogs, promotions, `customerGroup`, `customerGroupOffering` and `customerGroupMember` (with `assign`, `current`, `revisions`, `purchaseAccess`, `calendar`, each change as `review…` then the change, and `transferPurchaseRequirement`), payment methods (with `consentText`), payments (with `resolveRefund` and `resolveCharge` for Monri), provider events, carts, orders (with credits and notes), inventory, fulfillment, `minimumProgress`, returns (with `credit` for received goods) and rentals |

A customer group without entitlements is a free sign-up: it is permanent, its price is 0 in every catalog that lists it, and Arky refuses any other amount. The team can `assign` a customer, company or location to a group that neither ships nor lends anything, without an order; assigning into another group of an offering the subject already holds moves them.

Deletes of records that clean up after themselves (stores, markets, locations, catalogs, products, variants, bookings, categories, collections, media, companies, inventory items) return the record marked `deleting` (a variant or inventory item that is already gone answers nothing); most other deletes return `{ deleted }`, and a few (prices, catalog items and accesses, experiments, customer groups and customer group offerings) return nothing.

## Utilities

`arky-sdk/utils` and `client.utils` hold block readers (`getBlockTextValue`, `getBlockContentValue`, `selectLocalizedText`, `collectBlockReferences`), media URLs (`getImageUrl`), money formatting (`formatMinor`, `formatMoney`, `formatPrice`, `CURRENCY_MINOR_UNITS`), time helpers, key validation and `requireId` / `isCanonicalId`. Formatting helpers take the locale explicitly.

## Releasing

SDK packages are released by tagging the protected `master` commit with `v<package.json version>`. The `Publish SDK` workflow runs the tests and publishes with npm provenance. Version bumps are patch-only.
