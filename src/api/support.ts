import type { ApiConfig } from "../services/clientTypes";
import type { HttpClient } from "../types/httpClient";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  AssignConversationParams,
  Conversation,
  ConversationAttachmentLink,
  ConversationMessage,
  ConversationReply,
  CreateSupportFlowParams,
  DeleteSupportFlowParams,
  FindConversationMessagesParams,
  FindConversationsParams,
  FindSupportFlowsParams,
  GetConversationAttachmentLinkParams,
  GetConversationMessageParams,
  GetConversationParams,
  GetSupportFlowParams,
  ReplyConversationParams,
  ResolveConversationParams,
  SelectConversationSendingAddressParams,
  SendConversationMessageParams,
  StartConversationParams,
  StorefrontConversation,
  StorefrontConversationMessage,
  StorefrontConversationReply,
  StorefrontConversationStart,
  StorefrontFindConversationMessagesParams,
  StorefrontGetConversationMessageParams,
  StorefrontGetConversationParams,
  SupportFlow,
  UpdateSupportFlowParams,
} from "../types/support";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";
import { createConversationNoteApi } from "./note";

function supportTokenOptions<T>(supportToken: string, options?: RequestOptions<T>): RequestOptions<T> {
  if (typeof supportToken !== "string" || supportToken.length === 0) {
    throw new Error("A support chat needs the token its start returned");
  }
  const headers = { ...options?.headers };
  for (const name of Object.keys(headers)) {
    if (name.toLowerCase() === "x-arky-support-token") delete headers[name];
  }
  return { ...options, headers: { ...headers, "X-Arky-Support-Token": supportToken } };
}

export function createStorefrontSupportApi(httpClient: HttpClient, ensureSession: () => Promise<void>) {
  const base = "/v1/storefront/conversations";
  const conversationPath = (id: string) => `${base}/${segment(id)}`;

  return {
    conversation: {
      async start(params: StartConversationParams, options?: RequestOptions): Promise<StorefrontConversationStart> {
        requireId(params.id, "conversation");
        await ensureSession();
        return httpClient.post<StorefrontConversationStart>(
          base,
          {
            id: params.id,
            language: params.language,
            ...(params.flow_key !== undefined ? { flow_key: params.flow_key } : {}),
          },
          options,
        );
      },

      async get(params: StorefrontGetConversationParams, options?: RequestOptions): Promise<StorefrontConversation> {
        await ensureSession();
        return httpClient.get<StorefrontConversation>(
          conversationPath(params.conversation_id),
          supportTokenOptions(params.support_token, options),
        );
      },

      async findMessages(
        params: StorefrontFindConversationMessagesParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<StorefrontConversationMessage>> {
        await ensureSession();
        const { support_token, conversation_id, ...query } = params;
        return httpClient.get<PaginatedResponse<StorefrontConversationMessage>>(`${conversationPath(conversation_id)}/messages`, {
          ...supportTokenOptions(support_token, options),
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
          supportTokenOptions(params.support_token, options),
        );
      },

      async sendMessage(params: SendConversationMessageParams, options?: RequestOptions): Promise<StorefrontConversationReply> {
        requireId(params.id, "conversation message");
        await ensureSession();
        return httpClient.post<StorefrontConversationReply>(
          `${conversationPath(params.conversation_id)}/messages`,
          {
            id: params.id,
            input: params.input,
            ...(params.prompt_message_id !== undefined ? { prompt_message_id: params.prompt_message_id } : {}),
          },
          supportTokenOptions(params.support_token, options),
        );
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

      attachmentLink(
        params: GetConversationAttachmentLinkParams,
        options?: RequestOptions,
      ): Promise<ConversationAttachmentLink> {
        return apiConfig.httpClient.get<ConversationAttachmentLink>(
          `${conversationPath(params.store_id, params.conversation_id)}/messages/${segment(params.message_id)}/attachments/${segment(params.sha256)}`,
          options,
        );
      },

      reply(params: ReplyConversationParams, options?: RequestOptions): Promise<ConversationReply> {
        requireId(params.id, "conversation message");
        const { store_id, conversation_id, ...body } = params;
        return apiConfig.httpClient.post<ConversationReply>(
          `${conversationPath(store_id, conversation_id)}/messages`,
          body,
          options,
        );
      },

      selectSendingAddress(params: SelectConversationSendingAddressParams, options?: RequestOptions): Promise<Conversation> {
        const { store_id, conversation_id, ...body } = params;
        return apiConfig.httpClient.post<Conversation>(
          `${conversationPath(store_id, conversation_id)}/select-sending-address`,
          body,
          options,
        );
      },

      resolve(params: ResolveConversationParams, options?: RequestOptions): Promise<Conversation> {
        return apiConfig.httpClient.post<Conversation>(
          `${conversationPath(params.store_id, params.conversation_id)}/resolve`,
          { expected_updated_at: params.expected_updated_at },
          options,
        );
      },

      assign(params: AssignConversationParams, options?: RequestOptions): Promise<Conversation> {
        const { store_id, conversation_id, ...body } = params;
        return apiConfig.httpClient.post<Conversation>(`${conversationPath(store_id, conversation_id)}/assign`, body, options);
      },

      notes: createConversationNoteApi(apiConfig),
    },
  };
}
