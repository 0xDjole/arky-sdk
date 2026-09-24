import type { FulfillmentOrderLineSource } from 'arky-sdk';

const issue: FulfillmentOrderLineSource = {
  type: 'rental_issue', rental_id: 'rental', terms_revision_id: 'revision', replaces_placement_id: null,
};
const replacement: FulfillmentOrderLineSource = { ...issue, replaces_placement_id: 'old-placement' };
// @ts-expect-error No caller-supplied Product authority is duplicated on a Rental issue.
const copiedProduct: FulfillmentOrderLineSource = { ...issue, product_id: 'product' };
// @ts-expect-error The selected Unit is not the reason for creating issue work.
const selectedUnit: FulfillmentOrderLineSource = { ...issue, inventory_unit_id: 'unit' };
// @ts-expect-error Initial issue explicitly has no predecessor.
const missingPredecessor: FulfillmentOrderLineSource = { type: 'rental_issue', rental_id: 'rental', terms_revision_id: 'revision' };
// @ts-expect-error Rental work cannot borrow an Order's financial authority.
const copiedOrder: FulfillmentOrderLineSource = { ...issue, order_id: 'order' };

function sourceIdentity(source: FulfillmentOrderLineSource): string {
  if (source.type === 'rental_issue') {
    // @ts-expect-error A rental position is not an accepted Order unit.
    source.order_unit_spans;
    return source.rental_id;
  }
  // @ts-expect-error A sold Product assignment is not a Rental agreement.
  source.rental_id;
  return source.order_id;
}
void [issue, replacement, sourceIdentity];
