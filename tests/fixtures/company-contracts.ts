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
  CreateCompanyLocationParams,
  GetCompanyLocationParams,
  UpdateCompanyLocationParams,
  DeleteCompanyLocationParams,
  FindCompanyLocationsParams,
  CustomerGroupEditableStatus,
  CustomerGroupStatus,
  CustomerGroup,
  CustomerGroupUsage,
  CreateCustomerGroupParams,
  GetCustomerGroupParams,
  UpdateCustomerGroupParams,
  DeleteCustomerGroupParams,
  FindCustomerGroupsParams,
  CustomerGroupCustomerStatus,
  CustomerGroupCustomer,
  CreateCustomerGroupCustomerParams,
  GetCustomerGroupCustomerParams,
  DeleteCustomerGroupCustomerParams,
  FindCustomerGroupCustomersParams,
  CustomerGroupCompanyStatus,
  CustomerGroupCompany,
  CreateCustomerGroupCompanyParams,
  GetCustomerGroupCompanyParams,
  DeleteCustomerGroupCompanyParams,
  FindCustomerGroupCompaniesParams,
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
type CustomerGroupCustomerApi = Admin["eshop"]["customerGroupCustomer"];
type CustomerGroupCompanyApi = Admin["eshop"]["customerGroupCompany"];
type SalesChannelApi = Admin["store"]["salesChannel"];
type MarketApi = Admin["store"]["market"];

export type CompanyContracts = [
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
  True<Equal<PublicTypes.CustomerGroupCustomer, CustomerGroupCustomer>>,
  True<
    Equal<
      Awaited<ReturnType<CustomerGroupCustomerApi["create"]>>,
      CustomerGroupCustomer
    >
  >,
  True<
    Equal<
      Awaited<ReturnType<CustomerGroupCustomerApi["get"]>>,
      CustomerGroupCustomer
    >
  >,
  True<
    Equal<
      Awaited<ReturnType<CustomerGroupCustomerApi["find"]>>["items"][number],
      CustomerGroupCustomer
    >
  >,
  True<
    Equal<
      Awaited<ReturnType<CustomerGroupCustomerApi["delete"]>>,
      CustomerGroupCustomer
    >
  >,
  True<RequiredField<DeleteCustomerGroupCustomerParams, "expected_updated_at">>,
  True<
    "deleting" extends CustomerGroupCustomer["status"]["type"] ? true : false
  >,
  False<"update" extends keyof CustomerGroupCustomerApi ? true : false>,
  True<Equal<PublicTypes.CustomerGroupCompany, CustomerGroupCompany>>,
  True<
    Equal<
      Awaited<ReturnType<CustomerGroupCompanyApi["create"]>>,
      CustomerGroupCompany
    >
  >,
  True<
    Equal<
      Awaited<ReturnType<CustomerGroupCompanyApi["get"]>>,
      CustomerGroupCompany
    >
  >,
  True<
    Equal<
      Awaited<ReturnType<CustomerGroupCompanyApi["find"]>>["items"][number],
      CustomerGroupCompany
    >
  >,
  True<
    Equal<
      Awaited<ReturnType<CustomerGroupCompanyApi["delete"]>>,
      CustomerGroupCompany
    >
  >,
  True<RequiredField<DeleteCustomerGroupCompanyParams, "expected_updated_at">>,
  True<
    "deleting" extends CustomerGroupCompany["status"]["type"] ? true : false
  >,
  False<"update" extends keyof CustomerGroupCompanyApi ? true : false>,
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
  False<"status" extends keyof CreateCustomerGroupCompanyParams ? true : false>,
  False<
    "status" extends keyof CreateCustomerGroupCustomerParams ? true : false
  >,
  False<"key" extends keyof CustomerGroupCompany ? true : false>,
  False<"key" extends keyof CustomerGroupCustomer ? true : false>,
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
  True<Equal<PublicTypes.InitialMarketInput, InitialMarketInput>>,
  True<RequiredField<CreateStoreParams, "initial_market">>,
  True<RequiredField<InitialMarketInput, "key">>,
  True<RequiredField<InitialMarketInput, "currency">>,
  True<RequiredField<InitialMarketInput, "tax_mode">>,
  True<Equal<Store["default_market_id"], string>>,
  True<Equal<Store["default_sales_channel_id"], string>>,
  False<null extends UpdateStoreParams["default_market_id"] ? true : false>,
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
  True<RequiredField<UpdateMarketParams, "expected_updated_at">>,
  True<RequiredField<DeleteMarketParams, "expected_updated_at">>,
  False<
    null extends DeleteMarketParams["replacement_default_market_id"]
      ? true
      : false
  >,
  False<"key" extends keyof UpdateMarketParams ? true : false>,
  False<"currency" extends keyof UpdateMarketParams ? true : false>,
  False<"rule_ids" extends keyof MarketUsage ? true : false>,
];
