import type {
  Store,
  CreateStoreParams,
  UpdateStoreParams,
  InitialMarketInput,
  Market,
  MarketStatus,
  MarketUsage,
  UpdateMarketParams,
  DeleteMarketParams,
  CompanyAddress,
  CompanyProfile,
  CompanyEditableStatus,
  CompanyStatus,
  Company,
  CompanyUsage,
  CreateCompanyParams,
  GetCompanyParams,
  UpdateCompanyParams,
  DeleteCompanyParams,
  FindCompaniesParams,
  CompanyMembershipEditableStatus,
  CompanyMembershipStatus,
  CompanyLocationReach,
  CompanyMembership,
  CreateCompanyMembershipParams,
  GetCompanyMembershipParams,
  UpdateCompanyMembershipParams,
  DeleteCompanyMembershipParams,
  FindCompanyMembershipsParams,
  CompanyPermission,
  CompanyRoleStatus,
  CompanyRole,
  CompanyRoleUsage,
  CreateCompanyRoleParams,
  GetCompanyRoleParams,
  UpdateCompanyRoleParams,
  DeleteCompanyRoleParams,
  FindCompanyRolesParams,
  CompanyLocationEditableStatus,
  CompanyLocationStatus,
  CompanyLocation,
  CompanyLocationTaxSettings,
  CompanyLocationCommercePolicy,
  CreateCompanyLocationParams,
  GetCompanyLocationParams,
  UpdateCompanyLocationParams,
  DeleteCompanyLocationParams,
  FindCompanyLocationsParams,
  SetCompanyLocationServedFromParams,
  CustomerGroupEditableStatus,
  CustomerGroupStatus,
  CustomerGroup,
  CustomerGroupUsage,
  CreateCustomerGroupParams,
  GetCustomerGroupParams,
  UpdateCustomerGroupParams,
  DeleteCustomerGroupParams,
  FindCustomerGroupsParams,
  CustomerGroupMember,
  CustomerGroupAdmission,
  CustomerGroupMemberType,
  JoinCustomerGroupParams,
  GetCustomerGroupMemberParams,
  FindCustomerGroupMembersParams,
  GetCurrentCustomerGroupMemberParams,
  SalesChannelEditableStatus,
  SalesChannelStatus,
  SalesChannel,
  SalesChannelUsage,
  CreateSalesChannelParams,
  GetSalesChannelParams,
  UpdateSalesChannelParams,
  DeleteSalesChannelParams,
  FindSalesChannelsParams,
} from "arky-sdk";
import type * as PublicTypes from "arky-sdk/types";
import type { createAdmin } from "arky-sdk/admin";

type True<T extends true> = T;
type False<T extends false> = T;
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Admin = ReturnType<typeof createAdmin>;
type CompanyApi = Admin["companies"];
type CompanyMembershipApi = Admin["companies"]["membership"];
type CompanyRoleApi = Admin["companies"]["role"];
type CompanyLocationApi = Admin["companies"]["location"];
type CustomerGroupApi = Admin["eshop"]["customerGroup"];
type CustomerGroupMemberApi = Admin["eshop"]["customerGroupMember"];
type SalesChannelApi = Admin["store"]["salesChannel"];
type MarketApi = Admin["store"]["market"];

