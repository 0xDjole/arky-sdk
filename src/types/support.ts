import type { Days, Duration, EpochMilliseconds } from "./time";
import type {
  AccountActor,
  EmailContact,
  LocalizedText,
  PostalAddress,
  ProviderEffectError,
  ProviderLogin,
  ProviderOperationClaim,
  SortDirection,
  TimeRange,
} from "./common";
import type { Email, ReminderResult } from "./notification";
import type { BookingAnswer, BookingResponder } from "./order";
import type { BookingHours } from "./product";
import type { IncomingWebhookResolution, IncomingWebhookStatusName } from "./payment";

export type ChatInputType = "text" | "email" | "phone";

export interface SupportButton {
  label: LocalizedText;
  next_step_key: string;
}

export type AssistantTool =
  | "find_items"
  | "find_slots"
  | "find_locations"
  | "find_entries"
  | "find_orders"
  | "read_customer"
  | "save_customer"
  | "save_entry"
  | "book"
  | "move"
  | "cancel"
  | "confirm_attendance"
  | "order"
  | "record_sms_consent";

export type AssistantPlaceOfSale = { type: "none" } | { type: "store_location"; store_location_id: string };

export type AssistantStatus = { type: "active" } | { type: "paused" };

export interface AssistantSettings {
  status: AssistantStatus;
  login: ProviderLogin;
  languages: string[];
  instructions: string;
  tools: AssistantTool[];
  sales_channel_id: string;
  market_id: string;
  package_id: string;
  place_of_sale: AssistantPlaceOfSale;
}

export interface SupportAssistant extends AssistantSettings {
  id: string;
  store_id: string;
  key: string;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface AssistantOperation {
  assistant_id: string;
  settings: AssistantSettings;
}

export type ChatAssistantRequest = { type: "none" } | { type: "reply"; operation: AssistantOperation };
export type CallAssistantSession = { type: "none" } | { type: "session"; step_key: string; operation: AssistantOperation };

export interface CreateSupportAssistantParams extends AssistantSettings {
  store_id: string;
  id: string;
  key: string;
}
export interface UpdateSupportAssistantParams extends CreateSupportAssistantParams {
  expected_updated_at: EpochMilliseconds;
}
export interface GetSupportAssistantParams { store_id: string; id: string; }
export interface DeleteSupportAssistantParams extends GetSupportAssistantParams { expected_updated_at: EpochMilliseconds; }
export interface FindSupportAssistantsParams { store_id: string; key?: string; limit?: number; cursor?: string | null; }

export type CallPostLogin =
  | { store_provider_id: string; network_provider_id?: never }
  | { store_provider_id?: never; network_provider_id: string };

export type FindCallPostsParams = CallPostLogin & {
  store_id: string;
  status: IncomingWebhookStatusName;
  limit?: number;
  cursor?: string | null;
};

export interface ResolveCallPostParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  resolution: IncomingWebhookResolution;
  reason?: string | null;
}

export type PhonePrompt = { type: "speak"; text: LocalizedText } | { type: "play"; media_id: string };

export interface PhoneMenuOption {
  digit: number;
  next_step_key: string;
}

export type CallRecordingSetting = { type: "off" } | { type: "keep"; period: Days };

export type CallVoice = { type: "eleven_labs"; voice_id: string };

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url: string | null;
  languages: string[];
}

export type FindVoicesParams =
  | { store_id: string; store_provider_id: string; network_provider_id?: never; limit?: number; cursor?: string | null }
  | { store_id: string; store_provider_id?: never; network_provider_id: string; limit?: number; cursor?: string | null };

