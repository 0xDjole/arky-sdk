import { createAdmin } from "arky-sdk/admin";
import type {
  SubscriptionSelf, FindSubscriptionsParams,
  FindCustomerGroupEmailConsentsParams
} from "arky-sdk/types";

const admin = createAdmin({ storeId: "store", market: "configured", baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
const subscriptions: FindSubscriptionsParams = {
  customer_id: "customer", company_id: "company",
  order_id: "order", status: "paused", limit: 20, cursor: "opaque"
};
const consents: FindCustomerGroupEmailConsentsParams = {
  customer_group_id: "group", customer_id: "customer", email_identity_id: "identity",
  status: "unsubscribed", limit: 20, cursor: "opaque"
};
void admin.eshop.subscription.find(subscriptions);
void admin.eshop.customerGroupEmailConsent.find(consents);
const current: Promise<SubscriptionSelf> = admin.eshop.subscription.current({ id: "subscription" });
const confirmed: Promise<boolean> = admin.eshop.customerGroupEmailConsent.confirm({ token: "capability" });
const ended: Promise<boolean> = admin.eshop.customerGroupEmailConsent.unsubscribe({ token: "capability" });
type HasBlock = Extract<SubscriptionSelf["status"], { type: "blocked" }> extends { block: unknown } ? true : false;
type HasActor = Extract<SubscriptionSelf["status"], { type: "paused" }> extends { actor: unknown } ? true : false;
const privateBlockExcluded: HasBlock = false;
const privateActorExcluded: HasActor = false;
void [current, confirmed, ended, privateBlockExcluded, privateActorExcluded];
