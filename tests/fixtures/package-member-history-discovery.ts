import { createAdmin } from "arky-sdk/admin";
import type {
  Block,
  PackageMemberDeliveryOptions,
  StorefrontGetPackageMemberDeliveryOptionsParams,
  StorefrontGetPackageMemberSwitchDeliveryOptionsParams,
  PackageMember,
  PackageMemberAcceptedTerms,
  PackageMemberSelfAcceptedTerms,
  PackageMemberRevisionOrigin,
  PackageMemberSelfRevisionOrigin,
  PackageMemberChangeAccess,
  PackageMemberChanges,
  PackageMemberCurrent,
  PackageMemberCurrentSelf,
  PackageMemberSelfPricedTerms,
  Currency,
  PackageMemberProductChoices,
  PackageProductAlternative,
  PackageProductChoices,
  GetStorefrontPackageProductChoicesParams,
  StorefrontGetPackageMemberProductChoicesParams,
  PackageMemberRevision,
  PackageMemberRevisionDetail,
  PackageMemberRevisionDetailSelf,
  PackageMemberPackageSelf,
  PackageMemberRevisionSelf,
  PackageMemberSelf,
  FindPackageMembersParams,
  Order,
  PaginatedResponse,
} from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

const tenant_id = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
const admin = createAdmin({
  apiUrl: "https://api.example.test",
  accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA",
});
const members: FindPackageMembersParams = {
  tenant_id,
  user_id: "user",
  package_id: "package",
  package_offering_id: "offering",
  status: "paused",
  limit: 20,
  cursor: "opaque",
};
void admin.eshop.packageMember.find(members);
const current: Promise<PackageMemberCurrent> =
  admin.eshop.packageMember.getCurrent({ tenant_id, id: "member" });
const orders: Promise<PaginatedResponse<Order>> =
  admin.eshop.packageMember.findOrders({
    tenant_id,
    id: "member",
    limit: 20,
  });
const revisions: Promise<PaginatedResponse<PackageMemberRevision>> =
  admin.eshop.packageMember.findRevisions({ tenant_id, id: "member" });
const revision: Promise<PackageMemberRevisionDetail> =
  admin.eshop.packageMember.getRevision({
    tenant_id,
    package_member_id: "member",
    revision_id: "revision",
  });
const revisionPurchases: Promise<PaginatedResponse<Order>> =
  admin.eshop.packageMember.findRevisionPurchaseOrders({
    tenant_id,
    package_member_id: "member",
    revision_id: "revision",
    limit: 2,
    cursor: "next",
  });
void [current, orders, revisions, revision, revisionPurchases];

