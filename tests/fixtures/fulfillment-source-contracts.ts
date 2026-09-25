import type { FulfillmentOrderLineSource, RentalIssueReplacement } from 'arky-sdk';
import type { RentalIssueReplacement as PublicReplacement } from 'arky-sdk/types';

type Same<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type True<T extends true> = T;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Absent<T, K extends string> = K extends keyof T ? false : true;
type RentalIssue = Extract<FulfillmentOrderLineSource, { type: 'rental_issue' }>;
type OrderProduct = Extract<FulfillmentOrderLineSource, { type: 'order_product' }>;

export type RentalIssueContract = [
  True<Same<FulfillmentOrderLineSource['type'], 'order_product' | 'rental_issue'>>,
  True<Same<keyof RentalIssue, 'type' | 'rental_id' | 'terms_revision_id' | 'replacement'>>,
  True<Same<RentalIssue['replacement'], RentalIssueReplacement | null>>,
  True<RequiredField<RentalIssue, 'replacement'>>,
  True<Same<keyof RentalIssueReplacement, 'predecessor_placement_id' | 'overlap_authorized'>>,
  True<RequiredField<RentalIssueReplacement, 'overlap_authorized'>>,
  True<Same<RentalIssueReplacement['overlap_authorized'], boolean>>,
  True<Same<RentalIssueReplacement, PublicReplacement>>,
  True<Absent<RentalIssue, 'replaces_placement_id'>>,
  True<Absent<RentalIssue, 'product_id'>>,
  True<Absent<RentalIssue, 'inventory_unit_id'>>,
  True<Absent<RentalIssue, 'order_id'>>,
  True<Absent<RentalIssue, 'order_unit_spans'>>,
  True<Absent<OrderProduct, 'rental_id'>>,
];

const issue: FulfillmentOrderLineSource = {
  type: 'rental_issue', rental_id: 'rental', terms_revision_id: 'revision', replacement: null,
};
const replacement: FulfillmentOrderLineSource = {
  ...issue, replacement: { predecessor_placement_id: 'old-placement', overlap_authorized: false },
};

function sourceIdentity(source: FulfillmentOrderLineSource): string {
  if (source.type === 'rental_issue') {
    return source.replacement?.predecessor_placement_id ?? source.rental_id;
  }
  return source.order_id;
}
void [issue, replacement, sourceIdentity];
