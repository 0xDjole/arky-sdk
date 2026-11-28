import { QueryClient, useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type {
  AccountMe,
  AdminRequestOptions,
  CartQuote,
  User,
  UserMe,
  UserSearchSnapshot,
  PaginatedResponse,
  RequestOptions,
  Tenant,
  StorefrontOrder,
  StorefrontSetup,
} from "arky-sdk";
import type { AdminClient } from "arky-sdk/admin";
import type { NetworkUserClient, StorefrontClient } from "arky-sdk/storefront";
import { ARKY_METHOD_TYPES, ARKY_METHODS_WITHOUT_PARAMS, createArkyReact } from "arky-sdk/react";
import type { ArkyHooks, ArkyKeyRequest, ArkyMethodType, ArkyParams, ArkyProviderProps } from "arky-sdk/react";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Variables<F extends (...args: never[]) => unknown> = Parameters<F>[0];
type MethodPaths<Group, Prefix extends string = ""> = {
  [Name in keyof Group & string]: Group[Name] extends (...args: never[]) => unknown
    ? `${Prefix}${Name}`
    : [Group[Name]] extends [object]
      ? MethodPaths<Group[Name], `${Prefix}${Name}.`>
      : never;
}[keyof Group & string];
type PathsWithoutParams<Group, Prefix extends string = ""> = {
  [Name in keyof Group & string]: Group[Name] extends (...args: never[]) => unknown
    ? [ArkyParams<Group[Name]>] extends [undefined]
      ? `${Prefix}${Name}`
      : never
    : [Group[Name]] extends [object]
      ? PathsWithoutParams<Group[Name], `${Prefix}${Name}.`>
      : never;
}[keyof Group & string];
type ListedWithoutParams = (typeof ARKY_METHODS_WITHOUT_PARAMS)[number];
type QueryRequest<F extends (...args: never[]) => unknown> = NonNullable<Parameters<F>[1]>["request"];
type MutationRequest<F extends (...args: never[]) => unknown> = NonNullable<Parameters<F>[0]>["request"];

export const adminHooks = createArkyReact<AdminClient>();
export const storefrontHooks = createArkyReact<StorefrontClient>();

declare const arky: ArkyHooks<AdminClient>;
declare const shop: ArkyHooks<StorefrontClient>;
const tenant_id = "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19";
const id = "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58";
const order_token = `arky_ot_${"F".repeat(42)}A`;

export function useHookContracts() {
  const users = useQuery(arky.users.find.query({ tenant_id }));
  const count = useQuery(arky.users.find.query({ tenant_id }, { select: (page) => page.items.length, staleTime: 1_000 }));
  const user = useSuspenseQuery(arky.users.get.query({ tenant_id, id }));
  const me = useQuery(arky.account.getMe.query());
  const tenants = useQuery(arky.tenant.find.query());
  const quote = useQuery(arky.eshop.cart.quote.query({ tenant_id, id, language: "en" }));
  const setup = useQuery(shop.getSetup.query());
  const shopper = useQuery(shop.user.getMe.query());
  const order = useQuery(shop.eshop.order.get.query({ id }, { request: { order_token } }));
  const countries = useQuery(shop.tenant.country.find.query(undefined, { request: { locale: "bs" } }));
  const save = useMutation(arky.users.update.mutation({
    invalidates: [arky.eshop.order.key(), arky.users.get.key({ tenant_id, id })],
    onSuccess: (data, variables) => [data.id, variables.tenant_id],
    request: { headers: { "x-request-label": "save" } },
  }));
  const resume = useMutation(shop.eshop.order.resumePayment.mutation({ request: { order_token } }));
  const logout = useMutation(arky.logout.mutation());
  const identify = useMutation(shop.user.identify.mutation());
  logout.mutate();
  identify.mutate();
  const queryClient = new QueryClient();
  queryClient.setQueryData(arky.users.get.key({ tenant_id, id }), (old) => old);
  const cached = queryClient.getQueryData(arky.users.get.key({ tenant_id, id }));
  const orderKey = shop.eshop.order.get.key({ id }, { order_token });
  return { users, count, user, me, tenants, quote, setup, shopper, order, countries, save, resume, logout, identify, cached, orderKey };
}

type Used = ReturnType<typeof useHookContracts>;

export type ReactHookContracts = [
  Assert<Equal<keyof typeof adminHooks, "ArkyProvider" | "useArky">>,
  Assert<Equal<Parameters<typeof adminHooks.ArkyProvider>[0], ArkyProviderProps<AdminClient>>>,
  Assert<Equal<ReturnType<typeof adminHooks.useArky>, ArkyHooks<AdminClient>>>,
  Assert<Equal<ReturnType<typeof storefrontHooks.useArky>, ArkyHooks<StorefrontClient>>>,
  Assert<Equal<ArkyProviderProps<AdminClient>["queryClient"], QueryClient>>,
  Assert<Equal<(typeof ARKY_METHOD_TYPES)[keyof typeof ARKY_METHOD_TYPES], ArkyMethodType>>,
  Assert<Equal<ArkyMethodType, "read" | "write">>,
  Assert<Equal<PathsWithoutParams<AdminClient>, Extract<ListedWithoutParams, MethodPaths<AdminClient>>>>,
  Assert<Equal<PathsWithoutParams<StorefrontClient>, Extract<ListedWithoutParams, MethodPaths<StorefrontClient>>>>,
  Assert<Equal<PathsWithoutParams<NetworkUserClient>, Extract<ListedWithoutParams, MethodPaths<NetworkUserClient>>>>,
  Assert<Equal<PathsWithoutParams<NetworkUserClient>, "refresh" | "logout" | "getMe" | "deleteAccount">>,
  Assert<Equal<ListedWithoutParams, PathsWithoutParams<AdminClient> | PathsWithoutParams<StorefrontClient> | PathsWithoutParams<NetworkUserClient>>>,
  Assert<Equal<Used["users"]["data"], PaginatedResponse<UserSearchSnapshot> | undefined>>,
  Assert<Equal<Used["count"]["data"], number | undefined>>,
  Assert<Equal<Used["user"]["data"], User>>,
  Assert<Equal<Used["me"]["data"], AccountMe | undefined>>,
  Assert<Equal<Used["tenants"]["data"], PaginatedResponse<Tenant> | undefined>>,
  Assert<Equal<Used["quote"]["data"], CartQuote | undefined>>,
  Assert<Equal<Used["setup"]["data"], StorefrontSetup | undefined>>,
  Assert<Equal<Used["shopper"]["data"], UserMe | null | undefined>>,
  Assert<Equal<Used["order"]["data"], StorefrontOrder | undefined>>,
  Assert<Equal<Used["cached"], User | undefined>>,
  Assert<Equal<Variables<Used["save"]["mutate"]>, Parameters<AdminClient["users"]["update"]>[0]>>,
  Assert<Equal<Awaited<ReturnType<Used["save"]["mutateAsync"]>>, User>>,
  Assert<Equal<NonNullable<QueryRequest<typeof shop.eshop.order.get.query>>, Omit<RequestOptions, "signal">>>,
  Assert<Missing<NonNullable<QueryRequest<typeof shop.eshop.order.get.query>>, "signal">>,
  Assert<Equal<NonNullable<QueryRequest<typeof arky.account.getMe.query>>, Omit<AdminRequestOptions, "signal">>>,
  Assert<Equal<NonNullable<QueryRequest<typeof arky.users.find.query>>, Omit<AdminRequestOptions, "signal">>>,
  Assert<Missing<NonNullable<QueryRequest<typeof arky.users.find.query>>, "locale" | "market" | "order_token">>,
  Assert<Missing<NonNullable<MutationRequest<typeof arky.users.update.mutation>>, "locale" | "market" | "order_token">>,
  Assert<Equal<NonNullable<QueryRequest<typeof shop.tenant.country.find.query>>, Omit<RequestOptions, "signal">>>,
  Assert<Equal<Extract<ReturnType<typeof arky.users.get.key>, { length: 5 }>, never>>,
  Assert<Equal<QueryRequest<typeof shop.forms.pendingSubmission.query>, undefined>>,
  Assert<Equal<NonNullable<MutationRequest<typeof arky.users.update.mutation>>, AdminRequestOptions>>,
  Assert<Equal<NonNullable<MutationRequest<typeof arky.account.delete.mutation>>, AdminRequestOptions>>,
  Assert<Equal<NonNullable<MutationRequest<typeof shop.eshop.order.resumePayment.mutation>>, RequestOptions>>,
  Assert<Equal<MutationRequest<typeof arky.logout.mutation>, undefined>>,
  Assert<Equal<MutationRequest<typeof shop.user.identify.mutation>, undefined>>,
  Assert<Equal<Extract<Used["orderKey"], { length: 6 }>[5], ArkyKeyRequest>>,
  Assert<Equal<Used["orderKey"][4], Parameters<StorefrontClient["eshop"]["order"]["get"]>[0]>>,
  Assert<Equal<ArkyKeyRequest, { order_token?: string; locale?: string; market?: string }>>,
  Assert<Equal<ReturnType<typeof arky.key>, readonly ["arky"]>>,
  Assert<Equal<ReturnType<typeof arky.users.key>, readonly ["arky", "users"]>>,
  Assert<Equal<ReturnType<typeof arky.eshop.order.notes.key>, readonly ["arky", "eshop", "order", "notes"]>>,
  Assert<Equal<ReturnType<typeof arky.users.find.query>["queryKey"][3], Parameters<AdminClient["users"]["find"]>[0]>>,
  Assert<Equal<Parameters<typeof arky.account.getMe.query>[0], undefined>>,
  Assert<Equal<Parameters<typeof arky.tenant.find.query>[0], Parameters<AdminClient["tenant"]["find"]>[0]>>,
  Assert<Missing<typeof arky, "session" | "isAuthenticated" | "sessionStorageUnavailable">>,
  Assert<Missing<typeof shop, "session" | "hasSession" | "isAuthenticated" | "sessionStorageUnavailable">>,
  Assert<Missing<typeof arky.users.find, "mutation">>,
  Assert<Missing<typeof arky.users.update, "query" | "key">>,
  Assert<Missing<typeof arky.eshop.cart.quote, "mutation">>,
  Assert<Missing<typeof arky.eshop.packageMember.reviewSwitch, "mutation">>,
  Assert<Missing<typeof arky.companies.reviewTaxRegistration, "query" | "key">>,
  Assert<Missing<typeof arky.tenant.provider.checkStripeSetup, "mutation">>,
  Assert<Missing<typeof shop.eshop.order.fromLink, "mutation">>,
  Assert<Missing<typeof shop.user.verify, "query" | "key">>,
];