export type PackageMemberHistoryContracts = [
  Assert<Equal<PackageMemberCurrentSelf["terms"], PackageMemberSelfPricedTerms | null>>,
  Assert<Equal<PackageMemberSelfPricedTerms["currency"], Currency>>,
  Assert<
    Equal<
      PackageMemberCurrent["package_member"],
      PackageMember
    >
  >,
  Assert<
    Equal<
      keyof PackageMemberCurrentSelf,
      "package_member" | "revision" | "terms" | "head_revision_id"
    >
  >,
  Assert<
    Equal<
      keyof PackageMemberDeliveryOptions,
      | "package_member"
      | "revision_id"
      | "delivery_id"
      | "language"
      | "currency"
      | "destination"
      | "offers"
    >
  >,
  Assert<
    Equal<
      keyof StorefrontGetPackageMemberDeliveryOptionsParams,
      | "id"
      | "expected_updated_at"
      | "revision_id"
      | "delivery_id"
      | "language"
      | "quantity"
      | "choices"
      | "deliveries"
      | "billing_address"
      | "purchase_order_number"
    >
  >,
  Assert<
    Equal<
      keyof StorefrontGetPackageMemberSwitchDeliveryOptionsParams,
      | "id"
      | "expected_updated_at"
      | "revision_id"
      | "delivery_id"
      | "language"
      | "to_package_id"
      | "choices"
      | "price"
      | "deliveries"
    >
  >,
  Assert<
    Equal<
      PackageMemberCurrentSelf["package_member"],
      PackageMemberSelf
    >
  >,
  Assert<
    Equal<
      keyof PackageProductAlternative,
      | "variant_id"
      | "sku"
      | "product_blocks"
      | "variant_blocks"
      | "available"
    >
  >,
  Assert<Equal<PackageProductAlternative["variant_blocks"], Block[]>>,
  Assert<Equal<PackageProductAlternative["product_blocks"], Block[]>>,
  Assert<Missing<PackageProductChoices, "language">>,
  Assert<Missing<PackageMemberProductChoices, "language">>,
  Assert<
    Equal<
      PackageProductChoices["alternatives"],
      PackageProductAlternative[]
    >
  >,
  Assert<
    Equal<
      PackageMemberProductChoices["alternatives"],
      PackageProductAlternative[]
    >
  >,
  Assert<
    Equal<
      keyof StorefrontGetPackageMemberProductChoicesParams,
      | "id"
      | "expected_updated_at"
      | "package_item_id"
      | "revision_id"
    >
  >,
  Assert<
    Missing<
      GetStorefrontPackageProductChoicesParams,
      "include_price" | "product_id" | "language"
    >
  >,
  Assert<
    Equal<
      keyof PackageMemberCurrent,
      "package_member" | "revision" | "terms" | "head_revision_id"
    >
  >,
  Assert<
    Equal<
      PackageMemberCurrent["terms"],
      PackageMemberAcceptedTerms | null
    >
  >,
  Assert<
    Equal<
      keyof PackageMemberAcceptedTerms,
      "package" | "quantity" | "deliveries" | "billing_address" | "purchase_order_number"
    >
  >,
  Assert<
    Equal<
      keyof PackageMemberSelfAcceptedTerms,
      "package" | "quantity" | "deliveries" | "billing_address" | "purchase_order_number"
    >
  >,
  Assert<Equal<PackageMemberSelfAcceptedTerms["purchase_order_number"], string | null>>,
  Assert<Equal<PackageMemberRevision["terms"], PackageMemberAcceptedTerms>>,
  Assert<Equal<PackageMemberRevisionSelf["terms"], PackageMemberSelfAcceptedTerms>>,
  Assert<Equal<PackageMemberRevisionDetail["terms"], PackageMemberAcceptedTerms>>,
  Assert<Equal<Awaited<ReturnType<ReturnType<typeof createAdmin>["eshop"]["packageMember"]["getChanges"]>>, PackageMemberChanges>>,
  Assert<Equal<keyof PackageMemberChanges, "package_member_id" | "change" | "select_payment_method">>,
  Assert<Equal<PackageMemberChanges["change"], PackageMemberChangeAccess>>,
  Assert<Equal<PackageMemberChanges["select_payment_method"], PackageMemberChangeAccess>>,
  Assert<Equal<PackageMemberChangeAccess, { type: "allowed" } | { type: "forbidden" } | { type: "change_scheduled" }>>,
  Assert<
    Equal<
      PackageMemberRevisionOrigin["type"],
      "initial" | "own_terms" | "package_change" | "upgrade" | "amend" | "minimum"
    >
  >,
  Assert<
    Equal<
      Extract<PackageMemberRevisionOrigin, { type: "amend" }>,
      { type: "amend"; previous_revision_id: string; reason: string }
    >
  >,
  Assert<Missing<Extract<PackageMemberRevisionOrigin, { type: "minimum" }>, "change">>,
  Assert<Equal<PackageMemberSelfRevisionOrigin["type"], PackageMemberRevisionOrigin["type"]>>,
  Assert<
    Equal<
      Extract<PackageMemberSelfRevisionOrigin, { type: "amend" }>,
      { type: "amend"; previous_revision_id: string }
    >
  >,
  Assert<Equal<Extract<PackageMemberSelfRevisionOrigin, { type: "initial" }>, { type: "initial" }>>,
  Assert<Missing<Extract<PackageMemberSelfRevisionOrigin, { type: "minimum" }>, "reason" | "change">>,
  Assert<
    Equal<
      keyof ReturnType<typeof createAdmin>["eshop"]["packageMember"],
      | "find"
      | "findCurrent"
      | "get"
      | "assign"
      | "getCurrent"
      | "findRevisions"
      | "getRevision"
      | "findRevisionPurchaseOrders"
      | "findOrders"
      | "getMinimum"
      | "getCalendar"
      | "getChanges"
      | "cancel"
      | "scheduleEnd"
      | "pause"
      | "resume"
      | "skipNext"
      | "selectPaymentMethod"
      | "reviewSwitch"
      | "switch"
      | "reviewMinimum"
      | "changeMinimum"
      | "reviewTerms"
      | "changeTerms"
      | "withdrawRevision"
      | "revoke"
      | "transferMinimum"
    >
  >,
  Assert<
    Equal<
      Extract<
        PackageMemberSelf["status"],
        { type: "paused" }
      >["cause"]["type"],
      "requested" | "renewal_unpaid"
    >
  >,
  Assert<
    Missing<
      Extract<
        Extract<PackageMemberSelf["status"], { type: "paused" }>["cause"],
        { type: "requested" }
      >,
      "by" | "reason"
    >
  >,
  Assert<
    Equal<
      Extract<
        PackageMember["status"],
        { type: "paused" }
      >["cause"]["type"],
      "requested" | "renewal_unpaid"
    >
  >,
  Assert<
    Missing<
      Extract<PackageMember["status"], { type: "blocked" }>,
      "block"
    >
  >,
  Assert<Missing<PackageMemberRevisionSelf, "accepted_by">>,
  Assert<
    Equal<
      PackageMemberRevisionDetailSelf["revision"],
      PackageMemberRevisionSelf
    >
  >,
  Assert<
    Equal<
      keyof PackageMemberRevisionDetailSelf,
      "revision" | "terms" | "package"
    >
  >,
  Assert<
    Equal<
      PackageMemberRevisionDetailSelf["package"],
      PackageMemberPackageSelf
    >
  >,
  Assert<
    Equal<PackageMemberPackageSelf, { id: string; key: string; blocks: Block[] }>
  >,
  Assert<Missing<PackageMemberRevisionDetail, "package">>,
  Assert<
    Missing<
      ReturnType<typeof createAdmin>["eshop"],
      "subscription"
    >
  >,
];
