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
 * Validate a time range (start before end)
 * @param {string|Date} startTime - Start time
 * @param {string|Date} endTime - End time
 * @returns {boolean} True if start is before end
 */
export const validateTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return false;

  const start = new Date(startTime);
  const end = new Date(endTime);

  return start < end;
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

/**
 * Validate that earliest hour is before latest hour
 * @param {string|number} earliestHour - Earliest hour (0-23)
 * @param {string|number} latestHour - Latest hour (0-23)
 * @returns {boolean} True if earliest is before latest
 */
export const validateHourRange = (earliestHour, latestHour) => {
  const earliest = parseInt(earliestHour);
  const latest = parseInt(latestHour);
  return earliest < latest;
};

/**
 * Validate minimum duration
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @param {number} minMinutes - Minimum duration in minutes
 * @returns {boolean} True if duration meets minimum
 */
export const validateMinDuration = (start, end, minMinutes = 30) => {
  if (!start || !end) return false;
  const durationMs = end.getTime() - start.getTime();
  const durationMins = durationMs / (1000 * 60);
  return durationMins >= minMinutes;
};

/**
 * Validate that two dates are on the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if same day
 */
export const validateSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return date1.toDateString() === date2.toDateString();
};
