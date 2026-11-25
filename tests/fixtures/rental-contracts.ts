import { epochMilliseconds } from "arky-sdk";
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
  ProductReference,
  AccountActor,
  Rental,
  RentalCommand,
  RentalDetail,
  RentalEndCause,
  RentalListItem,
  CustomerRentalUnit,
  RentalIssueReplacement,
  RentalReplacementMethod,
  RentalReturnState,
  RentalStatus,
  RentalTerms,
} from "arky-sdk";
import type { Block, CustomerRental as PublicCustomerRental, Rental as PublicRental, RentalDetail as PublicDetail } from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Admin = ReturnType<typeof createAdmin>["eshop"];
type RentalApi = Admin["rental"];
type BuyerRentals = ReturnType<typeof createStorefront>["eshop"]["rental"];
type Action<T extends RentalCommand["type"]> = Extract<RentalCommand, { type: T }>;
type EndingByAccount = Extract<RentalStatus, { type: "ending_by_account" }>;
type EndingBySystem = Extract<RentalStatus, { type: "ending_by_system" }>;
type Withdrawn = Extract<RentalStatus, { type: "withdrawn" }>;
type BuyerWithdrawn = Extract<CustomerRentalStatus, { type: "withdrawn" }>;

export type RentalContract = [
  Assert<Equal<Rental, PublicRental>>,
  Assert<Equal<RentalDetail, PublicDetail>>,
  Assert<Equal<keyof Rental, "id" | "store_id" | "package_member_id" | "package_member_revision_id" | "package_item_id" | "status" | "created_at" | "updated_at">>,
  Assert<Equal<Extract<RentalReturnState, { type: "missing" }>, { type: "missing" }>>,
  Assert<Equal<keyof FindRentalsParams, "store_id" | "ids" | "package_member_ids" | "company_id" | "company_location_id" | "status" | "sort_field" | "sort_direction" | "limit" | "cursor">>,
  Assert<Equal<FindRentalsParams["package_member_ids"], string[] | undefined>>,
  Assert<Equal<{ store_id: string; ids: string[]; status: "active" } extends FindRentalsParams ? true : false, false>>,
  Assert<Equal<RentalListItem, Rental & { product: ProductReference | null; variant_sku: string | null; quantity: number; units: CustomerRentalUnit[] }>>,
  Assert<Equal<CustomerRental["package_member_id"], string>>,
  Assert<Equal<CustomerRental, PublicCustomerRental>>,
  Assert<Equal<CustomerRental["product"], ProductReference | null>>,
  Assert<Equal<CustomerRental["product_key"], string>>,
  Assert<Equal<keyof ProductReference, "id" | "key" | "blocks">>,
  Assert<Equal<ProductReference["blocks"], Block[]>>,
  Assert<Missing<Rental, "product">>,
  Assert<Missing<RentalTerms, "product">>,
  Assert<Missing<Rental, "product_id" | "quantity" | "inventory_item_id">>,
  Assert<Equal<RentalStatus["type"], "waiting" | "active" | "ending_by_account" | "ending_by_system" | "closed_after_account_ending" | "closed_after_system_ending" | "withdrawn">>,
  Assert<Equal<keyof Extract<RentalStatus, { type: "closed_after_account_ending" }>, "type" | "requested_at" | "actor" | "reason" | "return_due_at" | "closed_at">>,
  Assert<Equal<keyof Extract<RentalStatus, { type: "closed_after_system_ending" }>, "type" | "requested_at" | "cause" | "closed_at">>,
  Assert<Equal<Extract<RentalStatus, { type: "waiting" }>, { type: "waiting" }>>,
  Assert<Equal<keyof Withdrawn, "type" | "withdrawn_at">>,
  Assert<Equal<Withdrawn["withdrawn_at"], EpochMilliseconds>>,
  Assert<Equal<FindRentalsParams["status"], "waiting" | "active" | "ending" | "closed" | "withdrawn" | undefined>>,
  Assert<Equal<keyof EndingByAccount, "type" | "requested_at" | "actor" | "reason" | "return_due_at">>,
  Assert<Equal<EndingByAccount["return_due_at"], EpochMilliseconds | null>>,
  Assert<Equal<EndingByAccount["actor"], AccountActor>>,
  Assert<Equal<keyof EndingBySystem, "type" | "requested_at" | "cause">>,
  Assert<Equal<EndingBySystem["cause"], RentalEndCause>>,
  Assert<Equal<RentalEndCause, { type: "package_changed" } | { type: "purchase_cancelled" } | { type: "member_ended" }>>,
  Assert<Equal<keyof RentalTerms, "product_id" | "variant_id" | "quantity" | "inventory_item_id" | "product_key" | "variant_sku">>,
  Assert<Equal<keyof RentalDetail, "rental" | "terms" | "product" | "units">>,
  Assert<Equal<RentalDetail["product"], ProductReference | null>>,
  Assert<Equal<RentalDetail["units"], CustomerRentalUnit[]>>,
  Assert<Equal<RentalCommand["type"], "request_replacement" | "end" | "close" | "resume" | "cancel_issue">>,
  Assert<Equal<Action<"request_replacement">["replacement"], RentalIssueReplacement>>,
  Assert<Equal<Action<"request_replacement">["method"], RentalReplacementMethod>>,
  Assert<Equal<RentalReplacementMethod, { type: "delivery"; destination: PostalAddress } | { type: "pickup" }>>,
  Assert<RequiredField<Action<"end">, "return_due_at">>,
  Assert<Equal<keyof Action<"close">, "type">>,
  Assert<Equal<keyof Action<"resume">, "type">>,
  Assert<Equal<keyof RentalApi, "find" | "get" | "execute">>,
  Assert<Equal<Parameters<RentalApi["find"]>[0], FindRentalsParams>>,
  Assert<Equal<Awaited<ReturnType<RentalApi["find"]>>, PaginatedResponse<RentalListItem>>>,
  Assert<Equal<Parameters<RentalApi["get"]>[0], GetRentalParams>>,
  Assert<Equal<Awaited<ReturnType<RentalApi["get"]>>, RentalDetail>>,
  Assert<Equal<Parameters<RentalApi["execute"]>[0], ActOnRentalParams>>,
  Assert<Equal<keyof ActOnRentalParams, "store_id" | "id" | "expected_updated_at" | "command">>,
  Assert<Equal<ActOnRentalParams["command"], RentalCommand>>,
  Assert<Missing<ActOnRentalParams, "request_id" | "action" | "type">>,
  Assert<Equal<Awaited<ReturnType<RentalApi["execute"]>>, Rental>>,
  Assert<Equal<Parameters<BuyerRentals["find"]>[0], FindCustomerRentalsParams>>,
  Assert<Equal<FindCustomerRentalsParams["package_member_ids"], string[] | undefined>>,
  Assert<Equal<{ limit: number } extends FindCustomerRentalsParams ? true : false, false>>,
  Assert<Equal<{ company_location_id: string; limit: number } extends FindCustomerRentalsParams ? true : false, true>>,
  Assert<Equal<{ package_member_ids: string[] } extends FindCustomerRentalsParams ? true : false, true>>,
  Assert<Missing<FindCustomerRentalsParams, "subscription_id">>,
  Assert<Equal<Awaited<ReturnType<BuyerRentals["get"]>>, CustomerRental>>,
  Assert<Equal<CustomerRentalStatus["type"], "waiting" | "active" | "ending" | "closed" | "withdrawn">>,
  Assert<Equal<Extract<CustomerRentalStatus, { type: "waiting" }>, { type: "waiting" }>>,
  Assert<Equal<keyof BuyerWithdrawn, "type" | "withdrawn_at">>,
  Assert<Equal<BuyerWithdrawn["withdrawn_at"], EpochMilliseconds>>,
  Assert<Missing<Extract<CustomerRentalStatus, { type: "ending" }>, "actor" | "reason">>,
];

