import type { CalendarDate, EpochMilliseconds } from "./time";
import type {
  AccountActor,
  Coordinates,
  CustomerAuthenticationSnapshot,
  LocalizedText,
  SelectOption,
  SortDirection,
} from "./common";

export type QuestionLabel =
  | { type: "shown"; text: LocalizedText }
  | { type: "hidden" };

interface FormQuestionBase {
  id: string;
  key: string;
  required: boolean;
  label: QuestionLabel;
}

export type FormQuestion =
  | (FormQuestionBase & {
      type: "text";
      min_length: number | null;
      max_length: number | null;
      pattern: string | null;
    })
  | (FormQuestionBase & { type: "number"; min: number | null; max: number | null })
  | (FormQuestionBase & { type: "boolean" })
  | (FormQuestionBase & { type: "date" })
  | (FormQuestionBase & { type: "date_time" })
  | (FormQuestionBase & { type: "geo_location" })
  | (FormQuestionBase & { type: "select_one"; options: SelectOption[] })
  | (FormQuestionBase & { type: "select_many"; options: SelectOption[] })
  | (FormQuestionBase & { type: "file"; max_files: number });

export type FormQuestionType = FormQuestion["type"];

export interface FormStage {
  id: string;
  key: string;
}

export type FormStatus = { type: "active" } | { type: "draft" } | { type: "closed" };

export interface Form {
  id: string;
  store_id: string;
  key: string;
  questions: FormQuestion[];
  stages: FormStage[];
  status: FormStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type FormSubmissionSource =
  | {
      type: "storefront";
      customer_session_id: string;
      authentication: CustomerAuthenticationSnapshot;
    }
  | { type: "account"; actor: AccountActor };

export interface FormQuestionSnapshot {
  question_id: string;
  label: string;
}

export interface FormSubmissionSnapshot {
  form_key: string;
  questions: FormQuestionSnapshot[];
}

export type FileFormat =
  | "jpeg"
  | "png"
  | "webp"
  | "gif"
  | "mp4"
  | "webm"
  | "quicktime"
  | "pdf";

export interface FormFile {
  file_name: string;
  format: FileFormat;
  size_bytes: number;
  sha256: string;
}

export type FormAnswer =
  | { type: "text"; question_id: string; key: string; value: string }
  | { type: "number"; question_id: string; key: string; value: number }
  | { type: "boolean"; question_id: string; key: string; value: boolean }
  | { type: "date"; question_id: string; key: string; value: CalendarDate }
  | { type: "date_time"; question_id: string; key: string; value: EpochMilliseconds }
  | { type: "geo_location"; question_id: string; key: string; value: Coordinates }
  | { type: "select_one"; question_id: string; key: string; option_key: string }
  | { type: "select_many"; question_id: string; key: string; option_keys: string[] }
  | { type: "file"; question_id: string; key: string; files: FormFile[] };

export type FormAnswerInput =
  | Exclude<FormAnswer, { type: "file" }>
  | { type: "file"; question_id: string; key: string; files: File[] };

export type FormValue = string | number | boolean | Coordinates | string[] | File[];

export type FormValues = Record<string, FormValue | null | undefined>;

export interface FormSubmissionStage {
  stage_id: string;
  changed_at: EpochMilliseconds;
}

export interface FormSubmissionStageChange {
  from_stage_id: string;
  to_stage_id: string;
  actor: AccountActor;
  changed_at: EpochMilliseconds;
  note_id: string | null;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  store_id: string;
  customer_id: string;
  company_id: string | null;
  source: FormSubmissionSource;
  language: string;
  snapshot: FormSubmissionSnapshot;
  answers: FormAnswer[];
  stage: FormSubmissionStage;
  stage_history: FormSubmissionStageChange[];
  assignee_account_id: string | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StorefrontFormSubmission {
  id: string;
  form_id: string;
  language: string;
  answers: FormAnswer[];
  stage_id: string;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FormSubmissionFileLink {
  url: string;
  expires_at: EpochMilliseconds;
}

export interface FormSubmissionSelectFilter {
  question_id: string;
  option_keys: string[];
}

export interface FindFormsParams {
  store_id: string;
  ids?: string[];
  key?: string;
  query?: string;
  status?: FormStatus["type"];
  sort_field?: "key" | "status" | "created_at" | "updated_at";
  sort_direction?: SortDirection;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
}

export type GetFormParams = { store_id: string } & ({ id: string } | { key: string });

export interface CreateFormParams {
  store_id: string;
  id: string;
  key: string;
  questions: FormQuestion[];
  stages: FormStage[];
}

export interface UpdateFormParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  questions?: FormQuestion[];
  stages?: FormStage[];
  status?: FormStatus;
}

export interface DeleteFormParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindFormSubmissionsParams {
  store_id: string;
  form_id?: string;
  form_ids?: string[];
  customer_id?: string;
  company_id?: string;
  stage_id?: string;
  assignee_account_id?: string;
  select?: FormSubmissionSelectFilter[];
  query?: string;
  sort_field?: "created_at";
  sort_direction?: SortDirection;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
}

export interface GetFormSubmissionParams {
  store_id: string;
  form_id: string;
  id: string;
}

export interface CreateFormSubmissionParams {
  store_id: string;
  form_id: string;
  id: string;
  customer_id: string;
  language: string;
  answers: FormAnswerInput[];
}

export interface DeleteFormSubmissionParams {
  store_id: string;
  form_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FormSubmissionStageNote {
  id: string;
  body: string;
}

export interface ChangeFormSubmissionStageParams {
  store_id: string;
  form_id: string;
  id: string;
  expected_stage_id: string;
  expected_changed_at: EpochMilliseconds;
  to_stage_id: string;
  note: FormSubmissionStageNote | null;
}

export interface AssignFormSubmissionParams {
  store_id: string;
  form_id: string;
  id: string;
  assignee_account_id: string | null;
}

export interface SetFormSubmissionCompanyParams {
  store_id: string;
  form_id: string;
  id: string;
  company_id: string | null;
}

export interface GetFormSubmissionFileParams {
  store_id: string;
  form_id: string;
  id: string;
  sha256: string;
}

export type GetStorefrontFormParams = { id: string } | { key: string };

export interface SubmitFormParams {
  form_id: string;
  id: string;
  language: string;
  answers: FormAnswerInput[];
}
