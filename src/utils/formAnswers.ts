import type { EpochMilliseconds } from "../types/time";
import type { Coordinates } from "../types/common";
import type { Form, FormAnswer, FormAnswerErrorCode, FormAnswerInput, FormQuestion, FormValue, FormValues } from "../types/forms";
import { FormAnswerError } from "../types/forms";

function questionError(question: FormQuestion, code: FormAnswerErrorCode, message: string): FormAnswerError {
  return new FormAnswerError(code, question.key, `Invalid value for form question '${question.key}': ${message}`);
}

function isCoordinates(value: unknown): value is Coordinates {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const coordinates = value as Coordinates;
  return (
    Number.isFinite(coordinates.lat) &&
    Number.isFinite(coordinates.lon) &&
    coordinates.lat >= -90 &&
    coordinates.lat <= 90 &&
    coordinates.lon >= -180 &&
    coordinates.lon <= 180
  );
}

function isEmpty(value: FormValue): boolean {
  return (typeof value === "string" && value.trim() === "") || (Array.isArray(value) && value.length === 0);
}

function answerFor(question: FormQuestion, value: FormValue): FormAnswerInput {
  const base = { question_id: question.id, key: question.key };
  switch (question.type) {
    case "text": {
      if (typeof value !== "string") throw questionError(question, "invalid", "expected text");
      if (question.min_length !== null && value.length < question.min_length) {
        throw questionError(question, "too_short", `must be at least ${question.min_length} characters`);
      }
      if (question.max_length !== null && value.length > question.max_length) {
        throw questionError(question, "too_long", `must be at most ${question.max_length} characters`);
      }
      if (question.pattern !== null && !new RegExp(question.pattern).test(value)) {
        throw questionError(question, "pattern_mismatch", "doesn't match the expected format");
      }
      return { ...base, type: "text", value };
    }
    case "email":
      if (typeof value !== "string") throw questionError(question, "invalid", "expected email");
      return { ...base, type: "email", value };
    case "number": {
      if (typeof value !== "number" || !Number.isFinite(value)) throw questionError(question, "invalid", "expected a finite number");
      if (question.min !== null && value < question.min) throw questionError(question, "too_small", `must be at least ${question.min}`);
      if (question.max !== null && value > question.max) throw questionError(question, "too_large", `must be at most ${question.max}`);
      return { ...base, type: "number", value };
    }
    case "boolean":
      if (typeof value !== "boolean") throw questionError(question, "invalid", "expected yes or no");
      return { ...base, type: "boolean", value };
    case "date":
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw questionError(question, "invalid", "expected a day as YYYY-MM-DD");
      }
      return { ...base, type: "date", value };
    case "date_time":
      if (typeof value !== "number" || !Number.isSafeInteger(value)) {
        throw questionError(question, "invalid", "expected a moment in epoch milliseconds");
      }
      return { ...base, type: "date_time", value: value as EpochMilliseconds };
    case "geo_location":
      if (!isCoordinates(value)) throw questionError(question, "invalid", "expected valid coordinates");
      return { ...base, type: "geo_location", value: { lat: value.lat, lon: value.lon } };
    case "select_one":
      if (typeof value !== "string" || !question.options.some((option) => option.key === value)) {
        throw questionError(question, "unknown_option", "expected one of the options");
      }
      return { ...base, type: "select_one", option_key: value };
    case "select_many": {
      if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
        throw questionError(question, "invalid", "expected a list of options");
      }
      const keys = value as string[];
      if (new Set(keys).size !== keys.length || keys.some((key) => !question.options.some((option) => option.key === key))) {
        throw questionError(question, "unknown_option", "contains an unknown or repeated option");
      }
      return { ...base, type: "select_many", option_keys: keys };
    }
    case "file": {
      const FileConstructor = globalThis.File;
      if (!Array.isArray(value) || !FileConstructor || value.some((item) => !(item instanceof FileConstructor))) {
        throw questionError(question, "invalid", "expected a list of files");
      }
      const files = value as File[];
      if (files.length > question.max_files) throw questionError(question, "too_many_files", `allows at most ${question.max_files} files`);
      return { ...base, type: "file", files };
    }
  }
}

export function buildFormAnswers(form: Pick<Form, "questions">, values: FormValues): FormAnswerInput[] {
  const known = new Set(form.questions.map((question) => question.key));
  const unknown = Object.keys(values).find((key) => !known.has(key));
  if (unknown) throw new FormAnswerError("unknown_question", unknown, `Form question '${unknown}' isn't part of the form`);
  const answers: FormAnswerInput[] = [];
  for (const question of form.questions) {
    const value = values[question.key];
    if (value === undefined || value === null || isEmpty(value)) {
      if (question.required) throw questionError(question, "required", "an answer is required");
      continue;
    }
    answers.push(answerFor(question, value));
  }
  return answers;
}

export function formValuesFromAnswers(answers: readonly (FormAnswer | FormAnswerInput)[]): FormValues {
  const values: FormValues = {};
  for (const answer of answers) {
    switch (answer.type) {
      case "select_one":
        values[answer.key] = answer.option_key;
        break;
      case "select_many":
        values[answer.key] = answer.option_keys;
        break;
      case "file":
        break;
      default:
        values[answer.key] = answer.value;
    }
  }
  return values;
}
