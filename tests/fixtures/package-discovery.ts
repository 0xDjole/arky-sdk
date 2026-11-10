import { createAdmin } from "arky-sdk/admin";
import type {
  AssignPackageMemberParams,
  CommerceParty,
  DeletedResponse,
  Package,
  PackageDetail,
  PackageMember,
  PackageOffering,
  PackageStatus,
  FindPackageMembersParams,
  FindPackageOfferingsParams,
  FindPackagesParams,
  GetPackageByKeyParams,
} from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

const store_id = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
const admin = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
const packages: FindPackagesParams = { store_id, package_offering_id: "offering", status: { type: "active" }, query: "members", limit: 20, cursor: "opaque" };
const offerings: FindPackageOfferingsParams = { store_id, key: "club", sort_field: "updated_at", limit: 20 };
const members: FindPackageMembersParams = { store_id, package_id: "package", company_location_id: "location", status: "active", limit: 20 };
const key: GetPackageByKeyParams = { store_id, key: "members" };
void admin.eshop.package.find(packages);
void admin.eshop.packageOffering.find(offerings);
void admin.eshop.packageMember.find(members);
const shopPackage: Promise<PackageDetail> = admin.eshop.package.getByKey(key);
const offering: Promise<PackageOffering> = admin.eshop.packageOffering.getByKey(key);
const assigned: Promise<PackageMember> = admin.eshop.packageMember.assign({
  store_id,
  id: "e245588f-0542-4bb3-97c8-23de326627d1",
  package_id: "package",
  subject: { type: "company", company_id: "company" },
  access_end: { type: "never" },
});
void [shopPackage, offering, assigned];

export type PackageDiscoveryContracts = [
  Assert<Equal<keyof FindPackagesParams, "store_id" | "query" | "key" | "status" | "package_offering_id" | "market_id" | "sort_field" | "sort_direction" | "created_at_from" | "created_at_to" | "limit" | "cursor">>,
  Assert<Equal<FindPackagesParams["cursor"], string | null | undefined>>,
  Assert<Equal<FindPackagesParams["status"], PackageStatus | undefined>>,
  Assert<Equal<keyof FindPackageOfferingsParams, "store_id" | "key" | "sort_field" | "sort_direction" | "limit" | "cursor">>,
  Assert<Equal<keyof FindPackageMembersParams, "store_id" | "customer_id" | "company_id" | "company_location_id" | "package_id" | "package_offering_id" | "status" | "limit" | "cursor">>,
  Assert<Equal<keyof AssignPackageMemberParams, "store_id" | "id" | "package_id" | "subject" | "access_end">>,
  Assert<RequiredField<AssignPackageMemberParams, "id">>,
  Assert<RequiredField<AssignPackageMemberParams, "access_end">>,
  Assert<Equal<AssignPackageMemberParams["subject"], CommerceParty>>,
  Assert<Equal<CommerceParty, { type: "customer"; customer_id: string } | { type: "company"; company_id: string } | { type: "company_location"; company_location_id: string }>>,
  Assert<Equal<Awaited<ReturnType<typeof admin.eshop.package.delete>>, Package>>,
  Assert<Equal<Awaited<ReturnType<typeof admin.eshop.packageOffering.delete>>, DeletedResponse>>,
  Assert<Equal<Awaited<ReturnType<typeof admin.eshop.packageMember.assign>>, PackageMember>>,
];
