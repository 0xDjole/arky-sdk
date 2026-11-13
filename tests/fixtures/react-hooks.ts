import { QueryClient, useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type {
  Account,
  AdminRequestOptions,
  CartQuote,
  Customer,
  CustomerMe,
  CustomerSearchSnapshot,
  PaginatedResponse,
  RequestOptions,
  Store,
  StorefrontOrder,
  StorefrontSetup,
} from "arky-sdk";
import type { AdminClient } from "arky-sdk/admin";
import type { StorefrontClient } from "arky-sdk/storefront";
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
const store_id = "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19";
const id = "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58";
const order_token = `arky_ot_${"F".repeat(42)}A`;

export function useHookContracts() {
  const customers = useQuery(arky.customers.find.query({ store_id }));
  const count = useQuery(arky.customers.find.query({ store_id }, { select: (page) => page.items.length, staleTime: 1_000 }));
  const customer = useSuspenseQuery(arky.customers.get.query({ store_id, id }));
  const me = useQuery(arky.account.getMe.query());
  const stores = useQuery(arky.store.find.query());
  const quote = useQuery(arky.eshop.cart.quote.query({ store_id, id, language: "en" }));
  const setup = useQuery(shop.getSetup.query());
  const shopper = useQuery(shop.customer.getMe.query());
  const order = useQuery(shop.eshop.order.get.query({ id }, { request: { order_token } }));
  const countries = useQuery(shop.store.country.find.query(undefined, { request: { locale: "bs" } }));
  const save = useMutation(arky.customers.update.mutation({
    invalidates: [arky.eshop.order.key(), arky.customers.get.key({ store_id, id })],
    onSuccess: (data, variables) => [data.id, variables.store_id],
    request: { headers: { "x-request-label": "save" } },
  }));
  const resume = useMutation(shop.eshop.order.resumePayment.mutation({ request: { order_token } }));
  const logout = useMutation(arky.logout.mutation());
  const identify = useMutation(shop.customer.identify.mutation());
  logout.mutate();
  identify.mutate();
  const queryClient = new QueryClient();
  queryClient.setQueryData(arky.customers.get.key({ store_id, id }), (old) => old);
  const cached = queryClient.getQueryData(arky.customers.get.key({ store_id, id }));
  const orderKey = shop.eshop.order.get.key({ id }, { order_token });
  return { customers, count, customer, me, stores, quote, setup, shopper, order, countries, save, resume, logout, identify, cached, orderKey };
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
  Assert<Equal<ListedWithoutParams, PathsWithoutParams<AdminClient> | PathsWithoutParams<StorefrontClient>>>,
  Assert<Equal<Used["customers"]["data"], PaginatedResponse<CustomerSearchSnapshot> | undefined>>,
  Assert<Equal<Used["count"]["data"], number | undefined>>,
  Assert<Equal<Used["customer"]["data"], Customer>>,
  Assert<Equal<Used["me"]["data"], Account | undefined>>,
  Assert<Equal<Used["stores"]["data"], PaginatedResponse<Store> | undefined>>,
  Assert<Equal<Used["quote"]["data"], CartQuote | undefined>>,
  Assert<Equal<Used["setup"]["data"], StorefrontSetup | undefined>>,
  Assert<Equal<Used["shopper"]["data"], CustomerMe | null | undefined>>,
  Assert<Equal<Used["order"]["data"], StorefrontOrder | undefined>>,
  Assert<Equal<Used["cached"], Customer | undefined>>,
  Assert<Equal<Variables<Used["save"]["mutate"]>, Parameters<AdminClient["customers"]["update"]>[0]>>,
  Assert<Equal<Awaited<ReturnType<Used["save"]["mutateAsync"]>>, Customer>>,
  Assert<Equal<NonNullable<QueryRequest<typeof shop.eshop.order.get.query>>, Omit<RequestOptions, "signal">>>,
  Assert<Missing<NonNullable<QueryRequest<typeof shop.eshop.order.get.query>>, "signal">>,
  Assert<Equal<NonNullable<QueryRequest<typeof arky.account.getMe.query>>, Omit<AdminRequestOptions, "signal">>>,
  Assert<Equal<NonNullable<QueryRequest<typeof arky.customers.find.query>>, Omit<AdminRequestOptions, "signal">>>,
  Assert<Missing<NonNullable<QueryRequest<typeof arky.customers.find.query>>, "locale" | "market" | "order_token">>,
  Assert<Missing<NonNullable<MutationRequest<typeof arky.customers.update.mutation>>, "locale" | "market" | "order_token">>,
  Assert<Equal<NonNullable<QueryRequest<typeof shop.store.country.find.query>>, Omit<RequestOptions, "signal">>>,
  Assert<Equal<Extract<ReturnType<typeof arky.customers.get.key>, { length: 5 }>, never>>,
  Assert<Equal<QueryRequest<typeof shop.forms.pendingSubmission.query>, undefined>>,
  Assert<Equal<NonNullable<MutationRequest<typeof arky.customers.update.mutation>>, AdminRequestOptions>>,
  Assert<Equal<NonNullable<MutationRequest<typeof arky.account.delete.mutation>>, AdminRequestOptions>>,
  Assert<Equal<NonNullable<MutationRequest<typeof shop.eshop.order.resumePayment.mutation>>, RequestOptions>>,
  Assert<Equal<MutationRequest<typeof arky.logout.mutation>, undefined>>,
  Assert<Equal<MutationRequest<typeof shop.customer.identify.mutation>, undefined>>,
  Assert<Equal<Extract<Used["orderKey"], { length: 6 }>[5], ArkyKeyRequest>>,
  Assert<Equal<Used["orderKey"][4], Parameters<StorefrontClient["eshop"]["order"]["get"]>[0]>>,
  Assert<Equal<ArkyKeyRequest, { order_token?: string; locale?: string; market?: string }>>,
  Assert<Equal<ReturnType<typeof arky.key>, readonly ["arky"]>>,
  Assert<Equal<ReturnType<typeof arky.customers.key>, readonly ["arky", "customers"]>>,
  Assert<Equal<ReturnType<typeof arky.eshop.order.notes.key>, readonly ["arky", "eshop", "order", "notes"]>>,
  Assert<Equal<ReturnType<typeof arky.customers.find.query>["queryKey"][3], Parameters<AdminClient["customers"]["find"]>[0]>>,
  Assert<Equal<Parameters<typeof arky.account.getMe.query>[0], undefined>>,
  Assert<Equal<Parameters<typeof arky.store.find.query>[0], Parameters<AdminClient["store"]["find"]>[0]>>,
  Assert<Missing<typeof arky, "session" | "isAuthenticated" | "sessionStorageUnavailable">>,
  Assert<Missing<typeof shop, "session" | "hasSession" | "isAuthenticated" | "sessionStorageUnavailable">>,
  Assert<Missing<typeof arky.customers.find, "mutation">>,
  Assert<Missing<typeof arky.customers.update, "query" | "key">>,
  Assert<Missing<typeof arky.eshop.cart.quote, "mutation">>,
  Assert<Missing<typeof arky.eshop.packageMember.reviewSwitch, "mutation">>,
  Assert<Missing<typeof arky.companies.reviewTaxRegistration, "query" | "key">>,
  Assert<Missing<typeof arky.store.provider.checkStripeSetup, "mutation">>,
  Assert<Missing<typeof shop.eshop.order.fromLink, "mutation">>,
  Assert<Missing<typeof shop.customer.verify, "query" | "key">>,
];
