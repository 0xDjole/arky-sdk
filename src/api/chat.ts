import type { ApiConfig } from "../index";
import type { RequestOptions } from "../types/api";

export interface ChatFlowNode {
  type: "message" | "input" | "ai_handoff" | "action";
  text?: string;
  buttons?: string[];
  prompt?: string;
  field?: string;
  input_type?: "text" | "email" | "phone";
  validation?: string;
  system_prompt_override?: string;
  tools?: string[];
  action?: ChatAction;
}

export interface ChatAction {
  type: "end_chat" | "human_handoff";
  message?: string;
}

export interface ChatFlowEdge {
  source: string;
  target: string;
  trigger: EdgeTrigger;
}

export type EdgeTrigger =
  | { type: "button"; label: string }
  | { type: "input"; field: string }
  | { type: "default" };

export interface ChatAiConfig {
  integration_id: string;
  system_prompt: string;
  tools: string[];
  max_context_messages: number;
}

export interface ChatFlow {
  id: string;
  key: string;
  store_id: string;
  name: string;
  status: "draft" | "active" | "archived";
  entry_node_id: string;
  nodes: Record<string, ChatFlowNode>;
  edges: ChatFlowEdge[];
  ai_config?: ChatAiConfig;
  created_at: number;
  updated_at: number;
}

export interface ChatSession {
  id: string;
  store_id: string;
  flow_id?: string;
  current_node_id?: string;
  profile_id?: string;
  status: "active" | "ai_mode" | "escalated" | "resolved";
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: number;
  updated_at: number;
}

export interface ChatMessage {
  id: string;
  store_id: string;
  session_id: string;
  role: "system" | "user" | "assistant" | "activity";
  content: string;
  buttons?: string[];
  metadata: Record<string, unknown>;
  created_at: number;
}

export interface ChatSessionResponse {
  session: ChatSession;
  messages: ChatMessage[];
}

export interface StartChatSessionParams {
  store_id: string;
  flow_key?: string;
  metadata?: Record<string, unknown>;
}

export interface SendChatMessageParams {
  store_id: string;
  session_id: string;
  input: { type: "button"; label: string } | { type: "text"; content: string };
}

export interface GetChatSessionParams {
  store_id: string;
  session_id: string;
  message_limit?: number;
}

export function createStorefrontChatApi(config: ApiConfig) {
  const { httpClient, storeId } = config;

  return {
    async startSession(
      params: Omit<StartChatSessionParams, "store_id"> = {},
      opts?: RequestOptions
    ): Promise<ChatSessionResponse> {
      return httpClient.post(
        `/v1/storefront/${storeId}/chat/sessions`,
        { store_id: storeId, ...params },
        opts
      );
    },

    async sendMessage(
      params: Omit<SendChatMessageParams, "store_id">,
      opts?: RequestOptions
    ): Promise<ChatSessionResponse> {
      return httpClient.post(
        `/v1/storefront/${storeId}/chat/sessions/${params.session_id}/messages`,
        { store_id: storeId, ...params },
        opts
      );
    },

    async getSession(
      params: Omit<GetChatSessionParams, "store_id">,
      opts?: RequestOptions
    ): Promise<ChatSessionResponse> {
      return httpClient.get(
        `/v1/storefront/${storeId}/chat/sessions/${params.session_id}?store_id=${storeId}`,
        opts
      );
    },
  };
}

export interface CreateChatFlowParams {
  store_id: string;
  key: string;
  name: string;
  status?: "draft" | "active" | "archived";
  entry_node_id: string;
  nodes: Record<string, ChatFlowNode>;
  edges: ChatFlowEdge[];
  ai_config?: ChatAiConfig;
}

export interface UpdateChatFlowParams {
  store_id: string;
  id: string;
  name?: string;
  status?: "draft" | "active" | "archived";
  entry_node_id?: string;
  nodes?: Record<string, ChatFlowNode>;
  edges?: ChatFlowEdge[];
  ai_config?: ChatAiConfig;
}

export function createAdminChatApi(config: ApiConfig) {
  const { httpClient } = config;

  return {
    flow: {
      async create(
        params: CreateChatFlowParams,
        opts?: RequestOptions
      ): Promise<ChatFlow> {
        return httpClient.post(
          `/v1/stores/${params.store_id}/chat/flows`,
          params,
          opts
        );
      },

      async get(
        params: { store_id: string; id: string },
        opts?: RequestOptions
      ): Promise<ChatFlow> {
        return httpClient.get(
          `/v1/stores/${params.store_id}/chat/flows/${params.id}?store_id=${params.store_id}`,
          opts
        );
      },

      async find(
        params: { store_id: string; status?: string; limit?: number },
        opts?: RequestOptions
      ): Promise<{ items: ChatFlow[]; cursor?: string }> {
        const qs = new URLSearchParams({ store_id: params.store_id });
        if (params.status) qs.set("status", params.status);
        if (params.limit) qs.set("limit", String(params.limit));
        return httpClient.get(
          `/v1/stores/${params.store_id}/chat/flows?${qs}`,
          opts
        );
      },

      async update(
        params: UpdateChatFlowParams,
        opts?: RequestOptions
      ): Promise<ChatFlow> {
        return httpClient.put(
          `/v1/stores/${params.store_id}/chat/flows/${params.id}`,
          params,
          opts
        );
      },

      async delete(
        params: { store_id: string; id: string },
        opts?: RequestOptions
      ): Promise<void> {
        return httpClient.delete(
          `/v1/stores/${params.store_id}/chat/flows/${params.id}?store_id=${params.store_id}`,
          opts
        );
      },
    },

    session: {
      async find(
        params: { store_id: string; status?: string; limit?: number },
        opts?: RequestOptions
      ): Promise<{ items: ChatSession[]; cursor?: string }> {
        const qs = new URLSearchParams({ store_id: params.store_id });
        if (params.status) qs.set("status", params.status);
        if (params.limit) qs.set("limit", String(params.limit));
        return httpClient.get(
          `/v1/stores/${params.store_id}/chat/sessions?${qs}`,
          opts
        );
      },

      async get(
        params: { store_id: string; session_id: string },
        opts?: RequestOptions
      ): Promise<ChatSessionResponse> {
        return httpClient.get(
          `/v1/stores/${params.store_id}/chat/sessions/${params.session_id}?store_id=${params.store_id}`,
          opts
        );
      },

      async sendMessage(
        params: SendChatMessageParams,
        opts?: RequestOptions
      ): Promise<ChatSessionResponse> {
        return httpClient.post(
          `/v1/stores/${params.store_id}/chat/sessions/${params.session_id}/messages`,
          params,
          opts
        );
      },
    },
  };
}