export interface SpeakMediaParams {
  store_id: string;
  media_id: string;
  text: string;
  language: string;
  login: ProviderLogin;
  voice: CallVoice;
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
  | { type: "chat_assistant"; assistant_id: string; hand_over_step_key: string }
  | { type: "phone_say"; prompt: PhonePrompt; next_step_key: string }
  | { type: "phone_menu"; prompt: PhonePrompt; options: PhoneMenuOption[]; no_answer_step_key: string }
  | { type: "phone_ring"; number: string; ring: Duration; next_step_key: string }
  | {
      type: "phone_assistant";
      assistant_id: string;
      greeting: LocalizedText;
      voice: CallVoice;
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

export type ConversationFlowFailure =
  | { type: "none" }
  | { type: "failed"; step_key: string; reason: ConversationFlowFailureReason; at: EpochMilliseconds };

export interface ConversationFlow {
  flow_id: string;
  steps: Record<string, SupportStep>;
  answers: Record<string, string>;
  failure: ConversationFlowFailure;
}

export type ConversationPastFlow = { type: "none" } | { type: "ran"; flow: ConversationFlow };

export type WaitingReason = "message" | "booking_change_requested" | "callback_requested" | "reopened";

export type ConversationState =
  | { type: "flow"; step_key: string; flow: ConversationFlow }
  | { type: "waiting_for_store"; reason: WaitingReason; flow: ConversationPastFlow }
  | { type: "resolved"; flow: ConversationPastFlow };

export type ConversationStateName = ConversationState["type"];

export type ConversationContactName = "chat" | "email" | "phone";

export interface ConversationEmail {
  contact: EmailContact;
  reply: Email;
}

export type ConversationType =
  | { type: "chat"; language: string; subject: string }
  | { type: "email"; email: ConversationEmail; subject: string }
  | { type: "chat_and_email"; chat_language: string; email: ConversationEmail; subject: string }
  | { type: "phone" };

export type ReadPosition = { type: "unread" } | { type: "through"; sequence: number };

export interface Conversation {
  id: string;
  store_id: string;
  customer_id: string;
  assigned_account_id: string | null;
  type: ConversationType;
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

export type ReplyEmailFailureType = "hard_bounce" | "soft_bounce" | "rejected" | "other";

export interface ReplyEmailFailure {
  type: ReplyEmailFailureType;
  reason: string;
}

export type ReplyEmailDelivery =
  | { type: "pending" }
  | { type: "delivered"; at: EpochMilliseconds }
  | { type: "delayed"; reason: string | null; at: EpochMilliseconds }
  | { type: "bounced"; failure: ReplyEmailFailure; at: EpochMilliseconds }
  | { type: "failed"; reason: string; at: EpochMilliseconds }
  | { type: "suppressed"; reason: string; at: EpochMilliseconds };

export type ReplyEmailComplaint = { type: "none" } | { type: "complained"; at: EpochMilliseconds };

export type ConversationEmailSendStatus =
  | { type: "waiting" }
  | {
      type: "sent";
      at: EpochMilliseconds;
      provider_email_id: string;
      delivery: ReplyEmailDelivery;
      complaint: ReplyEmailComplaint;
    }
  | { type: "not_sent"; reason: string; at: EpochMilliseconds }
  | { type: "maybe_sent"; at: EpochMilliseconds };

export interface ReplyEmail {
  email_address_id: string;
  outgoing_message_id: string;
  headers: EmailHeaders;
  send_status: ConversationEmailSendStatus;
}

export type ConversationReplyAuthor =
  | { type: "account"; actor: AccountActor }
  | { type: "flow"; step_key: string };

export type ConversationReplyDelivery =
  | { type: "chat"; attachments: EmailAttachment[] }
  | { type: "email"; email: ReplyEmail }
  | { type: "chat_and_email"; email: ReplyEmail };

export type ReplyDeliveryName = ConversationReplyDelivery["type"];

export interface AssistantOrderLine {
  package_item_id: string;
  price_id: string;
  quantity: number;
}

export type AssistantOrderDestination =
  | { type: "delivery"; address: PostalAddress; shipping_method_id: string }
  | { type: "pickup"; shipping_method_id: string };

export type AssistantCommand =
  | { type: "book"; booking_offering_id: string; store_location_id: string; interval: TimeRange }
  | { type: "move"; order_id: string; order_booking_line_item_id: string; interval: TimeRange }
  | { type: "cancel"; order_id: string; order_booking_line_item_id: string }
  | { type: "confirm_attendance"; order_id: string; order_booking_line_item_id: string }
  | {
      type: "order";
      line_items: AssistantOrderLine[];
      destination: AssistantOrderDestination;
      presentation_digest: string;
    };

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
  | "booking_overlap"
  | "order_changed";

export type AssistantProposalClosure = "declined" | "expired" | "replaced" | "store_took_over" | "call_ended";

export type AssistantProposalState =
  | { type: "open"; expires_at: EpochMilliseconds }
  | {
      type: "booked";
      confirmation: AssistantConfirmation;
      order_id: string;
      order_booking_line_item_id: string;
      at: EpochMilliseconds;
    }
  | { type: "ordered"; confirmation: AssistantConfirmation; order_id: string; at: EpochMilliseconds }
  | { type: "applied"; confirmation: AssistantConfirmation; at: EpochMilliseconds }
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

export type CallFlowFailureReason =
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

export type CallFlowFailure =
  | { type: "none" }
  | { type: "failed"; step_key: string; reason: CallFlowFailureReason; at: EpochMilliseconds };

export interface CallFlow {
  flow_id: string;
  step_key: string;
  steps: Record<string, SupportStep>;
  answers: Record<string, string>;
  failure: CallFlowFailure;
}

export type Caller =
  | { type: "known"; number: string }
  | { type: "unknown"; number: string }
  | { type: "shared"; number: string; identified_customer_id: string | null }
  | { type: "withheld" };

export type CallHandler = "store" | "assistant";

export type CallOutcome =
  | "booked"
  | "ordered"
  | "moved"
  | "cancelled"
  | "transferred"
  | "callback"
  | "info"
  | "hung_up"
  | "answered";

export type CallState =
  | { type: "ringing" }
  | { type: "connected"; handler: CallHandler; at: EpochMilliseconds }
  | { type: "ended"; handler: CallHandler; connected_at: EpochMilliseconds; outcome: CallOutcome; at: EpochMilliseconds }
  | { type: "missed"; at: EpochMilliseconds };

export type CallSpeaker = "caller" | "assistant";

export interface CallLine {
  who: CallSpeaker;
  text: string;
  at: Duration;
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
  | { type: "not_received"; at: EpochMilliseconds }
  | { type: "delete_failed"; recording_sid: string; error: ProviderEffectError }
  | { type: "failed"; error: ProviderEffectError };

export interface Call {
  phone_number_id: string;
  caller: Caller;
  call_sid: string;
  flow: CallFlow;
  assistant_session: CallAssistantSession;
  state: CallState;
  transcript: CallLine[];
  proposals: AssistantProposal[];
  topic: string | null;
  transfer: CallTransfer;
  recording: CallRecording;
  elevenlabs_conversation: ElevenLabsConversation;
}

export type ConversationMessageType =
  | { type: "customer_chat"; text: string; assistant: ChatAssistantRequest }
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
  | {
      type: "wiped_call";
      call_sid: string;
      phone_number_id: string;
      elevenlabs_login: ProviderLogin;
      delete_at: EpochMilliseconds;
    }
  | { type: "assistant_reply"; request_message_id: string; text: string; proposal: AssistantProposal | null };

export type CallTranscriptState =
  | { type: "not_expected" }
  | { type: "waiting"; until: EpochMilliseconds }
  | { type: "received" }
  | { type: "not_received"; at: EpochMilliseconds };

export interface ConversationMessage {
  id: string;
  store_id: string;
  conversation_id: string;
  sequence: number;
  type: ConversationMessageType;
  transcript_state?: CallTranscriptState;
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

export type StorefrontConversationType = { type: "chat"; language: string; subject: string } | { type: "phone" };

export interface StorefrontConversation {
  id: string;
  type: StorefrontConversationType;
  state: ConversationStateName;
  next_message_sequence: number;
  customer_read: ReadPosition;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StorefrontConversationListItem {
  id: string;
  type: StorefrontConversationType;
  state: ConversationStateName;
  customer_read: ReadPosition;
  newest_message_at: EpochMilliseconds;
  unread: boolean;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StorefrontCallDirection = "incoming";

export type StorefrontCallOutcome =
  | "ongoing"
  | "missed"
  | "booked"
  | "ordered"
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
  after_sequence?: number;
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
  unassigned?: boolean;
  unread?: boolean;
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
  after_sequence?: number;
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
