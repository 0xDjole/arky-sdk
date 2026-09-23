import { createAdmin } from '../../dist/index.js';
import type { CustomerAction, FindCustomerActionsParams } from '../../dist/index.js';

declare const admin: ReturnType<typeof createAdmin>;
const filters: FindCustomerActionsParams = { customer_id: 'customer', limit: 1, cursor: null };
const page: Promise<{ items: CustomerAction[]; cursor: string | null }> = admin.actions.find(filters);
// @ts-expect-error Action discovery does not accept private custom data predicates.
void admin.actions.find({ data: { private: true } });
// @ts-expect-error Timeline order is fixed to descending occurrence time.
void admin.actions.find({ sort_field: 'updated_at' });
void page;
