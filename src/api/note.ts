import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CompanyNoteTarget,
  UserNoteTarget,
  FormSubmissionNoteTarget,
  Note,
  NoteCreateParams,
  NoteDeleteParams,
  NotePageParams,
  NoteUpdateParams,
  OrderNoteTarget,
  ConversationNoteTarget,
} from "../types/note";
import { requireId } from "../utils/ids";
import { segment, tenantPath } from "./paths";

export interface RecordNoteApi<Target> {
  find(params: Target & NotePageParams, options?: RequestOptions): Promise<PaginatedResponse<Note>>;
  create(params: Target & NoteCreateParams, options?: RequestOptions): Promise<Note>;
  update(params: Target & NoteUpdateParams, options?: RequestOptions): Promise<Note>;
  delete(params: Target & NoteDeleteParams, options?: RequestOptions): Promise<Note>;
}

function recordNotes<Target extends { tenant_id: string }>(
  apiConfig: ApiConfig,
  notesPath: (target: Target) => string,
): RecordNoteApi<Target> {
  return {
    find(params, options) {
      return apiConfig.httpClient.get<PaginatedResponse<Note>>(notesPath(params), {
        ...options,
        params: { limit: params.limit, cursor: params.cursor },
      });
    },
    create(params, options) {
      requireId(params.id, "note");
      return apiConfig.httpClient.post<Note>(notesPath(params), { id: params.id, body: params.body }, options);
    },
    update(params, options) {
      return apiConfig.httpClient.put<Note>(
        `${notesPath(params)}/${segment(params.id)}`,
        { expected_updated_at: params.expected_updated_at, body: params.body },
        options,
      );
    },
    delete(params, options) {
      return apiConfig.httpClient.delete<Note>(`${notesPath(params)}/${segment(params.id)}`, {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },
  };
}

export const createOrderNoteApi = (apiConfig: ApiConfig) =>
  recordNotes<OrderNoteTarget>(apiConfig, (target) => tenantPath(target.tenant_id, `orders/${segment(target.order_id)}/notes`));

export const createUserNoteApi = (apiConfig: ApiConfig) =>
  recordNotes<UserNoteTarget>(apiConfig, (target) =>
    tenantPath(target.tenant_id, `users/${segment(target.user_id)}/notes`),
  );

export const createCompanyNoteApi = (apiConfig: ApiConfig) =>
  recordNotes<CompanyNoteTarget>(apiConfig, (target) =>
    tenantPath(target.tenant_id, `companies/${segment(target.company_id)}/notes`),
  );

export const createFormSubmissionNoteApi = (apiConfig: ApiConfig) =>
  recordNotes<FormSubmissionNoteTarget>(apiConfig, (target) =>
    tenantPath(
      target.tenant_id,
      `forms/${segment(target.form_id)}/submissions/${segment(target.form_submission_id)}/notes`,
    ),
  );

export const createConversationNoteApi = (apiConfig: ApiConfig) =>
  recordNotes<ConversationNoteTarget>(apiConfig, (target) =>
    tenantPath(target.tenant_id, `conversations/${segment(target.conversation_id)}/notes`),
  );
