import type { EpochMilliseconds } from "./time";
import type { AccountActor, LocalizedText, SortDirection } from "./common";
import type { EmailContent } from "./notification";

export type SupportInputType = "text" | "email" | "phone";

export type SupportAiTool = "escalate" | "web_search" | "read_webpage";

export interface SupportButton {
  label: LocalizedText;
  next_step_key: string;
}

export type SupportStep =
  | { type: "message"; text: LocalizedText; next_step_key: string }
  | { type: "choice"; text: LocalizedText; buttons: SupportButton[] }
  | { type: "question"; text: LocalizedText; input_type: SupportInputType; next_step_key: string }
  | { type: "ai_handoff"; text: LocalizedText; prompt: string; tools: SupportAiTool[] }
  | { type: "human_handoff"; text: LocalizedText }
  | { type: "end_conversation"; text: LocalizedText };

export type SupportStepType = SupportStep["type"];

export interface SupportFlow {
  id: string;
  store_id: string;
  key: string;
  start_step_key: string;
  steps: Record<string, SupportStep>;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type SupportChatStart =
  | { type: "inbox" }
  | { type: "flow"; flow_id: string };

export type SupportAutoReply =
  | { type: "off" }
  | { type: "on"; content: EmailContent };

export type SupportChannelType =
  | { type: "chat"; start: SupportChatStart }
  | {
      type: "email";
      sender_id: string;
      forwarding_local_part: string;
      forwarding_address: string;
      auto_reply: SupportAutoReply;
    };

export type SupportChannelStatus = { type: "active" } | { type: "disabled" };

export interface SupportChannel {
  id: string;
  store_id: string;
  key: string;
  type: SupportChannelType;
  status: SupportChannelStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type SupportConversationStart =
  | { type: "inbox" }
  | {
      type: "flow";
      flow_id: string;
      steps: Record<string, SupportStep>;
      answers: Record<string, string>;
    };

export type SupportConversationType =
  | { type: "chat"; language: string; start: SupportConversationStart }
  | { type: "email"; customer_email: string; subject: string };

export type SupportConversationStatus =
  | { type: "flow"; step_key: string }
  | { type: "ai"; step_key: string }
  | { type: "escalated" }
  | { type: "resolved" };

export interface SupportConversation {
  id: string;
  store_id: string;
  channel_id: string;
  customer_id: string;
  type: SupportConversationType;
  status: SupportConversationStatus;
  assigned_account_id: string | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type SupportAiReply =
  | { type: "not_asked" }
  | { type: "waiting" }
  | { type: "answering"; until: EpochMilliseconds }
  | { type: "answered" }
  | { type: "not_answered"; reason: string }
  | { type: "maybe_answered" };

export type SupportAiAction =
  | { type: "web_search"; query: string }
  | { type: "read_webpage"; url: string }
  | { type: "escalate" };

export type SupportReplyStatus =
  | { type: "waiting" }
  | { type: "sent" }
  | { type: "not_sent" }
  | { type: "maybe_sent" };

export interface SupportAttachment {
  file_name: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
}

export interface SupportAttachmentLink {
  url: string;
  expires_at: EpochMilliseconds;
}

export type SupportMessageType =
  | { type: "customer_chat"; text: string; ai_reply: SupportAiReply }
  | {
      type: "customer_email";
      text: string;
      from: string;
      email_message_id: string;
      references: string[];
      attachments: SupportAttachment[];
    }
  | { type: "flow"; text: string; buttons: string[] }
  | { type: "flow_question"; text: string; input_type: SupportInputType }
  | { type: "ai"; text: string }
  | { type: "ai_action"; action: SupportAiAction }
  | { type: "account_chat"; text: string; actor: AccountActor }
  | {
      type: "account_email";
      text: string;
      actor: AccountActor;
      notification_id: string;
      status: SupportReplyStatus;
    }
  | {
      type: "store_email";
      text: string;
      from: string;
      email_message_id: string;
      references: string[];
    };

export interface SupportMessage {
  id: string;
  store_id: string;
  conversation_id: string;
  type: SupportMessageType;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface SupportConversationResponse {
  conversation: SupportConversation;
  messages: SupportMessage[];
  messages_cursor: string | null;
}

export interface StorefrontSupportConversation {
  id: string;
  store_id: string;
  channel_id: string;
  language: string;
  status: SupportConversationStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StorefrontSupportMessageType =
  | { type: "customer_chat"; text: string; ai_reply: SupportAiReply }
  | { type: "flow"; text: string; buttons: string[] }
  | { type: "flow_question"; text: string; input_type: SupportInputType }
  | { type: "ai"; text: string }
  | { type: "account_chat"; text: string };

export interface StorefrontSupportMessage {
  id: string;
  store_id: string;
  conversation_id: string;
  type: StorefrontSupportMessageType;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StorefrontSupportConversationResponse {
  conversation: StorefrontSupportConversation;
  messages: StorefrontSupportMessage[];
  messages_cursor: string | null;
}

export interface StorefrontSupportConversationStartResponse
  extends StorefrontSupportConversationResponse {
  support_token: string;
}

export type SupportMessageInput =
  | { type: "button"; label: string }
  | { type: "text"; text: string };

export interface StartSupportConversationParams {
  id: string;
  channel_key: string;
  language: string;
}

export interface StorefrontSupportMessageResult {
  conversation: StorefrontSupportConversation;
  message: StorefrontSupportMessage;
}

export interface StorefrontSendSupportMessageParams {
  support_token: string;
  conversation_id: string;
  message_id: string;
  input: SupportMessageInput;
}

export interface StorefrontGetSupportConversationParams {
  support_token: string;
  conversation_id: string;
  message_limit?: number;
  message_cursor?: string | null;
}

export interface StorefrontGetSupportMessageParams {
  support_token: string;
  conversation_id: string;
  message_id: string;
}

export interface FindSupportFlowsParams {
  store_id: string;
  key?: string;
  query?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface GetSupportFlowParams {
  store_id: string;
  id: string;
}

export interface CreateSupportFlowParams {
  store_id: string;
  id: string;
  key: string;
  start_step_key: string;
  steps: Record<string, SupportStep>;
}

export interface UpdateSupportFlowParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  start_step_key: string;
  steps: Record<string, SupportStep>;
}

export interface DeleteSupportFlowParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindSupportChannelsParams {
  store_id: string;
  status?: SupportChannelStatus["type"];
  type?: SupportChannelType["type"];
  query?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface GetSupportChannelParams {
  store_id: string;
  id: string;
}

export type SupportChannelTypeInput =
  | { type: "chat"; start: SupportChatStart }
  | { type: "email"; sender_id: string; auto_reply: SupportAutoReply };

export interface CreateSupportChannelParams {
  store_id: string;
  id: string;
  key: string;
  type: SupportChannelTypeInput;
  status: SupportChannelStatus;
}

export type SupportChannelChange =
  | { type: "chat"; start: SupportChatStart }
  | { type: "email"; sender_id: string; auto_reply: SupportAutoReply };

export interface UpdateSupportChannelParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  type?: SupportChannelChange;
  status?: SupportChannelStatus;
}

export interface DeleteSupportChannelParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindSupportConversationsParams {
  store_id: string;
  statuses?: SupportConversationStatus["type"][];
  channel_id?: string;
  channel_type?: SupportChannelType["type"];
  customer_id?: string;
  assigned_account_id?: string;
  query?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface GetSupportConversationParams {
  store_id: string;
  conversation_id: string;
  message_limit?: number;
  message_cursor?: string | null;
}

export interface GetSupportMessageParams {
  store_id: string;
  conversation_id: string;
  message_id: string;
}

export interface GetSupportAttachmentLinkParams {
  store_id: string;
  conversation_id: string;
  message_id: string;
  sha256: string;
}

export interface ReplySupportConversationParams {
  store_id: string;
  conversation_id: string;
  message_id: string;
  expected_updated_at: EpochMilliseconds;
  text: string;
  resolve: boolean;
}

export interface ResolveSupportConversationParams {
  store_id: string;
  conversation_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface AssignSupportConversationParams {
  store_id: string;
  conversation_id: string;
  expected_updated_at: EpochMilliseconds;
  account_id: string | null;
}
