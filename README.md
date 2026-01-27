# arky-sdk

Official TypeScript SDK for [Arky](https://arky.io) — Build online businesses with headless CMS, e-commerce, and booking systems.

## What is Arky?

Arky is an **all-in-one platform** that gives you everything you need to run an online business:

- 📝 **Headless CMS** - Manage content with flexible blocks, multilingual support, and AI-powered content generation
- 🛒 **E-commerce** - Sell products with multi-currency pricing, inventory, orders, and Stripe payments
- 📅 **Booking System** - Manage services, providers, and reservations with availability calendars
- 📧 **Newsletters** - Send newsletters to subscribers with built-in email delivery
- 👥 **User Management** - Authentication, roles, permissions, and user profiles
- 💳 **Payments** - Integrated Stripe checkout and promo codes

**Build any online business:** SaaS products, e-commerce stores, booking platforms, content sites, newsletters, or multi-tenant marketplaces.

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
  businessId: 'your-business-id',
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

### 4. Book Services

```typescript
// Browse services (like arky.io/services)
const { items: services } = await arky.reservation.getServices({});

// Check available time slots
const slots = await arky.reservation.getAvailableSlots({
  serviceId: 'service_haircut',
  from: Date.now(),
  to: Date.now() + 86400000  // Next 24 hours
});

// Book a reservation
const reservation = await arky.reservation.checkout({
  parts: [{
    serviceId: 'service_haircut',
    startTime: slots[0].startTime,
    providerId: 'provider_jane'
  }],
  paymentMethod: 'CREDIT_CARD',
  blocks: [  // Customer contact info
    { key: 'name', values: ['John Doe'] },
    { key: 'phone', values: ['+1234567890'] }
  ]
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

### Business
```typescript
// Business CRUD
await arky.business.createBusiness({ name, slug })
await arky.business.getBusiness()
await arky.business.updateBusiness({ id, name })
await arky.business.deleteBusiness({ id })

// Subscriptions
await arky.business.createSubscription({ planId })
await arky.business.getSubscription()
await arky.business.cancelSubscription({ immediately: true })
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

### Reservations
```typescript
// Services
await arky.reservation.createService({ name, duration, price })
await arky.reservation.getServices({})
await arky.reservation.getAvailableSlots({ serviceId, start, end })

// Providers
await arky.reservation.createProvider({ name, serviceIds })
await arky.reservation.getProviders({})

// Reservations
await arky.reservation.createReservation({ parts, blocks })
await arky.reservation.checkout({ parts, paymentMethod })
await arky.reservation.searchReservations({ start, end })
```

### Media
```typescript
// Upload files
const media = await arky.media.uploadBusinessMedia({
  files: [file1, file2],
  urls: ['https://example.com/image.jpg'],
})

// List media
const { items } = await arky.media.getBusinessMedia({ limit: 20 })

// Delete media
await arky.media.deleteBusinessMedia({ id: businessId, mediaId })
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

// Get block values
const value = arky.utils.getBlockValue(entry, 'title')
const values = arky.utils.getBlockValues(entry, 'gallery')
const text = arky.utils.getBlockTextValue(block, 'en')

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

// Currency
const symbol = arky.utils.getCurrencySymbol('USD') // "$"
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

- 🏪 **E-commerce stores** - Product catalogs, shopping carts, checkout
- 📰 **Content websites** - Blogs, documentation, marketing sites
- 📅 **Booking platforms** - Appointment scheduling, service bookings
- 📬 **Newsletter platforms** - Subscriber management, email campaigns
- 🏢 **SaaS products** - Multi-tenant apps with user auth and billing
- 🛍️ **Marketplaces** - Multi-vendor platforms with payments

## Configuration Options

```typescript
createArkySDK({
  // Required
  baseUrl: string,        // API URL
  businessId: string,     // Your business ID
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
  Business,
  Price,
  // ... and many more
} from 'arky-sdk'
```

## License

MIT

## Links

- [Documentation](https://docs.arky.io)
- [GitHub](https://github.com/0xDjole/arky-sdk)
- [npm](https://www.npmjs.com/package/arky-sdk)
