import { QueryClientProvider } from "@tanstack/react-query";
import type {
  DataTag,
  DefaultError,
  QueryClient,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import { createContext, createElement, useContext, useMemo } from "react";
import type { ReactElement, ReactNode } from "react";
import type { AdminRequestOptions, RequestOptions } from "../types/httpClient";
import { ARKY_METHOD_TYPES, ARKY_METHODS_WITHOUT_PARAMS } from "./methodTypes";
import type { ArkyMethodType } from "./methodTypes";

export { ARKY_METHOD_TYPES, ARKY_METHODS_WITHOUT_PARAMS } from "./methodTypes";
export type { ArkyMethodType } from "./methodTypes";

type ArkyMethod = (...args: never[]) => unknown;

type JoinPath<Path extends readonly string[]> = Path extends readonly [infer Only extends string]
  ? Only
  : Path extends readonly [infer Head extends string, ...infer Rest extends readonly string[]]
    ? `${Head}.${JoinPath<Rest>}`
    : never;

type DeclaredMethodTypes = typeof ARKY_METHOD_TYPES;

export type ArkyMethodTypeOf<Path extends readonly string[], Name extends string> =
  JoinPath<[...Path, Name]> extends keyof DeclaredMethodTypes
    ? DeclaredMethodTypes[JoinPath<[...Path, Name]>]
    : Name extends `get${string}` | `find${string}`
      ? "read"
      : "write";

type SameType<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type IsRequestOptions<Value> = SameType<Value, RequestOptions | undefined> extends true
  ? true
  : SameType<Value, AdminRequestOptions | undefined>;

export type ArkyParams<Method> = Method extends (...args: infer Args) => unknown
  ? Args extends readonly []
    ? undefined
    : IsRequestOptions<Args[0]> extends true
      ? undefined
      : Args[0]
  : never;

export type ArkyRequest<Method> = Method extends (...args: infer Args) => unknown
  ? Args extends readonly []
    ? never
    : IsRequestOptions<Args[0]> extends true
      ? Exclude<Args[0], undefined>
      : "1" extends keyof Args
        ? Exclude<Args[1], undefined>
        : never
  : never;

export type ArkyReadRequest<Method> = [ArkyRequest<Method>] extends [never] ? never : Omit<ArkyRequest<Method>, "signal">;

export type ArkyData<Method> = Method extends (...args: never[]) => infer Answer ? Awaited<Answer> : never;

type ArkyVariables<Params> = [Params] extends [undefined] ? void : undefined extends Params ? Params | void : Params;

type ArkyRequestInput<Request> = [Request] extends [never] ? { request?: never } : { request?: Request };

export interface ArkyKeyRequest {
  order_token?: string;
  locale?: string;
  market?: string;
}

export type ArkyGroupKey<Path extends readonly string[]> = readonly ["arky", ...Path];

export type ArkyMethodKey<Path extends readonly string[], Name extends string, Params> = readonly [
  "arky",
  ...Path,
  Name,
  Params,
];

export type ArkyMethodRequestKey<Path extends readonly string[], Name extends string, Params> = readonly [
  "arky",
  ...Path,
  Name,
  Params,
  ArkyKeyRequest,
];

type ArkyReadKey<Method, Path extends readonly string[], Name extends string> = [ArkyRequest<Method>] extends [never]
  ? ArkyMethodKey<Path, Name, ArkyParams<Method>>
  : [Extract<keyof ArkyRequest<Method>, keyof ArkyKeyRequest>] extends [never]
    ? ArkyMethodKey<Path, Name, ArkyParams<Method>>
    : ArkyMethodKey<Path, Name, ArkyParams<Method>> | ArkyMethodRequestKey<Path, Name, ArkyParams<Method>>;

export type ArkyQueryInput<Data, Selected, Key extends QueryKey> = Omit<
  UseQueryOptions<Data, DefaultError, Selected, Key>,
  "queryKey" | "queryFn"
>;

export type ArkyQueryOptions<Data, Selected, Key extends QueryKey> = ArkyQueryInput<Data, Selected, Key> & {
  queryKey: DataTag<Key, Data, DefaultError>;
  queryFn: QueryFunction<Data, Key>;
};

export interface ArkyRead<Params, Data, Key extends QueryKey, Request = never> {
  query<Selected = Data>(
    params: Params,
    options?: ArkyQueryInput<Data, Selected, Key> & ArkyRequestInput<Request>,
  ): ArkyQueryOptions<Data, Selected, Key>;
  key(params: Params, request?: Request): DataTag<Key, Data, DefaultError>;
}

export interface ArkyOptionalRead<Params, Data, Key extends QueryKey, Request = never> {
  query<Selected = Data>(
    params?: Params,
    options?: ArkyQueryInput<Data, Selected, Key> & ArkyRequestInput<Request>,
  ): ArkyQueryOptions<Data, Selected, Key>;
  key(params?: Params, request?: Request): DataTag<Key, Data, DefaultError>;
}

export type ArkyMutationInput<Data, Variables, OnMutateResult> = Omit<
  UseMutationOptions<Data, DefaultError, Variables, OnMutateResult>,
  "mutationFn"
> & {
  invalidates?: readonly QueryKey[];
};

export interface ArkyWrite<Data, Variables, Request = never> {
  mutation<OnMutateResult = unknown>(
    options?: ArkyMutationInput<Data, Variables, OnMutateResult> & ArkyRequestInput<Request>,
  ): UseMutationOptions<Data, DefaultError, Variables, OnMutateResult>;
}

type ArkyReadOf<Method, Path extends readonly string[], Name extends string> = undefined extends ArkyParams<Method>
  ? ArkyOptionalRead<Exclude<ArkyParams<Method>, undefined>, ArkyData<Method>, ArkyReadKey<Method, Path, Name>, ArkyReadRequest<Method>>
  : ArkyRead<ArkyParams<Method>, ArkyData<Method>, ArkyReadKey<Method, Path, Name>, ArkyReadRequest<Method>>;

export type ArkyMethodHooks<Method, Path extends readonly string[], Name extends string> =
  ArkyMethodTypeOf<Path, Name> extends "read"
    ? ArkyReadOf<Method, Path, Name>
    : ArkyWrite<ArkyData<Method>, ArkyVariables<ArkyParams<Method>>, ArkyRequest<Method>>;

type ArkyMemberName<Value, Name> = Name extends string
  ? [Value] extends [ArkyMethod]
    ? Name
    : [Value] extends [object]
      ? Name
      : never
  : never;

export type ArkyHooks<Client, Path extends readonly string[] = []> = {
  readonly [Name in keyof Client as ArkyMemberName<Client[Name], Name>]: Client[Name] extends ArkyMethod
    ? ArkyMethodHooks<Client[Name], Path, Name & string>
    : ArkyHooks<Client[Name], [...Path, Name & string]>;
} & {
  key(): ArkyGroupKey<Path>;
};

export interface ArkyProviderProps<Client> {
  client: Client;
  queryClient: QueryClient;
  children?: ReactNode;
}

export interface ArkyReact<Client> {
  ArkyProvider: (props: ArkyProviderProps<Client>) => ReactElement;
  useArky: () => ArkyHooks<Client>;
}

type Callable = (...args: unknown[]) => unknown;

type Send = (params: unknown, request: RequestOptions | undefined) => unknown;

type Hooks = Record<string, unknown>;

interface QueryInput {
  request?: RequestOptions;
}

interface MutationInput {
  invalidates?: readonly QueryKey[];
  onSuccess?: Callable;
  request?: RequestOptions;
}

const declaredMethodTypes: Readonly<Partial<Record<string, ArkyMethodType>>> = ARKY_METHOD_TYPES;

const methodsWithoutParams: ReadonlySet<string> = new Set<string>(ARKY_METHODS_WITHOUT_PARAMS);

function isCallable(value: unknown): value is Callable {
  return typeof value === "function";
}

function methodType(dotted: string, name: string): ArkyMethodType {
  const declared = Object.prototype.hasOwnProperty.call(declaredMethodTypes, dotted) ? declaredMethodTypes[dotted] : undefined;
  return declared ?? (name.startsWith("get") || name.startsWith("find") ? "read" : "write");
}

function keyRequest(request: RequestOptions | undefined): ArkyKeyRequest | null {
  const keyed: ArkyKeyRequest = {};
  if (typeof request?.order_token === "string") keyed.order_token = request.order_token;
  if (request?.locale !== undefined) keyed.locale = request.locale;
  if (request?.market !== undefined) keyed.market = request.market;
  return Object.keys(keyed).length > 0 ? keyed : null;
}

function readHooks(send: Send, path: readonly string[], name: string): Hooks {
  const key = (params?: unknown, request?: RequestOptions): QueryKey => {
    const keyed = keyRequest(request);
    return keyed ? ["arky", ...path, name, params, keyed] : ["arky", ...path, name, params];
  };
  return {
    key,
    query: (params?: unknown, options: QueryInput = {}) => {
      const { request, ...rest } = options;
      return {
        ...rest,
        queryKey: key(params, request),
        queryFn: (context: { signal: AbortSignal }) => send(params, { ...request, signal: context.signal }),
      };
    },
  };
}

function writeHooks(send: Send, path: readonly string[], name: string, queryClient: QueryClient): Hooks {
  return {
    mutation: (options: MutationInput = {}) => {
      const { invalidates = [], onSuccess, request, ...rest } = options;
      return {
        mutationKey: ["arky", ...path, name],
        ...rest,
        mutationFn: async (variables: unknown) => send(variables, request),
        onSuccess: async (...args: unknown[]) => {
          await Promise.all(
            [["arky", ...path], ...invalidates].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
          );
          return onSuccess?.(...args);
        },
      };
    },
  };
}

function methodHooks(group: object, method: Callable, path: readonly string[], name: string, queryClient: QueryClient): Hooks {
  const dotted = [...path, name].join(".");
  const send: Send = methodsWithoutParams.has(dotted)
    ? (_params, request) => method.call(group, request)
    : (params, request) => method.call(group, params, request);
  return methodType(dotted, name) === "read" ? readHooks(send, path, name) : writeHooks(send, path, name, queryClient);
}

function hookName(path: readonly string[], name: string): string {
  if (name === "key") throw new TypeError(`${[...path, name].join(".")} can't get hooks: key() names its group`);
  return name;
}

function mirror(group: object, path: readonly string[], queryClient: QueryClient): Hooks {
  const hooks: Hooks = { key: (): QueryKey => ["arky", ...path] };
  for (const [name, property] of Object.entries(Object.getOwnPropertyDescriptors(group))) {
    if (!("value" in property)) continue;
    const value: unknown = property.value;
    if (isCallable(value)) {
      hooks[hookName(path, name)] = methodHooks(group, value, path, name, queryClient);
    } else if (typeof value === "object" && value !== null) {
      hooks[hookName(path, name)] = mirror(value, [...path, name], queryClient);
    }
  }
  return hooks;
}

export function createArkyReact<Client extends object>(): ArkyReact<Client> {
  const ArkyContext = createContext<ArkyHooks<Client> | null>(null);

  function ArkyProvider({ client, queryClient, children }: ArkyProviderProps<Client>): ReactElement {
    const hooks = useMemo(() => mirror(client, [], queryClient) as unknown as ArkyHooks<Client>, [client, queryClient]);
    return createElement(QueryClientProvider, { client: queryClient }, createElement(ArkyContext, { value: hooks }, children));
  }

  function useArky(): ArkyHooks<Client> {
    const hooks = useContext(ArkyContext);
    if (!hooks) throw new TypeError("useArky() needs an ArkyProvider above it");
    return hooks;
  }

  return { ArkyProvider, useArky };
}
