import { createAdmin, createStorefront, epochMilliseconds } from 'arky-sdk';
import type { CommerceInitializationRequest, SellerProfile, Store, StoreBranding, StoreBrandingPresentation, StoreCommerceInitialization, StoreTaxPolicy, StoreInvoicePolicy } from 'arky-sdk';
import type * as Public from 'arky-sdk/types';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Ready = Extract<Store['commerce'], { type: 'ready' }>;

export type Contracts = [
  Assert<Equal<StoreCommerceInitialization, Public.StoreCommerceInitialization>>,
  Assert<Equal<Ready['seller'], SellerProfile>>,
  Assert<Equal<Ready['tax'], StoreTaxPolicy>>,
  Assert<Equal<Ready['invoicing'], StoreInvoicePolicy>>,
  Assert<Equal<keyof SellerProfile, 'legal_name' | 'address' | 'registration_number' | 'tax_registrations'>>,
  Assert<Equal<Store['branding'], StoreBranding>>,
  Assert<Equal<StoreBranding, Public.StoreBranding>>,
  Assert<Equal<keyof StoreBrandingPresentation, 'id' | 'name' | 'logo' | 'icon' | 'accent_color'>>,
];

const request: CommerceInitializationRequest = {
  market: { key: 'us', currency: 'usd', tax_mode: 'exclusive' },
  sales_channel: { key: 'web', name: 'Website' },
  seller: {
    legal_name: 'Synthetic seller', address: { country: 'US' }, registration_number: null,
    tax_registrations: [{ registration: { country: 'US', region: null, identifier: 'fixture', status: { type: 'verified', verified_at: epochMilliseconds(0) } }, starts_at: epochMilliseconds(0), ends_at: null }],
  },
  tax: { version: 'fixture', noncommercial_subscription_grants: false },
  invoicing: { series_key: 'sales', issue_trigger: { type: 'acceptance' } },
};
const admin = createAdmin({ baseUrl: 'https://api.example.test', storeId: 'store', market: 'us' });
admin.store.update({ id: 'store', default_language: null, contact_email: null });
admin.store.branding.update({ branding: { logo_media_id: null, icon_media_id: null, accent_color: null } });
const branding: Promise<StoreBrandingPresentation> = admin.store.branding.get({ id: 'store' });
void branding;
// @ts-expect-error Branding replacement must state all selections, including explicit clears.
admin.store.branding.update({ branding: { accent_color: '#123456' } });
admin.store.create({ name: 'Content workspace', billing_email: 'owner@example.test', timezone: 'UTC', default_language: null, supported_languages: [] });
const started: Promise<StoreCommerceInitialization> = admin.store.commerce.initialize({ operation_id: 'operation', request });
const inspected: Promise<StoreCommerceInitialization> = admin.store.commerce.getInitialization({ store_id: 'store', operation_id: 'operation' });
const aborted: Promise<StoreCommerceInitialization> = admin.store.commerce.abortInitialization({ operation_id: 'operation' });
void [started, inspected, aborted];
// @ts-expect-error Every initialization has a caller-owned operation identity.
admin.store.commerce.initialize({ request });
// @ts-expect-error A tax identifier is not the complete seller registration contract.
const invalidSeller: SellerProfile = { legal_name: 'Old shape', address: { country: 'US' }, tax_identifier: null };
void invalidSeller;
const storefront = createStorefront('pk_contract');
// @ts-expect-error Commerce initialization is Owner-controlled, not a storefront API.
storefront.store.commerce.initialize({ operation_id: 'operation', request });
