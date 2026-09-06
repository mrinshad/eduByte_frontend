// lib/api-error.ts

export interface ParsedApiError {
  status?: number;
  message: string;
  /** Form field this error should be attached to, if we could infer one (mainly for 409s) */
  field?: string;
  /** true when the session/token is invalid or expired — callers should redirect to login */
  isAuthError?: boolean;
}

/** keyword found in backend message -> which field + friendly message to show (used for 409s) */
export interface DuplicateFieldMap {
  [keyword: string]: { field: string; message: string };
}

// Default, generic message per status code. Used whenever the backend
// doesn't give us anything more specific, or as a fallback wording.
const STATUS_MESSAGES: Record<number, string> = {
  400: "Invalid or incorrect data. Please check the form and try again.",
  401: "Your session has expired. Please log in again.",
  404: "The requested record could not be found.",
  409: "This value already exists. Please use a different one.",
  500: "Something went wrong on our end. Please try again shortly.",
};

function getStatusFromError(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    // Some wrappers throw a raw string like "API Error: 409"
    if (typeof error === "string") {
      const match = error.match(/\b(4\d{2}|5\d{2})\b/);
      if (match) return Number(match[1]);
    }
    return undefined;
  }

  const err = error as Record<string, unknown>;
  if (typeof err.status === "number") return err.status;
  if (typeof err.statusCode === "number") return err.statusCode;
  if (
    err.response &&
    typeof err.response === "object" &&
    typeof (err.response as Record<string, unknown>).status === "number"
  ) {
    return (err.response as Record<string, unknown>).status as number;
  }

  // Fallback: pull the code out of the error message itself,
  // e.g. an Error whose .message is "API Error: 409".
  // No need to cast err to Error here — err.message already reads fine
  // off Record<string, unknown>, and this also covers real Error
  // instances since Error.message is a string too.
  if (typeof err.message === "string") {
    const match = err.message.match(/\b(4\d{2}|5\d{2})\b/);
    if (match) return Number(match[1]);
  }

  return undefined;
}

function getRawMessage(error: unknown): string | undefined {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return undefined;
}

/**
 * Central error parser. Every page's catch block should funnel through
 * this instead of writing its own status-code checks.
 *
 *   const parsed = parseApiError(error, "Failed to save", MY_DUPLICATE_MAP);
 *   toast.error(parsed.message);
 *   if (parsed.field) setFieldErrors(prev => ({ ...prev, [parsed.field]: parsed.message }));
 *   if (parsed.isAuthError) router.push("/login");
 */
export function parseApiError(
  error: unknown,
  fallback: string,
  duplicateMap?: DuplicateFieldMap
): ParsedApiError {
  const status = getStatusFromError(error);
  const rawMessage = getRawMessage(error);

  // 409 — Conflict / duplicate value. Try to pinpoint which field caused it.
  if (status === 409) {
    if (duplicateMap && rawMessage) {
      const lower = rawMessage.toLowerCase();
      for (const keyword of Object.keys(duplicateMap)) {
        if (lower.includes(keyword.toLowerCase())) {
          const { field, message } = duplicateMap[keyword];
          return { status, message, field };
        }
      }
    }
    return { status, message: STATUS_MESSAGES[409] };
  }

  // 401 — Invalid/expired token. Always use the generic session message,
  // regardless of whatever the backend sent, and flag it for redirect handling.
  if (status === 401) {
    return { status, message: STATUS_MESSAGES[401], isAuthError: true };
  }

  // 404 — Record not found.
  if (status === 404) {
    return { status, message: STATUS_MESSAGES[404] };
  }

  // 400 — Bad request / validation failure. Prefer the backend's message
  // if it gave one, since it may point to the specific bad field.
  if (status === 400) {
    return { status, message: rawMessage || STATUS_MESSAGES[400] };
  }

  // 500 — Internal server error. Never show raw backend/stack messages here.
  if (status === 500) {
    return { status, message: STATUS_MESSAGES[500] };
  }

  // Unknown/no status — fall back to whatever message we could extract.
  return { status, message: rawMessage || fallback };
}

export function isConflictError(error: unknown): boolean {
  return getStatusFromError(error) === 409;
}

export function isAuthError(error: unknown): boolean {
  return getStatusFromError(error) === 401;
}