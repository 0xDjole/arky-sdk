import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  ActOnRentalParams,
  CustomerRental,
  CustomerRentalStatus,
  EpochMilliseconds,
  FindCustomerRentalsParams,
  FindInventoryUnitsParams,
  FindRentalsParams,
  FulfillmentJobLineSource,
  FulfillmentJobType,
  GetRentalParams,
  InventoryUnit,
  InventoryUnitStatus,
  PaginatedResponse,
  PostalAddress,
  Rental,
  RentalAction,
  RentalActor,
  RentalDetail,
  RentalIssueReplacement,
  RentalReplacementMethod,
  RentalStatus,
  RentalTerms,
} from "arky-sdk";
import type { Rental as PublicRental, RentalDetail as PublicDetail } from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Admin = ReturnType<typeof createAdmin>["eshop"];
type RentalApi = Admin["rental"];
type BuyerRentals = ReturnType<typeof createStorefront>["eshop"]["rental"];
type Action<T extends RentalAction["type"]> = Extract<RentalAction, { type: T }>;
type Ending = Extract<RentalStatus, { type: "ending" }>;

export type RentalContract = [
  Assert<Equal<Rental, PublicRental>>,
  Assert<Equal<RentalDetail, PublicDetail>>,
  Assert<Equal<keyof Rental, "id" | "store_id" | "customer_group_member_id" | "revision_id" | "entitlement_id" | "status" | "created_at" | "updated_at">>,
  Assert<Equal<keyof FindRentalsParams, "store_id" | "customer_group_member_id" | "status" | "sort_field" | "sort_direction" | "limit" | "cursor">>,
  Assert<Equal<CustomerRental["customer_group_member_id"], string>>,
  Assert<Missing<Rental, "product_id" | "quantity" | "inventory_item_id">>,
  Assert<Equal<RentalStatus["type"], "active" | "ending" | "closed">>,
  Assert<Equal<keyof Ending, "type" | "requested_at" | "actor" | "reason" | "return_due_at">>,
  Assert<Equal<Ending["return_due_at"], EpochMilliseconds | null>>,
  Assert<Equal<Ending["actor"], RentalActor>>,
  Assert<Equal<RentalActor["type"], "account" | "system">>,
  Assert<Equal<keyof RentalTerms, "product_id" | "variant_id" | "quantity" | "inventory_item_id" | "product_key" | "variant_sku">>,
  Assert<Equal<keyof RentalDetail, "rental" | "terms">>,
  Assert<Equal<RentalAction["type"], "request_replacement" | "end" | "close" | "cancel_issue">>,
  Assert<Equal<Action<"request_replacement">["replacement"], RentalIssueReplacement>>,
  Assert<Equal<Action<"request_replacement">["method"], RentalReplacementMethod>>,
  Assert<Equal<RentalReplacementMethod, { type: "delivery"; destination: PostalAddress } | { type: "pickup" }>>,
  Assert<RequiredField<Action<"end">, "return_due_at">>,
  Assert<Equal<keyof Action<"close">, "type">>,
  Assert<Equal<keyof RentalApi, "find" | "get" | "execute">>,
  Assert<Equal<Parameters<RentalApi["find"]>[0], FindRentalsParams>>,
  Assert<Equal<Awaited<ReturnType<RentalApi["find"]>>, PaginatedResponse<Rental>>>,
  Assert<Equal<Parameters<RentalApi["get"]>[0], GetRentalParams>>,
  Assert<Equal<Awaited<ReturnType<RentalApi["get"]>>, RentalDetail>>,
  Assert<Equal<Parameters<RentalApi["execute"]>[0], ActOnRentalParams>>,
  Assert<Equal<keyof ActOnRentalParams, "store_id" | "id" | "expected_updated_at" | "action">>,
  Assert<Missing<ActOnRentalParams, "request_id">>,
  Assert<Equal<Awaited<ReturnType<RentalApi["execute"]>>, Rental>>,
  Assert<Equal<Parameters<BuyerRentals["find"]>[0], FindCustomerRentalsParams>>,
  Assert<RequiredField<FindCustomerRentalsParams, "customer_group_member_id">>,
  Assert<Missing<FindCustomerRentalsParams, "subscription_id">>,
  Assert<Equal<Awaited<ReturnType<BuyerRentals["get"]>>, CustomerRental>>,
  Assert<Equal<CustomerRentalStatus["type"], "active" | "ending" | "closed">>,
  Assert<Missing<Extract<CustomerRentalStatus, { type: "ending" }>, "actor" | "reason">>,
];

export type RentalWorkContract = [
  Assert<Equal<Extract<FulfillmentJobLineSource, { type: "rental_issue" }>, { type: "rental_issue"; rental_id: string; revision_id: string }>>,
  Assert<Equal<FulfillmentJobType["type"], "order_delivery" | "rental_replacement">>,
  Assert<Equal<Extract<FulfillmentJobType, { type: "rental_replacement" }>["replacement"], RentalIssueReplacement>>,
  Assert<Equal<InventoryUnit["status"], InventoryUnitStatus>>,
  Assert<Equal<FindInventoryUnitsParams["rental_id"], string | undefined>>,
];

const ending: RentalAction = { type: "end", reason: "Customer ended the agreement", return_due_at: null };
const replacement: RentalAction = {
  type: "request_replacement",
  fulfillment_job_id: "7f3c1a85-4e29-4b60-a1d7-9c2e5b8f0a36",
  fulfillment_job_line_id: "2d8e4b61-9a37-4c05-8f1e-6b3d0a7c5e92",
  replacement: { predecessor_inventory_unit_id: "unit", predecessor_fulfillment_job_line_id: "delivered-line", predecessor_fulfillment_unit_index: 0, overlap_authorized: false },
  store_location_id: "location",
  method: { type: "pickup" },
};
void [ending, replacement];
