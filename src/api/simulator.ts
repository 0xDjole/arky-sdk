import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateSimulatorPlannedOutcomeParams,
  FindSimulatedEmailsParams,
  FindSimulatedSmsParams,
  FindSimulatorPlannedOutcomesParams,
  RemoveSimulatorPlannedOutcomeParams,
  SimulatedCall,
  SimulatedEmail,
  SimulatedSms,
  SimulatorPaymentControlParams,
  SimulatorPlannedOutcome,
  SimulatorPlannedOutcomeRemoval,
  StartSimulatedCallParams,
} from "../types/simulator";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

const plannedOutcomes = "simulator/planned-outcomes";

export const createStoreSimulatorApi = (apiConfig: ApiConfig) => {
  const paymentControl = (params: SimulatorPaymentControlParams, verb: string, options?: RequestOptions) =>
    apiConfig.httpClient.post<void>(
      storePath(params.store_id, `simulator/payments/${segment(params.payment_id)}/${verb}`),
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
        const { store_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<SimulatedEmail>>(storePath(store_id, "simulator/emails"), {
          ...options,
          params: query,
        });
      },
    },

    sms: {
      find(params: FindSimulatedSmsParams, options?: RequestOptions): Promise<PaginatedResponse<SimulatedSms>> {
        const { store_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<SimulatedSms>>(storePath(store_id, "simulator/sms"), {
          ...options,
          params: query,
        });
      },
    },

    calls: {
      start(params: StartSimulatedCallParams, options?: RequestOptions): Promise<SimulatedCall> {
        return apiConfig.httpClient.post<SimulatedCall>(
          storePath(params.store_id, "simulator/calls"),
          { to: params.to, from: params.from },
          options,
        );
      },
    },

    plannedOutcomes: {
      create(params: CreateSimulatorPlannedOutcomeParams, options?: RequestOptions): Promise<SimulatorPlannedOutcome> {
        requireId(params.id, "planned outcome");
        const { store_id, ...body } = params;
        return apiConfig.httpClient.post<SimulatorPlannedOutcome>(storePath(store_id, plannedOutcomes), body, options);
      },

      find(params: FindSimulatorPlannedOutcomesParams, options?: RequestOptions): Promise<PaginatedResponse<SimulatorPlannedOutcome>> {
        const { store_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<SimulatorPlannedOutcome>>(storePath(store_id, plannedOutcomes), {
          ...options,
          params: query,
        });
      },

      remove(params: RemoveSimulatorPlannedOutcomeParams, options?: RequestOptions): Promise<SimulatorPlannedOutcomeRemoval> {
        return apiConfig.httpClient.delete<SimulatorPlannedOutcomeRemoval>(
          storeRecordPath(params.store_id, plannedOutcomes, params.id),
          options,
        );
      },
    },
  };
};
