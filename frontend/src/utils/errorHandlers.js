/**
 * Error handling utilities
 * Common error extraction and handling functions
 */

/**
 * Extract a user-friendly error message from an error object
 * Handles various error formats from axios, fetch, and standard errors
 *
 * @param {Error|Object} error - Error object to extract message from
 * @param {string} defaultMessage - Default message if no specific message found
 * @returns {string} User-friendly error message
 *
 * @example
 * try {
 *   await api.create(data);
 * } catch (error) {
 *   const message = extractErrorMessage(error, "Failed to create item");
 *   toast({ description: message, status: "error" });
 * }
 */
export const extractErrorMessage = (error, defaultMessage = "An error occurred") => {
  // Handle null/undefined errors
  if (!error) return defaultMessage;

  // Check for axios response error format
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Check for standard Error message
  if (error.message) {
    return error.message;
  }

  // Check if error is a string
  if (typeof error === "string") {
    return error;
  }

  return defaultMessage;
};

/**
 * Check if an error indicates authentication is required
 * @param {Error|Object} error - Error to check
 * @returns {boolean} True if auth error (401)
 */
export const isAuthError = (error) => {
  return error?.response?.status === 401;
};

/**
 * Check if an error indicates forbidden access
 * @param {Error|Object} error - Error to check
 * @returns {boolean} True if forbidden (403)
 */
export const isForbiddenError = (error) => {
  return error?.response?.status === 403;
};

/**
 * Check if an error indicates resource not found
 * @param {Error|Object} error - Error to check
 * @returns {boolean} True if not found (404)
 */
export const isNotFoundError = (error) => {
  return error?.response?.status === 404;
};

/**
 * Check if an error indicates a network problem
 * @param {Error|Object} error - Error to check
 * @returns {boolean} True if network error
 */
export const isNetworkError = (error) => {
  return !error.response && error.request;
};

/**
 * Check if an error indicates the need to reconnect (e.g., OAuth token expired)
 * @param {Error|Object} error - Error to check
 * @returns {boolean} True if reconnection is needed
 */
export const needsReconnect = (error) => {
  const message = extractErrorMessage(error, "");
  return (
    error?.response?.data?.needs_reconnect ||
    message.includes("expired") ||
    message.includes("reconnect")
  );
};

/**
 * Log error with consistent formatting
 * @param {string} context - Context where error occurred (e.g., "[INVITE]")
 * @param {Error|Object} error - Error to log
 * @param {Object} additionalInfo - Additional info to log
 */
export const logError = (context, error, additionalInfo = {}) => {
  console.error(`${context} Error:`, error);
  if (Object.keys(additionalInfo).length > 0) {
    console.error(`${context} Additional info:`, additionalInfo);
  }
};
