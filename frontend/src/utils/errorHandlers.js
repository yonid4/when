/**
 * Error handling utilities
 */

/**
 * Extract a user-friendly error message from an error object.
 * Handles various error formats from axios, fetch, and standard errors.
 */
export function extractErrorMessage(error, defaultMessage = "An error occurred") {
  if (!error) return defaultMessage;

  if (error.response?.data?.error) return error.response.data.error;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  if (typeof error === "string") return error;

  return defaultMessage;
}

/**
 * Check if an error indicates authentication is required (401)
 */
export function isAuthError(error) {
  return error?.response?.status === 401;
}

/**
 * Check if an error indicates forbidden access (403)
 */
export function isForbiddenError(error) {
  return error?.response?.status === 403;
}

/**
 * Check if an error indicates resource not found (404)
 */
export function isNotFoundError(error) {
  return error?.response?.status === 404;
}

/**
 * Check if an error indicates a network problem
 */
export function isNetworkError(error) {
  return !error.response && error.request;
}

/**
 * Check if an error indicates the need to reconnect (e.g., OAuth token expired)
 */
export function needsReconnect(error) {
  const message = extractErrorMessage(error, "");
  return (
    error?.response?.data?.needs_reconnect ||
    message.includes("expired") ||
    message.includes("reconnect")
  );
}

/**
 * Log error with consistent formatting
 */
export function logError(context, error, additionalInfo = {}) {
  console.error(`${context} Error:`, error);
  if (Object.keys(additionalInfo).length > 0) {
    console.error(`${context} Additional info:`, additionalInfo);
  }
}
