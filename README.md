# arky-sdk

Official TypeScript SDK for [Arky](https://arky.io), the website backend and client Admin for custom frontends.

Arky lets you keep frontend control while using one backend for CMS, commerce, bookings, forms, profiles, action, experiments, support, workflows, API, and SDK.

## Installation

```bash
npm install arky-sdk
```

## Storefront Quick Start

Use `initialize` from `arky-sdk/storefront` for normal custom frontends. It creates the Arky storefront object, keeps store/locale/market context, and exposes the backend modules the frontend needs.

```typescript
import { initialize } from "arky-sdk/storefront";

const arky = initialize({
  baseUrl: "https://api.arky.io",
  storeId: "your-store-id",
  market: "us",
  locale: "en",
  marketForLocale: (locale) => (locale === "it" ? "ita" : "us"),
});

const homepage = await arky.cms.entry.get({
  collection_id: "pages",
  key: "homepage",
  locale: "en",
});

await arky.action.track({
  key: "page.view",
  payload: { path: location.pathname },
});
```

`initialize` is the public storefront factory. Use the Arky domain noun `Store` for tenant/business concepts, not for naming the SDK factory.

## Storefront Modules

The storefront module API is the preferred surface for websites:

```typescript
await arky.hydrateCart();

await arky.cms.entry.get({
  collection_id: "pages",
  key: "homepage",
  locale: "en",
});
await arky.cms.form.submitByKey({ key: "contact", entries: [] });

const { items: products } = await arky.eshop.product.list({ limit: 20 });
await arky.eshop.cart.addProduct(products[0], products[0].variants[0], 1);
await arky.eshop.cart.quote();
await arky.eshop.cart.checkout({ payment_method_id: "cash" });

const { items: services } = await arky.eshop.service.list({ limit: 20 });
await arky.eshop.service.initialize();

await arky.action.track({
  key: "project.inquiry.started",
  payload: { placement: "homepage" },
});
```

UI frameworks can subscribe to Nano Stores exposed by the modules:

```typescript
const unsubscribe = arky.eshop.cart.snapshot.subscribe((snapshot) => {
  console.log(snapshot.item_count, snapshot.cart?.id);
});

await arky.eshop.cart.ensure();
unsubscribe();
```

## Read Content And Submit Forms

The server storefront entry route uses collection entries. Key-based content loads must include `collection_id`.

```typescript
const page = await arky.cms.entry.get({
  collection_id: "pages",
  key: "homepage",
  locale: "en",
});

const titleBlock = page.blocks.find((block) => block.key === "title");
const title = arky.utils.getBlockTextValue(titleBlock, "en");

await arky.cms.form.submitByKey({
  key: "contact",
  entries: [
    { key: "email", value: "profile@example.com" },
    { key: "message", value: "Hello from the storefront" },
  ],
});
```

## Browse Products And Checkout

```typescript
const { items: products } = await arky.eshop.product.list({ limit: 20 });
const product = await arky.eshop.product.loadDetail({ id: products[0].id });
const variant = product.variants[0];

await arky.eshop.cart.addProduct(product, variant, 2);

const quote = await arky.eshop.cart.quote();

const order = await arky.eshop.cart.checkout({
  payment_method_id: "credit_card",
});
```

## Sell Scheduled Services

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

await arky.eshop.cart.checkout({
  payment_method_id: "cash",
});
```

## Low-Level Client

The lower-level SDK client remains available as `arky.client` for admin tools and advanced frontend utilities. Normal storefronts should use the module API first.

```typescript
const sdk = arky.client;

await sdk.eshop.product.find({ limit: 20 });
await sdk.eshop.cart.current({ market: arky.getMarket() });
await sdk.eshop.order.find({});
await sdk.cms.entry.find({
  collection_id: "pages",
  key: "homepage",
  limit: 1,
});
```

## Configuration Options

```typescript
initialize({
  // Required
  baseUrl: string,
  storeId: string,

  // Optional
  market?: string,
  locale?: string,
  apiToken?: string,
  marketForLocale?: (locale: string) => string | null,
  navigate?: (path: string) => void,
  loginFallbackPath?: string,
});
```

## TypeScript Support

```typescript
import { initialize, type ArkyStore } from "arky-sdk/storefront";
import type { Block, Cart, Order, Price, Product, Service, Store } from "arky-sdk";
```

## Adding A New Endpoint

When adding a new SDK method, follow this checklist so the API surface stays typed end-to-end and request shapes stay aligned with the Rust DTOs on the server:

1. Define the entity in `src/types/index.ts` if it does not already exist. Mirror the Rust response struct field-for-field.
2. Define the request params in `src/types/api.ts`. Mirror the Rust DTO in `server/core/src/{module}/types/commands.rs` field-for-field. Two exceptions: `store_id?: string` and `market?: string` are optional in TS because the SDK auto-fills both from `apiConfig.storeId` and `apiConfig.market`. Do not use `[key: string]: any` index signatures.
3. Annotate the SDK method's return type using the matching entity from `src/types/index.ts`.
4. Pass the response generic to the HTTP call: `apiConfig.httpClient.post<EntityType>(...)`, `apiConfig.httpClient.get<PaginatedResponse<EntityType>>(...)`, etc. Never rely on inference.
5. Inject `market` from `apiConfig`: when a body needs a `market` field, write `{ market: apiConfig.market, ...payload }`. Never hardcode `"default"`, `"eshop"`, or any other market string in `src/api/*.ts`.
6. Re-export the entity from `src/index.ts` if consumers will import it.
