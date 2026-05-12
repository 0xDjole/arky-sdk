# arky-sdk

Official TypeScript SDK for [Arky](https://arky.io) — Build online stores with headless CMS, e-commerce, and service scheduling.

## What is Arky?

Arky is an **all-in-one platform** that gives you everything you need to run an online store:

- 📝 **Headless CMS** - Manage content with flexible blocks, multilingual support, and AI-powered content generation
- 🛒 **E-commerce** - Sell products with multi-currency pricing, inventory, orders, and Stripe payments
- 📅 **Service Scheduling** - Sell scheduled services with providers and availability calendars
- 📧 **Newsletters** - Send newsletters to subscribers with built-in email delivery
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
})

await arkyStore.initialize({ hydrate_cart: true, load_website: true })
```

### 2. Browse Products

```typescript
// List products (like on arky.io/products)
const { items: products } = await arkyStore.eshop.product.find({
  limit: 20
});

// Get product details (like arky.io/products/guitar)
const product = await arkyStore.eshop.product.get({ id: 'prod_123' });

// Format price (uses currency from price object)
const formatted = arkyStore.utils.formatPrice(product.variants[0].prices); // "$29.99"
```

### 3. Shop & Checkout

```typescript
const product = await arkyStore.eshop.product.get({ id: 'prod_123' })
const variant = product.variants[0]

await arkyStore.eshop.cart.actions.addProduct(product, variant, 2)

const quote = await arkyStore.eshop.cart.actions.quote()

const order = await arkyStore.eshop.cart.actions.checkout({
  payment_method_id: 'credit_card',
})
```

### Framework-Agnostic Store

The storefront store is framework-agnostic and built on Nano Stores. UI frameworks can subscribe to atoms directly, while app code calls actions:

```typescript
const unsubscribe = arkyStore.eshop.cart.snapshot.subscribe((snapshot) => {
  console.log(snapshot.item_count, snapshot.cart?.id)
});

await arkyStore.eshop.cart.actions.ensure();
await arkyStore.eshop.cart.actions.clear();

unsubscribe();
```

The low-level SDK client is still available as `arkyStore.client` for unusual cases, but normal storefronts should use the store-shaped modules: `cms`, `eshop`, `crm`, `activity`, `automation`, `store`, and `utils`.

### 4. Sell Scheduled Services

```typescript
// Browse services (like arky.io/services)
const { items: services } = await arkyStore.eshop.service.find({});
const service = services[0];

await arkyStore.eshop.serviceOrder.actions.initialize();
await arkyStore.eshop.serviceOrder.actions.setService(service);
arkyStore.eshop.serviceOrder.actions.findFirstAvailable();

const state = arkyStore.eshop.serviceOrder.state.get();
if (state.slots[0]) {
  arkyStore.eshop.serviceOrder.actions.selectTimeSlot(state.slots[0]);
  arkyStore.eshop.serviceOrder.actions.nextStep();
  await arkyStore.eshop.serviceOrder.actions.addToCart();
}

const order = await arkyStore.eshop.serviceOrder.actions.checkout('cash');
```

### 5. Subscribe to Newsletter

```typescript
// Subscribe to updates (like arky.io/newsletters)
await arky.cms.subscribeToCollection({
  collectionId: 'newsletter_weekly',
  email: 'user@example.com',
  planId: 'plan_free'
});
```

### 6. Read Content

```typescript
// Fetch blog posts or content
const { items: posts } = await arky.cms.getCollectionEntries({
  collectionId: 'blog',
  limit: 10
});

// Extract content from blocks
const title = arky.utils.getBlockTextValue(
  posts[0].blocks.find(b => b.key === 'title'),
  'en'
);
const imageUrl = arky.utils.getImageUrl(
  posts[0].blocks.find(b => b.key === 'featured_image')
);
```

## API Methods

The SDK provides the following API modules:

### User Management
```typescript
// Authentication
await arky.user.loginUser({ email, password })
await arky.user.registerUser({ email, password, name })
await arky.user.getMe()
await arky.user.logout()

// Profile
await arky.user.updateUser({ name, phoneNumber, addresses })
await arky.user.resetPassword({ oldPassword, newPassword })
```

### Store
```typescript
// Store CRUD
await arky.store.createStore({ name, slug })
await arky.store.getStore()
await arky.store.updateStore({ id, name })
await arky.store.deleteStore({ id })

// Subscriptions
await arky.store.createSubscription({ planId })
await arky.store.getSubscription()
await arky.store.cancelSubscription({ immediately: true })
```

### CMS & Newsletters
```typescript
// Collections
await arky.cms.createCollection({ name, slug, type: 'NEWSLETTER' })
await arky.cms.getCollections({ type: 'NEWSLETTER' })
await arky.cms.getCollection({ id })
await arky.cms.updateCollection({ id, name })
await arky.cms.deleteCollection({ id })

