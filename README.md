# arky-sdk

Official TypeScript SDK for [Arky](https://arky.io) — Build online stores with headless CMS, e-commerce, and service scheduling.

## What is Arky?

Arky is an **all-in-one platform** that gives you everything you need to run an online store:

- 📝 **Headless CMS** - Manage content with flexible blocks, multilingual support, and AI-powered content generation
- 🛒 **E-commerce** - Sell products with multi-currency pricing, inventory, orders, and Stripe payments
- 📅 **Service Scheduling** - Sell scheduled services with providers and availability calendars
- 📧 **Campaigns** - Send template-backed newsletters, broadcasts, and outreach emails through tenant mailboxes
- 👥 **User Management** - Authentication, roles, permissions, and user profiles
- 💳 **Payments** - Integrated Stripe checkout and promo codes

**Build any online store:** SaaS products, e-commerce shops, service businesses, content sites, newsletters, or multi-tenant marketplaces.

## Why Use This SDK?

Instead of manually calling REST APIs, use this TypeScript SDK to:

✅ **Type-safe** - Full TypeScript support with IntelliSense  
✅ **Auto-authentication** - Handles tokens, refresh, and guest sessions automatically  
✅ **Utility helpers** - Extract block values, format prices, slugify text, validate phones  
✅ **Framework-agnostic** - Works in React, Vue, Svelte, Node.js, or any JS environment  

## Installation

```bash
npm install arky-sdk
```

## Quick Start

### 1. Install & Initialize

```typescript
import { createArkyStore } from 'arky-sdk/storefront-store'

const arkyStore = createArkyStore({
  baseUrl: 'https://api.arky.io',
  storeId: 'your-store-id',
  market: 'us',
  locale: 'en',
  marketForLocale: (locale) => locale === 'it' ? 'ita' : 'us',
})

const { cart } = await arkyStore.setup({
  locale: 'en',
  hydrateCart: true,
})

const websiteNode = await arkyStore.cms.node.get({
  key: 'website',
  locale: 'en',
})
```

### 2. Browse Products

```typescript
// List products (like on arky.io/products)
const { items: products } = await arkyStore.eshop.product.list({
  limit: 20
});

// Get product details (like arky.io/products/guitar)
const product = await arkyStore.eshop.product.loadDetail({ id: 'prod_123' });

// Format price (uses currency from price object)
const formatted = arkyStore.utils.formatPrice(product.variants[0].prices); // "$29.99"
```

### 3. Shop & Checkout

```typescript
const product = await arkyStore.eshop.product.loadDetail({ id: 'prod_123' })
const variant = product.variants[0]

await arkyStore.eshop.cart.addProduct(product, variant, 2)

const quote = await arkyStore.eshop.cart.quote()

const order = await arkyStore.eshop.cart.checkout({
  payment_method_id: 'credit_card',
})
```

### Framework-Agnostic Store

The storefront store is framework-agnostic and built on Nano Stores. UI frameworks can subscribe to atoms directly, while app code calls direct store methods:

```typescript
await arkyStore.setup({
  locale: 'en',
  hydrateCart: true,
  track: {
    type: 'page_view',
    payload: { url: location.pathname },
  },
})

const unsubscribe = arkyStore.eshop.cart.snapshot.subscribe((snapshot) => {
  console.log(snapshot.item_count, snapshot.cart?.id)
});

await arkyStore.eshop.cart.ensure();
await arkyStore.eshop.cart.clear();

unsubscribe();
```

For content-heavy pages, a website node load can be a single context-aware call:

```typescript
const website = await arkyStore.cms.node.get({ key: "website", locale: 'en' })
const info = website.blocks.find((block) => block.key === 'info')
```

The low-level SDK client is still available as `arkyStore.client` for unusual cases, but normal storefronts should use the store-shaped modules: `cms`, `eshop`, `crm`, `activity`, `automation`, `store`, and `utils`.

### 4. Sell Scheduled Services

```typescript
// Browse services (like arky.io/services)
const { items: services } = await arkyStore.eshop.service.list({});
const service = services[0];

await arkyStore.eshop.service.initialize();
await arkyStore.eshop.service.select(service);
arkyStore.eshop.service.findFirstAvailable();

const state = arkyStore.eshop.service.state.get();
if (state.slots[0]) {
  arkyStore.eshop.service.selectTimeSlot(state.slots[0]);
  arkyStore.eshop.service.nextStep();
  await arkyStore.eshop.service.addToCart();
}

const order = await arkyStore.eshop.cart.checkout({
  payment_method_id: 'cash',
});
```

### 5. Read Content And Submit Forms

```typescript
const website = await arkyStore.cms.node.get({ key: "website", locale: 'en' })
const titleBlock = website.blocks.find((block) => block.key === 'title')
const title = arkyStore.utils.getBlockTextValue(titleBlock, 'en')

await arkyStore.cms.form.submitByKey({
  key: 'contact',
  entries: [
    { key: 'email', value: 'profile@example.com' },
    { key: 'message', value: 'Hello from the storefront' },
  ],
})
```

## Storefront Modules

The store-shaped API is the preferred surface for websites:

```typescript
await arkyStore.setup({ hydrateCart: true })

await arkyStore.cms.node.get({ key: "website", locale: 'en' })
await arkyStore.cms.form.submitByKey({ key: 'contact', entries: [] })

await arkyStore.eshop.product.list({ limit: 20 })
await arkyStore.eshop.cart.ensure()
await arkyStore.eshop.cart.quote()
await arkyStore.eshop.cart.checkout({ payment_method_id: 'cash' })

await arkyStore.eshop.service.list({ limit: 20 })
await arkyStore.eshop.service.initialize()

await arkyStore.activity.pageView({ path: location.pathname })
```

## Low-Level Client

The underlying SDK remains available for admin tools or uncommon integrations:

```typescript
const sdk = arkyStore.client

await sdk.eshop.product.find({ limit: 20 })
await sdk.eshop.cart.current({ market: arkyStore.getMarket() })
await sdk.eshop.order.find({})
await sdk.cms.node.get({ key: 'website' })
```

## Utility Functions

The SDK includes helpful utilities accessible through `arkyStore.utils`:

```typescript
const title = arkyStore.utils.getBlockTextValue(block, 'en')
const imageUrl = arkyStore.utils.getImageUrl(imageBlock)
const price = arkyStore.utils.formatPrice(prices)
const payment = arkyStore.utils.formatPayment(paymentObject)
const slug = arkyStore.utils.slugify('Hello World')
const date = arkyStore.utils.formatDate(Date.now(), 'en')
const phone = arkyStore.utils.validatePhoneNumber('+1234567890')
```

## What Can You Build?

- 🏪 **E-commerce shops** - Product catalogs, shopping carts, checkout
- 📰 **Content websites** - Blogs, documentation, marketing sites
- 📅 **Service businesses** - Appointment scheduling, service scheduling
- 📬 **Newsletter platforms** - Subscriber management, email campaigns
- 🏢 **SaaS products** - Multi-tenant apps with user auth and billing
- 🛍️ **Marketplaces** - Multi-vendor platforms with payments

## Configuration Options

```typescript
createArkyStore({
  // Required
  baseUrl: string,        // API URL
  storeId: string,        // Your store ID

  // Optional
  market?: string,        // Market key (e.g., 'us', 'eu')
  locale?: string,        // Storefront locale (default: SDK/client locale)
  apiToken?: string,      // Trusted server-side API token
  marketForLocale?: (locale: string) => string | null,
  navigate?: (path: string) => void,
  loginFallbackPath?: string,
})
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import type {
  HttpClientConfig,
  ApiResponse,
  Block,
  Store,
  Price,
  // ... and many more
} from 'arky-sdk'
```

## Adding a new endpoint

When adding a new SDK method, follow this checklist so the API surface stays typed end-to-end and request shapes stay aligned with the Rust DTOs on the server:

1. **Define the entity** in `src/types/index.ts` if it does not already exist. Mirror the Rust response struct field-for-field.
2. **Define the request params** in `src/types/api.ts`. Mirror the Rust DTO in `server/core/src/{module}/types/commands.rs` field-for-field. Two exceptions: `store_id?: string` and `market?: string` are optional in TS (the SDK auto-fills both from `apiConfig.storeId` and `apiConfig.market`). Do **not** use `[key: string]: any` index signatures.
3. **Annotate the SDK method's return type** using the matching entity from `src/types/index.ts`.
4. **Pass the response generic to the HTTP call**: `apiConfig.httpClient.post<EntityType>(...)`, `apiConfig.httpClient.get<PaginatedResponse<EntityType>>(...)`, etc. Never rely on inference.
5. **Inject `market` from `apiConfig`**: when a body needs a `market` field, write `{ market: apiConfig.market, ...payload }`. Never hardcode `"default"`, `"eshop"`, or any other market string in `src/api/*.ts`.
6. **Re-export the entity** from `src/index.ts` if consumers (admin, storefront) will import it.
7. **Bump `SDK_VERSION`** in `src/index.ts` and the `version` in `package.json`. Patch only.

A guardrail script (`scripts/check-no-any.mjs`) runs on `npm run build` (via `prebuild`) and fails red if `: any`, `as any`, or hardcoded `market: "..."` literals show up in `src/api/*.ts`.

## License

MIT

## Links

- [Documentation](https://docs.arky.io)
- [GitHub](https://github.com/0xDjole/arky-sdk)
- [npm](https://www.npmjs.com/package/arky-sdk)