export type CompanyContracts = [
  True<Equal<PublicTypes.CompanyLocationReach, CompanyLocationReach>>,
  True<Equal<CompanyLocationReach, { type: "everywhere" } | { type: "only"; company_location_ids: string[] }>>,
  True<RequiredField<CompanyMembership, "locations">>,
  True<RequiredField<CreateCompanyMembershipParams, "locations">>,
  True<RequiredField<UpdateCompanyMembershipParams, "locations">>,
  False<"scope" extends keyof CompanyMembership ? true : false>,
  True<RequiredField<CompanyLocation, "fulfillment_store_location_id">>,
  True<Equal<CompanyLocation["fulfillment_store_location_id"], string | null>>,
  True<Equal<Parameters<CompanyLocationApi["setServedFrom"]>[0], SetCompanyLocationServedFromParams>>,
  True<Equal<Awaited<ReturnType<CompanyLocationApi["setServedFrom"]>>, CompanyLocation>>,
  True<Equal<SetCompanyLocationServedFromParams["fulfillment_store_location_id"], string | null>>,
  False<"fulfillment_store_location_id" extends keyof UpdateCompanyLocationParams ? true : false>,
  True<Equal<CompanyLocation["shipping_address"], CompanyAddress | null>>,
  True<Equal<UpdateCompanyLocationParams["shipping_address"], CompanyAddress | null>>,
  True<RequiredField<CompanyLocation, "tax">>,
  True<RequiredField<CompanyLocation, "commerce">>,
  True<Equal<CompanyLocation["tax"], CompanyLocationTaxSettings>>,
  True<Equal<CompanyLocation["commerce"], CompanyLocationCommercePolicy>>,
  True<Equal<CompanyLocationCommercePolicy["allowed_payment_option_ids"], string[] | null>>,
  False<"tax" extends keyof UpdateCompanyLocationParams ? true : false>,
  False<"commerce" extends keyof UpdateCompanyLocationParams ? true : false>,
  True<"access_digital_products" extends CompanyPermission ? true : false>,
  True<Equal<NonNullable<FindCompaniesParams["status"]>, CompanyStatus["type"]>>,
  True<Equal<NonNullable<FindCompaniesParams["sort_field"]>, "created_at" | "updated_at">>,
  True<Equal<NonNullable<FindCompaniesParams["sort_direction"]>, "asc" | "desc">>,
  True<RequiredField<CompanyUsage, "group_member_ids">>,
  True<RequiredField<CompanyUsage, "catalog_access_ids">>,
  False<"catalog_entitlement_ids" extends keyof CompanyUsage ? true : false>,
  True<RequiredField<CompanyUsage, "shipping_rate_ids">>,
  False<"group_edge_ids" extends keyof CompanyUsage ? true : false>,
  True<Equal<PublicTypes.Company, Company>>,
  True<Equal<Awaited<ReturnType<CompanyApi["create"]>>, Company>>,
  True<Equal<Awaited<ReturnType<CompanyApi["get"]>>, Company>>,
  True<
    Equal<Awaited<ReturnType<CompanyApi["find"]>>["items"][number], Company>
  >,
  True<Equal<Awaited<ReturnType<CompanyApi["delete"]>>, Company>>,
  True<RequiredField<DeleteCompanyParams, "expected_updated_at">>,
  True<"deleting" extends Company["status"]["type"] ? true : false>,
  True<Equal<Awaited<ReturnType<CompanyApi["update"]>>, Company>>,
  True<RequiredField<UpdateCompanyParams, "expected_updated_at">>,
  True<Equal<Awaited<ReturnType<CompanyApi["usage"]>>, CompanyUsage>>,
  False<"deleting" extends CompanyEditableStatus["type"] ? true : false>,
  True<Equal<PublicTypes.CompanyMembership, CompanyMembership>>,
  True<
    Equal<
      Awaited<ReturnType<CompanyMembershipApi["create"]>>,
      CompanyMembership
    >
  >,
  True<
    Equal<Awaited<ReturnType<CompanyMembershipApi["get"]>>, CompanyMembership>
  >,
  True<
    Equal<
      Awaited<ReturnType<CompanyMembershipApi["find"]>>["items"][number],
      CompanyMembership
    >
  >,
  True<
    Equal<
      Awaited<ReturnType<CompanyMembershipApi["delete"]>>,
      CompanyMembership
    >
  >,
  True<RequiredField<DeleteCompanyMembershipParams, "expected_updated_at">>,
  True<"deleting" extends CompanyMembership["status"]["type"] ? true : false>,
  True<
    Equal<
      Awaited<ReturnType<CompanyMembershipApi["update"]>>,
      CompanyMembership
    >
  >,
  True<RequiredField<UpdateCompanyMembershipParams, "expected_updated_at">>,
  False<
    "deleting" extends CompanyMembershipEditableStatus["type"] ? true : false
  >,
  True<Equal<PublicTypes.CompanyRole, CompanyRole>>,
  True<Equal<Awaited<ReturnType<CompanyRoleApi["create"]>>, CompanyRole>>,
  True<Equal<Awaited<ReturnType<CompanyRoleApi["get"]>>, CompanyRole>>,
  True<
    Equal<
      Awaited<ReturnType<CompanyRoleApi["find"]>>["items"][number],
      CompanyRole
    >
  >,
  True<Equal<Awaited<ReturnType<CompanyRoleApi["delete"]>>, CompanyRole>>,
  True<RequiredField<DeleteCompanyRoleParams, "expected_updated_at">>,
  True<"deleting" extends CompanyRole["status"]["type"] ? true : false>,
  True<Equal<Awaited<ReturnType<CompanyRoleApi["update"]>>, CompanyRole>>,
  True<RequiredField<UpdateCompanyRoleParams, "expected_updated_at">>,
  True<Equal<Awaited<ReturnType<CompanyRoleApi["usage"]>>, CompanyRoleUsage>>,
  True<Equal<PublicTypes.CompanyLocation, CompanyLocation>>,
  True<
    Equal<Awaited<ReturnType<CompanyLocationApi["create"]>>, CompanyLocation>
  >,
  True<Equal<Awaited<ReturnType<CompanyLocationApi["get"]>>, CompanyLocation>>,
  True<
    Equal<
      Awaited<ReturnType<CompanyLocationApi["find"]>>["items"][number],
      CompanyLocation
    >
  >,
  True<
    Equal<Awaited<ReturnType<CompanyLocationApi["delete"]>>, CompanyLocation>
  >,
  True<RequiredField<DeleteCompanyLocationParams, "expected_updated_at">>,
  True<"deleting" extends CompanyLocation["status"]["type"] ? true : false>,
  True<
    Equal<Awaited<ReturnType<CompanyLocationApi["update"]>>, CompanyLocation>
  >,
  True<RequiredField<UpdateCompanyLocationParams, "expected_updated_at">>,
  False<
    "deleting" extends CompanyLocationEditableStatus["type"] ? true : false
  >,
  True<Equal<PublicTypes.CustomerGroup, CustomerGroup>>,
  True<Equal<Awaited<ReturnType<CustomerGroupApi["create"]>>, CustomerGroup>>,
  True<Equal<Awaited<ReturnType<CustomerGroupApi["get"]>>, CustomerGroup>>,
  True<
    Equal<
      Awaited<ReturnType<CustomerGroupApi["find"]>>["items"][number],
      CustomerGroup
    >
  >,
  True<Equal<Awaited<ReturnType<CustomerGroupApi["delete"]>>, CustomerGroup>>,
  True<RequiredField<DeleteCustomerGroupParams, "expected_updated_at">>,
  True<"deleting" extends CustomerGroup["status"]["type"] ? true : false>,
  True<Equal<Awaited<ReturnType<CustomerGroupApi["update"]>>, CustomerGroup>>,
  True<RequiredField<UpdateCustomerGroupParams, "expected_updated_at">>,
  True<
    Equal<Awaited<ReturnType<CustomerGroupApi["usage"]>>, CustomerGroupUsage>
  >,
  False<"deleting" extends CustomerGroupEditableStatus["type"] ? true : false>,
  True<Equal<PublicTypes.CustomerGroupMember, CustomerGroupMember>>,
  True<
    Equal<
      Awaited<ReturnType<CustomerGroupMemberApi["join"]>>,
      PublicTypes.CustomerGroupJoinResult
    >
  >,
  True<
    Equal<
      Awaited<ReturnType<CustomerGroupMemberApi["get"]>>,
      CustomerGroupMember
    >
  >,
  True<
    Equal<
      Awaited<ReturnType<CustomerGroupMemberApi["find"]>>["items"][number],
      CustomerGroupMember
    >
  >,
  True<
    Equal<
      Awaited<ReturnType<CustomerGroupMemberApi["current"]>>,
      PublicTypes.CustomerGroupMemberSelf | null
    >
  >,
  True<Equal<CustomerGroupMember["member"], CustomerGroupMemberType>>,
  False<"administrative_access" extends keyof PublicTypes.CustomerGroupMemberSelf ? true : false>,
  True<Equal<Awaited<ReturnType<CustomerGroupMemberApi["execute"]>>, PublicTypes.CustomerGroupMemberCommandResponse>>,
  True<Equal<CustomerGroupMember["admission"], CustomerGroupAdmission>>,
  True<RequiredField<JoinCustomerGroupParams, "request">>,
  True<RequiredField<JoinCustomerGroupParams, "request_id">>,
  False<"command_id" extends keyof JoinCustomerGroupParams ? true : false>,
  True<RequiredField<GetCustomerGroupMemberParams, "id">>,
  True<RequiredField<GetCurrentCustomerGroupMemberParams, "customer_group_id">>,
  False<"store_id" extends keyof FindCustomerGroupMembersParams ? false : true>,
  False<"create" extends keyof CustomerGroupMemberApi ? true : false>,
  False<"update" extends keyof CustomerGroupMemberApi ? true : false>,
  False<"delete" extends keyof CustomerGroupMemberApi ? true : false>,
  True<Equal<PublicTypes.SalesChannel, SalesChannel>>,
  True<Equal<Awaited<ReturnType<SalesChannelApi["create"]>>, SalesChannel>>,
  True<Equal<Awaited<ReturnType<SalesChannelApi["get"]>>, SalesChannel>>,
  True<
    Equal<
      Awaited<ReturnType<SalesChannelApi["find"]>>["items"][number],
      SalesChannel
    >
  >,
  True<Equal<Awaited<ReturnType<SalesChannelApi["delete"]>>, SalesChannel>>,
  True<RequiredField<DeleteSalesChannelParams, "expected_updated_at">>,
  True<"deleting" extends SalesChannel["status"]["type"] ? true : false>,
  True<Equal<Awaited<ReturnType<SalesChannelApi["update"]>>, SalesChannel>>,
  True<RequiredField<UpdateSalesChannelParams, "expected_updated_at">>,
  True<Equal<Awaited<ReturnType<SalesChannelApi["usage"]>>, SalesChannelUsage>>,
  False<"deleting" extends SalesChannelEditableStatus["type"] ? true : false>,
  True<RequiredField<CompanyProfile, "registered_address">>,
  True<RequiredField<CompanyProfile, "legal_name">>,
  True<RequiredField<CompanyProfile, "contact_email">>,
  True<null extends CompanyProfile["registered_address"] ? true : false>,
  True<RequiredField<CompanyAddress, "state">>,
  True<RequiredField<CompanyAddress, "street2">>,
  False<undefined extends CompanyAddress["country"] ? true : false>,
  True<null extends CompanyAddress["country"] ? true : false>,
  False<"key" extends keyof Company ? true : false>,
  False<"key" extends keyof UpdateCustomerGroupParams ? true : false>,
  False<
    "company_id" extends keyof UpdateCompanyMembershipParams ? true : false
  >,
  False<
    "customer_id" extends keyof UpdateCompanyMembershipParams ? true : false
  >,
  False<"status" extends keyof CreateCompanyMembershipParams ? true : false>,
  False<"company_id" extends keyof UpdateCompanyLocationParams ? true : false>,
  True<RequiredField<UpdateCompanyLocationParams, "billing_address">>,
  True<
    null extends UpdateCompanyLocationParams["billing_address"] ? true : false
  >,
  False<"status" extends keyof UpdateCompanyRoleParams ? true : false>,
  False<"key" extends keyof UpdateCompanyRoleParams ? true : false>,
  False<"is_system" extends keyof CreateCompanyRoleParams ? true : false>,
  False<"is_system" extends keyof UpdateCompanyRoleParams ? true : false>,
  False<"rule_ids" extends keyof CompanyUsage ? true : false>,
  False<"rule_ids" extends keyof CustomerGroupUsage ? true : false>,
  False<"listing_ids" extends keyof SalesChannelUsage ? true : false>,
  False<"status" extends keyof JoinCustomerGroupParams ? true : false>,
  False<"customer_group_id" extends keyof JoinCustomerGroupParams ? true : false>,
  False<"key" extends keyof CustomerGroupMember ? true : false>,
  False<"key" extends keyof UpdateSalesChannelParams ? true : false>,
  False<
    null extends DeleteSalesChannelParams["replacement_default_sales_channel_id"]
      ? true
      : false
  >,
  False<
    null extends UpdateSalesChannelParams["replacement_default_sales_channel_id"]
      ? true
      : false
  >,
  False<string extends CompanyPermission ? true : false>,
  True<"create_subscriptions" extends CompanyPermission ? true : false>,
  True<"manage_company_subscriptions" extends CompanyPermission ? true : false>,
  True<Equal<CompanyPermission, "admin" | "place_orders" | "create_subscriptions" | "access_digital_products" | "view_own_orders" | "view_company_orders" | "view_own_subscriptions" | "view_company_subscriptions" | "manage_company" | "manage_addresses" | "manage_members" | "manage_company_subscriptions" | "manage_payment_methods">>,
  True<Equal<SalesChannel["market_ids"], string[]>>,
  True<RequiredField<CreateSalesChannelParams, "market_ids">>,
  True<RequiredField<UpdateSalesChannelParams, "market_ids">>,
  True<Equal<keyof SalesChannelUsage, "storefront_client_ids" | "more_storefront_clients" | "catalog_access_ids" | "more_catalog_accesses" | "shipping_rate_ids" | "more_shipping_rates" | "cart_ids" | "more_carts" | "is_default">>,
  True<"marketSalesChannel" extends keyof Admin["store"] ? false : true>,
  False<"name" extends keyof CompanyRole ? true : false>,
  False<"name" extends keyof CreateCompanyRoleParams ? true : false>,
  False<"name" extends keyof UpdateCompanyRoleParams ? true : false>,
  True<Equal<PublicTypes.InitialMarketInput, InitialMarketInput>>,
  True<RequiredField<InitialMarketInput, "key">>,
  True<RequiredField<InitialMarketInput, "currency">>,
  True<RequiredField<InitialMarketInput, "tax_mode">>,
  False<"default_market_id" extends keyof UpdateStoreParams ? true : false>,
  False<
    null extends UpdateStoreParams["default_sales_channel_id"] ? true : false
  >,
  True<Equal<PublicTypes.MarketStatus, MarketStatus>>,
  True<Equal<Market["status"], MarketStatus>>,
  True<RequiredField<Market, "status">>,
  True<Equal<MarketStatus["type"], "active" | "deleting">>,
  True<Equal<Awaited<ReturnType<MarketApi["delete"]>>, Market>>,
  True<Equal<Awaited<ReturnType<MarketApi["usage"]>>, MarketUsage>>,
  True<Equal<PublicTypes.MarketUsage, MarketUsage>>,
  True<Equal<keyof MarketUsage, "market_payment_option_ids" | "more_market_payment_options" | "sales_channel_ids" | "more_sales_channels" | "market_zone_ids" | "more_market_zones" | "catalog_ids" | "more_catalogs" | "cart_ids" | "more_carts">>,
  False<"is_default" extends keyof MarketUsage ? true : false>,
  True<RequiredField<UpdateMarketParams, "expected_updated_at">>,
  True<RequiredField<DeleteMarketParams, "expected_updated_at">>,
  False<"replacement_default_market_id" extends keyof DeleteMarketParams ? true : false>,
  False<"key" extends keyof UpdateMarketParams ? true : false>,
  False<"currency" extends keyof UpdateMarketParams ? true : false>,
  False<"rule_ids" extends keyof MarketUsage ? true : false>,
];
