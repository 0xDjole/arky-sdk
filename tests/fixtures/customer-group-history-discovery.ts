import { createAdmin } from "arky-sdk/admin";
import type {
  CustomerGroupSubscriptionSelf, FindCustomerGroupSubscriptionsParams,
  FindCustomerGroupEmailConsentsParams
} from "arky-sdk/types";

const admin = createAdmin({ storeId: "store", market: "configured", baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
const subscriptions: FindCustomerGroupSubscriptionsParams = {
  customer_id: "customer", customer_group_member_id: "member",
  order_id: "order", status: "paused", limit: 20, cursor: "opaque"
};
const consents: FindCustomerGroupEmailConsentsParams = {
  customer_group_id: "group", customer_id: "customer", email_identity_id: "identity",
  status: "unsubscribed", limit: 20, cursor: "opaque"
};
void admin.eshop.customerGroupSubscription.find(subscriptions);
void admin.eshop.customerGroupEmailConsent.find(consents);
const current: Promise<CustomerGroupSubscriptionSelf> = admin.eshop.customerGroupSubscription.current({ id: "subscription" });
const confirmed: Promise<boolean> = admin.eshop.customerGroupEmailConsent.confirm({ token: "capability" });
const ended: Promise<boolean> = admin.eshop.customerGroupEmailConsent.unsubscribe({ token: "capability" });
type HasBlock = Extract<CustomerGroupSubscriptionSelf["status"], { type: "blocked" }> extends { block: unknown } ? true : false;
type HasActor = Extract<CustomerGroupSubscriptionSelf["status"], { type: "paused" }> extends { actor: unknown } ? true : false;
const privateBlockExcluded: HasBlock = false;
const privateActorExcluded: HasActor = false;
void [current, confirmed, ended, privateBlockExcluded, privateActorExcluded];
