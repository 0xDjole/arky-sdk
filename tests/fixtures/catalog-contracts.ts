import type {
  AssortmentItem,
  Catalog,
  CatalogAccess,
  CatalogCondition,
  CatalogEntitlement,
  CreateCatalogParams,
  DeleteAssortmentParams,
  DeleteAssortmentItemParams,
  DeleteCatalogParams,
  DeleteCatalogEntitlementParams,
  SellableRef,
  StorefrontAudienceType,
  StorefrontPrice,
  UpdateAssortmentItemParams,
  UpdateCatalogParams,
  UpdateCatalogEntitlementParams,
} from "arky-sdk";
import type { Catalog as PublicCatalog } from "arky-sdk/types";

type AssertTrue<T extends true> = T;
type AssertFalse<T extends false> = T;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

type CatalogPublicEntryParity = AssertTrue<
  PublicCatalog extends Catalog ? true : false
>;
type ExactPhysicalIdentity = Extract<SellableRef, { type: "product_variant" }>;
type PhysicalParentRequired = AssertTrue<
  RequiredField<ExactPhysicalIdentity, "product_id">
>;
type PhysicalVariantRequired = AssertTrue<
  RequiredField<ExactPhysicalIdentity, "variant_id">
>;
type MembershipHasNoStatus = AssertFalse<
  "status" extends keyof AssortmentItem ? true : false
>;
type MembershipUpdateCannotRebind = AssertFalse<
  "sellable" extends keyof UpdateAssortmentItemParams ? true : false
>;
type MembershipUpdateCannotMove = AssertFalse<
  "assortment_id" extends keyof UpdateAssortmentItemParams ? true : false
>;
type ExplicitPositionRequired = AssertTrue<
  RequiredField<UpdateAssortmentItemParams, "position">
>;
type ClearedPositionAllowed = AssertTrue<
  null extends UpdateAssortmentItemParams["position"] ? true : false
>;
type CatalogCreateAssortmentExplicit = AssertTrue<
  RequiredField<CreateCatalogParams, "assortment_id">
>;
type CatalogCreateListExplicit = AssertTrue<
  RequiredField<CreateCatalogParams, "price_list_id">
>;
type CatalogUpdateAssortmentExplicit = AssertTrue<
  RequiredField<UpdateCatalogParams, "assortment_id">
>;
type CatalogUpdateListExplicit = AssertTrue<
  RequiredField<UpdateCatalogParams, "price_list_id">
>;
type CatalogUpdateStartExplicit = AssertTrue<
  RequiredField<UpdateCatalogParams, "starts_at">
>;
type CatalogUpdateEndExplicit = AssertTrue<
  RequiredField<UpdateCatalogParams, "ends_at">
>;
type ClearCatalogListAllowed = AssertTrue<
  null extends UpdateCatalogParams["price_list_id"] ? true : false
>;
type CatalogKeyImmutable = AssertFalse<
  "key" extends keyof UpdateCatalogParams ? true : false
>;
type EntitlementCatalogImmutable = AssertFalse<
  "catalog_id" extends keyof UpdateCatalogEntitlementParams ? true : false
>;
type EntitlementConditionsRequired = AssertTrue<
  RequiredField<UpdateCatalogEntitlementParams, "conditions">
>;
type IndependentPriceGrant = AssertTrue<
  RequiredField<CatalogAccess, "view_prices">
>;
type IndependentPurchaseGrant = AssertTrue<
  RequiredField<CatalogAccess, "purchase">
>;
type AuthenticationNotInvented = AssertFalse<
  "authentication" extends CatalogCondition["type"] ? true : false
>;
type DeletingReadSupported = AssertTrue<
  { type: "deleting" } extends CatalogEntitlement["status"] ? true : false
>;
type DeletingNotWritable = AssertFalse<
  { type: "deleting" } extends UpdateCatalogEntitlementParams["status"]
    ? true
    : false
>;
type AssortmentDeleteVersionRequired = AssertTrue<
  RequiredField<DeleteAssortmentParams, "expected_updated_at">
>;
type ItemDeleteVersionRequired = AssertTrue<
  RequiredField<DeleteAssortmentItemParams, "expected_updated_at">
>;
type CatalogDeleteVersionRequired = AssertTrue<
  RequiredField<DeleteCatalogParams, "expected_updated_at">
>;
type EntitlementDeleteVersionRequired = AssertTrue<
  RequiredField<DeleteCatalogEntitlementParams, "expected_updated_at">
>;
type PublicPricesHaveNoSource = AssertFalse<
  "source" extends keyof StorefrontPrice ? true : false
>;
type PaidAudience = Extract<StorefrontAudienceType, { type: "paid" }>;
type AudienceResolvedPrices = AssertTrue<
  PaidAudience["prices"] extends StorefrontPrice[] ? true : false
>;
type AudienceNoEditableCharge = AssertFalse<
  "charge" extends keyof PaidAudience ? true : false
>;

export type CatalogContracts = [
  CatalogPublicEntryParity,
  PhysicalParentRequired,
  PhysicalVariantRequired,
  MembershipHasNoStatus,
  MembershipUpdateCannotRebind,
  MembershipUpdateCannotMove,
  ExplicitPositionRequired,
  ClearedPositionAllowed,
  CatalogCreateAssortmentExplicit,
  CatalogCreateListExplicit,
  CatalogUpdateAssortmentExplicit,
  CatalogUpdateListExplicit,
  CatalogUpdateStartExplicit,
  CatalogUpdateEndExplicit,
  ClearCatalogListAllowed,
  CatalogKeyImmutable,
  EntitlementCatalogImmutable,
  EntitlementConditionsRequired,
  IndependentPriceGrant,
  IndependentPurchaseGrant,
  AuthenticationNotInvented,
  DeletingReadSupported,
  DeletingNotWritable,
  AssortmentDeleteVersionRequired,
  ItemDeleteVersionRequired,
  CatalogDeleteVersionRequired,
  EntitlementDeleteVersionRequired,
  PublicPricesHaveNoSource,
  AudienceResolvedPrices,
  AudienceNoEditableCharge,
];
