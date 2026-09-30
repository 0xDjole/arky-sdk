import { createAdmin } from '../../dist/index.js';
import type { CustomerListItem, FindCustomersParams } from '../../dist/index.js';

declare const admin: ReturnType<typeof createAdmin>;
const filters: FindCustomersParams = {
  store_id: '9c2e5b74-1f38-4a6d-8b05-3e7f0a9d6c12', query: 'buyer', has_cart: false, has_customer_action: true, has_verified_email: true,
  sort_field: 'email', sort_direction: 'asc', cursor: null, limit: 1,
};
const page: Promise<{ items: CustomerListItem[]; cursor: string | null }> = admin.customers.find(filters);
// @ts-expect-error Customer discovery has no name sort.
filters.sort_field = 'name';
// @ts-expect-error Customer text queries are strings.
filters.query = 10;
// @ts-expect-error Status filters are scalar, not root lifecycle values.
filters.status = { type: 'active' };
void page;
