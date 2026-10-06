import type {
  FindPricesParams,
  FindCatalogItemsParams,
  FindCatalogAccessesParams,
  CatalogItem,
  CatalogItemRef,
  CatalogAccess,
  CatalogAccessLevel,
  CatalogChannels,
  CatalogItemBatchOperation,
  CatalogCopyResult,
  CopyCatalogParams,
  CatalogReadOptions,
  CatalogAudience,
  CatalogUsage,
  FindCatalogsParams,
  GetCatalogByKeyParams,
  Catalog,
  CreateCatalogParams,
  CreateCatalogItemParams,
  CreateCatalogAccessParams,
  DeleteCatalogParams,
  DeleteCatalogItemParams,
  DeleteCatalogAccessParams,
  SellableRef,
  StorefrontSubscriptionPlan,
  StorefrontPrice,
  UpdateCatalogItemParams,
  UpdateCatalogParams,
} from "arky-sdk";
import type { createAdmin } from "arky-sdk/admin";
import type { Catalog as PublicCatalog } from "arky-sdk/types";

type AssertTrue<T extends true> = T;
type AssertFalse<T extends false> = T;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Same<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type Eshop = ReturnType<typeof createAdmin>["eshop"];

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
type CatalogBelongsToMarket = AssertTrue<RequiredField<Catalog, "market_id">>;
type CatalogHasNoListOrAssortment = AssertFalse<
  "price_list_id" | "assortment_id" | "priority" | "name" extends keyof Catalog ? true : false
>;
type CatalogCreateNeedsMarket = AssertTrue<RequiredField<CreateCatalogParams, "market_id">>;
type CatalogUpdateCannotMoveMarket = AssertFalse<
  "market_id" extends keyof UpdateCatalogParams ? true : false
>;
type CatalogUpdateStartExplicit = AssertTrue<RequiredField<UpdateCatalogParams, "starts_at">>;
type CatalogUpdateEndExplicit = AssertTrue<RequiredField<UpdateCatalogParams, "ends_at">>;
type CatalogKeyImmutable = AssertFalse<"key" extends keyof UpdateCatalogParams ? true : false>;
type ItemHasNoStatus = AssertFalse<"status" extends keyof CatalogItem ? true : false>;
type ItemUpdateCannotRebind = AssertFalse<
  "item" | "catalog_id" extends keyof UpdateCatalogItemParams ? true : false
>;
type ItemPositionRequired = AssertTrue<RequiredField<UpdateCatalogItemParams, "position">>;
type ItemPositionClearable = AssertTrue<null extends UpdateCatalogItemParams["position"] ? true : false>;
type ItemRefKinds = AssertTrue<
  Same<CatalogItemRef["type"], "product" | "digital_product" | "booking_service" | "subscription_offering">
>;
type AudienceKinds = AssertTrue<
  Same<CatalogAudience["type"], "everyone" | "customer_group" | "customer" | "all_companies" | "company" | "company_location">
>;
type AccessIsCreateDeleteOnly = AssertTrue<Same<keyof Eshop["catalogAccess"], "create" | "get" | "find" | "delete">>;
type ItemApi = AssertTrue<Same<keyof Eshop["catalogItem"], "create" | "update" | "get" | "find" | "delete" | "batch">>;
type ItemBatchReturnsItems = AssertTrue<Same<Awaited<ReturnType<Eshop["catalogItem"]["batch"]>>, CatalogItem[]>>;
type ItemBatchKinds = AssertTrue<Same<CatalogItemBatchOperation["type"], "create" | "update" | "delete">>;
type CatalogCopy = AssertTrue<Same<Parameters<Eshop["catalog"]["copy"]>[0], CopyCatalogParams>>;
type CatalogCopyAnswer = AssertTrue<Same<Awaited<ReturnType<Eshop["catalog"]["copy"]>>, CatalogCopyResult>>;
type AccessChannels = AssertTrue<Same<CatalogChannels, { type: "all" } | { type: "only"; sales_channel_ids: string[] }>>;
type AccessLevels = AssertTrue<Same<CatalogAccessLevel["type"], "browse" | "see_prices" | "buy">>;
type AccessCarriesChannelsAndLevel = AssertTrue<
  RequiredField<CatalogAccess, "channels"> extends true ? RequiredField<CatalogAccess, "level"> : false
>;
type AccessCreateNeedsChannelsAndLevel = AssertTrue<
  RequiredField<CreateCatalogAccessParams, "channels"> extends true ? RequiredField<CreateCatalogAccessParams, "level"> : false