export type RentalWorkContract = [
  Assert<Equal<Extract<FulfillmentJobLineSource, { type: "rental_issue" }>, { type: "rental_issue"; rental_id: string; package_member_revision_id: string; quantity: number }>>,
  Assert<Equal<FulfillmentJobType["type"], "order_delivery" | "rental_replacement">>,
  Assert<Equal<Extract<FulfillmentJobType, { type: "rental_replacement" }>["replacement"], RentalIssueReplacement>>,
  Assert<Equal<InventoryUnit["status"], InventoryUnitStatus>>,
  Assert<Equal<FindInventoryUnitsParams["rental_id"], string | undefined>>,
];

const ending: RentalCommand = { type: "end", reason: "Customer ended the agreement", return_due_at: null };
const replacement: RentalCommand = {
  type: "request_replacement",
  fulfillment_job_id: "7f3c1a85-4e29-4b60-a1d7-9c2e5b8f0a36",
  fulfillment_job_line_id: "2d8e4b61-9a37-4c05-8f1e-6b3d0a7c5e92",
  replacement: { predecessor_inventory_unit_id: "unit", predecessor_fulfillment_job_line_id: "delivered-line", predecessor_fulfillment_unit_index: 0, overlap_authorized: false },
  store_location_id: "location",
  method: { type: "pickup" },
};
const waiting: RentalStatus = { type: "waiting" };
const memberEnded: RentalStatus = { type: "ending_by_system", requested_at: epochMilliseconds(1_700_000_000_000), cause: { type: "member_ended" } };
const withdrawn: CustomerRentalStatus = { type: "withdrawn", withdrawn_at: epochMilliseconds(1_700_000_000_000) };
const waitingList: FindRentalsParams = { store_id: "6c1e9a47-2b58-4d93-8f0a-3e7b5d2c9f14", status: "waiting" };
void [ending, replacement, waiting, memberEnded, withdrawn, waitingList];
