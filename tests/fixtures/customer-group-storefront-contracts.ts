import { initialize } from 'arky-sdk/storefront';
import type { GetStorefrontCustomerGroupMemberParams, JoinStorefrontCustomerGroupParams } from 'arky-sdk/storefront';
import type { CustomerGroupJoinResult, CustomerGroupMemberSelf } from 'arky-sdk/types';
import type { StorefrontDto } from 'arky-sdk';
import type { CustomerGroupEmailConsent, SubscribeStorefrontCustomerGroupEmailsParams } from 'arky-sdk/types';

const arky = initialize('arky_pk_contract');
const join: JoinStorefrontCustomerGroupParams = {
  command_id: 'command',
  request: { customer_group_id: 'group', scope: { type: 'customer' }, expected_updated_at: null },
};
const personal: GetStorefrontCustomerGroupMemberParams = { customer_group_id: 'group' };
const company: GetStorefrontCustomerGroupMemberParams = { customer_group_id: 'group', company_id: 'company', company_location_id: 'branch' };
const receipt: Promise<StorefrontDto<CustomerGroupJoinResult>> = arky.customer_group_members.join(join);
const current: Promise<StorefrontDto<CustomerGroupMemberSelf> | null> = arky.customer_group_members.current(personal);
void [receipt, current, company];

const subscribe: SubscribeStorefrontCustomerGroupEmailsParams = {
  customer_group_id: 'group', email_identity_id: 'identity', expected_updated_at: null,
};
const consent: Promise<StorefrontDto<CustomerGroupEmailConsent>> = arky.customer_group_email_consents.subscribe(subscribe);
const consentRead: Promise<StorefrontDto<CustomerGroupEmailConsent>> = arky.customer_group_email_consents.get({ id: 'consent' });
void [consent, consentRead];

// @ts-expect-error Store authority is derived from the publishable key.
arky.customer_group_email_consents.subscribe({ ...subscribe, store_id: 'store' });
// @ts-expect-error Customer authority is derived from the current Session.
arky.customer_group_email_consents.subscribe({ ...subscribe, customer_id: 'customer' });
// @ts-expect-error Opt-out preconditions must be explicitly supplied, including null.
arky.customer_group_email_consents.subscribe({ customer_group_id: 'group', email_identity_id: 'identity' });
// @ts-expect-error Resend must identify the current generation and consent revision.
arky.customer_group_email_consents.resendConfirmation({ id: 'consent' });
declare const currentConsent: Awaited<typeof consent>;
// @ts-expect-error Store routing fields are not exposed by the storefront.
currentConsent.store_id;
// @ts-expect-error Protected email request material is never public.
currentConsent.confirmation?.encrypted_request;

// @ts-expect-error The public key derives Store authority.
arky.customer_group_members.join({ ...join, store_id: 'another-store' });
// @ts-expect-error Customer authority comes from the Session, not a query field.
arky.customer_group_members.current({ customer_group_id: 'group', customer_id: 'another-customer' });
// @ts-expect-error Company access requires an explicit branch.
arky.customer_group_members.current({ customer_group_id: 'group', company_id: 'company' });
// @ts-expect-error A branch cannot be selected without its Company.
arky.customer_group_members.current({ customer_group_id: 'group', company_location_id: 'branch' });
// @ts-expect-error Company join requires a non-null branch, just like Rust.
arky.customer_group_members.join({ ...join, request: { ...join.request, scope: { type: 'company', company_id: 'company', company_location_id: null } } });
// @ts-expect-error Absence must be an explicit null precondition, not an omitted field.
arky.customer_group_members.join({ ...join, request: { customer_group_id: 'group', scope: { type: 'customer' } } });

declare const self: StorefrontDto<CustomerGroupMemberSelf>;
// @ts-expect-error Self membership never exposes administrative grants.
self.administrative_access;
// @ts-expect-error Store IDs are not part of storefront responses.
self.store_id;
if (self.admission.type === 'granted') {
  // @ts-expect-error Self admission never exposes the private actor/source.
  self.admission.source;
}
