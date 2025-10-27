# @arky/sdk

Official TypeScript SDK for Arky - All-in-one business platform

## Installation

```bash
npm install @arky/sdk
```

## Quick Start

### API Client (No State)

```typescript
import { initArky } from '@arky/sdk'

initArky({
  apiUrl: 'https://api.arky.io',
  businessId: 'your-business-id',
  storageUrl: 'https://storage.arky.io'
})

// Now use the API
import { cmsApi } from '@arky/sdk'

const { getCollection } = cmsApi();
const collection = await getCollection('website');
```

### With Reactive Stores

```typescript
import { initArky } from '@arky/sdk/stores'
import { cartItems, eshopActions } from '@arky/sdk/stores'

initArky({
  apiUrl: 'https://api.arky.io',
  businessId: 'your-business-id'
})

// Use stores (framework-agnostic)
cartItems.subscribe(items => console.log('Cart:', items))
await eshopActions.addToCart({ productId: 'x', variantId: 'y', quantity: 1 })
```

## Framework Integration

### Svelte (No adapter needed!)

```svelte
<script>
  import { cartItems, eshopActions } from '@arky/sdk/stores'
</script>

<button on:click={() => eshopActions.addToCart(...)}>
  Cart ({$cartItems.length})
</button>
```

### React

```bash
npm install @nanostores/react
```

```typescript
import { useStore } from '@nanostores/react'
import { cartItems } from '@arky/sdk/stores'

function Cart() {
  const items = useStore(cartItems)
  return <div>Cart ({items.length})</div>
}
```

### Vue

```bash
npm install @nanostores/vue
```

```vue
<script setup>
import { useStore } from '@nanostores/vue'
import { cartItems } from '@arky/sdk/stores'

const items = useStore(cartItems)
</script>

<template>
  <div>Cart ({{ items.length }})</div>
</template>
```

## Features

- 🚀 TypeScript-first
- 🎯 Framework-agnostic
- 📦 Tree-shakeable
- 🔄 Optional reactive stores (nanostores)
- ⚡ Tiny bundle size

## Modules

- **CMS** - Headless content management
- **E-shop** - E-commerce & orders
- **Reservations** - Booking system
- **Newsletter** - Email campaigns
- **Analytics** - Business insights

## License

MIT
