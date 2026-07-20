# arky-sdk

Official TypeScript SDK for [Arky](https://arky.io), the website backend and Admin client for custom frontends.

## Installation

```bash
npm install arky-sdk
```

## Storefront quick start

The current browser contract is `arky-sdk@0.11.3`. Pin that exact version during the coordinated
prelaunch cutover so the Server, App, and storefront route/header contracts move together:

```bash
npm install --save-exact arky-sdk@0.11.3
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

The SDK accepts only an `arky_pk_...` publishable key. A personal `arky_api_...` token or an `arky_vst_...` visitor session is rejected at initialization. Publishable keys identify a Store; they grant no Admin access and are safe to include in browser code.

## Read content and submit forms

Anonymous CMS and catalog reads do not create a visitor:

```typescript
const page = await arky.cms.entry.get({
  collection_id: "pages",
  key: "homepage",
});

const titleBlock = page.blocks.find((block) => block.key === "title");
const title = arky.utils.getBlockTextValue(titleBlock, arky.getLocale());
```

Stateful operations identify the visitor lazily. Concurrent first operations share one identify request:

```typescript
await arky.cms.form.submitByKey({
  key: "contact",
  values: {
    email: "visitor@example.com",
    message: "Hello from the storefront",
  },
});
```

The browser persists only the `arky_vst_...` visitor-session token. Storage is isolated by API endpoint and a fingerprint of the publishable key.

## Products, services, and checkout

```typescript
const { items: products } = await arky.eshop.product.list({ limit: 20 });
const product = await arky.eshop.product.get({ id: products[0].id });

await arky.eshop.cart.addProduct(product, product.variants[0], 2);
await arky.eshop.cart.quote();

const order = await arky.eshop.cart.checkout({
  payment_method_key: "cash",
});
```

Scheduled services use the same cart:

```typescript
const { items: services } = await arky.eshop.service.list({ limit: 20 });

await arky.eshop.service.initialize();
await arky.eshop.service.select(services[0]);
arky.eshop.service.findFirstAvailable();

const state = arky.eshop.service.state.get();
if (state.slots[0]) {
  arky.eshop.service.selectTimeSlot(state.slots[0]);
  arky.eshop.service.nextStep();
  await arky.eshop.service.addToCart();
}
```

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
const page = await italian.cms.entry.get({
  collection_id: "pages",
  key: "homepage",
});
```

Changing the scoped client does not mutate the original client. A market change while the cart contains items throws `CART_MARKET_LOCKED`; the SDK never silently clears or reprices the cart.

## Store setup and Stripe

Store setup is fetched lazily and deduplicated:

```typescript
const setup = await arky.store.load();
console.log(setup.languages.default, setup.markets.default);
```

Payment configuration belongs to Arky. Mounting card payment waits for setup internally and accepts no Stripe publishable key or connected Account ID:

```typescript
await arky.eshop.cart.payment.mount("#payment", {
  appearance: { theme: "stripe" },
});
```

For a paid flow outside the cart, pass only customer-facing amount and currency:

```typescript
await arky.eshop.cart.payment.mount("#payment", {
  amount: 2500,
  currency: "EUR",
  setupFutureUsage: "off_session",
});
```

`setupFutureUsage` is optional. Use `"off_session"` when the paid flow will
reuse the payment method later, such as a subscription.

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

Create one client per request. `withContext` also creates an isolated visitor session; when used during SSR it reuses the request-local adapter under a separate scoped storage key. The SDK does not ship framework-specific cookie adapters.

## Low-level storefront client

The module facade exposes its low-level client as `arky.client`:

```typescript
await arky.client.eshop.product.find({ limit: 20 });
const cart = await arky.client.eshop.cart.current();
await arky.client.eshop.cart.get({ id: cart.id, token: cart.token });
await arky.client.cms.entry.find({
  collection_id: "pages",
  key: "homepage",
  limit: 1,
});
```

Low-level requests use Store-ID-free `/v1/storefront` routes and send connection context as headers:

```http
X-Arky-Publishable-Key: arky_pk_...
X-Arky-Locale: it
X-Arky-Market: ita
Authorization: Bearer arky_vst_...
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

Store connection management is available through the Admin surface:

```typescript
const store = await admin.store.regeneratePublishableKey({
  store_id: "internal-store-id",
});

await admin.store.update({
  id: store.id,
  default_market_id: "market-id",
});
```

## TypeScript

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

It builds the distributable package and runs every SDK contract case. App alone owns cross-repository
Server compatibility against the exact immutable test Server image digest. Each storefront owns a
hermetic repo-local build/preview Playwright smoke through its own `npm test`; storefronts never pull
or run the shared test Server image.

## Adding an endpoint

When adding SDK methods:

1. Mirror server response DTOs in `src/types/index.ts` or the relevant API module.
2. Keep Admin inputs Store-explicit, but omit `store_id` from every storefront input, URL, and body.
3. Use `/v1/storefront/...` keyless routes and let the shared client attach publishable-key, locale, market, and visitor headers.
4. Mark customer mutations as stateful so they call the deduplicated visitor-session lifecycle.
5. Add explicit response generics to every HTTP call and re-export consumer-facing types.
