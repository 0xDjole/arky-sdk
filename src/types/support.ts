import type { EpochMilliseconds } from "./time";
import type {
  AccountActor,
  EmailContact,
  LocalizedText,
  ProviderEffectError,
  ProviderLogin,
  ProviderOperationClaim,
  SortDirection,
  TimeRange,
} from "./common";
import type { Email, EmailDeliveryReport, ReminderResult } from "./notification";
import type { BookingAnswer, BookingResponder } from "./order";
import type { BookingHours } from "./product";

export type ChatInputType = "text" | "email" | "phone";

export interface SupportButton {
  label: LocalizedText;
  next_step_key: string;
}

export type AssistantAction = "book" | "move" | "cancel" | "confirm_attendance" | "record_sms_consent";

export type AssistantStatus = { type: "active" } | { type: "paused" };

export interface AssistantSettings {
  status: AssistantStatus;
  login: ProviderLogin;
  languages: string[];
  instructions: string;
  actions: AssistantAction[];
  sales_channel_id: string;
  market_id: string;
  package_id: string;
}

export type PhonePrompt = { type: "speak"; text: LocalizedText } | { type: "play"; media_id: string };

export interface PhoneMenuOption {
  digit: number;
  next_step_key: string;
}

export type CallRecordingSetting = { type: "off" } | { type: "keep"; days: number };

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
  | { type: "chat_assistant"; assistant: AssistantSettings; hand_over_step_key: string }
  | { type: "phone_say"; prompt: PhonePrompt; next_step_key: string }
  | { type: "phone_menu"; prompt: PhonePrompt; options: PhoneMenuOption[]; no_answer_step_key: string }
  | { type: "phone_ring"; number: string; ring_seconds: number; next_step_key: string }
  | {
      type: "phone_assistant";
      assistant: AssistantSettings;
      greeting: LocalizedText;
      recording: CallRecordingSetting;
      transfer_step_key: string;
    }
  | { type: "open_hours"; hours: BookingHours; open_step_key: string; closed_step_key: string }
  | { type: "hand_to_store" }
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
    }
  | { type: "phone"; phone_number_id: string; language: string; start_step_key: string };

