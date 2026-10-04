import { createAdmin, createStorefront, epochMilliseconds } from 'arky-sdk';
import type { CommerceInitializationRequest, SellerProfile, Store, StoreCustomerWorkspacePresentation, StoreCommerceInitialization, StoreCommerceSetupInspection, StoreTaxPolicy } from 'arky-sdk';
import type * as Public from 'arky-sdk/types';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Ready = Extract<Store['commerce'], { type: 'ready' }>;

export type Contracts = [
  Assert<Equal<StoreCommerceInitialization, Public.StoreCommerceInitialization>>,
  Assert<Equal<StoreCommerceSetupInspection, Public.StoreCommerceSetupInspection>>,
  Assert<Equal<Ready['seller'], SellerProfile>>,
  Assert<Equal<Ready['tax'], StoreTaxPolicy>>,
  Assert<Equal<keyof SellerProfile, 'legal_name' | 'address' | 'registration_number' | 'tax_registrations'>>,
  Assert<Equal<Extract<'branding', keyof Store>, never>>,
  Assert<Equal<keyof StoreCustomerWorkspacePresentation, 'store_id' | 'store_name' | 'storefront_client_id' | 'publishable_key' | 'default_language' | 'supported_languages'>>,
];

const request: CommerceInitializationRequest = {
  market: { key: 'us', currency: 'usd', tax_mode: 'exclusive' },
  sales_channel: { key: 'web', name: 'Website' },
  seller: {
    legal_name: 'Synthetic seller', address: { country: 'US' }, registration_number: null,
    tax_registrations: [{ registration: { country: 'US', region: null, identifier: 'fixture', status: { type: 'verified', verified_at: epochMilliseconds(0) } }, starts_at: epochMilliseconds(0), ends_at: null }],
  },
  tax: { version: 'fixture', noncommercial_subscription_grants: false },
};
const admin = createAdmin({ baseUrl: 'https://api.example.test', market: 'us' });
admin.store.update({ id: 'store', default_language: null, contact_email: null });
// @ts-expect-error Store has no retired presentation field.
type RemovedStoreBranding = Store['branding'];
// @ts-expect-error The removed branding API cannot be called.
admin.store.branding;
admin.store.create({ name: 'Content workspace', billing_email: 'owner@example.test', timezone: 'UTC', default_language: null, supported_languages: [] });
const started: Promise<StoreCommerceInitialization> = admin.store.commerce.initialize({ store_id: 'store', operation_id: 'operation', request });
const inspected: Promise<StoreCommerceInitialization> = admin.store.commerce.getInitialization({ store_id: 'store', operation_id: 'operation' });
const aborted: Promise<StoreCommerceInitialization> = admin.store.commerce.abortInitialization({ store_id: 'store', operation_id: 'operation' });
const setupInspection: Promise<StoreCommerceSetupInspection> = admin.store.commerce.inspectSetup({ store_id: 'store' });
const setupSubmission: Promise<StoreCommerceSetupInspection> = admin.store.commerce.submitSetup({ store_id: 'store', request });
const setupRetry: Promise<StoreCommerceSetupInspection> = admin.store.commerce.submitSetup({ store_id: 'store' });
const setupAbort: Promise<StoreCommerceSetupInspection> = admin.store.commerce.abortSetup({ store_id: 'store', operation_id: 'operation' });
void [started, inspected, aborted, setupInspection, setupSubmission, setupRetry, setupAbort];
// @ts-expect-error Every initialization has a caller-owned operation identity.
admin.store.commerce.initialize({ store_id: 'store', request });
// @ts-expect-error A tax identifier is not the complete seller registration contract.
const invalidSeller: SellerProfile = { legal_name: 'Old shape', address: { country: 'US' }, tax_identifier: null };
void invalidSeller;
const storefront = createStorefront('pk_contract');
// @ts-expect-error Commerce initialization is Owner-controlled, not a storefront API.
storefront.store.commerce.initialize({ operation_id: 'operation', request });
