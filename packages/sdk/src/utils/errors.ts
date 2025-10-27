// Error handling utilities (combined from errorCodes.ts and errorHelpers.ts)

// Comprehensive error code system with both numeric codes and named constants
export const ERROR_CODES = {
    // General errors
    "GENERAL.001": "GENERAL.BAD_REQUEST",
    "GENERAL.002": "GENERAL.VALIDATION_ERROR",
    "GENERAL.003": "GENERAL.FORBIDDEN_ERROR",
    "GENERAL.004": "GENERAL.INTERNAL_SERVER_ERROR",
    "GENERAL.005": "GENERAL.UNAUTHORIZED",
    "GENERAL.006": "GENERAL.UNAUTHENTICATED",

    // Google/OAuth errors
    "GOOGLE.001": "GOOGLE.INVALID_ORIGIN_URI",
    "GOOGLE.002": "GOOGLE.INVALID_REDIRECT_URI",
    "GOOGLE.003": "GOOGLE.FAILED_TO_CALL_API",
    "GOOGLE.004": "GOOGLE.FAILED_LOGIN",
    "GOOGLE.005": "GOOGLE.FAILED_LOGOUT",
    "GOOGLE.006": "GOOGLE.FAILED_REFRESH_TOKEN",
    "GOOGLE.007": "GOOGLE.INVALID_PROVIDER_PASSED",

    // User errors
    "USER.001": "USER.NOT_FOUND",
    "USER.002": "USER.FAILED_TO_CREATE",
    "USER.003": "USER.FAILED_TO_UPDATE",
    "USER.004": "USER.FAILED_TO_DELETE",
    "USER.005": "USER.EMAIL_EXISTS",
    "USER.006": "USER.FAILED_TO_GET_UPLOAD_URL",

    // Business errors
    "BUSINESS.001": "BUSINESS.NOT_FOUND",
    "BUSINESS.002": "BUSINESS.FAILED_TO_CREATE",
    "BUSINESS.003": "BUSINESS.FAILED_TO_UPDATE",
    "BUSINESS.004": "BUSINESS.FAILED_TO_DELETE",
    "BUSINESS.005": "BUSINESS.FAILED_TO_GET_UPLOAD_URL",
    "BUSINESS.006": "BUSINESS.NAME_REQUIRED",
    "BUSINESS.007": "BUSINESS.BUSINESS_ID_REQUIRED",
    "BUSINESS.010": "BUSINESS.DESCRIPTION_REQUIRED",
    "BUSINESS.011": "BUSINESS.SLUG_INVALID",

    // Provider errors  
    "PROVIDER.001": "PROVIDER.NOT_FOUND",
    "PROVIDER.002": "PROVIDER.FAILED_TO_CREATE",
    "PROVIDER.003": "PROVIDER.FAILED_TO_UPDATE",
    "PROVIDER.004": "PROVIDER.FAILED_TO_DELETE",
    "PROVIDER.005": "PROVIDER.FAILED_TO_GET_UPLOAD_URL",
    "PROVIDER.006": "PROVIDER.NAME_REQUIRED",
    "PROVIDER.007": "PROVIDER.BUSINESS_ID_REQUIRED",
    "PROVIDER.008": "PROVIDER.DESCRIPTION_REQUIRED",
};

// Named error constants for direct access
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
    BUSINESS: {
        NOT_FOUND: "BUSINESS.NOT_FOUND",
        FAILED_TO_CREATE: "BUSINESS.FAILED_TO_CREATE",
        FAILED_TO_UPDATE: "BUSINESS.FAILED_TO_UPDATE",
        FAILED_TO_DELETE: "BUSINESS.FAILED_TO_DELETE",
        FAILED_TO_GET_UPLOAD_URL: "BUSINESS.FAILED_TO_GET_UPLOAD_URL",
        NAME_REQUIRED: "BUSINESS.NAME_REQUIRED",
        BUSINESS_ID_REQUIRED: "BUSINESS.BUSINESS_ID_REQUIRED",
        DESCRIPTION_REQUIRED: "BUSINESS.DESCRIPTION_REQUIRED",
        SLUG_INVALID: "BUSINESS.SLUG_INVALID",
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

// Utility functions for error handling
export function getErrorMessage(code: string): string {
    return ERROR_CODES[code as keyof typeof ERROR_CODES] || code;
}

export function isErrorCode(code: string): boolean {
    return code in ERROR_CODES;
}

// Note: transformErrors requires zod which is not a dependency
// If you need zod validation, add it to package.json dependencies
export const transformErrors = (zodError: any): ValidationError[] => {
    const customErrors: ValidationError[] = [];

    if (!zodError.issues) return customErrors;

    zodError.issues.forEach((issue: any) => {
        const field = issue.path.join(".");
        const message = issue.message;

        if (
            !customErrors.some(
                (customError) => customError.field === field && customError.message === message,
            )
        ) {
            customErrors.push({ field, message });
        }
    });

    return customErrors;
};

export const convertServerErrorToRequestError = (
    serverError: ServerError,
    renameRules?: { [key: string]: string },
): RequestError => {
    return {
        ...serverError,
        validationErrors: serverError.validationErrors.map((validationError) => {
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

// Export for backward compatibility
export const errors = ERROR_CONSTANTS;
export default ERROR_CODES;