/**
 * Safe error response helper
 *
 * In production, returns generic error messages to avoid leaking
 * internal details. In development, returns the actual error for debugging.
 */
export function safeErrorMessage(
  error: unknown,
  genericMessage = "Something went wrong"
): string {
  if (process.env.NODE_ENV === "development") {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    if (error && typeof error === "object" && "message" in error) {
      return String((error as { message: unknown }).message);
    }
  }
  return genericMessage;
}

/**
 * Create a safe error response object
 */
export function safeError(
  error: unknown,
  genericMessage = "Something went wrong"
): { error: string } {
  return { error: safeErrorMessage(error, genericMessage) };
}

