import { createAdmin, createStorefront } from '../../dist/index.js';
import type { GetOrdersParams, Order, StorefrontDto } from '../../dist/index.js';

const filters: GetOrdersParams = { query: 'ORD-2026', statuses: ['confirmed'], product_statuses: ['cancelled'],
  booking_statuses: ['no_show'], sort_field: 'price', sort_direction: 'asc', cursor: null, limit: 1 };
declare const admin: ReturnType<typeof createAdmin>;
declare const storefront: ReturnType<typeof createStorefront>;
const adminPage: Promise<{ items: Order[]; cursor: string | null }> = admin.eshop.order.find(filters);
const buyerPage: Promise<StorefrontDto<{ items: Order[]; cursor: string | null }>> = storefront.eshop.order.find({ query: 'ORD-2026', sort_field: 'number' });
// @ts-expect-error Ordering is the backend's closed set.
filters.sort_field = 'payment_method';
// @ts-expect-error Search text is not numeric.
filters.query = 7;
// @ts-expect-error Search statuses are plain filters, not tagged response values.
filters.statuses = [{ type: 'confirmed' }];
// @ts-expect-error Product items do not have Booking completion status.
filters.product_statuses = ['completed'];
// @ts-expect-error Storefront scope is derived from authentication.
void storefront.eshop.order.find({ store_id: 'foreign' });
void [adminPage, buyerPage];
