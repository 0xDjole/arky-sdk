import { createAdmin } from 'arky-sdk';
import type { AccountSessionScope, StoreCustomerWorkspacePresentation } from 'arky-sdk';
import type * as Public from 'arky-sdk/types';

const store_id = 'a4219f3b-50b1-4a78-902b-d7264ae027a9';
const admin = createAdmin({ baseUrl: 'https://api.example.test' });
// @ts-expect-error Store selection belongs to each operation.
createAdmin({ baseUrl: 'https://api.example.test', storeId: store_id });
const scope: AccountSessionScope | undefined = admin.session?.scope;
const workspace: Promise<StoreCustomerWorkspacePresentation> = admin.store.customerWorkspace.get({ id: store_id });
const publicWorkspace: Promise<Public.StoreCustomerWorkspacePresentation> = workspace;
admin.account.auth.storeCode(store_id, { email: 'invited@example.test' });
admin.account.auth.storeVerify(store_id, { session_id: 'pending', code: '123456' });
void [scope, workspace, publicWorkspace];
// @ts-expect-error The removed feature has no client API.
admin.store.adminDomain;
// @ts-expect-error The removed feature has no client API.
admin.store.branding;
// @ts-expect-error No retired domain type is exported.
type RemovedDomain = Public.StoreAdminDomain;
// @ts-expect-error No retired branding type is exported.
type RemovedBranding = Public.StoreBranding;
// @ts-expect-error A caller cannot select credential scope in a code request.
admin.account.auth.storeCode(store_id, { email: 'owner@example.com', scope: { type: 'account' } });
