import type { ApiConfig } from "../index";
import type { RequestOptions } from "../types/api";

export type SupportAgentStatus = "draft" | "active" | "archived";
export type SupportChannelStatus = "draft" | "active" | "disabled" | "archived";
export type SupportChannelType = "web" | "email";

export interface SupportAgentNode {
  type: "message" | "input" | "ai_handoff" | "action";
  text?: string;
  buttons?: string[];
  prompt?: string;
  field?: string;
  input_type?: "text" | "email" | "phone";
  validation?: string;
  system_prompt_override?: string;
  tools?: string[];
  action?: SupportAction;
}

export interface SupportAction {
  type: "end_conversation" | "human_handoff";
  message?: string;
}

export interface SupportAgentEdge {
  source: string;
  target: string;
  trigger: EdgeTrigger;
}

export type EdgeTrigger =
  | { type: "button"; label: string }
  | { type: "input"; field: string }
  | { type: "default" };

export interface SupportAgentAiConfig {
  system_prompt: string;
  tools: string[];
  max_context_messages: number;
}

export interface SupportAgent {
  id: string;
  key: string;
  store_id: string;
  name: string;
  status: SupportAgentStatus;
  entry_node_id: string;
  nodes: Record<string, SupportAgentNode>;
  edges: SupportAgentEdge[];
  ai_config?: SupportAgentAiConfig;
  channel_ids: string[];
  notes?: string | null;
  created_at: number;
  updated_at: number;
}

export type SupportChannelConfig =
  | {
      type: "web";
      widget_key: string;
      allowed_origins?: string[];
    }
  | {
      type: "email";
      mailbox_id: string;
    };

export interface SupportChannel {
  id: string;
  store_id: string;
  key: string;
  name: string;
  status: SupportChannelStatus;
  channel_type: SupportChannelType;
  config: SupportChannelConfig;
  created_at: number;
  updated_at: number;
}

export type SupportConversationChannelContext =
  | {
      type: "web";
      visitor_id?: string | null;
      session_id?: string | null;
    }
  | {
      type: "email";
      thread_id: string;
      reply_to: string;
      message_id?: string | null;
      references: string[];
    };

export interface SupportConversation {
  id: string;
  store_id: string;
  agent_id?: string;
  channel_id?: string | null;
  channel_type: SupportChannelType;
  channel_context: SupportConversationChannelContext;
  current_node_id?: string;
  contact_id?: string;
  assigned_account_id?: string | null;
  status: "active" | "ai_mode" | "escalated" | "resolved";
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: number;
  updated_at: number;
}

export interface SupportMessage {
  id: string;
  store_id: string;
  conversation_id: string;
  role: "system" | "user" | "assistant" | "staff" | "action";
  content: string;
  buttons?: string[];
  metadata: Record<string, unknown>;
  created_at: number;
}

export interface SupportConversationResponse {
  conversation: SupportConversation;
  messages: SupportMessage[];
}

export interface StartSupportConversationParams {
  store_id: string;
  agent_key?: string;
  channel_id?: string;
  visitor_id?: string;
  session_id?: string;
  contact_id?: string;
  metadata?: Record<string, unknown>;
}

export interface SendSupportMessageParams {
  store_id: string;
  conversation_id: string;
  input: { type: "button"; label: string } | { type: "text"; content: string };
}

export interface ReceiveSupportChannelMessageParams {
  store_id: string;
  channel_id: string;
  channel_context: SupportConversationChannelContext;
  external_message_id?: string;
  content: string;
  metadata?: Record<string, unknown>;
  received_at?: number;
}

export interface ReplySupportConversationParams {
  store_id: string;
  conversation_id: string;
  content: string;
  resolve?: boolean;
}

export interface ResolveSupportConversationParams {
  store_id: string;
  conversation_id: string;
}

export interface AssignSupportConversationParams {
  store_id: string;
  conversation_id: string;
  account_id?: string | null;
}

export interface GetSupportConversationParams {
  store_id: string;
  conversation_id: string;
  message_limit?: number;
  after_created_at?: number;
  after_id?: string;
}

export interface FindSupportConversationsParams {
  store_id: string;
  status?: string;
  agent_id?: string;
  channel_id?: string;
  channel_type?: SupportChannelType;
  query?: string;
  limit?: number;
  cursor?: string;
}

