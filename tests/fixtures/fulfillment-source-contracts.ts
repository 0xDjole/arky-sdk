import type {
  ActOnFulfillmentJobParams,
  ActOnFulfillmentParams,
  CreateFulfillmentParams,
  FulfillmentAction,
  FulfillmentJobAction,
  FulfillmentJobLineSource,
  FulfillmentJobType,
  RentalIssueReplacement,
  RoutingAssign,
} from "arky-sdk";
import type { RentalIssueReplacement as PublicReplacement } from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type RentalIssue = Extract<FulfillmentJobLineSource, { type: "rental_issue" }>;
type OrderProduct = Extract<FulfillmentJobLineSource, { type: "order_product" }>;
type Replacement = Extract<FulfillmentJobType, { type: "rental_replacement" }>;

export type FulfillmentSourceContract = [
  Assert<Equal<FulfillmentJobLineSource["type"], "order_product" | "rental_issue">>,
  Assert<Equal<keyof RentalIssue, "type" | "rental_id" | "revision_id">>,
  Assert<Equal<keyof OrderProduct, "type" | "order_product_line_item_id" | "order_unit_spans">>,
  Assert<Missing<RentalIssue, "replacement" | "terms_revision_id" | "order_id">>,
  Assert<Equal<Replacement["replacement"], RentalIssueReplacement>>,
  Assert<Equal<keyof RentalIssueReplacement, "predecessor_inventory_unit_id" | "predecessor_fulfillment_job_line_id" | "predecessor_fulfillment_unit_index" | "overlap_authorized">>,
  Assert<Equal<RentalIssueReplacement, PublicReplacement>>,
  Assert<Equal<FulfillmentAction["type"], "ready" | "fulfill" | "cancel">>,
  Assert<Equal<keyof ActOnFulfillmentParams, "store_id" | "fulfillment_id" | "expected_updated_at" | "action" | "tracking" | "lot_references">>,
  Assert<Missing<ActOnFulfillmentParams, "request_id">>,
  Assert<RequiredField<CreateFulfillmentParams, "id">>,
  Assert<Missing<CreateFulfillmentParams, "request_id" | "fulfillment_id">>,
  Assert<Equal<FulfillmentJobAction["type"], "move" | "split" | "hand_back" | "hold" | "release_hold">>,
  Assert<Equal<Extract<FulfillmentJobAction, { type: "split" }>["fulfillment_job_id"], string>>,
  Assert<Missing<ActOnFulfillmentJobParams, "request_id">>,
  Assert<Equal<RoutingAssign["type"], "manual" | "automatic">>,
];

function sourceIdentity(source: FulfillmentJobLineSource): string {
  return source.type === "rental_issue" ? source.rental_id : source.order_product_line_item_id;
}
void sourceIdentity;
