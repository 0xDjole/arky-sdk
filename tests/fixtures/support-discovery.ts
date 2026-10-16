import { epochMilliseconds } from "arky-sdk";
import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  ChangeConversationChatVisibilityParams,
  ChatInput,
  EpochMilliseconds,
  Conversation,
  ConversationMessage,
  ConversationMessageType,
  ConversationReply,
  ConversationReplyDelivery,
  ConversationStatus,
  ConversationStatusName,
  FindConversationMessagesParams,
  FindConversationsParams,
  PaginatedResponse,
  ReplyConversationParams,
  SendConversationMessageParams,
  StartConversationParams,
  StartEmailConversationParams,
  StorefrontConversation,
  StorefrontConversationMessage,
  StorefrontConversationMessageType,
  StorefrontConversationReply,
  StorefrontGetConversationParams,
  SupportStep,
  SupportStepType,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type OptionalField<T, K extends keyof T> = {} extends Pick<T, K> ? true : false;
type AdminSupport = ReturnType<typeof createAdmin>["support"];
type StorefrontSupport = ReturnType<typeof createStorefront>["support"];

const filters: FindConversationsParams = {
  store_id: "7d4b2e90-5c16-4a83-bf07-3e9a1c6d8f25",
  statuses: ["flow", "team", "resolved"],
  contact: "chat",
  customer_id: "customer",
  assigned_account_id: "account",
  query: "refund",
  sort_field: "updated_at",
  sort_direction: "desc",
  limit: 1,
  cursor: "next",
};
const reply: ReplyConversationParams = {
  store_id: filters.store_id,
  conversation_id: "conversation",
  id: "2a6d8f13-9c47-4e05-b1a8-6f3e0c2d7b95",
  expected_updated_at: epochMilliseconds(4),
  text: "On it",
  delivery: "chat_and_email",
};
const send: SendConversationMessageParams = {
  conversation_id: "conversation",
  id: "2a6d8f13-9c47-4e05-b1a8-6f3e0c2d7b95",
  input: { type: "text", text: "Hello" },
};
const steps: Record<string, SupportStep> = {
  start: { type: "chat_message", text: { en: "Hi" }, next_step_key: "send" },
  send: { type: "send_email", email_template_id: "template", next_step_key: "done" },
  done: { type: "resolve" },
};

