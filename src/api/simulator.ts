import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateSimulatorPlannedOutcomeParams,
  FindSimulatedCallConversationsParams,
  FindSimulatedEmailsParams,
  FindSimulatedSmsParams,
  FindSimulatorPlannedOutcomesParams,
  FinishSimulatedCallConversationParams,
  GetSimulatedCallParams,
  RemoveSimulatorPlannedOutcomeParams,
  SetSimulatedCallStatusParams,
  SimulateToolCallParams,
  SimulatedCall,
  SimulatedCallConversation,
  SimulatedEmail,
  SimulatedSms,
  SimulatedToolCall,
  SimulatorPaymentControlParams,
  SimulatorPlannedOutcome,
  SimulatorPlannedOutcomeRemoval,
  StartSimulatedCallParams,
} from "../types/simulator";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

const plannedOutcomes = "simulator/planned-outcomes";
const callConversations = "simulator/calls/conversations";

export const createTenantSimulatorApi = (apiConfig: ApiConfig) => {
  const paymentControl = (params: SimulatorPaymentControlParams, verb: string, options?: RequestOptions) =>
    apiConfig.httpClient.post<void>(
      tenantPath(params.tenant_id, `simulator/payments/${segment(params.payment_id)}/${verb}`),
      undefined,
      options,
    );

  return {
    payments: {
      pay(params: SimulatorPaymentControlParams, options?: RequestOptions): Promise<void> {
        return paymentControl(params, "pay", options);
      },

      decline(params: SimulatorPaymentControlParams, options?: RequestOptions): Promise<void> {
        return paymentControl(params, "decline", options);
      },

      expire(params: SimulatorPaymentControlParams, options?: RequestOptions): Promise<void> {
        return paymentControl(params, "expire", options);
      },
    },

    emails: {
      find(params: FindSimulatedEmailsParams, options?: RequestOptions): Promise<PaginatedResponse<SimulatedEmail>> {
        const { tenant_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<SimulatedEmail>>(tenantPath(tenant_id, "simulator/emails"), {
          ...options,
          params: query,
        });
      },
    },

    sms: {
      find(params: FindSimulatedSmsParams, options?: RequestOptions): Promise<PaginatedResponse<SimulatedSms>> {
        const { tenant_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<SimulatedSms>>(tenantPath(tenant_id, "simulator/sms"), {
          ...options,
          params: query,
        });
      },
    },

    calls: {
      start(params: StartSimulatedCallParams, options?: RequestOptions): Promise<SimulatedCall> {
        return apiConfig.httpClient.post<SimulatedCall>(
          tenantPath(params.tenant_id, "simulator/calls"),
          { to: params.to, from: params.from },
          options,
        );
      },

      get(params: GetSimulatedCallParams, options?: RequestOptions): Promise<SimulatedCall> {
        return apiConfig.httpClient.get<SimulatedCall>(
          tenantPath(params.tenant_id, `simulator/calls/${segment(params.call_sid)}`),
          options,
        );
      },

      setStatus(params: SetSimulatedCallStatusParams, options?: RequestOptions): Promise<SimulatedCall> {
        return apiConfig.httpClient.post<SimulatedCall>(
          tenantPath(params.tenant_id, `simulator/calls/${segment(params.call_sid)}/status`),
          { status: params.status, duration_seconds: params.duration_seconds },
          options,
        );
      },

      findConversations(
        params: FindSimulatedCallConversationsParams,
        options?: RequestOptions,
      ): Promise<PaginatedResponse<SimulatedCallConversation>> {
        const { tenant_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<SimulatedCallConversation>>(tenantPath(tenant_id, callConversations), {
          ...options,
          params: query,
        });
      },

      callTool(params: SimulateToolCallParams, options?: RequestOptions): Promise<SimulatedToolCall> {
        return apiConfig.httpClient.post<SimulatedToolCall>(
          tenantPath(
            params.tenant_id,
            `${callConversations}/${segment(params.conversation_id)}/tools/${segment(params.tool)}`,
          ),
          { parameters: params.parameters, said: params.said },
          options,
        );
      },

      finishConversation(
        params: FinishSimulatedCallConversationParams,
        options?: RequestOptions,
      ): Promise<SimulatedCallConversation> {
        return apiConfig.httpClient.post<SimulatedCallConversation>(
          tenantPath(params.tenant_id, `${callConversations}/${segment(params.conversation_id)}/finish`),
          { transcript: params.transcript },
          options,
        );
      },
    },

    plannedOutcomes: {
      create(params: CreateSimulatorPlannedOutcomeParams, options?: RequestOptions): Promise<SimulatorPlannedOutcome> {
        requireId(params.id, "planned outcome");
        const { tenant_id, ...body } = params;
        return apiConfig.httpClient.post<SimulatorPlannedOutcome>(tenantPath(tenant_id, plannedOutcomes), body, options);
      },

      find(params: FindSimulatorPlannedOutcomesParams, options?: RequestOptions): Promise<PaginatedResponse<SimulatorPlannedOutcome>> {
        const { tenant_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<SimulatorPlannedOutcome>>(tenantPath(tenant_id, plannedOutcomes), {
          ...options,
          params: query,
        });
      },

      remove(params: RemoveSimulatorPlannedOutcomeParams, options?: RequestOptions): Promise<SimulatorPlannedOutcomeRemoval> {
        return apiConfig.httpClient.delete<SimulatorPlannedOutcomeRemoval>(
          tenantRecordPath(params.tenant_id, plannedOutcomes, params.id),
          options,
        );
      },
    },
  };
};
