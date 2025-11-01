# arky-sdk

Official TypeScript SDK for Arky - All-in-one business platform

## Installation

```bash
npm install arky-sdk
```

## Quick Start

```typescript
import { createArkySDK } from 'arky-sdk'

const arky = createArkySDK({
  baseUrl: 'https://api.arky.io',
  businessId: 'your-business-id',
  storageUrl: 'https://storage.arky.io',
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
  isAuthenticated: () => !!localStorage.getItem('accessToken'),
})

// Now use the SDK
const collections = await arky.cms.getCollections({});
const products = await arky.eshop.getProducts({});
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
await arky.cms.unsubscribeFromCollection({ token: 'unsubscribe_token' })
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

### Analytics
```typescript
// Query metrics
const data = await arky.analytics.getAnalytics({
  start: '2024-01-01',
  end: '2024-12-31',
  metrics: ['revenue', 'orders', 'users'],
})

// Health check
const health = await arky.analytics.getAnalyticsHealth({})
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

// Get market prices
const price = arky.utils.getMarketPrice(prices, 'US', markets)
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

## Features

- 🚀 **TypeScript-first** - Full type safety and IntelliSense
- 📦 **Tree-shakeable** - Import only what you need
- ⚡ **Lightweight** - Minimal bundle size (~120KB)
- 🔄 **Auto-refresh** - Automatic token refresh
- 🎯 **Framework-agnostic** - Works with any JavaScript framework

## Modules

- **CMS** - Headless content management, newsletters, AI blocks
- **E-shop** - E-commerce, products, orders, checkout
- **Reservations** - Booking system, services, providers
- **Business** - Multi-tenant business management
- **User** - Authentication, profiles, roles
- **Media** - File upload, image management
- **Notifications** - Push, email, SMS
- **Analytics** - Business metrics and insights
- **Payment** - Stripe integration, quotes

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

## Migration from Newsletter Module

Newsletters are now CMS Collections with `type: 'NEWSLETTER'`:

```typescript
// Old (deprecated)
await sdk.newsletter.subscribe({ newsletterId, email })

// New
await sdk.cms.subscribeToCollection({
  collectionId: newsletterId,
  email,
  planId: 'plan_free', // Required
})
```

## License

MIT

## Links

- [Documentation](https://docs.arky.io)
- [GitHub](https://github.com/0xDjole/arky-sdk)
- [npm](https://www.npmjs.com/package/arky-sdk)
