import type { ApiConfig } from "../services/clientTypes";
import type { HttpClient } from "../types/httpClient";
import type { RequestOptions, ScheduledMutationOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  AssignSupportConversationParams,
  CreateSupportChannelParams,
  CreateSupportFlowParams,
  DeleteSupportChannelParams,
  DeleteSupportFlowParams,
  FindSupportChannelsParams,
  FindSupportConversationsParams,
  FindSupportFlowsParams,
  GetSupportAttachmentLinkParams,
  GetSupportChannelParams,
  GetSupportConversationParams,
  GetSupportFlowParams,
  GetSupportMessageParams,
  ReplySupportConversationParams,
  ResolveSupportConversationParams,
  StartSupportConversationParams,
  StorefrontGetSupportConversationParams,
  StorefrontGetSupportMessageParams,
  StorefrontSendSupportMessageParams,
  StorefrontSupportConversationResponse,
  StorefrontSupportConversationStartResponse,
  StorefrontSupportMessage,
  SupportAttachmentLink,
  SupportChannel,
  SupportConversation,
  SupportConversationResponse,
  SupportFlow,
  SupportMessage,
  UpdateSupportChannelParams,
  UpdateSupportFlowParams,
} from "../types/support";
import { requireId } from "../utils/ids";
import {
  pollScheduledResult,
  prepareScheduledMutation,
  scheduledObservationOptions,
} from "../utils/scheduledResult";
import { segment, storePath, storeRecordPath } from "./paths";
import { createSupportConversationNoteApi } from "./note";

function aiReplyPending(message: StorefrontSupportMessage): boolean {
  if (message.type.type !== "customer_chat") return false;
  const reply = message.type.ai_reply.type;
  return reply === "waiting" || reply === "answering";
}

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
  const conversationPath = (id: string) => `/v1/storefront/support/conversations/${segment(id)}`;

  return {
    async startConversation(
      params: StartSupportConversationParams,
      options?: RequestOptions,
    ): Promise<StorefrontSupportConversationStartResponse> {
      requireId(params.id, "support conversation");
      await ensureSession();
      return httpClient.post<StorefrontSupportConversationStartResponse>(
        "/v1/storefront/support/conversations",
        { id: params.id, channel_key: params.channel_key, language: params.language },
        options,
      );
    },

    async getConversation(
      params: StorefrontGetSupportConversationParams,
      options?: RequestOptions,
    ): Promise<StorefrontSupportConversationResponse> {
      await ensureSession();
      const { support_token, conversation_id, ...query } = params;
      return httpClient.get<StorefrontSupportConversationResponse>(conversationPath(conversation_id), {
        ...supportTokenOptions(support_token, options),
        params: query,
      });
    },

    async getMessage(params: StorefrontGetSupportMessageParams, options?: RequestOptions): Promise<StorefrontSupportMessage> {
      await ensureSession();
      return httpClient.get<StorefrontSupportMessage>(
        `${conversationPath(params.conversation_id)}/messages/${segment(params.message_id)}`,
        supportTokenOptions(params.support_token, options),
      );
    },

    async sendMessage(
      params: StorefrontSendSupportMessageParams,
      options?: ScheduledMutationOptions<StorefrontSupportConversationResponse>,
    ): Promise<StorefrontSupportConversationResponse> {
      requireId(params.message_id, "support message");
      await ensureSession();
      const path = conversationPath(params.conversation_id);
      const mutation = prepareScheduledMutation(
        { message_id: params.message_id, input: params.input },
        supportTokenOptions(params.support_token, options),
      );
      const sent = await httpClient.post<StorefrontSupportConversationResponse>(
        `${path}/messages`,
        mutation.body,
        mutation.options,
      );
      await mutation.afterResponse(sent);
      const observe = (signal?: AbortSignal) =>
        httpClient.get<StorefrontSupportMessage>(
          `${path}/messages/${segment(params.message_id)}`,
          scheduledObservationOptions(mutation.options, signal),
        );
      const message = sent.messages.find((item) => item.id === params.message_id) ?? (await observe(options?.signal));
      if (!aiReplyPending(message)) return sent;
      await pollScheduledResult(message, (signal) => observe(signal), aiReplyPending, options?.signal);
      return httpClient.get<StorefrontSupportConversationResponse>(
        path,
        scheduledObservationOptions(mutation.options, options?.signal),
      );
    },
  };
}

