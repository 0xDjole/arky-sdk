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
import { createArkySDK } from 'arky-sdk'

const arky = createArkySDK({
  baseUrl: 'https://api.arky.io',
  storeId: 'your-store-id',
  market: 'us',
  getToken: () => ({
    accessToken: localStorage.getItem('accessToken') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
    provider: 'EMAIL',
    expiresAt: 0,
  }),
  setToken: (tokens) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
})
```

### 2. Browse Products

```typescript
// List products (like on arky.io/products)
const { items: products } = await arky.eshop.getProducts({
  limit: 20
});

// Get product details (like arky.io/products/guitar)
const product = await arky.eshop.getProduct({ id: 'prod_123' });

// Format price (uses currency from price object)
const formatted = arky.utils.formatPrice(product.variants[0].prices); // "$29.99"
```

### 3. Shop & Checkout

```typescript
// Add to cart and checkout (like arky.io/cart)
const order = await arky.eshop.checkout({
  items: [{
    productId: 'prod_123',
    variantId: 'var_456',
    quantity: 2
  }],
  paymentMethod: 'CREDIT_CARD',
  shippingMethodId: 'standard',
  blocks: [  // Customer info
    { key: 'email', values: ['customer@example.com'] },
    { key: 'shipping_address', values: ['123 Main St'] }
  ]
});
```

### 4. Sell Scheduled Services

```typescript
// Browse services (like arky.io/services)
const { items: services } = await arky.eshop.service.find({});

// Check available time slots
const availability = await arky.eshop.service.getAvailability({
  service_id: 'service_haircut',
  provider_id: 'provider_jane',
  from: Math.floor(Date.now() / 1000),
  to: Math.floor(Date.now() / 1000) + 86400,
});

// Create an order with a service line
const order = await arky.eshop.order.checkout({
  items: [{
    type: 'service',
    service_id: 'service_haircut',
    provider_id: 'provider_jane',
    slots: [{
      from: availability.available_slots[0].from,
      to: availability.available_slots[0].to,
    }],
  }],
  payment_method: 'cash',
  forms: [],
});
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
await arky.eshop.createProduct({ name, description, variants })
await arky.eshop.getProducts({ limit: 20, cursor: null })
await arky.eshop.getProduct({ id })
await arky.eshop.updateProduct({ id, name })

// Orders
await arky.eshop.checkout({ items, paymentMethod, shippingMethodId })
await arky.eshop.getOrders({})
await arky.eshop.getOrder({ id })
await arky.eshop.updateOrderStatus({ id, status: 'SHIPPED' })

// Quote
await arky.eshop.getQuote({
  items: [{ productId, variantId, quantity }],
  currency: 'usd',
  paymentMethod: 'CREDIT_CARD',
})
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

// Service orders
await arky.eshop.order.getQuote({ items, payment_method })
await arky.eshop.order.checkout({ items, payment_method })
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
createArkySDK({
  // Required
  baseUrl: string,        // API URL
  storeId: string,        // Your store ID
  market: string,         // Market code (e.g., 'us', 'eu')

  // Token management
  getToken: () => TokenData,
  setToken: (tokens: TokenData) => void,

  // Optional
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