// Entries (Content)
await arky.cms.createCollectionEntry({ collectionId, blocks })
await arky.cms.getCollectionEntries({ collectionId })
await arky.cms.updateCollectionEntry({ id, blocks })
await arky.cms.sendEntry({ entryId, scheduledAt })

// Newsletter Subscriptions
await arky.cms.subscribeToCollection({
  collectionId: 'newsletter_id',
  email: 'user@example.com',
  planId: 'plan_free', // Required
})
await arky.cms.getCollectionSubscribers({ id: 'newsletter_id' })
```

### E-shop
```typescript
// Products
await arkyStore.eshop.product.find({ limit: 20, cursor: null })
await arkyStore.eshop.product.get({ id })

// Carts and orders
const cart = await arkyStore.eshop.cart.actions.ensure()
await arkyStore.eshop.cart.actions.sync({ product_items, shipping_method_id })
await arkyStore.eshop.cart.actions.checkout({ payment_method_id })
await arkyStore.eshop.order.find({})
await arkyStore.eshop.order.get({ id })

// Quote
await arkyStore.eshop.cart.actions.quote()
```

### Services
```typescript
// Services
await arky.eshop.service.create({ name, duration, price })
await arky.eshop.service.find({})
await arky.eshop.service.getAvailability({ service_id, provider_id, from, to })

// Providers
await arky.eshop.provider.create({ name })
await arky.eshop.provider.find({})

// Service cart checkout
await arky.eshop.order.getQuote({ items, payment_method })
await arky.eshop.cart.checkout({ id: cart.id, payment_method_id })
await arky.eshop.order.find({})
```

### Media
```typescript
// Upload files
const media = await arky.media.uploadStoreMedia({
  files: [file1, file2],
  urls: ['https://example.com/image.jpg'],
})

// List media
const { items } = await arky.media.getStoreMedia({ limit: 20 })

// Delete media
await arky.media.deleteStoreMedia({ id: storeId, mediaId })
```

### Notifications
```typescript
// Get notifications
const notifications = await arky.notification.getNotifications({
  limit: 20,
  previous_id: null,
})

// Mark as seen
await arky.notification.updateNotifications({})

// Delivery stats
const stats = await arky.notification.getDeliveryStats({})
```

### Roles & Permissions
```typescript
await arky.role.createRole({ name, permissions })
await arky.role.getRoles({ action: 'READ' })
await arky.role.updateRole({ id, permissions })
await arky.user.setRole({ userId, roleId })
```

## Utility Functions

The SDK includes helpful utilities accessible via `arky.utils`:

### Block Utilities
```typescript
// Get image URL from block
const url = arky.utils.getImageUrl(imageBlock)

// Get block value
const value = arky.utils.getBlockValue(entry, 'title')

// Format blocks
const formatted = arky.utils.formatBlockValue(block)
const forSubmit = arky.utils.prepareBlocksForSubmission(blocks)
```

### Price Utilities
```typescript
// Format prices
const formatted = arky.utils.formatMinor(999, 'usd') // "$9.99"
const payment = arky.utils.formatPayment(paymentObject)

// Format prices from array
const formatted = arky.utils.formatPrice(prices) // "$9.99"
const amount = arky.utils.getPriceAmount(prices, 'US')
```

### Text Utilities
```typescript
const slug = arky.utils.slugify('Hello World') // "hello-world"
const title = arky.utils.humanize('hello-world') // "Hello World"
const category = arky.utils.categorify('hello-world') // "HELLO WORLD"
const date = arky.utils.formatDate(timestamp, 'en')
```

### Validation
```typescript
const result = arky.utils.validatePhoneNumber('+1234567890')
// { isValid: true } or { isValid: false, error: "..." }
```

### SVG Utilities
```typescript
// Fetch SVG content
const svgString = await arky.utils.fetchSvgContent(mediaBlock)

// For Astro
const svg = await arky.utils.getSvgContentForAstro(mediaBlock)

// Inject into element
await arky.utils.injectSvgIntoElement(mediaBlock, element, 'custom-class')
```

## What Can You Build?

- 🏪 **E-commerce shops** - Product catalogs, shopping carts, checkout
- 📰 **Content websites** - Blogs, documentation, marketing sites
- 📅 **Service businesses** - Appointment scheduling, service orders
- 📬 **Newsletter platforms** - Subscriber management, email campaigns
- 🏢 **SaaS products** - Multi-tenant apps with user auth and billing
- 🛍️ **Marketplaces** - Multi-vendor platforms with payments

## Configuration Options

```typescript
createArkyStore({
  // Required
  baseUrl: string,        // API URL
  storeId: string,        // Your store ID
  market: string,         // Market code (e.g., 'us', 'eu')

  // Optional
  locale?: string,        // Storefront locale (default: SDK/client locale)
  storageUrl?: string,    // Storage URL (default: https://storage.arky.io/dev)
  autoGuest?: boolean,    // Auto-create guest token (default: true)
  logout?: () => void,    // Logout callback
  isAuthenticated?: () => boolean,
  navigate?: (path: string) => void,
  notify?: (notification: { message: string; type: string }) => void,
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
