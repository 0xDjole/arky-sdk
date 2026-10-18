import type { RequestOptions } from "../types/httpClient";
import type {
  FormAnswerInput,
  KeptFormAnswer,
  KeptFormSubmission,
  StorefrontFormSubmission,
} from "../types/forms";
import type { EpochMilliseconds } from "../types/time";
import {
  clearDurableRequest,
  DurableRequestError,
  durableRequestPayload,
  getOrCreateDurableRequest,
  isDefiniteRefusal,
  readDurableRequest,
  withDurableRequestLock,
  type DurableRequest,
} from "../utils/durableRequest";
import { fingerprint } from "../utils/fingerprint";
import { isCanonicalId, requireId } from "../utils/ids";

const label = "kept form submission";
const answerTypes = ["text", "email", "number", "boolean", "date", "date_time", "geo_location", "select_one", "select_many"];

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function keptAnswer(value: unknown): value is KeptFormAnswer {
  return (
    record(value) &&
    typeof value.type === "string" &&
    answerTypes.includes(value.type) &&
    typeof value.question_id === "string" &&
    typeof value.key === "string"
  );
}

function keptSubmission(saved: DurableRequest): KeptFormSubmission {
  const value = durableRequestPayload(saved);
  if (
    !record(value) ||
    Object.keys(value).length !== 5 ||
    !isCanonicalId(value.id) ||
    typeof value.form_id !== "string" ||
    typeof value.questions_updated_at !== "number" ||
    !Number.isSafeInteger(value.questions_updated_at) ||
    typeof value.language !== "string" ||
    !Array.isArray(value.answers) ||
    !value.answers.every(keptAnswer)
  ) {
    throw new DurableRequestError("storage", `The ${label} can't be read; nothing was sent`);
  }
  return value as unknown as KeptFormSubmission;
}

export interface KeptFormDraft {
  id?: string;
  form_id: string;
  questions_updated_at: EpochMilliseconds;
  language: string;
  answers: FormAnswerInput[];
}

function sameRequest(kept: KeptFormSubmission, params: KeptFormDraft): boolean {
  if (params.id !== undefined && params.id !== kept.id) return false;
  return (
    fingerprint({ form_id: kept.form_id, questions_updated_at: kept.questions_updated_at, language: kept.language, answers: kept.answers }) ===
    fingerprint({ form_id: params.form_id, questions_updated_at: params.questions_updated_at, language: params.language, answers: params.answers })
  );
}

export async function retainFormSubmission(
  key: string,
  params: KeptFormDraft,
  newId: () => string,
): Promise<KeptFormSubmission> {
  const answers = params.answers.filter(keptAnswer);
  if (answers.length !== params.answers.length) {
    throw new TypeError("A kept form submission holds no files; send a form with files through forms.submit");
  }
  return withDurableRequestLock(key, label, async () => {
    const saved = readDurableRequest(key, label);
    if (saved) {
      const kept = keptSubmission(saved);
      if (sameRequest(kept, params)) return kept;
      throw new DurableRequestError("pending", "Another submission of this form is still kept; send it again first");
    }
    const kept: KeptFormSubmission = {
      id: requireId(params.id ?? newId(), "form submission"),
      form_id: params.form_id,
      questions_updated_at: params.questions_updated_at,
      language: params.language,
      answers,
    };
    getOrCreateDurableRequest(key, kept, label);
    return kept;
  });
}

export async function pendingFormSubmission(key: string): Promise<KeptFormSubmission | null> {
  return withDurableRequestLock(key, label, async () => {
    const saved = readDurableRequest(key, label);
    return saved ? keptSubmission(saved) : null;
  });
}

export async function recoverFormSubmission(
  key: string,
  send: (kept: KeptFormSubmission, options?: RequestOptions) => Promise<StorefrontFormSubmission>,
  options?: RequestOptions,
): Promise<StorefrontFormSubmission | null> {
  return withDurableRequestLock(key, label, async () => {
    const saved = readDurableRequest(key, label);
    if (!saved) return null;
    const kept = keptSubmission(saved);
    let submission: StorefrontFormSubmission;
    try {
      submission = await send(kept, options);
    } catch (error) {
      if (isDefiniteRefusal(error)) clearDurableRequest(saved, label);
      throw error;
    }
    if (submission.id !== kept.id || submission.form_id !== kept.form_id || submission.language !== kept.language) {
      throw new DurableRequestError("answer_mismatch", `The ${label} answer names another record; the request is kept for a retry`);
    }
    clearDurableRequest(saved, label);
    return submission;
  });
}