export function createAdminSupportApi(apiConfig: ApiConfig) {
  const conversationPath = (storeId: string, id: string) => storeRecordPath(storeId, "support/conversations", id);

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

    channel: {
      find(params: FindSupportChannelsParams, options?: RequestOptions): Promise<PaginatedResponse<SupportChannel>> {
        const { store_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<SupportChannel>>(storePath(store_id, "support/channels"), {
          ...options,
          params: query,
        });
      },

      get(params: GetSupportChannelParams, options?: RequestOptions): Promise<SupportChannel> {
        return apiConfig.httpClient.get<SupportChannel>(
          storeRecordPath(params.store_id, "support/channels", params.id),
          options,
        );
      },

      create(params: CreateSupportChannelParams, options?: RequestOptions): Promise<SupportChannel> {
        requireId(params.id, "support channel");
        const { store_id, ...body } = params;
        return apiConfig.httpClient.post<SupportChannel>(storePath(store_id, "support/channels"), body, options);
      },

      update(params: UpdateSupportChannelParams, options?: RequestOptions): Promise<SupportChannel> {
        const { store_id, id, ...body } = params;
        return apiConfig.httpClient.put<SupportChannel>(storeRecordPath(store_id, "support/channels", id), body, options);
      },

      delete(params: DeleteSupportChannelParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
        return apiConfig.httpClient.delete<{ deleted: boolean }>(
          storeRecordPath(params.store_id, "support/channels", params.id),
          { ...options, params: { expected_updated_at: params.expected_updated_at } },
        );
      },
    },

    conversation: {
      find(
        params: FindSupportConversationsParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<SupportConversation>> {
        const { store_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<SupportConversation>>(
          storePath(store_id, "support/conversations"),
          { ...options, params: query },
        );
      },

      get(params: GetSupportConversationParams, options?: RequestOptions): Promise<SupportConversationResponse> {
        const { store_id, conversation_id, ...query } = params;
        return apiConfig.httpClient.get<SupportConversationResponse>(conversationPath(store_id, conversation_id), {
          ...options,
          params: query,
        });
      },

      getMessage(params: GetSupportMessageParams, options?: RequestOptions): Promise<SupportMessage> {
        return apiConfig.httpClient.get<SupportMessage>(
          `${conversationPath(params.store_id, params.conversation_id)}/messages/${segment(params.message_id)}`,
          options,
        );
      },

      attachmentLink(params: GetSupportAttachmentLinkParams, options?: RequestOptions): Promise<SupportAttachmentLink> {
        return apiConfig.httpClient.get<SupportAttachmentLink>(
          `${conversationPath(params.store_id, params.conversation_id)}/messages/${segment(params.message_id)}/attachments/${segment(params.sha256)}`,
          options,
        );
      },

      reply(params: ReplySupportConversationParams, options?: RequestOptions): Promise<SupportConversationResponse> {
        requireId(params.message_id, "support message");
        const { store_id, conversation_id, ...body } = params;
        return apiConfig.httpClient.post<SupportConversationResponse>(
          `${conversationPath(store_id, conversation_id)}/reply`,
          body,
          options,
        );
      },

      resolve(params: ResolveSupportConversationParams, options?: RequestOptions): Promise<SupportConversation> {
        return apiConfig.httpClient.post<SupportConversation>(
          `${conversationPath(params.store_id, params.conversation_id)}/resolve`,
          { expected_updated_at: params.expected_updated_at },
          options,
        );
      },

      assign(params: AssignSupportConversationParams, options?: RequestOptions): Promise<SupportConversation> {
        const { store_id, conversation_id, ...body } = params;
        return apiConfig.httpClient.post<SupportConversation>(
          `${conversationPath(store_id, conversation_id)}/assign`,
          body,
          options,
        );
      },

      notes: createSupportConversationNoteApi(apiConfig),
    },
  };
}
