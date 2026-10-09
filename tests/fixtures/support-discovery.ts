import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  FindSupportChannelsParams,
  FindSupportConversationsParams,
  PaginatedResponse,
  ReplySupportConversationParams,
  StartSupportConversationParams,
  StorefrontGetSupportConversationParams,
  StorefrontSupportConversationStartResponse,
  StorefrontSupportMessageType,
  SupportConversation,
  SupportConversationStatus,
  SupportMessageInput,
  SupportMessageType,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type AdminSupport = ReturnType<typeof createAdmin>["support"];
type StorefrontSupport = ReturnType<typeof createStorefront>["support"];

const filters: FindSupportConversationsParams = {
  store_id: "7d4b2e90-5c16-4a83-bf07-3e9a1c6d8f25",
  statuses: ["flow", "ai", "escalated"],
  channel_id: "channel",
  channel_type: "chat",
  customer_id: "customer",
  assigned_account_id: "account",
  query: "refund",
  sort_field: "updated_at",
  sort_direction: "desc",
  limit: 1,
  cursor: "next",
};
const channels: FindSupportChannelsParams = { store_id: filters.store_id, status: "active", type: "email" };

export type SupportContracts = [
  Assert<Equal<keyof AdminSupport, "flow" | "channel" | "conversation">>,
  Assert<Equal<Parameters<AdminSupport["conversation"]["find"]>[0], FindSupportConversationsParams>>,
  Assert<Equal<Awaited<ReturnType<AdminSupport["conversation"]["find"]>>, PaginatedResponse<SupportConversation>>>,
  Assert<Equal<NonNullable<FindSupportConversationsParams["statuses"]>[number], SupportConversationStatus["type"]>>,
  Assert<Equal<SupportConversationStatus["type"], "flow" | "ai" | "escalated" | "resolved">>,
  Assert<Missing<FindSupportConversationsParams, "status" | "agent_id">>,
  Assert<Equal<NonNullable<FindSupportConversationsParams["sort_field"]>, "created_at" | "updated_at">>,
  Assert<Equal<NonNullable<FindSupportConversationsParams["channel_type"]>, "chat" | "email">>,
  Assert<RequiredField<ReplySupportConversationParams, "message_id">>,
  Assert<RequiredField<ReplySupportConversationParams, "expected_updated_at">>,
  Assert<RequiredField<StartSupportConversationParams, "id">>,
  Assert<RequiredField<StartSupportConversationParams, "language">>,
  Assert<RequiredField<StorefrontGetSupportConversationParams, "support_token">>,
  Assert<Equal<Awaited<ReturnType<StorefrontSupport["startConversation"]>>, StorefrontSupportConversationStartResponse>>,
  Assert<Equal<StorefrontSupportConversationStartResponse["support_token"], string>>,
  Assert<Equal<SupportMessageInput, { type: "button"; label: string } | { type: "text"; text: string }>>,
  Assert<Equal<StorefrontSupportMessageType["type"], "customer_chat" | "flow" | "flow_question" | "ai" | "account_chat">>,
  Assert<Missing<Extract<StorefrontSupportMessageType, { type: "account_chat" }>, "actor">>,
  Assert<Equal<Extract<SupportMessageType, { type: "account_chat" }>["actor"], Extract<SupportMessageType, { type: "account_email" }>["actor"]>>,
];

void [filters, channels];
