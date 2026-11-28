import { createAdmin } from '../../dist/index.js';
import type { UserContactStatus, UserContactSummary, UserContactSummaryAddress, UserExport, UserExportCut, UserInviteStatus, UserOrderContact, UserSearchSnapshot, EmailContact, EpochMilliseconds, ExportUserParams, FindUsersParams, LoginAddress, SmsConsent, SmsConsentChoice, StorefrontSmsConsent, BlockQuery, UserBlockAbsence, UserBlockFilter, CategoryEntry, CreateUserParams, User, UpdateUserParams } from '../../dist/index.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

declare const admin: ReturnType<typeof createAdmin>;
const filters: FindUsersParams = {
  tenant_id: '9c2e5b74-1f38-4a6d-8b05-3e7f0a9d6c12', query: 'buyer', has_cart: false, has_user_action: true, verified: true,
  sort_field: 'updated_at', sort_direction: 'asc', cursor: null, limit: 1,
};
const page: Promise<{ items: UserSearchSnapshot[]; cursor: string | null }> = admin.users.find(filters);
const byEmail: FindUsersParams = { tenant_id: '9c2e5b74-1f38-4a6d-8b05-3e7f0a9d6c12', contact_email: 'buyer@example.test', limit: 2 };
const byNumber: FindUsersParams = { tenant_id: '9c2e5b74-1f38-4a6d-8b05-3e7f0a9d6c12', contact_number: '+38761123456', cursor: null };
void [page, byEmail, byNumber];

export type UserDiscoveryContracts = [
  Assert<Equal<FindUsersParams['sort_field'], 'id' | 'email' | 'name' | 'created_at' | 'updated_at' | undefined>>,
  Assert<Equal<FindUsersParams['filters'], UserBlockFilter[] | undefined>>,
  Assert<Equal<UserBlockFilter, UserBlockAbsence | BlockQuery>>,
  Assert<Equal<UserBlockAbsence, { type: 'absent'; key: string }>>,
  Assert<Equal<FindUsersParams['profile_filters'], (UserBlockAbsence | Extract<BlockQuery, { type: 'date' }>)[] | undefined>>,
  Assert<Equal<{ tenant_id: string; profile_filters: Extract<BlockQuery, { type: 'text' }>[] } extends FindUsersParams ? true : false, false>>,
  Assert<Equal<{ tenant_id: string; contact_email: string; filters: BlockQuery[] } extends FindUsersParams ? true : false, false>>,
  Assert<Equal<FindUsersParams['query'], string | undefined>>,
  Assert<Equal<FindUsersParams['verified'], boolean | undefined>>,
  Assert<Missing<FindUsersParams, 'type'>>,
  Assert<Missing<FindUsersParams, 'has_verified_email'>>,
  Assert<Equal<FindUsersParams['contact_email'], string | undefined>>,
  Assert<Equal<FindUsersParams['contact_number'], string | undefined>>,
  Assert<Equal<{ tenant_id: string; contact_email: string; query: string } extends FindUsersParams ? true : false, false>>,
  Assert<Equal<{ tenant_id: string; contact_email: string; contact_number: string } extends FindUsersParams ? true : false, false>>,
  Assert<Equal<keyof UserSearchSnapshot, 'user' | 'contacts' | 'linked' | 'has_cart' | 'has_user_action' | 'has_order' | 'latest_order_contact'>>,
  Assert<Equal<UserSearchSnapshot['contacts'], UserContactSummary[]>>,
  Assert<Equal<UserSearchSnapshot['linked'], boolean>>,
  Assert<Equal<UserContactSummary, { status: UserContactStatus; address: UserContactSummaryAddress }>>,
  Assert<Equal<UserContactStatus, 'unconfirmed' | 'confirmed'>>,
  Assert<Equal<LoginAddress, { type: 'email'; email: string } | { type: 'phone'; number: string }>>,
  Assert<Equal<UserContactSummaryAddress, { type: 'email'; email: string } | { type: 'phone'; number: string; sms: SmsConsentChoice }>>,
  Assert<Equal<Extract<SmsConsent, { type: 'off' }>, { type: 'off'; at: EpochMilliseconds }>>,
  Assert<Equal<Extract<StorefrontSmsConsent, { type: 'off' }>, { type: 'off' }>>,
  Assert<Equal<UserInviteStatus, { type: 'active' } | { type: 'superseded' }>>,
  Assert<Equal<SmsConsentChoice, 'off' | 'on'>>,
  Assert<Equal<UserSearchSnapshot['latest_order_contact'], UserOrderContact | null>>,
  Assert<Equal<UserOrderContact, { email: EmailContact | null; first_name: string | null; last_name: string | null; phone: string | null }>>,
  Assert<Equal<Awaited<ReturnType<typeof admin.users.export>>, UserExport>>,
  Assert<Equal<ExportUserParams, { tenant_id: string; id: string }>>,
  Assert<Equal<keyof UserExport, 'user' | 'booking_lines' | 'entries' | 'form_submissions' | 'conversations' | 'cut' | 'exported_at'>>,
  Assert<Equal<UserExportCut, { part: 'booking_lines' | 'entries' | 'form_submissions' | 'conversations' | 'calls'; reason: 'grant' | 'size' }>>,
  Assert<Equal<User['categories'], CategoryEntry[]>>,
  Assert<Equal<CreateUserParams['categories'], CategoryEntry[] | undefined>>,
  Assert<Equal<{} extends Pick<CreateUserParams, 'categories'> ? true : false, true>>,
  Assert<Equal<UpdateUserParams['categories'], CategoryEntry[] | undefined>>,
  Assert<Equal<FindUsersParams['category_ids'], string[] | undefined>>,
  Assert<Equal<{ tenant_id: string; contact_email: string; category_ids: string[] } extends FindUsersParams ? true : false, false>>,
  Assert<Equal<{ tenant_id: string; contact_number: string; category_ids: string[] } extends FindUsersParams ? true : false, false>>,
];
