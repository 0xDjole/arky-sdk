import { createAdmin } from "arky-sdk/admin";
import type {
  SubscriptionSelf, FindSubscriptionsParams,
  FindCustomerGroupEmailConsentsParams
} from "arky-sdk/types";

const store_id = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
const admin = createAdmin({ market: "configured", baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
const subscriptions: FindSubscriptionsParams = {
  store_id, customer_id: "customer", company_id: "company",
  order_id: "order", status: "paused", limit: 20, cursor: "opaque"
};
const consents: FindCustomerGroupEmailConsentsParams = {
  store_id, customer_group_id: "group", customer_id: "customer", email_identity_id: "identity",
  status: "unsubscribed", limit: 20, cursor: "opaque"
};
void admin.eshop.subscription.find(subscriptions);
void admin.eshop.customerGroupEmailConsent.find(consents);
const current: Promise<SubscriptionSelf> = admin.eshop.subscription.current({ store_id, id: "subscription" });
const confirmed: Promise<boolean> = admin.eshop.customerGroupEmailConsent.confirm({ store_id, token: "capability" });
const ended: Promise<boolean> = admin.eshop.customerGroupEmailConsent.unsubscribe({ store_id, token: "capability" });
type HasBlock = Extract<SubscriptionSelf["status"], { type: "blocked" }> extends { block: unknown } ? true : false;
type HasActor = Extract<SubscriptionSelf["status"], { type: "paused" }> extends { actor: unknown } ? true : false;
const privateBlockExcluded: HasBlock = false;
const privateActorExcluded: HasActor = false;
void [current, confirmed, ended, privateBlockExcluded, privateActorExcluded];