export type SupportContracts = [
  Assert<Equal<keyof AdminSupport, "flow" | "conversation">>,
  Assert<Equal<Parameters<AdminSupport["conversation"]["startEmail"]>[0], StartEmailConversationParams>>,
  Assert<Equal<Awaited<ReturnType<AdminSupport["conversation"]["startEmail"]>>, ConversationReply>>,
  Assert<Equal<keyof AdminSupport["conversation"], "startEmail" | "find" | "get" | "findMessages" | "getMessage" | "attachmentLink" | "reply" | "changeChatVisibility" | "selectSendingAddress" | "resolve" | "assign" | "notes">>,
  Assert<Equal<Parameters<AdminSupport["conversation"]["changeChatVisibility"]>[0], ChangeConversationChatVisibilityParams>>,
  Assert<Equal<Awaited<ReturnType<AdminSupport["conversation"]["changeChatVisibility"]>>, ConversationMessage>>,
  Assert<Equal<ChangeConversationChatVisibilityParams, { store_id: string; conversation_id: string; message_id: string; expected_updated_at: EpochMilliseconds; visible_in_chat: boolean }>>,
  Assert<OptionalField<ReplyConversationParams, "text">>,
  Assert<OptionalField<ReplyConversationParams, "email_template_id">>,
  Assert<Equal<ReplyConversationParams["email_template_id"], string | undefined>>,
  Assert<OptionalField<StartEmailConversationParams, "text">>,
  Assert<OptionalField<StartEmailConversationParams, "email_template_id">>,
  Assert<Equal<StartEmailConversationParams["email_template_id"], string | undefined>>,
  Assert<Equal<Parameters<AdminSupport["conversation"]["find"]>[0], FindConversationsParams>>,
  Assert<Equal<Awaited<ReturnType<AdminSupport["conversation"]["find"]>>, PaginatedResponse<Conversation>>>,
  Assert<Equal<Parameters<AdminSupport["conversation"]["findMessages"]>[0], FindConversationMessagesParams>>,
  Assert<Equal<Awaited<ReturnType<AdminSupport["conversation"]["findMessages"]>>, PaginatedResponse<ConversationMessage>>>,
  Assert<Equal<Awaited<ReturnType<AdminSupport["conversation"]["reply"]>>, ConversationReply>>,
  Assert<Equal<keyof ConversationReply, "conversation" | "message">>,
  Assert<Equal<NonNullable<FindConversationsParams["statuses"]>[number], ConversationStatusName>>,
  Assert<Equal<ConversationStatusName, "flow" | "team" | "resolved">>,
  Assert<Equal<ConversationStatus, { type: "flow"; step_key: string } | { type: "team" } | { type: "resolved" }>>,
  Assert<Missing<FindConversationsParams, "status" | "agent_id" | "channel_id" | "channel_type">>,
  Assert<Equal<NonNullable<FindConversationsParams["sort_field"]>, "created_at" | "updated_at">>,
  Assert<Equal<NonNullable<FindConversationsParams["contact"]>, "chat" | "email">>,
  Assert<Equal<keyof Conversation, "id" | "store_id" | "customer_id" | "assigned_account_id" | "status" | "type" | "language" | "flow" | "next_message_sequence" | "created_at" | "updated_at">>,
  Assert<Missing<Conversation, "channel_id" | "chat" | "email">>,
  Assert<Equal<ConversationMessage["sequence"], number>>,
  Assert<Equal<ConversationMessageType["type"], "customer_chat" | "received_email" | "flow_message" | "flow_choice" | "flow_question" | "reply">>,
  Assert<Equal<Extract<ConversationMessageType, { type: "reply" }>["delivery"], ConversationReplyDelivery>>,
  Assert<Equal<ConversationReplyDelivery["type"], "chat" | "email" | "chat_and_email">>,
  Assert<Equal<ReplyConversationParams["delivery"], "chat" | "email" | "chat_and_email">>,
  Assert<RequiredField<ReplyConversationParams, "id">>,
  Assert<RequiredField<ReplyConversationParams, "expected_updated_at">>,
  Assert<OptionalField<ReplyConversationParams, "resolve">>,
  Assert<Missing<ReplyConversationParams, "message_id">>,
  Assert<Equal<SupportStepType, "chat_message" | "chat_choice" | "chat_question" | "collect_email_contact" | "send_email" | "hand_to_team" | "resolve">>,
  Assert<RequiredField<StartConversationParams, "id">>,
  Assert<RequiredField<StartConversationParams, "language">>,
  Assert<OptionalField<StartConversationParams, "flow_key">>,
  Assert<Missing<StartConversationParams, "channel_key">>,
  Assert<Missing<StorefrontGetConversationParams, "support_token">>,
  Assert<Equal<keyof StorefrontSupport, "conversation">>,
  Assert<Equal<keyof StorefrontSupport["conversation"], "start" | "get" | "findMessages" | "getMessage" | "sendMessage">>,
  Assert<Equal<Awaited<ReturnType<StorefrontSupport["conversation"]["start"]>>, StorefrontConversationReply>>,
  Assert<Equal<Awaited<ReturnType<StorefrontSupport["conversation"]["get"]>>, StorefrontConversation>>,
  Assert<Equal<Awaited<ReturnType<StorefrontSupport["conversation"]["sendMessage"]>>, StorefrontConversationReply>>,
  Assert<Equal<Awaited<ReturnType<StorefrontSupport["conversation"]["findMessages"]>>, PaginatedResponse<StorefrontConversationMessage>>>,
  Assert<Missing<StorefrontConversationReply, "support_token">>,
  Assert<Equal<keyof StorefrontConversation, "id" | "language" | "status" | "created_at" | "updated_at">>,
  Assert<Equal<ChatInput, { type: "button"; label: string } | { type: "text"; text: string }>>,
  Assert<Equal<SendConversationMessageParams["input"], ChatInput>>,
  Assert<OptionalField<SendConversationMessageParams, "prompt_message_id">>,
  Assert<Equal<StorefrontConversationMessageType["type"], "customer_chat" | "received_email" | "flow_message" | "flow_choice" | "flow_question" | "reply">>,
  Assert<Missing<Extract<StorefrontConversationMessageType, { type: "reply" }>, "author" | "delivery">>,
];

void [filters, reply, send, steps];
