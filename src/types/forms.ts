import { ArkyError } from "./apiError";
import type { AlertRecipient, Email } from "./notification";
import type { CalendarDate, EpochMilliseconds } from "./time";
import type {
  AccountActor,
  Coordinates,
  CustomerAuthenticationSnapshot,
  EmailContact,
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
  | (FormQuestionBase & { type: "email" })
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

export interface FormEmails {
  received: Email | null;
  stage_changed: Record<string, Email>;
  new_submission_alert: Email | null;
  alert_recipients: AlertRecipient[];
}

export interface Form {
  id: string;
  store_id: string;
  key: string;
  emails: FormEmails;
  questions: FormQuestion[];
  stages: FormStage[];
  status: FormStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  questions_updated_at: EpochMilliseconds;
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

export interface FormOptionSnapshot {
  question_id: string;
  option_key: string;
  label: string;
}

export interface FormSubmissionSnapshot {
  form_key: string;
  questions: FormQuestionSnapshot[];
  options: FormOptionSnapshot[];
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
  | { type: "email"; question_id: string; key: string; value: string }
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
  source: FormSubmissionSource;
  language: string;
  email_contact: EmailContact | null;
  snapshot: FormSubmissionSnapshot;
  answers: FormAnswer[];
  stage: FormSubmissionStage;
  stage_history: FormSubmissionStageChange[];
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

export interface GetFormParams {
  store_id: string;
  id: string;
}

export interface GetFormByKeyParams {
  store_id: string;
  key: string;
}

export interface CreateFormParams {
  emails?: FormEmails;
  store_id: string;
  id: string;
  key: string;
  questions: FormQuestion[];
  stages: FormStage[];
}

export interface UpdateFormParams {
  emails?: FormEmails;
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
  stage_id?: string;
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

export interface GetFormSubmissionFileParams {
  store_id: string;
  form_id: string;
  id: string;
  sha256: string;
}

export interface GetStorefrontFormParams {
  id: string;
}

export interface GetStorefrontFormByKeyParams {
  key: string;
}

export interface SubmitFormRequest {
  bot_check_token?: string;
  form_id: string;
  questions_updated_at: EpochMilliseconds;
  id: string;
  language: string;
  answers: FormAnswerInput[];
}

export interface FormAnswersInput {
  form_id: string;
  questions_updated_at: EpochMilliseconds;
  answers: FormAnswerInput[];
}

export interface FormValuesInput {
  form: Pick<Form, "id" | "questions" | "questions_updated_at">;
  values: FormValues;
}

export type SubmitFormParams = (FormAnswersInput | FormValuesInput) & {
  id?: string;
  language: string;
  bot_check_token?: string;
};

export type KeptFormAnswer = Exclude<FormAnswer, { type: "file" }>;

export interface KeptFormSubmission {
  id: string;
  form_id: string;
  questions_updated_at: EpochMilliseconds;
  language: string;
  answers: KeptFormAnswer[];
}

export interface KeptFormAnswersInput {
  form_id: string;
  questions_updated_at: EpochMilliseconds;
  answers: KeptFormAnswer[];
}

export type RetainFormSubmissionParams = (KeptFormAnswersInput | FormValuesInput) & {
  id?: string;
  language: string;
};

export interface PendingFormSubmissionParams {
  form_id: string;
}

export interface RecoverFormSubmissionParams {
  form_id: string;
  bot_check_token?: string;
}

export type FormAnswerErrorCode =
  | "unknown_question"
  | "required"
  | "invalid"
  | "too_short"
  | "too_long"
  | "pattern_mismatch"
  | "too_small"
  | "too_large"
  | "unknown_option"
  | "too_many_files"
  | "file_size"
  | "files_too_large"
  | "file_name";

const formAnswerErrorBrand = Symbol.for("arky.FormAnswerError");

export class FormAnswerError extends ArkyError {
  readonly name: string = "FormAnswerError";
  readonly [formAnswerErrorBrand] = true;

  static [Symbol.hasInstance](value: unknown): boolean {
    return value instanceof Error && formAnswerErrorBrand in value;
  }

  constructor(
    readonly code: FormAnswerErrorCode,
    readonly questionKey: string | null,
    message: string,
  ) {
    super(code, message);
  }
}