function supportConversationQuery(params: GetSupportConversationParams): string {
  const qs = new URLSearchParams({ store_id: params.store_id });
  if (params.message_limit) qs.set("message_limit", String(params.message_limit));
  if (typeof params.after_created_at === "number") qs.set("after_created_at", String(params.after_created_at));
  if (params.after_id) qs.set("after_id", params.after_id);
  return qs.toString();
}

export function createStorefrontSupportApi(config: ApiConfig) {
  const { httpClient, storeId } = config;

  return {
    async startConversation(
      params: Omit<StartSupportConversationParams, "store_id"> = {},
      opts?: RequestOptions
    ): Promise<SupportConversationResponse> {
      return httpClient.post(
        `/v1/storefront/${storeId}/support/conversations`,
        { store_id: storeId, ...params },
        opts
      );
    },

    async sendMessage(
      params: Omit<SendSupportMessageParams, "store_id">,
      opts?: RequestOptions
    ): Promise<SupportConversationResponse> {
      return httpClient.post(
        `/v1/storefront/${storeId}/support/conversations/${params.conversation_id}/messages`,
        { store_id: storeId, ...params },
        opts
      );
    },

    async getConversation(
      params: Omit<GetSupportConversationParams, "store_id">,
      opts?: RequestOptions
    ): Promise<SupportConversationResponse> {
      const qs = supportConversationQuery({ store_id: storeId, ...params });
      return httpClient.get(
        `/v1/storefront/${storeId}/support/conversations/${params.conversation_id}?${qs}`,
        opts
      );
    },
  };
}

export interface CreateSupportAgentParams {
  store_id: string;
  key: string;
  name: string;
  status?: SupportAgentStatus;
  entry_node_id: string;
  nodes: Record<string, SupportAgentNode>;
  edges: SupportAgentEdge[];
  ai_config?: SupportAgentAiConfig;
  channel_ids?: string[];
  notes?: string | null;
}

export interface UpdateSupportAgentParams {
  store_id: string;
  id: string;
  name?: string;
  status?: SupportAgentStatus;
  entry_node_id?: string;
  nodes?: Record<string, SupportAgentNode>;
  edges?: SupportAgentEdge[];
  ai_config?: SupportAgentAiConfig;
  channel_ids?: string[];
  notes?: string | null;
}

export interface CreateSupportChannelParams {
  store_id: string;
  key: string;
  name: string;
  status?: SupportChannelStatus;
  channel_type: SupportChannelType;
  config: SupportChannelConfig;
}

export interface UpdateSupportChannelParams {
  store_id: string;
  id: string;
  key?: string;
  name?: string;
  status?: SupportChannelStatus;
  channel_type?: SupportChannelType;
  config?: SupportChannelConfig;
}

export interface FindSupportChannelsParams {
  store_id: string;
  status?: SupportChannelStatus;
  channel_type?: SupportChannelType;
  limit?: number;
  cursor?: string;
}

