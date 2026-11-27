import { createAdmin } from '../../dist/index.js';
import type { CustomerContactStatus, CustomerContactSummary, CustomerContactSummaryAddress, CustomerExport, CustomerExportCut, CustomerInviteStatus, CustomerOrderContact, CustomerSearchSnapshot, EmailContact, EpochMilliseconds, ExportCustomerParams, FindCustomersParams, LoginAddress, SmsConsent, SmsConsentChoice, StorefrontSmsConsent, BlockQuery, CustomerBlockAbsence, CustomerBlockFilter, CategoryEntry, CreateCustomerParams, Customer, UpdateCustomerParams } from '../../dist/index.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

declare const admin: ReturnType<typeof createAdmin>;
const filters: FindCustomersParams = {
  store_id: '9c2e5b74-1f38-4a6d-8b05-3e7f0a9d6c12', query: 'buyer', has_cart: false, has_customer_action: true, verified: true,
  sort_field: 'updated_at', sort_direction: 'asc', cursor: null, limit: 1,
};
const page: Promise<{ items: CustomerSearchSnapshot[]; cursor: string | null }> = admin.customers.find(filters);
const byEmail: FindCustomersParams = { store_id: '9c2e5b74-1f38-4a6d-8b05-3e7f0a9d6c12', contact_email: 'buyer@example.test', limit: 2 };
const byNumber: FindCustomersParams = { store_id: '9c2e5b74-1f38-4a6d-8b05-3e7f0a9d6c12', contact_number: '+38761123456', cursor: null };
void [page, byEmail, byNumber];

export type CustomerDiscoveryContracts = [
  Assert<Equal<FindCustomersParams['sort_field'], 'id' | 'email' | 'name' | 'created_at' | 'updated_at' | undefined>>,
  Assert<Equal<FindCustomersParams['filters'], CustomerBlockFilter[] | undefined>>,
  Assert<Equal<CustomerBlockFilter, CustomerBlockAbsence | BlockQuery>>,
  Assert<Equal<CustomerBlockAbsence, { type: 'absent'; key: string }>>,
  Assert<Equal<FindCustomersParams['profile_filters'], (CustomerBlockAbsence | Extract<BlockQuery, { type: 'date' }>)[] | undefined>>,
  Assert<Equal<{ store_id: string; profile_filters: Extract<BlockQuery, { type: 'text' }>[] } extends FindCustomersParams ? true : false, false>>,
  Assert<Equal<{ store_id: string; contact_email: string; filters: BlockQuery[] } extends FindCustomersParams ? true : false, false>>,
  Assert<Equal<FindCustomersParams['query'], string | undefined>>,
  Assert<Equal<FindCustomersParams['verified'], boolean | undefined>>,
  Assert<Missing<FindCustomersParams, 'type'>>,
  Assert<Missing<FindCustomersParams, 'has_verified_email'>>,
  Assert<Equal<FindCustomersParams['contact_email'], string | undefined>>,
  Assert<Equal<FindCustomersParams['contact_number'], string | undefined>>,
  Assert<Equal<{ store_id: string; contact_email: string; query: string } extends FindCustomersParams ? true : false, false>>,
  Assert<Equal<{ store_id: string; contact_email: string; contact_number: string } extends FindCustomersParams ? true : false, false>>,
  Assert<Equal<keyof CustomerSearchSnapshot, 'customer' | 'contacts' | 'linked' | 'has_cart' | 'has_customer_action' | 'has_order' | 'latest_order_contact'>>,
  Assert<Equal<CustomerSearchSnapshot['contacts'], CustomerContactSummary[]>>,
  Assert<Equal<CustomerSearchSnapshot['linked'], boolean>>,
  Assert<Equal<CustomerContactSummary, { status: CustomerContactStatus; address: CustomerContactSummaryAddress }>>,
  Assert<Equal<CustomerContactStatus, 'unconfirmed' | 'confirmed'>>,
  Assert<Equal<LoginAddress, { type: 'email'; email: string } | { type: 'phone'; number: string }>>,
  Assert<Equal<CustomerContactSummaryAddress, { type: 'email'; email: string } | { type: 'phone'; number: string; sms: SmsConsentChoice }>>,
  Assert<Equal<Extract<SmsConsent, { type: 'off' }>, { type: 'off'; at: EpochMilliseconds }>>,
  Assert<Equal<Extract<StorefrontSmsConsent, { type: 'off' }>, { type: 'off' }>>,
  Assert<Equal<CustomerInviteStatus, { type: 'active' } | { type: 'superseded' }>>,
  Assert<Equal<SmsConsentChoice, 'off' | 'on'>>,
  Assert<Equal<CustomerSearchSnapshot['latest_order_contact'], CustomerOrderContact | null>>,
  Assert<Equal<CustomerOrderContact, { email: EmailContact | null; first_name: string | null; last_name: string | null; phone: string | null }>>,
  Assert<Equal<Awaited<ReturnType<typeof admin.customers.export>>, CustomerExport>>,
  Assert<Equal<ExportCustomerParams, { store_id: string; id: string }>>,
  Assert<Equal<keyof CustomerExport, 'customer' | 'booking_lines' | 'entries' | 'form_submissions' | 'conversations' | 'cut' | 'exported_at'>>,
  Assert<Equal<CustomerExportCut, { part: 'booking_lines' | 'entries' | 'form_submissions' | 'conversations' | 'calls'; reason: 'grant' | 'size' }>>,
  Assert<Equal<Customer['categories'], CategoryEntry[]>>,
  Assert<Equal<CreateCustomerParams['categories'], CategoryEntry[] | undefined>>,
  Assert<Equal<{} extends Pick<CreateCustomerParams, 'categories'> ? true : false, true>>,
  Assert<Equal<UpdateCustomerParams['categories'], CategoryEntry[] | undefined>>,
  Assert<Equal<FindCustomersParams['category_ids'], string[] | undefined>>,
  Assert<Equal<{ store_id: string; contact_email: string; category_ids: string[] } extends FindCustomersParams ? true : false, false>>,
  Assert<Equal<{ store_id: string; contact_number: string; category_ids: string[] } extends FindCustomersParams ? true : false, false>>,
];
