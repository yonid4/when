/**
 * Date and time formatting utilities
 * Centralized date formatting functions used across the application
 */

/**
 * Format a date string for display
 * @param {string} dateString - ISO date string
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return "";

  const defaultOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options
  };

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", defaultOptions);
};

/**
 * Format a time string for display
 * @param {string} timeString - Time string (HH:mm or HH:mm:ss format)
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted time string
 */
export const formatTime = (timeString, options = {}) => {
  if (!timeString) return "";

  // If it's just a time string, create a dummy date
  const dateStr = timeString.includes("T")
    ? timeString
    : `2000-01-01T${timeString}`;

  const date = new Date(dateStr);

  const defaultOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options
  };

  return date.toLocaleTimeString("en-US", defaultOptions);
};

/**
 * Format a datetime string for display
 * @param {string} dateTimeString - ISO datetime string
 * @param {Object} options - Options for formatting
 * @param {string} options.timezone - Timezone to display in (default: user's timezone)
 * @param {string} options.dateStyle - Date style: 'full', 'long', 'medium', 'short'
 * @param {string} options.timeStyle - Time style: 'full', 'long', 'medium', 'short'
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (dateTimeString, options = {}) => {
  if (!dateTimeString) return "";

  const {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateStyle = "medium",
    timeStyle = "short"
  } = options;

  const date = new Date(dateTimeString);

  return date.toLocaleString("en-US", {
    timeZone: timezone,
    dateStyle,
    timeStyle
  });
};

/**
 * Format a timestamp as relative time (e.g., "5m ago", "2h ago", "3d ago")
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Relative time string
 */
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/**
 * Format date for display in MM/DD/YYYY format
 * @param {string} dateString - ISO date string
 * @returns {string} Date in MM/DD/YYYY format
 */
export const formatDateForDisplay = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};

/**
 * Format event date based on event status
 * @param {Object} event - Event object with status and date fields
 * @returns {string} Formatted date string
 */
export const formatEventDate = (event) => {
  if (!event) return "Date TBD";

  if (event.status === "finalized" && event.finalized_start_time_utc) {
    return new Date(event.finalized_start_time_utc).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  if (event.earliest_datetime_utc && event.latest_datetime_utc) {
    const start = new Date(event.earliest_datetime_utc).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
    const end = new Date(event.latest_datetime_utc).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
    return `${start} - ${end}`;
  }

  return "Date TBD";
};

/**
 * Format UTC datetime in user's local timezone
 * @param {string} utcTimestamp - UTC timestamp
 * @param {string} timezone - Optional timezone (defaults to user's timezone)
 * @returns {string|null} Formatted datetime string
 */
export const formatEventDateTime = (utcTimestamp, timezone = null) => {
  if (!utcTimestamp) return null;

  const date = new Date(utcTimestamp);
  const viewerTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  return date.toLocaleString("en-US", {
    timeZone: viewerTimezone,
    dateStyle: "medium",
    timeStyle: "short"
  });
};

/**
 * Format UTC date only in user's local timezone
 * @param {string} utcTimestamp - UTC timestamp
 * @param {string} timezone - Optional timezone (defaults to user's timezone)
 * @returns {string|null} Formatted date string
 */
export const formatEventDateOnly = (utcTimestamp, timezone = null) => {
  if (!utcTimestamp) return null;

  const date = new Date(utcTimestamp);
  const viewerTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  return date.toLocaleDateString("en-US", {
    timeZone: viewerTimezone,
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

/**
 * Parse time string to Date object for calendar components
 * @param {string} timeString - Time string in HH:mm format
 * @returns {Date|null} Date object with time set
 */
export const parseTimeForCalendar = (timeString) => {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(":");
  return new Date(0, 0, 0, parseInt(hours), parseInt(minutes), 0);
};

/**
 * Extract calendar time bound from UTC timestamp
 * @param {string} utcTimestamp - UTC timestamp
 * @param {number|string} fallbackHour - Fallback hour if timestamp is invalid
 * @returns {Date} Date object for calendar time bound
 */
export const extractCalendarTimeBound = (utcTimestamp, fallbackHour) => {
  if (utcTimestamp) {
    const localDate = new Date(utcTimestamp);
    return new Date(0, 0, 0, localDate.getHours(), localDate.getMinutes(), 0);
  }

  // Fallback to old format or default
  const fallback = parseTimeForCalendar(fallbackHour) ||
    new Date(0, 0, 0, fallbackHour || 8, 0, 0);
  return fallback;
};
