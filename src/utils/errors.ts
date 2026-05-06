
export const ERROR_CODES = {
  
  "GENERAL.001": "GENERAL.BAD_REQUEST",
  "GENERAL.002": "GENERAL.VALIDATION_ERROR",
  "GENERAL.003": "GENERAL.FORBIDDEN_ERROR",
  "GENERAL.004": "GENERAL.INTERNAL_SERVER_ERROR",
  "GENERAL.005": "GENERAL.UNAUTHORIZED",
  "GENERAL.006": "GENERAL.UNAUTHENTICATED",

  "GOOGLE.001": "GOOGLE.INVALID_ORIGIN_URI",
  "GOOGLE.002": "GOOGLE.INVALID_REDIRECT_URI",
  "GOOGLE.003": "GOOGLE.FAILED_TO_CALL_API",
  "GOOGLE.004": "GOOGLE.FAILED_LOGIN",
  "GOOGLE.005": "GOOGLE.FAILED_LOGOUT",
  "GOOGLE.006": "GOOGLE.FAILED_REFRESH_TOKEN",
  "GOOGLE.007": "GOOGLE.INVALID_PROVIDER_PASSED",

  "USER.001": "USER.NOT_FOUND",
  "USER.002": "USER.FAILED_TO_CREATE",
  "USER.003": "USER.FAILED_TO_UPDATE",
  "USER.004": "USER.FAILED_TO_DELETE",
  "USER.005": "USER.EMAIL_EXISTS",
  "USER.006": "USER.FAILED_TO_GET_UPLOAD_URL",

  "STORE.001": "STORE.NOT_FOUND",
  "STORE.002": "STORE.FAILED_TO_CREATE",
  "STORE.003": "STORE.FAILED_TO_UPDATE",
  "STORE.004": "STORE.FAILED_TO_DELETE",
  "STORE.005": "STORE.FAILED_TO_GET_UPLOAD_URL",
  "STORE.006": "STORE.NAME_REQUIRED",
  "STORE.007": "STORE.STORE_ID_REQUIRED",
  "STORE.010": "STORE.DESCRIPTION_REQUIRED",
  "STORE.011": "STORE.SLUG_INVALID",

  "PROVIDER.001": "PROVIDER.NOT_FOUND",
  "PROVIDER.002": "PROVIDER.FAILED_TO_CREATE",
  "PROVIDER.003": "PROVIDER.FAILED_TO_UPDATE",
  "PROVIDER.004": "PROVIDER.FAILED_TO_DELETE",
  "PROVIDER.005": "PROVIDER.FAILED_TO_GET_UPLOAD_URL",
  "PROVIDER.006": "PROVIDER.NAME_REQUIRED",
  "PROVIDER.007": "PROVIDER.STORE_ID_REQUIRED",
  "PROVIDER.008": "PROVIDER.DESCRIPTION_REQUIRED",
};

export const ERROR_CONSTANTS = {
  GENERAL: {
    BAD_REQUEST: "GENERAL.BAD_REQUEST",
    VALIDATION_ERROR: "GENERAL.VALIDATION_ERROR",
    FORBIDDEN_ERROR: "GENERAL.FORBIDDEN_ERROR",
    INTERNAL_SERVER_ERROR: "GENERAL.INTERNAL_SERVER_ERROR",
    UNAUTHORIZED: "GENERAL.UNAUTHORIZED",
    UNAUTHENTICATED: "GENERAL.UNAUTHENTICATED",
  },
  USER: {
    NOT_FOUND: "USER.NOT_FOUND",
    FAILED_TO_CREATE: "USER.FAILED_TO_CREATE",
    FAILED_TO_UPDATE: "USER.FAILED_TO_UPDATE",
    FAILED_TO_DELETE: "USER.FAILED_TO_DELETE",
    EMAIL_EXISTS: "USER.EMAIL_EXISTS",
    FAILED_TO_GET_UPLOAD_URL: "USER.FAILED_TO_GET_UPLOAD_URL",
  },
  STORE: {
    NOT_FOUND: "STORE.NOT_FOUND",
    FAILED_TO_CREATE: "STORE.FAILED_TO_CREATE",
    FAILED_TO_UPDATE: "STORE.FAILED_TO_UPDATE",
    FAILED_TO_DELETE: "STORE.FAILED_TO_DELETE",
    FAILED_TO_GET_UPLOAD_URL: "STORE.FAILED_TO_GET_UPLOAD_URL",
    NAME_REQUIRED: "STORE.NAME_REQUIRED",
    STORE_ID_REQUIRED: "STORE.STORE_ID_REQUIRED",
    DESCRIPTION_REQUIRED: "STORE.DESCRIPTION_REQUIRED",
    SLUG_INVALID: "STORE.SLUG_INVALID",
  },
};

export type ServerError = {
  message: string;
  error: string;
  statusCode: number;
  validationErrors: {
    field: string;
    error: string;
  }[];
};

export type ValidationError = {
  field: string;
  error: string;
};

export type RequestError = {
  validationErrors: ValidationError[];
};

export function getErrorMessage(code: string): string {
  return ERROR_CODES[code as keyof typeof ERROR_CODES] || code;
}

export function isErrorCode(code: string): boolean {
  return code in ERROR_CODES;
}

export const transformErrors = (zodError: any): ValidationError[] => {
  const customErrors: ValidationError[] = [];

  if (!zodError.issues) return customErrors;

  zodError.issues.forEach((issue: any) => {
    const field = issue.path.join(".");
    const error = issue.message;

    if (
      !customErrors.some(
        (customError) =>
          customError.field === field && customError.error === error
      )
    ) {
      customErrors.push({ field, error });
    }
  });

  return customErrors;
};

export const convertServerErrorToRequestError = (
  serverError: ServerError,
  renameRules?: { [key: string]: string }
): RequestError => {
  const validationErrors = serverError?.validationErrors ?? [];

  return {
    ...serverError,
    validationErrors: validationErrors.map((validationError) => {
      const field =
        renameRules && renameRules[validationError.field]
          ? renameRules[validationError.field]
          : validationError.field;

      return {
        field: field,
        error: validationError.error || "GENERAL.VALIDATION_ERROR",
      };
    }),
  };
};

export const errors = ERROR_CONSTANTS;
export default ERROR_CODES;
