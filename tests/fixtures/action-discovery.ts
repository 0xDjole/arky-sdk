import type { createAdmin } from "arky-sdk/admin";
import type { UserAction, FindUserActionsParams, PaginatedResponse } from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Admin = ReturnType<typeof createAdmin>;

export const filters: FindUserActionsParams = { tenant_id: "0f7c2d4e-5a61-4b8c-9d3e-2f1a6b7c8d90", user_id: "user", limit: 1, cursor: null };

export type ActionDiscoveryContracts = [
  Assert<Equal<keyof FindUserActionsParams, "tenant_id" | "user_id" | "limit" | "cursor">>,
  Assert<Equal<Parameters<Admin["actions"]["find"]>[0], FindUserActionsParams>>,
  Assert<Equal<Awaited<ReturnType<Admin["actions"]["find"]>>, PaginatedResponse<UserAction>>>,
];
