import { createAdmin } from '../../dist/index.js';
import type { CustomerExport, CustomerExportCut, CustomerLoginAddress, CustomerLoginStatus, CustomerLoginSummary, CustomerLoginSummaryAddress, CustomerOrderContact, CustomerSearchSnapshot, EmailContact, ExportCustomerParams, FindCustomersParams, SmsConsentChoice } from '../../dist/index.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

declare const admin: ReturnType<typeof createAdmin>;
const filters: FindCustomersParams = {
  store_id: '9c2e5b74-1f38-4a6d-8b05-3e7f0a9d6c12', query: 'buyer', has_cart: false, has_customer_action: true, verified: true,
  sort_field: 'updated_at', sort_direction: 'asc', cursor: null, limit: 1,
};
const page: Promise<{ items: CustomerSearchSnapshot[]; cursor: string | null }> = admin.customers.find(filters);
void page;

export type CustomerDiscoveryContracts = [
  Assert<Equal<FindCustomersParams['sort_field'], 'id' | 'email' | 'created_at' | 'updated_at' | undefined>>,
  Assert<Equal<FindCustomersParams['query'], string | undefined>>,
  Assert<Equal<FindCustomersParams['verified'], boolean | undefined>>,
  Assert<Missing<FindCustomersParams, 'type'>>,
  Assert<Missing<FindCustomersParams, 'has_verified_email'>>,
  Assert<Equal<keyof CustomerSearchSnapshot, 'customer' | 'logins' | 'has_cart' | 'has_customer_action' | 'has_order' | 'latest_order_contact'>>,
  Assert<Equal<CustomerSearchSnapshot['logins'], CustomerLoginSummary[]>>,
  Assert<Equal<CustomerLoginSummary, { id: string; status: CustomerLoginStatus; address: CustomerLoginSummaryAddress }>>,
  Assert<Equal<CustomerLoginStatus, 'unverified' | 'invited' | 'verified'>>,
  Assert<Equal<CustomerLoginAddress, { type: 'email'; email: string } | { type: 'phone'; number: string }>>,
  Assert<Equal<CustomerLoginSummaryAddress, { type: 'email'; email: string } | { type: 'phone'; number: string; sms: SmsConsentChoice }>>,
  Assert<Equal<SmsConsentChoice, 'off' | 'on'>>,
  Assert<Equal<CustomerSearchSnapshot['latest_order_contact'], CustomerOrderContact | null>>,
  Assert<Equal<CustomerOrderContact, { email: EmailContact | null; first_name: string | null; last_name: string | null; phone: string | null }>>,
  Assert<Equal<Awaited<ReturnType<typeof admin.customers.export>>, CustomerExport>>,
  Assert<Equal<ExportCustomerParams, { store_id: string; id: string }>>,
  Assert<Equal<keyof CustomerExport, 'customer' | 'logins' | 'booking_lines' | 'entries' | 'form_submissions' | 'conversations' | 'cut' | 'exported_at'>>,
  Assert<Equal<CustomerExportCut, { part: 'booking_lines' | 'entries' | 'form_submissions' | 'conversations' | 'calls'; reason: 'grant' | 'size' }>>,
];