export function createAdminSupportApi(config: ApiConfig) {
  const { httpClient } = config;

  return {
    channel: {
      async create(
        params: CreateSupportChannelParams,
        opts?: RequestOptions
      ): Promise<SupportChannel> {
        return httpClient.post(
          `/v1/stores/${params.store_id}/support/channels`,
          params,
          opts
        );
      },

      async get(
        params: { store_id: string; id: string },
        opts?: RequestOptions
      ): Promise<SupportChannel> {
        return httpClient.get(
          `/v1/stores/${params.store_id}/support/channels/${params.id}?store_id=${params.store_id}`,
          opts
        );
      },

      async find(
        params: FindSupportChannelsParams,
        opts?: RequestOptions
      ): Promise<{ items: SupportChannel[]; cursor?: string }> {
        const qs = new URLSearchParams({ store_id: params.store_id });
        if (params.status) qs.set("status", params.status);
        if (params.channel_type) qs.set("channel_type", params.channel_type);
        if (params.limit) qs.set("limit", String(params.limit));
        if (params.cursor) qs.set("cursor", params.cursor);
        return httpClient.get(
          `/v1/stores/${params.store_id}/support/channels?${qs}`,
          opts
        );
      },

      async update(
        params: UpdateSupportChannelParams,
        opts?: RequestOptions
      ): Promise<SupportChannel> {
        return httpClient.put(
          `/v1/stores/${params.store_id}/support/channels/${params.id}`,
          params,
          opts
        );
      },

      async delete(
        params: { store_id: string; id: string },
        opts?: RequestOptions
      ): Promise<void> {
        return httpClient.delete(
          `/v1/stores/${params.store_id}/support/channels/${params.id}?store_id=${params.store_id}`,
          opts
        );
      },

      async receiveMessage(
        params: ReceiveSupportChannelMessageParams,
        opts?: RequestOptions
      ): Promise<SupportConversationResponse> {
        return httpClient.post(
          `/v1/stores/${params.store_id}/support/channels/${params.channel_id}/messages`,
          params,
          opts
        );
      },
    },

    agent: {
      async create(
        params: CreateSupportAgentParams,
        opts?: RequestOptions
      ): Promise<SupportAgent> {
        return httpClient.post(
          `/v1/stores/${params.store_id}/support/agents`,
          params,
          opts
        );
      },

      async get(
        params: { store_id: string; id: string },
        opts?: RequestOptions
      ): Promise<SupportAgent> {
        return httpClient.get(
          `/v1/stores/${params.store_id}/support/agents/${params.id}?store_id=${params.store_id}`,
          opts
        );
      },

      async find(
        params: { store_id: string; status?: string; limit?: number; cursor?: string },
        opts?: RequestOptions
      ): Promise<{ items: SupportAgent[]; cursor?: string }> {
        const qs = new URLSearchParams({ store_id: params.store_id });
        if (params.status) qs.set("status", params.status);
        if (params.limit) qs.set("limit", String(params.limit));
        if (params.cursor) qs.set("cursor", params.cursor);
        return httpClient.get(
          `/v1/stores/${params.store_id}/support/agents?${qs}`,
          opts
        );
      },

      async update(
        params: UpdateSupportAgentParams,
        opts?: RequestOptions
      ): Promise<SupportAgent> {
        return httpClient.put(
          `/v1/stores/${params.store_id}/support/agents/${params.id}`,
          params,
          opts
        );
      },

      async delete(
        params: { store_id: string; id: string },
        opts?: RequestOptions
      ): Promise<void> {
        return httpClient.delete(
          `/v1/stores/${params.store_id}/support/agents/${params.id}?store_id=${params.store_id}`,
          opts
        );
      },
    },

    conversation: {
      async find(
        params: FindSupportConversationsParams,
        opts?: RequestOptions
      ): Promise<{ items: SupportConversation[]; cursor?: string }> {
        const qs = new URLSearchParams({ store_id: params.store_id });
        if (params.status) qs.set("status", params.status);
        if (params.agent_id) qs.set("agent_id", params.agent_id);
        if (params.channel_id) qs.set("channel_id", params.channel_id);
        if (params.channel_type) qs.set("channel_type", params.channel_type);
        if (params.query) qs.set("query", params.query);
        if (params.limit) qs.set("limit", String(params.limit));
        if (params.cursor) qs.set("cursor", params.cursor);
        return httpClient.get(
          `/v1/stores/${params.store_id}/support/conversations?${qs}`,
          opts
        );
      },

      async get(
        params: GetSupportConversationParams,
        opts?: RequestOptions
      ): Promise<SupportConversationResponse> {
        const qs = supportConversationQuery(params);
        return httpClient.get(
          `/v1/stores/${params.store_id}/support/conversations/${params.conversation_id}?${qs}`,
          opts
        );
      },

      async sendMessage(
        params: SendSupportMessageParams,
        opts?: RequestOptions
      ): Promise<SupportConversationResponse> {
        return httpClient.post(
          `/v1/stores/${params.store_id}/support/conversations/${params.conversation_id}/messages`,
          params,
          opts
        );
      },

      async reply(
        params: ReplySupportConversationParams,
        opts?: RequestOptions
      ): Promise<SupportConversationResponse> {
        return httpClient.post(
          `/v1/stores/${params.store_id}/support/conversations/${params.conversation_id}/reply`,
          params,
          opts
        );
      },

      async resolve(
        params: ResolveSupportConversationParams,
        opts?: RequestOptions
      ): Promise<SupportConversation> {
        return httpClient.post(
          `/v1/stores/${params.store_id}/support/conversations/${params.conversation_id}/resolve`,
          params,
          opts
        );
      },

      async assign(
        params: AssignSupportConversationParams,
        opts?: RequestOptions
      ): Promise<SupportConversation> {
        return httpClient.post(
          `/v1/stores/${params.store_id}/support/conversations/${params.conversation_id}/assign`,
          params,
          opts
        );
      },
    },
  };
}
