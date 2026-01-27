/**
 * Validation utilities
 * Common validation functions and regex patterns
 */

/**
 * Email validation regex pattern
 * Matches standard email format: user@domain.tld
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * URL validation regex pattern
 * Matches http:// or https:// URLs
 */
export const URL_REGEX = /^https?:\/\/.+/;

/**
 * Validate an email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validate a URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is valid
 */
export const validateUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return URL_REGEX.test(url.trim());
};

/**
 * Validate that a required field is not empty
 * @param {string} value - Value to check
 * @returns {boolean} True if value is non-empty
 */
export const validateRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
};

/**
 * Validate a date range (start before end)
 * @param {string} startDate - Start date string (YYYY-MM-DD)
 * @param {string} endDate - End date string (YYYY-MM-DD)
 * @returns {boolean} True if start is before or equal to end
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  return startDate <= endDate;
};
