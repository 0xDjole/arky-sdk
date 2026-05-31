import type { ApiConfig } from "../index";
import type { RequestOptions } from "../types/api";

export interface SupportChatFlowNode {
  type: "message" | "input" | "ai_handoff" | "action";
  text?: string;
  buttons?: string[];
  prompt?: string;
  field?: string;
  input_type?: "text" | "email" | "phone";
  validation?: string;
  system_prompt_override?: string;
  tools?: string[];
  action?: SupportChatAction;
}

export interface SupportChatAction {
  type: "end_chat" | "human_handoff";
  message?: string;
}

export interface SupportChatFlowEdge {
  source: string;
  target: string;
  trigger: EdgeTrigger;
}

export type EdgeTrigger =
  | { type: "button"; label: string }
  | { type: "input"; field: string }
  | { type: "default" };

export interface SupportChatAiConfig {
  integration_id: string;
  system_prompt: string;
  tools: string[];
  max_context_messages: number;
}

export interface SupportChatFlow {
  id: string;
  key: string;
  store_id: string;
  name: string;
  status: "draft" | "active" | "archived";
  entry_node_id: string;
  nodes: Record<string, SupportChatFlowNode>;
  edges: SupportChatFlowEdge[];
  ai_config?: SupportChatAiConfig;
  created_at: number;
  updated_at: number;
}

export interface SupportChatSession {
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

export interface SupportChatMessage {
  id: string;
  store_id: string;
  session_id: string;
  role: "system" | "user" | "assistant" | "staff" | "activity";
  content: string;
  buttons?: string[];
  metadata: Record<string, unknown>;
  created_at: number;
}

export interface SupportChatSessionResponse {
  session: SupportChatSession;
  messages: SupportChatMessage[];
}

export interface StartSupportChatSessionParams {
  store_id: string;
  flow_key?: string;
  metadata?: Record<string, unknown>;
}

export interface SendSupportChatMessageParams {
  store_id: string;
  session_id: string;
  input: { type: "button"; label: string } | { type: "text"; content: string };
}

export interface ReplySupportChatSessionParams {
  store_id: string;
  session_id: string;
  content: string;
  resolve?: boolean;
}

export interface GetSupportChatSessionParams {
  store_id: string;
  session_id: string;
  message_limit?: number;
}

export function createStorefrontSupportChatApi(config: ApiConfig) {
  const { httpClient, storeId } = config;

  return {
    async startSession(
      params: Omit<StartSupportChatSessionParams, "store_id"> = {},
      opts?: RequestOptions
    ): Promise<SupportChatSessionResponse> {
      return httpClient.post(
        `/v1/storefront/${storeId}/support-chat/sessions`,
        { store_id: storeId, ...params },
        opts
      );
    },

    async sendMessage(
      params: Omit<SendSupportChatMessageParams, "store_id">,
      opts?: RequestOptions
    ): Promise<SupportChatSessionResponse> {
      return httpClient.post(
        `/v1/storefront/${storeId}/support-chat/sessions/${params.session_id}/messages`,
        { store_id: storeId, ...params },
        opts
      );
    },

    async getSession(
      params: Omit<GetSupportChatSessionParams, "store_id">,
      opts?: RequestOptions
    ): Promise<SupportChatSessionResponse> {
      return httpClient.get(
        `/v1/storefront/${storeId}/support-chat/sessions/${params.session_id}?store_id=${storeId}`,
        opts
      );
    },
  };
}

export interface CreateSupportChatFlowParams {
  store_id: string;
  key: string;
  name: string;
  status?: "draft" | "active" | "archived";
  entry_node_id: string;
  nodes: Record<string, SupportChatFlowNode>;
  edges: SupportChatFlowEdge[];
  ai_config?: SupportChatAiConfig;
}

export interface UpdateSupportChatFlowParams {
  store_id: string;
  id: string;
  name?: string;
  status?: "draft" | "active" | "archived";
  entry_node_id?: string;
  nodes?: Record<string, SupportChatFlowNode>;
  edges?: SupportChatFlowEdge[];
  ai_config?: SupportChatAiConfig;
}

export function createAdminSupportChatApi(config: ApiConfig) {
  const { httpClient } = config;

  return {
    flow: {
      async create(
        params: CreateSupportChatFlowParams,
        opts?: RequestOptions
      ): Promise<SupportChatFlow> {
        return httpClient.post(
          `/v1/stores/${params.store_id}/support-chat/flows`,
          params,
          opts
        );
      },

      async get(
        params: { store_id: string; id: string },
        opts?: RequestOptions
      ): Promise<SupportChatFlow> {
        return httpClient.get(
          `/v1/stores/${params.store_id}/support-chat/flows/${params.id}?store_id=${params.store_id}`,
          opts
        );
      },

      async find(
        params: { store_id: string; status?: string; limit?: number },
        opts?: RequestOptions
      ): Promise<{ items: SupportChatFlow[]; cursor?: string }> {
        const qs = new URLSearchParams({ store_id: params.store_id });
        if (params.status) qs.set("status", params.status);
        if (params.limit) qs.set("limit", String(params.limit));
        return httpClient.get(
          `/v1/stores/${params.store_id}/support-chat/flows?${qs}`,
          opts
        );
      },

      async update(
        params: UpdateSupportChatFlowParams,
        opts?: RequestOptions
      ): Promise<SupportChatFlow> {
        return httpClient.put(
          `/v1/stores/${params.store_id}/support-chat/flows/${params.id}`,
          params,
          opts
        );
      },

      async delete(
        params: { store_id: string; id: string },
        opts?: RequestOptions
      ): Promise<void> {
        return httpClient.delete(
          `/v1/stores/${params.store_id}/support-chat/flows/${params.id}?store_id=${params.store_id}`,
          opts
        );
      },
    },

    session: {
      async find(
        params: { store_id: string; status?: string; limit?: number },
        opts?: RequestOptions
      ): Promise<{ items: SupportChatSession[]; cursor?: string }> {
        const qs = new URLSearchParams({ store_id: params.store_id });
        if (params.status) qs.set("status", params.status);
        if (params.limit) qs.set("limit", String(params.limit));
        return httpClient.get(
          `/v1/stores/${params.store_id}/support-chat/sessions?${qs}`,
          opts
        );
      },

      async get(
        params: { store_id: string; session_id: string },
        opts?: RequestOptions
      ): Promise<SupportChatSessionResponse> {
        return httpClient.get(
          `/v1/stores/${params.store_id}/support-chat/sessions/${params.session_id}?store_id=${params.store_id}`,
          opts
        );
      },

      async sendMessage(
        params: SendSupportChatMessageParams,
        opts?: RequestOptions
      ): Promise<SupportChatSessionResponse> {
        return httpClient.post(
          `/v1/stores/${params.store_id}/support-chat/sessions/${params.session_id}/messages`,
          params,
          opts
        );
      },

      async reply(
        params: ReplySupportChatSessionParams,
        opts?: RequestOptions
      ): Promise<SupportChatSessionResponse> {
        return httpClient.post(
          `/v1/stores/${params.store_id}/support-chat/sessions/${params.session_id}/reply`,
          params,
          opts
        );
      },
    },
  };
}
