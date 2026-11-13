import type { ApiConfig, StorefrontFlowContext } from "../services/clientTypes";
import { runDurableCreate } from "../services/durableCreate";
import type { HttpClient } from "../types/httpClient";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  AssignConversationParams,
  CallListItem,
  CallRecordingLink,
  ChangeConversationChatVisibilityParams,
  Conversation,
  ConversationAttachmentLink,
  ConversationMessage,
  ConversationReply,
  CreateSupportFlowParams,
  DeleteSupportFlowParams,
  FindCallsParams,
  FindConversationMessagesParams,
  FindConversationsParams,
  FindSupportFlowsParams,
  GetCallParams,
  GetConversationAttachmentLinkParams,
  GetConversationMessageParams,
  GetConversationParams,
  GetSupportFlowParams,
  MarkConversationReadParams,
  MarkStorefrontConversationReadParams,
  ReopenConversationParams,
  ReplyConversationParams,
  ResolveConversationParams,
  SelectConversationReplyEmailParams,
  SendConversationMessageParams,
  SendConversationSmsParams,
  SendCustomerSmsParams,
  StartConversationParams,
  StartChatConversationParams,
  StartEmailConversationParams,
  StorefrontAssistantProposalParams,
  StorefrontConversation,
  StorefrontConversationListItem,
  StorefrontConversationMessage,
  StorefrontConversationReply,
  StorefrontFindConversationMessagesParams,
  StorefrontFindConversationsParams,
  StorefrontGetConversationAttachmentLinkParams,
  StorefrontGetConversationMessageParams,
  StorefrontGetConversationParams,
  SupportFlow,
  UpdateSupportFlowParams,
} from "../types/support";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";
import { createConversationNoteApi } from "./note";
import { isValidKey } from "../utils/keyValidation";

function messageWithFiles(part: string, message: Record<string, unknown>, files: File[] | undefined): Record<string, unknown> | FormData {
  if (files === undefined || files.length === 0) return message;
  const formData = new FormData();
  formData.append(part, JSON.stringify(message));
  files.forEach((file, index) => {
    if (!file.name) throw new TypeError("Every file a message carries needs a file name");
    if (file.size < 1) throw new TypeError(`The file '${file.name}' is empty`);
    formData.append(`file-${index}`, file, file.name);
  });
  return formData;
}

