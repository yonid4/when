/**
 * Validation utilities
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const URL_REGEX = /^https?:\/\/.+/;

/**
 * Validate an email address
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate a URL
 */
export function validateUrl(url) {
  if (!url || typeof url !== "string") return false;
  return URL_REGEX.test(url.trim());
}

/**
 * Validate that a required field is not empty
 */
export function validateRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

/**
 * Validate a date range (start before or equal to end)
 */
export function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) return false;
  return startDate <= endDate;
}
