/**
 * Date and time formatting utilities
 */

/**
 * Format a date string for display
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) return "";

  const defaultOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options
  };

  return new Date(dateString).toLocaleDateString("en-US", defaultOptions);
}

/**
 * Format a time string for display
 */
export function formatTime(timeString, options = {}) {
  if (!timeString) return "";

  const dateStr = timeString.includes("T")
    ? timeString
    : `2000-01-01T${timeString}`;

  const defaultOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options
  };

  return new Date(dateStr).toLocaleTimeString("en-US", defaultOptions);
}

/**
 * Format a datetime string for display
 */
export function formatDateTime(dateTimeString, options = {}) {
  if (!dateTimeString) return "";

  const {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateStyle = "medium",
    timeStyle = "short"
  } = options;

  return new Date(dateTimeString).toLocaleString("en-US", {
    timeZone: timezone,
    dateStyle,
    timeStyle
  });
}

/**
 * Format a timestamp as relative time (e.g., "5m ago", "2h ago", "3d ago")
 */
export function formatTimeAgo(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format date for display in MM/DD/YYYY format
 */
export function formatDateForDisplay(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}

/**
 * Format event date based on event status
 */
export function formatEventDate(event) {
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
    const dateOptions = { month: "short", day: "numeric" };
    const start = new Date(event.earliest_datetime_utc).toLocaleDateString("en-US", dateOptions);
    const end = new Date(event.latest_datetime_utc).toLocaleDateString("en-US", dateOptions);
    return `${start} - ${end}`;
  }

  return "Date TBD";
}

/**
 * Format UTC datetime in user's local timezone
 */
export function formatEventDateTime(utcTimestamp, timezone = null) {
  if (!utcTimestamp) return null;

  const viewerTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  return new Date(utcTimestamp).toLocaleString("en-US", {
    timeZone: viewerTimezone,
    dateStyle: "medium",
    timeStyle: "short"
  });
}

/**
 * Format UTC date only in user's local timezone
 */
export function formatEventDateOnly(utcTimestamp, timezone = null) {
  if (!utcTimestamp) return null;

  const viewerTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  return new Date(utcTimestamp).toLocaleDateString("en-US", {
    timeZone: viewerTimezone,
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

/**
 * Parse time string to Date object for calendar components
 */
export function parseTimeForCalendar(timeString) {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(":");
  return new Date(0, 0, 0, parseInt(hours), parseInt(minutes), 0);
}

/**
 * Extract calendar time bound from UTC timestamp
 */
export function extractCalendarTimeBound(utcTimestamp, fallbackHour) {
  if (utcTimestamp) {
    const localDate = new Date(utcTimestamp);
    return new Date(0, 0, 0, localDate.getHours(), localDate.getMinutes(), 0);
  }

  return parseTimeForCalendar(fallbackHour) || new Date(0, 0, 0, fallbackHour || 8, 0, 0);
}
