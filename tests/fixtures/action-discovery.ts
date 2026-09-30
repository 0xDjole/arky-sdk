import { createAdmin } from '../../dist/index.js';
import type { CustomerAction, FindCustomerActionsParams } from '../../dist/index.js';

declare const admin: ReturnType<typeof createAdmin>;
const filters: FindCustomerActionsParams = { store_id: '0f7c2d4e-5a61-4b8c-9d3e-2f1a6b7c8d90', customer_id: 'customer', limit: 1, cursor: null };
const page: Promise<{ items: CustomerAction[]; cursor: string | null }> = admin.actions.find(filters);
// @ts-expect-error Action discovery does not accept private custom data predicates.
void admin.actions.find({ store_id: '0f7c2d4e-5a61-4b8c-9d3e-2f1a6b7c8d90', data: { private: true } });
// @ts-expect-error Timeline order is fixed to descending occurrence time.
void admin.actions.find({ store_id: '0f7c2d4e-5a61-4b8c-9d3e-2f1a6b7c8d90', sort_field: 'updated_at' });
void page;
