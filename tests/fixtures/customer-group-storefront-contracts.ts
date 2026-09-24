import { initialize } from 'arky-sdk/storefront';
import type { GetStorefrontCustomerGroupMemberParams, JoinStorefrontCustomerGroupParams } from 'arky-sdk/storefront';
import type { CustomerGroupJoinResult, CustomerGroupMemberSelf } from 'arky-sdk/types';
import type { StorefrontDto } from 'arky-sdk';

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