export function createStorefrontSupportApi(
  httpClient: HttpClient,
  ensureSession: () => Promise<void>,
  flows: StorefrontFlowContext,
) {
  const base = "/v1/storefront/conversations";
  const conversationPath = (id: string) => `${base}/${segment(id)}`;
  const proposalPath = (conversationId: string, messageId: string, proposalId: string) =>
    `${conversationPath(conversationId)}/messages/${segment(messageId)}/proposals/${segment(proposalId)}`;

  return {
    conversation: {
      async start(params: StartConversationParams, options?: RequestOptions): Promise<StorefrontConversationReply> {
        if (typeof params.flow_key !== "string" || !isValidKey(params.flow_key)) {
          throw new TypeError("A chat starts on a support flow: pass its flow_key, an exact key");
        }
        const subject = params.subject ?? "";
        const send = (id: string) =>
          httpClient.post<StorefrontConversationReply>(
            base,
            { id, language: params.language, flow_key: params.flow_key, subject },
            options,
          );
        if (params.id !== undefined) {
          requireId(params.id, "conversation");
          await ensureSession();
          return send(params.id);
        }
        await ensureSession();
        return runDurableCreate({
          key: flows.pendingKey("conversation", params.flow_key),
          label: "support conversation",
          input: { language: params.language, flow_key: params.flow_key, subject },
          appId: () => flows.appId("conversation"),
          send,
          confirms: (reply, id) => reply.conversation.id === id,
        });
      },

      async find(
        params: StorefrontFindConversationsParams = {},
        options?: RequestOptions,
      ): Promise<PaginatedResponse<StorefrontConversationListItem>> {
        await ensureSession();
        return httpClient.get<PaginatedResponse<StorefrontConversationListItem>>(base, { ...options, params });
      },

      async get(params: StorefrontGetConversationParams, options?: RequestOptions): Promise<StorefrontConversation> {
        await ensureSession();
        return httpClient.get<StorefrontConversation>(conversationPath(params.id), options);
      },

      async findMessages(
        params: StorefrontFindConversationMessagesParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<StorefrontConversationMessage>> {
        await ensureSession();
        const { conversation_id, ...query } = params;
        return httpClient.get<PaginatedResponse<StorefrontConversationMessage>>(`${conversationPath(conversation_id)}/messages`, {
          ...options,
          params: query,
        });
      },

      async getMessage(
        params: StorefrontGetConversationMessageParams,
        options?: RequestOptions,
      ): Promise<StorefrontConversationMessage> {
        await ensureSession();
        return httpClient.get<StorefrontConversationMessage>(
          `${conversationPath(params.conversation_id)}/messages/${segment(params.message_id)}`,
          options,
        );
      },

      async getAttachmentLink(
        params: StorefrontGetConversationAttachmentLinkParams,
        options?: RequestOptions,
      ): Promise<ConversationAttachmentLink> {
        await ensureSession();
        return httpClient.get<ConversationAttachmentLink>(
          `${conversationPath(params.conversation_id)}/messages/${segment(params.message_id)}/attachments/${segment(params.sha256)}`,
          options,
        );
      },

      async markRead(params: MarkStorefrontConversationReadParams, options?: RequestOptions): Promise<StorefrontConversation> {
        await ensureSession();
        return httpClient.post<StorefrontConversation>(
          `${conversationPath(params.conversation_id)}/read`,
          { sequence: params.sequence },
          options,
        );
      },

      async confirmProposal(
        params: StorefrontAssistantProposalParams,
        options?: RequestOptions,
      ): Promise<StorefrontConversationMessage> {
        await ensureSession();
        return httpClient.post<StorefrontConversationMessage>(
          `${proposalPath(params.conversation_id, params.message_id, params.proposal_id)}/confirm`,
          undefined,
          options,
        );
      },

      async declineProposal(
        params: StorefrontAssistantProposalParams,
        options?: RequestOptions,
      ): Promise<StorefrontConversationMessage> {
        await ensureSession();
        return httpClient.post<StorefrontConversationMessage>(
          `${proposalPath(params.conversation_id, params.message_id, params.proposal_id)}/decline`,
          undefined,
          options,
        );
      },

      async sendMessage(params: SendConversationMessageParams, options?: RequestOptions): Promise<StorefrontConversationReply> {
        const send = (id: string) =>
          httpClient.post<StorefrontConversationReply>(
            `${conversationPath(params.conversation_id)}/messages`,
            {
              id,
              input: params.input,
              ...(params.prompt_message_id !== undefined ? { prompt_message_id: params.prompt_message_id } : {}),
            },
            options,
          );
        if (params.id !== undefined) {
          requireId(params.id, "conversation message");
          await ensureSession();
          return send(params.id);
        }
        await ensureSession();
        return runDurableCreate({
          key: flows.pendingKey("conversation-message", params.conversation_id),
          label: "support message",
          input: { conversation_id: params.conversation_id, input: params.input, prompt_message_id: params.prompt_message_id ?? null },
          appId: () => flows.appId("conversation message"),
          send,
          confirms: (reply, id) =>
            reply.conversation.id === params.conversation_id && reply.messages.some((message) => message.id === id),
        });
      },
    },
  };
}

export function createAdminSupportApi(apiConfig: ApiConfig) {
  const conversationPath = (storeId: string, id: string) => storeRecordPath(storeId, "conversations", id);

  return {
    flow: {
      find(params: FindSupportFlowsParams, options?: RequestOptions): Promise<PaginatedResponse<SupportFlow>> {
        const { store_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<SupportFlow>>(storePath(store_id, "support-flows"), {
          ...options,
          params: query,
        });
      },

      get(params: GetSupportFlowParams, options?: RequestOptions): Promise<SupportFlow> {
        return apiConfig.httpClient.get<SupportFlow>(storeRecordPath(params.store_id, "support-flows", params.id), options);
      },

      create(params: CreateSupportFlowParams, options?: RequestOptions): Promise<SupportFlow> {
        requireId(params.id, "support flow");
        const { store_id, ...body } = params;
        return apiConfig.httpClient.post<SupportFlow>(storePath(store_id, "support-flows"), body, options);
      },

      update(params: UpdateSupportFlowParams, options?: RequestOptions): Promise<SupportFlow> {
        const { store_id, id, ...body } = params;
        return apiConfig.httpClient.put<SupportFlow>(storeRecordPath(store_id, "support-flows", id), body, options);
      },

      delete(params: DeleteSupportFlowParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
        return apiConfig.httpClient.delete<{ deleted: boolean }>(
          storeRecordPath(params.store_id, "support-flows", params.id),
          { ...options, params: { expected_updated_at: params.expected_updated_at } },
        );
      },
    },

    conversation: {
      startEmail(params: StartEmailConversationParams, options?: RequestOptions): Promise<ConversationReply> {
        requireId(params.id, "conversation");
        requireId(params.message_id, "conversation message");
        const { store_id, ...body } = params;
        return apiConfig.httpClient.post<ConversationReply>(storePath(store_id, "conversations"), body, options);
      },
      find(params: FindConversationsParams, options?: RequestOptions): Promise<PaginatedResponse<Conversation>> {
        const { store_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<Conversation>>(storePath(store_id, "conversations"), {
          ...options,
          params: query,
        });
      },

      get(params: GetConversationParams, options?: RequestOptions): Promise<Conversation> {
        return apiConfig.httpClient.get<Conversation>(conversationPath(params.store_id, params.conversation_id), options);
      },

      findMessages(
        params: FindConversationMessagesParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<ConversationMessage>> {
        const { store_id, conversation_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<ConversationMessage>>(
          `${conversationPath(store_id, conversation_id)}/messages`,
          { ...options, params: query },
        );
      },

      getMessage(params: GetConversationMessageParams, options?: RequestOptions): Promise<ConversationMessage> {
        return apiConfig.httpClient.get<ConversationMessage>(
          `${conversationPath(params.store_id, params.conversation_id)}/messages/${segment(params.message_id)}`,
          options,
        );
      },

      getAttachmentLink(
        params: GetConversationAttachmentLinkParams,
        options?: RequestOptions,
      ): Promise<ConversationAttachmentLink> {
        return apiConfig.httpClient.get<ConversationAttachmentLink>(
          `${conversationPath(params.store_id, params.conversation_id)}/messages/${segment(params.message_id)}/attachments/${segment(params.sha256)}`,
          options,
        );
      },

      startChat(params: StartChatConversationParams, options?: RequestOptions): Promise<ConversationReply> {
        requireId(params.id, "conversation");
        requireId(params.message_id, "conversation message");
        const { store_id, files, ...body } = params;
        return apiConfig.httpClient.post<ConversationReply>(
          storePath(store_id, "conversations/chats"),
          messageWithFiles("chat", body, files),
          options,
        );
      },

      reply(params: ReplyConversationParams, options?: RequestOptions): Promise<ConversationReply> {
        requireId(params.id, "conversation message");
        const { store_id, conversation_id, files, ...body } = params;
        return apiConfig.httpClient.post<ConversationReply>(
          `${conversationPath(store_id, conversation_id)}/messages`,
          messageWithFiles("reply", body, files),
          options,
        );
      },

      changeChatVisibility(
        params: ChangeConversationChatVisibilityParams,
        options?: RequestOptions,
      ): Promise<ConversationMessage> {
        if (typeof params.visible_in_chat !== "boolean") throw new TypeError("Chat visibility needs an explicit choice");
        return apiConfig.httpClient.post<ConversationMessage>(
          `${conversationPath(params.store_id, params.conversation_id)}/messages/${segment(params.message_id)}/chat-visibility`,
          { expected_updated_at: params.expected_updated_at, visible_in_chat: params.visible_in_chat },
          options,
        );
      },

      selectReplyEmail(params: SelectConversationReplyEmailParams, options?: RequestOptions): Promise<Conversation> {
        return apiConfig.httpClient.post<Conversation>(
          `${conversationPath(params.store_id, params.conversation_id)}/reply-email`,
          { expected_reply: params.expected_reply, reply: params.reply },
          options,
        );
      },

      sendSms(params: SendConversationSmsParams, options?: RequestOptions): Promise<ConversationReply> {
        requireId(params.id, "conversation message");
        return apiConfig.httpClient.post<ConversationReply>(
          `${conversationPath(params.store_id, params.conversation_id)}/sms`,
          {
            id: params.id,
            newest_message_sequence: params.newest_message_sequence,
            text: params.text,
            resolve: params.resolve ?? false,
          },
          options,
        );
      },

      sendCustomerSms(params: SendCustomerSmsParams, options?: RequestOptions): Promise<ConversationReply> {
        requireId(params.id, "conversation message");
        return apiConfig.httpClient.post<ConversationReply>(
          `${storeRecordPath(params.store_id, "customers", params.customer_id)}/sms`,
          { id: params.id, text: params.text, resolve: params.resolve ?? false },
          options,
        );
      },

      reopen(params: ReopenConversationParams, options?: RequestOptions): Promise<Conversation> {
        return apiConfig.httpClient.post<Conversation>(
          `${conversationPath(params.store_id, params.conversation_id)}/reopen`,
          { newest_message_sequence: params.newest_message_sequence },
          options,
        );
      },

      resolve(params: ResolveConversationParams, options?: RequestOptions): Promise<Conversation> {
        return apiConfig.httpClient.post<Conversation>(
          `${conversationPath(params.store_id, params.conversation_id)}/resolve`,
          { newest_message_sequence: params.newest_message_sequence },
          options,
        );
      },

      markRead(params: MarkConversationReadParams, options?: RequestOptions): Promise<Conversation> {
        return apiConfig.httpClient.post<Conversation>(
          `${conversationPath(params.store_id, params.conversation_id)}/read`,
          { sequence: params.sequence },
          options,
        );
      },

      markUnread(params: MarkConversationReadParams, options?: RequestOptions): Promise<Conversation> {
        return apiConfig.httpClient.post<Conversation>(
          `${conversationPath(params.store_id, params.conversation_id)}/unread`,
          { sequence: params.sequence },
          options,
        );
      },

      assign(params: AssignConversationParams, options?: RequestOptions): Promise<Conversation> {
        const { store_id, conversation_id, ...body } = params;
        return apiConfig.httpClient.post<Conversation>(`${conversationPath(store_id, conversation_id)}/assign`, body, options);
      },

      notes: createConversationNoteApi(apiConfig),
    },

    call: {
      find(params: FindCallsParams, options?: RequestOptions): Promise<PaginatedResponse<CallListItem>> {
        return apiConfig.httpClient.get<PaginatedResponse<CallListItem>>(storePath(params.store_id, "calls"), {
          ...options,
          params: {
            outcomes: params.outcomes,
            waiting_callback: params.waiting_callback,
            phone_number_id: params.phone_number_id,
            query: params.query,
            limit: params.limit,
            cursor: params.cursor,
          },
        });
      },

      get(params: GetCallParams, options?: RequestOptions): Promise<ConversationMessage> {
        return apiConfig.httpClient.get<ConversationMessage>(
          `${conversationPath(params.store_id, params.conversation_id)}/messages/${segment(params.message_id)}/call`,
          options,
        );
      },

      getRecordingLink(params: GetCallParams, options?: RequestOptions): Promise<CallRecordingLink> {
        return apiConfig.httpClient.get<CallRecordingLink>(
          `${conversationPath(params.store_id, params.conversation_id)}/messages/${segment(params.message_id)}/recording`,
          options,
        );
      },
    },
  };
}
