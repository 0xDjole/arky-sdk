import { createAdmin, epochMilliseconds } from 'arky-sdk';
import type { AdminDomainOperation, StoreAdminDomain, StoreAdminDomainConnection, StoreBrandingPresentation, PaginatedResponse, AccountSessionScope } from 'arky-sdk';
import type * as Public from 'arky-sdk/types';

const admin = createAdmin({ baseUrl: 'https://api.example.test', storeId: 'store', market: 'us' });
const nonCommerceAdmin = createAdmin({ baseUrl: 'https://api.example.test', storeId: 'store' });
const selectedAdminMarket: string | undefined = nonCommerceAdmin.getMarket();
void selectedAdminMarket;
const domains: Promise<PaginatedResponse<StoreAdminDomain>> = admin.store.adminDomain.find({ limit: 25, cursor: 'opaque' });
const connection: Promise<StoreAdminDomainConnection> = admin.store.adminDomain.get({ id: 'domain' });
const created: Promise<StoreAdminDomain> = admin.store.adminDomain.create({ id: 'domain', hostname: 'admin.example.com' });
const operation: Promise<AdminDomainOperation> = admin.store.adminDomain.registerHosting({ id: 'domain', operation_id: 'operation' });
const retried: Promise<AdminDomainOperation> = admin.store.adminDomain.retryHosting({ id: 'domain', operation_id: 'new-operation', failed_operation_id: 'failed-operation' });
const publicBranding: Promise<StoreBrandingPresentation> = admin.store.adminDomain.resolve('admin.example.com');
const removed: Promise<void> = admin.store.adminDomain.remove({ id: 'domain', expected_updated_at: epochMilliseconds(1790000000000) });
const scope: AccountSessionScope | undefined = admin.session?.scope;
const publicShape: Promise<Public.StoreAdminDomainConnection> = connection;
void [domains, connection, created, operation, retried, publicBranding, removed, scope, publicShape];
// @ts-expect-error A provider request retains an explicit operation identity.
admin.store.adminDomain.registerHosting({ id: 'domain' });
// @ts-expect-error A binding mutation requires its last observed revision.
admin.store.adminDomain.disable({ id: 'domain' });
// @ts-expect-error A caller cannot select credential scope in a code request.
admin.account.auth.storeCode('store', { email: 'owner@example.com', scope: { type: 'account' } });
