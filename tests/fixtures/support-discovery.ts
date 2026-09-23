import { createAdmin, type FindSupportConversationsParams, type SupportConversation } from "../../dist/index.js";

const filters: FindSupportConversationsParams = {
  store_id: "store", statuses: ["active", "ai_mode", "escalated"],
  agent_id: "agent", channel_id: "channel", channel_type: "web",
  customer_id: "customer", assigned_account_id: "account", query: "web",
  sort_field: "updated_at", sort_direction: "desc", limit: 1, cursor: "next",
};
const page: Promise<{ items: SupportConversation[]; cursor: string | null }> =
  createAdmin({ baseUrl: "https://support.test", storeId: "store", market: "market-contract" }).support.findConversations(filters);
// @ts-expect-error The inbox takes plain status alternatives, not lifecycle objects.
const objectStatus: FindSupportConversationsParams = { store_id: "store", statuses: [{ type: "active" }] };
// @ts-expect-error The singular status filter was replaced by native alternatives.
const singularStatus: FindSupportConversationsParams = { store_id: "store", status: "active" };
// @ts-expect-error Search does not order by correspondence or private execution state.
const privateOrder: FindSupportConversationsParams = { store_id: "store", sort_field: "variables" };
void [page, objectStatus, singularStatus, privateOrder];
