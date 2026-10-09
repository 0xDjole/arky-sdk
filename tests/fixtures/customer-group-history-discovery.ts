import { createAdmin } from "arky-sdk/admin";
import type { SubscriptionSelf, SubscriptionCurrent, FindSubscriptionsParams } from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

const store_id = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
const admin = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
const subscriptions: FindSubscriptionsParams = {
  store_id, customer_id: "customer", company_id: "company",
  order_id: "order", status: "paused", limit: 20, cursor: "opaque",
};
void admin.eshop.subscription.find(subscriptions);
const current: Promise<SubscriptionCurrent> = admin.eshop.subscription.current({ store_id, id: "subscription" });
void current;

export type SubscriptionHistoryContracts = [
  Assert<Equal<SubscriptionCurrent["subscription"], SubscriptionSelf>>,
  Assert<Missing<Extract<SubscriptionSelf["status"], { type: "paused" }>, "cause">>,
  Assert<Missing<Extract<SubscriptionSelf["status"], { type: "blocked" }>, "block">>,
  Assert<Missing<ReturnType<typeof createAdmin>["eshop"], "customerGroupEmailConsent">>,
];
