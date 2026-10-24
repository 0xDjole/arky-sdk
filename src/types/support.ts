import type { EpochMilliseconds } from "./time";
import type { AccountActor, EmailContact, LocalizedText, SortDirection } from "./common";
import type { Email, EmailDeliveryReport } from "./notification";

export type ChatInputType = "text" | "email" | "phone";

export interface SupportButton {
  label: LocalizedText;
  next_step_key: string;
}

export type SupportStep =
  | { type: "chat_message"; text: LocalizedText; next_step_key: string }
  | { type: "chat_choice"; text: LocalizedText; buttons: SupportButton[] }
  | { type: "chat_question"; text: LocalizedText; input_type: ChatInputType; next_step_key: string }
  | {
      type: "collect_email_contact";
      text: LocalizedText;
      subject: LocalizedText;
      reply: Email;
      next_step_key: string;
    }
  | { type: "send_email"; email: Email; next_step_key: string }
  | { type: "hand_to_team" }
  | { type: "resolve" };

export type SupportStepType = SupportStep["type"];

export type SupportEntry =
  | { type: "chat"; start_step_key: string }
  | {
      type: "incoming_email";
      email_address_id: string;
      reply_language: string;
      reply: Email;
      start_step_key: string;
    };

export interface SupportFlow {
  id: string;
  store_id: string;
  key: string;
  entries: SupportEntry[];
  steps: Record<string, SupportStep>;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface ConversationFlowFailure {
  step_key: string;
  reason: string;
  at: EpochMilliseconds;
}

export interface ConversationFlow {
  flow_id: string;
  steps: Record<string, SupportStep>;
  answers: Record<string, string>;
  failure: ConversationFlowFailure | null;
}

export type ConversationState =
  | { type: "flow"; step_key: string; flow: ConversationFlow }
  | { type: "waiting_for_team"; flow: ConversationFlow | null }
  | { type: "resolved"; flow: ConversationFlow | null };

export type ConversationStateName = ConversationState["type"];

export type ConversationContactName = "chat" | "email";

export interface ConversationEmail {
  contact: EmailContact;
  subject: string;
  reply: Email;
}

export type ConversationType =
  | { type: "chat"; language: string }
  | { type: "email"; email: ConversationEmail }
  | { type: "chat_and_email"; chat_language: string; email: ConversationEmail };

export interface Conversation {
  id: string;
  store_id: string;
  customer_id: string;
  assigned_account_id: string | null;
  state: ConversationState;
  type: ConversationType;
  next_message_sequence: number;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface EmailMailbox {
  email: string;
  name: string | null;
}

export interface EmailHeaders {
  message_id: string | null;
  in_reply_to: string[];
  references: string[];
  from: EmailMailbox;
  reply_to: EmailMailbox[];
  to: EmailMailbox[];
  cc: EmailMailbox[];
  subject: string;
  auto_submitted: string | null;
  precedence: string | null;
}

export interface EmailAttachment {
  file_name: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
}

export interface ReceivedEmail {
  receiving_address_id: string;
  provider_email_id: string;
  received_at: EpochMilliseconds;
  headers: EmailHeaders;
}

export type ConversationEmailSendStatus =
  | { type: "waiting" }
  | { type: "sent"; at: EpochMilliseconds }
  | { type: "not_sent"; reason: string; at: EpochMilliseconds }
  | { type: "maybe_sent"; at: EpochMilliseconds };

export interface ReplyEmail {
  email_provider_id: string;
  sending_address_id: string;
  outgoing_email_id: string;
  provider_email_id: string | null;
  headers: EmailHeaders;
  send_status: ConversationEmailSendStatus;
  delivery_report: EmailDeliveryReport | null;
  complained_at: EpochMilliseconds | null;
}

export type ConversationReplyAuthor =
  | { type: "account"; actor: AccountActor }
  | { type: "flow"; step_key: string };

export type ConversationReplyDelivery =
  | { type: "chat" }
  | { type: "email"; email: ReplyEmail }
  | { type: "chat_and_email"; email: ReplyEmail };

export type ReplyDeliveryName = ConversationReplyDelivery["type"];

export type ConversationMessageType =
  | { type: "customer_chat"; text: string }
  | {
      type: "received_email";
      text: string;
      email: ReceivedEmail;
      attachments: EmailAttachment[];
      left_out_attachments: { file_name: string; reason: "over_limit" | "unavailable" }[];
      visible_in_chat: boolean;
    }
  | { type: "flow_message"; step_key: string; text: string }
  | { type: "flow_choice"; step_key: string; text: string; buttons: string[] }
  | { type: "flow_question"; step_key: string; text: string; input_type: ChatInputType }
  | {
      type: "reply";
      text: string;
      author: ConversationReplyAuthor;
      delivery: ConversationReplyDelivery;
    };

export interface ConversationMessage {
  id: string;
  store_id: string;
  conversation_id: string;
  sequence: number;
  type: ConversationMessageType;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface ConversationReply {
  conversation: Conversation;
  message: ConversationMessage;
}

export interface ConversationAttachmentLink {
  url: string;
  expires_at: EpochMilliseconds;
}

export interface StorefrontConversation {
  id: string;
  language: string;
  state: ConversationStateName;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StorefrontConversationMessageType =
  | { type: "customer_chat"; text: string }
  | { type: "received_email"; text: string }
  | { type: "flow_message"; text: string }
  | { type: "flow_choice"; text: string; buttons: string[] }
  | { type: "flow_question"; text: string; input_type: ChatInputType }
  | { type: "flow_email_contact"; text: string }
  | { type: "reply"; text: string };

export interface StorefrontConversationMessage {
  id: string;
  conversation_id: string;
  sequence: number;
  type: StorefrontConversationMessageType;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StorefrontConversationReply {
  conversation: StorefrontConversation;
  messages: StorefrontConversationMessage[];
}

export type ChatInput =
  | { type: "button"; label: string }
  | { type: "text"; text: string }
  | { type: "email_contact"; contact: EmailContact };

export interface StartConversationParams {
  id?: string;
  language: string;
  flow_key?: string;
}

export interface StorefrontGetConversationParams {
  id: string;
}

export interface StorefrontFindConversationMessagesParams {
  conversation_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface StorefrontGetConversationMessageParams {
  conversation_id: string;
  message_id: string;
}

export interface SendConversationMessageParams {
  conversation_id: string;
  id?: string;
  input: ChatInput;
  prompt_message_id?: string;
}

export interface StartEmailConversationParams {
  store_id: string;
  id: string;
  message_id: string;
  customer_id: string;
  contact: EmailContact;
  subject: string;
  reply: Email;
  text: string;
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
  entries: SupportEntry[];
  steps: Record<string, SupportStep>;
}

export interface UpdateSupportFlowParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  entries: SupportEntry[];
  steps: Record<string, SupportStep>;
}

export interface DeleteSupportFlowParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindConversationsParams {
  store_id: string;
  statuses?: ConversationStateName[];
  contact?: ConversationContactName;
  customer_id?: string;
  assigned_account_id?: string;
  query?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface GetConversationParams {
  store_id: string;
  conversation_id: string;
}

export interface FindConversationMessagesParams {
  store_id: string;
  conversation_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetConversationMessageParams {
  store_id: string;
  conversation_id: string;
  message_id: string;
}

export interface GetConversationAttachmentLinkParams {
  store_id: string;
  conversation_id: string;
  message_id: string;
  sha256: string;
}

export interface ReplyConversationParams {
  store_id: string;
  conversation_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  text: string;
  delivery: ReplyDeliveryName;
  resolve?: boolean;
}

export interface ChangeConversationChatVisibilityParams {
  store_id: string;
  conversation_id: string;
  message_id: string;
  expected_updated_at: EpochMilliseconds;
  visible_in_chat: boolean;
}

export interface SelectConversationReplyEmailParams {
  store_id: string;
  conversation_id: string;
  expected_reply: Email;
  reply: Email;
}

export interface ResolveConversationParams {
  store_id: string;
  conversation_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface AssignConversationParams {
  store_id: string;
  conversation_id: string;
  expected_account_id: string | null;
  account_id: string | null;
}
