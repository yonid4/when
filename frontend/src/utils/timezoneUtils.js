/**
 * Timezone utility functions for converting between UTC and local time
 * Following .aimrules guidelines: store in UTC, display in local timezone
 */

/**
 * Get user's current timezone (IANA format)
 * @returns {string} - IANA timezone identifier (e.g., "America/New_York")
 */
export const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Convert UTC datetime string to local datetime-local input format
 * @param {string} utcDatetimeStr - ISO datetime string in UTC (e.g., "2025-12-24T14:00:00Z")
 * @returns {string} - Local datetime in format "YYYY-MM-DDTHH:mm" for datetime-local input
 */
export const utcToLocalDatetimeInput = (utcDatetimeStr) => {
  if (!utcDatetimeStr) return "";

  const date = new Date(utcDatetimeStr);
  // Get local datetime in ISO format and remove seconds/milliseconds
  const localIso = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  return localIso;
};

/**
 * Convert local datetime-local input to UTC ISO string
 * @param {string} localDatetimeStr - Local datetime from input (e.g., "2025-12-24T14:00")
 * @returns {string} - UTC ISO string (e.g., "2025-12-24T19:00:00Z")
 */
export const localDatetimeInputToUtc = (localDatetimeStr) => {
  if (!localDatetimeStr) return null;

  const date = new Date(localDatetimeStr);
  return date.toISOString();
};

/**
 * Convert separate date/time to UTC (for old format support)
 * @param {string} dateStr - Date string (e.g., "2025-12-24")
 * @param {string} timeStr - Time string (e.g., "14:00" or "14:00:00")
 * @returns {string} - UTC ISO string
 */
export const dateTimeToUtc = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;

  const localDatetime = `${dateStr}T${timeStr}`;
  return localDatetimeInputToUtc(localDatetime);
};

/**
 * Format timezone for display
 * @param {string} timezone - IANA timezone identifier
 * @returns {string} - Formatted timezone (e.g., "EST", "PST")
 */
export const formatTimezone = (timezone) => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short"
    });
    const parts = formatter.formatToParts(now);
    const tz = parts.find(p => p.type === "timeZoneName")?.value;
    return tz || timezone;
  } catch {
    return timezone;
  }
};