>;
type BrowseNamesOneCatalog = AssertTrue<Same<CatalogReadOptions["catalog_id"], string | undefined>>;
type ItemDeleteHasNoBody = AssertTrue<Same<Awaited<ReturnType<Eshop["catalogItem"]["delete"]>>, void>>;
type AccessDeleteHasNoBody = AssertTrue<Same<Awaited<ReturnType<Eshop["catalogAccess"]["delete"]>>, void>>;
type CatalogDeleteVersionRequired = AssertTrue<RequiredField<DeleteCatalogParams, "expected_updated_at">>;
type ItemDeleteVersionRequired = AssertTrue<RequiredField<DeleteCatalogItemParams, "expected_updated_at">>;
type AccessDeleteVersionRequired = AssertTrue<RequiredField<DeleteCatalogAccessParams, "expected_updated_at">>;
type ItemCreateNeedsCatalog = AssertTrue<RequiredField<CreateCatalogItemParams, "catalog_id">>;
type AccessCreateNeedsAudience = AssertTrue<RequiredField<CreateCatalogAccessParams, "audience">>;
type UsageNamesBlockers = AssertTrue<
  Same<CatalogUsage["blocking_promotion_id"], string | null>
>;
type RemovedNamespaces = AssertTrue<
  Extract<keyof Eshop, "priceList" | "assortment" | "assortmentItem" | "catalogEntitlement"> extends never ? true : false
>;
type PublicPricesHaveNoSource = AssertFalse<"source" extends keyof StorefrontPrice ? true : false>;
type SubscriptionPlanResolvedPrice = AssertTrue<
  [StorefrontSubscriptionPlan["price"]] extends [StorefrontPrice | null] ? true : false
>;
type SubscriptionPlanNoEditableCharge = AssertFalse<
  "charge" extends keyof StorefrontSubscriptionPlan ? true : false
>;
type SubscriptionPlanNoPurchaseFlag = AssertFalse<
  "purchase_allowed" extends keyof StorefrontSubscriptionPlan ? true : false
>;

export type CatalogContracts = [
  AssertFalse<'draft' extends FindPricesParams['status'] ? true : false>,
  AssertFalse<'amount' extends FindPricesParams['sort_field'] ? true : false>,
  AssertTrue<SellableRef extends NonNullable<FindPricesParams['sellable']> ? true : false>,
  AssertTrue<CatalogItemRef extends NonNullable<FindCatalogItemsParams['item']> ? true : false>,
  AssertTrue<RequiredField<FindCatalogItemsParams, 'catalog_id'>>,
  AssertTrue<RequiredField<FindCatalogAccessesParams, 'catalog_id'>>,
  AssertFalse<'status' extends keyof FindCatalogItemsParams ? true : false>,
  AssertTrue<RequiredField<GetCatalogByKeyParams, 'key'>>,
  AssertTrue<'deleting' extends FindCatalogsParams['status'] ? true : false>,
  AssertTrue<'market_id' extends keyof FindCatalogsParams ? true : false>,
  AssertTrue<RequiredField<CatalogAccess, 'audience'>>,
  CatalogPublicEntryParity,
  PhysicalParentRequired,
  PhysicalVariantRequired,
  CatalogBelongsToMarket,
  CatalogHasNoListOrAssortment,
  CatalogCreateNeedsMarket,
  CatalogUpdateCannotMoveMarket,
  CatalogUpdateStartExplicit,
  CatalogUpdateEndExplicit,
  CatalogKeyImmutable,
  ItemHasNoStatus,
  ItemUpdateCannotRebind,
  ItemPositionRequired,
  ItemPositionClearable,
  ItemRefKinds,
  AudienceKinds,
  AccessIsCreateDeleteOnly,
  ItemApi,
  ItemBatchReturnsItems,
  ItemBatchKinds,
  CatalogCopy,
  CatalogCopyAnswer,
  AccessChannels,
  AccessLevels,
  AccessCarriesChannelsAndLevel,
  AccessCreateNeedsChannelsAndLevel,
  BrowseNamesOneCatalog,
  ItemDeleteHasNoBody,
  AccessDeleteHasNoBody,
  CatalogDeleteVersionRequired,
  ItemDeleteVersionRequired,
  AccessDeleteVersionRequired,
  ItemCreateNeedsCatalog,
  AccessCreateNeedsAudience,
  UsageNamesBlockers,
  RemovedNamespaces,
  PublicPricesHaveNoSource,
  SubscriptionPlanResolvedPrice,
  SubscriptionPlanNoEditableCharge,
  SubscriptionPlanNoPurchaseFlag,
];