export interface SupportFlow {
  id: string;
  store_id: string;
  key: string;
  entries: SupportEntry[];
  steps: Record<string, SupportStep>;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type ConversationFlowFailureReason =
  | "step_missing"
  | "chat_step_in_email"
  | "loops_without_customer"
  | "text_language_missing"
  | "no_email_contact"
  | "email_selection_gone"
  | "email_selection_unusable"
  | "email_template_unsuitable"
  | "email_render_failed"
  | "email_language_missing"
  | "phone_step_outside_call"
  | "chat_step_in_call"
  | "entry_gone"
  | "assistant_not_ready"
  | "assistant_refused"
  | "assistant_no_answer"
  | "prompt_recording_missing";

export interface ConversationFlowFailure {
  step_key: string;
  reason: ConversationFlowFailureReason;
  at: EpochMilliseconds;
}

export interface ConversationFlow {
  flow_id: string;
  steps: Record<string, SupportStep>;
  answers: Record<string, string>;
  failure: ConversationFlowFailure | null;
}

export type WaitingReason = "message" | "booking_change_requested" | "callback_requested" | "reopened";

export type ConversationState =
  | { type: "flow"; step_key: string; flow: ConversationFlow }
  | { type: "waiting_for_store"; reason: WaitingReason; flow: ConversationFlow | null }
  | { type: "resolved"; flow: ConversationFlow | null };

export type ConversationStateName = ConversationState["type"];

export type ConversationContactName = "chat" | "email" | "phone";

export interface ConversationEmail {
  contact: EmailContact;
  reply: Email;
}

export type ConversationType =
  | { type: "chat"; language: string }
  | { type: "email"; email: ConversationEmail }
  | { type: "chat_and_email"; chat_language: string; email: ConversationEmail }
  | { type: "phone" };

export type ReadPosition = { type: "unread" } | { type: "through"; sequence: number };

export interface Conversation {
  id: string;
  store_id: string;
  customer_id: string;
  assigned_account_id: string | null;
  type: ConversationType;
  subject: string;
  state: ConversationState;
  next_message_sequence: number;
  customer_read: ReadPosition;
  store_read: ReadPosition;
  unread: boolean;
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
  email_address_id: string;
  outgoing_message_id: string;
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

export type AssistantCommand =
  | { type: "book"; booking_offering_id: string; interval: TimeRange }
  | { type: "move"; order_id: string; order_booking_line_item_id: string; interval: TimeRange }
  | { type: "cancel"; order_id: string; order_booking_line_item_id: string }
  | { type: "confirm_attendance"; order_id: string; order_booking_line_item_id: string };

export type AssistantConfirmation =
  | { type: "tapped"; customer_session_id: string }
  | { type: "spoken"; caller_text: string };

export type AssistantRefusal =
  | "slot_taken"
  | "booking_changed"
  | "too_late"
  | "changes_disabled"
  | "payment_required"
  | "no_caller_reply"
  | "not_sold"
  | "customer_not_verified"
  | "booking_overlap";

export type AssistantProposalClosure = "declined" | "expired" | "replaced" | "store_took_over" | "call_ended";

export type AssistantProposalState =
  | { type: "open"; expires_at: EpochMilliseconds }
  | {
      type: "applied";
      confirmation: AssistantConfirmation;
      order_id: string;
      order_booking_line_item_id: string;
      at: EpochMilliseconds;
    }
  | { type: "refused"; confirmation: AssistantConfirmation; reason: AssistantRefusal; at: EpochMilliseconds }
  | { type: "closed"; reason: AssistantProposalClosure; at: EpochMilliseconds };

export interface AssistantProposal {
  id: string;
  command: AssistantCommand;
  state: AssistantProposalState;
}

export type ElevenLabsConversation =
  | { type: "none" }
  | { type: "kept"; login: ProviderLogin; conversation_id: string }
  | { type: "deleted"; at: EpochMilliseconds };

export interface CallFlow {
  flow_id: string;
  step_key: string;
  steps: Record<string, SupportStep>;
  answers: Record<string, string>;
  failure: ConversationFlowFailure | null;
}

export type Caller =
  | { type: "known"; number: string }
  | { type: "unknown"; number: string }
  | { type: "shared"; number: string; identified_customer_id: string | null }
  | { type: "withheld" };

export type CallHandler = "store" | "assistant";

export type CallOutcome =
  | "booked"
  | "moved"
  | "cancelled"
  | "transferred"
  | "callback"
  | "info"
  | "hung_up"
  | "answered";

export type CallState =
  | { type: "ringing" }
  | { type: "connected"; at: EpochMilliseconds }
  | { type: "ended"; connected_at: EpochMilliseconds; outcome: CallOutcome; at: EpochMilliseconds }
  | { type: "missed"; at: EpochMilliseconds };

export type CallSpeaker = "caller" | "assistant";

export interface CallLine {
  who: CallSpeaker;
  text: string;
  second: number;
}

export type CallTransfer =
  | { type: "none" }
  | { type: "waiting"; to: string }
  | { type: "transferring"; to: string; claim: ProviderOperationClaim }
  | { type: "transferred"; to: string; at: EpochMilliseconds }
  | { type: "failed"; to: string; error: ProviderEffectError }
  | { type: "unknown"; to: string; error: ProviderEffectError };

export type CallRecording =
  | { type: "none" }
  | { type: "starting"; claim: ProviderOperationClaim }
  | { type: "waiting"; recording_sid: string; delete_at: EpochMilliseconds }
  | { type: "stored"; mime_type: string; size_bytes: number; sha256: string; delete_at: EpochMilliseconds }
  | { type: "deleted"; at: EpochMilliseconds }
  | { type: "failed"; error: ProviderEffectError };

export interface Call {
  phone_number_id: string;
  caller: Caller;
  call_sid: string;
  flow: CallFlow;
  handler: CallHandler;
  state: CallState;
  transcript: CallLine[];
  proposals: AssistantProposal[];
  topic: string | null;
  transfer: CallTransfer;
  recording: CallRecording;
  elevenlabs_conversation: ElevenLabsConversation;
}

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
      attachments: EmailAttachment[];
    }
  | { type: "sms"; author: AccountActor; text: string; outgoing_message_ids: string[] }
  | {
      type: "reminder";
      order_id: string;
      order_booking_line_item_id: string;
      starts_at: EpochMilliseconds;
      notification_id: string;
      result: ReminderResult;
    }
  | {
      type: "booking_response";
      order_id: string;
      order_booking_line_item_id: string;
      starts_at: EpochMilliseconds;
      answer: BookingAnswer;
      by: BookingResponder;
    }
  | { type: "call"; call: Call }
  | { type: "assistant_reply"; text: string; proposal: AssistantProposal | null };

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

export interface CallRecordingLink {
  url: string;
  expires_at: EpochMilliseconds;
}

export type CallListOutcome = CallOutcome | "missed";

export interface CallListItem {
  call: ConversationMessage;
  customer_id: string;
  customer_name: string | null;
  waiting_callback: boolean;
}

export type StorefrontConversationType = { type: "chat"; language: string } | { type: "phone" };

export interface StorefrontConversation {
  id: string;
  type: StorefrontConversationType;
  subject: string;
  state: ConversationStateName;
  customer_read: ReadPosition;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StorefrontConversationListItem extends StorefrontConversation {
  newest_message_at: EpochMilliseconds;
  unread: boolean;
}

export type StorefrontCallDirection = "incoming";

export type StorefrontCallOutcome =
  | "ongoing"
  | "missed"
  | "booked"
  | "moved"
  | "cancelled"
  | "transferred"
  | "callback"
  | "info"
  | "hung_up"
  | "answered";

export type StorefrontConversationMessageType =
  | { type: "customer_chat"; text: string }
  | { type: "received_email"; text: string }
  | { type: "flow_message"; text: string }
  | { type: "flow_choice"; text: string; buttons: string[] }
  | { type: "flow_question"; text: string; input_type: ChatInputType }
  | { type: "flow_email_contact"; text: string }
  | { type: "reply"; text: string; attachments: EmailAttachment[] }
  | { type: "assistant_reply"; text: string; proposal: AssistantProposal | null }
  | { type: "sms"; text: string }
  | { type: "reminder"; order_id: string; order_booking_line_item_id: string; starts_at: EpochMilliseconds }
  | {
      type: "booking_response";
      order_id: string;
      order_booking_line_item_id: string;
      starts_at: EpochMilliseconds;
      answer: BookingAnswer;
    }
  | { type: "call"; direction: StorefrontCallDirection; outcome: StorefrontCallOutcome };

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
  | { type: "button"; index: number }
  | { type: "text"; text: string }
  | { type: "email_contact"; contact: EmailContact };

export interface StartConversationParams {
  id?: string;
  language: string;
  flow_key: string;
  subject?: string;
}

export interface StorefrontGetConversationParams {
  id: string;
}

export interface StorefrontFindConversationsParams {
  limit?: number;
  cursor?: string | null;
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

export interface StorefrontGetConversationAttachmentLinkParams {
  conversation_id: string;
  message_id: string;
  sha256: string;
}

export interface MarkStorefrontConversationReadParams {
  conversation_id: string;
  sequence: number;
}

export interface StorefrontAssistantProposalParams {
  conversation_id: string;
  message_id: string;
  proposal_id: string;
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

export interface StartChatConversationParams {
  store_id: string;
  id: string;
  message_id: string;
  customer_id: string;
  language: string;
  subject: string;
  text: string;
  files?: File[];
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
  sort_field?: "newest_message_at" | "created_at" | "updated_at";
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
  newest_message_sequence: number | null;
  text: string;
  delivery: ReplyDeliveryName;
  resolve?: boolean;
  files?: File[];
}

export interface SendConversationSmsParams {
  store_id: string;
  conversation_id: string;
  id: string;
  newest_message_sequence: number | null;
  text: string;
  resolve?: boolean;
}

export interface SendCustomerSmsParams {
  store_id: string;
  customer_id: string;
  id: string;
  text: string;
  resolve?: boolean;
}

export interface MarkConversationReadParams {
  store_id: string;
  conversation_id: string;
  sequence: number;
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
  newest_message_sequence: number | null;
}

export interface ReopenConversationParams {
  store_id: string;
  conversation_id: string;
  newest_message_sequence: number | null;
}

export interface AssignConversationParams {
  store_id: string;
  conversation_id: string;
  expected_account_id: string | null;
  account_id: string | null;
}

export interface FindCallsParams {
  store_id: string;
  outcomes?: CallListOutcome[];
  waiting_callback?: boolean;
  phone_number_id?: string;
  query?: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetCallParams {
  store_id: string;
  conversation_id: string;
  message_id: string;
}
