# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands

- Install deps: `npm install`
- Build (ESM + CJS with d.ts): `npm run build`
- Dev/watch build: `npm run dev`
- Type-check only: `npx tsc -p tsconfig.json --noEmit`
- Clean artifacts: `npm run clean`
- Lint: not configured
- Tests: not configured (no runner or tests present)

## High-level architecture

- Packaging/build
  - Bundled with tsup (`tsup.config.ts`) into `dist/` as both ESM (`dist/*.js`) and CJS (`dist/*.cjs`) with type declarations. Entry points: `index`, `utils`, `types`. `package.json` `exports` exposes `.` (SDK), `./utils`, and `./types`.
  - `type: module` in `package.json` (ESM by default) while supporting CommonJS via dual outputs.

- SDK entry (`src/index.ts`)
  - Re-exports types and utilities. Defines `createArkySDK(config)` which:
    - Instantiates the HTTP client (`createHttpClient`).
    - Wires domain APIs: `user`, `business`, `media`, `role`, `notification`, `promoCode`, `analytics`, `cms`, `eshop`, `reservation`, `newsletter`, `payment`.
    - Exposes helpers under `sdk.utils` (price formatting, currency symbol, blocks, timezone, validation, etc.).
    - Persists/reads auth tokens via `config.getToken`/`config.setToken`. If `autoGuest` (default true) and no tokens, it requests a guest token.

- HTTP client (`src/services/createHttpClient.ts`)
  - Thin wrapper around `fetch` with JSON encode/decode, `Authorization` header, optional `transformRequest`, and query parameter support via `utils/queryParams`.
  - Handles access token expiry: if `expiresAt` has passed and a `refreshToken` exists, POSTs to `/v1/users/refresh-access-token`, updates tokens via `setToken`, otherwise calls `logout` and throws an `ApiError`.
  - Unified methods: `get/post/put/patch/delete<T>(path, body?, { headers, params, successMessage, errorMessage })`.

- Domain API factories (`src/api/*.ts`)
  - Each file exports `createXApi(apiConfig)` for a domain. Methods compose REST paths (mostly under `/v1/...`) using `apiConfig.businessId` where needed and delegate to the HTTP client. Examples:
    - CMS: collections and entries, plus AI block generation and variable metadata.
    - E‑shop: products, orders, quotes, checkout.
    - Reservations: reservations/services/providers, available slots, quotes, checkout.
    - Newsletter: newsletters, subscribers, subscribe/unsubscribe.
    - Business: CRUD, subscription, portal, invitations, media, schedules.
    - Media: upload via `FormData`, delete, list.
    - Role/Notification/Analytics/Payment: respective endpoints and utilities.
  - Methods optionally surface `successMessage`/`errorMessage` through the client `notify` hook.

- Utilities (`src/utils/*.ts`)
  - `price.ts` (minor/major conversion, market-aware formatting, quote helpers), `currency.ts` (symbols/positioning), `blocks.ts` (block extraction/formatting), `queryParams.ts` (encoding rules), `validation.ts` (phone/email/code/required), `timezone.ts`, `text.ts` (slug/humanize), `svg.ts` (fetch/inject SVG).

- Types (`src/types/*.ts`)
  - `types/api.ts`: request/param shapes for API calls across domains.
  - `types/index.ts`: shared domain models (Payment, Quote, Price, Business, cart/reservation state, etc.).

## Notes and gotchas

- README examples reference `initArky` and `@arky/sdk/stores`, which are not present in this package. Use `createArkySDK` from the root entry point and the factory APIs under `sdk`.

Example usage:

```ts path=null start=null
import { createArkySDK } from '@arky/sdk';

const sdk = createArkySDK({
  baseUrl: 'https://api.arky.io',
  businessId: 'your-business-id',
  storageUrl: 'https://storage.arky.io',
  getToken: async () => ({ accessToken: '', refreshToken: '' }),
  setToken: (t) => {/* persist tokens */},
  logout: () => {/* clear session */},
  market: 'US',
});

const collection = await sdk.cms.getCollection({ id: 'website' });
```
